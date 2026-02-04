import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
} from '@mui/material';
import { updateOrderStatus, deleteOrder } from '../../api/orders';
import { useAdminContext } from '../contexts/AdminContext';
import { isValidTransition } from '../../utils/helpers';

export default function OrderDetailModal({ open, tableId, orders, onClose }) {
  const { adminUser } = useAdminContext();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  
  // 주문 상태 변경 mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders', adminUser.storeId]);
      onClose(); // 모달 닫기
    },
    onError: (err) => {
      setError('상태 변경 실패. 다시 시도해주세요');
    },
  });
  
  // 주문 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (orderId) => deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders', adminUser.storeId]);
    },
    onError: (err) => {
      setError('주문 삭제 실패. 다시 시도해주세요');
    },
  });
  
  const handleStatusChange = (orderId, currentStatus, newStatus) => {
    if (!isValidTransition(currentStatus, newStatus)) {
      setError('유효하지 않은 상태 전환입니다');
      return;
    }
    
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };
  
  const handleDelete = (orderId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(orderId);
    }
  };
  
  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        테이블 {orders[0]?.tableNumber} - 주문 상세
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Typography variant="h6" gutterBottom>
          총 주문액: {totalAmount.toLocaleString()}원
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {orders.map((order) => (
          <Box key={order.orderId} sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                주문 #{order.orderNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(order.orderTime).toLocaleString()}
              </Typography>
            </Box>
            
            {order.items.map((item, index) => (
              <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                • {item.menuName} x{item.quantity} - {item.unitPrice.toLocaleString()}원
              </Typography>
            ))}
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>상태</InputLabel>
                <Select
                  value={order.status}
                  label="상태"
                  onChange={(e) => handleStatusChange(order.orderId, order.status, e.target.value)}
                  disabled={order.status === 'completed'}
                >
                  <MenuItem value="pending">대기중</MenuItem>
                  <MenuItem value="preparing">준비중</MenuItem>
                  <MenuItem value="completed">완료</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleDelete(order.orderId)}
              >
                삭제
              </Button>
            </Box>
          </Box>
        ))}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
