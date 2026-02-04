import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

export function Navigation(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { totals } = useCart();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/customer/menu" className="nav-logo">
          🍕 테이블 오더
        </Link>

        <div className="nav-links">
          <Link
            to="/customer/menu"
            className={location.pathname === '/customer/menu' ? 'active' : ''}
          >
            메뉴
          </Link>
          <Link
            to="/customer/cart"
            className={location.pathname === '/customer/cart' ? 'active' : ''}
          >
            장바구니
            {totals.totalItems > 0 && (
              <span className="cart-badge">{totals.totalItems}</span>
            )}
          </Link>
          <Link
            to="/customer/order-history"
            className={
              location.pathname === '/customer/order-history' ? 'active' : ''
            }
          >
            주문내역
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
