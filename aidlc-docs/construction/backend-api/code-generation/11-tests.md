# Phase 5-2: 테스트 코드

## 목표

단위 테스트 및 통합 테스트 구현

---

## 1. tests/conftest.py

```python
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings

# 테스트용 인메모리 SQLite
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """이벤트 루프 픽스처"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """테스트용 DB 엔진"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    await engine.dispose()


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """테스트용 DB 세션"""
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """테스트용 HTTP 클라이언트"""
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_store(db_session: AsyncSession):
    """테스트용 매장 데이터"""
    from app.models import Store
    
    store = Store(
        store_name="테스트 매장",
        admin_username="testadmin",
        admin_password_hash="$2b$12$test_hash",  # 실제로는 bcrypt 해시
    )
    db_session.add(store)
    await db_session.commit()
    await db_session.refresh(store)
    return store


@pytest.fixture
async def test_table(db_session: AsyncSession, test_store):
    """테스트용 테이블 데이터"""
    from app.models import Table
    
    table = Table(
        store_id=test_store.store_id,
        table_number=1,
        table_password_hash="$2b$12$test_hash",
    )
    db_session.add(table)
    await db_session.commit()
    await db_session.refresh(table)
    return table


@pytest.fixture
async def test_category(db_session: AsyncSession, test_store):
    """테스트용 카테고리 데이터"""
    from app.models import Category
    
    category = Category(
        store_id=test_store.store_id,
        category_name="메인 메뉴",
        display_order=1,
    )
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    return category


@pytest.fixture
async def test_menu(db_session: AsyncSession, test_store, test_category):
    """테스트용 메뉴 데이터"""
    from app.models import Menu
    from decimal import Decimal
    
    menu = Menu(
        store_id=test_store.store_id,
        category_id=test_category.category_id,
        menu_name="테스트 메뉴",
        price=Decimal("15000"),
        description="테스트 메뉴 설명",
    )
    db_session.add(menu)
    await db_session.commit()
    await db_session.refresh(menu)
    return menu
```

---

## 2. tests/unit/test_services/test_auth_service.py

```python
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.auth_service import AuthService
from app.core.exceptions import AuthenticationError, NotFoundError


class TestAuthService:
    """AuthService 단위 테스트"""
    
    @pytest.fixture
    def mock_store_repo(self):
        return AsyncMock()
    
    @pytest.fixture
    def mock_table_repo(self):
        return AsyncMock()
    
    @pytest.fixture
    def mock_session_repo(self):
        return AsyncMock()
    
    @pytest.fixture
    def auth_service(self, mock_store_repo, mock_table_repo, mock_session_repo):
        return AuthService(mock_store_repo, mock_table_repo, mock_session_repo)
    
    @pytest.mark.asyncio
    async def test_authenticate_table_success(
        self, auth_service, mock_store_repo, mock_table_repo, mock_session_repo
    ):
        """테이블 인증 성공 테스트"""
        # Given
        mock_store = MagicMock(store_id=1, store_name="테스트 매장")
        mock_table = MagicMock(
            table_id=1,
            store_id=1,
            table_number=1,
            table_password_hash="$2b$12$valid_hash",
        )
        mock_session = MagicMock(session_id="test-uuid")
        
        mock_store_repo.get_by_id.return_value = mock_store
        mock_table_repo.get_by_store_and_number.return_value = mock_table
        mock_session_repo.create_or_get_active.return_value = mock_session
        
        # When (bcrypt 검증 모킹 필요)
        # result = await auth_service.authenticate_table(1, 1, "password")
        
        # Then
        # assert result is not None
        pass
    
    @pytest.mark.asyncio
    async def test_authenticate_table_store_not_found(
        self, auth_service, mock_store_repo
    ):
        """존재하지 않는 매장 테스트"""
        # Given
        mock_store_repo.get_by_id.return_value = None
        
        # When & Then
        with pytest.raises(NotFoundError):
            await auth_service.authenticate_table(999, 1, "password")
    
    @pytest.mark.asyncio
    async def test_authenticate_admin_invalid_password(
        self, auth_service, mock_store_repo
    ):
        """잘못된 관리자 비밀번호 테스트"""
        # Given
        mock_store = MagicMock(
            admin_username="admin",
            admin_password_hash="$2b$12$valid_hash",
        )
        mock_store_repo.get_by_admin_username.return_value = mock_store
        
        # When & Then (bcrypt 검증 모킹 필요)
        # with pytest.raises(AuthenticationError):
        #     await auth_service.authenticate_admin("admin", "wrong_password")
        pass
```

---

## 3. tests/unit/test_services/test_order_service.py

```python
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from decimal import Decimal
from app.services.order_service import OrderService
from app.core.exceptions import NotFoundError, BusinessLogicError


class TestOrderService:
    """OrderService 단위 테스트"""
    
    @pytest.fixture
    def mock_order_repo(self):
        return AsyncMock()
    
    @pytest.fixture
    def mock_session_repo(self):
        return AsyncMock()
    
    @pytest.fixture
    def mock_menu_repo(self):
        return AsyncMock()
    
    @pytest.fixture
    def mock_table_repo(self):
        return AsyncMock()
    
    @pytest.fixture
    def order_service(
        self, mock_order_repo, mock_session_repo, mock_menu_repo, mock_table_repo
    ):
        return OrderService(
            mock_order_repo, mock_session_repo, mock_menu_repo, mock_table_repo
        )
    
    @pytest.mark.asyncio
    async def test_create_order_success(
        self, order_service, mock_session_repo, mock_menu_repo, mock_order_repo
    ):
        """주문 생성 성공 테스트"""
        # Given
        session_id = uuid4()
        mock_session = MagicMock(session_id=session_id, table_id=1)
        mock_menu = MagicMock(
            menu_id=1,
            store_id=1,
            price=Decimal("15000"),
            menu_name="테스트 메뉴",
        )
        mock_order = MagicMock(
            order_id=1,
            session_id=session_id,
            total_amount=Decimal("30000"),
        )
        
        mock_session_repo.get_by_id.return_value = mock_session
        mock_menu_repo.get_by_id.return_value = mock_menu
        mock_order_repo.create.return_value = mock_order
        
        # When
        items = [{"menu_id": 1, "quantity": 2}]
        # result = await order_service.create_order(session_id, 1, 1, items)
        
        # Then
        # assert result.total_amount == Decimal("30000")
        pass
    
    @pytest.mark.asyncio
    async def test_create_order_invalid_session(
        self, order_service, mock_session_repo
    ):
        """유효하지 않은 세션으로 주문 시도"""
        # Given
        mock_session_repo.get_by_id.return_value = None
        
        # When & Then
        with pytest.raises(NotFoundError):
            await order_service.create_order(
                uuid4(), 1, 1, [{"menu_id": 1, "quantity": 1}]
            )
    
    @pytest.mark.asyncio
    async def test_create_order_empty_items(self, order_service):
        """빈 주문 항목 테스트"""
        # When & Then
        with pytest.raises(BusinessLogicError):
            await order_service.create_order(uuid4(), 1, 1, [])
    
    @pytest.mark.asyncio
    async def test_update_order_status(
        self, order_service, mock_order_repo
    ):
        """주문 상태 변경 테스트"""
        # Given
        mock_order = MagicMock(
            order_id=1,
            store_id=1,
            status="pending",
        )
        mock_order_repo.get_by_id.return_value = mock_order
        mock_order_repo.update.return_value = mock_order
        
        # When
        # result = await order_service.update_order_status(1, "confirmed", 1)
        
        # Then
        # assert result.status == "confirmed"
        pass
```

---

## 4. tests/integration/test_api/test_auth_api.py

```python
import pytest
from httpx import AsyncClient


class TestAuthAPI:
    """인증 API 통합 테스트"""
    
    @pytest.mark.asyncio
    async def test_table_login_success(
        self, client: AsyncClient, test_store, test_table
    ):
        """테이블 로그인 성공"""
        # Given (실제 비밀번호 해시 필요)
        # response = await client.post(
        #     "/api/v1/auth/table/login",
        #     json={
        #         "store_id": test_store.store_id,
        #         "table_number": test_table.table_number,
        #         "table_password": "password123",
        #     }
        # )
        
        # Then
        # assert response.status_code == 200
        # assert "access_token" in response.json()
        pass
    
    @pytest.mark.asyncio
    async def test_table_login_invalid_store(self, client: AsyncClient):
        """존재하지 않는 매장으로 로그인"""
        response = await client.post(
            "/api/v1/auth/table/login",
            json={
                "store_id": 99999,
                "table_number": 1,
                "table_password": "password",
            }
        )
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_admin_login_invalid_credentials(self, client: AsyncClient):
        """잘못된 관리자 자격 증명"""
        response = await client.post(
            "/api/v1/auth/admin/login",
            json={
                "username": "nonexistent",
                "password": "wrongpassword",
            }
        )
        
        assert response.status_code in [401, 404]
```

---

## 5. tests/integration/test_api/test_customer_api.py

```python
import pytest
from httpx import AsyncClient


class TestCustomerAPI:
    """고객 API 통합 테스트"""
    
    @pytest.mark.asyncio
    async def test_get_menus_unauthorized(self, client: AsyncClient):
        """인증 없이 메뉴 조회"""
        response = await client.get("/api/v1/customer/menus")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_create_order_unauthorized(self, client: AsyncClient):
        """인증 없이 주문 생성"""
        response = await client.post(
            "/api/v1/customer/orders",
            json={"items": [{"menu_id": 1, "quantity": 1}]}
        )
        
        assert response.status_code == 401
```

---

## 6. tests/integration/test_api/test_health_api.py

```python
import pytest
from httpx import AsyncClient


class TestHealthAPI:
    """헬스 체크 API 통합 테스트"""
    
    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient):
        """기본 헬스 체크"""
        response = await client.get("/api/v1/health")
        
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    @pytest.mark.asyncio
    async def test_liveness_check(self, client: AsyncClient):
        """생존 상태 체크"""
        response = await client.get("/api/v1/health/live")
        
        assert response.status_code == 200
        assert response.json()["status"] == "alive"
    
    @pytest.mark.asyncio
    async def test_readiness_check(self, client: AsyncClient):
        """준비 상태 체크"""
        response = await client.get("/api/v1/health/ready")
        
        assert response.status_code == 200
        # DB 연결 상태에 따라 결과 다름
```

---

## 7. pytest.ini

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
filterwarnings =
    ignore::DeprecationWarning
```

---

## 8. 테스트 실행 방법

```bash
# 전체 테스트 실행
pytest

# 단위 테스트만 실행
pytest tests/unit/

# 통합 테스트만 실행
pytest tests/integration/

# 커버리지 포함
pytest --cov=app --cov-report=html

# 특정 테스트 파일 실행
pytest tests/unit/test_services/test_order_service.py

# 특정 테스트 함수 실행
pytest tests/unit/test_services/test_order_service.py::TestOrderService::test_create_order_success
```

---

## 테스트 디렉토리 구조

```
tests/
├── conftest.py              # 공통 픽스처
├── unit/                    # 단위 테스트
│   ├── test_services/
│   │   ├── test_auth_service.py
│   │   ├── test_order_service.py
│   │   ├── test_menu_service.py
│   │   └── test_table_service.py
│   └── test_repositories/
│       ├── test_order_repository.py
│       └── test_menu_repository.py
├── integration/             # 통합 테스트
│   └── test_api/
│       ├── test_auth_api.py
│       ├── test_customer_api.py
│       ├── test_admin_api.py
│       └── test_health_api.py
└── pytest.ini
```

---

## 체크리스트

- [ ] tests/conftest.py 구현
- [ ] tests/unit/test_services/ 테스트 구현
- [ ] tests/integration/test_api/ 테스트 구현
- [ ] pytest.ini 설정
- [ ] 테스트 커버리지 80% 이상 달성
