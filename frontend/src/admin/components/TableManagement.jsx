import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { fetchTables, createTable, endTableSession, fetchTableHistory } from '../../api/tables';
import { useAdminContext } from '../contexts/AdminContext';

export default function TableManagement() {
  const { adminUser } = useAdminContext();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    tablePassword: '',
  });
  
  // 테이블 조회
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables', adminUser?.storeId],
    queryFn: () => fetchTables(adminUser.storeId),
    enabled: !!adminUser?.storeId,
  });
  
  // 테이블 생성
  const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
      setShowCreateForm(false);
      setFormData({ tableNumber: '', tablePassword: '' });
      alert('테이블이 생성되었습니다');
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || '테이블 생성 실패';
      alert(message);
    },
  });
  
  // 세션 종료
  const endSessionMutation = useMutation({
    mutationFn: endTableSession,
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
      queryClient.invalidateQueries(['orders']);
    },
  });
  
  // 과거 내역 조회
  const { data: history = [] } = useQuery({
    queryKey: ['tableHistory', selectedTableId],
    queryFn: () => fetchTableHistory(selectedTableId),
    enabled: !!selectedTableId && showHistory,
  });
  
  const handleCreate = () => {
    if (!formData.tableNumber || !formData.tablePassword) {
      alert('모든 필드를 입력해주세요');
      return;
    }
    
    createMutation.mutate({
      store_id: adminUser.storeId,
      table_number: Number(formData.tableNumber),
      table_password: formData.tablePassword,
    });
  };
  
  const handleEndSession = (tableId) => {
    if (window.confirm('테이블 세션을 종료하시겠습니까?')) {
      endSessionMutation.mutate(tableId);
    }
  };
  
  const handleShowHistory = (tableId) => {
    setSelectedTableId(tableId);
    setShowHistory(true);
  };
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">테이블 관리</Typography>
        <Button variant="contained" onClick={() => setShowCreateForm(true)}>
          테이블 추가
        </Button>
      </Box>
      
      {tables.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          현재 활성 세션이 있는 테이블이 없습니다. 
          테이블을 추가하거나 고객이 테이블에 로그인하면 여기에 표시됩니다.
        </Alert>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>테이블 번호</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>세션 ID</TableCell>
              <TableCell align="right">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  활성 테이블이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              tables.map(table => (
                <TableRow key={table.table_id}>
                  <TableCell>{table.table_number}</TableCell>
                  <TableCell>활성</TableCell>
                  <TableCell>{table.session_id || '-'}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => handleShowHistory(table.table_id)}
                      sx={{ mr: 1 }}
                    >
                      과거 내역
                    </Button>
                    {table.session_id && (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() => handleEndSession(table.table_id)}
                      >
                        매장 이용 완료
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* 테이블 생성 폼 */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)}>
        <DialogTitle>테이블 추가</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="테이블 번호"
            type="number"
            value={formData.tableNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, tableNumber: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="테이블 비밀번호"
            value={formData.tablePassword}
            onChange={(e) => setFormData(prev => ({ ...prev, tablePassword: e.target.value }))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateForm(false)}>취소</Button>
          <Button onClick={handleCreate} variant="contained">추가</Button>
        </DialogActions>
      </Dialog>
      
      {/* 과거 내역 모달 */}
      <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="md" fullWidth>
        <DialogTitle>과거 주문 내역</DialogTitle>
        <DialogContent>
          {history.length === 0 ? (
            <Typography>과거 주문 내역이 없습니다.</Typography>
          ) : (
            history.map(order => (
              <Box key={order.orderId} sx={{ mb: 2, p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle1">주문 #{order.orderNumber}</Typography>
                <Typography variant="body2">
                  {new Date(order.orderTime).toLocaleString()} - {order.totalAmount.toLocaleString()}원
                </Typography>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
