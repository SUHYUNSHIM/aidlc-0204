import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchMenus } from '@/api/menuService';
import type { MenuItem } from '@/types/entities';

export function useMenus(storeId: string): UseQueryResult<MenuItem[]> {
  return useQuery<MenuItem[]>({
    queryKey: ['menus', storeId],
    queryFn: () => fetchMenus(storeId),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (cacheTime deprecated)
    enabled: !!storeId,
  });
}
