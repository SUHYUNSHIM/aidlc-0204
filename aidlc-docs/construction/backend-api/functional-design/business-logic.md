# 비즈니스 로직 상세 설계

## 1. AuthService (인증 서비스)

### 1.1 테이블 인증 플로우

```python
def authenticate_table(store_id: int, table_number: int, table_password: str) -> dict:
    """
    테이블 인증 및 세션 관리
    
    플로우:
    1. 매장 존재 확인
    2. 테이블 조회
    3. 비밀번호 검증
    4. 세션 확인/생성
    5. JWT 토큰 발급
    """
```

#### 상세 로직

**Step 1: 매장 확인**
```
입력: store_id (integer)
처리: StoreRepository.get_by_id(store_id)
실패 시: NotFoundException("Store not found")
```

**Step 2: 테이블 조회**
```
입력: store_id, table_number
처리: TableRepository.get_by_store_and_number(store_id, table_number)
실패 시: NotFoundException("Table not found")
```

**Step 3: 비밀번호 검증**
```
입력: table_password, table.table_password_hash
처리: bcrypt.checkpw(table_password.encode(), table_password_hash.encode())
실패 시: AuthenticationError("Invalid credentials")
```

**Step 4: 세션 확인/생성**
```
IF table.current_session_id IS NOT NULL:
    session = TableSessionRepository.get_by_id(table.current_session_id)
    IF session.is_active:
        RETURN existing session
    ELSE:
        # 비활성 세션 - 새 세션 필요
        PASS

# 새 세션 생성 (UUID는 DB에서 gen_random_uuid()로 자동 생성)
session = TableSession(
    table_id=table.table_id,
    start_time=datetime.utcnow(),
    is_active=True
)
TableSessionRepository.create(session)
# 트리거가 table.current_session_id를 자동 업데이트
```

**Step 5: JWT 토큰 생성**
```
payload = {
    "sub": f"table_{table.table_id}",
    "user_type": "table",
    "store_id": store_id,
    "table_id": table.table_id,
    "table_number": table.table_number,
    "session_id": str(session.session_id),
    "exp": datetime.utcnow() + timedelta(hours=16),
    "iat": datetime.utcnow()
}
token = jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")
```

---

### 1.2 관리자 인증 플로우

```python
def authenticate_admin(username: str, password: str) -> dict:
    """
    관리자 인증
    
    플로우:
    1. 사용자명으로 매장 조회
    2. 비밀번호 검증
    3. JWT 토큰 발급
    """
```

#### 상세 로직

```
Step 1: 사용자명으로 매장 조회
    store = StoreRepository.get_by_admin_username(username)
    IF store IS NULL:
        RAISE AuthenticationError("Invalid credentials")

Step 2: 비밀번호 검증
    IF NOT bcrypt.checkpw(password, store.admin_password_hash):
        RAISE AuthenticationError("Invalid credentials")

Step 3: JWT 토큰 생성
    payload = {
        "sub": username,
        "user_type": "admin",
        "store_id": store.store_id,
        "exp": datetime.utcnow() + timedelta(hours=16),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")
```

---

### 1.3 JWT 토큰 검증

```python
def verify_jwt_token(token: str) -> dict:
    """
    JWT 토큰 검증 및 페이로드 추출
    
    검증 항목:
    1. 서명 유효성
    2. 만료 시간
    3. 필수 클레임 존재
    """
```

```
TRY:
    payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
    
    # 필수 클레임 확인
    required_claims = ["sub", "user_type", "store_id", "exp"]
    FOR claim IN required_claims:
        IF claim NOT IN payload:
            RAISE InvalidTokenError("Missing required claim")
    
    RETURN payload

EXCEPT jwt.ExpiredSignatureError:
    RAISE AuthenticationError("Token has expired")
EXCEPT jwt.InvalidTokenError:
    RAISE AuthenticationError("Invalid token")
```

---

## 2. OrderService (주문 서비스)

### 2.1 주문 생성

```python
def create_order(
    session_id: UUID,
    table_id: int,
    store_id: int,
    items: List[OrderItemCreate]
) -> Order:
    """
    새로운 주문 생성
    
    플로우:
    1. 세션 유효성 검증
    2. 메뉴 검증 및 가격 조회
    3. 총 금액 계산
    4. 주문 저장
    5. SSE 브로드캐스트
    """
```

#### 상세 로직

**Step 1: 세션 유효성 검증**
```
session = TableSessionRepository.get_by_id(session_id)
IF session IS NULL:
    RAISE NotFoundException("Session not found")
IF NOT session.is_active:
    RAISE ConflictError("Session has ended")

# 테이블 정보로 store_id 검증
table = TableRepository.get_by_id(session.table_id)
IF table.store_id != store_id:
    RAISE ForbiddenError("Store mismatch")
```

**Step 2: 메뉴 검증 및 가격 조회**
```
order_items = []
FOR item IN items:
    IF item.quantity <= 0:
        RAISE ValidationError("Quantity must be positive")
    
    menu = MenuRepository.get_by_id(item.menu_id)
    IF menu IS NULL:
        RAISE NotFoundException(f"Menu not found: {item.menu_id}")
    IF menu.store_id != store_id:
        RAISE ForbiddenError("Menu does not belong to this store")
    
    order_items.append({
        "menu_id": menu.menu_id,
        "quantity": item.quantity,
        "unit_price": menu.price  # 스냅샷
    })
```

**Step 3: 총 금액 계산**
```
total_amount = 0
FOR item IN order_items:
    total_amount += item["quantity"] * item["unit_price"]
```

**Step 4: 주문 저장 (트랜잭션)**
```
BEGIN TRANSACTION

order = Order(
    session_id=session_id,
    table_id=table_id,
    store_id=store_id,
    total_amount=total_amount,
    status="대기중",
    order_time=datetime.utcnow()
)
OrderRepository.create(order)

FOR item IN order_items:
    order_item = OrderItem(
        order_id=order.order_id,
        menu_id=item["menu_id"],
        quantity=item["quantity"],
        unit_price=item["unit_price"]
    )
    OrderItemRepository.create(order_item)

COMMIT TRANSACTION
```

**Step 5: SSE 브로드캐스트**
```
# 메뉴명은 JOIN으로 조회
items_with_names = []
FOR item IN order_items:
    menu = MenuRepository.get_by_id(item["menu_id"])
    items_with_names.append({
        "menu_id": item["menu_id"],
        "menu_name": menu.menu_name,
        "quantity": item["quantity"],
        "unit_price": item["unit_price"],
        "subtotal": item["quantity"] * item["unit_price"]
    })

event_data = {
    "order_id": order.order_id,
    "table_id": table_id,
    "table_number": table.table_number,
    "total_amount": total_amount,
    "status": "대기중",
    "order_time": order.order_time.isoformat(),
    "items": items_with_names
}
SSEService.broadcast_order_update(store_id, "order_created", event_data)
```

---

### 2.2 주문 상태 변경

```python
def update_order_status(order_id: int, new_status: str, store_id: int) -> Order:
    """
    주문 상태 업데이트 (부분 강제)
    
    허용되는 전환:
    - 대기중 → 준비중 ✓
    - 대기중 → 완료 ✓ (준비중 건너뛰기 허용)
    - 준비중 → 완료 ✓
    - 완료 → * ✗ (역방향 불가)
    """
```

#### 상세 로직

```
# 유효한 상태값 확인
VALID_STATUSES = ["대기중", "준비중", "완료"]
IF new_status NOT IN VALID_STATUSES:
    RAISE ValidationError("Invalid status value")

# 주문 조회
order = OrderRepository.get_by_id(order_id)
IF order IS NULL:
    RAISE NotFoundException("Order not found")
IF order.store_id != store_id:
    RAISE ForbiddenError("Order does not belong to this store")

# 상태 전환 검증 (부분 강제)
current_status = order.status

IF current_status == "완료":
    RAISE ValidationError("Cannot change status of completed order")

IF current_status == new_status:
    RETURN order  # 변경 없음

# 상태 업데이트
order.status = new_status
OrderRepository.update(order)

# SSE 브로드캐스트
event_data = {
    "order_id": order_id,
    "table_id": order.table_id,
    "status": new_status
}
SSEService.broadcast_order_update(store_id, "order_updated", event_data)

RETURN order
```

---

### 2.3 주문 삭제

```python
def delete_order(order_id: int, store_id: int) -> dict:
    """
    주문 삭제 (직권 수정)
    
    플로우:
    1. 주문 조회
    2. 주문 삭제
    3. SSE 브로드캐스트
    """
```

#### 상세 로직

```
# 주문 조회
order = OrderRepository.get_by_id(order_id)
IF order IS NULL:
    RAISE NotFoundException("Order not found")
IF order.store_id != store_id:
    RAISE ForbiddenError("Order does not belong to this store")

table_id = order.table_id

# 주문 삭제 (CASCADE로 OrderItem도 삭제)
OrderRepository.delete(order_id)

# SSE 브로드캐스트
event_data = {
    "order_id": order_id,
    "table_id": table_id
}
SSEService.broadcast_order_update(store_id, "order_deleted", event_data)

RETURN {
    "order_id": order_id,
    "table_id": table_id
}
```

---

## 3. TableService (테이블 서비스)

### 3.1 테이블 생성

```python
def create_table(store_id: int, table_number: int, table_password: str) -> Table:
    """
    새 테이블 생성
    """
```

#### 상세 로직

```
# 중복 확인
existing = TableRepository.get_by_store_and_number(store_id, table_number)
IF existing IS NOT NULL:
    RAISE ConflictError("Table number already exists")

# 비밀번호 해싱
password_hash = bcrypt.hashpw(table_password.encode(), bcrypt.gensalt())

# 테이블 생성
table = Table(
    store_id=store_id,
    table_number=table_number,
    table_password_hash=password_hash.decode(),
    current_session_id=None
)
TableRepository.create(table)

RETURN table
```

---

### 3.2 세션 종료 (매장 이용 완료)

```python
def end_session(table_id: int, store_id: int) -> dict:
    """
    테이블 세션 종료
    
    플로우:
    1. 테이블 및 세션 확인
    2. 주문 데이터 아카이브
    3. 세션 종료 (트리거가 테이블 리셋)
    4. SSE 브로드캐스트
    """
```

#### 상세 로직

**Step 1: 테이블 및 세션 확인**
```
table = TableRepository.get_by_id(table_id)
IF table IS NULL:
    RAISE NotFoundException("Table not found")
IF table.store_id != store_id:
    RAISE ForbiddenError("Table does not belong to this store")
IF table.current_session_id IS NULL:
    RAISE ConflictError("No active session")

session = TableSessionRepository.get_by_id(table.current_session_id)
IF NOT session.is_active:
    RAISE ConflictError("Session already ended")
```

**Step 2: 주문 데이터 아카이브**
```
orders = OrderRepository.get_by_session(session.session_id)

# 주문 데이터 JSON 직렬화
order_data = {
    "orders": [],
    "session_total": 0
}

FOR order IN orders:
    items = OrderItemRepository.get_by_order(order.order_id)
    order_dict = {
        "order_id": order.order_id,
        "order_time": order.order_time.isoformat(),
        "total_amount": order.total_amount,
        "status": order.status,
        "items": [
            {
                "menu_name": MenuRepository.get_by_id(item.menu_id).menu_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price
            }
            FOR item IN items
        ]
    }
    order_data["orders"].append(order_dict)
    order_data["session_total"] += order.total_amount

# OrderHistory 저장
history = OrderHistory(
    session_id=session.session_id,
    table_id=table_id,
    store_id=store_id,
    completed_time=datetime.utcnow(),
    archived_order_data=order_data
)
OrderHistoryRepository.create(history)
```

**Step 3: 세션 종료**
```
session.is_active = False
session.end_time = datetime.utcnow()
TableSessionRepository.update(session)
# 트리거가 table.current_session_id를 NULL로 자동 설정
```

**Step 4: SSE 브로드캐스트**
```
event_data = {
    "table_id": table_id,
    "table_number": table.table_number,
    "session_id": str(session.session_id)
}
SSEService.broadcast_order_update(store_id, "session_ended", event_data)

RETURN {
    "table_id": table_id,
    "table_number": table.table_number,
    "session_id": session.session_id,
    "total_session_amount": order_data["session_total"],
    "order_count": len(orders)
}
```

---

## 4. MenuService (메뉴 서비스)

### 4.1 메뉴 조회 (캐싱)

```python
def get_menus_by_store(store_id: int, category_id: int = None) -> dict:
    """
    매장별 메뉴 조회 (캐싱 적용)
    
    캐시 키: menu:{store_id} 또는 menu:{store_id}:{category_id}
    TTL: 1시간
    """
```

#### 상세 로직

```
# 캐시 키 생성
IF category_id IS NOT NULL:
    cache_key = f"menu:{store_id}:{category_id}"
ELSE:
    cache_key = f"menu:{store_id}"

# 캐시 확인
cached_data = CacheManager.get(cache_key)
IF cached_data IS NOT NULL:
    RETURN cached_data

# DB 조회
categories = CategoryRepository.get_by_store(store_id)
result = {
    "store_id": store_id,
    "categories": []
}

FOR category IN categories:
    IF category_id IS NOT NULL AND category.category_id != category_id:
        CONTINUE
    
    menus = MenuRepository.get_by_category(category.category_id)
    category_data = {
        "category_id": category.category_id,
        "category_name": category.category_name,
        "display_order": category.display_order,
        "menus": [
            {
                "menu_id": menu.menu_id,
                "menu_name": menu.menu_name,
                "price": menu.price,
                "description": menu.description,
                "image_base64": menu.image_base64,
                "display_order": menu.display_order
            }
            FOR menu IN menus
        ]
    }
    result["categories"].append(category_data)

# 캐시 저장
CacheManager.set(cache_key, result, ttl=3600)

RETURN result
```

---

### 4.2 메뉴 생성

```python
def create_menu(store_id: int, menu_data: MenuCreate) -> Menu:
    """
    새 메뉴 생성
    """
```

#### 상세 로직

```
# 카테고리 확인
category = CategoryRepository.get_by_id(menu_data.category_id)
IF category IS NULL:
    RAISE NotFoundException("Category not found")
IF category.store_id != store_id:
    RAISE ForbiddenError("Category does not belong to this store")

# 가격 검증 (DB CHECK 제약조건도 있음)
IF menu_data.price <= 0:
    RAISE ValidationError("Price must be positive")

# 메뉴 생성
menu = Menu(
    store_id=store_id,
    category_id=menu_data.category_id,
    menu_name=menu_data.menu_name,
    price=menu_data.price,
    description=menu_data.description,
    image_base64=menu_data.image_base64,
    display_order=menu_data.display_order or 0
)
MenuRepository.create(menu)

# 캐시 무효화
invalidate_menu_cache(store_id)

RETURN menu
```

---

### 4.3 메뉴 수정

```python
def update_menu(menu_id: int, store_id: int, menu_data: MenuUpdate) -> Menu:
    """
    메뉴 정보 수정 (부분 업데이트)
    """
```

#### 상세 로직

```
menu = MenuRepository.get_by_id(menu_id)
IF menu IS NULL:
    RAISE NotFoundException("Menu not found")
IF menu.store_id != store_id:
    RAISE ForbiddenError("Menu does not belong to this store")

# 부분 업데이트
IF menu_data.menu_name IS NOT NULL:
    menu.menu_name = menu_data.menu_name
IF menu_data.price IS NOT NULL:
    IF menu_data.price <= 0:
        RAISE ValidationError("Price must be positive")
    menu.price = menu_data.price
IF menu_data.description IS NOT NULL:
    menu.description = menu_data.description
IF menu_data.image_base64 IS NOT NULL:
    menu.image_base64 = menu_data.image_base64
IF menu_data.display_order IS NOT NULL:
    menu.display_order = menu_data.display_order
IF menu_data.category_id IS NOT NULL:
    # 카테고리 변경 시 검증
    category = CategoryRepository.get_by_id(menu_data.category_id)
    IF category IS NULL OR category.store_id != store_id:
        RAISE ValidationError("Invalid category")
    menu.category_id = menu_data.category_id

menu.updated_at = datetime.utcnow()
MenuRepository.update(menu)

# 캐시 무효화
invalidate_menu_cache(store_id)

RETURN menu
```

---

### 4.4 메뉴 삭제

```python
def delete_menu(menu_id: int, store_id: int) -> bool:
    """
    메뉴 삭제
    """
```

#### 상세 로직

```
menu = MenuRepository.get_by_id(menu_id)
IF menu IS NULL:
    RAISE NotFoundException("Menu not found")
IF menu.store_id != store_id:
    RAISE ForbiddenError("Menu does not belong to this store")

MenuRepository.delete(menu_id)

# 캐시 무효화
invalidate_menu_cache(store_id)

RETURN True
```

---

### 4.5 캐시 무효화

```python
def invalidate_menu_cache(store_id: int) -> bool:
    """
    매장의 메뉴 캐시 무효화
    """
```

```
# 패턴 기반 캐시 삭제
CacheManager.invalidate_pattern(f"menu:{store_id}*")
RETURN True
```

---

## 5. SSEService (실시간 통신 서비스)

### 5.1 연결 관리

```python
class SSEService:
    """
    SSE 연결 관리 및 브로드캐스트
    
    구조:
    connections = {
        connection_id: {
            "store_id": int,
            "queue": asyncio.Queue
        }
    }
    store_connections = {
        store_id: [connection_id, ...]
    }
    """
```

### 5.2 연결 등록

```python
async def register_connection(store_id: int) -> tuple[str, asyncio.Queue]:
    """
    새 SSE 연결 등록
    """
```

```
connection_id = str(uuid.uuid4())
queue = asyncio.Queue()

connections[connection_id] = {
    "store_id": store_id,
    "queue": queue
}

IF store_id NOT IN store_connections:
    store_connections[store_id] = []
store_connections[store_id].append(connection_id)

RETURN (connection_id, queue)
```

### 5.3 연결 해제

```python
def unregister_connection(connection_id: str) -> bool:
    """
    SSE 연결 해제
    """
```

```
IF connection_id NOT IN connections:
    RETURN False

store_id = connections[connection_id]["store_id"]
DEL connections[connection_id]

IF store_id IN store_connections:
    store_connections[store_id].remove(connection_id)
    IF len(store_connections[store_id]) == 0:
        DEL store_connections[store_id]

RETURN True
```

### 5.4 브로드캐스트

```python
async def broadcast_order_update(store_id: int, event_type: str, data: dict) -> bool:
    """
    매장의 모든 연결에 이벤트 브로드캐스트
    """
```

```
IF store_id NOT IN store_connections:
    RETURN False

event = {
    "event": event_type,
    "data": json.dumps(data)
}

FOR connection_id IN store_connections[store_id]:
    TRY:
        queue = connections[connection_id]["queue"]
        await queue.put(event)
    EXCEPT:
        # 실패한 연결 제거
        unregister_connection(connection_id)

RETURN True
```

### 5.5 초기 데이터 전송

```python
async def send_initial_data(connection_id: str, store_id: int) -> bool:
    """
    연결 시 전체 주문 목록 전송
    """
```

```
# 활성 주문 조회
tables_data = OrderService.get_orders_by_store(store_id, active_only=True)

event = {
    "event": "initial",
    "data": json.dumps(tables_data)
}

queue = connections[connection_id]["queue"]
await queue.put(event)

RETURN True
```

---

## 6. 에러 처리 전략

### 커스텀 예외 클래스

```python
class AppException(Exception):
    """기본 애플리케이션 예외"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code

class NotFoundException(AppException):
    """리소스를 찾을 수 없음 (404)"""
    def __init__(self, message: str):
        super().__init__(message, 404)

class ValidationError(AppException):
    """유효성 검증 실패 (400)"""
    def __init__(self, message: str):
        super().__init__(message, 400)

class AuthenticationError(AppException):
    """인증 실패 (401)"""
    def __init__(self, message: str):
        super().__init__(message, 401)

class ForbiddenError(AppException):
    """권한 없음 (403)"""
    def __init__(self, message: str):
        super().__init__(message, 403)

class ConflictError(AppException):
    """충돌 (409)"""
    def __init__(self, message: str):
        super().__init__(message, 409)
```

### 전역 에러 핸들러

```python
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```
