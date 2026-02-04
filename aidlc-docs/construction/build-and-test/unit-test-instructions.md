# Unit Test Instructions - Customer Frontend

## 테스트 프레임워크
- **테스트 러너**: Vitest
- **테스트 라이브러리**: React Testing Library
- **모킹**: Vitest mocks

---

## 1. 테스트 환경 설정

### 1.1 테스트 의존성 설치
```bash
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @testing-library/react-hooks
```

### 1.2 Vitest 설정 파일 생성
`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 1.3 테스트 설정 파일 업데이트
`src/tests/setup.ts`에 추가:
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 각 테스트 후 자동 cleanup
afterEach(() => {
  cleanup();
});

// localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// navigator.onLine mock
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true,
});
```

---

## 2. Utils Layer 테스트

### 2.1 encryption.ts 테스트
`src/tests/utils/encryption.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, secureStorage } from '@/utils/encryption';

describe('encryption utils', () => {
  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const data = 'sensitive-data';
      const encrypted = encrypt(data);
      const decrypted = decrypt(encrypted);
      
      expect(encrypted).not.toBe(data);
      expect(decrypted).toBe(data);
    });
  });

  describe('secureStorage', () => {
    it('should store and retrieve encrypted data', () => {
      const key = 'test-key';
      const value = { token: 'abc123' };
      
      secureStorage.setItem(key, value);
      const retrieved = secureStorage.getItem(key);
      
      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', () => {
      const result = secureStorage.getItem('non-existent');
      expect(result).toBeNull();
    });
  });
});
```

### 2.2 validation.ts 테스트
`src/tests/utils/validation.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { validateMenuItem, validateCartItem } from '@/utils/validation';
import type { MenuItem, CartItem } from '@/types/entities';

describe('validation utils', () => {
  describe('validateMenuItem', () => {
    it('should validate valid menu item', () => {
      const item: MenuItem = {
        id: '1',
        name: 'Pizza',
        price: 15000,
        description: 'Delicious',
        categoryId: 'cat1',
        categoryName: 'Main',
        displayOrder: 1,
        isAvailable: true,
      };
      
      expect(validateMenuItem(item)).toBe(true);
    });

    it('should reject invalid menu item', () => {
      const item = { id: '1' } as MenuItem;
      expect(validateMenuItem(item)).toBe(false);
    });
  });

  describe('validateCartItem', () => {
    it('should validate cart item with valid quantity', () => {
      const item: CartItem = {
        menuId: '1',
        name: 'Pizza',
        price: 15000,
        quantity: 2,
        addedAt: new Date().toISOString(),
      };
      
      expect(validateCartItem(item)).toBe(true);
    });

    it('should reject cart item with invalid quantity', () => {
      const item: CartItem = {
        menuId: '1',
        name: 'Pizza',
        price: 15000,
        quantity: 0,
        addedAt: new Date().toISOString(),
      };
      
      expect(validateCartItem(item)).toBe(false);
    });
  });
});
```

### 2.3 retry.ts 테스트
`src/tests/utils/retry.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { retryWithBackoff, isNetworkError } from '@/utils/retry';

describe('retry utils', () => {
  describe('retryWithBackoff', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, 3, [10, 20, 30]);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(retryWithBackoff(fn, 2, [10, 20])).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  describe('isNetworkError', () => {
    it('should detect network errors', () => {
      const error = { code: 'ECONNREFUSED' };
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for non-network errors', () => {
      const error = new Error('Regular error');
      expect(isNetworkError(error)).toBe(false);
    });
  });
});
```

---

## 3. Services Layer 테스트

### 3.1 cartService.ts 테스트
`src/tests/services/cartService.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  addToCartLogic,
  updateQuantityLogic,
  removeFromCartLogic,
  calculateCartTotals,
} from '@/services/cartService';
import type { Cart, MenuItem } from '@/types/entities';

describe('cartService', () => {
  const mockMenuItem: MenuItem = {
    id: '1',
    name: 'Pizza',
    price: 15000,
    description: 'Delicious',
    categoryId: 'cat1',
    categoryName: 'Main',
    displayOrder: 1,
    isAvailable: true,
  };

  describe('addToCartLogic', () => {
    it('should add new item to empty cart', () => {
      const cart: Cart = { items: [], lastUpdated: '' };
      const result = addToCartLogic(cart, mockMenuItem, 2);
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(2);
    });

    it('should increase quantity for existing item', () => {
      const cart: Cart = {
        items: [
          {
            menuId: '1',
            name: 'Pizza',
            price: 15000,
            quantity: 1,
            addedAt: new Date().toISOString(),
          },
        ],
        lastUpdated: '',
      };
      
      const result = addToCartLogic(cart, mockMenuItem, 2);
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(3);
    });

    it('should throw error for unavailable item', () => {
      const cart: Cart = { items: [], lastUpdated: '' };
      const unavailableItem = { ...mockMenuItem, isAvailable: false };
      
      expect(() => addToCartLogic(cart, unavailableItem, 1)).toThrow();
    });
  });

  describe('updateQuantityLogic', () => {
    it('should increase quantity', () => {
      const cart: Cart = {
        items: [
          {
            menuId: '1',
            name: 'Pizza',
            price: 15000,
            quantity: 2,
            addedAt: new Date().toISOString(),
          },
        ],
        lastUpdated: '',
      };
      
      const result = updateQuantityLogic(cart, '1', 1);
      expect(result.items[0].quantity).toBe(3);
    });

    it('should remove item when quantity becomes 0', () => {
      const cart: Cart = {
        items: [
          {
            menuId: '1',
            name: 'Pizza',
            price: 15000,
            quantity: 1,
            addedAt: new Date().toISOString(),
          },
        ],
        lastUpdated: '',
      };
      
      const result = updateQuantityLogic(cart, '1', -1);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('calculateCartTotals', () => {
    it('should calculate totals correctly', () => {
      const cart: Cart = {
        items: [
          {
            menuId: '1',
            name: 'Pizza',
            price: 15000,
            quantity: 2,
            addedAt: new Date().toISOString(),
          },
          {
            menuId: '2',
            name: 'Pasta',
            price: 12000,
            quantity: 1,
            addedAt: new Date().toISOString(),
          },
        ],
        lastUpdated: '',
      };
      
      const totals = calculateCartTotals(cart);
      
      expect(totals.totalItems).toBe(3);
      expect(totals.totalAmount).toBe(42000);
    });
  });
});
```

---

## 4. Hooks 테스트

### 4.1 useOnlineStatus.ts 테스트
`src/tests/hooks/useOnlineStatus.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

describe('useOnlineStatus', () => {
  it('should return initial online status', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('should update status on offline event', () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current).toBe(false);
  });

  it('should update status on online event', () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });
    
    expect(result.current).toBe(true);
  });
});
```

---

## 5. Components 테스트

### 5.1 LazyImage.tsx 테스트
`src/tests/components/LazyImage.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LazyImage } from '@/components/common/LazyImage';

describe('LazyImage', () => {
  it('should render image with alt text', () => {
    render(<LazyImage src="/test.jpg" alt="Test Image" />);
    const img = screen.getByAltText('Test Image');
    expect(img).toBeInTheDocument();
  });

  it('should use placeholder initially', () => {
    render(
      <LazyImage
        src="/test.jpg"
        alt="Test Image"
        placeholder="/placeholder.jpg"
      />
    );
    const img = screen.getByAltText('Test Image') as HTMLImageElement;
    expect(img.src).toContain('placeholder.jpg');
  });
});
```

---

## 6. 테스트 실행

### 6.1 모든 테스트 실행
```bash
npm run test
```

### 6.2 Watch 모드
```bash
npm run test:watch
```

### 6.3 커버리지 리포트
```bash
npm run test:coverage
```

**예상 출력**:
```
Test Files  15 passed (15)
     Tests  52 passed (52)
  Start at  17:30:00
  Duration  2.5s

 % Coverage report from v8
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   85.2  |   78.5   |   90.1  |   85.2  |
 utils/             |   92.3  |   85.7   |   95.0  |   92.3  |
 services/          |   88.5  |   82.1   |   90.0  |   88.5  |
 hooks/             |   80.2  |   72.3   |   85.5  |   80.2  |
 components/        |   75.8  |   68.9   |   82.0  |   75.8  |
--------------------|---------|----------|---------|---------|
```

---

## 7. package.json 스크립트 추가

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 테스트 성공 기준
- ✅ 모든 테스트 통과 (52/52)
- ✅ 커버리지 80% 이상
- ✅ 에러 없음
- ✅ 경고 없음

---

**작성일**: 2026-02-04
**작성자**: AI-DLC System
