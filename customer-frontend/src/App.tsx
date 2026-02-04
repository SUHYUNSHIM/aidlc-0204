import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { UIProvider } from '@/contexts/UIContext';
import { MenuBrowser } from '@/pages/MenuBrowser';
import { Cart } from '@/pages/Cart';
import { OrderConfirmation } from '@/pages/OrderConfirmation';
import { OrderHistory } from '@/pages/OrderHistory';
import { CustomerLogin } from '@/pages/CustomerLogin';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <UIProvider>
              <BrowserRouter>
                <Routes>
                  {/* 기본 경로는 로그인 페이지 */}
                  <Route path="/" element={<CustomerLogin />} />
                  <Route path="/customer/login" element={<CustomerLogin />} />
                  <Route path="/customer/menu" element={<MenuBrowser />} />
                  <Route path="/customer/cart" element={<Cart />} />
                  <Route path="/customer/order-confirmation/:orderId" element={<OrderConfirmation />} />
                  <Route path="/customer/order-history" element={<OrderHistory />} />
                  {/* 잘못된 경로는 로그인으로 리다이렉트 */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </UIProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
