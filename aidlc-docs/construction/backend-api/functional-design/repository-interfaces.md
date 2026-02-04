# Repository 인터페이스 정의

## 1. StoreRepository

```python
from abc import ABC, abstractmethod
from typing import Optional
from models import Store

class IStoreRepository(ABC):
    """Store 엔티티 데이터 액세스"""
    
    @abstractmethod
    def get_by_id(self, store_id: int) -> Optional[Store]:
        """
        ID로 매장 조회
        
        Args:
            store_id: 매장 ID (integer)
            
        Returns:
            Store 객체 또는 None
        """
        pass
    
    @abstractmethod
    def get_by_admin_username(self, username: str) -> Optional[Store]:
        """
        관리자 사용자명으로 매장 조회
        
        Args:
            username: 관리자 사용자명
            
        Returns:
            Store 객체 또는 None
        """
        pass
    
    @abstractmethod
    def create(self, store: Store) -> Store:
        """
        매장 생성
        
        Args:
            store: Store 객체
            
        Returns:
            생성된 Store 객체
        """
        pass
    
    @abstractmethod
    def update(self, store: Store) -> Store:
        """매장 정보 업데이트"""
        pass
    
    @abstractmethod
    def delete(self, store_id: int) -> bool:
        """매장 삭제"""
        pass
```

---

## 2. TableRepository

```python
from typing import Optional, List
from uuid import UUID
from models import Table

class ITableRepository(ABC):
    """Table 엔티티 데이터 액세스"""
    
    @abstractmethod
    def get_by_id(self, table_id: int) -> Optional[Table]:
        """ID로 테이블 조회"""
        pass
    
    @abstractmethod
    def get_by_store_and_number(
        self, 
        store_id: int, 
        table_number: int
    ) -> Optional[Table]:
        """
        매장 ID와 테이블 번호로 조회
        
        Args:
            store_id: 매장 ID (integer)
            table_number: 테이블 번호
            
        Returns:
            Table 객체 또는 None
        """
        pass
    
    @abstractmethod
    def get_all_by_store(self, store_id: int) -> List[Table]:
        """
        매장별 모든 테이블 조회
        
        Args:
            store_id: 매장 ID (integer)
            
        Returns:
            Table 리스트
        """
        pass
    
    @abstractmethod
    def create(self, table: Table) -> Table:
        """테이블 생성"""
        pass
    
    @abstractmethod
    def update(self, table: Table) -> Table:
        """테이블 정보 업데이트"""
        pass
    
    @abstractmethod
    def delete(self, table_id: int) -> bool:
        """테이블 삭제"""
        pass
```

---

## 3. TableSessionRepository

```python
from typing import Optional, List
from uuid import UUID
from models import TableSession

class ITableSessionRepository(ABC):
    """TableSession 엔티티 데이터 액세스"""
    
    @abstractmethod
    def get_by_id(self, session_id: UUID) -> Optional[TableSession]:
        """ID로 세션 조회"""
        pass
    
    @abstractmethod
    def get_active_by_table(self, table_id: int) -> Optional[TableSession]:
        """
        테이블의 활성 세션 조회
        
        Args:
            table_id: 테이블 ID
            
        Returns:
            활성 TableSession 객체 또는 None
        """
        pass
    
    @abstractmethod
    def get_by_table(
        self, 
        table_id: int, 
        active_only: bool = True
    ) -> List[TableSession]:
        """
        테이블별 세션 조회
        
        Args:
            table_id: 테이블 ID
            active_only: 활성 세션만 조회 여부
            
        Returns:
            TableSession 리스트
        """
        pass
    
    @abstractmethod
    def create(self, session: TableSession) -> TableSession:
        """세션 생성 (트리거가 table.current_session_id 자동 업데이트)"""
        pass
    
    @abstractmethod
    def update(self, session: TableSession) -> TableSession:
        """세션 정보 업데이트"""
        pass
    
    @abstractmethod
    def end_session(self, session_id: UUID) -> TableSession:
        """
        세션 종료 (end_time 설정, is_active = False)
        트리거가 table.current_session_id를 NULL로 자동 설정
        
        Args:
            session_id: 세션 ID (UUID)
            
        Returns:
            업데이트된 TableSession 객체
        """
        pass
```

---

## 4. CategoryRepository

```python
from typing import Optional, List
from models import Category

class ICategoryRepository(ABC):
    """Category 엔티티 데이터 액세스"""
    
    @abstractmethod
    def get_by_id(self, category_id: int) -> Optional[Category]:
        """ID로 카테고리 조회"""
        pass
    
    @abstractmethod
    def get_by_store(self, store_id: int) -> List[Category]:
        """
        매장별 카테고리 조회 (display_order 순)
        
        Args:
            store_id: 매장 ID (integer)
            
        Returns:
            Category 리스트 (정렬됨)
        """
        pass
    
    @abstractmethod
    def get_by_store_and_name(
        self, 
        store_id: int, 
        category_name: str
    ) -> Optional[Category]:
        """매장 ID와 카테고리명으로 조회"""
        pass
    
    @abstractmethod
    def create(self, category: Category) -> Category:
        """카테고리 생성"""
        pass
    
    @abstractmethod
    def update(self, category: Category) -> Category:
        """카테고리 업데이트"""
        pass
    
    @abstractmethod
    def delete(self, category_id: int) -> bool:
        """카테고리 삭제"""
        pass
    
    @abstractmethod
    def count_menus(self, category_id: int) -> int:
        """카테고리의 메뉴 수 조회"""
        pass
```

---

## 5. MenuRepository

```python
from typing import Optional, List
from models import Menu

class IMenuRepository(ABC):
    """Menu 엔티티 데이터 액세스"""
    
    @abstractmethod
    def get_by_id(self, menu_id: int) -> Optional[Menu]:
        """ID로 메뉴 조회"""
        pass
    
    @abstractmethod
    def get_by_store(
        self, 
        store_id: int, 
        category_id: Optional[int] = None
    ) -> List[Menu]:
        """
        매장별 메뉴 조회 (카테고리 필터 옵션)
        
        Args:
            store_id: 매장 ID (integer)
            category_id: 카테고리 ID (선택)
            
        Returns:
            Menu 리스트 (display_order 순)
        """
        pass
    
    @abstractmethod
    def get_by_category(self, category_id: int) -> List[Menu]:
        """
        카테고리별 메뉴 조회
        
        Args:
            category_id: 카테고리 ID
            
        Returns:
            Menu 리스트 (display_order 순)
        """
        pass
    
    @abstractmethod
    def create(self, menu: Menu) -> Menu:
        """메뉴 생성"""
        pass
    
    @abstractmethod
    def update(self, menu: Menu) -> Menu:
        """메뉴 업데이트"""
        pass
    
    @abstractmethod
    def delete(self, menu_id: int) -> bool:
        """메뉴 삭제"""
        pass
    
    @abstractmethod
    def update_display_order(self, menu_id: int, new_order: int) -> bool:
        """메뉴 표시 순서 업데이트"""
        pass
```

---

## 6. OrderRepository

```python
from typing import Optional, List
from uuid import UUID
from models import Order

class IOrderRepository(ABC):
    """Order 엔티티 데이터 액세스"""
    
    @abstractmethod
    def get_by_id(self, order_id: int) -> Optional[Order]:
        """ID로 주문 조회 (items 포함)"""
        pass
    
    @abstractmethod
    def get_by_session(self, session_id: UUID) -> List[Order]:
        """
        세션별 주문 조회
        
        Args:
            session_id: 세션 ID (UUID)
            
        Returns:
            Order 리스트 (order_time DESC)
        """
        pass
    
    @abstractmethod
    def get_by_table(
        self, 
        table_id: int, 
        active_session_only: bool = True
    ) -> List[Order]:
        """
        테이블별 주문 조회
        
        Args:
            table_id: 테이블 ID
            active_session_only: 활성 세션 주문만 조회
            
        Returns:
            Order 리스트
        """
        pass
    
    @abstractmethod
    def get_by_store(
        self, 
        store_id: int, 
        status: Optional[str] = None,
        active_session_only: bool = True
    ) -> List[Order]:
        """
        매장별 주문 조회
        
        Args:
            store_id: 매장 ID (integer)
            status: 상태 필터 (선택)
            active_session_only: 활성 세션 주문만 조회
            
        Returns:
            Order 리스트
        """
        pass
    
    @abstractmethod
    def create(self, order: Order) -> Order:
        """주문 생성"""
        pass
    
    @abstractmethod
    def update(self, order: Order) -> Order:
        """주문 업데이트"""
        pass
    
    @abstractmethod
    def update_status(self, order_id: int, status: str) -> Order:
        """주문 상태 업데이트"""
        pass
    
    @abstractmethod
    def delete(self, order_id: int) -> bool:
        """주문 삭제 (CASCADE로 OrderItem도 삭제)"""
        pass
    
    @abstractmethod
    def calculate_total_by_session(self, session_id: UUID) -> int:
        """세션 총 주문액 계산"""
        pass
```

---

## 7. OrderItemRepository

```python
from typing import List
from models import OrderItem

class IOrderItemRepository(ABC):
    """OrderItem 엔티티 데이터 액세스"""
    
    @abstractmethod
    def get_by_order(self, order_id: int) -> List[OrderItem]:
        """주문별 항목 조회"""
        pass
    
    @abstractmethod
    def create(self, order_item: OrderItem) -> OrderItem:
        """주문 항목 생성"""
        pass
    
    @abstractmethod
    def create_bulk(self, order_items: List[OrderItem]) -> List[OrderItem]:
        """주문 항목 일괄 생성"""
        pass
    
    @abstractmethod
    def delete_by_order(self, order_id: int) -> int:
        """주문의 모든 항목 삭제"""
        pass
```

---

## 8. OrderHistoryRepository

```python
from typing import Optional, List
from datetime import date
from uuid import UUID
from models import OrderHistory

class IOrderHistoryRepository(ABC):
    """OrderHistory 엔티티 데이터 액세스"""
    
    @abstractmethod
    def get_by_id(self, history_id: int) -> Optional[OrderHistory]:
        """ID로 이력 조회"""
        pass
    
    @abstractmethod
    def get_by_table(
        self,
        table_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[OrderHistory]:
        """
        테이블별 과거 주문 조회 (날짜 필터 옵션)
        
        Args:
            table_id: 테이블 ID
            start_date: 시작 날짜 (선택)
            end_date: 종료 날짜 (선택)
            limit: 조회 개수
            offset: 오프셋
            
        Returns:
            OrderHistory 리스트 (completed_time DESC)
        """
        pass
    
    @abstractmethod
    def get_by_store(
        self,
        store_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[OrderHistory]:
        """매장별 과거 주문 조회"""
        pass
    
    @abstractmethod
    def count_by_table(
        self,
        table_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> int:
        """테이블별 이력 수 조회"""
        pass
    
    @abstractmethod
    def create(self, history: OrderHistory) -> OrderHistory:
        """주문 이력 생성"""
        pass
```

---

## 9. Repository 구현 예시

### SQLAlchemy 기반 구현

```python
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from sqlalchemy.orm import joinedload
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class OrderRepository(IOrderRepository):
    """Order Repository SQLAlchemy 구현"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, order_id: int) -> Optional[Order]:
        return self.db.query(Order)\
            .options(joinedload(Order.items))\
            .filter(Order.order_id == order_id)\
            .first()
    
    def get_by_session(self, session_id: UUID) -> List[Order]:
        return self.db.query(Order)\
            .options(joinedload(Order.items))\
            .filter(Order.session_id == session_id)\
            .order_by(Order.order_time.desc())\
            .all()
    
    def get_by_store(
        self, 
        store_id: int, 
        status: Optional[str] = None,
        active_session_only: bool = True
    ) -> List[Order]:
        query = self.db.query(Order)\
            .options(joinedload(Order.items))\
            .filter(Order.store_id == store_id)
        
        if status:
            query = query.filter(Order.status == status)
        
        if active_session_only:
            query = query.join(TableSession)\
                .filter(TableSession.is_active == True)
        
        return query.order_by(Order.order_time.desc()).all()
    
    def create(self, order: Order) -> Order:
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order
    
    def update_status(self, order_id: int, status: str) -> Order:
        order = self.get_by_id(order_id)
        if order:
            order.status = status
            self.db.commit()
            self.db.refresh(order)
        return order
    
    def delete(self, order_id: int) -> bool:
        order = self.get_by_id(order_id)
        if order:
            self.db.delete(order)
            self.db.commit()
            return True
        return False
    
    def calculate_total_by_session(self, session_id: UUID) -> int:
        result = self.db.query(func.sum(Order.total_amount))\
            .filter(Order.session_id == session_id)\
            .scalar()
        return result or 0
```
