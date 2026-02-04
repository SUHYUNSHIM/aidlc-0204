# 컴포넌트 의존성 및 통신 패턴

## 1. 의존성 매트릭스

### 백엔드 컴포넌트 의존성

| 컴포넌트 | 의존하는 컴포넌트 |
|---------|------------------|
| **CustomerRouter** | OrderService, MenuService, AuthService |
| **AdminRouter** | OrderService, TableService, MenuService, AuthService, SSEService |
| **AuthService** | StoreRepository, TableRepository, TableSessionRepository |
| **OrderService** | OrderRepository, TableSessionRepository, MenuRepository, SSEService |
| **TableService** | TableRepository, TableSessionRepository, OrderRepository, OrderHistoryRepository, SSEService |
| **MenuService** | MenuRepository, CacheManager |
| **SSEService** | OrderRepository |
| **StoreRepository** | DatabaseConnection, Store (Model) |
| **TableRepository** | DatabaseConnection, Table (Model) |
| **TableSessionRepository** | DatabaseConnection, TableSession (Model) |
| **OrderRepository** | DatabaseConnection, Order (Model), OrderItem (Model) |
| **MenuRepository** | DatabaseConnection, Menu (Model), Category (Model) |
| **OrderHistoryRepository** | DatabaseConnection, OrderHistory (Model) |
| **CacheManager** | Redis/In-Memory Cache |
| **Logger** | None (독립적) |
| **ErrorHandler** | Logger |

### 프론트엔드 컴포넌트 의존성

| 컴포넌트 | 의존하는 컴포넌트 |
|---------|------------------|
| **CustomerApp** | MenuBrowser, Cart, OrderConfirmation, OrderHistory, AuthContext |
| **AdminApp** | AdminLogin, OrderDashboard, TableManagement, MenuManagement, AuthContext |
| **MenuBrowser** | MenuCard, CategoryFilter, API Client (React Query) |
| **Cart** | CartItem, Button, API Client |
| **OrderDashboard** | TableCard, OrderDetailModal, SSE Client, API Client |
| **TableCard** | Button, Badge |
| **OrderDetailModal** | Modal, Button, OrderStatusDropdown |
| **MenuManagement** | MenuForm, MenuList, Button, Modal, API Client |

---

## 2. 레이어별 통신 패턴

### 2.1 프론트엔드 → 백엔드 통신

#### HTTP 요청 (React Query + Axios)
```
React Component
    ↓ (useQuery/useMutation)
React Query
    ↓ (HTTP request)
Axios Client
    ↓ (REST API)
FastAPI Router (API Layer)
```

**예시: 메뉴 조회**
```typescript
// React Component
const { data: menus } = useQuery(['menus', storeId], () => 
  axios.get(`/customer/menus?store_id=${storeId}`)
);
```

#### SSE 연결 (관리자 대시보드)
```
React Component (OrderDashboard)
    ↓ (EventSource)
SSE Connection
    ↓ (Server-Sent Events)
FastAPI SSE Endpoint (/admin/orders/sse)
    ↓
SSEService
```

**예시: 실시간 주문 업데이트**
```typescript
// React Component
useEffect(() => {
  const eventSource = new EventSource('/admin/orders/sse');
  eventSource.onmessage = (event) => {
    const orderUpdate = JSON.parse(event.data);
    updateOrderState(orderUpdate);
  };
  return () => eventSource.close();
}, []);
```

### 2.2 백엔드 레이어 간 통신

#### API Layer → Service Layer
```
FastAPI Router
    ↓ (function call)
Service (Business Logic)
    ↓ (return result)
FastAPI Router
    ↓ (HTTP response)
Client
```

**예시: 주문 생성**
```python
# API Layer (CustomerRouter)
@router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    order = order_service.create_order(
        session_id=current_user["session_id"],
        table_id=current_user["table_id"],
        store_id=current_user["store_id"],
        items=order_data.items
    )
    return order
```

#### Service Layer → Repository Layer
```
Service
    ↓ (method call)
Repository
    ↓ (SQLAlchemy query)
Database
    ↓ (result)
Repository
    ↓ (return model)
Service
```

**예시: 주문 조회**
```python
# Service Layer (OrderService)
def get_orders_by_session(self, session_id: str) -> List[Order]:
    orders = self.order_repo.get_by_session(session_id)
    return orders

# Repository Layer (OrderRepository)
def get_by_session(self, session_id: str) -> List[Order]:
    return self.db.query(Order).filter(Order.session_id == session_id).all()
```

### 2.3 서비스 간 통신

#### OrderService → SSEService (실시간 업데이트)
```
OrderService.create_order()
    ↓ (broadcast)
SSEService.broadcast_order_update()
    ↓ (send to all connections)
Admin UI (SSE clients)
```

#### TableService → OrderHistoryRepository (세션 종료)
```
TableService.end_session()
    ↓ (get orders)
OrderRepository.get_by_session()
    ↓ (archive)
OrderHistoryRepository.create()
    ↓ (end session)
TableSessionRepository.end_session()
```

---

## 3. 데이터 흐름 다이어그램

### 3.1 고객 주문 생성 플로우

```
[Customer UI]
    |
    | 1. POST /customer/orders
    v
[CustomerRouter]
    |
    | 2. create_order()
    v
[OrderService]
    |
    | 3. validate session
    v
[TableSessionRepository] → [Database]
    |
    | 4. validate menu prices
    v
[MenuRepository] → [Database]
    |
    | 5. create order
    v
[OrderRepository] → [Database]
    |
    | 6. broadcast update
    v
[SSEService]
    |
    | 7. SSE push
    v
[Admin UI - OrderDashboard]
```

### 3.2 관리자 주문 상태 변경 플로우

```
[Admin UI]
    |
    | 1. PATCH /admin/orders/{id}/status
    v
[AdminRouter]
    |
    | 2. update_order_status()
    v
[OrderService]
    |
    | 3. get order
    v
[OrderRepository] → [Database]
    |
    | 4. validate status transition
    v
[OrderService]
    |
    | 5. update status
    v
[OrderRepository] → [Database]
    |
    | 6. broadcast update
    v
[SSEService]
    |
    | 7. SSE push
    v
[Admin UI - OrderDashboard]
    |
    | 8. SSE push
    v
[Customer UI - OrderHistory]
```

### 3.3 메뉴 조회 플로우 (캐싱)

```
[Customer UI]
    |
    | 1. GET /customer/menus
    v
[CustomerRouter]
    |
    | 2. get_menus_by_store()
    v
[MenuService]
    |
    | 3. check cache
    v
[CacheManager]
    |
    | 4a. cache hit → return
    | 4b. cache miss → query DB
    v
[MenuRepository] → [Database]
    |
    | 5. save to cache
    v
[CacheManager]
    |
    | 6. return menus
    v
[Customer UI]
```

### 3.4 테이블 세션 종료 플로우

```
[Admin UI]
    |
    | 1. POST /admin/tables/{id}/end-session
    v
[AdminRouter]
    |
    | 2. end_session()
    v
[TableService]
    |
    | 3. get session orders
    v
[OrderRepository] → [Database]
    |
    | 4. archive orders
    v
[OrderHistoryRepository] → [Database]
    |
    | 5. end session
    v
[TableSessionRepository] → [Database]
    |
    | 6. reset table
    v
[TableRepository] → [Database]
    |
    | 7. broadcast update
    v
[SSEService]
    |
    | 8. SSE push
    v
[Admin UI - OrderDashboard]
```

---

## 4. 통신 프로토콜

### 4.1 HTTP REST API

**Base URL**: `http://localhost:8000`

**고객용 엔드포인트**:
- `POST /customer/login` - 테이블 자동 로그인
- `GET /customer/menus` - 메뉴 조회
- `POST /customer/orders` - 주문 생성
- `GET /customer/orders` - 주문 내역 조회

**관리자용 엔드포인트**:
- `POST /admin/login` - 관리자 로그인
- `GET /admin/orders` - 주문 목록 조회
- `PATCH /admin/orders/{id}/status` - 주문 상태 변경
- `DELETE /admin/orders/{id}` - 주문 삭제
- `GET /admin/orders/sse` - 실시간 주문 업데이트 (SSE)
- `POST /admin/tables` - 테이블 생성
- `POST /admin/tables/{id}/end-session` - 세션 종료
- `GET /admin/tables/{id}/history` - 과거 주문 내역
- `GET /admin/menus` - 메뉴 목록 조회
- `POST /admin/menus` - 메뉴 생성
- `PATCH /admin/menus/{id}` - 메뉴 수정
- `DELETE /admin/menus/{id}` - 메뉴 삭제

### 4.2 Server-Sent Events (SSE)

**엔드포인트**: `GET /admin/orders/sse`

**이벤트 타입**:
- `initial`: 초기 전체 주문 목록
- `order_created`: 새로운 주문 생성
- `order_updated`: 주문 상태 변경
- `order_deleted`: 주문 삭제
- `session_ended`: 테이블 세션 종료

**이벤트 데이터 형식**:
```json
{
  "event_type": "order_created",
  "data": {
    "order_id": 123,
    "table_id": 5,
    "table_number": 5,
    "total_amount": 25000,
    "status": "대기중",
    "items": [...]
  }
}
```

### 4.3 인증 (JWT)

**헤더**: `Authorization: Bearer <token>`

**토큰 페이로드**:
```json
{
  "user_id": "admin_123" | "table_5",
  "user_type": "admin" | "table",
  "store_id": "store_abc",
  "session_id": "uuid-session-id" (테이블만),
  "exp": 1234567890
}
```

---

## 5. 의존성 주입 패턴

### FastAPI Dependency Injection

```python
# dependencies.py
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = auth_service.verify_jwt_token(token)
    return payload

# router.py
@router.post("/orders")
async def create_order(
    order_data: OrderCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Use current_user and db
    pass
```

### 서비스 의존성 주입

```python
# main.py (application startup)
def create_app():
    # Database
    db_connection = DatabaseConnection()
    
    # Repositories
    store_repo = StoreRepository(db_connection)
    table_repo = TableRepository(db_connection)
    session_repo = TableSessionRepository(db_connection)
    order_repo = OrderRepository(db_connection)
    menu_repo = MenuRepository(db_connection)
    history_repo = OrderHistoryRepository(db_connection)
    
    # Services
    auth_service = AuthService(store_repo, table_repo, session_repo)
    sse_service = SSEService(order_repo)
    order_service = OrderService(order_repo, session_repo, menu_repo, sse_service)
    table_service = TableService(table_repo, session_repo, order_repo, history_repo, sse_service)
    menu_service = MenuService(menu_repo, CacheManager())
    
    # Routers
    customer_router = CustomerRouter(order_service, menu_service, auth_service)
    admin_router = AdminRouter(order_service, table_service, menu_service, auth_service, sse_service)
    
    return app
```

---

## 6. 에러 전파 패턴

### 계층별 에러 처리

```
Repository Layer
    ↓ (raises DatabaseError)
Service Layer
    ↓ (catches, logs, raises BusinessLogicError)
API Layer
    ↓ (catches, returns HTTP error response)
Client
```

**예시**:
```python
# Repository Layer
def get_by_id(self, order_id: int) -> Order:
    order = self.db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundException(f"Order {order_id} not found")
    return order

# Service Layer
def update_order_status(self, order_id: int, new_status: str) -> Order:
    try:
        order = self.order_repo.get_by_id(order_id)
        # Business logic validation
        if not self._is_valid_status_transition(order.status, new_status):
            raise InvalidStatusTransitionError(f"Cannot transition from {order.status} to {new_status}")
        order = self.order_repo.update_status(order_id, new_status)
        self.sse_service.broadcast_order_update(order.store_id, order.to_dict())
        return order
    except NotFoundException as e:
        logger.error(f"Order not found: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to update order status: {e}")
        raise

# API Layer
@router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: int, status_data: StatusUpdate):
    try:
        order = order_service.update_order_status(order_id, status_data.status)
        return order
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InvalidStatusTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
```

---

## 7. 컴포넌트 격리 및 테스트 전략

### 단위 테스트 (Service Layer)
```python
# Mock dependencies
mock_order_repo = Mock(spec=OrderRepository)
mock_sse_service = Mock(spec=SSEService)

# Test service in isolation
order_service = OrderService(mock_order_repo, mock_session_repo, mock_menu_repo, mock_sse_service)
order = order_service.create_order(...)

# Verify interactions
mock_order_repo.create.assert_called_once()
mock_sse_service.broadcast_order_update.assert_called_once()
```

### 통합 테스트 (API Layer)
```python
# Use TestClient with real services but test database
client = TestClient(app)
response = client.post("/customer/orders", json=order_data, headers={"Authorization": f"Bearer {token}"})
assert response.status_code == 201
```

### E2E 테스트
```python
# Full stack test with real database and SSE
# 1. Customer creates order
# 2. Verify order appears in admin dashboard via SSE
# 3. Admin updates order status
# 4. Verify status update appears in customer order history
```
