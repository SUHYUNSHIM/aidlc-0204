# Customer Frontend - 기술 스택 결정

## 개요
이 문서는 customer-frontend 유닛의 기술 스택 선택과 그 근거를 설명합니다.

---

## 1. 프론트엔드 프레임워크

### React 18+

**선택**: React 18.2 이상

**근거**:
1. **동시성 기능 (Concurrent Features)**:
   - Automatic Batching: 여러 상태 업데이트를 자동으로 배칭하여 렌더링 최적화
   - Transitions: 긴급하지 않은 업데이트를 백그라운드에서 처리
   - Suspense: 비동기 데이터 로딩 시 로딩 상태 관리 개선

2. **성능 향상**:
   - 자동 배칭으로 불필요한 렌더링 감소
   - 더 나은 서버 사이드 렌더링 (SSR) 지원 (향후 확장 가능)

3. **생태계 성숙도**:
   - 풍부한 라이브러리 및 도구
   - 대규모 커뮤니티 지원
   - 풍부한 학습 자료

4. **팀 역량**:
   - React 경험이 있는 개발자 확보 용이
   - 빠른 개발 속도

**대안 고려**:
- Vue 3: 더 간단한 학습 곡선, 하지만 생태계가 React보다 작음
- Svelte: 더 작은 번들 크기, 하지만 생태계가 미성숙
- Angular: 엔터프라이즈급 기능, 하지만 학습 곡선이 가파름

**결론**: React 18+가 성능, 생태계, 팀 역량 측면에서 최적

---

## 2. 상태 관리

### React Query + Context API

**선택**: 
- **서버 상태**: React Query (TanStack Query) v4
- **로컬 상태**: Context API + useReducer

**근거**:

#### React Query (서버 상태)
1. **서버 상태 관리 특화**:
   - 자동 캐싱 및 무효화
   - 백그라운드 데이터 동기화
   - 낙관적 업데이트 지원

2. **성능 최적화**:
   - 중복 요청 자동 제거
   - stale-while-revalidate 전략
   - 자동 가비지 컬렉션

3. **개발자 경험**:
   - 간단한 API
   - DevTools 제공
   - TypeScript 지원

4. **사용 사례**:
   - 메뉴 데이터 조회 및 캐싱
   - 주문 내역 조회
   - 주문 제출 (mutation)

#### Context API (로컬 상태)
1. **간단한 전역 상태 관리**:
   - React 내장 기능 (추가 라이브러리 불필요)
   - 컴포넌트 트리 전체에서 상태 공유

2. **사용 사례**:
   - 장바구니 상태 (CartContext)
   - 인증 상태 (AuthContext)
   - UI 상태 (모달, 토스트)

3. **성능 고려**:
   - useReducer로 복잡한 상태 로직 관리
   - useMemo/useCallback로 불필요한 렌더링 방지
   - Context 분리로 렌더링 최적화

**대안 고려**:
- Redux: 더 강력한 상태 관리, 하지만 보일러플레이트 많음
- Zustand: 더 간단한 API, 하지만 서버 상태 관리 부족
- Recoil: 원자적 상태 관리, 하지만 아직 실험적

**결론**: React Query + Context API 조합이 이 프로젝트에 최적

---

## 3. HTTP 클라이언트

### Axios

**선택**: Axios v1.x

**근거**:
1. **인터셉터 (Interceptors)**:
   - 요청/응답 전역 처리
   - JWT 토큰 자동 추가
   - 에러 처리 중앙화

2. **요청/응답 변환**:
   - 자동 JSON 변환
   - 요청 데이터 변환
   - 응답 데이터 변환

3. **타임아웃 및 취소**:
   - 요청 타임아웃 설정
   - 요청 취소 (AbortController)

4. **브라우저 호환성**:
   - 구형 브라우저 지원 (필요 시)
   - XSRF 보호 내장

**Axios 설정 예시**:
```typescript
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customer_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 에러 처리
      logout();
    }
    return Promise.reject(error);
  }
);
```

**대안 고려**:
- Fetch API: 네이티브, 가벼움, 하지만 인터셉터 없음
- React Query fetch: 간단, 하지만 고급 기능 부족

**결론**: Axios가 인터셉터 및 에러 처리 측면에서 최적

---

## 4. 라우팅

### React Router v6

**선택**: React Router v6.x

**근거**:
1. **선언적 라우팅**:
   - JSX 기반 라우트 정의
   - 중첩 라우트 지원
   - 동적 라우트 매칭

2. **코드 스플리팅**:
   - React.lazy와 통합
   - 라우트별 번들 분리

3. **네비게이션 가드**:
   - 인증 체크
   - 권한 체크

4. **생태계**:
   - React 표준 라우팅 라이브러리
   - 풍부한 문서 및 예제

**라우트 구조**:
```typescript
<Routes>
  <Route path="/" element={<CustomerApp />}>
    <Route index element={<MenuBrowser />} />
    <Route path="cart" element={<Cart />} />
    <Route path="order-confirmation" element={<OrderConfirmation />} />
    <Route path="order-history" element={<OrderHistory />} />
  </Route>
  <Route path="/login" element={<CustomerLogin />} />
</Routes>
```

**대안 고려**:
- TanStack Router: 더 타입 안전, 하지만 새로운 라이브러리
- Reach Router: 더 간단, 하지만 React Router에 통합됨

**결론**: React Router v6가 표준이며 충분한 기능 제공

---

## 5. 빌드 도구

### Vite

**선택**: Vite v4.x

**근거**:
1. **빠른 개발 서버**:
   - ESM 기반 즉시 시작
   - HMR (Hot Module Replacement) 빠름
   - 개발 경험 향상

2. **빠른 빌드**:
   - Rollup 기반 프로덕션 빌드
   - 최적화된 번들링
   - Tree-shaking 자동

3. **플러그인 생태계**:
   - React 플러그인 공식 지원
   - TypeScript 기본 지원
   - CSS 전처리기 지원

4. **설정 간소화**:
   - 최소한의 설정
   - 합리적인 기본값
   - 확장 가능

**Vite 설정 예시**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          axios: ['axios']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
```

**대안 고려**:
- Create React App (CRA): 더 성숙, 하지만 느림
- Webpack: 더 강력한 설정, 하지만 복잡함

**결론**: Vite가 개발 속도 및 빌드 성능 측면에서 최적

---

## 6. 스타일링

### CSS Modules + Tailwind CSS (선택적)

**선택**: 
- **기본**: CSS Modules
- **유틸리티**: Tailwind CSS (선택적)

**근거**:

#### CSS Modules
1. **스코프 격리**:
   - 클래스명 충돌 방지
   - 컴포넌트별 스타일 캡슐화

2. **성능**:
   - 빌드 시 최적화
   - 사용하지 않는 스타일 제거

3. **간단한 사용**:
   - 추가 라이브러리 불필요
   - Vite 기본 지원

#### Tailwind CSS (선택적)
1. **빠른 개발**:
   - 유틸리티 클래스로 빠른 스타일링
   - 일관된 디자인 시스템

2. **작은 번들 크기**:
   - PurgeCSS로 사용하지 않는 스타일 제거
   - 프로덕션 빌드 최적화

3. **반응형 디자인**:
   - 모바일 퍼스트
   - 간단한 브레이크포인트

**사용 전략**:
- 레이아웃: Tailwind CSS
- 컴포넌트 스타일: CSS Modules
- 애니메이션: CSS Modules

**대안 고려**:
- Styled Components: CSS-in-JS, 하지만 런타임 오버헤드
- Emotion: CSS-in-JS, 하지만 번들 크기 증가
- Sass: 전처리기, 하지만 CSS Modules로 충분

**결론**: CSS Modules + Tailwind CSS 조합이 유연하고 성능 좋음

---

## 7. 테스트

### Jest + React Testing Library + Playwright

**선택**:
- **단위/통합 테스트**: Jest + React Testing Library
- **E2E 테스트**: Playwright

**근거**:

#### Jest + React Testing Library
1. **React 표준 테스트 도구**:
   - React 컴포넌트 테스트 특화
   - 사용자 중심 테스트 (접근성 고려)

2. **빠른 실행**:
   - 병렬 실행
   - 스냅샷 테스트

3. **풍부한 매처**:
   - 다양한 assertion
   - 커스텀 매처 지원

#### Playwright
1. **크로스 브라우저 테스트**:
   - Chrome, Safari, Edge 지원
   - 실제 브라우저 환경

2. **강력한 API**:
   - 자동 대기
   - 네트워크 인터셉트
   - 스크린샷/비디오 녹화

3. **빠른 실행**:
   - 병렬 실행
   - 헤드리스 모드

**테스트 전략**:
```typescript
// 단위 테스트 (Jest + RTL)
describe('Cart Component', () => {
  it('should add item to cart', () => {
    render(<Cart />);
    const addButton = screen.getByRole('button', { name: /추가/i });
    fireEvent.click(addButton);
    expect(screen.getByText(/1개/i)).toBeInTheDocument();
  });
});

// E2E 테스트 (Playwright)
test('customer can place order', async ({ page }) => {
  await page.goto('/');
  await page.click('text=메뉴 추가');
  await page.click('text=주문하기');
  await expect(page).toHaveURL('/order-confirmation');
});
```

**대안 고려**:
- Cypress: 더 간단한 API, 하지만 크로스 브라우저 지원 제한
- Vitest: 더 빠른 단위 테스트, 하지만 생태계 미성숙

**결론**: Jest + RTL + Playwright 조합이 포괄적인 테스트 커버리지 제공

---

## 8. 유틸리티 라이브러리

### 선택된 라이브러리

#### crypto-js
**용도**: 데이터 암호화 (localStorage)

**근거**:
- AES-256 암호화 지원
- 간단한 API
- 작은 번들 크기

#### date-fns
**용도**: 날짜/시간 처리

**근거**:
- 모듈화된 구조 (트리 쉐이킹 가능)
- 불변성 (immutable)
- 작은 번들 크기 (Moment.js 대비)

#### react-i18next
**용도**: 국제화 (i18n)

**근거**:
- React 통합 우수
- 동적 언어 전환
- 네임스페이스 지원

#### react-error-boundary
**용도**: 에러 경계

**근거**:
- 선언적 에러 처리
- 폴백 UI 지원
- 에러 로깅 통합

---

## 9. 개발 도구

### 선택된 도구

#### TypeScript
**버전**: v5.x

**근거**:
- 타입 안전성
- 더 나은 IDE 지원
- 리팩토링 용이

#### ESLint + Prettier
**용도**: 코드 품질 및 포맷팅

**근거**:
- 일관된 코드 스타일
- 버그 조기 발견
- 팀 협업 향상

#### Husky + lint-staged
**용도**: Git 훅

**근거**:
- 커밋 전 자동 린트
- 코드 품질 보장
- CI/CD 부담 감소

---

## 10. 모니터링 및 로깅

### 선택된 도구

#### Sentry
**용도**: 에러 추적

**근거**:
- 실시간 에러 알림
- 스택 트레이스 제공
- 사용자 컨텍스트 추적

#### Google Analytics
**용도**: 사용자 분석

**근거**:
- 무료
- 풍부한 기능
- 대시보드 제공

#### Web Vitals
**용도**: 성능 모니터링

**근거**:
- Core Web Vitals 추적
- Google 표준
- 간단한 통합

---

## 기술 스택 요약

| 카테고리 | 기술 | 버전 | 근거 |
|---------|------|------|------|
| 프레임워크 | React | 18.2+ | 동시성 기능, 생태계 |
| 상태 관리 (서버) | React Query | 4.x | 서버 상태 특화 |
| 상태 관리 (로컬) | Context API | - | 간단한 전역 상태 |
| HTTP 클라이언트 | Axios | 1.x | 인터셉터, 에러 처리 |
| 라우팅 | React Router | 6.x | 표준, 코드 스플리팅 |
| 빌드 도구 | Vite | 4.x | 빠른 개발, 빌드 |
| 스타일링 | CSS Modules + Tailwind | - | 스코프 격리, 유틸리티 |
| 단위 테스트 | Jest + RTL | - | React 표준 |
| E2E 테스트 | Playwright | - | 크로스 브라우저 |
| 암호화 | crypto-js | - | AES-256 |
| 날짜 처리 | date-fns | - | 작은 번들 크기 |
| 국제화 | react-i18next | - | React 통합 |
| 에러 경계 | react-error-boundary | - | 선언적 에러 처리 |
| 타입 시스템 | TypeScript | 5.x | 타입 안전성 |
| 린트 | ESLint + Prettier | - | 코드 품질 |
| Git 훅 | Husky + lint-staged | - | 커밋 전 검증 |
| 에러 추적 | Sentry | - | 실시간 알림 |
| 분석 | Google Analytics | - | 사용자 행동 추적 |
| 성능 모니터링 | Web Vitals | - | Core Web Vitals |

**총 기술 스택**: 19개 주요 기술

---

## 의존성 관리

### package.json 주요 의존성

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^4.36.0",
    "axios": "^1.6.0",
    "crypto-js": "^4.2.0",
    "date-fns": "^2.30.0",
    "react-i18next": "^13.5.0",
    "i18next": "^23.7.0",
    "react-error-boundary": "^4.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@playwright/test": "^1.40.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.2.0",
    "@sentry/react": "^7.91.0",
    "web-vitals": "^3.5.0"
  }
}
```

### 번들 크기 예상

- **초기 번들 (gzipped)**:
  - React + React DOM: ~45KB
  - React Router: ~10KB
  - React Query: ~15KB
  - Axios: ~15KB
  - 앱 코드: ~100KB
  - **총**: ~185KB ✅ (목표: < 200KB)

- **전체 번들 (gzipped)**:
  - 초기 번들: ~185KB
  - 추가 청크: ~100KB
  - **총**: ~285KB ✅ (목표: < 300KB)

---

## 결론

선택된 기술 스택은 다음 기준을 충족합니다:

1. ✅ **성능**: 빠른 로드 시간 및 반응성
2. ✅ **확장성**: 10-50개 태블릿 동시 지원
3. ✅ **개발 속도**: 빠른 개발 및 배포
4. ✅ **유지보수성**: 명확한 코드 구조 및 테스트
5. ✅ **보안**: 암호화, XSS 방어, API 보안
6. ✅ **사용성**: 접근성, 반응형, 국제화

이 기술 스택은 MVP 개발에 최적화되어 있으며, 향후 확장 가능성도 고려되었습니다.
