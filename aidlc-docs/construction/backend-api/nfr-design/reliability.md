# 안정성 설계 (Reliability Design)

## 1. 에러 처리 전략

### 1.1 예외 계층 구조

```python
# 커스텀 예외 계층
class AppException(Exception):
    """기본 애플리케이션 예외"""
    def __init__(self, message: str, status_code: int = 500, error_code: str = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or f"ERR_{status_code}"
        super().__init__(self.message)

class NotFoundException(AppException):
    """404 - 리소스 없음"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, 404, "NOT_FOUND")

class ValidationError(AppException):
    """400 - 유효성 검증 실패"""
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, 400, "VALIDATION_ERROR")

class AuthenticationError(AppException):
    """401 - 인증 실패"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, 401, "AUTH_ERROR")

class ForbiddenError(AppException):
    """403 - 권한 없음"""
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(message, 403, "FORBIDDEN")

class ConflictError(AppException):
    """409 - 충돌"""
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, 409, "CONFLICT")

class ServiceUnavailableError(AppException):
    """503 - 서비스 불가"""
    def __init__(self, message: str = "Service temporarily unavailable"):
        super().__init__(message, 503, "SERVICE_UNAVAILABLE")
```

### 1.2 전역 에러 핸들러

```python
from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

async def app_exception_handler(request: Request, exc: AppException):
    """애플리케이션 예외 처리"""
    logger.warning(f"AppException: {exc.error_code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "error_code": exc.error_code
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Pydantic 검증 예외 처리"""
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors.append(f"{field}: {error['msg']}")
    
    return JSONResponse(
        status_code=400,
        content={
            "detail": "; ".join(errors),
            "error_code": "VALIDATION_ERROR"
        }
    )

async def generic_exception_handler(request: Request, exc: Exception):
    """예상치 못한 예외 처리"""
    # 스택 트레이스 로깅 (프로덕션에서는 외부 노출 X)
    logger.error(f"Unhandled exception: {str(exc)}\n{traceback.format_exc()}")
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_code": "INTERNAL_ERROR"
        }
    )
```

---

## 2. 트랜잭션 관리

### 2.1 트랜잭션 패턴

```python
from contextlib import contextmanager

@contextmanager
def transaction_scope(db: Session):
    """트랜잭션 컨텍스트 매니저"""
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Transaction rollback: {str(e)}")
        raise
    finally:
        db.close()

# 사용 예시
def create_order(self, session_id: str, items: List[dict]) -> Order:
    with transaction_scope(self.db) as db:
        # 1. 주문 생성
        order = Order(...)
        db.add(order)
        db.flush()  # order_id 생성
        
        # 2. 주문 항목 생성
        for item in items:
            order_item = OrderItem(order_id=order.order_id, ...)
            db.add(order_item)
        
        # 3. 커밋 (컨텍스트 종료 시 자동)
        return order
```

### 2.2 세션 종료 트랜잭션

```python
def end_session(self, table_id: int, store_id: str) -> dict:
    """세션 종료 - 원자적 처리"""
    
    with transaction_scope(self.db) as db:
        # 1. 테이블 및 세션 조회
        table = self.table_repo.get_by_id(table_id)
        session = self.session_repo.get_by_id(table.current_session_id)
        
        # 2. 주문 데이터 아카이브
        orders = self.order_repo.get_by_session(session.session_id)
        history = self._create_order_history(session, orders)
        db.add(history)
        
        # 3. 원본 주문 삭제
        for order in orders:
            db.delete(order)
        
        # 4. 세션 종료
        session.is_active = False
        session.end_time = datetime.utcnow()
        
        # 5. 테이블 리셋
        table.current_session_id = None
        
        # 모든 작업이 성공해야 커밋
        return {"session_id": session.session_id, ...}
```

---

## 3. SSE 안정성

### 3.1 재연결 메커니즘

```python
# 클라이언트 측 재연결 (프론트엔드 가이드)
class SSEClient:
    """
    재연결 전략: 지수 백오프
    - 초기 대기: 1초
    - 최대 대기: 30초
    - 백오프 계수: 2
    """
    
    INITIAL_RETRY = 1000      # 1초
    MAX_RETRY = 30000         # 30초
    BACKOFF_FACTOR = 2
    
    def connect(self):
        retry_delay = self.INITIAL_RETRY
        
        while True:
            try:
                self.event_source = new EventSource(url)
                self.event_source.onopen = self.on_open
                self.event_source.onerror = self.on_error
                break
            except:
                time.sleep(retry_delay / 1000)
                retry_delay = min(retry_delay * self.BACKOFF_FACTOR, self.MAX_RETRY)
```

### 3.2 서버 측 연결 관리

```python
class SSEService:
    async def event_generator(self, store_id: str):
        conn_id, queue = await self.register_connection(store_id)
        
        try:
            # 초기 데이터 전송
            yield self._format_event("initial", initial_data)
            
            while True:
                try:
                    # 30초 타임아웃 (heartbeat)
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield self._format_event(event["event"], event["data"])
                    
                except asyncio.TimeoutError:
                    # Heartbeat 전송
                    yield ": ping\n\n"
                    
                except asyncio.CancelledError:
                    # 클라이언트 연결 종료
                    logger.info(f"SSE connection cancelled: {conn_id}")
                    break
                    
        except Exception as e:
            logger.error(f"SSE error: {str(e)}")
            
        finally:
            # 연결 정리
            self.unregister_connection(conn_id)
    
    def _format_event(self, event_type: str, data: str) -> str:
        return f"event: {event_type}\ndata: {data}\n\n"
```

### 3.3 연결 상태 모니터링

```python
class SSEHealthMonitor:
    """SSE 연결 상태 모니터링"""
    
    def __init__(self, sse_service: SSEService):
        self.sse_service = sse_service
        self.last_broadcast_time: Dict[str, datetime] = {}
    
    async def check_health(self) -> dict:
        return {
            "total_connections": len(self.sse_service.connections),
            "stores_connected": len(self.sse_service.store_connections),
            "connections_by_store": {
                store_id: len(conns)
                for store_id, conns in self.sse_service.store_connections.items()
            }
        }
    
    async def cleanup_stale_connections(self, max_idle_seconds: int = 120):
        """유휴 연결 정리"""
        now = datetime.utcnow()
        stale_connections = []
        
        for conn_id, last_activity in self.last_activity.items():
            if (now - last_activity).seconds > max_idle_seconds:
                stale_connections.append(conn_id)
        
        for conn_id in stale_connections:
            await self.sse_service.unregister_connection(conn_id)
```

---

## 4. 데이터 무결성

### 4.1 데이터베이스 제약조건

```sql
-- 외래 키 제약
ALTER TABLE tables 
    ADD CONSTRAINT fk_tables_store 
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE;

ALTER TABLE orders 
    ADD CONSTRAINT fk_orders_session 
    FOREIGN KEY (session_id) REFERENCES table_sessions(session_id) ON DELETE CASCADE;

-- 체크 제약
ALTER TABLE orders 
    ADD CONSTRAINT chk_order_status 
    CHECK (status IN ('대기중', '준비중', '완료'));

ALTER TABLE menus 
    ADD CONSTRAINT chk_menu_price 
    CHECK (price > 0);

ALTER TABLE order_items 
    ADD CONSTRAINT chk_item_quantity 
    CHECK (quantity > 0);

-- 유니크 제약
ALTER TABLE tables 
    ADD CONSTRAINT uq_store_table 
    UNIQUE (store_id, table_number);

ALTER TABLE categories 
    ADD CONSTRAINT uq_store_category 
    UNIQUE (store_id, category_name);
```

### 4.2 애플리케이션 레벨 검증

```python
class OrderService:
    def create_order(self, session_id: str, items: List[dict]) -> Order:
        # 1. 세션 유효성 검증
        session = self.session_repo.get_by_id(session_id)
        if not session or not session.is_active:
            raise ConflictError("Invalid or inactive session")
        
        # 2. 메뉴 유효성 검증
        for item in items:
            menu = self.menu_repo.get_by_id(item["menu_id"])
            if not menu:
                raise NotFoundException(f"Menu not found: {item['menu_id']}")
            if menu.store_id != session.store_id:
                raise ForbiddenError("Menu does not belong to this store")
            if not menu.is_available:
                raise ValidationError(f"Menu not available: {menu.menu_name}")
        
        # 3. 주문 생성 (트랜잭션)
        return self._create_order_transaction(session, items)
```

### 4.3 주문 데이터 스냅샷

```python
# 주문 시점의 메뉴 정보 스냅샷 저장
class OrderItem(Base):
    order_item_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    menu_id = Column(Integer, ForeignKey("menus.menu_id"))
    
    # 스냅샷 필드 (메뉴 변경 시에도 원본 유지)
    menu_name = Column(String(100), nullable=False)
    unit_price = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)

def create_order_item(menu: Menu, quantity: int) -> OrderItem:
    return OrderItem(
        menu_id=menu.menu_id,
        menu_name=menu.menu_name,      # 스냅샷
        unit_price=menu.price,          # 스냅샷
        quantity=quantity
    )
```

---

## 5. 장애 복구

### 5.1 데이터베이스 연결 복구

```python
from sqlalchemy import event
from sqlalchemy.exc import DisconnectionError

# 연결 끊김 감지 및 재연결
@event.listens_for(engine, "engine_connect")
def ping_connection(connection, branch):
    if branch:
        return
    
    try:
        connection.scalar("SELECT 1")
    except DisconnectionError:
        connection.invalidate()
        raise

# 연결 풀 설정
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # 연결 상태 확인
    pool_recycle=1800,       # 30분마다 재생성
)
```

### 5.2 서비스 복구 절차

```python
# 애플리케이션 시작 시 복구 절차
async def startup_recovery():
    """시작 시 복구 작업"""
    
    # 1. 데이터베이스 연결 확인
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        logger.info("Database connection OK")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise
    finally:
        db.close()
    
    # 2. 캐시 초기화
    cache = get_cache_manager()
    cache.clear()
    logger.info("Cache cleared")
    
    # 3. SSE 연결 초기화
    sse_service = get_sse_service()
    sse_service.clear_all_connections()
    logger.info("SSE connections cleared")
```

---

## 6. 안정성 체크리스트

| 항목 | 상태 | 설명 |
|------|------|------|
| 트랜잭션 롤백 | ✓ | 자동 롤백 |
| 외래 키 제약 | ✓ | CASCADE 삭제 |
| 데이터 검증 | ✓ | Pydantic + DB 제약 |
| SSE 재연결 | ✓ | 지수 백오프 |
| 연결 풀 관리 | ✓ | pre_ping, recycle |
| 에러 로깅 | ✓ | 스택 트레이스 |
| 헬스 체크 | ✓ | /health 엔드포인트 |
| 데이터 스냅샷 | ✓ | 주문 시점 가격/이름 |
