import apiClient from './client';

// 주문 조회
export const fetchOrders = (storeId) => 
  apiClient.get(`/admin/orders?store_id=${storeId}`).then(res => res.data);

// 주문 상태 변경
export const updateOrderStatus = (orderId, status) => 
  apiClient.patch(`/admin/orders/${orderId}/status`, { status }).then(res => res.data);

// 주문 삭제
export const deleteOrder = (orderId) => 
  apiClient.delete(`/admin/orders/${orderId}`).then(res => res.data);
