import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useMenus } from '@/hooks/useMenus';
import { Navigation } from '@/components/common/Navigation';
import { LazyImage } from '@/components/common/LazyImage';
import { formatCurrency } from '@/utils/format';
import type { MenuItem } from '@/types/entities';

export function MenuBrowser(): JSX.Element {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { data: menus, isLoading, error } = useMenus(session?.storeId || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toast, setToast] = useState<string | null>(null);

  // 인증 체크
  if (!isAuthenticated) {
    navigate('/customer/login');
    return <div className="loading">로그인 페이지로 이동 중...</div>;
  }

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    if (!menus) return [];
    const uniqueCategories = Array.from(
      new Set(menus.map((menu) => menu.categoryName))
    );
    return uniqueCategories.sort();
  }, [menus]);

  // 필터링된 메뉴
  const filteredMenus = useMemo(() => {
    if (!menus) return [];
    if (selectedCategory === 'all') return menus;
    return menus.filter((menu) => menu.categoryName === selectedCategory);
  }, [menus, selectedCategory]);

  const handleAddToCart = (menu: MenuItem) => {
    if (!menu.isAvailable) {
      showToast('품절된 메뉴입니다.');
      return;
    }
    addToCart(menu, 1);
    showToast(`${menu.name}이(가) 장바구니에 추가되었습니다.`);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  if (isLoading) {
    return <div className="loading">메뉴를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="error">메뉴를 불러오는데 실패했습니다.</div>;
  }

  return (
    <>
      <Navigation />
      <div className="menu-browser">
        <h1>메뉴</h1>

        {/* 카테고리 필터 */}
        <div className="category-filter">
          <button
            className={selectedCategory === 'all' ? 'active' : ''}
            onClick={() => setSelectedCategory('all')}
          >
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 메뉴 그리드 */}
        <div className="menu-grid">
          {filteredMenus.map((menu) => (
            <div key={menu.id} className="menu-item">
              {menu.imageUrl && (
                <LazyImage
                  src={menu.imageUrl}
                  alt={menu.name}
                  className="menu-image"
                />
              )}
              <h3>{menu.name}</h3>
              <p className="description">{menu.description}</p>
              <p className="price">{formatCurrency(menu.price)}</p>
              <button
                onClick={() => handleAddToCart(menu)}
                disabled={!menu.isAvailable}
                className={menu.isAvailable ? '' : 'disabled'}
              >
                {menu.isAvailable ? '장바구니에 추가' : '품절'}
              </button>
            </div>
          ))}
        </div>

        {/* 토스트 메시지 */}
        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
