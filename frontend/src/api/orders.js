import apiClient from './client';

// 주문 조회 (백엔드는 {store_id, tables} 형식 반환)
export const fetchOrders = (storeId) => 
  apiClient.get(`/api/v1/admin/orders?store_id=${storeId}`)
    .then(res => res.data.tables || []);

// 주문 상태 변경
export const updateOrderStatus = (orderId, status) => 
  apiClient.patch(`/api/v1/admin/orders/${orderId}/status`, { status }).then(res => res.data);

// 주문 삭제
export const deleteOrder = (orderId) => 
  apiClient.delete(`/api/v1/admin/orders/${orderId}`).then(res => res.data);
