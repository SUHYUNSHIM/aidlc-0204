# Contract/Interface Definition for Unit 2: Admin Frontend

## Unit Context
- **Unit**: unit2-admin-frontend
- **Stories**: US-009 ~ US-022 (14개 스토리)
- **Dependencies**: 
  - Backend API (FastAPI) - REST API 및 SSE
  - localStorage (브라우저 저장소)
- **Database Entities**: None (Frontend는 데이터 소유 안함)
- **Service Boundaries**: 관리자 인증, 주문 모니터링, 테이블 관리, 메뉴 관리

---

## 1. Hooks Layer (Custom React Hooks)

### useAuth
관리자 인증 상태 관리

```typescript
interface AdminUser {
  userId: string;
  username: string;
  storeId: string;
  token: string;
  tokenExpiry: number;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  login: (storeId: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

function useAuth(): UseAuthReturn
```

- **Args**: None
- **Returns**: `UseAuthReturn` - 인증 상태 및 메서드
- **Raises**: None (에러는 login 메서드에서 throw)

---

### useSSE
SSE 실시간 연결 관리

```typescript
interface UseSSEReturn {
  connected: boolean;
  error: string | null;
  reconnectAttempts: number;
}

function useSSE(storeId: string): UseSSEReturn
```

- **Args**:
  - `storeId` (string): 매장 ID
- **Returns**: `UseSSEReturn` - SSE 연결 상태
- **Raises**: None (에러는 상태로 반환)

---

## 2. API Client Layer

### apiClient
Axios 인스턴스 (JWT 토큰 자동 추가)

```typescript
const apiClient: AxiosInstance
```

- **Interceptors**:
  - Request: JWT 토큰 자동 추가
  - Response: 401 에러 시 자동 로그아웃

---

### orders API

```typescript
function fetchOrders(storeId: string): Promise<Order[]>
```
- **Args**: `storeId` (string) - 매장 ID
- **Returns**: `Promise<Order[]>` - 주문 목록
- **Raises**: `AxiosError` - API 에러

```typescript
function updateOrderStatus(orderId: number, status: OrderStatus): Promise<void>
```
- **Args**:
  - `orderId` (number) - 주문 ID
  - `status` (OrderStatus) - 새 상태
- **Returns**: `Promise<void>`
- **Raises**: `AxiosError` - API 에러

```typescript
function deleteOrder(orderId: number): Promise<void>
```
- **Args**: `orderId` (number) - 주문 ID
- **Returns**: `Promise<void>`
- **Raises**: `AxiosError` - API 에러

---

### menus API

```typescript
function fetchMenus(storeId: string): Promise<Menu[]>
```
- **Args**: `storeId` (string) - 매장 ID
- **Returns**: `Promise<Menu[]>` - 메뉴 목록
- **Raises**: `AxiosError` - API 에러

```typescript
function createMenu(menuData: MenuCreate): Promise<Menu>
```
- **Args**: `menuData` (MenuCreate) - 메뉴 생성 데이터
- **Returns**: `Promise<Menu>` - 생성된 메뉴
- **Raises**: `AxiosError` - API 에러

```typescript
function updateMenu(menuId: number, menuData: MenuUpdate): Promise<Menu>
```
- **Args**:
  - `menuId` (number) - 메뉴 ID
  - `menuData` (MenuUpdate) - 수정 데이터
- **Returns**: `Promise<Menu>` - 수정된 메뉴
- **Raises**: `AxiosError` - API 에러

```typescript
function deleteMenu(menuId: number): Promise<void>
```
- **Args**: `menuId` (number) - 메뉴 ID
- **Returns**: `Promise<void>`
- **Raises**: `AxiosError` - API 에러

---

### tables API

```typescript
function fetchTables(storeId: string): Promise<Table[]>
```
- **Args**: `storeId` (string) - 매장 ID
- **Returns**: `Promise<Table[]>` - 테이블 목록
- **Raises**: `AxiosError` - API 에러

```typescript
function createTable(tableData: TableCreate): Promise<Table>
```
- **Args**: `tableData` (TableCreate) - 테이블 생성 데이터
- **Returns**: `Promise<Table>` - 생성된 테이블
- **Raises**: `AxiosError` - API 에러

```typescript
function endTableSession(tableId: number): Promise<void>
```
- **Args**: `tableId` (number) - 테이블 ID
- **Returns**: `Promise<void>`
- **Raises**: `AxiosError` - API 에러

```typescript
function fetchTableHistory(tableId: number, page: number, limit: number): Promise<OrderHistory[]>
```
- **Args**:
  - `tableId` (number) - 테이블 ID
  - `page` (number) - 페이지 번호
  - `limit` (number) - 페이지당 항목 수
- **Returns**: `Promise<OrderHistory[]>` - 과거 주문 내역
- **Raises**: `AxiosError` - API 에러

---

## 3. React Query Hooks Layer

### useOrders
주문 목록 조회

```typescript
function useOrders(storeId: string): UseQueryResult<Order[], AxiosError>
```
- **Args**: `storeId` (string) - 매장 ID
- **Returns**: `UseQueryResult<Order[], AxiosError>` - React Query 결과
- **Raises**: None (에러는 result.error로 반환)

---

### useUpdateOrderStatus
주문 상태 변경 (낙관적 업데이트)

```typescript
function useUpdateOrderStatus(): UseMutationResult<void, AxiosError, UpdateOrderStatusParams>
```
- **Args**: None
- **Returns**: `UseMutationResult` - React Query mutation 결과
- **Raises**: None (에러는 onError 콜백으로 처리)

---

### useDeleteOrder
주문 삭제 (낙관적 업데이트)

```typescript
function useDeleteOrder(): UseMutationResult<void, AxiosError, number>
```
- **Args**: None
- **Returns**: `UseMutationResult` - React Query mutation 결과
- **Raises**: None (에러는 onError 콜백으로 처리)

---

### useMenus
메뉴 목록 조회 (5분 캐싱)

```typescript
function useMenus(storeId: string): UseQueryResult<Menu[], AxiosError>
```
- **Args**: `storeId` (string) - 매장 ID
- **Returns**: `UseQueryResult<Menu[], AxiosError>` - React Query 결과
- **Raises**: None (에러는 result.error로 반환)

---

### useCreateMenu
메뉴 생성 (낙관적 업데이트)

```typescript
function useCreateMenu(): UseMutationResult<Menu, AxiosError, MenuCreate>
```
- **Args**: None
- **Returns**: `UseMutationResult` - React Query mutation 결과
- **Raises**: None (에러는 onError 콜백으로 처리)

---

### useUpdateMenu
메뉴 수정 (낙관적 업데이트)

```typescript
function useUpdateMenu(): UseMutationResult<Menu, AxiosError, UpdateMenuParams>
```
- **Args**: None
- **Returns**: `UseMutationResult` - React Query mutation 결과
- **Raises**: None (에러는 onError 콜백으로 처리)

---

### useDeleteMenu
메뉴 삭제 (낙관적 업데이트)

```typescript
function useDeleteMenu(): UseMutationResult<void, AxiosError, number>
```
- **Args**: None
- **Returns**: `UseMutationResult` - React Query mutation 결과
- **Raises**: None (에러는 onError 콜백으로 처리)

---

## 4. Component Layer

### AdminLogin
관리자 로그인 컴포넌트

```typescript
interface AdminLoginProps {}

function AdminLogin(props: AdminLoginProps): JSX.Element
```
- **Props**: None
- **Returns**: JSX.Element
- **State**:
  - `storeId`: string
  - `username`: string
  - `password`: string
  - `isLoading`: boolean
  - `error`: string | null

---

### OrderDashboard
실시간 주문 대시보드

```typescript
interface OrderDashboardProps {}

function OrderDashboard(props: OrderDashboardProps): JSX.Element
```
- **Props**: None
- **Returns**: JSX.Element
- **Hooks Used**:
  - `useOrders(storeId)`
  - `useSSE(storeId)`
  - `useContext(AdminContext)`

---

### TableCard
테이블 카드 컴포넌트

```typescript
interface TableCardProps {
  tableOrders: TableOrders;
  isNew: boolean;
  onClick: () => void;
}

const TableCard = React.memo<TableCardProps>((props) => JSX.Element)
```
- **Props**:
  - `tableOrders` (TableOrders) - 테이블별 주문 정보
  - `isNew` (boolean) - 신규 주문 강조 여부
  - `onClick` (() => void) - 클릭 핸들러
- **Returns**: JSX.Element
- **Memo**: Props 비교로 리렌더링 최적화

---

### OrderDetailModal
주문 상세 모달

```typescript
interface OrderDetailModalProps {
  open: boolean;
  tableId: number;
  orders: Order[];
  onClose: () => void;
}

function OrderDetailModal(props: OrderDetailModalProps): JSX.Element
```
- **Props**:
  - `open` (boolean) - 모달 열림 상태
  - `tableId` (number) - 테이블 ID
  - `orders` (Order[]) - 주문 목록
  - `onClose` (() => void) - 닫기 핸들러
- **Returns**: JSX.Element

---

### MenuManagement
메뉴 관리 컴포넌트

```typescript
interface MenuManagementProps {}

function MenuManagement(props: MenuManagementProps): JSX.Element
```
- **Props**: None
- **Returns**: JSX.Element
- **Hooks Used**:
  - `useMenus(storeId)`
  - `useCreateMenu()`
  - `useUpdateMenu()`
  - `useDeleteMenu()`

---

### TableManagement
테이블 관리 컴포넌트

```typescript
interface TableManagementProps {}

function TableManagement(props: TableManagementProps): JSX.Element
```
- **Props**: None
- **Returns**: JSX.Element
- **Hooks Used**:
  - `useTables(storeId)`
  - `useCreateTable()`
  - `useEndTableSession()`
  - `useFetchTableHistory()`

---

## 5. Utility Functions

### groupOrdersByTable
주문을 테이블별로 그룹화

```typescript
function groupOrdersByTable(orders: Order[]): Map<number, TableOrders>
```
- **Args**: `orders` (Order[]) - 주문 목록
- **Returns**: `Map<number, TableOrders>` - 테이블 ID → TableOrders 매핑
- **Raises**: None

---

### encodeImageToBase64
이미지를 Base64로 인코딩

```typescript
function encodeImageToBase64(file: File): Promise<string>
```
- **Args**: `file` (File) - 이미지 파일
- **Returns**: `Promise<string>` - Base64 인코딩된 문자열
- **Raises**: `Error` - 파일 크기 > 1MB 또는 읽기 실패

---

### isValidTransition
주문 상태 전환 유효성 검증

```typescript
function isValidTransition(from: OrderStatus, to: OrderStatus): boolean
```
- **Args**:
  - `from` (OrderStatus) - 현재 상태
  - `to` (OrderStatus) - 새 상태
- **Returns**: `boolean` - 전환 가능 여부
- **Raises**: None

---

## 6. Type Definitions

### Order
```typescript
interface Order {
  orderId: number;
  orderNumber: string;
  tableId: number;
  tableNumber: number;
  sessionId: string;
  totalAmount: number;
  status: OrderStatus;
  orderTime: string;
  items: OrderItem[];
  isNew?: boolean;
}

type OrderStatus = 'pending' | 'preparing' | 'completed';
```

### Menu
```typescript
interface Menu {
  menuId: number;
  menuName: string;
  price: number;
  description: string;
  categoryId: number;
  categoryName: string;
  imageBase64: string | null;
  displayOrder: number;
  isAvailable: boolean;
  storeId: string;
}

interface MenuCreate {
  menuName: string;
  price: number;
  description: string;
  categoryId: number;
  imageBase64?: string;
  storeId: string;
}

interface MenuUpdate {
  menuName?: string;
  price?: number;
  description?: string;
  categoryId?: number;
  imageBase64?: string;
}
```

### Table
```typescript
interface Table {
  tableId: number;
  tableNumber: number;
  tablePassword: string;
  storeId: string;
  sessionId: string | null;
  isActive: boolean;
  createdAt: string;
}

interface TableCreate {
  tableNumber: number;
  tablePassword: string;
  storeId: string;
}
```

---

## 7. Context Definition

### AdminContext
```typescript
interface AdminContextValue {
  // 인증
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  login: (storeId: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  
  // UI 상태
  selectedTableId: number | null;
  setSelectedTableId: (id: number | null) => void;
  showOrderDetailModal: boolean;
  setShowOrderDetailModal: (show: boolean) => void;
  
  // SSE 상태
  sseConnected: boolean;
  setSseConnected: (connected: boolean) => void;
  sseError: string | null;
  setSseError: (error: string | null) => void;
  pollingEnabled: boolean;
  setPollingEnabled: (enabled: boolean) => void;
}

const AdminContext = React.createContext<AdminContextValue | undefined>(undefined);
```

---

## 8. Story Mapping

| Contract | Stories |
|----------|---------|
| useAuth, AdminLogin | US-009 |
| useSSE, OrderDashboard, TableCard | US-010, US-013 |
| OrderDetailModal | US-011 |
| useUpdateOrderStatus | US-012 |
| useDeleteOrder | US-015 |
| TableManagement, useCreateTable | US-014 |
| useEndTableSession | US-016 |
| useFetchTableHistory | US-017 |
| MenuManagement, useMenus | US-018 |
| useCreateMenu | US-019 |
| useUpdateMenu | US-020, US-022 |
| useDeleteMenu | US-021 |
