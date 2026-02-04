import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

const TableCard = React.memo(({ tableOrders, isNew, onClick }) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        bgcolor: isNew ? 'warning.light' : 'background.paper',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="div">
            테이블 {tableOrders.tableNumber}
          </Typography>
          {isNew && <Chip label="NEW" color="warning" size="small" />}
        </Box>
        
        <Typography variant="h6" color="primary" gutterBottom>
          {tableOrders.totalAmount.toLocaleString()}원
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          최신 주문:
        </Typography>
        {tableOrders.latestOrders.map((order, index) => (
          <Typography key={order.orderId} variant="body2" sx={{ ml: 1 }}>
            • {order.items.map(item => `${item.menuName} x${item.quantity}`).join(', ')}
          </Typography>
        ))}
      </CardContent>
    </Card>
  );
});

TableCard.displayName = 'TableCard';

export default TableCard;
