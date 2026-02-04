# Customer Frontend - 논리적 컴포넌트

## 개요
이 문서는 customer-frontend 유닛의 논리적 컴포넌트, 유틸리티 모듈, 공통 훅, 서비스 레이어를 정의합니다.

---

## 1. 프론트엔드 논리적 컴포넌트

### 1.1 컴포넌트 계층 구조

```
App (ErrorBoundary)
├── AuthProvider
├── CartProvider
├── UIProvider
└── QueryClientProvider
    └── Router
        ├── MenuBrowser (페이지)
        │   ├── CategoryFilter
        │   ├── MenuGrid
        │   │   └── MenuItem (LazyImage)
        │   └── CartBadge
        ├── Cart (페이지)
        │   ├── CartItemList
        │   │   └── CartItem
        │   ├── CartSummary
        │   └── CheckoutButton
        ├── OrderConfirmation (페이지)
        │   ├── OrderDetails
        │   └── AutoRedirect
        ├── OrderHistory (페이지)
        │   └── OrderList
        │       └── OrderCard
        └── CustomerLogin (페이지)
            └── LoginForm
```

### 1.2 페이지 컴포넌트

#### MenuBrowser
**책임**: 메뉴 탐색 및 장바구니 추가
**상태**: 선택된 카테고리, 메뉴 목록
**주요 기능**:
- 메뉴 조회 (React Query)
- 카테고리별 필터링
- 장바구니 추가

#### Cart
**책임**: 장바구니 관리 및 주문 제출
**상태**: 장바구니 항목
**주요 기능**:
- 장바구니 항목 표시
- 수량 변경
- 항목 제거
- 주문 제출

#### OrderConfirmation
**책임**: 주문 확인 및 자동 리다이렉트
**상태**: 주문 정보
**주요 기능**:
- 주문 상세 표시
- 5초 후 자동 리다이렉트

#### OrderHistory
**책임**: 주문 내역 조회
**상태**: 주문 목록
**주요 기능**:
- 주문 내역 표시
- 5분마다 상태 폴링

#### CustomerLogin
**책임**: 테이블 로그인
**상태**: 로그인 폼 입력
**주요 기능**:
- 수동 로그인
- 자동 로그인 (초기 로드)

### 1.3 공통 컴포넌트

#### ErrorBoundary
**책임**: 전역 에러 처리
**기능**: 에러 캐치, 폴백 UI, Sentry 로깅

#### LazyImage
**책임**: 이미지 지연 로딩
**기능**: Intersection Observer, 플레이스홀더

#### LoadingFallback
**책임**: 로딩 상태 표시
**기능**: 스피너, 로딩 메시지

#### Toast
**책임**: 알림 메시지 표시
**기능**: 성공/에러/정보 메시지, 자동 제거

#### Modal
**책임**: 모달 다이얼로그
**기능**: 오버레이, 키보드 네비게이션, 접근성

#### OfflineBanner
**책임**: 오프라인 상태 알림
**기능**: 온라인/오프라인 감지, 배너 표시

---

## 2. 유틸리티 모듈

### 2.1 인증 유틸리티 (auth.ts)

**함수 목록**:
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

### 2.2 암호화 유틸리티 (encryption.ts)

**함수 목록**:
```typescript
encrypt(data: string): string
decrypt(encryptedData: string): string

// secureStorage 객체
secureStorage.setItem(key: string, value: any): void
secureStorage.getItem<T>(key: string): T | null
secureStorage.removeItem(key: string): void
```

### 2.3 재시도 유틸리티 (retry.ts)

**함수 목록**:
```typescript
retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries?: number,
  delays?: number[]
): Promise<T>

sleep(ms: number): Promise<void>
isNetworkError(error: any): boolean
```

### 2.4 살균 유틸리티 (sanitize.ts)

**함수 목록**:
```typescript
sanitizeInput(input: string): string
sanitizeHTML(html: string): string
```

### 2.5 검증 유틸리티 (validation.ts)

**함수 목록**:
```typescript
validateMenuItem(item: MenuItem): boolean
validateCartItem(item: CartItem): boolean
validateOrder(order: Order): boolean
validateSession(session: CustomerSession): boolean
```

### 2.6 포맷팅 유틸리티 (format.ts)

**함수 목록**:
```typescript
formatCurrency(amount: number): string
formatDate(date: string): string
formatTime(date: string): string
formatDateTime(date: string): string
```

### 2.7 모니터링 유틸리티 (monitoring.ts)

**함수 목록**:
```typescript
logErrorToSentry(error: Error, context?: Record<string, any>): void
initPerformanceMonitoring(): void
trackPageView(path: string): void
trackEvent(action: string, category: string, label?: string, value?: number): void
```

### 2.8 로거 유틸리티 (logger.ts)

**클래스**:
```typescript
class Logger {
  debug(message: string, data?: any): void
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, error?: Error, data?: any): void
}

export const logger: Logger
```

---

## 3. 공통 훅 (Hooks)

### 3.1 인증 훅

#### useAuth
**반환값**:
```typescript
{
  session: CustomerSession | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
```

#### useAutoLogin
**반환값**:
```typescript
{
  isLoading: boolean;
  error: Error | null;
}
```

### 3.2 장바구니 훅

#### useCart
**반환값**:
```typescript
{
  cart: Cart;
  addToCart: (item: MenuItem, quantity: number) => void;
  removeFromCart: (menuId: string) => void;
  updateQuantity: (menuId: string, delta: number) => void;
  clearCart: () => void;
  totals: { totalItems: number; totalAmount: number };
}
```

### 3.3 데이터 조회 훅 (React Query)

#### useMenus
**파라미터**: `storeId: string`
**반환값**: `UseQueryResult<MenuItem[]>`

#### useOrders
**파라미터**: `sessionId: string`
**반환값**: `UseQueryResult<Order[]>`

#### useCreateOrder
**반환값**: `UseMutationResult<Order, Error, CreateOrderInput>`

### 3.4 UI 훅

#### useToast
**반환값**:
```typescript
{
  showToast: (message: string, type: ToastType) => void;
}
```

#### useLoading
**반환값**:
```typescript
{
  isLoading: boolean;
  startLoading: (operation: string) => void;
  stopLoading: () => void;
}
```

#### useModal
**반환값**:
```typescript
{
  isOpen: boolean;
  open: () => void;
  close: () => void;
}
```

### 3.5 성능 훅

#### useOnlineStatus
**반환값**: `boolean`

#### useAutoRedirect
**파라미터**: `enabled: boolean, delay?: number, redirectPath?: string`
**반환값**: `void`

#### useDebounce
**파라미터**: `value: T, delay: number`
**반환값**: `T`

---

## 4. 서비스 레이어

### 4.1 API 서비스 (api/)

#### menuService.ts
**함수 목록**:
```typescript
fetchMenus(storeId: string): Promise<MenuItem[]>
fetchMenusByIds(menuIds: string[]): Promise<MenuItem[]>
fetchCategories(storeId: string): Promise<Category[]>
```

#### orderService.ts
**함수 목록**:
```typescript
createOrder(input: CreateOrderInput): Promise<Order>
fetchOrders(sessionId: string): Promise<Order[]>
fetchOrderById(orderId: string): Promise<Order>
```

#### authService.ts
**함수 목록**:
```typescript
login(credentials: LoginCredentials): Promise<AuthResponse>
extendSession(sessionId: string): Promise<SessionResponse>
logout(sessionId: string): Promise<void>
```

### 4.2 비즈니스 로직 서비스 (services/)

#### cartService.ts
**함수 목록**:
```typescript
addToCartLogic(cart: Cart, item: MenuItem, quantity: number): Cart
removeFromCartLogic(cart: Cart, menuId: string): Cart
updateQuantityLogic(cart: Cart, menuId: string, delta: number): Cart
clearCartLogic(): Cart
calculateCartTotals(cart: Cart): { totalItems: number; totalAmount: number }
saveCartToLocalStorage(cart: Cart): void
loadCartFromLocalStorage(): Cart | null
```

#### orderService.ts (비즈니스 로직)
**함수 목록**:
```typescript
validateOrderSubmission(cart: Cart, session: CustomerSession): ValidationResult
prepareOrderItems(cart: Cart, currentMenus: MenuItem[]): OrderItem[]
calculateOrderTotal(items: OrderItem[]): number
```

### 4.3 변환 서비스 (transformers/)

#### entityTransformers.ts
**함수 목록**:
```typescript
menuItemToCartItem(menuItem: MenuItem, quantity: number): CartItem
cartItemToOrderItem(cartItem: CartItem, currentPrice: number): OrderItem
apiMenuToMenuItem(apiMenu: any): MenuItem
apiOrderToOrder(apiOrder: any): Order
```

---

## 5. 디렉토리 구조

```
src/
├── components/           # UI 컴포넌트
│   ├── common/          # 공통 컴포넌트
│   │   ├── ErrorBoundary.tsx
│   │   ├── LazyImage.tsx
│   │   ├── LoadingFallback.tsx
│   │   ├── Toast.tsx
│   │   ├── Modal.tsx
│   │   └── OfflineBanner.tsx
│   ├── menu/            # 메뉴 관련 컴포넌트
│   │   ├── CategoryFilter.tsx
│   │   ├── MenuGrid.tsx
│   │   └── MenuItem.tsx
│   ├── cart/            # 장바구니 관련 컴포넌트
│   │   ├── CartItemList.tsx
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CheckoutButton.tsx
│   └── order/           # 주문 관련 컴포넌트
│       ├── OrderDetails.tsx
│       ├── OrderList.tsx
│       └── OrderCard.tsx
├── pages/               # 페이지 컴포넌트
│   ├── MenuBrowser.tsx
│   ├── Cart.tsx
│   ├── OrderConfirmation.tsx
│   ├── OrderHistory.tsx
│   └── CustomerLogin.tsx
├── contexts/            # Context Providers
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   └── UIContext.tsx
├── hooks/               # 커스텀 훅
│   ├── useAuth.ts
│   ├── useAutoLogin.ts
│   ├── useCart.ts
│   ├── useMenus.ts
│   ├── useOrders.ts
│   ├── useCreateOrder.ts
│   ├── useToast.ts
│   ├── useLoading.ts
│   ├── useModal.ts
│   ├── useOnlineStatus.ts
│   ├── useAutoRedirect.ts
│   └── useDebounce.ts
├── api/                 # API 서비스
│   ├── menuService.ts
│   ├── orderService.ts
│   └── authService.ts
├── services/            # 비즈니스 로직 서비스
│   ├── cartService.ts
│   └── orderService.ts
├── transformers/        # 데이터 변환
│   └── entityTransformers.ts
├── utils/               # 유틸리티
│   ├── auth.ts
│   ├── encryption.ts
│   ├── retry.ts
│   ├── sanitize.ts
│   ├── validation.ts
│   ├── format.ts
│   ├── monitoring.ts
│   └── logger.ts
├── lib/                 # 라이브러리 설정
│   ├── axios.ts
│   └── queryClient.ts
├── i18n/                # 국제화
│   ├── config.ts
│   └── locales/
│       ├── ko.json
│       ├── en.json
│       ├── zh.json
│       └── ja.json
├── types/               # TypeScript 타입
│   ├── entities.ts
│   ├── api.ts
│   └── common.ts
├── styles/              # 스타일
│   ├── global.css
│   ├── responsive.css
│   └── variables.css
├── App.tsx              # 루트 컴포넌트
└── main.tsx             # 엔트리 포인트
```

---

## 6. 컴포넌트 간 통신

### 6.1 데이터 흐름

```
사용자 액션
    ↓
페이지 컴포넌트
    ↓
Context / Hook
    ↓
서비스 레이어
    ↓
API / localStorage
    ↓
React Query 캐시
    ↓
UI 업데이트
```

### 6.2 상태 관리 계층

1. **전역 상태** (Context):
   - AuthContext: 인증 세션
   - CartContext: 장바구니
   - UIContext: UI 상태 (토스트, 로딩)

2. **서버 상태** (React Query):
   - 메뉴 데이터
   - 주문 내역
   - 카테고리

3. **로컬 상태** (useState):
   - 폼 입력
   - 모달 열림/닫힘
   - 선택된 카테고리

4. **지속 상태** (localStorage):
   - JWT 토큰 (암호화)
   - 세션 데이터 (암호화)
   - 장바구니

---

## 7. 의존성 주입

### 7.1 Provider 계층

```typescript
// src/App.tsx
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <UIProvider>
              <Router />
            </UIProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### 7.2 서비스 주입

```typescript
// src/hooks/useMenus.ts
import { menuService } from '@/api/menuService';

export function useMenus(storeId: string) {
  return useQuery({
    queryKey: ['menus', storeId],
    queryFn: () => menuService.fetchMenus(storeId)
  });
}
```

---

## 요약

### 논리적 컴포넌트 통계

| 카테고리 | 수량 | 주요 항목 |
|---------|------|----------|
| 페이지 컴포넌트 | 5개 | MenuBrowser, Cart, OrderConfirmation, OrderHistory, CustomerLogin |
| 공통 컴포넌트 | 6개 | ErrorBoundary, LazyImage, LoadingFallback, Toast, Modal, OfflineBanner |
| 메뉴 컴포넌트 | 3개 | CategoryFilter, MenuGrid, MenuItem |
| 장바구니 컴포넌트 | 4개 | CartItemList, CartItem, CartSummary, CheckoutButton |
| 주문 컴포넌트 | 3개 | OrderDetails, OrderList, OrderCard |
| Context Providers | 3개 | AuthContext, CartContext, UIContext |
| 커스텀 훅 | 13개 | useAuth, useCart, useMenus, useOrders, useToast 등 |
| API 서비스 | 3개 | menuService, orderService, authService |
| 비즈니스 로직 서비스 | 2개 | cartService, orderService |
| 유틸리티 모듈 | 8개 | auth, encryption, retry, sanitize, validation, format, monitoring, logger |
| 변환 서비스 | 1개 | entityTransformers |

**총 컴포넌트/모듈**: 51개
