# Customer Frontend - Backend API 통합 테스트 체크리스트

## 수정 완료 항목 ✅

### 1. API 엔드포인트 경로
- [x] axios baseURL에 `/api/v1` 추가
- [x] authService: `/auth/table/login`
- [x] menuService: `/customer/menus`
- [x] orderService: `/customer/orders`

### 2. 데이터 타입 변환
- [x] 로그인 요청: storeId, tableNumber를 int로 변환
- [x] 로그인 응답: table_id, store_id를 string으로 변환
- [x] 메뉴 응답: menu_id를 string으로 변환
- [x] 주문 요청: menuId를 int로 변환
- [x] 주문 응답: order_id, table_id를 string으로 변환

### 3. 필드명 매핑
- [x] access_token → token
- [x] menu_name → name
- [x] image_base64 → imageUrl
- [x] order_time → createdAt
- [x] menu_name → name (주문 아이템)

### 4. 상태 매핑
- [x] "대기중" → "pending"
- [x] "준비중" → "preparing"
- [x] "완료" → "completed"

### 5. Transformer 함수
- [x] apiMenuToMenuItem: 카테고리 정보 포함
- [x] apiOrderToOrder: 상태 매핑 및 필드 변환
- [x] 주문 아이템 변환 로직

### 6. 미구현 엔드포인트 처리
- [x] extendSession: 클라이언트에서 기본값 반환
- [x] logout: 클라이언트에서만 처리
- [x] fetchMenusByIds: 클라이언트 필터링
- [x] fetchOrderById: 클라이언트 필터링

## 테스트 시나리오

### 준비 사항
```bash
# 1. Backend 실행
cd aidlc-0204/backend
python run.py

# 2. Frontend 실행 (새 터미널)
cd aidlc-0204/customer-frontend
npm run dev

# 3. 브라우저 개발자 도구 열기 (F12)
```

### 시나리오 1: 로그인 테스트
- [ ] URL: http://localhost:5173/login 접속
- [ ] Store ID: `1` 입력
- [ ] Table Number: `1` 입력
- [ ] Password: `1234` 입력
- [ ] "로그인" 버튼 클릭
- [ ] **예상 결과**:
  - [ ] 로그인 성공 메시지
  - [ ] 메뉴 페이지로 자동 이동
  - [ ] localStorage에 토큰 저장 확인
  - [ ] Network 탭에서 POST /api/v1/auth/table/login 200 OK

### 시나리오 2: 메뉴 조회 테스트
- [ ] 로그인 후 메뉴 페이지 확인
- [ ] **예상 결과**:
  - [ ] 카테고리별 메뉴 표시
  - [ ] 메뉴 이미지 표시 (Base64)
  - [ ] 메뉴 가격 표시
  - [ ] Network 탭에서 GET /api/v1/customer/menus 200 OK
  - [ ] Authorization 헤더에 Bearer 토큰 포함 확인

### 시나리오 3: 장바구니 추가 테스트
- [ ] 메뉴 아이템 선택
- [ ] "장바구니에 추가" 버튼 클릭
- [ ] **예상 결과**:
  - [ ] 장바구니 아이콘에 개수 표시
  - [ ] 성공 메시지 표시
  - [ ] localStorage에 장바구니 저장 확인

### 시나리오 4: 주문 생성 테스트
- [ ] 장바구니 페이지 이동
- [ ] 주문 내역 확인
- [ ] "주문하기" 버튼 클릭
- [ ] **예상 결과**:
  - [ ] 주문 생성 성공 메시지
  - [ ] 주문 확인 페이지로 이동
  - [ ] Network 탭에서 POST /api/v1/customer/orders 201 Created
  - [ ] 응답 데이터 구조 확인:
    ```json
    {
      "order_id": 1,
      "table_id": 1,
      "table_number": 1,
      "session_id": "...",
      "total_amount": 9000,
      "status": "대기중",
      "order_time": "...",
      "items": [...]
    }
    ```

### 시나리오 5: 주문 내역 조회 테스트
- [ ] 주문 내역 페이지 이동
- [ ] **예상 결과**:
  - [ ] 현재 세션의 모든 주문 표시
  - [ ] 주문 상태 표시 (대기중/준비중/완료)
  - [ ] 주문 시간 표시
  - [ ] 주문 금액 표시
  - [ ] Network 탭에서 GET /api/v1/customer/orders 200 OK

### 시나리오 6: 에러 처리 테스트
- [ ] 잘못된 비밀번호로 로그인 시도
- [ ] **예상 결과**: 에러 메시지 표시
- [ ] 토큰 만료 후 API 호출
- [ ] **예상 결과**: 로그인 페이지로 리다이렉트
- [ ] 네트워크 끊김 시뮬레이션
- [ ] **예상 결과**: 에러 메시지 표시

## 데이터 검증 포인트

### 로그인 응답 검증
```javascript
// Console에서 확인
const session = JSON.parse(localStorage.getItem('customerSession'));
console.log('Session:', session);

// 확인 항목:
// - token: JWT 토큰 존재
// - table_id: string 타입
// - store_id: string 타입
// - session_id: UUID 형식
// - expires_at: ISO 8601 날짜 형식
```

### 메뉴 데이터 검증
```javascript
// Network 탭에서 응답 확인
// Backend 응답:
{
  "store_id": 1,
  "categories": [
    {
      "category_id": 1,
      "category_name": "커피",
      "menus": [
        {
          "menu_id": 1,
          "menu_name": "아메리카노",
          "price": 4500,
          "image_base64": "data:image/jpeg;base64,...",
          ...
        }
      ]
    }
  ]
}

// Frontend 변환 후:
{
  "id": "1",
  "name": "아메리카노",
  "price": 4500,
  "categoryId": "1",
  "categoryName": "커피",
  "imageUrl": "data:image/jpeg;base64,...",
  ...
}
```

### 주문 데이터 검증
```javascript
// 주문 생성 요청
{
  "items": [
    {
      "menu_id": 1,      // int
      "quantity": 2
    }
  ]
}

// 주문 생성 응답
{
  "order_id": 1,
  "status": "대기중",   // 한글
  "order_time": "...",
  ...
}

// Frontend 변환 후
{
  "orderId": "1",      // string
  "status": "pending", // 영문
  "createdAt": "...",
  ...
}
```

## 성능 체크

- [ ] 메뉴 조회 응답 시간 < 1초
- [ ] 주문 생성 응답 시간 < 2초
- [ ] 이미지 로딩 시간 확인
- [ ] 메모리 누수 확인 (장시간 사용)

## 브라우저 호환성

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## 모바일 테스트

- [ ] 반응형 레이아웃 확인
- [ ] 터치 이벤트 동작 확인
- [ ] 모바일 네트워크 환경 테스트

## 문제 발생 시 체크리스트

### Backend 연결 실패
1. Backend 서버 실행 상태 확인: `http://localhost:8000/docs`
2. CORS 설정 확인: `backend/app/core/config.py`
3. 환경 변수 확인: `customer-frontend/.env`

### 인증 실패
1. JWT 토큰 확인: localStorage의 customerSession
2. Authorization 헤더 확인: Network 탭
3. 토큰 만료 시간 확인: expires_at

### 데이터 형식 오류
1. Transformer 함수 확인
2. Backend 응답 구조 확인: Network 탭
3. Console 에러 메시지 확인

### 이미지 표시 안됨
1. Backend에서 image_base64 필드 확인
2. Base64 형식 확인: `data:image/jpeg;base64,...`
3. 이미지 크기 확인 (너무 크면 로딩 느림)

## 추가 개선 사항 (선택)

- [ ] 주문 상태 실시간 업데이트 (SSE 연동)
- [ ] 오프라인 모드 지원
- [ ] 주문 취소 기능
- [ ] 메뉴 검색 기능
- [ ] 주문 알림 기능

## 완료 확인

모든 테스트 시나리오가 통과하면:
- [ ] 통합 테스트 완료 보고서 작성
- [ ] 발견된 버그 이슈 등록
- [ ] 성능 개선 사항 문서화
- [ ] 배포 준비 완료
