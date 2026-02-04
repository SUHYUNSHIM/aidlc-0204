import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Typography, Alert, Button, CircularProgress } from '@mui/material';
import { fetchOrders } from '../../api/orders';
import { useSSE } from '../hooks/useSSE';
import { useAdminContext } from '../contexts/AdminContext';
import { groupOrdersByTable } from '../../utils/helpers';
import TableCard from './TableCard';
import OrderDetailModal from './OrderDetailModal';

export default function OrderDashboard() {
  const { adminUser, pollingEnabled, selectedTableId, setSelectedTableId, showOrderDetailModal, setShowOrderDetailModal } = useAdminContext();
  const storeId = adminUser?.storeId;
  
  // SSE 연결 (임시로 비활성화)
  // const { connected: sseConnected, error: sseError } = useSSE(storeId);
  const sseConnected = false;
  const sseError = null;
  
  // 주문 조회
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['orders', storeId],
    queryFn: () => fetchOrders(storeId),
    enabled: !!storeId,
    refetchInterval: pollingEnabled ? 10000 : false,
  });
  
  // 테이블별 그룹화
  const tableOrdersMap = useMemo(() => {
    return groupOrdersByTable(orders);
  }, [orders]);
  
  // 테이블 번호 순 정렬
  const sortedTableOrders = useMemo(() => {
    return Array.from(tableOrdersMap.values())
      .sort((a, b) => a.tableNumber - b.tableNumber);
  }, [tableOrdersMap]);
  
  const handleTableClick = (tableId) => {
    setSelectedTableId(tableId);
    setShowOrderDetailModal(true);
  };
  
  const handleCloseModal = () => {
    setShowOrderDetailModal(false);
    setSelectedTableId(null);
  };
  
  const selectedTableOrders = selectedTableId ? tableOrdersMap.get(selectedTableId) : null;
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        실시간 주문 대시보드
      </Typography>
      
      {!sseConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          실시간 연결이 끊어졌습니다. 10초마다 자동 새로고침됩니다.
          <Button onClick={() => refetch()} sx={{ ml: 2 }}>
            수동 새로고침
          </Button>
        </Alert>
      )}
      
      {sortedTableOrders.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          현재 활성 주문이 없습니다.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {sortedTableOrders.map(tableOrders => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tableOrders.tableId}>
              <TableCard
                tableOrders={tableOrders}
                isNew={tableOrders.hasNewOrder}
                onClick={() => handleTableClick(tableOrders.tableId)}
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      {showOrderDetailModal && selectedTableOrders && (
        <OrderDetailModal
          open={showOrderDetailModal}
          tableId={selectedTableId}
          orders={selectedTableOrders.orders}
          onClose={handleCloseModal}
        />
      )}
    </Box>
  );
}
