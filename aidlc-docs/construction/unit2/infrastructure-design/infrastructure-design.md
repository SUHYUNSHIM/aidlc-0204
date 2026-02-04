# Infrastructure Design - Unit 2: Admin Frontend

## 1. 배포 환경 개요

**배포 전략**: 로컬 개발 환경 전용

**근거**:
- 프로젝트 요구사항: 로컬 개발 환경에서만 실행
- 팀 병렬 개발 중 (4개 유닛)
- 통합 후 배포 계획 수립 예정

---

## 2. 인프라 구성

### 2.1 개발 환경

```
개발자 로컬 머신
├── Node.js 18+
├── npm/yarn
├── Vite Dev Server (포트 5173)
└── 브라우저 (Chrome/Edge/Safari/Firefox)
```

**구성 요소**:
- **Node.js**: JavaScript 런타임 (v18 이상)
- **npm/yarn**: 패키지 매니저
- **Vite**: 개발 서버 및 빌드 도구
- **브라우저**: 관리자 인터페이스 접근

---

### 2.2 네트워크 구성

```
┌─────────────────────────────────────────────────────────┐
│                  개발자 로컬 머신                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐         ┌──────────────────┐      │
│  │  Vite Dev Server │         │  Backend API     │      │
│  │  localhost:5173  │ ◄─────► │  localhost:8000  │      │
│  │  (Admin Frontend)│         │  (FastAPI)       │      │
│  └──────────────────┘         └──────────────────┘      │
│         ▲                                                │
│         │                                                │
│         ▼                                                │
│  ┌──────────────────┐                                   │
│  │     브라우저      │                                   │
│  │  (Chrome/Edge)   │                                   │
│  └──────────────────┘                                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**통신**:
- Frontend → Backend: HTTP (localhost:8000)
- SSE: EventSource → Backend (localhost:8000/admin/orders/sse)

---

## 3. 보안 설정

### 3.1 HTTPS 설정

**선택**: Let's Encrypt (향후 프로덕션 배포 시)

**현재 (로컬 개발)**:
- HTTP 사용 (localhost)
- HTTPS 미적용 (개발 환경)

**향후 (프로덕션 배포 시)**:
- Let's Encrypt 무료 SSL 인증서
- Certbot으로 자동 갱신
- Nginx에서 HTTPS 리다이렉트

---

### 3.2 CORS 설정

**Backend (FastAPI) 설정**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 4. 환경 변수 관리

### 4.1 .env 파일

**위치**: `/frontend/.env`

**내용**:
```bash
# API 설정
VITE_API_BASE_URL=http://localhost:8000

# Sentry 설정 (선택)
VITE_SENTRY_DSN=https://your-sentry-dsn

# 환경
VITE_ENV=development
```

**사용**:
```javascript
// src/config/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// src/main.jsx
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENV,
  });
}
```

---

### 4.2 환경별 설정

**개발 환경** (`.env.development`):
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_ENV=development
```

**프로덕션 환경** (`.env.production`):
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_ENV=production
VITE_SENTRY_DSN=https://your-sentry-dsn
```

---

## 5. 빌드 및 실행

### 5.1 개발 서버 실행

```bash
# 의존성 설치
cd frontend
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 접속
# http://localhost:5173
```

**Vite 설정** (`vite.config.js`):
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

---

### 5.2 프로덕션 빌드 (향후)

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물
# dist/
#   ├── index.html
#   ├── assets/
#   │   ├── index-[hash].js
#   │   └── index-[hash].css
#   └── favicon.ico
```

---

## 6. 디렉토리 구조

```
frontend/
├── public/                 # 정적 파일
│   └── favicon.ico
├── src/
│   ├── admin/             # 관리자 컴포넌트
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   └── AdminApp.jsx
│   ├── shared/            # 공유 컴포넌트
│   │   └── components/
│   ├── api/               # API 클라이언트
│   │   ├── client.js
│   │   ├── orders.js
│   │   └── menus.js
│   ├── config/            # 설정
│   │   └── queryClient.js
│   ├── App.jsx            # 루트 컴포넌트
│   └── main.jsx           # 진입점
├── .env                   # 환경 변수
├── .env.development       # 개발 환경 변수
├── .env.production        # 프로덕션 환경 변수
├── vite.config.js         # Vite 설정
├── package.json           # 의존성
└── README.md              # 문서
```

---

## 7. 의존성 관리

### 7.1 package.json

```json
{
  "name": "admin-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx",
    "format": "prettier --write \"src/**/*.{js,jsx}\""
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0",
    "@tanstack/react-query": "^4.29.0",
    "axios": "^1.4.0",
    "@mui/material": "^5.13.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0"
  },
  "devDependencies": {
    "vite": "^4.3.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.40.0",
    "prettier": "^2.8.8",
    "@sentry/react": "^7.54.0"
  }
}
```

---

## 8. 모니터링 및 로깅

### 8.1 개발 환경

**브라우저 개발자 도구**:
- Console: 로그 확인
- Network: API 요청/응답 확인
- React DevTools: 컴포넌트 상태 확인
- React Query DevTools: 캐시 상태 확인

**React Query DevTools 설정**:
```javascript
// src/App.jsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <AdminApp />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </>
  );
}
```

---

### 8.2 에러 추적 (Sentry)

**개발 환경**: 콘솔 로그만
**프로덕션 환경**: Sentry 통합

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENV,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

---

## 9. 향후 프로덕션 배포 옵션

### 9.1 옵션 1: Nginx 서버

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;
    
    # HTTPS 리다이렉트
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;
    
    # SSL 인증서 (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;
    
    root /var/www/admin-frontend/dist;
    index index.html;
    
    # SPA 라우팅
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 정적 파일 캐싱
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### 9.2 옵션 2: AWS S3 + CloudFront

```bash
# S3 버킷 생성
aws s3 mb s3://admin-frontend-bucket

# 빌드 파일 업로드
aws s3 sync dist/ s3://admin-frontend-bucket --delete

# CloudFront 배포 생성
# - Origin: S3 버킷
# - SSL: AWS Certificate Manager
# - Caching: 정적 파일 캐싱
```

---

## 10. 인프라 요약

| 항목 | 현재 (로컬 개발) | 향후 (프로덕션) |
|------|-----------------|----------------|
| 배포 환경 | 로컬 머신 | Nginx 서버 또는 AWS S3 |
| 웹 서버 | Vite Dev Server | Nginx 또는 CloudFront |
| 포트 | 5173 | 80/443 |
| HTTPS | 미적용 | Let's Encrypt |
| 환경 변수 | .env 파일 | .env.production |
| 모니터링 | 브라우저 DevTools | Sentry |
| 로깅 | Console | Sentry + CloudWatch |

---

## 11. 개발 환경 설정 가이드

### 11.1 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Git
- 브라우저 (Chrome/Edge/Safari/Firefox)

---

### 11.2 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/SUHYUNSHIM/aidlc-0204.git
cd aidlc-0204

# 2. Unit 2 브랜치 체크아웃
git checkout feature/unit2-admin-frontend

# 3. 프론트엔드 디렉토리로 이동
cd frontend

# 4. 의존성 설치
npm install

# 5. 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (API URL 등)

# 6. 개발 서버 시작
npm run dev

# 7. 브라우저에서 접속
# http://localhost:5173
```

---

### 11.3 백엔드 연동

**백엔드 서버 실행** (별도 터미널):
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**프론트엔드에서 API 호출**:
```javascript
// .env
VITE_API_BASE_URL=http://localhost:8000

// src/api/client.js
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});
```

---

## 12. 제약사항

### 12.1 현재 제약사항

- 로컬 개발 환경만 지원
- HTTPS 미적용
- 프로덕션 배포 미지원
- 단일 개발자 환경 (팀 공유 환경 없음)

---

### 12.2 향후 고려사항

- 프로덕션 배포 전략 수립
- CI/CD 파이프라인 구축
- 스테이징 환경 구성
- 모니터링 및 알림 설정
- 백업 및 복구 계획
