# Customer Frontend - 도메인 엔티티

## 개요
이 문서는 customer-frontend 유닛의 도메인 엔티티, 관계, 데이터 구조를 정의합니다.

---

## 엔티티 정의

### 1. MenuItem (메뉴 항목)

**설명**: 레스토랑에서 제공하는 개별 메뉴 항목

**속성**:
```typescript
interface MenuItem {
  id: string;                    // 메뉴 고유 식별자
  name: string;                  // 메뉴명
  price: number;                 // 가격 (원)
  description: string;           // 메뉴 설명
  imageUrl?: string;             // 이미지 URL (선택)
  categoryId: string;            // 카테고리 ID
  categoryName: string;          // 카테고리명
  displayOrder: number;          // 표시 순서
  isAvailable: boolean;          // 가용성 (품절 여부)
}
```

**비즈니스 규칙**:
- `price`는 0보다 커야 함
- `isAvailable`이 false면 주문 불가
- `imageUrl`이 없으면 기본 플레이스홀더 이미지 사용

---

### 2. CartItem (장바구니 항목)

**설명**: 장바구니에 담긴 개별 메뉴 항목

**속성**:
```typescript
interface CartItem {
  menuId: string;                // 메뉴 ID (MenuItem.id 참조)
  name: string;                  // 메뉴명 (스냅샷)
  price: number;                 // 가격 (스냅샷)
  quantity: number;              // 수량
  imageUrl?: string;             // 이미지 URL (스냅샷)
  addedAt: string;               // 추가 시각 (ISO 8601)
}
```

**비즈니스 규칙**:
- `quantity`는 1 이상 10 이하
- 동일한 `menuId`는 하나의 CartItem으로 통합 (수량 증가)
- 가격은 장바구니 추가 시점의 스냅샷 (주문 제출 시 현재 가격 사용)

**계산 속성**:
```typescript
subtotal = price × quantity
```

---

### 3. Cart (장바구니)

**설명**: 고객의 장바구니 전체

**속성**:
```typescript
interface Cart {
  items: CartItem[];             // 장바구니 항목 목록
  lastUpdated: string;           // 마지막 업데이트 시각 (ISO 8601)
}
```

**계산 속성**:
```typescript
totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)
isEmpty = items.length === 0
```

**비즈니스 규칙**:
- 최대 항목 수 제한 없음 (단, 항목당 수량은 최대 10)
- localStorage에 저장 (테이블 세션 종료 시 삭제)
- 용량 초과 시 가장 오래된 항목 제거

---

### 4. Order (주문)

**설명**: 확정된 주문

**속성**:
```typescript
interface Order {
  orderId: string;               // 주문 고유 식별자 (서버 생성)
  tableId: string;               // 테이블 ID
  sessionId: string;             // 테이블 세션 ID
  items: OrderItem[];            // 주문 항목 목록
  totalAmount: number;           // 총 금액
  status: OrderStatus;           // 주문 상태
  createdAt: string;             // 주문 생성 시각 (ISO 8601)
  estimatedPrepTime?: number;    // 예상 준비 시간 (분)
}

interface OrderItem {
  menuId: string;                // 메뉴 ID
  name: string;                  // 메뉴명
  price: number;                 // 주문 시점 가격
  quantity: number;              // 수량
  subtotal: number;              // 소계
}

enum OrderStatus {
  PENDING = 'pending',           // 대기중
  PREPARING = 'preparing',       // 준비중
  COMPLETED = 'completed'        // 완료
}
```

**비즈니스 규칙**:
- `orderId`는 서버에서 생성
- `items`는 장바구니에서 변환 (주문 제출 시 현재 가격 사용)
- `status`는 서버에서 관리 (고객은 읽기 전용)
- 주문 생성 후 장바구니는 자동으로 비워짐

---

### 5. CustomerSession (고객 세션)

**설명**: 테이블 태블릿의 인증 세션

**속성**:
```typescript
interface CustomerSession {
  tableId: string;               // 테이블 ID
  tableName: string;             // 테이블명 (예: "Table 5")
  storeId: string;               // 매장 ID
  storeName: string;             // 매장명
  authToken: string;             // JWT 인증 토큰
  sessionId: string;             // 테이블 세션 ID (UUID)
  expiresAt: string;             // 세션 만료 시각 (ISO 8601)
  isActive: boolean;             // 세션 활성 상태
}
```

**비즈니스 규칙**:
- `authToken`은 localStorage에 저장
- 자동 로그인 실패 시 지수 백오프로 재시도
- 세션 만료 시 자동 연장
- 세션 종료 시 장바구니도 함께 삭제

---

### 6. Category (카테고리)

**설명**: 메뉴 카테고리

**속성**:
```typescript
interface Category {
  id: string;                    // 카테고리 고유 식별자
  name: string;                  // 카테고리명
  displayOrder: number;          // 표시 순서
}
```

**비즈니스 규칙**:
- 카테고리는 서버에서 관리 (고객은 읽기 전용)
- 메뉴 필터링에 사용

---

## 엔티티 관계

```
CustomerSession (1) ─────────────────────────────────┐
                                                      │
                                                      ▼
Cart (1) ──────────> CartItem (N) ──────────> MenuItem (1)
                                                      │
                                                      │
Order (N) ─────────> OrderItem (N) ───────────────────┘
                                                      │
                                                      ▼
                                              Category (1)
```

**관계 설명**:
1. **CustomerSession - Cart**: 1:1 관계 (세션당 하나의 장바구니)
2. **Cart - CartItem**: 1:N 관계 (장바구니는 여러 항목 포함)
3. **CartItem - MenuItem**: N:1 관계 (여러 장바구니 항목이 동일 메뉴 참조)
4. **Order - OrderItem**: 1:N 관계 (주문은 여러 항목 포함)
5. **OrderItem - MenuItem**: N:1 관계 (주문 항목은 메뉴 참조)
6. **MenuItem - Category**: N:1 관계 (메뉴는 하나의 카테고리에 속함)

---

## 데이터 흐름

### 1. 메뉴 탐색 흐름
```
API: GET /customer/menus
  ↓
MenuItem[] + Category[]
  ↓
React Query 캐싱 (stale-while-revalidate)
  ↓
MenuBrowser 컴포넌트 표시
```

### 2. 장바구니 추가 흐름
```
MenuItem 선택
  ↓
CartItem 생성 (또는 수량 증가)
  ↓
Cart 업데이트
  ↓
localStorage 저장
  ↓
UI 업데이트 (배지, 총액)
```

### 3. 주문 생성 흐름
```
Cart 검증 (비어있지 않음, 세션 유효)
  ↓
현재 메뉴 가격 조회 (API)
  ↓
OrderItem[] 생성 (현재 가격 사용)
  ↓
API: POST /customer/orders
  ↓
Order 생성 (서버)
  ↓
Cart 비우기 (localStorage)
  ↓
주문 확인 화면 표시
  ↓
5초 후 메뉴 화면으로 리다이렉트
```

### 4. 주문 내역 조회 흐름
```
API: GET /customer/orders (현재 세션만)
  ↓
Order[] 수신
  ↓
5분마다 폴링하여 상태 업데이트
  ↓
OrderHistory 컴포넌트 표시
```

---

## localStorage 스키마

### 저장 키
```typescript
const STORAGE_KEYS = {
  AUTH_TOKEN: 'customer_auth_token',
  SESSION: 'customer_session',
  CART: 'customer_cart'
};
```

### 저장 데이터 구조
```typescript
// customer_auth_token
string (JWT 토큰)

// customer_session
CustomerSession

// customer_cart
Cart
```

### 지속성 규칙
- **AUTH_TOKEN**: 세션 종료 시까지 유지
- **SESSION**: 세션 종료 시까지 유지
- **CART**: 세션 종료 시 삭제

---

## 엔티티 생명주기

### MenuItem
- **생성**: 서버에서 관리 (관리자가 생성)
- **조회**: 고객 프론트엔드에서 읽기 전용
- **업데이트**: 서버에서 관리 (관리자가 수정)
- **삭제**: 서버에서 관리 (관리자가 삭제)

### CartItem
- **생성**: 고객이 메뉴 추가 시
- **조회**: 장바구니 화면에서
- **업데이트**: 수량 변경 시
- **삭제**: 항목 제거 또는 주문 완료 시

### Order
- **생성**: 고객이 주문 확정 시
- **조회**: 주문 내역 화면에서
- **업데이트**: 서버에서 상태 변경 (고객은 읽기 전용)
- **삭제**: 서버에서 관리 (관리자가 삭제)

### CustomerSession
- **생성**: 테이블 로그인 시
- **조회**: 앱 전역에서 사용
- **업데이트**: 세션 연장 시
- **삭제**: 세션 종료 시 (관리자가 종료)

---

## 엔티티 검증 규칙

### MenuItem 검증
```typescript
function validateMenuItem(item: MenuItem): boolean {
  return (
    item.id !== '' &&
    item.name !== '' &&
    item.price > 0 &&
    item.categoryId !== ''
  );
}
```

### CartItem 검증
```typescript
function validateCartItem(item: CartItem): boolean {
  return (
    item.menuId !== '' &&
    item.quantity >= 1 &&
    item.quantity <= 10 &&
    item.price > 0
  );
}
```

### Order 검증
```typescript
function validateOrder(order: Order): boolean {
  return (
    order.items.length > 0 &&
    order.totalAmount > 0 &&
    order.tableId !== '' &&
    order.sessionId !== ''
  );
}
```

### CustomerSession 검증
```typescript
function validateSession(session: CustomerSession): boolean {
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  
  return (
    session.authToken !== '' &&
    session.isActive &&
    expiresAt > now
  );
}
```

---

## 엔티티 변환 함수

### CartItem → OrderItem
```typescript
function cartItemToOrderItem(
  cartItem: CartItem,
  currentPrice: number
): OrderItem {
  return {
    menuId: cartItem.menuId,
    name: cartItem.name,
    price: currentPrice,  // 주문 시점 현재 가격 사용
    quantity: cartItem.quantity,
    subtotal: currentPrice * cartItem.quantity
  };
}
```

### MenuItem → CartItem
```typescript
function menuItemToCartItem(
  menuItem: MenuItem,
  quantity: number = 1
): CartItem {
  return {
    menuId: menuItem.id,
    name: menuItem.name,
    price: menuItem.price,
    quantity: quantity,
    imageUrl: menuItem.imageUrl,
    addedAt: new Date().toISOString()
  };
}
```

---

## 요약

이 도메인 모델은 customer-frontend의 핵심 비즈니스 엔티티를 정의하며, 다음을 포함합니다:

1. **6개 주요 엔티티**: MenuItem, CartItem, Cart, Order, CustomerSession, Category
2. **명확한 관계**: 1:1, 1:N, N:1 관계 정의
3. **데이터 흐름**: 메뉴 탐색, 장바구니, 주문, 내역 조회
4. **지속성 전략**: localStorage 기반 저장
5. **검증 규칙**: 각 엔티티의 유효성 검증
6. **변환 함수**: 엔티티 간 변환 로직
