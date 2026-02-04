import apiClient from './client';

// 메뉴 조회
export const fetchMenus = (storeId) => 
  apiClient.get(`/admin/menus?store_id=${storeId}`).then(res => res.data);

// 메뉴 생성
export const createMenu = (menuData) => 
  apiClient.post('/admin/menus', menuData).then(res => res.data);

// 메뉴 수정
export const updateMenu = (menuId, menuData) => 
  apiClient.patch(`/admin/menus/${menuId}`, menuData).then(res => res.data);

// 메뉴 삭제
export const deleteMenu = (menuId) => 
  apiClient.delete(`/admin/menus/${menuId}`).then(res => res.data);
