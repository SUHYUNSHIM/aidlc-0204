import axiosInstance from '@/lib/axios';
import type { MenuItem, Category } from '@/types/entities';
import { apiMenuToMenuItem } from '@/transformers/entityTransformers';
import { mockMenuItems, mockCategories } from '@/mocks/mockData';

// Mock 모드 활성화 (환경 변수로 제어)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function fetchMenus(storeId?: string, categoryId?: number): Promise<MenuItem[]> {
  if (USE_MOCK) {
    // Mock 데이터 반환 (네트워크 지연 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockMenuItems;
  }

  // Backend API 연동: GET /customer/menus
  const response = await axiosInstance.get('/customer/menus', {
    params: categoryId ? { category_id: categoryId } : undefined,
  });

  // Backend 응답 구조: { store_id, categories: [{ category_id, category_name, menus: [...] }] }
  const allMenus: MenuItem[] = [];
  response.data.categories.forEach((category: any) => {
    category.menus.forEach((menu: any) => {
      allMenus.push(apiMenuToMenuItem(menu, category));
    });
  });

  return allMenus;
}

export async function fetchMenusByIds(menuIds: string[]): Promise<MenuItem[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMenuItems.filter((menu) => menuIds.includes(menu.id));
  }

  // Backend에 ID별 조회 API가 없으므로 전체 메뉴를 가져와서 필터링
  const response = await axiosInstance.get('/customer/menus');
  
  const allMenus: MenuItem[] = [];
  response.data.categories.forEach((category: any) => {
    category.menus.forEach((menu: any) => {
      if (menuIds.includes(menu.menu_id.toString())) {
        allMenus.push(apiMenuToMenuItem(menu, category));
      }
    });
  });

  return allMenus;
}

export async function fetchCategories(storeId?: string): Promise<Category[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockCategories;
  }

  // Backend API 연동: GET /customer/menus (categories included)
  const response = await axiosInstance.get('/customer/menus');

  return response.data.categories.map((cat: any) => ({
    id: cat.category_id.toString(),
    name: cat.category_name,
    displayOrder: cat.display_order,
  }));
}
