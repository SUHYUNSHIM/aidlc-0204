import apiClient from './client';

// 테이블 조회
export const fetchTables = (storeId) => 
  apiClient.get(`/admin/tables?store_id=${storeId}`).then(res => res.data);

// 테이블 생성
export const createTable = (tableData) => 
  apiClient.post('/admin/tables', tableData).then(res => res.data);

// 테이블 세션 종료
export const endTableSession = (tableId) => 
  apiClient.post(`/admin/tables/${tableId}/end-session`).then(res => res.data);

// 테이블 과거 내역 조회
export const fetchTableHistory = (tableId, page = 1, limit = 20) => 
  apiClient.get(`/admin/tables/${tableId}/history?page=${page}&limit=${limit}`).then(res => res.data);
