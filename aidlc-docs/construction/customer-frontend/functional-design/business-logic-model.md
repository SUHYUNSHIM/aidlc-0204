# Customer Frontend - 비즈니스 로직 모델

## 개요
이 문서는 customer-frontend 유닛의 상세 비즈니스 로직, 알고리즘, 워크플로우를 정의합니다.

---

## 1. 인증 및 세션 관리 로직

### 1.1 자동 로그인 로직

**목적**: 테이블 태블릿에서 저장된 인증 정보로 자동 로그인

**알고리즘**:
```typescript
async function autoLogin(): Promise<CustomerSession | null> {
  const token = localStorage.getItem('customer_auth_token');
  const session = localStorage.getItem('customer_session');
  
  if (!token || !session) {
    return null;
  }
  
  const parsedSession = JSON.parse(session);
  
  // 세션 유효성 검증
  if (!validateSession(parsedSession)) {
    // 세션 만료 시 자동 연장 시도
    return await extendSession(parsedSession);
  }
  
  return parsedSession;
}
```

**재시도 로직** (지수 백오프):
```typescript
async function autoLoginWithRetry(
  maxRetries: number = 3
): Promise<CustomerSession | null> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const session = await autoLogin();
      if (session) return session;
      
      // 실패 시 지수 백오프
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await sleep(delay);
      attempt++;
    } catch (error) {
      console.error('Auto-login failed:', error);
      attempt++;
    }
  }
  
  // 모든 재시도 실패 시 로그인 화면으로 리다이렉트
  return null;
}
```

### 1.2 수동 로그인 로직

**목적**: 테이블 초기 설정 시 수동 로그인

**입력**:
- `storeId`: 매장 식별자
- `tableNumber`: 테이블 번호
- `tablePassword`: 테이블 비밀번호

**알고리즘**:
```typescript
async function manualLogin(
  storeId: string,
  tableNumber: string,
  tablePassword: string
): Promise<CustomerSession> {
  // 1. 입력 검증
  if (!storeId || !tableNumber || !tablePassword) {
    throw new Error('모든 필드를 입력해주세요');
  }
  
  // 2. API 호출
  const response = await axios.post('/customer/login', {
    store_id: storeId,
    table_number: tableNumber,
    table_password: tablePassword
  });
  
  // 3. 세션 생성
  const session: CustomerSession = {
    tableId: response.data.table_id,
    tableName: response.data.table_name,
    storeId: response.data.store_id,
    storeName: response.data.store_name,
    authToken: response.data.token,
    sessionId: response.data.session_id,
    expiresAt: response.data.expires_at,
    isActive: true
  };
  
  // 4. localStorage 저장
  localStorage.setItem('customer_auth_token', session.authToken);
  localStorage.setItem('customer_session', JSON.stringify(session));
  
  return session;
}
```

### 1.3 세션 연장 로직

**목적**: 세션 만료 시 자동 연장

**알고리즘**:
```typescript
async function extendSession(
  currentSession: CustomerSession
): Promise<CustomerSession> {
  try {
    // API 호출하여 세션 연장
    const response = await axios.post('/customer/extend-session', {
      session_id: currentSession.sessionId
    }, {
      headers: { Authorization: `Bearer ${currentSession.authToken}` }
    });
    
    // 새로운 만료 시각으로 업데이트
    const updatedSession = {
      ...currentSession,
      expiresAt: response.data.expires_at
    };
    
    localStorage.setItem('customer_session', JSON.stringify(updatedSession));
    
    return updatedSession;
  } catch (error) {
    // 연장 실패 시 로그아웃
    logout();
    throw error;
  }
}
```

---

## 2. 장바구니 관리 로직

### 2.1 장바구니 항목 추가 로직

**목적**: 메뉴를 장바구니에 추가 (중복 시 수량 증가)

**입력**:
- `menuItem`: MenuItem
- `quantity`: number (기본값 1)

**알고리즘**:
```typescript
function addToCart(
  cart: Cart,
  menuItem: MenuItem,
  quantity: number = 1
): Cart {
  // 1. 메뉴 가용성 검증
  if (!menuItem.isAvailable) {
    throw new Error('품절된 메뉴입니다');
  }
  
  // 2. 기존 항목 찾기
  const existingItemIndex = cart.items.findIndex(
    item => item.menuId === menuItem.id
  );
  
  let updatedItems: CartItem[];
  
  if (existingItemIndex >= 0) {
    // 3a. 기존 항목 수량 증가
    const existingItem = cart.items[existingItemIndex];
    const newQuantity = existingItem.quantity + quantity;
    
    // 최대 수량 검증
    if (newQuantity > 10) {
      throw new Error('최대 수량은 10개입니다');
    }
    
    updatedItems = [...cart.items];
    updatedItems[existingItemIndex] = {
      ...existingItem,
      quantity: newQuantity
    };
  } else {
    // 3b. 새 항목 추가
    const newItem = menuItemToCartItem(menuItem, quantity);
    updatedItems = [...cart.items, newItem];
  }
  
  // 4. 장바구니 업데이트
  const updatedCart: Cart = {
    items: updatedItems,
    lastUpdated: new Date().toISOString()
  };
  
  // 5. localStorage 저장
  saveCartToLocalStorage(updatedCart);
  
  return updatedCart;
}
```

### 2.2 장바구니 항목 수량 변경 로직

**목적**: 장바구니 항목의 수량 증가/감소

**알고리즘**:
```typescript
function updateCartItemQuantity(
  cart: Cart,
  menuId: string,
  delta: number  // +1 또는 -1
): Cart {
  const itemIndex = cart.items.findIndex(item => item.menuId === menuId);
  
  if (itemIndex < 0) {
    throw new Error('항목을 찾을 수 없습니다');
  }
  
  const item = cart.items[itemIndex];
  const newQuantity = item.quantity + delta;
  
  let updatedItems: CartItem[];
  
  if (newQuantity <= 0) {
    // 수량이 0 이하면 항목 제거
    updatedItems = cart.items.filter((_, index) => index !== itemIndex);
  } else if (newQuantity > 10) {
    // 최대 수량 초과
    throw new Error('최대 수량은 10개입니다');
  } else {
    // 수량 업데이트
    updatedItems = [...cart.items];
    updatedItems[itemIndex] = {
      ...item,
      quantity: newQuantity
    };
  }
  
  const updatedCart: Cart = {
    items: updatedItems,
    lastUpdated: new Date().toISOString()
  };
  
  saveCartToLocalStorage(updatedCart);
  
  return updatedCart;
}
```

### 2.3 장바구니 항목 제거 로직

**목적**: 장바구니에서 특정 항목 제거

**알고리즘**:
```typescript
function removeFromCart(cart: Cart, menuId: string): Cart {
  const updatedItems = cart.items.filter(item => item.menuId !== menuId);
  
  const updatedCart: Cart = {
    items: updatedItems,
    lastUpdated: new Date().toISOString()
  };
  
  saveCartToLocalStorage(updatedCart);
  
  return updatedCart;
}
```

### 2.4 장바구니 비우기 로직

**목적**: 장바구니의 모든 항목 제거

**알고리즘**:
```typescript
function clearCart(): Cart {
  const emptyCart: Cart = {
    items: [],
    lastUpdated: new Date().toISOString()
  };
  
  saveCartToLocalStorage(emptyCart);
  
  return emptyCart;
}
```

### 2.5 장바구니 총액 계산 로직

**목적**: 장바구니의 총 금액 및 항목 수 계산

**알고리즘**:
```typescript
function calculateCartTotals(cart: Cart): {
  totalItems: number;
  totalAmount: number;
} {
  const totalItems = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  
  const totalAmount = cart.items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );
  
  return { totalItems, totalAmount };
}
```

### 2.6 localStorage 용량 관리 로직

**목적**: localStorage 용량 초과 시 가장 오래된 항목 제거

**알고리즘**:
```typescript
function saveCartToLocalStorage(cart: Cart): void {
  try {
    localStorage.setItem('customer_cart', JSON.stringify(cart));
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // 가장 오래된 항목 제거
      const sortedItems = [...cart.items].sort(
        (a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
      );
      
      if (sortedItems.length > 0) {
        const updatedCart: Cart = {
          items: sortedItems.slice(1), // 첫 번째 항목 제거
          lastUpdated: new Date().toISOString()
        };
        
        // 재시도
        localStorage.setItem('customer_cart', JSON.stringify(updatedCart));
      }
    } else {
      throw error;
    }
  }
}
```

---

## 3. 메뉴 탐색 및 필터링 로직

### 3.1 메뉴 조회 로직

**목적**: 서버에서 메뉴 목록 조회 (React Query 캐싱)

**알고리즘**:
```typescript
async function fetchMenus(storeId: string): Promise<MenuItem[]> {
  const response = await axios.get('/customer/menus', {
    params: { store_id: storeId },
    headers: { Authorization: `Bearer ${getAuthToken()}` }
  });
  
  return response.data.menus;
}

// React Query 설정
const { data: menus, isLoading, error } = useQuery(
  ['menus', storeId],
  () => fetchMenus(storeId),
  {
    staleTime: 5 * 60 * 1000,  // 5분
    cacheTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  }
);
```

### 3.2 카테고리별 필터링 로직

**목적**: 선택한 카테고리의 메뉴만 표시

**알고리즘**:
```typescript
function filterMenusByCategory(
  menus: MenuItem[],
  categoryId: string | null
): MenuItem[] {
  if (!categoryId) {
    // 카테고리 선택 안 함 → 모든 메뉴 표시
    return menus;
  }
  
  return menus.filter(menu => menu.categoryId === categoryId);
}
```

### 3.3 가용성 필터링 로직

**목적**: 품절 메뉴 표시 및 주문 방지

**알고리즘**:
```typescript
function filterAvailableMenus(menus: MenuItem[]): MenuItem[] {
  return menus.filter(menu => menu.isAvailable);
}

function isMenuOrderable(menu: MenuItem): boolean {
  return menu.isAvailable;
}
```

### 3.4 메뉴 정렬 로직

**목적**: displayOrder에 따라 메뉴 정렬

**알고리즘**:
```typescript
function sortMenus(menus: MenuItem[]): MenuItem[] {
  return [...menus].sort((a, b) => a.displayOrder - b.displayOrder);
}
```

---

## 4. 주문 생성 로직

### 4.1 주문 검증 로직

**목적**: 주문 제출 전 검증

**알고리즘**:
```typescript
function validateOrderSubmission(
  cart: Cart,
  session: CustomerSession
): { valid: boolean; error?: string } {
  // 1. 장바구니 비어있음 검증
  if (cart.items.length === 0) {
    return { valid: false, error: '장바구니가 비어있습니다' };
  }
  
  // 2. 세션 유효성 검증
  if (!validateSession(session)) {
    return { valid: false, error: '세션이 만료되었습니다' };
  }
  
  // 3. 항목 수량 검증
  for (const item of cart.items) {
    if (item.quantity < 1 || item.quantity > 10) {
      return { valid: false, error: '유효하지 않은 수량입니다' };
    }
  }
  
  return { valid: true };
}
```

### 4.2 주문 생성 워크플로우

**목적**: 장바구니를 주문으로 변환하여 서버에 제출

**알고리즘**:
```typescript
async function createOrder(
  cart: Cart,
  session: CustomerSession
): Promise<Order> {
  // 1. 검증
  const validation = validateOrderSubmission(cart, session);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // 2. 현재 메뉴 가격 조회 (가격 변경 대응)
  const menuIds = cart.items.map(item => item.menuId);
  const currentMenus = await fetchMenusByIds(menuIds);
  
  // 3. OrderItem 생성 (현재 가격 사용)
  const orderItems = cart.items.map(cartItem => {
    const currentMenu = currentMenus.find(m => m.id === cartItem.menuId);
    const currentPrice = currentMenu?.price || cartItem.price;
    
    return cartItemToOrderItem(cartItem, currentPrice);
  });
  
  // 4. 총액 계산
  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );
  
  // 5. API 호출
  const response = await axios.post('/customer/orders', {
    table_id: session.tableId,
    session_id: session.sessionId,
    items: orderItems,
    total_amount: totalAmount
  }, {
    headers: { Authorization: `Bearer ${session.authToken}` }
  });
  
  // 6. Order 객체 생성
  const order: Order = {
    orderId: response.data.order_id,
    tableId: session.tableId,
    sessionId: session.sessionId,
    items: orderItems,
    totalAmount: totalAmount,
    status: response.data.status,
    createdAt: response.data.created_at,
    estimatedPrepTime: response.data.estimated_prep_time
  };
  
  // 7. 장바구니 비우기
  clearCart();
  
  return order;
}
```

### 4.3 주문 생성 재시도 로직 (네트워크 에러)

**목적**: 네트워크 에러 시 지수 백오프로 자동 재시도

**알고리즘**:
```typescript
async function createOrderWithRetry(
  cart: Cart,
  session: CustomerSession,
  maxRetries: number = 3
): Promise<Order> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await createOrder(cart, session);
    } catch (error) {
      if (isNetworkError(error) && attempt < maxRetries - 1) {
        // 네트워크 에러 시 재시도
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await sleep(delay);
        attempt++;
      } else {
        // 다른 에러 또는 최대 재시도 초과 시 에러 throw
        throw error;
      }
    }
  }
  
  throw new Error('주문 생성 실패: 최대 재시도 횟수 초과');
}
```

---

## 5. 주문 내역 조회 로직

### 5.1 주문 내역 조회 로직

**목적**: 현재 테이블 세션의 주문 내역 조회

**알고리즘**:
```typescript
async function fetchOrderHistory(
  session: CustomerSession
): Promise<Order[]> {
  const response = await axios.get('/customer/orders', {
    params: {
      table_id: session.tableId,
      session_id: session.sessionId
    },
    headers: { Authorization: `Bearer ${session.authToken}` }
  });
  
  return response.data.orders;
}
```

### 5.2 주문 상태 폴링 로직

**목적**: 5분마다 주문 상태 업데이트

**알고리즘**:
```typescript
function useOrderStatusPolling(
  session: CustomerSession,
  enabled: boolean = true
) {
  return useQuery(
    ['orders', session.sessionId],
    () => fetchOrderHistory(session),
    {
      enabled: enabled,
      refetchInterval: 5 * 60 * 1000, // 5분
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true
    }
  );
}
```

---

## 6. 에러 처리 로직

### 6.1 네트워크 에러 감지

**알고리즘**:
```typescript
function isNetworkError(error: any): boolean {
  return (
    error.code === 'ECONNABORTED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ENETUNREACH' ||
    error.message === 'Network Error'
  );
}
```

### 6.2 인증 에러 처리

**알고리즘**:
```typescript
function handleAuthError(error: any): void {
  if (error.response?.status === 401) {
    // 인증 실패 → 로그아웃 및 로그인 화면으로 리다이렉트
    logout();
    window.location.href = '/customer/login';
  }
}
```

### 6.3 전역 에러 핸들러

**알고리즘**:
```typescript
axios.interceptors.response.use(
  response => response,
  error => {
    // 인증 에러 처리
    handleAuthError(error);
    
    // 네트워크 에러 로깅
    if (isNetworkError(error)) {
      console.error('Network error:', error);
    }
    
    return Promise.reject(error);
  }
);
```

---

## 7. UI 상태 관리 로직

### 7.1 로딩 상태 관리

**알고리즘**:
```typescript
interface LoadingState {
  isLoading: boolean;
  operation: string | null;
}

function useLoadingState() {
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    operation: null
  });
  
  const startLoading = (operation: string) => {
    setLoading({ isLoading: true, operation });
  };
  
  const stopLoading = () => {
    setLoading({ isLoading: false, operation: null });
  };
  
  return { loading, startLoading, stopLoading };
}
```

### 7.2 토스트 알림 로직

**알고리즘**:
```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  duration: number = 3000
): void {
  const toast: Toast = {
    id: generateId(),
    message,
    type,
    duration
  };
  
  // 토스트 표시
  addToastToQueue(toast);
  
  // duration 후 자동 제거
  setTimeout(() => {
    removeToastFromQueue(toast.id);
  }, duration);
}
```

---

## 8. 주문 확인 화면 자동 리다이렉트 로직

**목적**: 주문 완료 5초 후 메뉴 화면으로 자동 이동

**알고리즘**:
```typescript
function useAutoRedirect(
  enabled: boolean,
  delay: number = 5000,
  redirectPath: string = '/customer/menu'
): void {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!enabled) return;
    
    const timer = setTimeout(() => {
      navigate(redirectPath);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [enabled, delay, redirectPath, navigate]);
}
```

---

## 요약

이 비즈니스 로직 모델은 customer-frontend의 핵심 알고리즘을 정의하며, 다음을 포함합니다:

1. **인증 및 세션 관리**: 자동 로그인, 수동 로그인, 세션 연장
2. **장바구니 관리**: 추가, 수량 변경, 제거, 비우기, 총액 계산
3. **메뉴 탐색**: 조회, 필터링, 정렬
4. **주문 생성**: 검증, 생성, 재시도
5. **주문 내역**: 조회, 상태 폴링
6. **에러 처리**: 네트워크 에러, 인증 에러
7. **UI 상태 관리**: 로딩, 토스트 알림
8. **자동 리다이렉트**: 주문 완료 후 자동 이동
