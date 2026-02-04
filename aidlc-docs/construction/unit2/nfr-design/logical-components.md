# Logical Components - Unit 2: Admin Frontend

## 1. 논리적 컴포넌트 개요

Admin Frontend는 순수 클라이언트 사이드 애플리케이션으로, 다음 논리적 컴포넌트로 구성됩니다:

```
┌─────────────────────────────────────────────────────────────┐
│                      Admin Frontend                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Manager │  │ State Manager│  │ API Client   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ SSE Manager  │  │ Cache Manager│  │ Error Handler│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ UI Components│  │ Router       │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 핵심 논리적 컴포넌트

### 2.1 Auth Manager (인증 관리자)

**책임**:
- JWT 토큰 관리 (저장, 조회, 삭제)
- 토큰 자동 갱신
- 로그인/로그아웃 처리
- 인증 상태 관리

**구현**:
```javascript
// hooks/useAuth.js
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  
  // 로그인
  const login = async (storeId, username, password) => {
    const { data } = await axios.post('/admin/login', {
      storeId,
      username,
      password,
    });
    
    // 토큰 저장
    localStorage.setItem('token', data.token);
    localStorage.setItem('tokenExpiry', data.expiry);
    
    // 상태 업데이트
    setIsAuthenticated(true);
    setAdminUser({
      userId: data.userId,
      username: data.username,
      storeId: data.storeId,
      token: data.token,
    });
  };
  
  // 로그아웃
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    setIsAuthenticated(false);
    setAdminUser(null);
  };
  
  // 토큰 자동 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      const now = Date.now();
      const timeUntilExpiry = tokenExpiry - now;
      
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        axios.post('/admin/refresh-token')
          .then(({ data }) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('tokenExpiry', data.expiry);
          })
          .catch(() => logout());
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { isAuthenticated, adminUser, login, logout };
};
```

**저장소**: localStorage
- `token`: JWT 토큰
- `tokenExpiry`: 만료 시간 (timestamp)

---

### 2.2 State Manager (상태 관리자)

**책임**:
- 전역 상태 관리
- 서버 상태와 로컬 상태 분리
- 상태 동기화

**구현**:
```javascript
// contexts/AdminContext.jsx
export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  // 인증 상태
  const { isAuthenticated, adminUser, login, logout } = useAuth();
  
  // UI 상태
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [showTableManagement, setShowTableManagement] = useState(false);
  const [showMenuManagement, setShowMenuManagement] = useState(false);
  
  // SSE 상태
  const [sseConnected, setSseConnected] = useState(false);
  const [sseError, setSseError] = useState(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  
  const value = {
    // 인증
    isAuthenticated,
    adminUser,
    login,
    logout,
    
    // UI 상태
    selectedTableId,
    setSelectedTableId,
    showOrderDetailModal,
    setShowOrderDetailModal,
    showTableManagement,
    setShowTableManagement,
    showMenuManagement,
    setShowMenuManagement,
    
    // SSE 상태
    sseConnected,
    setSseConnected,
    sseError,
    setSseError,
    pollingEnabled,
    setPollingEnabled,
  };
  
  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
```

**상태 분류**:
- **서버 상태** (React Query): 주문, 메뉴, 테이블 데이터
- **로컬 상태** (Context API): 인증, UI 상태, SSE 연결 상태

---

### 2.3 API Client (API 클라이언트)

**책임**:
- HTTP 요청 처리
- JWT 토큰 자동 추가
- 에러 처리
- 요청/응답 변환

**구현**:
```javascript
// api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (JWT 토큰 추가)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
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

export default apiClient;
```

**API 함수**:
```javascript
// api/orders.js
export const fetchOrders = (storeId) => 
  apiClient.get(`/admin/orders?store_id=${storeId}`);

export const updateOrderStatus = (orderId, status) => 
  apiClient.patch(`/admin/orders/${orderId}/status`, { status });

export const deleteOrder = (orderId) => 
  apiClient.delete(`/admin/orders/${orderId}`);

// api/menus.js
export const fetchMenus = (storeId) => 
  apiClient.get(`/admin/menus?store_id=${storeId}`);

export const createMenu = (menuData) => 
  apiClient.post('/admin/menus', menuData);

export const updateMenu = (menuId, menuData) => 
  apiClient.patch(`/admin/menus/${menuId}`, menuData);

export const deleteMenu = (menuId) => 
  apiClient.delete(`/admin/menus/${menuId}`);
```

---

### 2.4 SSE Manager (실시간 통신 관리자)

**책임**:
- SSE 연결 관리
- 이벤트 처리
- 자동 재연결
- 폴링 백업

**구현**:
```javascript
// hooks/useSSE.js
export const useSSE = (storeId) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const eventSourceRef = useRef(null);
  const { setPollingEnabled } = useContext(AdminContext);
  const queryClient = useQueryClient();
  
  const handleEvent = useCallback((event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'initial':
        queryClient.setQueryData(['orders', storeId], data.orders);
        break;
        
      case 'order_created':
        queryClient.setQueryData(['orders', storeId], (old) => [
          ...old,
          { ...data.order, isNew: true },
        ]);
        
        // 3초 후 isNew 플래그 제거
        setTimeout(() => {
          queryClient.setQueryData(['orders', storeId], (old) =>
            old.map(o => o.orderId === data.order.orderId 
              ? { ...o, isNew: false } 
              : o
            )
          );
        }, 3000);
        break;
        
      case 'order_updated':
        queryClient.setQueryData(['orders', storeId], (old) =>
          old.map(o => o.orderId === data.orderId 
            ? { ...o, status: data.status } 
            : o
          )
        );
        break;
        
      case 'order_deleted':
        queryClient.setQueryData(['orders', storeId], (old) =>
          old.filter(o => o.orderId !== data.orderId)
        );
        break;
        
      case 'session_ended':
        queryClient.setQueryData(['orders', storeId], (old) =>
          old.filter(o => o.tableId !== data.tableId)
        );
        break;
    }
  }, [storeId, queryClient]);
  
  const connect = useCallback(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_BASE_URL}/admin/orders/sse?store_id=${storeId}`
    );
    
    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
      setReconnectAttempts(0);
      setPollingEnabled(false);
    };
    
    eventSource.onmessage = handleEvent;
    
    eventSource.onerror = () => {
      setConnected(false);
      setError('연결이 끊어졌습니다');
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
    
    eventSourceRef.current = eventSource;
  }, [storeId, reconnectAttempts, handleEvent, setPollingEnabled]);
  
  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);
  
  return { connected, error, reconnectAttempts };
};
```

**폴링 백업**:
```javascript
// OrderDashboard.jsx
const { connected: sseConnected } = useSSE(storeId);
const { pollingEnabled } = useContext(AdminContext);

// 폴링 (SSE 실패 시)
const { data: orders } = useQuery({
  queryKey: ['orders', storeId],
  queryFn: () => fetchOrders(storeId),
  enabled: pollingEnabled,
  refetchInterval: 10000, // 10초
});
```

---

### 2.5 Cache Manager (캐시 관리자)

**책임**:
- React Query 캐시 관리
- 캐시 무효화
- 캐시 전략 설정

**구현**:
```javascript
// config/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 재시도 설정
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // 캐싱 설정
      staleTime: 0, // 기본값 (즉시 stale)
      cacheTime: 5 * 60 * 1000, // 5분
      
      // 에러 처리
      onError: (error) => {
        console.error('Query error:', error);
        Sentry.captureException(error);
      },
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      
      onError: (error) => {
        console.error('Mutation error:', error);
        Sentry.captureException(error);
      },
    },
  },
});
```

**캐싱 전략**:
```javascript
// queries/adminQueries.js

// 메뉴 (5분 캐싱)
export const useMenus = (storeId) => {
  return useQuery({
    queryKey: ['menus', storeId],
    queryFn: () => fetchMenus(storeId),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// 카테고리 (10분 캐싱)
export const useCategories = (storeId) => {
  return useQuery({
    queryKey: ['categories', storeId],
    queryFn: () => fetchCategories(storeId),
    staleTime: 10 * 60 * 1000,
    cacheTime: 20 * 60 * 1000,
  });
};

// 테이블 정보 (5분 캐싱)
export const useTables = (storeId) => {
  return useQuery({
    queryKey: ['tables', storeId],
    queryFn: () => fetchTables(storeId),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// 주문 (캐싱 안함 - SSE로 실시간 업데이트)
export const useOrders = (storeId) => {
  return useQuery({
    queryKey: ['orders', storeId],
    queryFn: () => fetchOrders(storeId),
    staleTime: 0,
    cacheTime: 0,
    refetchInterval: false,
  });
};
```

---

### 2.6 Error Handler (에러 처리자)

**책임**:
- 에러 감지 및 처리
- 에러 로깅 (Sentry)
- 사용자 알림

**구현**:
```javascript
// components/ErrorBoundary.jsx
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
    Sentry.captureException(error, {
      extra: errorInfo,
      tags: {
        component: this.props.componentName || 'Unknown',
      },
    });
    
    console.error('Error caught:', error, errorInfo);
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
```

**Sentry 초기화**:
```javascript
// main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

---

### 2.7 UI Components (UI 컴포넌트)

**책임**:
- 사용자 인터페이스 렌더링
- 사용자 입력 처리
- Material-UI 컴포넌트 활용

**구조**:
```
src/
├── admin/
│   ├── components/
│   │   ├── AdminLogin.jsx
│   │   ├── OrderDashboard.jsx
│   │   ├── TableCard.jsx
│   │   ├── OrderDetailModal.jsx
│   │   ├── TableManagement.jsx
│   │   └── MenuManagement.jsx
│   └── AdminApp.jsx
├── shared/
│   └── components/
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Modal.jsx
│       ├── Toast.jsx
│       └── Loader.jsx
```

---

### 2.8 Router (라우터)

**책임**:
- 페이지 라우팅
- 인증 보호
- 리다이렉트

**구현**:
```javascript
// AdminApp.jsx
const AdminApp = () => {
  const { isAuthenticated } = useContext(AdminContext);
  
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <OrderDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/tables" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <TableManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/menus" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <MenuManagement />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

const ProtectedRoute = ({ isAuthenticated, children }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};
```

---

## 3. 컴포넌트 간 통신

### 3.1 데이터 흐름

```
사용자 입력
    ↓
UI Components
    ↓
API Client (Axios)
    ↓
Backend API
    ↓
API Client (응답)
    ↓
Cache Manager (React Query)
    ↓
State Manager (Context API)
    ↓
UI Components (리렌더링)
```

### 3.2 실시간 업데이트 흐름

```
Backend SSE
    ↓
SSE Manager (EventSource)
    ↓
이벤트 처리 (handleEvent)
    ↓
Cache Manager (queryClient.setQueryData)
    ↓
UI Components (자동 리렌더링)
```

---

## 4. 논리적 컴포넌트 요약

| 컴포넌트 | 책임 | 기술 |
|---------|------|------|
| Auth Manager | 인증 관리 | localStorage, JWT |
| State Manager | 상태 관리 | Context API, React Query |
| API Client | HTTP 통신 | Axios |
| SSE Manager | 실시간 통신 | EventSource |
| Cache Manager | 캐싱 | React Query |
| Error Handler | 에러 처리 | Error Boundary, Sentry |
| UI Components | UI 렌더링 | React, Material-UI |
| Router | 라우팅 | React Router |

---

## 5. 배포 구조

```
┌─────────────────────────────────────────┐
│         Static File Server              │
│         (Nginx / S3 + CloudFront)       │
├─────────────────────────────────────────┤
│  index.html                             │
│  main.js (단일 번들)                     │
│  main.css                               │
│  assets/ (이미지, 폰트)                  │
└─────────────────────────────────────────┘
           ↓ HTTP/HTTPS
┌─────────────────────────────────────────┐
│         Backend API Server              │
│         (FastAPI)                       │
└─────────────────────────────────────────┘
```

**빌드 결과물**:
- `index.html`: 진입점
- `main.js`: 단일 JavaScript 번들 (gzip < 500KB)
- `main.css`: 스타일시트
- `assets/`: 정적 자산
