# 서비스 레이어 설계

## 서비스 레이어 개요

서비스 레이어는 비즈니스 로직을 캡슐화하고 API 계층과 데이터 액세스 계층 사이의 오케스트레이션을 담당합니다.

**4-Layer 아키텍처**:
```
API Layer (FastAPI Routers)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Model Layer (SQLAlchemy Models)
```

---

## 1. AuthService

### 책임
- JWT 토큰 생성 및 검증
- 비밀번호 해싱 및 검증
- 관리자 및 테이블 인증 처리

### 의존성
- `StoreRepository`: 매장 정보 조회
- `TableRepository`: 테이블 정보 조회
- `bcrypt`: 비밀번호 해싱
- `jose` (JWT): 토큰 생성 및 검증

### 오케스트레이션 패턴
1. **관리자 인증 플로우**:
   - StoreRepository로 매장 조회
   - 비밀번호 검증
   - JWT 토큰 생성 (16시간 유효)
   - 토큰 반환

2. **테이블 인증 플로우**:
   - TableRepository로 테이블 조회
   - 테이블 비밀번호 검증
   - 활성 세션 확인 (없으면 새로 생성)
   - JWT 토큰 생성
   - 토큰 및 세션 ID 반환

### 인터페이스
```python
class AuthService:
    def __init__(self, store_repo: StoreRepository, table_repo: TableRepository):
        self.store_repo = store_repo
        self.table_repo = table_repo
    
    def create_jwt_token(self, user_id: str, user_type: str, store_id: str) -> str
    def verify_jwt_token(self, token: str) -> dict
    def hash_password(self, password: str) -> str
    def verify_password(self, plain_password: str, hashed_password: str) -> bool
    def authenticate_admin(self, store_id: str, username: str, password: str) -> dict
    def authenticate_table(self, store_id: str, table_number: int, table_password: str) -> dict
```

---

## 2. OrderService

### 책임
- 주문 생성 및 관리
- 주문 상태 변경
- 주문 조회 (세션별, 테이블별, 매장별)
- 주문 삭제
- 주문 통계 계산

### 의존성
- `OrderRepository`: 주문 데이터 액세스
- `TableSessionRepository`: 세션 정보 조회
- `MenuRepository`: 메뉴 정보 조회 (가격 검증)
- `SSEService`: 실시간 업데이트 브로드캐스트

### 오케스트레이션 패턴
1. **주문 생성 플로우**:
   - 세션 유효성 검증 (TableSessionRepository)
   - 메뉴 가격 검증 (MenuRepository)
   - 총 금액 계산
   - OrderRepository로 주문 생성
   - SSEService로 실시간 업데이트 브로드캐스트
   - 생성된 주문 반환

2. **주문 상태 변경 플로우**:
   - OrderRepository로 주문 조회
   - 상태 전환 검증 (부분 강제)
   - OrderRepository로 상태 업데이트
   - SSEService로 실시간 업데이트 브로드캐스트
   - 업데이트된 주문 반환

3. **주문 삭제 플로우**:
   - OrderRepository로 주문 삭제
   - 테이블 총 주문액 재계산
   - SSEService로 실시간 업데이트 브로드캐스트
   - 삭제 성공 여부 반환

### 인터페이스
```python
class OrderService:
    def __init__(self, order_repo: OrderRepository, session_repo: TableSessionRepository, 
                 menu_repo: MenuRepository, sse_service: SSEService):
        self.order_repo = order_repo
        self.session_repo = session_repo
        self.menu_repo = menu_repo
        self.sse_service = sse_service
    
    def create_order(self, session_id: str, table_id: int, store_id: str, items: List[OrderItemCreate]) -> Order
    def get_orders_by_session(self, session_id: str) -> List[Order]
    def get_orders_by_table(self, table_id: int, active_only: bool = True) -> List[Order]
    def get_orders_by_store(self, store_id: str, active_only: bool = True) -> List[Order]
    def update_order_status(self, order_id: int, new_status: str) -> Order
    def delete_order(self, order_id: int) -> bool
    def calculate_table_total(self, table_id: int, session_id: str) -> float
```

---

## 3. TableService

### 책임
- 테이블 생성 및 설정
- 테이블 세션 시작 및 종료
- 세션 주문 아카이브 처리

### 의존성
- `TableRepository`: 테이블 데이터 액세스
- `TableSessionRepository`: 세션 데이터 액세스
- `OrderRepository`: 주문 데이터 조회
- `OrderHistoryRepository`: 주문 이력 저장
- `SSEService`: 실시간 업데이트 브로드캐스트

### 오케스트레이션 패턴
1. **테이블 생성 플로우**:
   - 비밀번호 해싱
   - TableRepository로 테이블 생성
   - 생성된 테이블 반환

2. **세션 시작 플로우**:
   - UUID 세션 ID 생성
   - TableSessionRepository로 세션 생성
   - TableRepository로 테이블의 current_session_id 업데이트
   - 생성된 세션 반환

3. **세션 종료 플로우** (매장 이용 완료):
   - OrderRepository로 세션의 모든 주문 조회
   - OrderHistoryRepository로 주문 아카이브
   - TableSessionRepository로 세션 종료 (end_time 설정)
   - TableRepository로 테이블의 current_session_id 초기화
   - SSEService로 실시간 업데이트 브로드캐스트
   - 종료 성공 여부 반환

### 인터페이스
```python
class TableService:
    def __init__(self, table_repo: TableRepository, session_repo: TableSessionRepository,
                 order_repo: OrderRepository, history_repo: OrderHistoryRepository,
                 sse_service: SSEService):
        self.table_repo = table_repo
        self.session_repo = session_repo
        self.order_repo = order_repo
        self.history_repo = history_repo
        self.sse_service = sse_service
    
    def create_table(self, store_id: str, table_number: int, table_password: str) -> Table
    def start_session(self, table_id: int) -> TableSession
    def end_session(self, session_id: str) -> bool
    def get_active_session(self, table_id: int) -> Optional[TableSession]
    def archive_session_orders(self, session_id: str) -> bool
```

---

## 4. MenuService

### 책임
- 메뉴 조회 및 관리
- 카테고리 관리
- 메뉴 캐싱 관리

### 의존성
- `MenuRepository`: 메뉴 및 카테고리 데이터 액세스
- `CacheManager`: 메뉴 캐싱

### 오케스트레이션 패턴
1. **메뉴 조회 플로우** (캐싱 적용):
   - CacheManager에서 캐시 확인
   - 캐시 히트: 캐시된 데이터 반환
   - 캐시 미스: MenuRepository로 조회 → 캐시 저장 → 데이터 반환

2. **메뉴 생성/수정/삭제 플로우**:
   - MenuRepository로 작업 수행
   - CacheManager로 해당 매장의 메뉴 캐시 무효화
   - 결과 반환

3. **메뉴 순서 조정 플로우**:
   - MenuRepository로 순서 업데이트
   - CacheManager로 캐시 무효화
   - 결과 반환

### 인터페이스
```python
class MenuService:
    def __init__(self, menu_repo: MenuRepository, cache_manager: CacheManager):
        self.menu_repo = menu_repo
        self.cache_manager = cache_manager
    
    def get_menus_by_store(self, store_id: str, category_id: Optional[int] = None) -> List[Menu]
    def get_menu_by_id(self, menu_id: int) -> Menu
    def create_menu(self, store_id: str, menu_data: MenuCreate) -> Menu
    def update_menu(self, menu_id: int, menu_data: MenuUpdate) -> Menu
    def delete_menu(self, menu_id: int) -> bool
    def update_menu_order(self, menu_id: int, new_order: int) -> bool
    def get_categories_by_store(self, store_id: str) -> List[Category]
    def invalidate_menu_cache(self, store_id: str) -> bool
```

---

## 5. SSEService

### 책임
- SSE 연결 관리
- 실시간 주문 업데이트 브로드캐스트
- 하이브리드 업데이트 (초기 전체 + 증분)

### 의존성
- `OrderRepository`: 초기 데이터 조회
- In-memory connection registry (연결 추적)

### 오케스트레이션 패턴
1. **연결 등록 플로우**:
   - 연결 ID 생성
   - 매장 ID와 연결 매핑
   - In-memory registry에 저장
   - OrderRepository로 초기 전체 주문 목록 조회
   - 초기 데이터 전송
   - 연결 유지

2. **주문 업데이트 브로드캐스트 플로우**:
   - 매장 ID로 활성 연결 조회
   - 각 연결에 증분 업데이트 전송
   - 전송 실패 시 연결 제거

3. **연결 해제 플로우**:
   - In-memory registry에서 연결 제거

### 인터페이스
```python
class SSEService:
    def __init__(self, order_repo: OrderRepository):
        self.order_repo = order_repo
        self.connections = {}  # {connection_id: {store_id, queue}}
    
    def register_connection(self, store_id: str, connection_id: str) -> bool
    def unregister_connection(self, connection_id: str) -> bool
    def broadcast_order_update(self, store_id: str, order_data: dict) -> bool
    def send_initial_data(self, connection_id: str, store_id: str) -> bool
    def send_incremental_update(self, connection_id: str, update_data: dict) -> bool
```

---

## 서비스 간 상호작용

### 주문 생성 시퀀스
```
Customer UI → API Layer (CustomerRouter)
    ↓
OrderService.create_order()
    ↓ (validate session)
TableSessionRepository.get_by_id()
    ↓ (validate menu prices)
MenuRepository.get_by_id()
    ↓ (create order)
OrderRepository.create()
    ↓ (broadcast update)
SSEService.broadcast_order_update()
    ↓
Admin UI (SSE connection receives update)
```

### 세션 종료 시퀀스
```
Admin UI → API Layer (AdminRouter)
    ↓
TableService.end_session()
    ↓ (get session orders)
OrderRepository.get_by_session()
    ↓ (archive orders)
OrderHistoryRepository.create()
    ↓ (end session)
TableSessionRepository.end_session()
    ↓ (reset table)
TableRepository.update_session(None)
    ↓ (broadcast update)
SSEService.broadcast_order_update()
```

### 메뉴 조회 시퀀스 (캐싱)
```
Customer UI → API Layer (CustomerRouter)
    ↓
MenuService.get_menus_by_store()
    ↓ (check cache)
CacheManager.get("menu:{store_id}")
    ↓ (cache miss)
MenuRepository.get_by_store()
    ↓ (save to cache)
CacheManager.set("menu:{store_id}", data, ttl=3600)
    ↓
Customer UI (receives menu data)
```

---

## 서비스 레이어 설계 원칙

1. **단일 책임 원칙**: 각 서비스는 하나의 도메인 영역만 담당
2. **의존성 주입**: 생성자를 통한 의존성 주입으로 테스트 용이성 확보
3. **트랜잭션 관리**: Repository 레이어에서 트랜잭션 처리
4. **에러 처리**: 서비스 레이어에서 비즈니스 예외 발생, API 레이어에서 HTTP 응답 변환
5. **로깅**: 모든 서비스 메서드에서 주요 작업 로깅
6. **캐싱**: 자주 조회되고 변경이 적은 데이터 (메뉴, 카테고리) 캐싱
7. **실시간 업데이트**: 주문 관련 변경 시 SSEService를 통한 브로드캐스트
