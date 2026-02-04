# Contract/Interface Definition for Customer Frontend

## 유닛 컨텍스트
- **Stories**: US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008
- **Dependencies**: Backend API (메뉴 조회, 주문 생성, 인증)
- **Database Entities**: 없음 (클라이언트 측 상태 관리만)
- **Service Boundaries**: 
  - 고객 인증 및 세션 관리
  - 메뉴 탐색 및 필터링
  - 장바구니 관리 (localStorage)
  - 주문 생성 및 내역 조회

---

## Utils Layer (유틸리티 함수)

### auth.ts
```typescript
// 토큰 관리
saveAuthToken(token: string): void
getAuthToken(): string | null
removeAuthToken(): void
isTokenExpired(token: string): boolean

// 세션 관리
saveSession(session: CustomerSession): void
getSession(): CustomerSession | null
removeSession(): void
validateSession(session: CustomerSession): boolean

// 로그인/로그아웃
autoLogin(): Promise<CustomerSession | null>
manualLogin(credentials: LoginCredentials): Promise<CustomerSession>
logout(): void
extendSession(session: CustomerSession): Promise<CustomerSession>
```

**Args**:
- `token`: JWT 인증 토큰 문자열
- `session`: CustomerSession 객체 (tableId, authToken, sessionId, expiresAt 포함)
- `credentials`: LoginCredentials 객체 (storeId, tableNumber, tablePassword)

**Returns**:
- `saveAuthToken`, `saveSession`, `removeAuthToken`, `removeSession`, `logout`: void
- `getAuthToken`: string | null
- `getSession`: CustomerSession | null
- `validateSession`: boolean
- `autoLogin`: Promise<CustomerSession | null>
- `manualLogin`: Promise<CustomerSession>
- `extendSession`: Promise<CustomerSession>

**Raises**:
- `manualLogin`: Error (로그인 실패 시)
- `extendSession`: Error (세션 연장 실패 시)

---

### encryption.ts
```typescript
encrypt(data: string): string
decrypt(encryptedData: string): string

// secureStorage 객체
secureStorage.setItem(key: string, value: any): void
secureStorage.getItem<T>(key: string): T | null
secureStorage.removeItem(key: string): void
```

**Args**:
- `data`: 암호화할 평문 문자열
- `encryptedData`: 복호화할 암호화된 문자열
- `key`: localStorage 키
- `value`: 저장할 값 (any 타입)

**Returns**:
- `encrypt`: 암호화된 문자열
- `decrypt`: 복호화된 문자열
- `secureStorage.getItem`: T | null

**Raises**:
- `decrypt`: Error (복호화 실패 시)

---

### retry.ts
```typescript
retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries?: number,
  delays?: number[]
): Promise<T>

sleep(ms: number): Promise<void>
isNetworkError(error: any): boolean
```

**Args**:
- `fn`: 재시도할 비동기 함수
- `maxRetries`: 최대 재시도 횟수 (기본값: 3)
- `delays`: 재시도 간격 배열 (기본값: [1000, 2000, 4000])
- `ms`: 대기 시간 (밀리초)
- `error`: 에러 객체

**Returns**:
- `retryWithBackoff`: Promise<T>
- `sleep`: Promise<void>
- `isNetworkError`: boolean

**Raises**:
- `retryWithBackoff`: Error (최대 재시도 초과 시)

---

### validation.ts
```typescript
validateMenuItem(item: MenuItem): boolean
validateCartItem(item: CartItem): boolean
validateOrder(order: Order): boolean
validateSession(session: CustomerSession): boolean
```

**Args**:
- `item`: MenuItem 또는 CartItem 객체
- `order`: Order 객체
- `session`: CustomerSession 객체

**Returns**: boolean (유효성 검증 결과)

---

### format.ts
```typescript
formatCurrency(amount: number): string
formatDate(date: string): string
formatTime(date: string): string
formatDateTime(date: string): string
```

**Args**:
- `amount`: 금액 (숫자)
- `date`: ISO 8601 날짜 문자열

**Returns**: 포맷된 문자열

---

## Services Layer (비즈니스 로직)

### cartService.ts
```typescript
addToCartLogic(cart: Cart, item: MenuItem, quantity: number): Cart
removeFromCartLogic(cart: Cart, menuId: string): Cart
updateQuantityLogic(cart: Cart, menuId: string, delta: number): Cart
clearCartLogic(): Cart
calculateCartTotals(cart: Cart): { totalItems: number; totalAmount: number }
saveCartToLocalStorage(cart: Cart): void
loadCartFromLocalStorage(): Cart | null
```

**Args**:
- `cart`: Cart 객체
- `item`: MenuItem 객체
- `quantity`: 수량 (1-10)
- `menuId`: 메뉴 ID
- `delta`: 수량 변경값 (+1 또는 -1)

**Returns**:
- `addToCartLogic`, `removeFromCartLogic`, `updateQuantityLogic`: Cart
- `clearCartLogic`: Cart (빈 장바구니)
- `calculateCartTotals`: { totalItems: number; totalAmount: number }
- `loadCartFromLocalStorage`: Cart | null

**Raises**:
- `addToCartLogic`: Error (품절 메뉴, 최대 수량 초과)
- `updateQuantityLogic`: Error (최대 수량 초과)

---

### orderService.ts (비즈니스 로직)
```typescript
validateOrderSubmission(cart: Cart, session: CustomerSession): ValidationResult
prepareOrderItems(cart: Cart, currentMenus: MenuItem[]): OrderItem[]
calculateOrderTotal(items: OrderItem[]): number
```

**Args**:
- `cart`: Cart 객체
- `session`: CustomerSession 객체
- `currentMenus`: 현재 메뉴 가격 배열

**Returns**:
- `validateOrderSubmission`: ValidationResult { valid: boolean; error?: string }
- `prepareOrderItems`: OrderItem[]
- `calculateOrderTotal`: number

---

## API Layer (API 서비스)

### menuService.ts
```typescript
fetchMenus(storeId: string): Promise<MenuItem[]>
fetchMenusByIds(menuIds: string[]): Promise<MenuItem[]>
fetchCategories(storeId: string): Promise<Category[]>
```

**Args**:
- `storeId`: 매장 ID
- `menuIds`: 메뉴 ID 배열

**Returns**: Promise<MenuItem[]> 또는 Promise<Category[]>

**Raises**: Error (API 호출 실패 시)

---

### orderService.ts (API)
```typescript
createOrder(input: CreateOrderInput): Promise<Order>
fetchOrders(sessionId: string): Promise<Order[]>
fetchOrderById(orderId: string): Promise<Order>
```

**Args**:
- `input`: CreateOrderInput { tableId, sessionId, items, totalAmount }
- `sessionId`: 세션 ID
- `orderId`: 주문 ID

**Returns**: Promise<Order> 또는 Promise<Order[]>

**Raises**: Error (API 호출 실패 시)

---

### authService.ts
```typescript
login(credentials: LoginCredentials): Promise<AuthResponse>
extendSession(sessionId: string): Promise<SessionResponse>
logout(sessionId: string): Promise<void>
```

**Args**:
- `credentials`: LoginCredentials { storeId, tableNumber, tablePassword }
- `sessionId`: 세션 ID

**Returns**: 
- `login`: Promise<AuthResponse>
- `extendSession`: Promise<SessionResponse>
- `logout`: Promise<void>

**Raises**: Error (API 호출 실패 시)

---

## Hooks Layer (커스텀 훅)

### useAuth.ts
```typescript
useAuth(): {
  session: CustomerSession | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
```

**Returns**: AuthContext 객체

---

### useCart.ts
```typescript
useCart(): {
  cart: Cart;
  addToCart: (item: MenuItem, quantity: number) => void;
  removeFromCart: (menuId: string) => void;
  updateQuantity: (menuId: string, delta: number) => void;
  clearCart: () => void;
  totals: { totalItems: number; totalAmount: number };
}
```

**Returns**: CartContext 객체

---

### useMenus.ts
```typescript
useMenus(storeId: string): UseQueryResult<MenuItem[]>
```

**Args**: `storeId` - 매장 ID

**Returns**: React Query UseQueryResult

---

### useOrders.ts
```typescript
useOrders(sessionId: string): UseQueryResult<Order[]>
```

**Args**: `sessionId` - 세션 ID

**Returns**: React Query UseQueryResult

---

### useCreateOrder.ts
```typescript
useCreateOrder(): UseMutationResult<Order, Error, CreateOrderInput>
```

**Returns**: React Query UseMutationResult

---

### useOnlineStatus.ts
```typescript
useOnlineStatus(): boolean
```

**Returns**: boolean (온라인 상태)

---

### useAutoRedirect.ts
```typescript
useAutoRedirect(enabled: boolean, delay?: number, redirectPath?: string): void
```

**Args**:
- `enabled`: 리다이렉트 활성화 여부
- `delay`: 지연 시간 (기본값: 5000ms)
- `redirectPath`: 리다이렉트 경로 (기본값: '/customer/menu')

**Returns**: void

---

## Components Layer (React 컴포넌트)

### ErrorBoundary.tsx
```typescript
class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void
  render(): ReactNode
}
```

---

### LazyImage.tsx
```typescript
LazyImage({ src, alt, placeholder, className }: LazyImageProps): JSX.Element
```

**Props**:
- `src`: 이미지 URL
- `alt`: 대체 텍스트
- `placeholder`: 플레이스홀더 이미지 (선택)
- `className`: CSS 클래스 (선택)

---

### MenuBrowser.tsx (페이지)
```typescript
MenuBrowser(): JSX.Element
```

**기능**:
- 메뉴 조회 (useMenus)
- 카테고리 필터링
- 장바구니 추가

---

### Cart.tsx (페이지)
```typescript
Cart(): JSX.Element
```

**기능**:
- 장바구니 항목 표시
- 수량 변경
- 주문 제출

---

### OrderConfirmation.tsx (페이지)
```typescript
OrderConfirmation(): JSX.Element
```

**기능**:
- 주문 상세 표시
- 5초 후 자동 리다이렉트

---

### OrderHistory.tsx (페이지)
```typescript
OrderHistory(): JSX.Element
```

**기능**:
- 주문 내역 표시
- 5분마다 폴링

---

### CustomerLogin.tsx (페이지)
```typescript
CustomerLogin(): JSX.Element
```

**기능**:
- 수동 로그인 폼
- 자동 로그인 (초기 로드)

---

## Transformers Layer (데이터 변환)

### entityTransformers.ts
```typescript
menuItemToCartItem(menuItem: MenuItem, quantity: number): CartItem
cartItemToOrderItem(cartItem: CartItem, currentPrice: number): OrderItem
apiMenuToMenuItem(apiMenu: any): MenuItem
apiOrderToOrder(apiOrder: any): Order
```

**Args**:
- `menuItem`: MenuItem 객체
- `quantity`: 수량
- `cartItem`: CartItem 객체
- `currentPrice`: 현재 가격
- `apiMenu`, `apiOrder`: API 응답 객체

**Returns**: 변환된 엔티티 객체

---

## 총 Contract 수
- **Utils**: 8개 모듈, 30+ 함수
- **Services**: 2개 서비스, 10+ 함수
- **API**: 3개 서비스, 9개 함수
- **Hooks**: 7개 훅
- **Components**: 5개 페이지 + 1개 ErrorBoundary + 1개 LazyImage
- **Transformers**: 1개 모듈, 4개 함수

**총 계**: 약 60+ 함수/메서드/컴포넌트
