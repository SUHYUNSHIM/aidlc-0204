# Admin Frontend - Unit 2

관리자용 프론트엔드 애플리케이션

## 기술 스택

- React 18+
- React Router 6
- React Query (TanStack Query)
- Material-UI (MUI)
- Axios
- Vite

## 설치 및 실행

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```
VITE_API_BASE_URL=http://localhost:8000
VITE_SENTRY_DSN=
VITE_ENV=development
```

### 3. 개발 서버 시작

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 4. 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

## 주요 기능

### US-009: 관리자 로그인
- JWT 토큰 기반 인증
- 16시간 세션 유지
- 자동 토큰 갱신

### US-010: 실시간 주문 대시보드
- SSE를 통한 실시간 업데이트
- 테이블별 주문 그룹화
- 신규 주문 시각적 강조 (3초)

### US-011: 주문 상세 정보 확인
- 주문 항목 상세 표시
- 테이블별 총 주문액 계산

### US-012: 주문 상태 변경
- 상태 전환 규칙 검증
- 낙관적 업데이트
- 상태 변경 후 모달 자동 닫기

### US-013: SSE 실시간 업데이트
- 지수 백오프 재연결 (최대 5회, 16초)
- 재연결 실패 시 폴링 모드 (10초 간격)
- 수동 새로고침 버튼

### US-014: 테이블 초기 설정
- 테이블 번호 및 비밀번호 설정
- 중복 테이블 번호 검증

### US-015: 주문 삭제
- 삭제 확인 팝업
- 낙관적 삭제

### US-016: 테이블 세션 종료
- 세션 종료 확인
- 해당 테이블 주문 모두 제거

### US-017: 과거 주문 내역 조회
- 페이지네이션 (20개씩)
- 시간 역순 정렬

### US-018 ~ US-022: 메뉴 관리
- 메뉴 CRUD (생성, 조회, 수정, 삭제)
- 이미지 업로드 (Base64, 최대 1MB)
- 카테고리별 그룹화

## 디렉토리 구조

```
frontend/
├── src/
│   ├── admin/
│   │   ├── components/      # 관리자 컴포넌트
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── OrderDashboard.jsx
│   │   │   ├── TableCard.jsx
│   │   │   ├── OrderDetailModal.jsx
│   │   │   ├── MenuManagement.jsx
│   │   │   └── TableManagement.jsx
│   │   ├── contexts/        # Context API
│   │   │   └── AdminContext.jsx
│   │   ├── hooks/           # Custom Hooks
│   │   │   └── useSSE.js
│   │   └── AdminApp.jsx     # 관리자 앱 루트
│   ├── api/                 # API 클라이언트
│   │   ├── client.js
│   │   ├── orders.js
│   │   ├── menus.js
│   │   └── tables.js
│   ├── config/              # 설정
│   │   └── queryClient.js
│   ├── utils/               # 유틸리티
│   │   └── helpers.js
│   └── main.jsx             # 진입점
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```

## API 엔드포인트

### 인증
- `POST /admin/login` - 로그인
- `POST /admin/refresh-token` - 토큰 갱신

### 주문
- `GET /admin/orders?store_id={storeId}` - 주문 조회
- `GET /admin/orders/sse?store_id={storeId}` - SSE 연결
- `PATCH /admin/orders/{id}/status` - 주문 상태 변경
- `DELETE /admin/orders/{id}` - 주문 삭제

### 메뉴
- `GET /admin/menus?store_id={storeId}` - 메뉴 조회
- `POST /admin/menus` - 메뉴 생성
- `PATCH /admin/menus/{id}` - 메뉴 수정
- `DELETE /admin/menus/{id}` - 메뉴 삭제

### 테이블
- `GET /admin/tables?store_id={storeId}` - 테이블 조회
- `POST /admin/tables` - 테이블 생성
- `POST /admin/tables/{id}/end-session` - 세션 종료
- `GET /admin/tables/{id}/history` - 과거 내역 조회

## 개발 가이드

### 코드 스타일

```bash
# ESLint 실행
npm run lint

# Prettier 포맷팅
npm run format
```

### 테스트

```bash
npm run test
```

## 배포

### Nginx 서버

```bash
# 빌드
npm run build

# dist/ 디렉토리를 서버에 업로드
scp -r dist/* user@server:/var/www/admin-frontend/
```

### AWS S3 + CloudFront

```bash
# 빌드
npm run build

# S3 업로드
aws s3 sync dist/ s3://admin-frontend-bucket --delete
```

## 문제 해결

### SSE 연결 실패
- 백엔드 서버가 실행 중인지 확인
- CORS 설정 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 로그인 실패
- API URL 확인 (.env 파일)
- 백엔드 서버 상태 확인
- 인증 정보 확인

## 라이선스

MIT
