import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchOrderById } from '@/api/orderService';
import { useAuth } from '@/hooks/useAuth';
import { useAutoRedirect } from '@/hooks/useAutoRedirect';
import { Navigation } from '@/components/common/Navigation';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Order } from '@/types/entities';

export function OrderConfirmation(): JSX.Element {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Cart에서 전달된 주문 데이터 사용 (즉시 표시)
  const orderFromState = location.state?.order as Order | undefined;
  
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId!),
    enabled: !!orderId && isAuthenticated && !orderFromState,
    retry: 3,
    retryDelay: 1000,
  });
  
  // state에서 전달된 주문 또는 API에서 조회한 주문 사용
  const displayOrder = orderFromState || order;

  // 인증 체크
  if (!isAuthenticated) {
    navigate('/customer/login');
    return <div className="loading">로그인 페이지로 이동 중...</div>;
  }

  // 5초 후 메뉴 페이지로 자동 리다이렉트
  useAutoRedirect(!!displayOrder, 5000, '/customer/menu');

  if (!orderFromState && isLoading) {
    return (
      <>
        <Navigation />
        <div className="loading">주문 정보를 불러오는 중...</div>
      </>
    );
  }

  if (!displayOrder) {
    return (
      <>
        <Navigation />
        <div className="error">
          <p>주문 정보를 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/customer/menu')}>메뉴로 돌아가기</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="order-confirmation">
      <div className="success-icon">✓</div>
      <h1>주문이 완료되었습니다!</h1>
      <p className="order-id">주문번호: {displayOrder.orderId}</p>

      <div className="order-details">
        <h2>주문 상세</h2>
        <div className="order-info">
          <p>주문 시간: {formatDateTime(displayOrder.createdAt)}</p>
          <p>상태: {displayOrder.status}</p>
          {displayOrder.estimatedPrepTime && (
            <p>예상 준비 시간: {displayOrder.estimatedPrepTime}분</p>
          )}
        </div>

        <div className="order-items">
          <h3>주문 항목</h3>
          {displayOrder.items.map((item, index) => (
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
          <span>{formatCurrency(displayOrder.totalAmount)}</span>
        </div>
      </div>

      <p className="redirect-notice">5초 후 메뉴 페이지로 이동합니다...</p>
    </div>
    </>
  );
}
