import axiosInstance from '@/lib/axios';
import type { MenuItem, Category } from '@/types/entities';
import { apiMenuToMenuItem } from '@/transformers/entityTransformers';
import { mockMenuItems, mockCategories } from '@/mocks/mockData';

// Mock 모드 활성화 (환경 변수로 제어)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || true; // 기본값: true

export async function fetchMenus(storeId: string): Promise<MenuItem[]> {
  if (USE_MOCK) {
    // Mock 데이터 반환 (네트워크 지연 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockMenuItems;
  }

  const response = await axiosInstance.get('/customer/menus', {
    params: { store_id: storeId },
  });

  return response.data.menus.map(apiMenuToMenuItem);
}

export async function fetchMenusByIds(menuIds: string[]): Promise<MenuItem[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMenuItems.filter((menu) => menuIds.includes(menu.id));
  }

  const response = await axiosInstance.post('/customer/menus/by-ids', {
    menu_ids: menuIds,
  });

  return response.data.menus.map(apiMenuToMenuItem);
}

export async function fetchCategories(storeId: string): Promise<Category[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockCategories;
  }

  const response = await axiosInstance.get('/customer/categories', {
    params: { store_id: storeId },
  });

  return response.data.categories;
}
