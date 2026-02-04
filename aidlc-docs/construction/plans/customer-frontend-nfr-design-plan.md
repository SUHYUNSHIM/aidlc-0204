# Customer Frontend - NFR Design 계획

## 유닛 컨텍스트
- **유닛 ID**: customer-frontend
- **기술**: React 18+, React Query, Context API, Axios, Vite
- **기능 설계**: 완료
- **NFR Requirements**: 완료

## 계획 개요
이 계획은 customer-frontend 유닛의 NFR 요구사항을 설계 패턴과 논리적 컴포넌트로 구체화합니다.

---

## 실행 단계

### Step 1: 복원력 패턴 (Resilience Patterns)
- [x] 에러 경계 (Error Boundary) 패턴 설계 ✅ COMPLETED
- [x] 재시도 로직 패턴 설계 (지수 백오프) ✅ COMPLETED
- [x] 폴백 UI 패턴 설계 ✅ COMPLETED
- [x] 오프라인 감지 및 복구 패턴 설계 ✅ COMPLETED

### Step 2: 성능 최적화 패턴 (Performance Patterns)
- [x] 코드 스플리팅 전략 설계 ✅ COMPLETED
- [x] 이미지 지연 로딩 패턴 설계 ✅ COMPLETED
- [x] React Query 캐싱 전략 설계 ✅ COMPLETED
- [x] 렌더링 최적화 패턴 설계 (useMemo, useCallback) ✅ COMPLETED

### Step 3: 보안 패턴 (Security Patterns)
- [x] 데이터 암호화 패턴 설계 (localStorage) ✅ COMPLETED
- [x] XSS 방어 패턴 설계 (CSP, 입력 살균) ✅ COMPLETED
- [x] API 요청 서명 패턴 설계 ✅ COMPLETED
- [x] 인증 토큰 관리 패턴 설계 ✅ COMPLETED

### Step 4: 상태 관리 패턴 (State Management Patterns)
- [x] 서버 상태 관리 패턴 설계 (React Query) ✅ COMPLETED
- [x] 로컬 상태 관리 패턴 설계 (Context API) ✅ COMPLETED
- [x] localStorage 동기화 패턴 설계 ✅ COMPLETED
- [x] 낙관적 업데이트 패턴 설계 ✅ COMPLETED

### Step 5: 사용성 패턴 (Usability Patterns)
- [x] 국제화 (i18n) 패턴 설계 ✅ COMPLETED
- [x] 접근성 (a11y) 패턴 설계 ✅ COMPLETED
- [x] 반응형 디자인 패턴 설계 ✅ COMPLETED
- [x] 터치 인터랙션 패턴 설계 ✅ COMPLETED

### Step 6: 모니터링 및 로깅 패턴 (Monitoring Patterns)
- [x] 에러 추적 패턴 설계 (Sentry) ✅ COMPLETED
- [x] 성능 모니터링 패턴 설계 (Web Vitals) ✅ COMPLETED
- [x] 사용자 분석 패턴 설계 (Google Analytics) ✅ COMPLETED
- [x] 로깅 전략 설계 ✅ COMPLETED

### Step 7: 논리적 컴포넌트 식별
- [x] 프론트엔드 논리적 컴포넌트 식별 ✅ COMPLETED
- [x] 유틸리티 모듈 식별 ✅ COMPLETED
- [x] 공통 훅 (Hooks) 식별 ✅ COMPLETED
- [x] 서비스 레이어 식별 ✅ COMPLETED

**계획 상태**: ✅ COMPLETED (2026-02-04T16:10:00+09:00)

---

## 명확화 질문

### 복원력 패턴

**Q1: 에러 경계 범위**
에러 경계를 어느 수준에서 적용해야 하나요?
- A) 앱 전체 (최상위 1개)
- B) 페이지별 (라우트별 에러 경계)
- C) 컴포넌트별 (주요 컴포넌트마다)
- D) 혼합 (최상위 + 주요 컴포넌트)

[Answer]: A

**Q2: 오프라인 복구 전략**
온라인 복구 시 어떤 동작을 수행해야 하나요?
- A) 자동 데이터 동기화 (React Query refetch)
- B) 사용자에게 알림 후 수동 새로고침
- C) 자동 동기화 + 토스트 알림
- D) 아무 동작 없음 (다음 요청 시 자동 처리)

[Answer]: A

### 성능 최적화 패턴

**Q3: 코드 스플리팅 전략**
어떤 수준에서 코드 스플리팅을 적용해야 하나요?
- A) 라우트별 분리 (페이지별)
- B) 라우트 + 주요 컴포넌트 분리
- C) 라우트 + 컴포넌트 + 라이브러리 분리
- D) 최소 분리 (초기 번들만)

[Answer]: C

**Q4: React Query 캐시 전략**
메뉴 데이터의 staleTime과 cacheTime을 어떻게 설정해야 하나요?
- A) staleTime: 5분, cacheTime: 10분 (표준)
- B) staleTime: 10분, cacheTime: 30분 (긴 캐시)
- C) staleTime: 1분, cacheTime: 5분 (짧은 캐시)
- D) staleTime: 0, cacheTime: 5분 (항상 최신)

[Answer]: A

**Q5: 이미지 최적화 전략**
이미지 최적화를 어떻게 구현해야 하나요?
- A) Intersection Observer + 지연 로딩
- B) Intersection Observer + 지연 로딩 + 플레이스홀더
- C) Intersection Observer + 지연 로딩 + 플레이스홀더 + WebP
- D) 네이티브 loading="lazy" 속성만 사용

[Answer]: B

### 보안 패턴

**Q6: localStorage 암호화 범위**
localStorage에 저장되는 어떤 데이터를 암호화해야 하나요?
- A) JWT 토큰만
- B) JWT 토큰 + 세션 데이터
- C) JWT 토큰 + 세션 데이터 + 장바구니
- D) 모든 데이터 (위 + 캐시 데이터)

[Answer]: B

**Q7: API 요청 서명 구현**
API 요청 서명을 어떻게 구현해야 하나요?
- A) 모든 요청에 서명 추가
- B) 중요 요청만 서명 (주문 제출, 로그인)
- C) POST/PUT/DELETE 요청만 서명
- D) 서명 없음 (JWT만 사용)

[Answer]: A

**Q8: CSP 정책 수준**
Content Security Policy를 어느 수준으로 설정해야 하나요?
- A) 엄격 (unsafe-inline 금지, nonce 사용)
- B) 표준 (unsafe-inline 허용, 도메인 제한)
- C) 느슨 (unsafe-inline 허용, 도메인 제한 없음)
- D) CSP 없음

[Answer]: B

### 상태 관리 패턴

**Q9: Context 분리 전략**
Context를 어떻게 분리해야 하나요?
- A) 단일 Context (모든 상태)
- B) 기능별 Context (Auth, Cart, UI)
- C) 기능별 + 세분화 (Auth, Cart, Toast, Modal)
- D) 최소 Context (Auth만, 나머지는 로컬 상태)

[Answer]: B

**Q10: localStorage 동기화 시점**
localStorage와 상태를 언제 동기화해야 하나요?
- A) 모든 상태 변경 시 즉시
- B) 디바운싱 (500ms 후)
- C) 중요 작업 후에만 (장바구니 추가, 주문 완료)
- D) 페이지 언로드 시에만

[Answer]: C

### 사용성 패턴

**Q11: 국제화 구현 방식**
다국어 지원을 어떻게 구현해야 하나요?
- A) react-i18next + JSON 번역 파일
- B) react-i18next + JSON + 동적 로딩
- C) react-i18next + JSON + 동적 로딩 + 네임스페이스
- D) 간단한 객체 기반 번역 (라이브러리 없음)

[Answer]: A

**Q12: 접근성 테스트 전략**
접근성을 어떻게 테스트해야 하나요?
- A) axe-core 자동 테스트만
- B) axe-core + 수동 키보드 테스트
- C) axe-core + 키보드 + 스크린 리더 테스트
- D) 테스트 없음 (시맨틱 HTML만 사용)

[Answer]: C

### 모니터링 패턴

**Q13: 에러 로깅 범위**
어떤 에러를 Sentry에 로깅해야 하나요?
- A) 모든 에러
- B) 치명적 에러만 (앱 중단)
- C) 치명적 + 네트워크 에러
- D) 치명적 + 네트워크 + 비즈니스 로직 에러

[Answer]: D

**Q14: 성능 메트릭 수집**
어떤 성능 메트릭을 수집해야 하나요?
- A) Core Web Vitals만 (FCP, LCP, CLS)
- B) Core Web Vitals + TTI
- C) Core Web Vitals + TTI + 커스텀 메트릭 (API 응답 시간)
- D) 메트릭 수집 없음

[Answer]: B

**Q15: 사용자 분석 범위**
어떤 사용자 행동을 추적해야 하나요?
- A) 페이지 뷰만
- B) 페이지 뷰 + 주요 이벤트 (주문 완료)
- C) 페이지 뷰 + 주요 이벤트 + 클릭 이벤트
- D) 모든 사용자 상호작용

[Answer]: C

---

## 다음 단계
모든 질문에 답변하고 모호함이 해결된 후, 다음을 생성합니다:
1. `nfr-design-patterns.md` - NFR 설계 패턴 문서
2. `logical-components.md` - 논리적 컴포넌트 문서
