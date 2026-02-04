// 주문을 테이블별로 그룹화
export function groupOrdersByTable(orders) {
  const map = new Map();
  
  orders.forEach(order => {
    if (!map.has(order.tableId)) {
      map.set(order.tableId, {
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        totalAmount: 0,
        orders: [],
        latestOrders: [],
        hasNewOrder: false,
      });
    }
    
    const tableOrders = map.get(order.tableId);
    tableOrders.orders.push(order);
    tableOrders.totalAmount += order.totalAmount;
    
    if (order.isNew) {
      tableOrders.hasNewOrder = true;
    }
  });
  
  // 최신 3개 주문 추출
  map.forEach(tableOrders => {
    tableOrders.latestOrders = tableOrders.orders
      .sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime())
      .slice(0, 3);
  });
  
  return map;
}

// 이미지를 Base64로 인코딩
export function encodeImageToBase64(file) {
  return new Promise((resolve, reject) => {
    // 크기 검증 (1MB = 1,048,576 bytes)
    if (file.size > 1048576) {
      reject(new Error('이미지 크기는 1MB 이하여야 합니다'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 주문 상태 전환 유효성 검증
export function isValidTransition(from, to) {
  const validTransitions = {
    'pending': ['preparing', 'completed'],
    'preparing': ['completed'],
    'completed': [],
  };
  
  return validTransitions[from]?.includes(to) || false;
}
