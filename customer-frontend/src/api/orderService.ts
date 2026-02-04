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

  // Backend API 연동: POST /api/v1/customer/orders
  const response = await axiosInstance.post('/api/v1/customer/orders', {
    items: input.items.map(item => ({
      menu_id: item.menuId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  });

  return apiOrderToOrder(response.data);
}

export async function fetchOrders(sessionId: string): Promise<Order[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockOrderStorage.filter((order) => order.sessionId === sessionId);
  }

  // Backend API 연동: GET /api/v1/customer/orders
  const response = await axiosInstance.get('/api/v1/customer/orders');

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

  const response = await axiosInstance.get(`/customer/orders/${orderId}`);

  return apiOrderToOrder(response.data);
}
