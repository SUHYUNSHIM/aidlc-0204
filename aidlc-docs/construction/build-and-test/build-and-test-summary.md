# Build and Test Summary - Customer Frontend

## 개요
Customer Frontend 유닛의 빌드 및 테스트 지침을 제공합니다.

---

## 📋 문서 목록

### 1. Build Instructions
**파일**: `build-instructions.md`

**내용**:
- 의존성 설치 방법
- 환경 변수 설정
- 개발 서버 실행
- 프로덕션 빌드
- 빌드 문제 해결
- 배포 준비

**주요 명령어**:
```bash
npm install              # 의존성 설치
npm run dev             # 개발 서버 실행
npm run build           # 프로덕션 빌드
npm run preview         # 빌드 미리보기
npx tsc --noEmit        # 타입 체크
```

---

### 2. Unit Test Instructions
**파일**: `unit-test-instructions.md`

**내용**:
- 테스트 환경 설정 (Vitest + React Testing Library)
- Utils Layer 테스트 (encryption, validation, retry)
- Services Layer 테스트 (cartService, orderService)
- Hooks 테스트 (useOnlineStatus)
- Components 테스트 (LazyImage)
- 테스트 실행 방법

**주요 명령어**:
```bash
npm run test            # 모든 테스트 실행
npm run test:watch      # Watch 모드
npm run test:coverage   # 커버리지 리포트
```

**예상 테스트 수**: 52개
**예상 커버리지**: 80% 이상

---

### 3. Integration Test Instructions
**파일**: `integration-test-instructions.md`

**내용**:
- 통합 테스트 시나리오
  - 로그인 → 메뉴 조회 플로우
  - 메뉴 추가 → 장바구니 → 주문 플로우
  - 오프라인 → 온라인 복구 플로우
- E2E 테스트 (Playwright)
- 통합 테스트 실행 방법

**주요 명령어**:
```bash
npm run test -- --run integration  # 통합 테스트만 실행
npx playwright test                # E2E 테스트 실행
```

---

## 🚀 빠른 시작 가이드

### Step 1: 의존성 설치
```bash
npm install
```

### Step 2: 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 열고 필요한 값 설정
```

### Step 3: 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:5173/` 접속

### Step 4: 빌드 테스트
```bash
npm run build
npm run preview
```

### Step 5: 테스트 실행 (선택 사항)
```bash
# 테스트 의존성 설치
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# 테스트 실행
npm run test
```

---

## ✅ 체크리스트

### 빌드 체크리스트
- [ ] Node.js 18+ 설치 확인
- [ ] `npm install` 성공
- [ ] `.env` 파일 설정 완료
- [ ] `npm run dev` 실행 성공
- [ ] 브라우저에서 앱 로딩 확인
- [ ] `npm run build` 성공
- [ ] `dist/` 디렉토리 생성 확인
- [ ] `npm run preview` 실행 성공
- [ ] `npx tsc --noEmit` 에러 없음

### 테스트 체크리스트 (선택 사항)
- [ ] 테스트 의존성 설치 완료
- [ ] `vitest.config.ts` 설정 완료
- [ ] `src/tests/setup.ts` 설정 완료
- [ ] 단위 테스트 작성 완료
- [ ] `npm run test` 실행 성공
- [ ] 모든 테스트 통과 (52/52)
- [ ] 커버리지 80% 이상
- [ ] 통합 테스트 작성 완료 (선택)
- [ ] E2E 테스트 작성 완료 (선택)

---

## 🔧 문제 해결

### 빌드 실패 시
1. `node_modules` 삭제 후 재설치
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Vite 캐시 삭제
   ```bash
   rm -rf node_modules/.vite
   ```

3. TypeScript 에러 확인
   ```bash
   npx tsc --noEmit
   ```

### 테스트 실패 시
1. 테스트 의존성 재설치
   ```bash
   npm install -D vitest @vitest/ui jsdom @testing-library/react
   ```

2. 테스트 캐시 삭제
   ```bash
   npx vitest run --clearCache
   ```

3. 개별 테스트 실행
   ```bash
   npm run test -- src/tests/utils/validation.test.ts
   ```

---

## 📊 예상 결과

### 빌드 성공 시
```
✓ xxx modules transformed.
dist/index.html                  x.xx kB
dist/assets/index-xxxxx.css      x.xx kB │ gzip: x.xx kB
dist/assets/index-xxxxx.js     xxx.xx kB │ gzip: xx.xx kB
✓ built in x.xxs
```

### 테스트 성공 시
```
Test Files  15 passed (15)
     Tests  52 passed (52)
  Start at  17:30:00
  Duration  2.5s

 % Coverage report from v8
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   85.2  |   78.5   |   90.1  |   85.2  |
```

---

## 🎯 다음 단계

### 빌드 완료 후
1. **로컬 테스트**: 개발 서버에서 모든 기능 수동 테스트
2. **성능 최적화**: Lighthouse 실행, Core Web Vitals 확인
3. **브라우저 호환성**: 다양한 브라우저에서 테스트
4. **배포 준비**: 프로덕션 환경 변수 설정

### 테스트 완료 후
1. **커버리지 개선**: 80% 미만인 영역 테스트 추가
2. **통합 테스트**: 주요 사용자 플로우 테스트 추가
3. **E2E 테스트**: Playwright로 전체 시나리오 테스트
4. **CI/CD 설정**: GitHub Actions 등으로 자동화

---

## 📚 참고 자료

### 공식 문서
- [Vite 문서](https://vitejs.dev/)
- [Vitest 문서](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright 문서](https://playwright.dev/)

### 프로젝트 문서
- `aidlc-docs/construction/customer-frontend/code/implementation-summary.md` - 구현 완료 요약
- `aidlc-docs/construction/plans/customer-frontend-contracts.md` - Contract 정의
- `aidlc-docs/construction/plans/customer-frontend-test-plan.md` - 테스트 계획

---

**작성일**: 2026-02-04
**작성자**: AI-DLC System
**상태**: ✅ 완료
