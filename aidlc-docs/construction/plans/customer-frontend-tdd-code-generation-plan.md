# TDD Code Generation Plan for Customer Frontend

## 유닛 컨텍스트
- **Workspace Root**: `/Users/sunghyuckkim/python_pjt/AIDLC_workshop`
- **Project Type**: Greenfield
- **Stories**: US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008
- **Code Location**: `src/` (workspace root)
- **Test Location**: `tests/` (workspace root)

---

## Plan Step 0: Contract Skeleton Generation
- [x] 프로젝트 구조 생성 (Vite + React + TypeScript)
- [x] 모든 클래스/인터페이스 스켈레톤 생성
- [x] 모든 메서드는 `throw new Error('Not implemented')` 또는 빈 구현
- [x] 컴파일 확인

**생성할 파일**:
```
src/
├── utils/
│   ├── auth.ts
│   ├── encryption.ts
│   ├── retry.ts
│   ├── validation.ts
│   └── format.ts
├── services/
│   ├── cartService.ts
│   └── orderService.ts
├── api/
│   ├── menuService.ts
│   ├── orderService.ts
│   └── authService.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useMenus.ts
│   ├── useOrders.ts
│   ├── useCreateOrder.ts
│   ├── useOnlineStatus.ts
│   └── useAutoRedirect.ts
├── components/
│   ├── common/
│   │   ├── ErrorBoundary.tsx
│   │   └── LazyImage.tsx
│   └── pages/
│       ├── MenuBrowser.tsx
│       ├── Cart.tsx
│       ├── OrderConfirmation.tsx
│       ├── OrderHistory.tsx
│       └── CustomerLogin.tsx
├── transformers/
│   └── entityTransformers.ts
├── types/
│   └── entities.ts
├── lib/
│   ├── axios.ts
│   └── queryClient.ts
└── App.tsx

tests/
├── utils/
├── services/
├── api/
├── hooks/
├── components/
└── transformers/
```

---

## Plan Step 1: Utils Layer (TDD)

### 1.1 auth.ts - saveAuthToken() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-001 작성 (유효한 토큰 저장)
- [ ] GREEN: 최소 구현 (localStorage.setItem)
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 테스트 통과
- Story: US-001

### 1.2 auth.ts - getAuthToken() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-002 작성 (저장된 토큰 조회)
- [ ] GREEN: 최소 구현 (localStorage.getItem)
- [ ] RED: TC-CF-003 작성 (토큰 없을 때)
- [ ] GREEN: null 반환 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-001

### 1.3 auth.ts - validateSession() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-004 작성 (유효한 세션)
- [ ] GREEN: 최소 구현 (expiresAt 비교)
- [ ] RED: TC-CF-005 작성 (만료된 세션)
- [ ] GREEN: 만료 검증 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-001

### 1.4 auth.ts - autoLogin() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-006 작성 (자동 로그인 성공)
- [ ] GREEN: 최소 구현 (localStorage 조회 + 검증)
- [ ] RED: TC-CF-007 작성 (토큰 없음)
- [ ] GREEN: null 반환 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-001

### 1.5 auth.ts - manualLogin() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-008 작성 (수동 로그인 성공)
- [ ] GREEN: 최소 구현 (API 호출 + localStorage 저장)
- [ ] RED: TC-CF-009 작성 (잘못된 비밀번호)
- [ ] GREEN: 에러 처리 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-001

### 1.6 encryption.ts - encrypt() / decrypt() - RED-GREEN-REFACTOR
- [ ] RED: 암호화 테스트 작성
- [ ] GREEN: CryptoJS 사용하여 구현
- [ ] RED: 복호화 테스트 작성
- [ ] GREEN: 복호화 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-001

### 1.7 encryption.ts - secureStorage - RED-GREEN-REFACTOR
- [ ] RED: setItem 테스트 작성
- [ ] GREEN: 암호화 + localStorage 저장 구현
- [ ] RED: getItem 테스트 작성
- [ ] GREEN: localStorage 조회 + 복호화 구현
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-001

### 1.8 retry.ts - retryWithBackoff() - RED-GREEN-REFACTOR
- [ ] RED: 재시도 성공 테스트 작성
- [ ] GREEN: 최소 구현 (while 루프 + try-catch)
- [ ] RED: 최대 재시도 초과 테스트 작성
- [ ] GREEN: 최대 재시도 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-002

### 1.9 validation.ts - validateMenuItem() - RED-GREEN-REFACTOR
- [ ] RED: 유효한 MenuItem 테스트 작성
- [ ] GREEN: 최소 구현 (필드 검증)
- [ ] RED: 유효하지 않은 MenuItem 테스트 작성
- [ ] GREEN: 검증 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-002

### 1.10 validation.ts - validateCartItem() - RED-GREEN-REFACTOR
- [ ] RED: 유효한 CartItem 테스트 작성
- [ ] GREEN: 최소 구현 (수량 범위 검증)
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 테스트 통과
- Story: US-004

### 1.11 format.ts - formatCurrency() - RED-GREEN-REFACTOR
- [ ] RED: 금액 포맷 테스트 작성
- [ ] GREEN: 최소 구현 (toLocaleString)
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 테스트 통과
- Story: US-005

---

## Plan Step 2: Services Layer (TDD)

### 2.1 cartService.ts - addToCartLogic() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-010 작성 (새 메뉴 추가)
- [ ] GREEN: 최소 구현 (items 배열에 추가)
- [ ] RED: TC-CF-011 작성 (기존 메뉴 수량 증가)
- [ ] GREEN: 중복 체크 + 수량 증가 로직 추가
- [ ] RED: TC-CF-012 작성 (품절 메뉴)
- [ ] GREEN: isAvailable 검증 로직 추가
- [ ] RED: TC-CF-013 작성 (최대 수량 초과)
- [ ] GREEN: 최대 수량 검증 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-004

### 2.2 cartService.ts - updateQuantityLogic() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-014 작성 (수량 증가)
- [ ] GREEN: 최소 구현 (quantity += delta)
- [ ] RED: TC-CF-015 작성 (수량 감소)
- [ ] GREEN: 수량 감소 로직 추가
- [ ] RED: TC-CF-016 작성 (수량 0으로 감소 시 제거)
- [ ] GREEN: 항목 제거 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-005

### 2.3 cartService.ts - removeFromCartLogic() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-017 작성 (항목 제거)
- [ ] GREEN: 최소 구현 (filter)
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 테스트 통과
- Story: US-005

### 2.4 cartService.ts - calculateCartTotals() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-018 작성 (총액 계산)
- [ ] GREEN: 최소 구현 (reduce)
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 테스트 통과
- Story: US-005

### 2.5 cartService.ts - saveCartToLocalStorage() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-019 작성 (장바구니 저장)
- [ ] GREEN: 최소 구현 (JSON.stringify + localStorage.setItem)
- [ ] RED: TC-CF-020 작성 (용량 초과)
- [ ] GREEN: QuotaExceededError 처리 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-006

### 2.6 cartService.ts - loadCartFromLocalStorage() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-021 작성 (장바구니 복원)
- [ ] GREEN: 최소 구현 (localStorage.getItem + JSON.parse)
- [ ] RED: TC-CF-022 작성 (장바구니 없을 때)
- [ ] GREEN: null 반환 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-006

### 2.7 orderService.ts - validateOrderSubmission() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-023 작성 (유효한 주문)
- [ ] GREEN: 최소 구현 (장바구니 비어있지 않음 + 세션 유효)
- [ ] RED: TC-CF-024 작성 (빈 장바구니)
- [ ] GREEN: 빈 장바구니 검증 로직 추가
- [ ] RED: TC-CF-025 작성 (만료된 세션)
- [ ] GREEN: 세션 검증 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-007

### 2.8 orderService.ts - prepareOrderItems() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-026 작성 (현재 가격 사용)
- [ ] GREEN: 최소 구현 (cartItem → OrderItem 변환)
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 테스트 통과
- Story: US-007

---

## Plan Step 3: API Layer (TDD)

### 3.1 menuService.ts - fetchMenus() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-027 작성 (메뉴 조회 성공)
- [ ] GREEN: 최소 구현 (axios.get)
- [ ] RED: TC-CF-028 작성 (네트워크 에러)
- [ ] GREEN: 에러 처리 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-002

### 3.2 orderService.ts (API) - createOrder() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-029 작성 (주문 생성 성공)
- [ ] GREEN: 최소 구현 (axios.post)
- [ ] RED: TC-CF-030 작성 (인증 에러)
- [ ] GREEN: 401 에러 처리 로직 추가
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 모든 테스트 통과
- Story: US-007

### 3.3 orderService.ts (API) - fetchOrders() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-031 작성 (주문 내역 조회)
- [ ] GREEN: 최소 구현 (axios.get)
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 테스트 통과
- Story: US-008

---

## Plan Step 4: Hooks Layer (TDD)

### 4.1 useCart.ts - RED-GREEN-REFACTOR
- [x] RED: TC-CF-032 작성 (localStorage 복원)
- [x] GREEN: 최소 구현 (useState 초기화 + loadCartFromLocalStorage)
- [x] RED: TC-CF-033 작성 (addToCart 호출)
- [x] GREEN: addToCart 함수 구현 + localStorage 동기화
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 모든 테스트 통과
- Story: US-004, US-006
- **Note**: Option B (전체 구현) 방식으로 완료

### 4.2 useMenus.ts - RED-GREEN-REFACTOR
- [x] RED: TC-CF-034 작성 (메뉴 조회 + 캐싱)
- [x] GREEN: 최소 구현 (useQuery + fetchMenus)
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 테스트 통과
- Story: US-002
- **Note**: Option B (전체 구현) 방식으로 완료

### 4.3 useCreateOrder.ts - RED-GREEN-REFACTOR
- [x] RED: TC-CF-035 작성 (주문 생성 mutation)
- [x] GREEN: 최소 구현 (useMutation + createOrder)
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 테스트 통과
- Story: US-007
- **Note**: Option B (전체 구현) 방식으로 완료

### 4.4 useOnlineStatus.ts - RED-GREEN-REFACTOR
- [x] RED: TC-CF-036 작성 (온라인 상태 감지)
- [x] GREEN: 최소 구현 (navigator.onLine)
- [x] RED: TC-CF-037 작성 (오프라인 → 온라인 복구)
- [x] GREEN: 이벤트 리스너 + refetch 로직 추가
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 모든 테스트 통과
- Story: US-002
- **Note**: Option B (전체 구현) 방식으로 완료

### 4.5 useAutoRedirect.ts - RED-GREEN-REFACTOR
- [x] RED: TC-CF-038 작성 (5초 후 리다이렉트)
- [x] GREEN: 최소 구현 (useEffect + setTimeout + navigate)
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 테스트 통과
- Story: US-007
- **Note**: Option B (전체 구현) 방식으로 완료

---

## Plan Step 5: Components Layer (TDD)

### 5.1 ErrorBoundary.tsx - RED-GREEN-REFACTOR
- [x] RED: TC-CF-039 작성 (에러 캐치 + 폴백 UI)
- [x] GREEN: 최소 구현 (getDerivedStateFromError + componentDidCatch)
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 테스트 통과
- Story: US-002
- **Note**: Option B (전체 구현) 방식으로 완료

### 5.2 LazyImage.tsx - RED-GREEN-REFACTOR
- [x] RED: TC-CF-040 작성 (이미지 지연 로딩)
- [x] GREEN: 최소 구현 (IntersectionObserver)
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 테스트 통과
- Story: US-003
- **Note**: Option B (전체 구현) 방식으로 완료

### 5.3 MenuBrowser.tsx - RED-GREEN-REFACTOR
- [x] RED: TC-CF-041 작성 (메뉴 목록 표시)
- [x] GREEN: 최소 구현 (useMenus + map)
- [x] RED: TC-CF-042 작성 (카테고리 필터링)
- [x] GREEN: 필터링 로직 추가
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 모든 테스트 통과
- Story: US-002
- **Note**: Option B (전체 구현) 방식으로 완료

### 5.4 Cart.tsx - RED-GREEN-REFACTOR
- [x] RED: TC-CF-043 작성 (장바구니 항목 표시)
- [x] GREEN: 최소 구현 (useCart + map)
- [x] RED: TC-CF-044 작성 (주문 제출)
- [x] GREEN: 주문 제출 로직 추가
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 모든 테스트 통과
- Story: US-005, US-007
- **Note**: Option B (전체 구현) 방식으로 완료

### 5.5 OrderConfirmation.tsx - RED-GREEN-REFACTOR
- [x] RED: TC-CF-045 작성 (주문 상세 표시)
- [x] GREEN: 최소 구현 (주문 정보 렌더링)
- [x] RED: TC-CF-046 작성 (5초 후 리다이렉트)
- [x] GREEN: useAutoRedirect 훅 사용
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 모든 테스트 통과
- Story: US-007
- **Note**: Option B (전체 구현) 방식으로 완료

### 5.6 OrderHistory.tsx - RED-GREEN-REFACTOR
- [x] RED: TC-CF-047 작성 (주문 내역 표시)
- [x] GREEN: 최소 구현 (useOrders + map)
- [x] RED: TC-CF-048 작성 (5분마다 폴링)
- [x] GREEN: refetchInterval 설정
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 모든 테스트 통과
- Story: US-008
- **Note**: Option B (전체 구현) 방식으로 완료

### 5.7 CustomerLogin.tsx - RED-GREEN-REFACTOR
- [x] RED: TC-CF-049 작성 (수동 로그인 폼)
- [x] GREEN: 최소 구현 (폼 + manualLogin 호출)
- [x] RED: TC-CF-050 작성 (자동 로그인)
- [x] GREEN: useEffect + autoLogin 호출
- [x] REFACTOR: 코드 개선
- [x] VERIFY: 모든 테스트 통과
- Story: US-001
- **Note**: Option B (전체 구현) 방식으로 완료

---

## Plan Step 6: Transformers Layer (TDD)

### 6.1 entityTransformers.ts - menuItemToCartItem() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-051 작성 (MenuItem → CartItem 변환)
- [ ] GREEN: 최소 구현 (객체 변환)
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 테스트 통과
- Story: US-004

### 6.2 entityTransformers.ts - cartItemToOrderItem() - RED-GREEN-REFACTOR
- [ ] RED: TC-CF-052 작성 (CartItem → OrderItem 변환)
- [ ] GREEN: 최소 구현 (현재 가격 사용)
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 테스트 통과
- Story: US-007

---

## Plan Step 7: Additional Artifacts

### 7.1 프로젝트 설정 파일
- [ ] package.json 생성 (dependencies: react, react-dom, react-router-dom, @tanstack/react-query, axios, crypto-js, date-fns)
- [ ] tsconfig.json 생성
- [ ] vite.config.ts 생성 (코드 스플리팅 설정)
- [ ] .env.example 생성

### 7.2 타입 정의
- [ ] src/types/entities.ts 생성 (MenuItem, CartItem, Cart, Order, CustomerSession 등)

### 7.3 라이브러리 설정
- [ ] src/lib/axios.ts 생성 (axios 인스턴스 + 인터셉터)
- [ ] src/lib/queryClient.ts 생성 (React Query 설정)

### 7.4 Context Providers
- [ ] src/contexts/AuthContext.tsx 생성
- [ ] src/contexts/CartContext.tsx 생성
- [ ] src/contexts/UIContext.tsx 생성

### 7.5 App.tsx 및 라우팅
- [ ] src/App.tsx 생성 (Provider 계층 + 라우팅)
- [ ] src/main.tsx 생성 (엔트리 포인트)

### 7.6 스타일
- [ ] src/styles/global.css 생성
- [ ] src/styles/responsive.css 생성

### 7.7 문서화
- [ ] README.md 생성 (프로젝트 설명, 설치 방법, 실행 방법)
- [ ] aidlc-docs/construction/customer-frontend/code/implementation-summary.md 생성

---

## 총 Step 수
- **Step 0**: 1개 (Contract Skeleton)
- **Step 1**: 11개 (Utils Layer)
- **Step 2**: 8개 (Services Layer)
- **Step 3**: 3개 (API Layer)
- **Step 4**: 5개 (Hooks Layer)
- **Step 5**: 7개 (Components Layer)
- **Step 6**: 2개 (Transformers Layer)
- **Step 7**: 7개 (Additional Artifacts)

**총 계**: 44개 Step

---

## Story 매핑
- **US-001** (테이블 로그인): Step 1.1 ~ 1.7, Step 5.7
- **US-002** (메뉴 조회): Step 1.8, 1.9, Step 3.1, Step 4.2, 4.4, Step 5.1, 5.3
- **US-003** (메뉴 상세): Step 5.2
- **US-004** (장바구니 추가): Step 1.10, Step 2.1, Step 4.1, Step 6.1
- **US-005** (장바구니 관리): Step 1.11, Step 2.2 ~ 2.4, Step 5.4
- **US-006** (장바구니 지속성): Step 2.5, 2.6, Step 4.1
- **US-007** (주문 생성): Step 2.7, 2.8, Step 3.2, Step 4.3, 4.5, Step 5.4, 5.5, Step 6.2
- **US-008** (주문 내역): Step 3.3, Step 5.6

---

## 예상 소요 시간
- **Step 0**: 30분 (프로젝트 구조 + 스켈레톤)
- **Step 1 ~ 6**: 각 Step당 15~30분 (TDD 사이클)
- **Step 7**: 1시간 (설정 파일 + 문서화)

**총 예상 시간**: 약 15~20시간 (TDD 방식)

---

## 중요 참고사항
- 각 Step은 RED-GREEN-REFACTOR 사이클을 완전히 완료한 후 다음 Step으로 진행
- 테스트가 실패하면 즉시 중단하고 원인 파악
- 모든 테스트가 통과해야만 다음 Step 진행
- Refactor 단계에서도 테스트가 계속 통과해야 함
- 각 Step 완료 시 test-plan.md 상태 업데이트 (⬜ → 🟢)
