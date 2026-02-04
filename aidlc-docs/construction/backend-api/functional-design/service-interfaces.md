# 서비스 인터페이스 정의

## 1. AuthService

```python
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

class IAuthService(ABC):
    """인증 서비스 인터페이스"""
    
    @abstractmethod
    def authenticate_table(
        self, 
        store_id: int, 
        table_number: int, 
        table_password: str
    ) -> dict:
        """
        테이블 인증
        
        Args:
            store_id: 매장 ID (integer)
            table_number: 테이블 번호
            table_password: 테이블 비밀번호
            
        Returns:
            {
                "access_token": str,
                "token_type": "Bearer",
                "expires_in": int,
                "table_id": int,
                "table_number": int,
                "session_id": UUID,
                "store_id": int,
                "store_name": str
            }
            
        Raises:
            NotFoundException: 매장/테이블 없음
            AuthenticationError: 인증 실패
        """
        pass
    
    @abstractmethod
    def authenticate_admin(
        self, 
        username: str, 
        password: str
    ) -> dict:
        """
        관리자 인증
        
        Args:
            username: 관리자 사용자명 (전역 고유)
            password: 비밀번호
            
        Returns:
            {
                "access_token": str,
                "token_type": "Bearer",
                "expires_in": int,
                "store_id": int,
                "store_name": str,
                "username": str
            }
            
        Raises:
            AuthenticationError: 인증 실패
        """
        pass
    
    @abstractmethod
    def verify_token(self, token: str) -> dict:
        """
        JWT 토큰 검증
        
        Args:
            token: JWT 토큰
            
        Returns:
            토큰 페이로드 dict
            
        Raises:
            AuthenticationError: 토큰 무효 또는 만료
        """
        pass
    
    @abstractmethod
    def hash_password(self, password: str) -> str:
        """비밀번호 해싱 (bcrypt)"""
        pass
    
    @abstractmethod
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """비밀번호 검증"""
        pass
```

---

## 2. OrderService

```python
from typing import List, Optional
from uuid import UUID

class IOrderService(ABC):
    """주문 서비스 인터페이스"""
    
    @abstractmethod
    def create_order(
        self,
        session_id: UUID,
        table_id: int,
        store_id: int,
        items: List[dict]
    ) -> dict:
        """
        주문 생성
        
        Args:
            session_id: 세션 ID (UUID)
            table_id: 테이블 ID
            store_id: 매장 ID (integer)
            items: [{"menu_id": int, "quantity": int}, ...]
            
        Returns:
            OrderResponse dict
            
        Raises:
            NotFoundException: 세션/메뉴 없음
            ValidationError: 유효성 검증 실패
            ConflictError: 세션 종료됨
        """
        pass
    
    @abstractmethod
    def get_orders_by_session(self, session_id: UUID) -> dict:
        """
        세션별 주문 조회 (고객용)
        
        Args:
            session_id: 세션 ID (UUID)
            
        Returns:
            CustomerOrdersResponse dict
        """
        pass
    
    @abstractmethod
    def get_orders_by_store(
        self, 
        store_id: int, 
        status: Optional[str] = None,
        table_id: Optional[int] = None
    ) -> dict:
        """
        매장별 주문 조회 (관리자용)
        
        Args:
            store_id: 매장 ID (integer)
            status: 상태 필터 (선택)
            table_id: 테이블 필터 (선택)
            
        Returns:
            AdminOrdersResponse dict
        """
        pass
    
    @abstractmethod
    def update_order_status(
        self, 
        order_id: int, 
        new_status: str, 
        store_id: int
    ) -> dict:
        """
        주문 상태 변경
        
        Args:
            order_id: 주문 ID
            new_status: 새 상태 (대기중/준비중/완료)
            store_id: 매장 ID (권한 확인용)
            
        Returns:
            OrderStatusResponse dict
            
        Raises:
            NotFoundException: 주문 없음
            ValidationError: 잘못된 상태값
            ForbiddenError: 권한 없음
        """
        pass
    
    @abstractmethod
    def delete_order(self, order_id: int, store_id: int) -> dict:
        """
        주문 삭제
        
        Args:
            order_id: 주문 ID
            store_id: 매장 ID (권한 확인용)
            
        Returns:
            OrderDeleteResponse dict
            
        Raises:
            NotFoundException: 주문 없음
            ForbiddenError: 권한 없음
        """
        pass
    
    @abstractmethod
    def calculate_session_total(self, session_id: UUID) -> int:
        """세션 총 주문액 계산"""
        pass
```

---

## 3. TableService

```python
from typing import Optional, List
from datetime import date
from uuid import UUID

class ITableService(ABC):
    """테이블 서비스 인터페이스"""
    
    @abstractmethod
    def create_table(
        self, 
        store_id: int, 
        table_number: int, 
        table_password: str
    ) -> dict:
        """
        테이블 생성
        
        Args:
            store_id: 매장 ID (integer)
            table_number: 테이블 번호
            table_password: 테이블 비밀번호
            
        Returns:
            TableResponse dict
            
        Raises:
            ConflictError: 중복 테이블 번호
        """
        pass
    
    @abstractmethod
    def start_session(self, table_id: int) -> dict:
        """
        세션 시작 (트리거가 table.current_session_id 자동 업데이트)
        
        Args:
            table_id: 테이블 ID
            
        Returns:
            {"session_id": UUID, "start_time": datetime}
        """
        pass
    
    @abstractmethod
    def end_session(self, table_id: int, store_id: int) -> dict:
        """
        세션 종료 (매장 이용 완료)
        트리거가 table.current_session_id를 NULL로 자동 설정
        
        Args:
            table_id: 테이블 ID
            store_id: 매장 ID (권한 확인용)
            
        Returns:
            SessionEndResponse dict
            
        Raises:
            NotFoundException: 테이블 없음
            ConflictError: 활성 세션 없음
            ForbiddenError: 권한 없음
        """
        pass
    
    @abstractmethod
    def get_active_session(self, table_id: int) -> Optional[dict]:
        """테이블의 활성 세션 조회"""
        pass
    
    @abstractmethod
    def get_table_history(
        self,
        table_id: int,
        store_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 20,
        offset: int = 0
    ) -> dict:
        """
        테이블 과거 주문 내역 조회
        
        Args:
            table_id: 테이블 ID
            store_id: 매장 ID (integer)
            start_date: 시작 날짜 (선택)
            end_date: 종료 날짜 (선택)
            limit: 조회 개수
            offset: 오프셋
            
        Returns:
            TableHistoryResponse dict
        """
        pass
    
    @abstractmethod
    def get_tables_by_store(self, store_id: int) -> List[dict]:
        """매장의 모든 테이블 조회"""
        pass
```

---

## 4. MenuService

```python
from typing import Optional, List

class IMenuService(ABC):
    """메뉴 서비스 인터페이스"""
    
    @abstractmethod
    def get_menus_by_store(
        self, 
        store_id: int, 
        category_id: Optional[int] = None
    ) -> dict:
        """
        매장별 메뉴 조회 (캐싱 적용)
        
        Args:
            store_id: 매장 ID (integer)
            category_id: 카테고리 필터 (선택)
            
        Returns:
            MenuListResponse dict
        """
        pass
    
    @abstractmethod
    def get_menu_by_id(self, menu_id: int) -> dict:
        """
        메뉴 ID로 조회
        
        Raises:
            NotFoundException: 메뉴 없음
        """
        pass
    
    @abstractmethod
    def create_menu(self, store_id: int, menu_data: dict) -> dict:
        """
        메뉴 생성
        
        Args:
            store_id: 매장 ID (integer)
            menu_data: MenuCreate dict
            
        Returns:
            MenuResponse dict
            
        Raises:
            NotFoundException: 카테고리 없음
            ValidationError: 유효성 검증 실패
        """
        pass
    
    @abstractmethod
    def update_menu(
        self, 
        menu_id: int, 
        store_id: int, 
        menu_data: dict
    ) -> dict:
        """
        메뉴 수정
        
        Args:
            menu_id: 메뉴 ID
            store_id: 매장 ID (권한 확인용)
            menu_data: MenuUpdate dict
            
        Returns:
            MenuResponse dict
            
        Raises:
            NotFoundException: 메뉴 없음
            ForbiddenError: 권한 없음
        """
        pass
    
    @abstractmethod
    def delete_menu(self, menu_id: int, store_id: int) -> bool:
        """
        메뉴 삭제
        
        Raises:
            NotFoundException: 메뉴 없음
            ForbiddenError: 권한 없음
        """
        pass
    
    @abstractmethod
    def update_menu_order(
        self, 
        menu_id: int, 
        store_id: int, 
        display_order: int
    ) -> dict:
        """메뉴 표시 순서 변경"""
        pass
    
    @abstractmethod
    def invalidate_cache(self, store_id: int) -> bool:
        """메뉴 캐시 무효화"""
        pass
    
    @abstractmethod
    def get_categories_by_store(self, store_id: int) -> List[dict]:
        """매장의 카테고리 목록 조회"""
        pass
    
    @abstractmethod
    def create_category(self, store_id: int, category_data: dict) -> dict:
        """카테고리 생성"""
        pass
    
    @abstractmethod
    def update_category(
        self, 
        category_id: int, 
        store_id: int, 
        category_data: dict
    ) -> dict:
        """카테고리 수정"""
        pass
    
    @abstractmethod
    def delete_category(self, category_id: int, store_id: int) -> bool:
        """카테고리 삭제"""
        pass
```

---

## 5. SSEService

```python
from typing import Tuple
import asyncio

class ISSEService(ABC):
    """SSE 서비스 인터페이스"""
    
    @abstractmethod
    async def register_connection(self, store_id: int) -> Tuple[str, asyncio.Queue]:
        """
        SSE 연결 등록
        
        Args:
            store_id: 매장 ID (integer)
            
        Returns:
            (connection_id, queue) 튜플
        """
        pass
    
    @abstractmethod
    def unregister_connection(self, connection_id: str) -> bool:
        """
        SSE 연결 해제
        
        Args:
            connection_id: 연결 ID
            
        Returns:
            성공 여부
        """
        pass
    
    @abstractmethod
    async def broadcast_order_update(
        self, 
        store_id: int, 
        event_type: str, 
        data: dict
    ) -> bool:
        """
        주문 업데이트 브로드캐스트
        
        Args:
            store_id: 매장 ID (integer)
            event_type: 이벤트 타입 (order_created, order_updated, etc.)
            data: 이벤트 데이터
            
        Returns:
            성공 여부
        """
        pass
    
    @abstractmethod
    async def send_initial_data(self, connection_id: str, store_id: int) -> bool:
        """
        초기 데이터 전송
        
        Args:
            connection_id: 연결 ID
            store_id: 매장 ID (integer)
            
        Returns:
            성공 여부
        """
        pass
    
    @abstractmethod
    def get_connection_count(self, store_id: int) -> int:
        """매장의 활성 연결 수 조회"""
        pass
```

---

## 6. CacheManager

```python
from typing import Any, Optional

class ICacheManager(ABC):
    """캐시 관리자 인터페이스"""
    
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """
        캐시에서 값 조회
        
        Args:
            key: 캐시 키
            
        Returns:
            캐시된 값 또는 None
        """
        pass
    
    @abstractmethod
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """
        캐시에 값 저장
        
        Args:
            key: 캐시 키
            value: 저장할 값
            ttl: TTL (초, 기본 1시간)
            
        Returns:
            성공 여부
        """
        pass
    
    @abstractmethod
    def delete(self, key: str) -> bool:
        """
        캐시에서 값 삭제
        
        Args:
            key: 캐시 키
            
        Returns:
            성공 여부
        """
        pass
    
    @abstractmethod
    def invalidate_pattern(self, pattern: str) -> int:
        """
        패턴에 맞는 모든 캐시 무효화
        
        Args:
            pattern: 패턴 (예: "menu:1*")
            
        Returns:
            삭제된 키 개수
        """
        pass
    
    @abstractmethod
    def clear(self) -> bool:
        """전체 캐시 초기화"""
        pass
```

---

## 7. 의존성 주입 구조

```python
# dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

security = HTTPBearer()

def get_db() -> Session:
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """AuthService 의존성"""
    store_repo = StoreRepository(db)
    table_repo = TableRepository(db)
    session_repo = TableSessionRepository(db)
    return AuthService(store_repo, table_repo, session_repo)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> dict:
    """현재 사용자 (JWT 검증)"""
    try:
        payload = auth_service.verify_token(credentials.credentials)
        return payload
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """현재 관리자 (admin 타입 확인)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def get_current_table(current_user: dict = Depends(get_current_user)) -> dict:
    """현재 테이블 (table 타입 확인)"""
    if current_user.get("user_type") != "table":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Table access required"
        )
    return current_user

def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    """OrderService 의존성"""
    order_repo = OrderRepository(db)
    session_repo = TableSessionRepository(db)
    menu_repo = MenuRepository(db)
    sse_service = get_sse_service()
    return OrderService(order_repo, session_repo, menu_repo, sse_service)

def get_table_service(db: Session = Depends(get_db)) -> TableService:
    """TableService 의존성"""
    table_repo = TableRepository(db)
    session_repo = TableSessionRepository(db)
    order_repo = OrderRepository(db)
    history_repo = OrderHistoryRepository(db)
    sse_service = get_sse_service()
    return TableService(table_repo, session_repo, order_repo, history_repo, sse_service)

def get_menu_service(db: Session = Depends(get_db)) -> MenuService:
    """MenuService 의존성"""
    menu_repo = MenuRepository(db)
    category_repo = CategoryRepository(db)
    cache_manager = get_cache_manager()
    return MenuService(menu_repo, category_repo, cache_manager)

# 싱글톤 인스턴스
_sse_service: Optional[SSEService] = None
_cache_manager: Optional[CacheManager] = None

def get_sse_service() -> SSEService:
    """SSEService 싱글톤"""
    global _sse_service
    if _sse_service is None:
        _sse_service = SSEService()
    return _sse_service

def get_cache_manager() -> CacheManager:
    """CacheManager 싱글톤"""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = InMemoryCacheManager()
    return _cache_manager
```
