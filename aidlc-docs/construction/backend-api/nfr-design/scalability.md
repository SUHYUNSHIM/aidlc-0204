# 확장성 설계 (Scalability Design)

## 1. 멀티 테넌트 아키텍처

### 1.1 테넌트 격리 모델

```
┌─────────────────────────────────────────────────────────────┐
│                    Single Database                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  stores    │  tables   │  orders   │  menus   │ ...    ││
│  │  ─────────────────────────────────────────────────────  ││
│  │  store_id  │  store_id │  store_id │  store_id│        ││
│  │  (tenant)  │  (tenant) │  (tenant) │  (tenant)│        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

선택한 모델: Shared Database, Shared Schema (Row-Level Isolation)
- 장점: 비용 효율적, 관리 단순
- 단점: 쿼리마다 store_id 필터 필수
```

### 1.2 테넌트별 리소스 제한

```python
# 테넌트별 제한 설정
TENANT_LIMITS = {
    "max_tables": 100,           # 매장당 최대 테이블 수
    "max_menus": 500,            # 매장당 최대 메뉴 수
    "max_categories": 50,        # 매장당 최대 카테고리 수
    "max_active_orders": 1000,   # 동시 활성 주문 수
    "max_sse_connections": 10,   # 매장당 SSE 연결 수
}

# 제한 검증
def check_tenant_limit(store_id: str, resource: str, current_count: int):
    limit = TENANT_LIMITS.get(f"max_{resource}")
    if limit and current_count >= limit:
        raise ConflictError(f"Maximum {resource} limit reached: {limit}")
```

---

## 2. 데이터베이스 확장성

### 2.1 연결 풀 관리

```python
# 연결 풀 설정
DATABASE_POOL_CONFIG = {
    "pool_size": 5,              # 기본 연결 수
    "max_overflow": 15,          # 추가 연결 (총 20개까지)
    "pool_timeout": 30,          # 연결 대기 타임아웃
    "pool_recycle": 1800,        # 30분마다 연결 재생성
    "pool_pre_ping": True,       # 연결 상태 확인
}

engine = create_engine(
    DATABASE_URL,
    **DATABASE_POOL_CONFIG
)

# 연결 풀 모니터링
def get_pool_status():
    return {
        "pool_size": engine.pool.size(),
        "checked_in": engine.pool.checkedin(),
        "checked_out": engine.pool.checkedout(),
        "overflow": engine.pool.overflow(),
    }
```

### 2.2 읽기/쓰기 분리 (향후 확장)

```python
# 읽기 전용 쿼리 최적화 (향후 Read Replica 지원)
class ReadOnlySession:
    """읽기 전용 세션 (캐시 우선)"""
    
    def __init__(self, db: Session, cache: CacheManager):
        self.db = db
        self.cache = cache
    
    def get_menus(self, store_id: str):
        # 1. 캐시 확인
        cached = self.cache.get(f"menu:{store_id}")
        if cached:
            return cached
        
        # 2. DB 조회 (향후 Read Replica로 라우팅)
        result = self.db.query(Menu).filter(...).all()
        
        # 3. 캐시 저장
        self.cache.set(f"menu:{store_id}", result, ttl=3600)
        return result
```

### 2.3 인덱스 전략

```sql
-- 파티셔닝 대비 인덱스 (store_id 선행)
CREATE INDEX idx_orders_store_session ON orders(store_id, session_id);
CREATE INDEX idx_orders_store_status ON orders(store_id, status);
CREATE INDEX idx_menus_store_category ON menus(store_id, category_id);

-- 향후 파티셔닝 (대규모 확장 시)
-- CREATE TABLE orders_partitioned (
--     ...
-- ) PARTITION BY LIST (store_id);
```

---

## 3. SSE 연결 확장성

### 3.1 연결 관리 구조

```python
class SSEConnectionManager:
    """확장 가능한 SSE 연결 관리"""
    
    def __init__(self, max_connections_per_store: int = 10):
        self.max_per_store = max_connections_per_store
        self.connections: Dict[str, asyncio.Queue] = {}
        self.store_connections: Dict[str, Set[str]] = {}
        self._lock = asyncio.Lock()
    
    async def register(self, store_id: str) -> Tuple[str, asyncio.Queue]:
        async with self._lock:
            # 매장별 연결 수 제한
            current_count = len(self.store_connections.get(store_id, set()))
            if current_count >= self.max_per_store:
                raise ConflictError(
                    f"Maximum SSE connections reached for store: {self.max_per_store}"
                )
            
            conn_id = str(uuid.uuid4())
            queue = asyncio.Queue(maxsize=100)  # 큐 크기 제한
            
            self.connections[conn_id] = queue
            if store_id not in self.store_connections:
                self.store_connections[store_id] = set()
            self.store_connections[store_id].add(conn_id)
            
            return conn_id, queue
    
    async def broadcast(self, store_id: str, event: dict):
        """논블로킹 브로드캐스트"""
        if store_id not in self.store_connections:
            return
        
        failed_connections = []
        
        for conn_id in self.store_connections[store_id]:
            try:
                queue = self.connections.get(conn_id)
                if queue:
                    queue.put_nowait(event)  # 논블로킹
            except asyncio.QueueFull:
                # 큐가 가득 찬 연결은 제거 대상
                failed_connections.append(conn_id)
        
        # 실패한 연결 정리
        for conn_id in failed_connections:
            await self.unregister(conn_id)
```

### 3.2 메모리 사용량 관리

```python
# SSE 이벤트 크기 제한
MAX_EVENT_SIZE = 64 * 1024  # 64KB

def prepare_sse_event(event_type: str, data: dict) -> dict:
    """SSE 이벤트 준비 (크기 제한)"""
    json_data = json.dumps(data)
    
    if len(json_data) > MAX_EVENT_SIZE:
        # 큰 데이터는 요약본만 전송
        logger.warning(f"SSE event too large: {len(json_data)} bytes")
        data = {"message": "Data too large, fetch via API"}
        json_data = json.dumps(data)
    
    return {"event": event_type, "data": json_data}
```

---

## 4. 캐시 확장성

### 4.1 캐시 계층 구조

```
┌─────────────────┐
│   Application   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Cache Miss
│  In-Memory      │─────────────────┐
│  Cache (L1)     │                 │
└────────┬────────┘                 │
         │ Cache Hit                │
         ▼                          ▼
┌─────────────────┐         ┌─────────────────┐
│    Response     │         │    Database     │
└─────────────────┘         └─────────────────┘
```

### 4.2 캐시 구현 (확장 가능)

```python
from abc import ABC, abstractmethod

class CacheBackend(ABC):
    """캐시 백엔드 인터페이스"""
    
    @abstractmethod
    def get(self, key: str) -> Optional[Any]: pass
    
    @abstractmethod
    def set(self, key: str, value: Any, ttl: int) -> bool: pass
    
    @abstractmethod
    def delete(self, key: str) -> bool: pass

class InMemoryCache(CacheBackend):
    """인메모리 캐시 (단일 인스턴스용)"""
    pass

class RedisCache(CacheBackend):
    """Redis 캐시 (다중 인스턴스용, 향후 확장)"""
    pass

# 팩토리 패턴으로 캐시 선택
def get_cache_backend() -> CacheBackend:
    cache_type = settings.cache_type
    if cache_type == "redis":
        return RedisCache(settings.redis_url)
    return InMemoryCache()
```

---

## 5. API 확장성

### 5.1 비동기 처리

```python
# 비동기 엔드포인트
@router.post("/orders")
async def create_order(
    order_data: OrderCreate,
    current_user: dict = Depends(get_current_table),
    order_service: OrderService = Depends(get_order_service)
):
    # 비동기 주문 생성
    order = await order_service.create_order_async(...)
    
    # SSE 브로드캐스트 (백그라운드)
    asyncio.create_task(
        sse_service.broadcast_order_update(...)
    )
    
    return order
```

### 5.2 요청 제한 (Rate Limiting)

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# 엔드포인트별 제한
@router.post("/orders")
@limiter.limit("30/minute")  # 분당 30회
async def create_order(...):
    pass

@router.post("/login")
@limiter.limit("5/minute")   # 분당 5회 (브루트포스 방지)
async def login(...):
    pass
```

---

## 6. 수평 확장 고려사항

### 6.1 Stateless 설계

```python
# 세션 상태를 서버에 저장하지 않음
# - JWT 토큰에 모든 필요 정보 포함
# - SSE 연결은 인스턴스별 관리 (향후 Redis Pub/Sub로 확장)

# JWT 페이로드에 필요한 모든 정보 포함
token_payload = {
    "sub": "table_5",
    "user_type": "table",
    "store_id": "restaurant-abc",
    "table_id": 5,
    "session_id": "uuid-...",
    # 서버 측 세션 조회 불필요
}
```

### 6.2 향후 확장 아키텍처

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   API Server 1  │ │   API Server 2  │ │   API Server 3  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
           ┌─────────────┐   ┌─────────────┐
           │   Redis     │   │  PostgreSQL │
           │  (Cache/    │   │  (Primary)  │
           │   Pub/Sub)  │   └─────────────┘
           └─────────────┘
```

---

## 7. 확장성 메트릭

| 항목 | 현재 목표 | 확장 목표 |
|------|----------|----------|
| 동시 테이블 | 100 | 1,000+ |
| 동시 SSE 연결 | 100 | 1,000+ |
| 초당 주문 | 10 | 100+ |
| DB 연결 풀 | 20 | 100+ |
| 매장 수 | 10 | 100+ |
