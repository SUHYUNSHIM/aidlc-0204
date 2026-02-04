# Customer Frontend - Backend API 연동 가이드

## 수정 완료 사항

### 1. API 엔드포인트 경로 수정
- **변경 전**: `/api/v1/auth/table/login`, `/api/v1/customer/menus`, etc.
- **변경 후**: `/auth/table/login`, `/customer/menus`, etc.
- **이유**: axios baseURL에 `/api/v1`이 포함되어 중복 제거

### 2. 데이터 타입 변환

#### 로그인 요청 (authService.ts)
```typescript
// Frontend → Backend
{
  store_id: parseInt(credentials.storeId),      // string → int
  table_number: parseInt(credentials.tableNumber), // string → int
  table_password: credentials.tablePassword
}
```

#### 로그인 응답 변환
```typescript
// Backend → Frontend
{
  token: data.access_token,
  table_id: data.table_id.toString(),           // int → string
  table_name: `테이블 ${data.table_number}`,     // 생성
  store_id: data.store_id.toString(),           // int → string
  store_name: data.store_name,
  session_id: data.session_id,
  expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString() // 계산
}
```

#### 메뉴 응답 변환 (entityTransformers.ts)
```typescript
// Backend → Frontend
{
  id: apiMenu.menu_id.toString(),               // int → string
  name: apiMenu.menu_name,
  price: apiMenu.price,
  description: apiMenu.description || '',
  imageUrl: apiMenu.image_base64,               // 필드명 변경
  categoryId: category.category_id.toString(),  // int → string
  categoryName: category.category_name,
  displayOrder: apiMenu.display_order,
  isAvailable: true                             // 기본값 (Backend 미제공)
}
```

#### 주문 생성 요청 (orderService.ts)
```typescript
// Frontend → Backend (불필요한 필드 제거)
{
  items: input.items.map(item => ({
    menu_id: parseInt(item.menuId),             // string → int
    quantity: item.quantity
    // unit_price 제거 (Backend에서 자동 계산)
  }))
}
```

#### 주문 응답 변환 (entityTransformers.ts)
```typescript
// Backend → Frontend
{
  orderId: apiOrder.order_id.toString(),        // int → string
  tableId: apiOrder.table_id.toString(),        // int → string
  sessionId: apiOrder.session_id,
  items: apiOrder.items.map(item => ({
    menuId: item.menu_id.toString(),            // int → string
    name: item.menu_name,
    price: item.unit_price,
    quantity: item.quantity,
    subtotal: item.subtotal
  })),
  totalAmount: apiOrder.total_amount,
  status: statusMap[apiOrder.status],           // "대기중" → "pending"
  createdAt: apiOrder.order_time,               // 필드명 변경
  estimatedPrepTime: 15                         // 기본값 (Backend 미제공)
}
```

### 3. 상태 매핑

Backend와 Frontend의 주문 상태 매핑:
```typescript
const statusMap = {
  '대기중': 'pending',
  '준비중': 'preparing',
  '완료': 'completed'
};
```

### 4. 구현되지 않은 엔드포인트 처리

#### extendSession
- Backend에 세션 연장 API 없음
- JWT 토큰이 16시간 유효하므로 클라이언트에서 기본값 반환

#### logout
- Backend에 로그아웃 API 없음
- 클라이언트에서 로컬 스토리지만 정리

#### fetchMenusByIds
- Backend에 ID별 조회 API 없음
- 전체 메뉴를 가져와서 클라이언트에서 필터링

#### fetchOrderById
- Backend에 개별 주문 조회 API 없음
- 전체 주문 목록에서 찾기

## API 엔드포인트 매핑

### 인증
| Frontend Method | HTTP Method | Backend Endpoint | 상태 |
|----------------|-------------|------------------|------|
| login() | POST | /auth/table/login | ✅ 연동 완료 |
| extendSession() | - | - | ⚠️ 클라이언트 처리 |
| logout() | - | - | ⚠️ 클라이언트 처리 |

### 메뉴
| Frontend Method | HTTP Method | Backend Endpoint | 상태 |
|----------------|-------------|------------------|------|
| fetchMenus() | GET | /customer/menus | ✅ 연동 완료 |
| fetchCategories() | GET | /customer/menus | ✅ 연동 완료 |
| fetchMenusByIds() | - | - | ⚠️ 클라이언트 필터링 |

### 주문
| Frontend Method | HTTP Method | Backend Endpoint | 상태 |
|----------------|-------------|------------------|------|
| createOrder() | POST | /customer/orders | ✅ 연동 완료 |
| fetchOrders() | GET | /customer/orders | ✅ 연동 완료 |
| fetchOrderById() | - | - | ⚠️ 클라이언트 필터링 |

## 테스트 방법

### 1. Backend 실행
```bash
cd aidlc-0204/backend
python run.py
```

### 2. Frontend 실행
```bash
cd aidlc-0204/customer-frontend
npm run dev
```

### 3. 테스트 시나리오

#### 로그인 테스트
```
URL: http://localhost:5173/login
입력:
- Store ID: 1
- Table Number: 1
- Password: 1234

예상 결과: 로그인 성공 후 메뉴 페이지로 이동
```

#### 메뉴 조회 테스트
```
로그인 후 자동으로 메뉴 목록 표시
예상 결과: 카테고리별 메뉴 표시
```

#### 주문 생성 테스트
```
1. 메뉴 선택 → 장바구니 추가
2. 장바구니 페이지 이동
3. 주문하기 버튼 클릭

예상 결과: 주문 생성 후 주문 확인 페이지로 이동
```

#### 주문 내역 조회 테스트
```
주문 내역 페이지 이동
예상 결과: 현재 세션의 모든 주문 표시
```

## 환경 변수 설정

### 실제 API 사용
```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=false
```

### Mock 데이터 사용 (Backend 없이 테스트)
```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=true
```

## 주의사항

1. **ID 타입**: Frontend는 string, Backend는 int 사용
   - 요청 시: `parseInt()` 사용
   - 응답 시: `.toString()` 사용

2. **필드명 차이**: snake_case (Backend) ↔ camelCase (Frontend)
   - Transformer에서 자동 변환

3. **상태값**: 한글 (Backend) ↔ 영문 (Frontend)
   - statusMap으로 매핑

4. **이미지**: Backend는 `image_base64` 필드로 Base64 인코딩된 이미지 제공

5. **JWT 토큰**: 16시간 유효, Authorization 헤더에 자동 포함

## 트러블슈팅

### 401 Unauthorized
- JWT 토큰 만료 또는 유효하지 않음
- 자동으로 로그인 페이지로 리다이렉트

### CORS 에러
- Backend에서 CORS 설정 확인
- `app/main.py`의 `allow_origins` 설정 확인

### 네트워크 에러
- Backend 서버 실행 상태 확인
- `VITE_API_URL` 환경 변수 확인

### 데이터 형식 에러
- Transformer 함수 확인
- Backend 응답 구조 확인
