import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { Navigation } from '@/components/common/Navigation';
import { formatCurrency } from '@/utils/format';
import { validateOrderSubmission } from '@/services/orderService';
import type { CreateOrderInput } from '@/types/entities';

export function Cart(): JSX.Element {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart, totals } = useCart();
  const createOrderMutation = useCreateOrder();

  // 인증 체크
  if (!isAuthenticated) {
    navigate('/customer/login');
    return <div className="loading">로그인 페이지로 이동 중...</div>;
  }

  const handleCheckout = async () => {
    if (!session) {
      alert('로그인이 필요합니다.');
      navigate('/customer/login');
      return;
    }

    // 주문 검증
    const validation = validateOrderSubmission(cart, session);
    if (!validation.valid) {
      alert(validation.error || '주문을 제출할 수 없습니다.');
      return;
    }

    // 주문 생성
    const orderInput: CreateOrderInput = {
      tableId: session.tableId,
      sessionId: session.sessionId,
      items: cart.items.map((item) => ({
        menuId: item.menuId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
      totalAmount: totals.totalAmount,
    };

    try {
      const order = await createOrderMutation.mutateAsync(orderInput);
      clearCart();
      navigate(`/customer/order-confirmation/${order.orderId}`);
    } catch (error) {
      console.error('주문 생성 실패:', error);
      alert('주문 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (cart.items.length === 0) {
    return (
      <>
        <Navigation />
        <div className="cart-empty">
          <h2>장바구니가 비어있습니다</h2>
          <button onClick={() => navigate('/customer/menu')}>
            메뉴 보러가기
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="cart">
      <h1>장바구니</h1>

      <div className="cart-items">
        {cart.items.map((item) => (
          <div key={item.menuId} className="cart-item">
            <div className="item-info">
              <h3>{item.name}</h3>
              <p className="price">{formatCurrency(item.price)}</p>
            </div>

            <div className="quantity-controls">
              <button onClick={() => updateQuantity(item.menuId, -1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.menuId, 1)}>+</button>
            </div>

            <div className="item-total">
              {formatCurrency(item.price * item.quantity)}
            </div>

            <button
              className="remove-btn"
              onClick={() => removeFromCart(item.menuId)}
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>총 수량:</span>
          <span>{totals.totalItems}개</span>
        </div>
        <div className="summary-row total">
          <span>총 금액:</span>
          <span>{formatCurrency(totals.totalAmount)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <button onClick={() => navigate('/customer/menu')}>
          계속 쇼핑하기
        </button>
        <button
          className="clear-cart-btn"
          onClick={() => {
            if (window.confirm('장바구니를 비우시겠습니까?')) {
              clearCart();
            }
          }}
        >
          장바구니 비우기
        </button>
        <button
          className="checkout-btn"
          onClick={handleCheckout}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? '주문 중...' : '주문하기'}
        </button>
      </div>
    </div>
    </>
  );
}
