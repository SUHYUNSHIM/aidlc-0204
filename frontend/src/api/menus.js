import apiClient from './client';

// 메뉴 조회 (백엔드는 {store_id, categories} 형식 반환)
export const fetchMenus = (storeId) => 
  apiClient.get(`/api/v1/admin/menus?store_id=${storeId}`)
    .then(res => {
      // categories 배열에서 모든 메뉴를 평탄화
      const categories = res.data.categories || [];
      return categories.flatMap(cat => 
        (cat.menus || []).map(menu => ({
          ...menu,
          categoryId: cat.category_id,
          categoryName: cat.category_name
        }))
      );
    });

// 메뉴 생성
export const createMenu = (menuData) => 
  apiClient.post('/api/v1/admin/menus', menuData).then(res => res.data);

// 메뉴 수정
export const updateMenu = (menuId, menuData) => 
  apiClient.patch(`/api/v1/admin/menus/${menuId}`, menuData).then(res => res.data);

// 메뉴 삭제
export const deleteMenu = (menuId) => 
  apiClient.delete(`/api/v1/admin/menus/${menuId}`).then(res => res.data);
