# 🚀 Quick Start Guide

## 가장 빠른 시작 방법

### Windows

```bash
start-dev.bat
```

### Mac/Linux

```bash
chmod +x start-dev.sh
./start-dev.sh
```

## 수동 실행

### 1️⃣ Backend 서버 실행

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

✅ Backend: http://localhost:8000
📚 API Docs: http://localhost:8000/docs

### 2️⃣ Frontend 서버 실행 (새 터미널)

```bash
cd customer-frontend
npm install
npm run dev
```

✅ Frontend: http://localhost:5173

## Mock 모드 (Backend 없이)

```bash
cd customer-frontend
npm install
cp .env.mock .env
npm run dev
```

**테스트 계정**:
- Store ID: `store-1`
- Table: `1`
- Password: `password`

## 환경 전환

### Mock → Backend 연동

```bash
cd customer-frontend
# .env 파일 수정
VITE_USE_MOCK=false
```

### Backend → Mock

```bash
cd customer-frontend
# .env 파일 수정
VITE_USE_MOCK=true
```

## 문제 해결

### Backend 연결 안됨
1. Backend 서버 실행 확인: http://localhost:8000
2. `.env` 파일의 `VITE_API_URL` 확인
3. CORS 설정 확인 (backend/.env)

### CORS 에러
Backend `.env`에 Frontend URL 추가:
```env
CORS_ORIGINS=http://localhost:5173
```

### 포트 충돌
- Backend: 8000 포트 사용 중인지 확인
- Frontend: 5173 포트 사용 중인지 확인

## 다음 단계

- [통합 가이드](INTEGRATION_GUIDE.md) - 상세한 설정 방법
- [Frontend README](customer-frontend/README.md) - Frontend 문서
- [API 문서](http://localhost:8000/docs) - Backend API 스펙
