# API Integration Changelog

## 2026-02-04: Backend API 연동 수정

### 개요
Customer Frontend를 Backend API 스펙에 맞춰 전면 수정하여 실제 연동 가능하도록 개선

### 수정된 파일

#### 1. `src/lib/axios.ts`
**변경 사항**: baseURL에 `/api/v1` prefix 추가
```typescript
// Before
baseURL: import.meta.env.VITE_API_URL,

// After
baseURL: import.meta.env.VITE_API_URL + '/api/v1',
```

#### 2. `src/api/authService.ts`
**변경 사항**:
- 로그인 엔드포인트 경로 수정: `/api/v1/auth/table/login` → `/auth/table/login`
- 요청 데이터 타입 변환: string → int
- 응답 데이터 매핑 추가
- extendSession, logout 함수 클라이언트 처리로 변경

```typescript
// 요청 변환
{
  store_id: parseInt(credentials.storeId),
  table_number: parseInt(credentials.tableNumber),
  table_password: credentials.tablePassword,
}

// 응답 변환
{
  token: data.access_token,
  table_id: data.table_id.toString(),
  table_name: `테이블 ${data.table_number}`,
  store_id: data.store_id.toString(),
  store_name: data.store_name,
  session_id: data.session_id,
  expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
}
```

#### 3. `src/api/menuService.ts`
**변경 사항**:
- 메뉴 조회 엔드포인트 경로 수정: `/api/v1/customer/menus` → `/customer/menus`
- 응답 구조 변경: 카테고리 배열에서 메뉴 추출
- fetchCategories 응답 매핑 추가
- fetchMenusByIds 클라이언트 필터링으로 변경

```typescript
// 메뉴 추출 로직
const allMenus: MenuItem[] = [];
response.data.categories.forEach((category: any) => {
  category.menus.forEach((menu: any) => {
    allMenus.push(apiMenuToMenuItem(menu, category));
  });
});
```

#### 4. `src/api/orderService.ts`
**변경 사항**:
- 주문 생성 엔드포인트 경로 수정: `/api/v1/customer/orders` → `/customer/orders`
- 요청 데이터 구조 변경: unit_price 제거
- 주문 조회 엔드포인트 경로 수정
- fetchOrderById 클라이언트 필터링으로 변경

```typescript
// 주문 생성 요청
{
  items: input.items.map(item => ({
    menu_id: parseInt(item.menuId),
    quantity: item.quantity,
    // unit_price 제거
  })),
}
```

#### 5. `src/transformers/entityTransformers.ts`
**변경 사항**:
- apiMenuToMenuItem: 카테고리 정보 파라미터 추가, 필드명 매핑
- apiOrderToOrder: 상태 매핑, 필드명 변환, 타입 변환

```typescript
// 메뉴 변환
export function apiMenuToMenuItem(apiMenu: any, category?: any): MenuItem {
  return {
    id: apiMenu.menu_id.toString(),
    name: apiMenu.menu_name,
    imageUrl: apiMenu.image_base64,
    categoryId: category.category_id.toString(),
    categoryName: category.category_name,
    isAvailable: true, // 기본값
    ...
  };
}

// 주문 변환
export function apiOrderToOrder(apiOrder: any): Order {
  const statusMap = {
    '대기중': 'pending',
    '준비중': 'preparing',
    '완료': 'completed',
  };
  
  return {
    orderId: apiOrder.order_id.toString(),
    status: statusMap[apiOrder.status],
    createdAt: apiOrder.order_time,
    items: apiOrder.items.map(item => ({
      menuId: item.menu_id.toString(),
      name: item.menu_name,
      ...
    })),
    ...
  };
}
```

### 주요 변경 사항 요약

#### 1. 엔드포인트 경로
- axios baseURL에 `/api/v1` 추가로 중복 제거
- 모든 API 호출 경로 단순화

#### 2. 데이터 타입 변환
| 항목 | Frontend | Backend | 변환 |
|------|----------|---------|------|
| Store ID | string | int | parseInt() |
| Table Number | string | int | parseInt() |
| Table ID | string | int | parseInt() / toString() |
| Menu ID | string | int | parseInt() / toString() |
| Order ID | string | int | toString() |

#### 3. 필드명 매핑
| Backend | Frontend |
|---------|----------|
| access_token | token |
| menu_id | id |
| menu_name | name |
| image_base64 | imageUrl |
| order_time | createdAt |
| unit_price | price |

#### 4. 상태 매핑
| Backend (한글) | Frontend (영문) |
|---------------|----------------|
| 대기중 | pending |
| 준비중 | preparing |
| 완료 | completed |

#### 5. 미구현 엔드포인트 처리
| 함수 | 처리 방법 |
|------|----------|
| extendSession | 클라이언트에서 기본값 반환 (16시간) |
| logout | 클라이언트에서만 처리 |
| fetchMenusByIds | 전체 메뉴에서 클라이언트 필터링 |
| fetchOrderById | 전체 주문에서 클라이언트 필터링 |

### 테스트 방법

```bash
# Backend 실행
cd aidlc-0204/backend
python run.py

# Frontend 실행
cd aidlc-0204/customer-frontend
npm run dev

# 브라우저에서 테스트
# http://localhost:5173
```

### 호환성

- Backend API Version: 1.0.0
- Frontend Version: 1.0.0
- Node.js: >= 18.0.0
- Python: >= 3.11

### 알려진 제한사항

1. **세션 연장**: Backend에 API가 없어 클라이언트에서만 처리
2. **로그아웃**: Backend에 API가 없어 클라이언트에서만 처리
3. **개별 메뉴 조회**: 전체 메뉴를 가져와서 필터링 (성능 영향 가능)
4. **개별 주문 조회**: 전체 주문을 가져와서 필터링 (성능 영향 가능)
5. **메뉴 가용성**: Backend에서 제공하지 않아 항상 true

### 향후 개선 사항

1. Backend에 개별 조회 API 추가 (성능 개선)
2. Backend에 세션 연장/로그아웃 API 추가
3. Backend에 메뉴 가용성 필드 추가
4. 실시간 주문 상태 업데이트 (SSE) 연동
5. 에러 처리 개선 및 재시도 로직 추가

### 참고 문서

- [API Integration Guide](./API_INTEGRATION.md)
- [Integration Test Checklist](../INTEGRATION_TEST_CHECKLIST.md)
- [Backend API Specifications](../aidlc-docs/construction/backend-api/functional-design/api-specifications.md)
