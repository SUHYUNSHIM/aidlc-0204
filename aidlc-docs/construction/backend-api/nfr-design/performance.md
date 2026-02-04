# 성능 설계 (Performance Design)

## 1. 성능 목표

| 항목 | 목표값 | 측정 방법 |
|------|--------|----------|
| SSE 주문 업데이트 | < 2초 | 주문 생성 → 관리자 화면 표시 |
| API 응답 시간 (P95) | < 500ms | 95번째 백분위수 |
| API 응답 시간 (P99) | < 1000ms | 99번째 백분위수 |
| 메뉴 조회 (캐시 히트) | < 50ms | 캐시된 데이터 반환 |
| 메뉴 조회 (캐시 미스) | < 200ms | DB 조회 + 캐시 저장 |
| 주문 생성 | < 300ms | 검증 + 저장 + SSE 브로드캐스트 |
| 동시 사용자 | 100+ | 동시 접속 테이블 수 |

---

## 2. 실시간 업데이트 성능 (SSE)

### 2.1 SSE 아키텍처

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  SSE Queue  │◀────│   Service   │
│  (Admin UI) │     │  (per conn) │     │  (Broadcast)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │    EventSource    │   asyncio.Queue   │
       │◀──────────────────│◀──────────────────│
       │                   │                   │
```

### 2.2 SSE 최적화 전략

```python
# SSE 서비스 구현
class SSEService:
    def __init__(self):
        # 연결별 큐 (메모리 효율)
        self.connections: Dict[str, asyncio.Queue] = {}
        # 매장별 연결 인덱스 (빠른 브로드캐스트)
        self.store_connections: Dict[str, Set[str]] = {}
    
    async def broadcast_order_update(self, store_id: str, event_type: str, data: dict):
        """
        비동기 브로드캐스트 - 논블로킹
        
        최적화:
        1. 매장별 연결만 순회 (O(n) where n = 매장 연결 수)
        2. 큐에 넣기만 하고 즉시 반환 (논블로킹)
        3. 실패한 연결은 백그라운드에서 정리
        """
        if store_id not in self.store_connections:
            return
        
        event = {"event": event_type, "data": json.dumps(data)}
        
        # 동시에 모든 큐에 이벤트 추가
        tasks = []
        for conn_id in self.store_connections[store_id]:
            if conn_id in self.connections:
                tasks.append(self.connections[conn_id].put_nowait(event))
        
        # 실패한 연결 정리는 별도 태스크로
        asyncio.create_task(self._cleanup_failed_connections(store_id))
```

### 2.3 SSE 이벤트 스트림

```python
# SSE 엔드포인트
@router.get("/orders/sse")
async def order_sse_stream(
    current_user: dict = Depends(get_current_admin),
    sse_service: SSEService = Depends(get_sse_service),
    order_service: OrderService = Depends(get_order_service)
):
    store_id = current_user["store_id"]
    
    async def event_generator():
        conn_id, queue = await sse_service.register_connection(store_id)
        
        try:
            # 1. 초기 데이터 전송
            initial_data = order_service.get_orders_by_store(store_id)
            yield {
                "event": "initial",
                "data": json.dumps(initial_data)
            }
            
            # 2. 증분 업데이트 스트림
            while True:
                try:
                    # 30초 타임아웃으로 heartbeat
                    event = await asyncio.wait_for(
                        queue.get(), 
                        timeout=30.0
                    )
                    yield event
                except asyncio.TimeoutError:
                    # Heartbeat
                    yield {"event": "ping", "data": ""}
                    
        finally:
            sse_service.unregister_connection(conn_id)
    
    return EventSourceResponse(event_generator())
```

---

## 3. 데이터베이스 최적화

### 3.1 인덱스 전략

```sql
-- 자주 사용되는 쿼리 패턴에 맞춘 인덱스

-- 1. 매장별 활성 주문 조회 (관리자 대시보드)
CREATE INDEX idx_orders_store_active ON orders(store_id, status)
    WHERE status IN ('대기중', '준비중');

-- 2. 세션별 주문 조회 (고객 주문 내역)
CREATE INDEX idx_orders_session_time ON orders(session_id, order_time DESC);

-- 3. 테이블별 활성 세션 조회
CREATE INDEX idx_sessions_table_active ON table_sessions(table_id)
    WHERE is_active = TRUE;

-- 4. 메뉴 조회 (카테고리별, 판매 가능)
CREATE INDEX idx_menus_category_available ON menus(category_id, display_order)
    WHERE is_available = TRUE;

-- 5. 주문 번호 생성 (일별 카운트)
CREATE INDEX idx_orders_store_date ON orders(store_id, order_time);

-- 6. 과거 내역 조회
CREATE INDEX idx_history_table_date ON order_history(table_id, archived_at DESC);
```

### 3.2 쿼리 최적화

```python
# Eager Loading으로 N+1 문제 방지
def get_orders_by_store(self, store_id: str) -> List[Order]:
    return self.db.query(Order)\
        .options(
            joinedload(Order.items),  # 주문 항목 미리 로드
            joinedload(Order.session).joinedload(TableSession.table)  # 테이블 정보
        )\
        .join(TableSession)\
        .filter(
            Order.store_id == store_id,
            TableSession.is_active == True
        )\
        .order_by(Order.order_time.desc())\
        .all()

# 집계 쿼리 최적화
def calculate_session_total(self, session_id: str) -> int:
    """SUM을 DB에서 처리 (애플리케이션 레벨 X)"""
    result = self.db.query(func.sum(Order.total_amount))\
        .filter(Order.session_id == session_id)\
        .scalar()
    return result or 0
```

### 3.3 연결 풀 설정

```python
# 연결 풀 최적화 설정
engine = create_engine(
    DATABASE_URL,
    pool_size=5,           # 기본 연결 수
    max_overflow=10,       # 추가 연결 허용 수
    pool_timeout=30,       # 연결 대기 타임아웃
    pool_recycle=1800,     # 30분마다 연결 재생성
    pool_pre_ping=True,    # 연결 상태 확인
)
```

---

## 4. 캐싱 전략

### 4.1 캐시 대상

| 데이터 | 캐시 여부 | TTL | 무효화 조건 |
|--------|----------|-----|------------|
| 메뉴 목록 | ✓ | 1시간 | 메뉴 CRUD 시 |
| 카테고리 목록 | ✓ | 1시간 | 카테고리 CRUD 시 |
| 매장 정보 | ✓ | 1시간 | 매장 정보 수정 시 |
| 주문 목록 | ✗ | - | 실시간 데이터 |
| 세션 정보 | ✗ | - | 실시간 데이터 |

### 4.2 캐시 키 설계

```python
# 캐시 키 패턴
CACHE_KEYS = {
    "menu_list": "menu:{store_id}",
    "menu_category": "menu:{store_id}:{category_id}",
    "categories": "categories:{store_id}",
    "store_info": "store:{store_id}",
}

# 캐시 무효화 패턴
def invalidate_menu_cache(store_id: str):
    """메뉴 관련 모든 캐시 무효화"""
    cache.invalidate_pattern(f"menu:{store_id}*")
    cache.invalidate_pattern(f"categories:{store_id}")
```

### 4.3 캐시 구현

```python
class MenuService:
    def get_menus_by_store(self, store_id: str, category_id: int = None) -> dict:
        # 캐시 키 생성
        cache_key = f"menu:{store_id}"
        if category_id:
            cache_key = f"menu:{store_id}:{category_id}"
        
        # 캐시 확인
        cached = self.cache.get(cache_key)
        if cached:
            return cached
        
        # DB 조회
        result = self._fetch_menus_from_db(store_id, category_id)
        
        # 캐시 저장 (1시간)
        self.cache.set(cache_key, result, ttl=3600)
        
        return result
    
    def create_menu(self, store_id: str, data: dict) -> Menu:
        menu = self._create_menu_in_db(store_id, data)
        
        # 캐시 무효화
        self.cache.invalidate_pattern(f"menu:{store_id}*")
        
        return menu
```

---

## 5. API 응답 최적화

### 5.1 페이지네이션

```python
# 과거 내역 조회 - 페이지네이션 적용
@router.get("/tables/{table_id}/history")
async def get_table_history(
    table_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    start_date: date = None,
    end_date: date = None,
    ...
):
    history = table_service.get_table_history(
        table_id=table_id,
        store_id=current_user["store_id"],
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    return history
```

### 5.2 응답 압축

```python
# Gzip 압축 미들웨어
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### 5.3 비동기 처리

```python
# 비동기 엔드포인트
@router.post("/orders")
async def create_order(
    order_data: OrderCreate,
    current_user: dict = Depends(get_current_table),
    order_service: OrderService = Depends(get_order_service)
):
    # 비동기 주문 생성
    order = await order_service.create_order_async(
        session_id=current_user["session_id"],
        table_id=current_user["table_id"],
        store_id=current_user["store_id"],
        items=order_data.items
    )
    return order
```

---

## 6. 성능 모니터링

### 6.1 응답 시간 로깅

```python
# 미들웨어로 응답 시간 측정
@app.middleware("http")
async def log_request_time(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    
    # 느린 요청 경고 (500ms 초과)
    if process_time > 0.5:
        logger.warning(
            f"Slow request: {request.method} {request.url.path} "
            f"took {process_time:.3f}s"
        )
    
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

### 6.2 SSE 지연 측정

```python
# SSE 이벤트에 타임스탬프 포함
async def broadcast_order_update(self, store_id: str, event_type: str, data: dict):
    data["_broadcast_time"] = datetime.utcnow().isoformat()
    # ... 브로드캐스트 로직
```

### 6.3 성능 메트릭 엔드포인트

```python
@router.get("/metrics")
async def get_metrics():
    """성능 메트릭 조회 (관리자용)"""
    return {
        "sse_connections": sse_service.get_total_connections(),
        "cache_stats": cache.get_stats(),
        "db_pool_status": get_db_pool_status()
    }
```
