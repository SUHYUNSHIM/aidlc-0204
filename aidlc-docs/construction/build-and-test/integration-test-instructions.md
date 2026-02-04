# Integration Test Instructions - Customer Frontend

## 통합 테스트 개요
통합 테스트는 여러 컴포넌트와 서비스가 함께 작동하는지 확인합니다.

---

## 1. 통합 테스트 시나리오

### 1.1 로그인 → 메뉴 조회 플로우
**목적**: 사용자가 로그인 후 메뉴를 조회할 수 있는지 확인

**테스트 파일**: `src/tests/integration/login-menu-flow.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';
import * as authService from '@/api/authService';
import * as menuService from '@/api/menuService';

describe('Login → Menu Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should login and display menus', async () => {
    // Mock API responses
    vi.spyOn(authService, 'login').mockResolvedValue({
      token: 'test-token',
      table_id: 'table-1',
      table_name: 'Table 1',
      store_id: 'store-1',
      store_name: 'Test Store',
      session_id: 'session-1',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    });

    vi.spyOn(menuService, 'fetchMenus').mockResolvedValue([
      {
        id: '1',
        name: 'Pizza',
        price: 15000,
        description: 'Delicious pizza',
        categoryId: 'cat1',
        categoryName: 'Main',
        displayOrder: 1,
        isAvailable: true,
      },
    ]);

    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // 1. 로그인 폼 입력
    await user.type(screen.getByLabelText(/매장 ID/i), 'store-1');
    await user.type(screen.getByLabelText(/테이블 번호/i), '1');
    await user.type(screen.getByLabelText(/테이블 비밀번호/i), 'password');
    
    // 2. 로그인 버튼 클릭
    await user.click(screen.getByRole('button', { name: /로그인/i }));

    // 3. 메뉴 페이지로 이동 확인
    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
    });

    // 4. API 호출 확인
    expect(authService.login).toHaveBeenCalledWith({
      storeId: 'store-1',
      tableNumber: '1',
      tablePassword: 'password',
    });
    expect(menuService.fetchMenus).toHaveBeenCalledWith('store-1');
  });
});
```

---

### 1.2 메뉴 추가 → 장바구니 → 주문 플로우
**목적**: 메뉴를 장바구니에 추가하고 주문할 수 있는지 확인

**테스트 파일**: `src/tests/integration/menu-cart-order-flow.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import MenuBrowser from '@/pages/MenuBrowser';
import Cart from '@/pages/Cart';
import * as menuService from '@/api/menuService';
import * as orderService from '@/api/orderService';

describe('Menu → Cart → Order Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock session
    localStorage.setItem('customer_session', JSON.stringify({
      tableId: 'table-1',
      tableName: 'Table 1',
      storeId: 'store-1',
      storeName: 'Test Store',
      authToken: 'test-token',
      sessionId: 'session-1',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      isActive: true,
    }));
  });

  it('should add menu to cart and create order', async () => {
    // Mock API responses
    vi.spyOn(menuService, 'fetchMenus').mockResolvedValue([
      {
        id: '1',
        name: 'Pizza',
        price: 15000,
        description: 'Delicious pizza',
        categoryId: 'cat1',
        categoryName: 'Main',
        displayOrder: 1,
        isAvailable: true,
      },
    ]);

    vi.spyOn(orderService, 'createOrder').mockResolvedValue({
      orderId: 'order-1',
      tableId: 'table-1',
      sessionId: 'session-1',
      items: [
        {
          menuId: '1',
          name: 'Pizza',
          price: 15000,
          quantity: 2,
          subtotal: 30000,
        },
      ],
      totalAmount: 30000,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const user = userEvent.setup();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <MenuBrowser />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // 1. 메뉴 로딩 대기
    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
    });

    // 2. 장바구니에 추가 (2번)
    const addButton = screen.getByRole('button', { name: /장바구니에 추가/i });
    await user.click(addButton);
    await user.click(addButton);

    // 3. 장바구니 페이지로 이동
    rerender(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <Cart />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // 4. 장바구니 내용 확인
    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // quantity
    });

    // 5. 주문하기 버튼 클릭
    const checkoutButton = screen.getByRole('button', { name: /주문하기/i });
    await user.click(checkoutButton);

    // 6. 주문 생성 API 호출 확인
    await waitFor(() => {
      expect(orderService.createOrder).toHaveBeenCalledWith({
        tableId: 'table-1',
        sessionId: 'session-1',
        items: expect.arrayContaining([
          expect.objectContaining({
            menuId: '1',
            quantity: 2,
          }),
        ]),
        totalAmount: 30000,
      });
    });
  });
});
```

---

### 1.3 오프라인 → 온라인 복구 플로우
**목적**: 네트워크 연결이 끊겼다가 복구될 때 자동으로 재시도하는지 확인

**테스트 파일**: `src/tests/integration/offline-recovery.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import MenuBrowser from '@/pages/MenuBrowser';
import * as menuService from '@/api/menuService';

describe('Offline → Online Recovery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    vi.clearAllMocks();
    
    // Mock session
    localStorage.setItem('customer_session', JSON.stringify({
      tableId: 'table-1',
      storeId: 'store-1',
      sessionId: 'session-1',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      isActive: true,
    }));
  });

  it('should refetch data when coming back online', async () => {
    const fetchMenusSpy = vi.spyOn(menuService, 'fetchMenus')
      .mockResolvedValue([
        {
          id: '1',
          name: 'Pizza',
          price: 15000,
          description: 'Delicious',
          categoryId: 'cat1',
          categoryName: 'Main',
          displayOrder: 1,
          isAvailable: true,
        },
      ]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <MenuBrowser />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // 1. 초기 로딩
    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
    });

    expect(fetchMenusSpy).toHaveBeenCalledTimes(1);

    // 2. 오프라인 시뮬레이션
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    window.dispatchEvent(new Event('offline'));

    // 3. 온라인 복구
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    window.dispatchEvent(new Event('online'));

    // 4. 자동 refetch 확인
    await waitFor(() => {
      expect(fetchMenusSpy).toHaveBeenCalledTimes(2);
    });
  });
});
```

---

## 2. 통합 테스트 실행

### 2.1 통합 테스트만 실행
```bash
npm run test -- --run integration
```

### 2.2 모든 테스트 실행 (단위 + 통합)
```bash
npm run test
```

---

## 3. E2E 테스트 (선택 사항)

### 3.1 Playwright 설치
```bash
npm install -D @playwright/test
npx playwright install
```

### 3.2 E2E 테스트 예시
`e2e/customer-journey.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('complete customer journey', async ({ page }) => {
  // 1. 로그인 페이지 접속
  await page.goto('http://localhost:5173/customer/login');

  // 2. 로그인
  await page.fill('input[id="storeId"]', 'store-1');
  await page.fill('input[id="tableNumber"]', '1');
  await page.fill('input[id="tablePassword"]', 'password');
  await page.click('button[type="submit"]');

  // 3. 메뉴 페이지 확인
  await expect(page).toHaveURL(/\/customer\/menu/);
  await expect(page.locator('h1')).toContainText('메뉴');

  // 4. 메뉴 추가
  await page.click('button:has-text("장바구니에 추가")');

  // 5. 장바구니 페이지로 이동
  await page.goto('http://localhost:5173/customer/cart');

  // 6. 주문하기
  await page.click('button:has-text("주문하기")');

  // 7. 주문 확인 페이지
  await expect(page).toHaveURL(/\/customer\/order-confirmation/);
  await expect(page.locator('h1')).toContainText('주문이 완료되었습니다');
});
```

### 3.3 E2E 테스트 실행
```bash
npx playwright test
```

---

## 통합 테스트 성공 기준
- ✅ 모든 통합 테스트 통과
- ✅ API 모킹 정상 작동
- ✅ 컴포넌트 간 상호작용 정상
- ✅ 상태 관리 정상 작동
- ✅ 라우팅 정상 작동

---

**작성일**: 2026-02-04
**작성자**: AI-DLC System
