# Deployment Architecture - Unit 2: Admin Frontend

## 1. 배포 아키텍처 개요

**현재 단계**: 로컬 개발 환경
**배포 전략**: 개발자 로컬 머신에서 실행

---

## 2. 로컬 개발 아키텍처

### 2.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                     개발자 로컬 머신                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    브라우저                                │   │
│  │              http://localhost:5173                        │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                           │
│                       │ HTTP                                      │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Vite Dev Server                              │   │
│  │              포트: 5173                                    │   │
│  │              HMR (Hot Module Replacement)                 │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                           │
│                       │ HTTP/SSE                                  │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Backend API (FastAPI)                        │   │
│  │              포트: 8000                                    │   │
│  │              - REST API                                   │   │
│  │              - SSE (Server-Sent Events)                   │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                           │
│                       │ SQL                                       │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL                                   │   │
│  │              포트: 5432                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.2 컴포넌트별 상세

#### Frontend (Vite Dev Server)
- **포트**: 5173
- **프로세스**: `npm run dev`
- **기능**:
  - React 앱 서빙
  - HMR (코드 변경 시 자동 새로고침)
  - 개발자 도구 통합

#### Backend (FastAPI)
- **포트**: 8000
- **프로세스**: `uvicorn main:app --reload`
- **기능**:
  - REST API 제공
  - SSE 실시간 통신
  - JWT 인증

#### Database (PostgreSQL)
- **포트**: 5432
- **프로세스**: `postgres`
- **기능**:
  - 데이터 저장
  - 트랜잭션 관리

---

## 3. 네트워크 통신

### 3.1 HTTP 통신

```
브라우저 → Vite Dev Server → Backend API
  │                              │
  │  GET /admin/orders          │
  │  ──────────────────────────►│
  │                              │
  │  200 OK + JSON              │
  │  ◄──────────────────────────│
```

**API 엔드포인트**:
- `POST /admin/login` - 로그인
- `GET /admin/orders` - 주문 조회
- `PATCH /admin/orders/{id}/status` - 주문 상태 변경
- `DELETE /admin/orders/{id}` - 주문 삭제
- `GET /admin/menus` - 메뉴 조회
- `POST /admin/menus` - 메뉴 생성
- `PATCH /admin/menus/{id}` - 메뉴 수정
- `DELETE /admin/menus/{id}` - 메뉴 삭제

---

### 3.2 SSE 통신

```
브라우저 → Backend API (SSE)
  │              │
  │  EventSource │
  │  ──────────►│
  │              │
  │  event: message
  │  data: {...}
  │  ◄──────────│
  │              │
  │  (연결 유지) │
```

**SSE 이벤트**:
- `initial` - 초기 전체 데이터
- `order_created` - 신규 주문 생성
- `order_updated` - 주문 상태 변경
- `order_deleted` - 주문 삭제
- `session_ended` - 테이블 세션 종료

---

## 4. 데이터 흐름

### 4.1 로그인 플로우

```
1. 사용자 입력 (storeId, username, password)
   ↓
2. AdminLogin 컴포넌트
   ↓
3. POST /admin/login
   ↓
4. Backend 인증 처리
   ↓
5. JWT 토큰 발급
   ↓
6. localStorage 저장
   ↓
7. AdminContext 업데이트
   ↓
8. /admin/dashboard 리다이렉트
```

---

### 4.2 주문 조회 플로우

```
1. OrderDashboard 마운트
   ↓
2. useQuery(['orders', storeId])
   ↓
3. GET /admin/orders?store_id={storeId}
   ↓
4. Backend 데이터 조회
   ↓
5. React Query 캐시 저장
   ↓
6. 테이블별 그룹화 (groupOrdersByTable)
   ↓
7. UI 렌더링
```

---

### 4.3 실시간 업데이트 플로우

```
1. SSE 연결 (EventSource)
   ↓
2. Backend SSE 스트림 구독
   ↓
3. 이벤트 수신 (order_created, order_updated 등)
   ↓
4. handleSSEEvent 처리
   ↓
5. React Query 캐시 업데이트
   ↓
6. UI 자동 리렌더링
```

---

## 5. 개발 환경 설정

### 5.1 필수 소프트웨어

| 소프트웨어 | 버전 | 용도 |
|-----------|------|------|
| Node.js | 18+ | JavaScript 런타임 |
| npm/yarn | Latest | 패키지 매니저 |
| Python | 3.9+ | Backend 런타임 |
| PostgreSQL | 14+ | 데이터베이스 |
| Git | Latest | 버전 관리 |

---

### 5.2 포트 할당

| 서비스 | 포트 | 프로토콜 |
|--------|------|---------|
| Frontend (Vite) | 5173 | HTTP |
| Backend (FastAPI) | 8000 | HTTP/SSE |
| Database (PostgreSQL) | 5432 | TCP |

---

## 6. 향후 프로덕션 배포 아키텍처

### 6.1 옵션 1: Nginx 서버

```
┌─────────────────────────────────────────────────────────┐
│                      인터넷                              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS (443)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Nginx 서버                              │
│              (Let's Encrypt SSL)                         │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  Static Files    │         │  Backend API     │     │
│  │  (React Build)   │         │  (FastAPI)       │     │
│  │  /var/www/admin  │         │  localhost:8000  │     │
│  └──────────────────┘         └──────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

**특징**:
- Nginx가 정적 파일 서빙
- Backend API 프록시
- SSL 인증서 (Let's Encrypt)
- 단일 서버 구성

---

### 6.2 옵션 2: AWS S3 + CloudFront

```
┌─────────────────────────────────────────────────────────┐
│                      인터넷                              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS (443)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              CloudFront (CDN)                            │
│          (AWS Certificate Manager SSL)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              S3 Bucket                                   │
│          (Static Website Hosting)                        │
│          - index.html                                    │
│          - assets/                                       │
└─────────────────────────────────────────────────────────┘
                     │
                     │ API 호출
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API                                 │
│          (EC2 / ECS / Lambda)                            │
└─────────────────────────────────────────────────────────┘
```

**특징**:
- S3에 정적 파일 저장
- CloudFront CDN으로 전 세계 배포
- AWS Certificate Manager SSL
- 확장성 높음

---

## 7. CI/CD 파이프라인 (향후)

### 7.1 GitHub Actions 예시

```yaml
name: Deploy Admin Frontend

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      
      - name: Build
        run: |
          cd frontend
          npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
      
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/dist/ s3://admin-frontend-bucket --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
```

---

## 8. 모니터링 및 로깅 (향후)

### 8.1 프로덕션 모니터링

```
┌─────────────────────────────────────────────────────────┐
│                  Admin Frontend                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 에러 로그
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Sentry                                  │
│              (에러 추적 및 모니터링)                      │
└─────────────────────────────────────────────────────────┘
                     │
                     │ 알림
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Slack / Email                               │
│              (알림 수신)                                  │
└─────────────────────────────────────────────────────────┘
```

---

### 8.2 성능 모니터링

- **Lighthouse**: 성능 점수 측정
- **Web Vitals**: LCP, FID, CLS 모니터링
- **Sentry Performance**: 트랜잭션 추적

---

## 9. 보안 고려사항

### 9.1 현재 (로컬 개발)

- HTTP 사용 (localhost)
- JWT 토큰 localStorage 저장
- CORS 설정 (localhost:5173 허용)

---

### 9.2 향후 (프로덕션)

- HTTPS 강제 (Let's Encrypt)
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)

---

## 10. 배포 체크리스트

### 10.1 로컬 개발 환경

- [ ] Node.js 18+ 설치
- [ ] npm/yarn 설치
- [ ] Git 저장소 클론
- [ ] 브랜치 체크아웃 (feature/unit2-admin-frontend)
- [ ] 의존성 설치 (`npm install`)
- [ ] .env 파일 설정
- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] 브라우저 접속 (http://localhost:5173)

---

### 10.2 프로덕션 배포 (향후)

- [ ] 프로덕션 빌드 (`npm run build`)
- [ ] 빌드 결과물 확인 (`dist/`)
- [ ] 환경 변수 설정 (`.env.production`)
- [ ] SSL 인증서 설정
- [ ] 서버 배포 (Nginx 또는 S3)
- [ ] DNS 설정
- [ ] HTTPS 확인
- [ ] 모니터링 설정 (Sentry)
- [ ] 성능 테스트
- [ ] 보안 테스트

---

## 11. 아키텍처 요약

| 항목 | 현재 (로컬 개발) | 향후 (프로덕션) |
|------|-----------------|----------------|
| 배포 환경 | 로컬 머신 | Nginx 서버 또는 AWS |
| 웹 서버 | Vite Dev Server | Nginx 또는 CloudFront |
| 프로토콜 | HTTP | HTTPS |
| 포트 | 5173 | 80/443 |
| SSL | 미적용 | Let's Encrypt |
| CDN | 없음 | CloudFront (선택) |
| 모니터링 | DevTools | Sentry |
| CI/CD | 수동 | GitHub Actions |
