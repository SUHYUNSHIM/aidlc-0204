# 🚀 전체 시스템 실행 가이드

## 실행 순서

### 1단계: Docker로 PostgreSQL 실행 ⚡

```bash
# 프로젝트 루트에서
cd aidlc-0204
docker-compose up -d
```

**확인 사항**:
- ✅ Docker Desktop이 실행 중이어야 함
- ✅ PostgreSQL 컨테이너 시작: `tableorder-postgres`
- ✅ 포트 5432 사용 가능해야 함

**상태 확인**:
```bash
docker ps
# tableorder-postgres 컨테이너가 "Up" 상태여야 함

docker logs tableorder-postgres
# "database system is ready to accept connections" 메시지 확인
```

**초기 데이터 자동 생성**:
- 스키마 (테이블 구조)
- 샘플 매장 데이터
- 샘플 메뉴 데이터
- 샘플 테이블 데이터

---

### 2단계: Backend API 실행 🔧

```bash
# 새 터미널 열기
cd aidlc-0204/backend

# 가상환경 활성화 (처음 한 번만)
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# 패키지 설치 (처음 한 번만)
pip install -r requirements.txt

# Backend 실행
python run.py
```

**확인 사항**:
- ✅ Backend 서버: http://localhost:8000
- ✅ API 문서: http://localhost:8000/docs
- ✅ Health Check: http://localhost:8000/api/v1/health

**로그 확인**:
```
INFO:     Application starting: Table Order Service
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

### 3단계: Customer Frontend 실행 🎨

```bash
# 새 터미널 열기
cd aidlc-0204/customer-frontend

# 패키지 설치 (처음 한 번만)
npm install

# Frontend 실행
npm run dev
```

**확인 사항**:
- ✅ Frontend 서버: http://localhost:5173
- ✅ 브라우저 자동 열림

---

## 전체 시스템 구조

```
┌─────────────────────────────────────────────────┐
│  Browser (http://localhost:5173)                │
│  Customer Frontend (React + TypeScript)         │
└────────────────┬────────────────────────────────┘
                 │ HTTP/REST API
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend API (http://localhost:8000)            │
│  FastAPI + Python                               │
└────────────────┬────────────────────────────────┘
                 │ SQL
                 ▼
┌─────────────────────────────────────────────────┐
│  PostgreSQL (localhost:5432)                    │
│  Docker Container                               │
└─────────────────────────────────────────────────┘
```

---

## 테스트 계정

### 고객용 (Customer Frontend)
- **Store ID**: `1`
- **Table Number**: `1`
- **Password**: `1234`

### 관리자용 (Admin Frontend - 별도)
- **Username**: `admin`
- **Password**: `admin123`

---

## 빠른 실행 스크립트

### Windows
```bash
# 프로젝트 루트에서
start-dev.bat
```

### Mac/Linux
```bash
# 프로젝트 루트에서
chmod +x start-dev.sh
./start-dev.sh
```

---

## 종료 방법

### Frontend 종료
```bash
# Frontend 터미널에서
Ctrl + C
```

### Backend 종료
```bash
# Backend 터미널에서
Ctrl + C
```

### PostgreSQL 종료
```bash
# 프로젝트 루트에서
docker-compose down

# 데이터까지 삭제하려면
docker-compose down -v
```

---

## 문제 해결

### 1. Docker 관련

#### "Docker daemon is not running"
```bash
# Docker Desktop 실행 확인
# Windows: 시스템 트레이에서 Docker 아이콘 확인
# Mac: 상단 메뉴바에서 Docker 아이콘 확인
```

#### "port 5432 is already allocated"
```bash
# 기존 PostgreSQL 프로세스 종료
# Windows
netstat -ano | findstr :5432
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5432
kill -9 <PID>
```

#### PostgreSQL 컨테이너 재시작
```bash
docker-compose restart postgres

# 또는 완전히 재생성
docker-compose down
docker-compose up -d
```

### 2. Backend 관련

#### "ModuleNotFoundError"
```bash
# 가상환경 활성화 확인
# 패키지 재설치
pip install -r requirements.txt
```

#### "Connection refused" (DB 연결 실패)
```bash
# PostgreSQL 컨테이너 상태 확인
docker ps
docker logs tableorder-postgres

# .env 파일의 DATABASE_URL 확인
DATABASE_URL=postgresql+asyncpg://tableorder:tableorder_dev_pw@localhost:5432/tableorder_db
```

#### "Port 8000 already in use"
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>
```

### 3. Frontend 관련

#### "EADDRINUSE: port 5173 already in use"
```bash
# 다른 포트로 실행
npm run dev -- --port 5174
```

#### "Network Error" / CORS 에러
```bash
# Backend .env 파일 확인
CORS_ORIGINS=http://localhost:5173

# Backend 재시작
```

#### API 연결 안됨
```bash
# Frontend .env 파일 확인
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=false

# Backend 실행 상태 확인
curl http://localhost:8000/api/v1/health
```

---

## Mock 모드 (Backend 없이 테스트)

Backend 없이 Frontend만 테스트하려면:

```bash
cd customer-frontend

# .env 파일 수정
VITE_USE_MOCK=true

npm run dev
```

**Mock 테스트 계정**:
- Store ID: `store-1`
- Table: `1`
- Password: `password` 또는 `1234`

---

## 데이터베이스 초기화

### 데이터 리셋 (처음부터 다시)
```bash
# 컨테이너와 볼륨 삭제
docker-compose down -v

# 다시 시작 (초기 데이터 자동 생성)
docker-compose up -d
```

### 데이터베이스 직접 접속
```bash
docker exec -it tableorder-postgres psql -U tableorder -d tableorder_db

# SQL 실행 예시
\dt                    # 테이블 목록
SELECT * FROM stores;  # 매장 조회
SELECT * FROM menus;   # 메뉴 조회
\q                     # 종료
```

---

## 개발 워크플로우

### 일반적인 개발 순서
1. Docker로 PostgreSQL 시작
2. Backend 실행 (API 개발/테스트)
3. Frontend 실행 (UI 개발/테스트)
4. 브라우저에서 통합 테스트

### 코드 수정 시
- **Backend**: 자동 재시작 (uvicorn --reload)
- **Frontend**: 자동 핫 리로드 (Vite HMR)
- **Database**: 스키마 변경 시 마이그레이션 필요

---

## 다음 단계

- ✅ [통합 테스트 체크리스트](INTEGRATION_TEST_CHECKLIST.md)
- ✅ [API 연동 가이드](customer-frontend/API_INTEGRATION.md)
- ✅ [Backend API 문서](http://localhost:8000/docs)
- ✅ [프로젝트 구조](PROJECT_STRUCTURE.md)

---

## 요약: 한 번에 실행하기

```bash
# 1. PostgreSQL 시작
docker-compose up -d

# 2. Backend 실행 (터미널 1)
cd backend
venv\Scripts\activate  # Windows
python run.py

# 3. Frontend 실행 (터미널 2)
cd customer-frontend
npm run dev

# 4. 브라우저에서 테스트
# http://localhost:5173
```

**로그인 정보**: Store ID: `1`, Table: `1`, Password: `1234`
