import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchOrders } from '@/api/orderService';
import type { Order } from '@/types/entities';

export function useOrders(sessionId: string): UseQueryResult<Order[]> {
  return useQuery<Order[]>({
    queryKey: ['orders', sessionId],
    queryFn: () => fetchOrders(sessionId),
    refetchInterval: 5 * 60 * 1000, // 5분마다 폴링
    enabled: !!sessionId,
  });
}
