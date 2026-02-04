# NFR Design Patterns - Unit 2: Admin Frontend

## 1. 성능 최적화 패턴

### 1.1 캐싱 패턴 (Caching Pattern)

**패턴**: React Query 기반 다층 캐싱

**적용 범위**: 주문 외 모든 데이터 (메뉴, 카테고리, 테이블 정보)

**구현**:
```javascript
// 메뉴 데이터 캐싱 (5분)
const { data: menus } = useQuery({
  queryKey: ['menus', storeId],
  queryFn: fetchMenus,
  staleTime: 5 * 60 * 1000,
  cacheTime: 10 * 60 * 1000,
});

// 카테고리 데이터 캐싱 (10분)
const { data: categories } = useQuery({
  queryKey: ['categories', storeId],
  queryFn: fetchCategories,
  staleTime: 10 * 60 * 1000,
  cacheTime: 20 * 60 * 1000,
});

// 테이블 정보 캐싱 (5분)
const { data: tables } = useQuery({
  queryKey: ['tables', storeId],
  queryFn: fetchTables,
  staleTime: 5 * 60 * 1000,
  cacheTime: 10 * 60 * 1000,
});

// 주문 데이터 (캐싱 안함 - SSE로 실시간 업데이트)
const { data: orders } = useQuery({
  queryKey: ['orders', storeId],
  queryFn: fetchOrders,
  staleTime: 0,
  cacheTime: 0,
  refetchInterval: false,
});
```

**효과**:
- 불필요한 API 호출 감소 (80% 감소)
- 네트워크 트래픽 감소
- 사용자 경험 향상 (즉각적 응답)

---

### 1.2 낙관적 업데이트 패턴 (Optimistic Update Pattern)

**패턴**: 모든 변경 작업에 낙관적 업데이트 적용

**적용 범위**: POST/PATCH/DELETE 모든 작업

**구현**:
```javascript
// 주문 상태 변경
const updateOrderStatus = useMutation({
  mutationFn: ({ orderId, status }) => 
    axios.patch(`/admin/orders/${orderId}/status`, { status }),
  
  // 낙관적 업데이트
  onMutate: async ({ orderId, status }) => {
    // 진행 중인 쿼리 취소
    await queryClient.cancelQueries(['orders', storeId]);
    
    // 이전 데이터 백업
    const previousOrders = queryClient.getQueryData(['orders', storeId]);
    
    // 낙관적 업데이트 (즉시 UI 반영)
    queryClient.setQueryData(['orders', storeId], (old) =>
      old.map(order => 
        order.orderId === orderId ? { ...order, status } : order
      )
    );
    
    return { previousOrders };
  },
  
  // 에러 시 롤백
  onError: (err, variables, context) => {
    queryClient.setQueryData(['orders', storeId], context.previousOrders);
    showToast('상태 변경 실패. 다시 시도해주세요', 'error');
  },
  
  // 성공 시 서버 데이터로 동기화
  onSuccess: () => {
    queryClient.invalidateQueries(['orders', storeId]);
  },
});

// 메뉴 수정
const updateMenu = useMutation({
  mutationFn: ({ menuId, data }) => 
    axios.patch(`/admin/menus/${menuId}`, data),
  
  onMutate: async ({ menuId, data }) => {
    await queryClient.cancelQueries(['menus', storeId]);
    const previousMenus = queryClient.getQueryData(['menus', storeId]);
    
    queryClient.setQueryData(['menus', storeId], (old) =>
      old.map(menu => 
        menu.menuId === menuId ? { ...menu, ...data } : menu
      )
    );
    
    return { previousMenus };
  },
  
  onError: (err, variables, context) => {
    queryClient.setQueryData(['menus', storeId], context.previousMenus);
    showToast('메뉴 수정 실패', 'error');
  },
  
  onSuccess: () => {
    queryClient.invalidateQueries(['menus', storeId]);
    showToast('메뉴가 수정되었습니다', 'success');
  },
});

// 주문 삭제
const deleteOrder = useMutation({
  mutationFn: (orderId) => axios.delete(`/admin/orders/${orderId}`),
  
  onMutate: async (orderId) => {
    await queryClient.cancelQueries(['orders', storeId]);
    const previousOrders = queryClient.getQueryData(['orders', storeId]);
    
    queryClient.setQueryData(['orders', storeId], (old) =>
      old.filter(order => order.orderId !== orderId)
    );
    
    return { previousOrders };
  },
  
  onError: (err, variables, context) => {
    queryClient.setQueryData(['orders', storeId], context.previousOrders);
    showToast('주문 삭제 실패', 'error');
  },
  
  onSuccess: () => {
    queryClient.invalidateQueries(['orders', storeId]);
    showToast('주문이 삭제되었습니다', 'success');
  },
});
```

**효과**:
- 즉각적인 UI 반응 (체감 성능 향상)
- 사용자 경험 개선
- 네트워크 지연 숨김

---

### 1.3 메모이제이션 패턴 (Memoization Pattern)

**패턴**: React.memo, useMemo, useCallback 활용

**구현**:
```javascript
// 컴포넌트 메모이제이션
const TableCard = React.memo(({ tableOrders, isNew, onClick }) => {
  return (
    <Card onClick={onClick} className={isNew ? 'highlight' : ''}>
      <Typography>테이블 {tableOrders.tableNumber}</Typography>
      <Typography>{tableOrders.totalAmount}원</Typography>
    </Card>
  );
}, (prevProps, nextProps) => {
  // props가 동일하면 리렌더링 스킵
  return (
    prevProps.tableOrders.tableId === nextProps.tableOrders.tableId &&
    prevProps.tableOrders.totalAmount === nextProps.tableOrders.totalAmount &&
    prevProps.isNew === nextProps.isNew
  );
});

// 계산 메모이제이션
const OrderDashboard = () => {
  const { data: orders } = useQuery(['orders', storeId]);
  
  // orders가 변경될 때만 재계산
  const tableOrders = useMemo(() => {
    return groupOrdersByTable(orders);
  }, [orders]);
  
  // 함수 메모이제이션
  const handleTableClick = useCallback((tableId) => {
    setSelectedTableId(tableId);
    setShowOrderDetailModal(true);
  }, []);
  
  return (
    <Grid container>
      {Array.from(tableOrders.values()).map(tableOrder => (
        <TableCard
          key={tableOrder.tableId}
          tableOrders={tableOrder}
          isNew={tableOrder.hasNewOrder}
          onClick={() => handleTableClick(tableOrder.tableId)}
        />
      ))}
    </Grid>
  );
};
```

**효과**:
- 불필요한 리렌더링 방지 (60-80% 감소)
- CPU 사용량 감소
- 60 FPS 유지

---

### 1.4 이미지 로딩 패턴 (Immediate Loading Pattern)

**패턴**: 모든 이미지 즉시 로드 (Lazy Loading 미적용)

**근거**:
- 관리자 화면은 메뉴 이미지 수가 제한적 (50-100개)
- 즉시 로드로 사용자 경험 단순화
- Lazy Loading 복잡도 제거

**구현**:
```javascript
// 메뉴 이미지 즉시 로드
<img 
  src={menu.imageBase64 || '/default-menu.png'} 
  alt={menu.menuName}
  style={{ width: 100, height: 100, objectFit: 'cover' }}
/>
```

**최적화**:
- 이미지 크기 제한 (최대 1MB)
- WebP 형식 권장
- 서버에서 리사이징 (썸네일 생성)

---

## 2. 에러 처리 패턴

### 2.1 에러 바운더리 패턴 (Error Boundary Pattern)

**패턴**: 컴포넌트별 에러 바운더리

**적용 범위**: 주요 컴포넌트마다 적용

**구현**:
```javascript
// ErrorBoundary 컴포넌트
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Sentry로 에러 전송
    Sentry.captureException(error, { extra: errorInfo });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={3} textAlign="center">
          <Typography variant="h6" color="error">
            문제가 발생했습니다
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {this.state.error?.message}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            새로고침
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// 적용
const AdminApp = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={
          <ErrorBoundary>
            <AdminLogin />
          </ErrorBoundary>
        } />
        <Route path="/dashboard" element={
          <ErrorBoundary>
            <OrderDashboard />
          </ErrorBoundary>
        } />
        <Route path="/menus" element={
          <ErrorBoundary>
            <MenuManagement />
          </ErrorBoundary>
        } />
      </Routes>
    </ErrorBoundary>
  );
};
```

**효과**:
- 부분 장애 격리 (한 컴포넌트 에러가 전체 앱 다운 방지)
- 사용자 친화적 에러 메시지
- 에러 추적 및 모니터링

---

### 2.2 재시도 패턴 (Retry Pattern)

**패턴**: React Query 자동 재시도 + 지수 백오프

**구현**:
```javascript
// React Query 전역 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 0,
      cacheTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// SSE 재연결 (지수 백오프)
const useSSE = (storeId) => {
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const connect = useCallback(() => {
    const eventSource = new EventSource(`/admin/orders/sse?store_id=${storeId}`);
    
    eventSource.onerror = () => {
      eventSource.close();
      
      if (reconnectAttempts < 5) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 16000);
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      } else {
        // 폴링 모드로 전환
        setPollingEnabled(true);
      }
    };
  }, [storeId, reconnectAttempts]);
  
  return { connect };
};
```

**재시도 지연 시간**:
- 1회: 1초
- 2회: 2초
- 3회: 4초
- 4회: 8초
- 5회: 16초

---

### 2.3 폴백 패턴 (Fallback Pattern)

**패턴**: SSE 실패 시 폴링으로 자동 전환

**구현**:
```javascript
const OrderDashboard = () => {
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const { sseConnected } = useSSE(storeId);
  
  // SSE 연결 실패 시 폴링 활성화
  useEffect(() => {
    if (!sseConnected) {
      setPollingEnabled(true);
    }
  }, [sseConnected]);
  
  // 폴링 (10초 간격)
  const { data: orders } = useQuery({
    queryKey: ['orders', storeId],
    queryFn: fetchOrders,
    enabled: pollingEnabled,
    refetchInterval: 10000,
  });
  
  return (
    <>
      {!sseConnected && (
        <Alert severity="warning">
          실시간 연결이 끊어졌습니다. 10초마다 자동 새로고침됩니다.
          <Button onClick={() => window.location.reload()}>
            수동 새로고침
          </Button>
        </Alert>
      )}
      {/* 대시보드 내용 */}
    </>
  );
};
```

---

## 3. 상태 관리 패턴

### 3.1 서버 상태 vs 로컬 상태 분리 패턴

**패턴**: React Query (서버 상태) + Context API (로컬 상태)

**구현**:
```javascript
// 서버 상태 (React Query)
const { data: orders } = useQuery(['orders', storeId]);
const { data: menus } = useQuery(['menus', storeId]);

// 로컬 상태 (Context API)
const AdminContext = createContext();

const AdminProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  
  return (
    <AdminContext.Provider value={{
      isAuthenticated,
      setIsAuthenticated,
      adminUser,
      setAdminUser,
      selectedTableId,
      setSelectedTableId,
      showOrderDetailModal,
      setShowOrderDetailModal,
    }}>
      {children}
    </AdminContext.Provider>
  );
};
```

**분리 기준**:
- **서버 상태**: 주문, 메뉴, 테이블 데이터 (React Query)
- **로컬 상태**: 인증, UI 상태, 선택된 항목 (Context API)

---

## 4. 보안 패턴

### 4.1 JWT 인증 패턴 (JWT Authentication Pattern)

**패턴**: Axios 인터셉터 + localStorage

**구현**:
```javascript
// Axios 인터셉터 (요청)
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios 인터셉터 (응답)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 자동 로그아웃
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
```

---

### 4.2 토큰 자동 갱신 패턴 (Token Refresh Pattern)

**패턴**: 만료 5분 전 자동 갱신

**구현**:
```javascript
const useTokenRefresh = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      const now = Date.now();
      const timeUntilExpiry = tokenExpiry - now;
      
      // 만료 5분 전
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        axios.post('/admin/refresh-token')
          .then(({ data }) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('tokenExpiry', data.expiry);
          })
          .catch(() => {
            // 갱신 실패 시 로그아웃
            localStorage.clear();
            window.location.href = '/admin/login';
          });
      }
    }, 60000); // 1분마다 체크
    
    return () => clearInterval(interval);
  }, []);
};
```

---

## 5. 코드 구조 패턴

### 5.1 단일 번들 패턴 (Single Bundle Pattern)

**패턴**: 코드 스플리팅 미적용, 단일 JavaScript 파일

**근거**:
- 관리자 화면은 코드 크기가 크지 않음 (예상 < 500KB gzip)
- 코드 스플리팅 복잡도 제거
- 초기 로딩 후 모든 기능 즉시 사용 가능

**구현**:
```javascript
// 일반 import (React.lazy 사용 안함)
import AdminLogin from './AdminLogin';
import OrderDashboard from './OrderDashboard';
import MenuManagement from './MenuManagement';

const AdminApp = () => {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/dashboard" element={<OrderDashboard />} />
      <Route path="/menus" element={<MenuManagement />} />
    </Routes>
  );
};
```

**최적화**:
- Tree shaking (사용하지 않는 코드 제거)
- Minification (코드 압축)
- Gzip 압축

---

## 6. 패턴 요약

| 패턴 | 목적 | 적용 범위 |
|------|------|-----------|
| 캐싱 패턴 | 성능 최적화 | 메뉴, 카테고리, 테이블 정보 |
| 낙관적 업데이트 | 체감 성능 향상 | 모든 POST/PATCH/DELETE |
| 메모이제이션 | 리렌더링 최소화 | 주요 컴포넌트 |
| 에러 바운더리 | 장애 격리 | 주요 컴포넌트 |
| 재시도 패턴 | 안정성 향상 | 모든 API 호출, SSE |
| 폴백 패턴 | 가용성 보장 | SSE → 폴링 |
| 상태 분리 | 관심사 분리 | 서버 상태 vs 로컬 상태 |
| JWT 인증 | 보안 | 모든 API 요청 |
| 토큰 갱신 | 세션 유지 | 백그라운드 |
| 단일 번들 | 단순성 | 전체 앱 |
