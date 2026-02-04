# Tech Stack Decisions - Unit 2: Admin Frontend

## 1. 핵심 기술 스택

### 1.1 프론트엔드 프레임워크

**선택**: React 18+

**근거**:
- 컴포넌트 기반 아키텍처로 재사용성 높음
- 풍부한 생태계 (라이브러리, 도구)
- 팀 숙련도 높음
- Concurrent Mode로 성능 최적화
- Hooks로 상태 관리 간편

**대안 고려**:
- Vue.js: 학습 곡선 낮지만 생태계 작음
- Angular: 엔터프라이즈급이지만 무겁고 복잡
- Svelte: 성능 좋지만 생태계 작음

---

### 1.2 상태 관리

**선택**: React Query + Context API

**근거**:
- **React Query**: 서버 상태 관리 (주문, 메뉴 데이터)
  - 자동 캐싱, 재시도, 무효화
  - 낙관적 업데이트 지원
  - SSE와 통합 가능
- **Context API**: 로컬 상태 관리 (인증, UI 상태)
  - 간단하고 가벼움
  - Redux 불필요 (복잡도 낮음)

**대안 고려**:
- Redux: 과도한 보일러플레이트, 복잡도 높음
- Zustand: 가볍지만 서버 상태 관리 부족
- Recoil: 실험적, 안정성 낮음

---

### 1.3 HTTP 클라이언트

**선택**: Axios

**근거**:
- 인터셉터로 JWT 토큰 자동 추가
- 요청/응답 변환 간편
- 에러 처리 일관성
- 브라우저 호환성 좋음
- React Query와 통합 쉬움

**대안 고려**:
- Fetch API: 인터셉터 없음, 에러 처리 복잡
- ky: 가볍지만 생태계 작음

---

### 1.4 UI 컴포넌트 라이브러리

**선택**: Material-UI (MUI) v5

**근거**:
- 풍부한 컴포넌트 (Button, Modal, Table, Snackbar 등)
- Material Design 기반 일관된 디자인
- 반응형 Grid 시스템
- 접근성 (WCAG 2.1 AA) 기본 지원
- 커뮤니티 크고 문서 좋음
- TypeScript 지원 우수

**대안 고려**:
- Ant Design: 관리자 UI 특화지만 중국 느낌 디자인
- Chakra UI: 가볍지만 컴포넌트 수 적음
- Tailwind CSS: 커스터마이징 자유롭지만 개발 시간 오래 걸림

---

### 1.5 라우팅

**선택**: React Router v6

**근거**:
- React 표준 라우팅 라이브러리
- 선언적 라우팅
- 중첩 라우팅 지원
- 코드 스플리팅 통합 쉬움

**대안 고려**:
- Next.js: 파일 기반 라우팅이지만 SSR 불필요
- Reach Router: React Router에 통합됨

---

## 2. 개발 도구

### 2.1 빌드 도구

**선택**: Vite

**근거**:
- 빠른 개발 서버 (HMR)
- 빠른 프로덕션 빌드
- ES Modules 기반
- React 공식 지원
- 플러그인 생태계 풍부

**대안 고려**:
- Create React App: 느리고 설정 제한적
- Webpack: 설정 복잡

---

### 2.2 언어

**선택**: JavaScript (TypeScript 선택)

**근거**:
- JavaScript: 빠른 개발, 학습 곡선 낮음
- TypeScript (선택): 타입 안정성, IDE 지원 우수

**권장**: TypeScript 사용 (타입 안정성, 유지보수성)

---

### 2.3 코드 품질

**선택**: ESLint + Prettier

**근거**:
- ESLint: 코드 품질 검사, 버그 조기 발견
- Prettier: 코드 포맷팅 자동화
- 팀 코드 스타일 일관성

**설정**:
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ]
}
```

---

### 2.4 테스트

**선택**: Jest + React Testing Library

**근거**:
- Jest: React 표준 테스트 프레임워크
- React Testing Library: 사용자 중심 테스트
- 통합 테스트 지원 (MSW로 API 모킹)

**테스트 전략**:
- 단위 테스트: 컴포넌트, Hook, 유틸 함수
- 통합 테스트: API 통신, 상태 관리
- E2E 테스트: Cypress (선택)

---

## 3. 실시간 통신

### 3.1 SSE (Server-Sent Events)

**선택**: EventSource API

**근거**:
- 단방향 실시간 통신 (서버 → 클라이언트)
- WebSocket보다 간단
- 자동 재연결 지원
- HTTP/2 호환

**구현**:
```javascript
const eventSource = new EventSource('/admin/orders/sse?store_id=123');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleSSEEvent(data);
};
```

**백업**: 폴링 (10초 간격)

---

## 4. 보안

### 4.1 인증

**선택**: JWT (JSON Web Token)

**근거**:
- Stateless 인증
- 확장성 좋음
- localStorage 저장
- 자동 갱신 지원

**구현**:
```javascript
// Axios 인터셉터
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### 4.2 보안 헤더

**선택**: HTTPS + 기본 보안 헤더

**근거**:
- HTTPS: 전송 암호화
- Content-Security-Policy: XSS 방어
- X-Frame-Options: Clickjacking 방어

---

## 5. 에러 모니터링

### 5.1 에러 추적

**선택**: Sentry

**근거**:
- 실시간 에러 추적
- 스택 트레이스 수집
- 사용자 컨텍스트 수집
- 알림 설정 가능
- React 공식 지원

**통합**:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
});
```

---

## 6. 성능 최적화

### 6.1 코드 스플리팅

**선택**: React.lazy + Suspense

**근거**:
- 초기 번들 크기 감소
- 필요한 코드만 로드
- 로딩 상태 관리 쉬움

**구현**:
```javascript
const OrderDashboard = React.lazy(() => import('./OrderDashboard'));

<Suspense fallback={<Loader />}>
  <OrderDashboard />
</Suspense>
```

---

### 6.2 이미지 최적화

**선택**: WebP + Lazy Loading

**근거**:
- WebP: 파일 크기 30% 감소
- Lazy Loading: 초기 로딩 시간 단축

**구현**:
```javascript
<img src="menu.webp" loading="lazy" alt="메뉴" />
```

---

### 6.3 캐싱 전략

**선택**: React Query 캐싱

**근거**:
- 메뉴 데이터: 5분 staleTime
- 주문 데이터: SSE로 실시간 업데이트

**구현**:
```javascript
const { data: menus } = useQuery({
  queryKey: ['menus', storeId],
  queryFn: fetchMenus,
  staleTime: 5 * 60 * 1000, // 5분
});
```

---

## 7. 개발 환경

### 7.1 패키지 매니저

**선택**: npm 또는 yarn

**근거**:
- npm: Node.js 기본 제공
- yarn: 빠르고 안정적

---

### 7.2 버전 관리

**선택**: Git + GitHub

**근거**:
- 팀 협업
- 브랜치 전략 (feature/unit2-admin-frontend)
- Pull Request 리뷰

---

## 8. 배포

### 8.1 빌드

**선택**: Vite build

**근거**:
- 프로덕션 최적화
- Tree shaking
- Minification

**명령어**:
```bash
npm run build
```

---

### 8.2 환경 변수

**선택**: .env 파일

**근거**:
- 환경별 설정 분리
- API URL, Sentry DSN 등

**예시**:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_SENTRY_DSN=https://...
```

---

## 9. 기술 스택 요약

| 카테고리 | 기술 | 버전 |
|---------|------|------|
| 프레임워크 | React | 18+ |
| 상태 관리 | React Query + Context API | 4.x + 18.x |
| HTTP 클라이언트 | Axios | 1.x |
| UI 라이브러리 | Material-UI (MUI) | 5.x |
| 라우팅 | React Router | 6.x |
| 빌드 도구 | Vite | 4.x |
| 언어 | JavaScript (TypeScript 선택) | ES2020+ |
| 코드 품질 | ESLint + Prettier | Latest |
| 테스트 | Jest + React Testing Library | Latest |
| 실시간 통신 | EventSource (SSE) | Native API |
| 에러 모니터링 | Sentry | Latest |

---

## 10. 의존성 목록

### 핵심 의존성
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0",
    "@tanstack/react-query": "^4.29.0",
    "axios": "^1.4.0",
    "@mui/material": "^5.13.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0"
  }
}
```

### 개발 의존성
```json
{
  "devDependencies": {
    "vite": "^4.3.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.40.0",
    "prettier": "^2.8.8",
    "jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@sentry/react": "^7.54.0"
  }
}
```

---

## 11. 기술 스택 선택 근거 요약

1. **React 18+**: 컴포넌트 기반, 풍부한 생태계, 팀 숙련도
2. **React Query**: 서버 상태 관리 최적화, 캐싱, 재시도
3. **Axios**: 인터셉터, 에러 처리, 브라우저 호환성
4. **Material-UI**: 풍부한 컴포넌트, 일관된 디자인, 접근성
5. **Vite**: 빠른 개발 서버, 빠른 빌드
6. **Sentry**: 실시간 에러 추적, 알림
7. **EventSource**: 단방향 실시간 통신, 간단함

---

## 12. 향후 고려사항

### 12.1 TypeScript 마이그레이션
- 타입 안정성 향상
- IDE 지원 개선
- 유지보수성 향상

### 12.2 Storybook 도입
- 컴포넌트 문서화
- 독립적 개발 환경
- 디자인 시스템 구축

### 12.3 E2E 테스트
- Cypress 또는 Playwright
- 사용자 시나리오 테스트
- 회귀 테스트 자동화
