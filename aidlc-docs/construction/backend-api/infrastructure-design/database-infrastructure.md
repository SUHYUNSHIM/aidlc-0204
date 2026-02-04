# 데이터베이스 인프라 (Database Infrastructure)

## 개요

PostgreSQL 데이터베이스 설정, 마이그레이션 전략, 백업 및 복구 방안입니다.

---

## 1. PostgreSQL 설정

### 1.1 데이터베이스 생성

```sql
-- 데이터베이스 및 사용자 생성
CREATE USER tableorder WITH PASSWORD 'secure_password';
CREATE DATABASE tableorder_db OWNER tableorder;

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE tableorder_db TO tableorder;

-- UUID 확장 활성화
\c tableorder_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1.2 PostgreSQL 설정 최적화

```ini
# postgresql.conf (프로덕션 권장 설정)

# 연결 설정
max_connections = 100
superuser_reserved_connections = 3

# 메모리 설정 (4GB RAM 기준)
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 16MB
maintenance_work_mem = 256MB

# WAL 설정
wal_buffers = 64MB
checkpoint_completion_target = 0.9
max_wal_size = 2GB
min_wal_size = 1GB

# 쿼리 플래너
random_page_cost = 1.1
effective_io_concurrency = 200

# 로깅
log_min_duration_statement = 1000  # 1초 이상 쿼리 로깅
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# 타임존
timezone = 'Asia/Seoul'
```

---

## 2. Alembic 마이그레이션

### 2.1 Alembic 초기 설정

```ini
# alembic.ini

[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os

[post_write_hooks]
hooks = black
black.type = console_scripts
black.entrypoint = black
black.options = -q

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

### 2.2 Alembic env.py

```python
# alembic/env.py

from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
import asyncio

from app.core.config import get_settings
from app.models import Base  # 모든 모델 import

config = context.config
settings = get_settings()

# 환경 변수에서 DB URL 설정
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """오프라인 마이그레이션 (SQL 생성만)"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """비동기 마이그레이션 실행"""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """온라인 마이그레이션"""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### 2.3 초기 마이그레이션 생성

```bash
# 마이그레이션 파일 생성
alembic revision --autogenerate -m "initial_schema"

# 마이그레이션 적용
alembic upgrade head

# 마이그레이션 롤백
alembic downgrade -1

# 현재 버전 확인
alembic current

# 마이그레이션 히스토리
alembic history
```

### 2.4 마이그레이션 예시

실제 스키마는 `database/schema/schema.sql`에 정의되어 있습니다.

```python
# alembic/versions/001_initial_schema.py

"""initial schema

Revision ID: 001
Revises: 
Create Date: 2026-02-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # stores 테이블
    op.create_table(
        'stores',
        sa.Column('store_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('store_name', sa.String(100), nullable=False),
        sa.Column('admin_username', sa.String(50), unique=True, nullable=False),
        sa.Column('admin_password_hash', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )
    
    # categories 테이블
    op.create_table(
        'categories',
        sa.Column('category_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('store_id', sa.Integer, sa.ForeignKey('stores.store_id', ondelete='CASCADE'), nullable=False),
        sa.Column('category_name', sa.String(50), nullable=False),
        sa.Column('display_order', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint('store_id', 'category_name'),
    )
    op.create_index('idx_categories_store_id', 'categories', ['store_id'])
    
    # menus 테이블
    op.create_table(
        'menus',
        sa.Column('menu_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('store_id', sa.Integer, sa.ForeignKey('stores.store_id', ondelete='CASCADE'), nullable=False),
        sa.Column('category_id', sa.Integer, sa.ForeignKey('categories.category_id', ondelete='CASCADE'), nullable=False),
        sa.Column('menu_name', sa.String(100), nullable=False),
        sa.Column('price', sa.Integer, nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('image_base64', sa.Text),
        sa.Column('display_order', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
        sa.CheckConstraint('price > 0'),
    )
    op.create_index('idx_menus_store_id', 'menus', ['store_id'])
    op.create_index('idx_menus_category_id', 'menus', ['category_id'])
    
    # tables 테이블
    op.create_table(
        'tables',
        sa.Column('table_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('store_id', sa.Integer, sa.ForeignKey('stores.store_id', ondelete='CASCADE'), nullable=False),
        sa.Column('table_number', sa.Integer, nullable=False),
        sa.Column('table_password_hash', sa.String(255), nullable=False),
        sa.Column('current_session_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint('store_id', 'table_number'),
    )
    op.create_index('idx_tables_store_id', 'tables', ['store_id'])
    
    # table_sessions 테이블
    op.create_table(
        'table_sessions',
        sa.Column('session_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('table_id', sa.Integer, sa.ForeignKey('tables.table_id', ondelete='CASCADE'), nullable=False),
        sa.Column('start_time', sa.DateTime, server_default=sa.func.now()),
        sa.Column('end_time', sa.DateTime),
        sa.Column('is_active', sa.Boolean, default=True),
    )
    op.create_index('idx_table_sessions_table_id', 'table_sessions', ['table_id'])
    
    # orders 테이블
    op.create_table(
        'orders',
        sa.Column('order_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('table_sessions.session_id', ondelete='CASCADE'), nullable=False),
        sa.Column('table_id', sa.Integer, sa.ForeignKey('tables.table_id', ondelete='CASCADE'), nullable=False),
        sa.Column('store_id', sa.Integer, sa.ForeignKey('stores.store_id', ondelete='CASCADE'), nullable=False),
        sa.Column('order_time', sa.DateTime, server_default=sa.func.now()),
        sa.Column('total_amount', sa.Integer, nullable=False),
        sa.Column('status', sa.String(20), default='대기중'),
        sa.CheckConstraint('total_amount > 0'),
        sa.CheckConstraint("status IN ('대기중', '준비중', '완료')"),
    )
    op.create_index('idx_orders_session_id', 'orders', ['session_id'])
    op.create_index('idx_orders_store_id', 'orders', ['store_id'])
    
    # order_items 테이블
    op.create_table(
        'order_items',
        sa.Column('order_item_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('order_id', sa.Integer, sa.ForeignKey('orders.order_id', ondelete='CASCADE'), nullable=False),
        sa.Column('menu_id', sa.Integer, sa.ForeignKey('menus.menu_id', ondelete='CASCADE'), nullable=False),
        sa.Column('quantity', sa.Integer, nullable=False),
        sa.Column('unit_price', sa.Integer, nullable=False),
        sa.CheckConstraint('quantity > 0'),
        sa.CheckConstraint('unit_price > 0'),
    )
    op.create_index('idx_order_items_order_id', 'order_items', ['order_id'])
    
    # order_history 테이블
    op.create_table(
        'order_history',
        sa.Column('history_id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('table_id', sa.Integer, nullable=False),
        sa.Column('store_id', sa.Integer, nullable=False),
        sa.Column('completed_time', sa.DateTime, server_default=sa.func.now()),
        sa.Column('archived_order_data', postgresql.JSONB, nullable=False),
    )
    op.create_index('idx_order_history_store_id', 'order_history', ['store_id'])


def downgrade() -> None:
    op.drop_table('order_history')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('table_sessions')
    op.drop_table('tables')
    op.drop_table('menus')
    op.drop_table('categories')
    op.drop_table('stores')
```

---

## 3. 인덱스 전략

### 3.1 필수 인덱스

실제 schema.sql에 정의된 인덱스:

```sql
-- 카테고리 조회
CREATE INDEX idx_categories_store_id ON categories(store_id);

-- 메뉴 조회
CREATE INDEX idx_menus_store_id ON menus(store_id);
CREATE INDEX idx_menus_category_id ON menus(category_id);

-- 테이블 조회
CREATE INDEX idx_tables_store_id ON tables(store_id);

-- 세션 조회
CREATE INDEX idx_table_sessions_table_id ON table_sessions(table_id);
CREATE INDEX idx_table_sessions_active ON table_sessions(is_active) WHERE is_active = TRUE;

-- 주문 조회
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_time ON orders(order_time);

-- 주문 항목 조회
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 주문 이력 조회
CREATE INDEX idx_order_history_store_id ON order_history(store_id);
CREATE INDEX idx_order_history_table_id ON order_history(table_id);
CREATE INDEX idx_order_history_time ON order_history(completed_time);
```

### 3.2 트리거 (세션 자동 관리)

```sql
-- 세션 생성 시 테이블의 current_session_id 업데이트
CREATE OR REPLACE FUNCTION update_table_current_session()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.is_active = TRUE THEN
        UPDATE tables SET current_session_id = NEW.session_id WHERE table_id = NEW.table_id;
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_table_current_session
    AFTER INSERT ON table_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_table_current_session();

-- 세션 종료 시 테이블의 current_session_id 초기화
CREATE OR REPLACE FUNCTION clear_table_current_session()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
        UPDATE tables SET current_session_id = NULL WHERE table_id = NEW.table_id;
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clear_table_current_session
    AFTER UPDATE ON table_sessions
    FOR EACH ROW
    EXECUTE FUNCTION clear_table_current_session();
```

---

## 4. 백업 및 복구

### 4.1 백업 스크립트

```bash
#!/bin/bash
# scripts/backup-db.sh

BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="tableorder_db"
DB_USER="tableorder"

# 백업 디렉토리 생성
mkdir -p ${BACKUP_DIR}

# pg_dump로 백업
PGPASSWORD=${DB_PASSWORD} pg_dump \
    -h ${DB_HOST} \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    -F c \
    -f ${BACKUP_DIR}/${DB_NAME}_${DATE}.dump

# 7일 이상 된 백업 삭제
find ${BACKUP_DIR} -name "*.dump" -mtime +7 -delete

echo "Backup completed: ${BACKUP_DIR}/${DB_NAME}_${DATE}.dump"
```

### 4.2 복구 스크립트

```bash
#!/bin/bash
# scripts/restore-db.sh

BACKUP_FILE=$1
DB_NAME="tableorder_db"
DB_USER="tableorder"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-db.sh <backup_file>"
    exit 1
fi

# 복구 실행
PGPASSWORD=${DB_PASSWORD} pg_restore \
    -h ${DB_HOST} \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    -c \
    ${BACKUP_FILE}

echo "Restore completed from: ${BACKUP_FILE}"
```

### 4.3 백업 정책

| 백업 유형 | 주기 | 보관 기간 | 용도 |
|----------|-----|----------|-----|
| Full Backup | 매일 02:00 | 7일 | 일반 복구 |
| Weekly Backup | 매주 일요일 | 4주 | 주간 복구 |
| Monthly Backup | 매월 1일 | 12개월 | 장기 보관 |

---

## 5. 연결 풀 설정

### 5.1 SQLAlchemy 비동기 연결 풀

```python
# app/core/database.py

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()

# 비동기 엔진 생성
engine = create_async_engine(
    settings.database_url,
    pool_size=settings.database_pool_size,        # 기본 연결 수
    max_overflow=settings.database_max_overflow,  # 추가 연결 허용 수
    pool_timeout=settings.database_pool_timeout,  # 연결 대기 타임아웃
    pool_pre_ping=True,                           # 연결 상태 확인
    pool_recycle=3600,                            # 1시간마다 연결 재생성
    echo=settings.debug,                          # SQL 로깅
)

# 비동기 세션 팩토리
async_session_maker = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    """데이터베이스 세션 의존성"""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
```

### 5.2 연결 풀 모니터링

```python
# app/api/v1/health.py

from sqlalchemy import text

@router.get("/health/db")
async def db_health(db: AsyncSession = Depends(get_db)):
    """데이터베이스 연결 상태 확인"""
    try:
        result = await db.execute(text("SELECT 1"))
        
        # 연결 풀 상태 (동기 엔진에서만 가능)
        pool_status = {
            "pool_size": engine.pool.size(),
            "checked_in": engine.pool.checkedin(),
            "checked_out": engine.pool.checkedout(),
            "overflow": engine.pool.overflow(),
        }
        
        return {
            "status": "healthy",
            "pool": pool_status
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
```

---

## 6. 데이터베이스 체크리스트

| 항목 | 설명 | 상태 |
|-----|-----|-----|
| PostgreSQL 14+ | 데이터베이스 버전 | ✅ |
| UUID 확장 | uuid-ossp 활성화 | ✅ |
| Alembic 마이그레이션 | 스키마 버전 관리 | ✅ |
| 인덱스 설계 | 쿼리 최적화 | ✅ |
| 연결 풀 설정 | 비동기 연결 관리 | ✅ |
| 백업 정책 | 일간/주간/월간 | ✅ |
| 모니터링 | 연결 풀 상태 확인 | ✅ |
