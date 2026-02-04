import axiosInstance from '@/lib/axios';
import type { Order, CreateOrderInput } from '@/types/entities';
import { apiOrderToOrder } from '@/transformers/entityTransformers';
import { mockOrders } from '@/mocks/mockData';

// Mock 모드 활성화
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Mock 주문 저장소 (메모리)
let mockOrderStorage: Order[] = [...mockOrders];
let orderIdCounter = mockOrders.length + 1;

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const newOrder: Order = {
      orderId: `order-${orderIdCounter++}`,
      tableId: input.tableId,
      sessionId: input.sessionId,
      items: input.items,
      totalAmount: input.totalAmount,
      status: 'pending' as any,
      createdAt: new Date().toISOString(),
      estimatedPrepTime: 15,
    };
    
    mockOrderStorage.push(newOrder);
    return newOrder;
  }

  // Backend API 연동: POST /customer/orders
  const response = await axiosInstance.post('/customer/orders', {
    items: input.items.map(item => ({
      menu_id: parseInt(item.menuId),
      quantity: item.quantity,
    })),
  });

  return apiOrderToOrder(response.data);
}

export async function fetchOrders(sessionId: string): Promise<Order[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockOrderStorage.filter((order) => order.sessionId === sessionId);
  }

  // Backend API 연동: GET /customer/orders
  const response = await axiosInstance.get('/customer/orders');

  return response.data.orders.map(apiOrderToOrder);
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const order = mockOrderStorage.find((o) => o.orderId === orderId);
    if (!order) {
      throw new Error('주문을 찾을 수 없습니다.');
    }
    return order;
  }

  // Backend에 개별 주문 조회 API가 없으므로 전체 주문에서 찾기
  const response = await axiosInstance.get('/customer/orders');
  const order = response.data.orders.find((o: any) => o.order_id.toString() === orderId);
  
  if (!order) {
    throw new Error('주문을 찾을 수 없습니다.');
  }

  return apiOrderToOrder(order);
}
