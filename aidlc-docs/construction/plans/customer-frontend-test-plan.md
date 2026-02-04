# Test Plan for Customer Frontend

## 유닛 개요
- **Unit**: customer-frontend
- **Stories**: US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008
- **Requirements**: REQ-001 ~ REQ-008 (고객 기능)

---

## Utils Layer Tests

### auth.ts - saveAuthToken()
- **TC-CF-001**: 유효한 토큰 저장
  - Given: 유효한 JWT 토큰
  - When: saveAuthToken() 호출
  - Then: localStorage에 암호화되어 저장됨
  - Story: US-001
  - Status: ⬜ Not Started

### auth.ts - getAuthToken()
- **TC-CF-002**: 저장된 토큰 조회
  - Given: localStorage에 토큰이 저장되어 있음
  - When: getAuthToken() 호출
  - Then: 복호화된 토큰 반환
  - Story: US-001
  - Status: ⬜ Not Started

- **TC-CF-003**: 토큰이 없을 때 조회
  - Given: localStorage에 토큰이 없음
  - When: getAuthToken() 호출
  - Then: null 반환
  - Story: US-001
  - Status: ⬜ Not Started

### auth.ts - validateSession()
- **TC-CF-004**: 유효한 세션 검증
  - Given: 만료되지 않은 세션
  - When: validateSession() 호출
  - Then: true 반환
  - Story: US-001
  - Status: ⬜ Not Started

- **TC-CF-005**: 만료된 세션 검증
  - Given: 만료된 세션 (expiresAt < 현재 시각)
  - When: validateSession() 호출
  - Then: false 반환
  - Story: US-001
  - Status: ⬜ Not Started

### auth.ts - autoLogin()
- **TC-CF-006**: 자동 로그인 성공
  - Given: localStorage에 유효한 토큰과 세션 존재
  - When: autoLogin() 호출
  - Then: CustomerSession 반환
  - Story: US-001
  - Status: ⬜ Not Started

- **TC-CF-007**: 자동 로그인 실패 (토큰 없음)
  - Given: localStorage에 토큰 없음
  - When: autoLogin() 호출
  - Then: null 반환
  - Story: US-001
  - Status: ⬜ Not Started

### auth.ts - manualLogin()
- **TC-CF-008**: 수동 로그인 성공
  - Given: 유효한 credentials (storeId, tableNumber, tablePassword)
  - When: manualLogin() 호출
  - Then: CustomerSession 반환 및 localStorage 저장
  - Story: US-001
  - Status: ⬜ Not Started

- **TC-CF-009**: 수동 로그인 실패 (잘못된 비밀번호)
  - Given: 잘못된 tablePassword
  - When: manualLogin() 호출
  - Then: Error throw
  - Story: US-001
  - Status: ⬜ Not Started

---

## Services Layer Tests

### cartService.ts - addToCartLogic()
- **TC-CF-010**: 새 메뉴 추가
  - Given: 빈 장바구니
  - When: addToCartLogic(cart, menuItem, 1) 호출
  - Then: 장바구니에 항목 1개 추가됨
  - Story: US-004
  - Status: ⬜ Not Started

- **TC-CF-011**: 기존 메뉴 수량 증가
  - Given: 장바구니에 메뉴 A가 2개 있음
  - When: addToCartLogic(cart, menuItem A, 1) 호출
  - Then: 메뉴 A 수량이 3개로 증가
  - Story: US-004
  - Status: ⬜ Not Started

- **TC-CF-012**: 품절 메뉴 추가 시도
  - Given: isAvailable = false인 메뉴
  - When: addToCartLogic(cart, menuItem, 1) 호출
  - Then: Error throw ("품절된 메뉴입니다")
  - Story: US-004
  - Status: ⬜ Not Started

- **TC-CF-013**: 최대 수량 초과 시도
  - Given: 장바구니에 메뉴 A가 10개 있음
  - When: addToCartLogic(cart, menuItem A, 1) 호출
  - Then: Error throw ("최대 수량은 10개입니다")
  - Story: US-004
  - Status: ⬜ Not Started

### cartService.ts - updateQuantityLogic()
- **TC-CF-014**: 수량 증가
  - Given: 장바구니에 메뉴 A가 2개 있음
  - When: updateQuantityLogic(cart, menuId, +1) 호출
  - Then: 메뉴 A 수량이 3개로 증가
  - Story: US-005
  - Status: ⬜ Not Started

- **TC-CF-015**: 수량 감소
  - Given: 장바구니에 메뉴 A가 2개 있음
  - When: updateQuantityLogic(cart, menuId, -1) 호출
  - Then: 메뉴 A 수량이 1개로 감소
  - Story: US-005
  - Status: ⬜ Not Started

- **TC-CF-016**: 수량 0으로 감소 시 항목 제거
  - Given: 장바구니에 메뉴 A가 1개 있음
  - When: updateQuantityLogic(cart, menuId, -1) 호출
  - Then: 메뉴 A가 장바구니에서 제거됨
  - Story: US-005
  - Status: ⬜ Not Started

### cartService.ts - removeFromCartLogic()
- **TC-CF-017**: 항목 제거
  - Given: 장바구니에 메뉴 A, B가 있음
  - When: removeFromCartLogic(cart, menuId A) 호출
  - Then: 메뉴 A만 제거되고 B는 남음
  - Story: US-005
  - Status: ⬜ Not Started

### cartService.ts - calculateCartTotals()
- **TC-CF-018**: 총액 계산
  - Given: 장바구니에 메뉴 A (5000원 x 2개), 메뉴 B (3000원 x 1개)
  - When: calculateCartTotals(cart) 호출
  - Then: { totalItems: 3, totalAmount: 13000 } 반환
  - Story: US-005
  - Status: ⬜ Not Started

### cartService.ts - saveCartToLocalStorage()
- **TC-CF-019**: 장바구니 저장
  - Given: Cart 객체
  - When: saveCartToLocalStorage(cart) 호출
  - Then: localStorage에 'customer_cart' 키로 저장됨
  - Story: US-006
  - Status: ⬜ Not Started

- **TC-CF-020**: 용량 초과 시 가장 오래된 항목 제거
  - Given: localStorage 용량 초과 상황
  - When: saveCartToLocalStorage(cart) 호출
  - Then: 가장 오래된 항목 제거 후 저장 재시도
  - Story: US-006
  - Status: ⬜ Not Started

### cartService.ts - loadCartFromLocalStorage()
- **TC-CF-021**: 장바구니 복원
  - Given: localStorage에 장바구니 데이터 존재
  - When: loadCartFromLocalStorage() 호출
  - Then: Cart 객체 반환
  - Story: US-006
  - Status: ⬜ Not Started

- **TC-CF-022**: 장바구니 없을 때 복원
  - Given: localStorage에 장바구니 데이터 없음
  - When: loadCartFromLocalStorage() 호출
  - Then: null 반환
  - Story: US-006
  - Status: ⬜ Not Started

### orderService.ts - validateOrderSubmission()
- **TC-CF-023**: 유효한 주문 검증
  - Given: 비어있지 않은 장바구니, 유효한 세션
  - When: validateOrderSubmission(cart, session) 호출
  - Then: { valid: true } 반환
  - Story: US-007
  - Status: ⬜ Not Started

- **TC-CF-024**: 빈 장바구니 검증
  - Given: 빈 장바구니
  - When: validateOrderSubmission(cart, session) 호출
  - Then: { valid: false, error: "장바구니가 비어있습니다" } 반환
  - Story: US-007
  - Status: ⬜ Not Started

- **TC-CF-025**: 만료된 세션 검증
  - Given: 만료된 세션
  - When: validateOrderSubmission(cart, session) 호출
  - Then: { valid: false, error: "세션이 만료되었습니다" } 반환
  - Story: US-007
  - Status: ⬜ Not Started

### orderService.ts - prepareOrderItems()
- **TC-CF-026**: OrderItem 생성 (현재 가격 사용)
  - Given: 장바구니 항목 (가격 5000원), 현재 메뉴 가격 5500원
  - When: prepareOrderItems(cart, currentMenus) 호출
  - Then: OrderItem의 price가 5500원 (현재 가격)
  - Story: US-007
  - Status: ⬜ Not Started

---

## API Layer Tests

### menuService.ts - fetchMenus()
- **TC-CF-027**: 메뉴 조회 성공
  - Given: 유효한 storeId
  - When: fetchMenus(storeId) 호출
  - Then: MenuItem[] 반환
  - Story: US-002
  - Status: ⬜ Not Started

- **TC-CF-028**: 메뉴 조회 실패 (네트워크 에러)
  - Given: 네트워크 연결 끊김
  - When: fetchMenus(storeId) 호출
  - Then: Error throw
  - Story: US-002
  - Status: ⬜ Not Started

### orderService.ts - createOrder()
- **TC-CF-029**: 주문 생성 성공
  - Given: 유효한 CreateOrderInput
  - When: createOrder(input) 호출
  - Then: Order 객체 반환
  - Story: US-007
  - Status: ⬜ Not Started

- **TC-CF-030**: 주문 생성 실패 (인증 에러)
  - Given: 만료된 authToken
  - When: createOrder(input) 호출
  - Then: Error throw (401 Unauthorized)
  - Story: US-007
  - Status: ⬜ Not Started

### orderService.ts - fetchOrders()
- **TC-CF-031**: 주문 내역 조회 성공
  - Given: 유효한 sessionId
  - When: fetchOrders(sessionId) 호출
  - Then: Order[] 반환
  - Story: US-008
  - Status: ⬜ Not Started

---

## Hooks Layer Tests

### useCart.ts
- **TC-CF-032**: 장바구니 초기화 (localStorage 복원)
  - Given: localStorage에 장바구니 데이터 존재
  - When: useCart() 훅 초기화
  - Then: cart 상태가 localStorage 데이터로 복원됨
  - Story: US-006
  - Status: ⬜ Not Started

- **TC-CF-033**: addToCart 호출
  - Given: useCart() 훅
  - When: addToCart(menuItem, 1) 호출
  - Then: cart 상태 업데이트 및 localStorage 동기화
  - Story: US-004
  - Status: ⬜ Not Started

### useMenus.ts
- **TC-CF-034**: 메뉴 조회 (React Query 캐싱)
  - Given: storeId
  - When: useMenus(storeId) 호출
  - Then: 메뉴 데이터 조회 및 5분간 캐싱
  - Story: US-002
  - Status: ⬜ Not Started

### useCreateOrder.ts
- **TC-CF-035**: 주문 생성 mutation
  - Given: CreateOrderInput
  - When: mutate(input) 호출
  - Then: 주문 생성 및 주문 목록 무효화
  - Story: US-007
  - Status: ⬜ Not Started

### useOnlineStatus.ts
- **TC-CF-036**: 온라인 상태 감지
  - Given: 브라우저 온라인 상태
  - When: useOnlineStatus() 호출
  - Then: true 반환
  - Story: US-002
  - Status: ⬜ Not Started

- **TC-CF-037**: 오프라인 → 온라인 복구 시 자동 refetch
  - Given: 오프라인 상태에서 온라인으로 복구
  - When: 'online' 이벤트 발생
  - Then: React Query 자동 refetch 실행
  - Story: US-002
  - Status: ⬜ Not Started

### useAutoRedirect.ts
- **TC-CF-038**: 5초 후 자동 리다이렉트
  - Given: enabled = true, delay = 5000
  - When: useAutoRedirect() 훅 실행
  - Then: 5초 후 '/customer/menu'로 리다이렉트
  - Story: US-007
  - Status: ⬜ Not Started

---

## Components Layer Tests

### ErrorBoundary.tsx
- **TC-CF-039**: 에러 캐치 및 폴백 UI 표시
  - Given: 자식 컴포넌트에서 에러 발생
  - When: ErrorBoundary가 에러 캐치
  - Then: 폴백 UI 표시 및 Sentry 로깅
  - Story: US-002
  - Status: ⬜ Not Started

### LazyImage.tsx
- **TC-CF-040**: 이미지 지연 로딩
  - Given: 뷰포트 밖에 있는 이미지
  - When: 스크롤하여 뷰포트 진입
  - Then: 이미지 로드 시작
  - Story: US-003
  - Status: ⬜ Not Started

### MenuBrowser.tsx
- **TC-CF-041**: 메뉴 목록 표시
  - Given: 메뉴 데이터 로드 완료
  - When: MenuBrowser 렌더링
  - Then: 메뉴 카드 목록 표시
  - Story: US-002
  - Status: ⬜ Not Started

- **TC-CF-042**: 카테고리 필터링
  - Given: 카테고리 선택
  - When: 카테고리 필터 적용
  - Then: 해당 카테고리 메뉴만 표시
  - Story: US-002
  - Status: ⬜ Not Started

### Cart.tsx
- **TC-CF-043**: 장바구니 항목 표시
  - Given: 장바구니에 항목 존재
  - When: Cart 페이지 렌더링
  - Then: 장바구니 항목 목록 및 총액 표시
  - Story: US-005
  - Status: ⬜ Not Started

- **TC-CF-044**: 주문 제출
  - Given: 유효한 장바구니 및 세션
  - When: "주문하기" 버튼 클릭
  - Then: 주문 생성 API 호출 및 OrderConfirmation으로 이동
  - Story: US-007
  - Status: ⬜ Not Started

### OrderConfirmation.tsx
- **TC-CF-045**: 주문 상세 표시
  - Given: 주문 생성 완료
  - When: OrderConfirmation 렌더링
  - Then: 주문 상세 정보 표시
  - Story: US-007
  - Status: ⬜ Not Started

- **TC-CF-046**: 5초 후 자동 리다이렉트
  - Given: OrderConfirmation 렌더링
  - When: 5초 경과
  - Then: '/customer/menu'로 자동 이동
  - Story: US-007
  - Status: ⬜ Not Started

### OrderHistory.tsx
- **TC-CF-047**: 주문 내역 표시
  - Given: 주문 내역 데이터 로드 완료
  - When: OrderHistory 렌더링
  - Then: 주문 목록 표시
  - Story: US-008
  - Status: ⬜ Not Started

- **TC-CF-048**: 5분마다 폴링
  - Given: OrderHistory 활성화
  - When: 5분 경과
  - Then: 주문 내역 자동 refetch
  - Story: US-008
  - Status: ⬜ Not Started

### CustomerLogin.tsx
- **TC-CF-049**: 수동 로그인 폼 제출
  - Given: 유효한 로그인 정보 입력
  - When: "로그인" 버튼 클릭
  - Then: 로그인 성공 및 메뉴 화면으로 이동
  - Story: US-001
  - Status: ⬜ Not Started

- **TC-CF-050**: 자동 로그인 (초기 로드)
  - Given: localStorage에 유효한 토큰 존재
  - When: CustomerLogin 컴포넌트 마운트
  - Then: 자동 로그인 시도 및 성공 시 메뉴 화면으로 이동
  - Story: US-001
  - Status: ⬜ Not Started

---

## Transformers Layer Tests

### entityTransformers.ts - menuItemToCartItem()
- **TC-CF-051**: MenuItem을 CartItem으로 변환
  - Given: MenuItem 객체
  - When: menuItemToCartItem(menuItem, 2) 호출
  - Then: CartItem 객체 반환 (quantity = 2)
  - Story: US-004
  - Status: ⬜ Not Started

### entityTransformers.ts - cartItemToOrderItem()
- **TC-CF-052**: CartItem을 OrderItem으로 변환 (현재 가격 사용)
  - Given: CartItem (가격 5000원), currentPrice = 5500원
  - When: cartItemToOrderItem(cartItem, 5500) 호출
  - Then: OrderItem 객체 반환 (price = 5500원)
  - Story: US-007
  - Status: ⬜ Not Started

---

## 요구사항 커버리지

| Requirement ID | Test Cases | Status |
|---------------|------------|--------|
| REQ-001 (테이블 로그인) | TC-CF-001 ~ TC-CF-009, TC-CF-049, TC-CF-050 | ⬜ Pending |
| REQ-002 (메뉴 조회) | TC-CF-027, TC-CF-028, TC-CF-034, TC-CF-041, TC-CF-042 | ⬜ Pending |
| REQ-003 (메뉴 상세) | TC-CF-040 | ⬜ Pending |
| REQ-004 (장바구니 추가) | TC-CF-010 ~ TC-CF-013, TC-CF-033, TC-CF-051 | ⬜ Pending |
| REQ-005 (장바구니 관리) | TC-CF-014 ~ TC-CF-018, TC-CF-043 | ⬜ Pending |
| REQ-006 (장바구니 지속성) | TC-CF-019 ~ TC-CF-022, TC-CF-032 | ⬜ Pending |
| REQ-007 (주문 생성) | TC-CF-023 ~ TC-CF-026, TC-CF-029, TC-CF-030, TC-CF-035, TC-CF-044 ~ TC-CF-046, TC-CF-052 | ⬜ Pending |
| REQ-008 (주문 내역) | TC-CF-031, TC-CF-047, TC-CF-048 | ⬜ Pending |

---

## 테스트 통계
- **총 테스트 케이스**: 52개
- **Utils Layer**: 9개
- **Services Layer**: 17개
- **API Layer**: 5개
- **Hooks Layer**: 7개
- **Components Layer**: 12개
- **Transformers Layer**: 2개

---

## 테스트 우선순위
- **P0 (최우선)**: TC-CF-001 ~ TC-CF-009 (인증), TC-CF-010 ~ TC-CF-026 (장바구니 및 주문 로직)
- **P1 (중요)**: TC-CF-027 ~ TC-CF-035 (API 및 Hooks)
- **P2 (일반)**: TC-CF-036 ~ TC-CF-052 (UI 및 변환)
