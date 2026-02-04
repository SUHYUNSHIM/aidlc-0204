import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchOrderById } from '@/api/orderService';
import { useAuth } from '@/hooks/useAuth';
import { useAutoRedirect } from '@/hooks/useAutoRedirect';
import { Navigation } from '@/components/common/Navigation';
import { formatCurrency, formatDateTime } from '@/utils/format';

export function OrderConfirmation(): JSX.Element {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId!),
    enabled: !!orderId && isAuthenticated,
  });

  // 인증 체크
  if (!isAuthenticated) {
    navigate('/customer/login');
    return <div className="loading">로그인 페이지로 이동 중...</div>;
  }

  // 5초 후 메뉴 페이지로 자동 리다이렉트
  useAutoRedirect(!!order, 5000, '/customer/menu');

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="loading">주문 정보를 불러오는 중...</div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navigation />
        <div className="error">주문 정보를 찾을 수 없습니다.</div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="order-confirmation">
      <div className="success-icon">✓</div>
      <h1>주문이 완료되었습니다!</h1>
      <p className="order-id">주문번호: {order.orderId}</p>

      <div className="order-details">
        <h2>주문 상세</h2>
        <div className="order-info">
          <p>주문 시간: {formatDateTime(order.createdAt)}</p>
          <p>상태: {order.status}</p>
          {order.estimatedPrepTime && (
            <p>예상 준비 시간: {order.estimatedPrepTime}분</p>
          )}
        </div>

        <div className="order-items">
          <h3>주문 항목</h3>
          {order.items.map((item, index) => (
            <div key={index} className="order-item">
              <span className="item-name">
                {item.name} x {item.quantity}
              </span>
              <span className="item-price">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="order-total">
          <span>총 금액:</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      <p className="redirect-notice">5초 후 메뉴 페이지로 이동합니다...</p>
    </div>
    </>
  );
}
