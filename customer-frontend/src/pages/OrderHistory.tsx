import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { Navigation } from '@/components/common/Navigation';
import { formatCurrency, formatDateTime } from '@/utils/format';

export function OrderHistory(): JSX.Element {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useAuth();
  const { data: orders, isLoading, error } = useOrders(session?.sessionId || '');

  // 인증 체크
  if (!isAuthenticated) {
    navigate('/customer/login');
    return <div className="loading">로그인 페이지로 이동 중...</div>;
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="loading">주문 내역을 불러오는 중...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="error">주문 내역을 불러오는데 실패했습니다.</div>
      </>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <>
        <Navigation />
        <div className="order-history-empty">
          <h2>주문 내역이 없습니다</h2>
          <p>첫 주문을 시작해보세요!</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="order-history">
      <h1>주문 내역</h1>
      <p className="refresh-notice">5분마다 자동으로 업데이트됩니다</p>

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.orderId} className="order-card">
            <div className="order-header">
              <span className="order-id">주문번호: {order.orderId}</span>
              <span className={`order-status status-${order.status}`}>
                {order.status}
              </span>
            </div>

            <div className="order-time">
              {formatDateTime(order.createdAt)}
            </div>

            <div className="order-items">
              {order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="order-total">
              <span>총 금액:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>

            {order.estimatedPrepTime && (
              <div className="prep-time">
                예상 준비 시간: {order.estimatedPrepTime}분
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
