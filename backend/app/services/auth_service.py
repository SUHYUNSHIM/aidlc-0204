from app.core.security import verify_password, create_access_token
from app.core.exceptions import NotFoundException, AuthenticationError
from app.repositories import StoreRepository, TableRepository, SessionRepository
from app.models import TableSession


class AuthService:
    def __init__(
        self,
        store_repo: StoreRepository,
        table_repo: TableRepository,
        session_repo: SessionRepository
    ):
        self.store_repo = store_repo
        self.table_repo = table_repo
        self.session_repo = session_repo
    
    async def authenticate_table(
        self, store_id: int, table_number: int, table_password: str
    ) -> dict:
        # 1. 매장 확인
        store = await self.store_repo.get_by_id(store_id)
        if not store:
            raise NotFoundException("Store not found")
        
        # 2. 테이블 조회
        table = await self.table_repo.get_by_store_and_number(store_id, table_number)
        if not table:
            raise NotFoundException("Table not found")
        
        # 3. 비밀번호 검증
        if not verify_password(table_password, table.table_password_hash):
            raise AuthenticationError("Invalid credentials")
        
        # 4. 세션 확인/생성
        session = None
        if table.current_session_id:
            session = await self.session_repo.get_by_id(table.current_session_id)
            if session and not session.is_active:
                session = None
        
        if not session:
            session = TableSession(table_id=table.table_id)
            session = await self.session_repo.create(session)
            # 테이블의 current_session_id 업데이트
            table.current_session_id = session.session_id
            await self.table_repo.update(table)
        
        # 5. JWT 토큰 생성
        token_data = {
            "sub": f"table_{table.table_id}",
            "user_type": "table",
            "store_id": store_id,
            "table_id": table.table_id,
            "table_number": table.table_number,
            "session_id": str(session.session_id),
        }
        access_token = create_access_token(token_data)
        
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 57600,
            "table_id": table.table_id,
            "table_number": table.table_number,
            "session_id": session.session_id,
            "store_id": store_id,
            "store_name": store.store_name,
        }
    
    async def authenticate_admin(self, username: str, password: str) -> dict:
        # 1. 사용자명으로 매장 조회
        store = await self.store_repo.get_by_admin_username(username)
        if not store:
            raise AuthenticationError("Invalid credentials")
        
        # 2. 비밀번호 검증
        if not verify_password(password, store.admin_password_hash):
            raise AuthenticationError("Invalid credentials")
        
        # 3. JWT 토큰 생성
        token_data = {
            "sub": username,
            "user_type": "admin",
            "store_id": store.store_id,
        }
        access_token = create_access_token(token_data)
        
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 57600,
            "store_id": store.store_id,
            "store_name": store.store_name,
            "username": username,
        }
