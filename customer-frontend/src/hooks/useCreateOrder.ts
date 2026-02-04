import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { createOrder } from '@/api/orderService';
import type { Order, CreateOrderInput } from '@/types/entities';

export function useCreateOrder(): UseMutationResult<Order, Error, CreateOrderInput> {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, CreateOrderInput>({
    mutationFn: createOrder,
    onSuccess: (data) => {
      // 주문 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['orders', data.sessionId] });
    },
  });
}
