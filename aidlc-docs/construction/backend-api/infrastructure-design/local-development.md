# 로컬 개발 환경 (Local Development)

## 개요

개발자 로컬 환경에서의 개발 및 테스트를 위한 인프라 구성입니다.

---

## 1. Docker Compose 구성

### 1.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL 데이터베이스
  postgres:
    image: postgres:14-alpine
    container_name: tableorder_db
    environment:
      POSTGRES_USER: tableorder
      POSTGRES_PASSWORD: tableorder_dev_pw
      POSTGRES_DB: tableorder_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tableorder -d tableorder_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - tableorder_network

  # FastAPI 백엔드
  backend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: tableorder_api
    environment:
      - DATABASE_URL=postgresql+asyncpg://tableorder:tableorder_dev_pw@postgres:5432/tableorder_db
      - JWT_SECRET_KEY=dev-secret-key-not-for-production
      - DEBUG=true
      - LOG_LEVEL=DEBUG
      - CORS_ORIGINS=http://localhost:3000,http://localhost:5173
    ports:
      - "8000:8000"
    volumes:
      - ./app:/app/app
      - ./alembic:/app/alembic
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - tableorder_network
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  postgres_data:

networks:
  tableorder_network:
    driver: bridge
```

### 1.2 Dockerfile.dev (개발용)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 (볼륨 마운트로 대체됨)
COPY . .

# 포트 노출
EXPOSE 8000

# 개발 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

---

## 2. 개발 환경 설정

### 2.1 .env.development

```env
# ===========================================
# 데이터베이스
# ===========================================
DATABASE_URL=postgresql+asyncpg://tableorder:tableorder_dev_pw@localhost:5432/tableorder_db
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=5

# ===========================================
# 보안
# ===========================================
JWT_SECRET_KEY=dev-secret-key-not-for-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=16

# ===========================================
# 서버
# ===========================================
HOST=0.0.0.0
PORT=8000
DEBUG=true
LOG_LEVEL=DEBUG

# ===========================================
# CORS
# ===========================================
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# ===========================================
# SSE
# ===========================================
SSE_HEARTBEAT_INTERVAL=30
SSE_RETRY_TIMEOUT=3000
```

### 2.2 개발 환경 시작 스크립트

```bash
#!/bin/bash
# scripts/dev-start.sh

echo "🚀 Starting Table Order Service (Development)..."

# Docker Compose 실행
docker-compose up -d postgres

# DB 준비 대기
echo "⏳ Waiting for PostgreSQL..."
sleep 5

# 마이그레이션 실행
echo "📦 Running database migrations..."
alembic upgrade head

# 개발 서버 시작
echo "🔥 Starting FastAPI development server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2.3 Windows 개발 환경 시작 (PowerShell)

```powershell
# scripts/dev-start.ps1

Write-Host "🚀 Starting Table Order Service (Development)..." -ForegroundColor Green

# Docker Compose 실행
docker-compose up -d postgres

# DB 준비 대기
Write-Host "⏳ Waiting for PostgreSQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 마이그레이션 실행
Write-Host "📦 Running database migrations..." -ForegroundColor Yellow
alembic upgrade head

# 개발 서버 시작
Write-Host "🔥 Starting FastAPI development server..." -ForegroundColor Green
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 3. 데이터베이스 초기화

### 3.1 초기화 SQL 스크립트

```sql
-- scripts/init-db.sql

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 개발용 초기 데이터 (선택적)
-- 실제 마이그레이션은 Alembic으로 관리
```

### 3.2 시드 데이터 스크립트

```python
# scripts/seed_data.py
"""개발용 시드 데이터 생성"""

import asyncio
from uuid import uuid4
from app.core.database import async_session_maker
from app.core.security import hash_password
from app.models import Store, Admin, Table, Category, MenuItem

async def seed_development_data():
    """개발용 테스트 데이터 생성"""
    
    async with async_session_maker() as session:
        # 1. 테스트 매장 생성
        store = Store(
            id=uuid4(),
            name="테스트 레스토랑",
            description="개발 테스트용 매장",
            is_active=True
        )
        session.add(store)
        
        # 2. 관리자 계정 생성
        admin = Admin(
            id=uuid4(),
            store_id=store.id,
            login_id="admin",
            password_hash=hash_password("admin1234"),
            name="테스트 관리자"
        )
        session.add(admin)
        
        # 3. 테이블 생성 (5개)
        for i in range(1, 6):
            table = Table(
                id=uuid4(),
                store_id=store.id,
                table_number=i,
                table_code=f"TABLE{i:03d}",
                capacity=4,
                is_active=True
            )
            session.add(table)
        
        # 4. 카테고리 생성
        categories = [
            Category(id=uuid4(), store_id=store.id, name="메인 메뉴", display_order=1),
            Category(id=uuid4(), store_id=store.id, name="사이드", display_order=2),
            Category(id=uuid4(), store_id=store.id, name="음료", display_order=3),
        ]
        for cat in categories:
            session.add(cat)
        
        # 5. 메뉴 아이템 생성
        menu_items = [
            MenuItem(id=uuid4(), store_id=store.id, category_id=categories[0].id,
                    name="불고기 정식", description="소고기 불고기와 밥, 반찬",
                    price=15000, is_available=True, display_order=1),
            MenuItem(id=uuid4(), store_id=store.id, category_id=categories[0].id,
                    name="김치찌개", description="돼지고기 김치찌개",
                    price=10000, is_available=True, display_order=2),
            MenuItem(id=uuid4(), store_id=store.id, category_id=categories[1].id,
                    name="계란말이", description="부드러운 계란말이",
                    price=6000, is_available=True, display_order=1),
            MenuItem(id=uuid4(), store_id=store.id, category_id=categories[2].id,
                    name="콜라", description="코카콜라 355ml",
                    price=2000, is_available=True, display_order=1),
        ]
        for item in menu_items:
            session.add(item)
        
        await session.commit()
        print("✅ Seed data created successfully!")
        print(f"   Store ID: {store.id}")
        print(f"   Admin Login: admin / admin1234")

if __name__ == "__main__":
    asyncio.run(seed_development_data())
```

---

## 4. 개발 도구 설정

### 4.1 VS Code 설정

```json
// .vscode/settings.json
{
    "python.defaultInterpreterPath": ".venv/bin/python",
    "python.formatting.provider": "black",
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "editor.formatOnSave": true,
    "[python]": {
        "editor.codeActionsOnSave": {
            "source.organizeImports": true
        }
    }
}
```

### 4.2 launch.json (디버깅)

```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "FastAPI Debug",
            "type": "python",
            "request": "launch",
            "module": "uvicorn",
            "args": [
                "app.main:app",
                "--host", "0.0.0.0",
                "--port", "8000",
                "--reload"
            ],
            "jinja": true,
            "envFile": "${workspaceFolder}/.env.development"
        }
    ]
}
```

---

## 5. 개발 워크플로우

### 5.1 초기 설정

```bash
# 1. 저장소 클론
git clone <repository-url>
cd table-order-service

# 2. 가상환경 생성
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 환경 변수 설정
cp .env.example .env.development

# 5. Docker로 PostgreSQL 시작
docker-compose up -d postgres

# 6. 마이그레이션 실행
alembic upgrade head

# 7. 시드 데이터 생성 (선택)
python scripts/seed_data.py

# 8. 개발 서버 시작
uvicorn app.main:app --reload
```

### 5.2 일상 개발

```bash
# 서버 시작
uvicorn app.main:app --reload

# 테스트 실행
pytest

# 코드 포맷팅
black app/
isort app/

# 린트 체크
flake8 app/
```

---

## 6. 개발 환경 체크리스트

| 항목 | 설명 | 상태 |
|-----|-----|-----|
| Python 3.11+ | 런타임 환경 | ✅ |
| Docker Desktop | 컨테이너 실행 | ✅ |
| PostgreSQL 14 | Docker로 실행 | ✅ |
| VS Code | 권장 IDE | ✅ |
| Git | 버전 관리 | ✅ |
