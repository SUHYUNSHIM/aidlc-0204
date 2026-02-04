# Customer Frontend - NFR 설계 패턴

## 개요
이 문서는 customer-frontend 유닛의 NFR 요구사항을 구현하기 위한 설계 패턴을 정의합니다.

---

## 1. 복원력 패턴 (Resilience Patterns)

### 1.1 에러 경계 패턴 (Error Boundary Pattern)

**선택된 전략**: 앱 전체 (최상위 1개)

**구현 방식**:
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { logErrorToSentry } from '@/utils/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sentry에 에러 로깅
    logErrorToSentry(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'RootErrorBoundary'
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h1>문제가 발생했습니다</h1>
          <p>페이지를 새로고침해주세요</p>
          <button onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**적용 위치**: App.tsx 최상위


### 1.2 재시도 로직 패턴 (Retry Pattern)

**전략**: 지수 백오프 (1초, 2초, 4초) - 최대 3회

**구현 방식**:
```typescript
// src/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delays: number[] = [1000, 2000, 4000]
): Promise<T> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        throw error;
      }
      
      const delay = delays[attempt - 1] || delays[delays.length - 1];
      await sleep(delay);
    }
  }
  
  throw new Error('최대 재시도 횟수 초과');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**적용 대상**:
- 네트워크 에러 (ECONNABORTED, ENOTFOUND)
- 5xx 서버 에러
- 타임아웃 에러

**적용 제외**:
- 4xx 클라이언트 에러
- 인증 에러 (401, 403)
- 주문 제출 (중복 방지)

### 1.3 폴백 UI 패턴

**구현 방식**:
```typescript
// src/components/FallbackUI.tsx
export function LoadingFallback() {
  return (
    <div className="loading-fallback">
      <div className="spinner" />
      <p>로딩 중...</p>
    </div>
  );
}

export function ErrorFallback({ error, resetError }: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="error-fallback">
      <h2>오류가 발생했습니다</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>다시 시도</button>
    </div>
  );
}

export function OfflineFallback() {
  return (
    <div className="offline-banner">
      <p>⚠️ 인터넷 연결이 끊어졌습니다. 일부 기능이 제한됩니다.</p>
    </div>
  );
}
```

### 1.4 오프라인 감지 및 복구 패턴

**선택된 전략**: 자동 데이터 동기화 (React Query refetch)

**구현 방식**:
```typescript
// src/hooks/useOnlineStatus.ts
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      // 온라인 복구 시 자동 데이터 동기화
      queryClient.refetchQueries({ type: 'active' });
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);

  return isOnline;
}
```

---

## 2. 성능 최적화 패턴 (Performance Patterns)

### 2.1 코드 스플리팅 패턴

**선택된 전략**: 라우트 + 컴포넌트 + 라이브러리 분리

**구현 방식**:
```typescript
// src/App.tsx - 라우트별 코드 스플리팅
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const MenuBrowser = lazy(() => import('@/pages/MenuBrowser'));
const Cart = lazy(() => import('@/pages/Cart'));
const OrderConfirmation = lazy(() => import('@/pages/OrderConfirmation'));
const OrderHistory = lazy(() => import('@/pages/OrderHistory'));
const CustomerLogin = lazy(() => import('@/pages/CustomerLogin'));

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<MenuBrowser />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/login" element={<CustomerLogin />} />
      </Routes>
    </Suspense>
  );
}
```

**Vite 설정 - 라이브러리 분리**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-axios': ['axios'],
          'vendor-i18n': ['react-i18next', 'i18next'],
          'vendor-crypto': ['crypto-js'],
          'vendor-utils': ['date-fns']
        }
      }
    }
  }
});
```

### 2.2 이미지 지연 로딩 패턴

**선택된 전략**: Intersection Observer + 지연 로딩 + 플레이스홀더

**구현 방식**:
```typescript
// src/components/LazyImage.tsx
import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}

export function LazyImage({ 
  src, 
  alt, 
  placeholder = '/placeholder.png',
  className 
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
      onLoad={() => setIsLoaded(true)}
    />
  );
}
```

### 2.3 React Query 캐싱 전략

**선택된 전략**: staleTime: 5분, cacheTime: 10분 (표준)

**구현 방식**:
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5분
      cacheTime: 10 * 60 * 1000,     // 10분
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

// 메뉴 데이터 조회
export function useMenus(storeId: string) {
  return useQuery({
    queryKey: ['menus', storeId],
    queryFn: () => fetchMenus(storeId),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });
}
```

### 2.4 렌더링 최적화 패턴

**구현 방식**:
```typescript
// useMemo 예시 - 장바구니 총액 계산
function CartSummary({ items }: { items: CartItem[] }) {
  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return { totalItems, totalAmount };
  }, [items]);

  return (
    <div>
      <p>총 {totals.totalItems}개</p>
      <p>₩{totals.totalAmount.toLocaleString()}</p>
    </div>
  );
}

// useCallback 예시 - 이벤트 핸들러
function MenuItem({ item, onAddToCart }: MenuItemProps) {
  const handleAdd = useCallback(() => {
    onAddToCart(item);
  }, [item, onAddToCart]);

  return (
    <button onClick={handleAdd}>장바구니에 추가</button>
  );
}
```

---

## 3. 보안 패턴 (Security Patterns)

### 3.1 데이터 암호화 패턴

**선택된 범위**: JWT 토큰 + 세션 데이터

**구현 방식**:
```typescript
// src/utils/encryption.ts
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

export function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}

export function decrypt(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// localStorage 래퍼
export const secureStorage = {
  setItem(key: string, value: any): void {
    const stringValue = JSON.stringify(value);
    const encrypted = encrypt(stringValue);
    localStorage.setItem(key, encrypted);
  },

  getItem<T>(key: string): T | null {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
};
```

**적용 대상**:
- `customer_auth_token`: JWT 토큰
- `customer_session`: 세션 데이터

**적용 제외**:
- `customer_cart`: 장바구니 (민감하지 않음)
- React Query 캐시 (임시 데이터)


### 3.2 XSS 방어 패턴

**선택된 수준**: 표준 (unsafe-inline 허용, 도메인 제한)

**CSP 설정**:
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.example.com;
">
```

**입력 살균**:
```typescript
// src/utils/sanitize.ts
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// 사용 예시
function SearchInput() {
  const [query, setQuery] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeInput(e.target.value);
    setQuery(sanitized);
  };

  return <input value={query} onChange={handleChange} />;
}
```

**React 기본 방어**:
- JSX 자동 이스케이프 활용
- `dangerouslySetInnerHTML` 사용 금지

### 3.3 API 요청 서명 패턴

**선택된 전략**: 모든 요청에 서명 추가

**구현 방식**:
```typescript
// src/lib/axios.ts
import axios from 'axios';
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY;

function generateSignature(
  method: string,
  url: string,
  timestamp: string,
  body: string
): string {
  const message = `${method}${url}${timestamp}${body}`;
  return CryptoJS.HmacSHA256(message, SECRET_KEY).toString();
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
});

// 요청 인터셉터 - 서명 추가
axiosInstance.interceptors.request.use((config) => {
  const timestamp = new Date().toISOString();
  const body = config.data ? JSON.stringify(config.data) : '';
  const signature = generateSignature(
    config.method?.toUpperCase() || 'GET',
    config.url || '',
    timestamp,
    body
  );

  config.headers['X-Signature'] = signature;
  config.headers['X-Timestamp'] = timestamp;

  // JWT 토큰 추가
  const token = secureStorage.getItem<string>('customer_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosInstance;
```

### 3.4 인증 토큰 관리 패턴

**구현 방식**:
```typescript
// src/utils/auth.ts
import { secureStorage } from './encryption';

export function saveAuthToken(token: string): void {
  secureStorage.setItem('customer_auth_token', token);
}

export function getAuthToken(): string | null {
  return secureStorage.getItem<string>('customer_auth_token');
}

export function removeAuthToken(): void {
  secureStorage.removeItem('customer_auth_token');
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    return Date.now() >= expiresAt;
  } catch {
    return true;
  }
}
```

---

## 4. 상태 관리 패턴 (State Management Patterns)

### 4.1 서버 상태 관리 패턴 (React Query)

**구현 방식**:
```typescript
// src/hooks/useMenus.ts
export function useMenus(storeId: string) {
  return useQuery({
    queryKey: ['menus', storeId],
    queryFn: () => fetchMenus(storeId),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });
}

// src/hooks/useOrders.ts
export function useOrders(sessionId: string) {
  return useQuery({
    queryKey: ['orders', sessionId],
    queryFn: () => fetchOrders(sessionId),
    refetchInterval: 5 * 60 * 1000  // 5분마다 폴링
  });
}

// src/hooks/useCreateOrder.ts
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      // 주문 목록 무효화
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}
```

### 4.2 로컬 상태 관리 패턴 (Context API)

**선택된 전략**: 기능별 Context (Auth, Cart, UI)

**구현 방식**:
```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  session: CustomerSession | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CustomerSession | null>(null);

  const login = async (credentials: LoginCredentials) => {
    const newSession = await manualLogin(credentials);
    setSession(newSession);
    secureStorage.setItem('customer_session', newSession);
  };

  const logout = () => {
    setSession(null);
    secureStorage.removeItem('customer_session');
    secureStorage.removeItem('customer_auth_token');
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      login, 
      logout, 
      isAuthenticated: !!session 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// src/contexts/CartContext.tsx
interface CartContextType {
  cart: Cart;
  addToCart: (item: MenuItem, quantity: number) => void;
  removeFromCart: (menuId: string) => void;
  updateQuantity: (menuId: string, delta: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], lastUpdated: '' });

  // 장바구니 로직 구현...

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
}

// src/contexts/UIContext.tsx
interface UIContextType {
  showToast: (message: string, type: ToastType) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);
```

### 4.3 localStorage 동기화 패턴

**선택된 전략**: 중요 작업 후에만 (장바구니 추가, 주문 완료)

**구현 방식**:
```typescript
// src/hooks/useCart.ts
export function useCart() {
  const [cart, setCart] = useState<Cart>(() => {
    // 초기 로드 시 localStorage에서 복원
    const saved = localStorage.getItem('customer_cart');
    return saved ? JSON.parse(saved) : { items: [], lastUpdated: '' };
  });

  const addToCart = (item: MenuItem, quantity: number) => {
    const updatedCart = addToCartLogic(cart, item, quantity);
    setCart(updatedCart);
    // 중요 작업 후 즉시 동기화
    localStorage.setItem('customer_cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (menuId: string) => {
    const updatedCart = removeFromCartLogic(cart, menuId);
    setCart(updatedCart);
    // 중요 작업 후 즉시 동기화
    localStorage.setItem('customer_cart', JSON.stringify(updatedCart));
  };

  return { cart, addToCart, removeFromCart };
}
```

### 4.4 낙관적 업데이트 패턴

**구현 방식**:
```typescript
// src/hooks/useCreateOrder.ts
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onMutate: async (newOrder) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      // 이전 데이터 백업
      const previousOrders = queryClient.getQueryData(['orders']);

      // 낙관적 업데이트
      queryClient.setQueryData(['orders'], (old: Order[]) => [
        ...old,
        { ...newOrder, status: 'pending' }
      ]);

      return { previousOrders };
    },
    onError: (err, newOrder, context) => {
      // 에러 시 롤백
      queryClient.setQueryData(['orders'], context?.previousOrders);
    },
    onSettled: () => {
      // 완료 후 refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}
```

---

## 5. 사용성 패턴 (Usability Patterns)

### 5.1 국제화 (i18n) 패턴

**선택된 방식**: react-i18next + JSON 번역 파일

**구현 방식**:
```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko.json';
import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      zh: { translation: zh },
      ja: { translation: ja }
    },
    lng: 'ko',
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

// src/i18n/locales/ko.json
{
  "menu": {
    "title": "메뉴",
    "addToCart": "장바구니에 추가",
    "outOfStock": "품절"
  },
  "cart": {
    "title": "장바구니",
    "empty": "장바구니가 비어있습니다",
    "total": "총 금액",
    "checkout": "주문하기"
  }
}

// 사용 예시
import { useTranslation } from 'react-i18next';

function MenuBrowser() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('menu.title')}</h1>
      <button>{t('menu.addToCart')}</button>
    </div>
  );
}
```

### 5.2 접근성 (a11y) 패턴

**선택된 전략**: axe-core + 키보드 + 스크린 리더 테스트

**구현 방식**:
```typescript
// 시맨틱 HTML 사용
function MenuItem({ item }: { item: MenuItem }) {
  return (
    <article className="menu-item">
      <img src={item.imageUrl} alt={item.name} />
      <h2>{item.name}</h2>
      <p>{item.description}</p>
      <button 
        aria-label={`${item.name} 장바구니에 추가`}
        disabled={!item.isAvailable}
      >
        장바구니에 추가
      </button>
    </article>
  );
}

// 키보드 네비게이션
function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <div role="dialog" aria-modal="true">
      {children}
    </div>
  );
}

// axe-core 테스트
// src/tests/accessibility.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('MenuBrowser should have no accessibility violations', async () => {
  const { container } = render(<MenuBrowser />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 5.3 반응형 디자인 패턴

**구현 방식**:
```css
/* src/styles/responsive.css */
/* Mobile First */
.menu-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .menu-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 5.4 터치 인터랙션 패턴

**구현 방식**:
```css
/* 터치 타겟 크기 */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}

/* 터치 피드백 */
.button:active {
  transform: scale(0.95);
  background-color: var(--color-primary-dark);
}

/* 터치 간격 */
.button-group .button {
  margin: 8px;
}
```

---

## 6. 모니터링 및 로깅 패턴 (Monitoring Patterns)

### 6.1 에러 추적 패턴 (Sentry)

**선택된 범위**: 치명적 + 네트워크 + 비즈니스 로직 에러

**구현 방식**:
```typescript
// src/utils/monitoring.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0
});

export function logErrorToSentry(
  error: Error,
  context?: Record<string, any>
) {
  Sentry.captureException(error, {
    extra: context
  });
}

// Axios 인터셉터에서 사용
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status >= 500) {
      logErrorToSentry(error, {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status
      });
    }
    return Promise.reject(error);
  }
);
```

### 6.2 성능 모니터링 패턴 (Web Vitals)

**선택된 메트릭**: Core Web Vitals + TTI

**구현 방식**:
```typescript
// src/utils/performance.ts
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export function initPerformanceMonitoring() {
  onCLS(metric => sendToAnalytics('CLS', metric));
  onFCP(metric => sendToAnalytics('FCP', metric));
  onLCP(metric => sendToAnalytics('LCP', metric));
  onTTFB(metric => sendToAnalytics('TTFB', metric));
  onINP(metric => sendToAnalytics('INP', metric));
}

function sendToAnalytics(name: string, metric: any) {
  // Google Analytics로 전송
  if (window.gtag) {
    window.gtag('event', name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta
    });
  }
}
```

### 6.3 사용자 분석 패턴 (Google Analytics)

**선택된 범위**: 페이지 뷰 + 주요 이벤트 + 클릭 이벤트

**구현 방식**:
```typescript
// src/utils/analytics.ts
export function trackPageView(path: string) {
  if (window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: path
    });
  }
}

export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
}

// 사용 예시
function OrderConfirmation() {
  useEffect(() => {
    trackEvent('order_completed', 'ecommerce', 'customer_order');
  }, []);

  return <div>주문 완료</div>;
}
```

### 6.4 로깅 전략

**구현 방식**:
```typescript
// src/utils/logger.ts
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  info(message: string, data?: any) {
    console.info(`[INFO] ${message}`, data);
  }

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data);
  }

  error(message: string, error?: Error, data?: any) {
    console.error(`[ERROR] ${message}`, error, data);
    logErrorToSentry(error || new Error(message), data);
  }
}

export const logger = new Logger();
```

---

## 패턴 요약

| 카테고리 | 패턴 | 구현 방식 |
|---------|------|----------|
| 복원력 | 에러 경계 | 최상위 1개 |
| 복원력 | 재시도 로직 | 지수 백오프 (3회) |
| 복원력 | 오프라인 복구 | 자동 동기화 |
| 성능 | 코드 스플리팅 | 라우트 + 컴포넌트 + 라이브러리 |
| 성능 | 이미지 로딩 | Intersection Observer + 플레이스홀더 |
| 성능 | 캐싱 | staleTime: 5분, cacheTime: 10분 |
| 보안 | 암호화 | JWT + 세션 데이터 |
| 보안 | API 서명 | 모든 요청 |
| 보안 | CSP | 표준 (도메인 제한) |
| 상태 관리 | Context 분리 | Auth, Cart, UI |
| 상태 관리 | localStorage 동기화 | 중요 작업 후 |
| 사용성 | 국제화 | react-i18next + JSON |
| 사용성 | 접근성 | axe-core + 키보드 + 스크린 리더 |
| 모니터링 | 에러 로깅 | 치명적 + 네트워크 + 비즈니스 로직 |
| 모니터링 | 성능 메트릭 | Core Web Vitals + TTI |
| 모니터링 | 사용자 분석 | 페이지 뷰 + 이벤트 + 클릭 |

**총 패턴 수**: 16개 주요 패턴
