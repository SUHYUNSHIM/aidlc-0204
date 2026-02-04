# 컴포넌트 메서드 정의

**Note**: 이 문서는 각 컴포넌트의 메서드 시그니처와 고수준 목적을 정의합니다. 상세한 비즈니스 로직은 Functional Design 단계에서 정의됩니다.

---

## 1. 백엔드 서비스 메서드

### AuthService

#### `create_jwt_token(user_id: str, user_type: str, store_id: str) -> str`
- **목적**: JWT 토큰 생성
- **입력**: 사용자 ID, 사용자 타입 (admin/table), 매장 ID
- **출력**: JWT 토큰 문자열

#### `verify_jwt_token(token: str) -> dict`
- **목적**: JWT 토큰 검증 및 페이로드 추출
- **입력**: JWT 토큰
- **출력**: 토큰 페이로드 (user_id, user_type, store_id)

#### `hash_password(password: str) -> str`
- **목적**: 비밀번호 해싱 (bcrypt)
- **입력**: 평문 비밀번호
- **출력**: 해시된 비밀번호

#### `verify_password(plain_password: str, hashed_password: str) -> bool`
- **목적**: 비밀번호 검증
- **입력**: 평문 비밀번호, 해시된 비밀번호
- **출력**: 검증 결과 (True/False)

#### `authenticate_admin(store_id: str, username: str, password: str) -> dict`
- **목적**: 관리자 인증
- **입력**: 매장 ID, 사용자명, 비밀번호
- **출력**: 인증 결과 (JWT 토큰 포함)

#### `authenticate_table(store_id: str, table_number: int, table_password: str) -> dict`
- **목적**: 테이블 인증
- **입력**: 매장 ID, 테이블 번호, 테이블 비밀번호
- **출력**: 인증 결과 (JWT 토큰, 세션 ID 포함)

---

### OrderService

#### `create_order(session_id: str, table_id: int, store_id: str, items: List[OrderItemCreate]) -> Order`
- **목적**: 새로운 주문 생성
- **입력**: 세션 ID, 테이블 ID, 매장 ID, 주문 항목 리스트
- **출력**: 생성된 Order 객체

#### `get_orders_by_session(session_id: str) -> List[Order]`
- **목적**: 세션별 주문 조회
- **입력**: 세션 ID
- **출력**: 주문 리스트

#### `get_orders_by_table(table_id: int, active_only: bool = True) -> List[Order]`
- **목적**: 테이블별 주문 조회
- **입력**: 테이블 ID, 활성 주문만 조회 여부
- **출력**: 주문 리스트

#### `get_orders_by_store(store_id: str, active_only: bool = True) -> List[Order]`
- **목적**: 매장별 주문 조회
- **입력**: 매장 ID, 활성 주문만 조회 여부
- **출력**: 주문 리스트

#### `update_order_status(order_id: int, new_status: str) -> Order`
- **목적**: 주문 상태 변경
- **입력**: 주문 ID, 새로운 상태
- **출력**: 업데이트된 Order 객체

#### `delete_order(order_id: int) -> bool`
- **목적**: 주문 삭제
- **입력**: 주문 ID
- **출력**: 삭제 성공 여부

#### `calculate_table_total(table_id: int, session_id: str) -> float`
- **목적**: 테이블 총 주문액 계산
- **입력**: 테이블 ID, 세션 ID
- **출력**: 총 주문액

---

### TableService

#### `create_table(store_id: str, table_number: int, table_password: str) -> Table`
- **목적**: 새로운 테이블 생성
- **입력**: 매장 ID, 테이블 번호, 테이블 비밀번호
- **출력**: 생성된 Table 객체

#### `start_session(table_id: int) -> TableSession`
- **목적**: 테이블 세션 시작
- **입력**: 테이블 ID
- **출력**: 생성된 TableSession 객체 (UUID 세션 ID 포함)

#### `end_session(session_id: str) -> bool`
- **목적**: 테이블 세션 종료 (매장 이용 완료)
- **입력**: 세션 ID
- **출력**: 종료 성공 여부

#### `get_active_session(table_id: int) -> Optional[TableSession]`
- **목적**: 테이블의 활성 세션 조회
- **입력**: 테이블 ID
- **출력**: 활성 TableSession 객체 또는 None

#### `archive_session_orders(session_id: str) -> bool`
- **목적**: 세션 주문을 OrderHistory로 이동
- **입력**: 세션 ID
- **출력**: 아카이브 성공 여부

---

### MenuService

#### `get_menus_by_store(store_id: str, category_id: Optional[int] = None) -> List[Menu]`
- **목적**: 매장별 메뉴 조회 (카테고리 필터 옵션)
- **입력**: 매장 ID, 카테고리 ID (선택)
- **출력**: 메뉴 리스트

#### `get_menu_by_id(menu_id: int) -> Menu`
- **목적**: 메뉴 ID로 조회
- **입력**: 메뉴 ID
- **출력**: Menu 객체

#### `create_menu(store_id: str, menu_data: MenuCreate) -> Menu`
- **목적**: 새로운 메뉴 생성
- **입력**: 매장 ID, 메뉴 데이터
- **출력**: 생성된 Menu 객체

#### `update_menu(menu_id: int, menu_data: MenuUpdate) -> Menu`
- **목적**: 메뉴 수정
- **입력**: 메뉴 ID, 수정 데이터
- **출력**: 업데이트된 Menu 객체

#### `delete_menu(menu_id: int) -> bool`
- **목적**: 메뉴 삭제
- **입력**: 메뉴 ID
- **출력**: 삭제 성공 여부

#### `update_menu_order(menu_id: int, new_order: int) -> bool`
- **목적**: 메뉴 표시 순서 변경
- **입력**: 메뉴 ID, 새로운 순서
- **출력**: 업데이트 성공 여부

#### `get_categories_by_store(store_id: str) -> List[Category]`
- **목적**: 매장별 카테고리 조회
- **입력**: 매장 ID
- **출력**: 카테고리 리스트

#### `invalidate_menu_cache(store_id: str) -> bool`
- **목적**: 메뉴 캐시 무효화
- **입력**: 매장 ID
- **출력**: 무효화 성공 여부

---

### SSEService

#### `register_connection(store_id: str, connection_id: str) -> bool`
- **목적**: SSE 연결 등록
- **입력**: 매장 ID, 연결 ID
- **출력**: 등록 성공 여부

#### `unregister_connection(connection_id: str) -> bool`
- **목적**: SSE 연결 해제
- **입력**: 연결 ID
- **출력**: 해제 성공 여부

#### `broadcast_order_update(store_id: str, order_data: dict) -> bool`
- **목적**: 주문 업데이트 브로드캐스트
- **입력**: 매장 ID, 주문 데이터
- **출력**: 브로드캐스트 성공 여부

#### `send_initial_data(connection_id: str, store_id: str) -> bool`
- **목적**: 초기 연결 시 전체 주문 목록 전송
- **입력**: 연결 ID, 매장 ID
- **출력**: 전송 성공 여부

#### `send_incremental_update(connection_id: str, update_data: dict) -> bool`
- **목적**: 증분 업데이트 전송
- **입력**: 연결 ID, 업데이트 데이터
- **출력**: 전송 성공 여부

---

## 2. 백엔드 Repository 메서드

### StoreRepository

#### `get_by_id(store_id: str) -> Optional[Store]`
- **목적**: ID로 매장 조회
- **입력**: 매장 ID
- **출력**: Store 객체 또는 None

#### `get_by_identifier(store_identifier: str) -> Optional[Store]`
- **목적**: 식별자로 매장 조회
- **입력**: 매장 식별자
- **출력**: Store 객체 또는 None

#### `create(store_data: StoreCreate) -> Store`
- **목적**: 매장 생성
- **입력**: 매장 데이터
- **출력**: 생성된 Store 객체

---

### TableRepository

#### `get_by_id(table_id: int) -> Optional[Table]`
- **목적**: ID로 테이블 조회
- **입력**: 테이블 ID
- **출력**: Table 객체 또는 None

#### `get_by_store_and_number(store_id: str, table_number: int) -> Optional[Table]`
- **목적**: 매장 ID와 테이블 번호로 조회
- **입력**: 매장 ID, 테이블 번호
- **출력**: Table 객체 또는 None

#### `get_all_by_store(store_id: str) -> List[Table]`
- **목적**: 매장별 모든 테이블 조회
- **입력**: 매장 ID
- **출력**: Table 리스트

#### `create(table_data: TableCreate) -> Table`
- **목적**: 테이블 생성
- **입력**: 테이블 데이터
- **출력**: 생성된 Table 객체

#### `update_session(table_id: int, session_id: Optional[str]) -> Table`
- **목적**: 테이블의 현재 세션 ID 업데이트
- **입력**: 테이블 ID, 세션 ID
- **출력**: 업데이트된 Table 객체

---

### TableSessionRepository

#### `get_by_id(session_id: str) -> Optional[TableSession]`
- **목적**: ID로 세션 조회
- **입력**: 세션 ID
- **출력**: TableSession 객체 또는 None

#### `get_active_by_table(table_id: int) -> Optional[TableSession]`
- **목적**: 테이블의 활성 세션 조회
- **입력**: 테이블 ID
- **출력**: 활성 TableSession 객체 또는 None

#### `create(session_data: TableSessionCreate) -> TableSession`
- **목적**: 세션 생성
- **입력**: 세션 데이터
- **출력**: 생성된 TableSession 객체

#### `end_session(session_id: str) -> TableSession`
- **목적**: 세션 종료 (end_time 설정, is_active = False)
- **입력**: 세션 ID
- **출력**: 업데이트된 TableSession 객체

---

### OrderRepository

#### `get_by_id(order_id: int) -> Optional[Order]`
- **목적**: ID로 주문 조회
- **입력**: 주문 ID
- **출력**: Order 객체 또는 None

#### `get_by_session(session_id: str) -> List[Order]`
- **목적**: 세션별 주문 조회
- **입력**: 세션 ID
- **출력**: Order 리스트

#### `get_by_table(table_id: int, active_only: bool = True) -> List[Order]`
- **목적**: 테이블별 주문 조회
- **입력**: 테이블 ID, 활성 주문만 조회 여부
- **출력**: Order 리스트

#### `get_by_store(store_id: str, active_only: bool = True) -> List[Order]`
- **목적**: 매장별 주문 조회
- **입력**: 매장 ID, 활성 주문만 조회 여부
- **출력**: Order 리스트

#### `create(order_data: OrderCreate) -> Order`
- **목적**: 주문 생성
- **입력**: 주문 데이터
- **출력**: 생성된 Order 객체

#### `update_status(order_id: int, status: str) -> Order`
- **목적**: 주문 상태 업데이트
- **입력**: 주문 ID, 상태
- **출력**: 업데이트된 Order 객체

#### `delete(order_id: int) -> bool`
- **목적**: 주문 삭제
- **입력**: 주문 ID
- **출력**: 삭제 성공 여부

#### `calculate_total_by_table(table_id: int, session_id: str) -> float`
- **목적**: 테이블 총 주문액 계산
- **입력**: 테이블 ID, 세션 ID
- **출력**: 총 주문액

---

### MenuRepository

#### `get_by_id(menu_id: int) -> Optional[Menu]`
- **목적**: ID로 메뉴 조회
- **입력**: 메뉴 ID
- **출력**: Menu 객체 또는 None

#### `get_by_store(store_id: str, category_id: Optional[int] = None) -> List[Menu]`
- **목적**: 매장별 메뉴 조회 (카테고리 필터 옵션)
- **입력**: 매장 ID, 카테고리 ID (선택)
- **출력**: Menu 리스트

#### `create(menu_data: MenuCreate) -> Menu`
- **목적**: 메뉴 생성
- **입력**: 메뉴 데이터
- **출력**: 생성된 Menu 객체

#### `update(menu_id: int, menu_data: MenuUpdate) -> Menu`
- **목적**: 메뉴 업데이트
- **입력**: 메뉴 ID, 수정 데이터
- **출력**: 업데이트된 Menu 객체

#### `delete(menu_id: int) -> bool`
- **목적**: 메뉴 삭제
- **입력**: 메뉴 ID
- **출력**: 삭제 성공 여부

#### `update_display_order(menu_id: int, new_order: int) -> bool`
- **목적**: 메뉴 표시 순서 업데이트
- **입력**: 메뉴 ID, 새로운 순서
- **출력**: 업데이트 성공 여부

#### `get_categories_by_store(store_id: str) -> List[Category]`
- **목적**: 매장별 카테고리 조회
- **입력**: 매장 ID
- **출력**: Category 리스트

---

### OrderHistoryRepository

#### `create(history_data: OrderHistoryCreate) -> OrderHistory`
- **목적**: 주문 이력 생성
- **입력**: 이력 데이터
- **출력**: 생성된 OrderHistory 객체

#### `get_by_table(table_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[OrderHistory]`
- **목적**: 테이블별 과거 주문 조회 (날짜 필터 옵션)
- **입력**: 테이블 ID, 시작 날짜 (선택), 종료 날짜 (선택)
- **출력**: OrderHistory 리스트

---

## 3. 공통 컴포넌트 메서드

### CacheManager

#### `get(key: str) -> Optional[Any]`
- **목적**: 캐시에서 값 조회
- **입력**: 캐시 키
- **출력**: 캐시된 값 또는 None

#### `set(key: str, value: Any, ttl: int = 3600) -> bool`
- **목적**: 캐시에 값 저장
- **입력**: 캐시 키, 값, TTL (초)
- **출력**: 저장 성공 여부

#### `delete(key: str) -> bool`
- **목적**: 캐시에서 값 삭제
- **입력**: 캐시 키
- **출력**: 삭제 성공 여부

#### `invalidate_pattern(pattern: str) -> bool`
- **목적**: 패턴에 맞는 모든 캐시 무효화
- **입력**: 패턴 (예: "menu:*")
- **출력**: 무효화 성공 여부

---

### Logger

#### `debug(message: str, **kwargs) -> None`
- **목적**: DEBUG 레벨 로그 기록
- **입력**: 메시지, 추가 컨텍스트
- **출력**: None

#### `info(message: str, **kwargs) -> None`
- **목적**: INFO 레벨 로그 기록
- **입력**: 메시지, 추가 컨텍스트
- **출력**: None

#### `warning(message: str, **kwargs) -> None`
- **목적**: WARNING 레벨 로그 기록
- **입력**: 메시지, 추가 컨텍스트
- **출력**: None

#### `error(message: str, **kwargs) -> None`
- **목적**: ERROR 레벨 로그 기록
- **입력**: 메시지, 추가 컨텍스트
- **출력**: None

---

### ErrorHandler

#### `handle_validation_error(exc: ValidationError) -> JSONResponse`
- **목적**: 검증 에러 처리
- **입력**: ValidationError 예외
- **출력**: JSON 에러 응답

#### `handle_not_found_error(exc: NotFoundException) -> JSONResponse`
- **목적**: Not Found 에러 처리
- **입력**: NotFoundException 예외
- **출력**: JSON 에러 응답

#### `handle_authentication_error(exc: AuthenticationError) -> JSONResponse`
- **목적**: 인증 에러 처리
- **입력**: AuthenticationError 예외
- **출력**: JSON 에러 응답

#### `handle_generic_error(exc: Exception) -> JSONResponse`
- **목적**: 일반 에러 처리
- **입력**: Exception 예외
- **출력**: JSON 에러 응답
