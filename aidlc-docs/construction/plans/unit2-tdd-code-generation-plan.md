# TDD Code Generation Plan for Unit 2: Admin Frontend

## Unit Context
- **Workspace Root**: /Users/sunghyuckkim/python_pjt/AIDLC_workshop
- **Project Type**: Greenfield
- **Stories**: US-009 ~ US-022 (14개 스토리)
- **Code Location**: /Users/sunghyuckkim/python_pjt/AIDLC_workshop/frontend/
- **Test Location**: /Users/sunghyuckkim/python_pjt/AIDLC_workshop/frontend/src/__tests__/

---

## Plan Step 0: 프로젝트 구조 및 Contract Skeleton 생성
- [ ] 프로젝트 초기화 (Vite + React)
- [ ] 디렉토리 구조 생성
- [ ] 의존성 설치 (package.json)
- [ ] 환경 설정 파일 (.env, vite.config.js)
- [ ] Contract skeleton 생성 (모든 함수/컴포넌트 stub)
- [ ] 컴파일 확인

---

## Plan Step 1: Utility Functions (TDD)

### 1.1 groupOrdersByTable() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-039 테스트 작성 (주문 그룹화)
- [ ] GREEN: 최소 구현
- [ ] REFACTOR: 코드 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-010

### 1.2 groupOrdersByTable() - 최신 3개 추출 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-040 테스트 작성
- [ ] GREEN: latestOrders 로직 추가
- [ ] REFACTOR: 정렬 로직 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-010

### 1.3 encodeImageToBase64() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-041 테스트 작성 (이미지 인코딩 성공)
- [ ] GREEN: FileReader 구현
- [ ] REFACTOR: Promise 처리 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-019, US-020

### 1.4 encodeImageToBase64() - 크기 검증 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-042 테스트 작성 (크기 초과)
- [ ] GREEN: 크기 검증 로직 추가
- [ ] REFACTOR: 에러 메시지 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-019, US-020

### 1.5 isValidTransition() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-043, TC-U2-044, TC-U2-045 테스트 작성
- [ ] GREEN: 전환 규칙 구현
- [ ] REFACTOR: 규칙 테이블 추출
- [ ] VERIFY: 테스트 통과
- **Story**: US-012

---

## Plan Step 2: API Client Layer (TDD)

### 2.1 apiClient 설정 - RED-GREEN-REFACTOR
- [ ] RED: Axios 인터셉터 테스트 작성
- [ ] GREEN: 인터셉터 구현 (JWT 토큰 추가, 401 처리)
- [ ] REFACTOR: 에러 처리 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-009

### 2.2 fetchOrders() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-009 테스트 작성
- [ ] GREEN: GET /admin/orders 구현
- [ ] REFACTOR: 타입 정의 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-010

### 2.3 updateOrderStatus() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-010 테스트 작성
- [ ] GREEN: PATCH /admin/orders/{id}/status 구현
- [ ] REFACTOR: 에러 처리 추가
- [ ] VERIFY: 테스트 통과
- **Story**: US-012

### 2.4 deleteOrder() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-011 테스트 작성
- [ ] GREEN: DELETE /admin/orders/{id} 구현
- [ ] REFACTOR: 응답 처리 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-015

### 2.5 fetchMenus() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-012 테스트 작성
- [ ] GREEN: GET /admin/menus 구현
- [ ] REFACTOR: 캐싱 설정
- [ ] VERIFY: 테스트 통과
- **Story**: US-018

### 2.6 createMenu() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-013 테스트 작성
- [ ] GREEN: POST /admin/menus 구현
- [ ] REFACTOR: 데이터 검증 추가
- [ ] VERIFY: 테스트 통과
- **Story**: US-019

### 2.7 updateMenu() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-014 테스트 작성
- [ ] GREEN: PATCH /admin/menus/{id} 구현
- [ ] REFACTOR: 부분 업데이트 처리
- [ ] VERIFY: 테스트 통과
- **Story**: US-020

### 2.8 deleteMenu() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-015 테스트 작성
- [ ] GREEN: DELETE /admin/menus/{id} 구현
- [ ] REFACTOR: 확인 로직 추가
- [ ] VERIFY: 테스트 통과
- **Story**: US-021

### 2.9 createTable() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-016 테스트 작성
- [ ] GREEN: POST /admin/tables 구현
- [ ] REFACTOR: 검증 로직 추가
- [ ] VERIFY: 테스트 통과
- **Story**: US-014

### 2.10 endTableSession() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-017 테스트 작성
- [ ] GREEN: POST /admin/tables/{id}/end-session 구현
- [ ] REFACTOR: 확인 처리 추가
- [ ] VERIFY: 테스트 통과
- **Story**: US-016

### 2.11 fetchTableHistory() - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-018 테스트 작성
- [ ] GREEN: GET /admin/tables/{id}/history 구현
- [ ] REFACTOR: 페이지네이션 처리
- [ ] VERIFY: 테스트 통과
- **Story**: US-017

---

## Plan Step 3: Hooks Layer (TDD)

### 3.1 useAuth() - 로그인 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-001 테스트 작성 (로그인 성공)
- [ ] GREEN: login() 구현
- [ ] REFACTOR: 상태 관리 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-009

### 3.2 useAuth() - 로그인 실패 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-002 테스트 작성
- [ ] GREEN: 에러 처리 추가
- [ ] REFACTOR: 에러 메시지 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-009

### 3.3 useAuth() - 로그아웃 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-003 테스트 작성
- [ ] GREEN: logout() 구현
- [ ] REFACTOR: 클린업 로직 추가
- [ ] VERIFY: 테스트 통과
- **Story**: US-009

### 3.4 useAuth() - 토큰 자동 갱신 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-004 테스트 작성
- [ ] GREEN: 자동 갱신 로직 구현
- [ ] REFACTOR: 타이머 관리 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-009

### 3.5 useSSE() - 연결 성공 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-005 테스트 작성
- [ ] GREEN: EventSource 생성 구현
- [ ] REFACTOR: 연결 상태 관리
- [ ] VERIFY: 테스트 통과
- **Story**: US-010, US-013

### 3.6 useSSE() - 재연결 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-006 테스트 작성
- [ ] GREEN: 지수 백오프 재연결 구현
- [ ] REFACTOR: 재연결 로직 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-013

### 3.7 useSSE() - 폴링 모드 전환 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-007 테스트 작성
- [ ] GREEN: 폴링 모드 전환 로직
- [ ] REFACTOR: 상태 전환 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-013

### 3.8 useSSE() - 이벤트 처리 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-008 테스트 작성
- [ ] GREEN: handleSSEEvent 구현
- [ ] REFACTOR: 이벤트 타입별 처리 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-010, US-013

---

## Plan Step 4: React Query Hooks Layer (TDD)

### 4.1 useUpdateOrderStatus() - 낙관적 업데이트 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-019 테스트 작성
- [ ] GREEN: onMutate, onSuccess 구현
- [ ] REFACTOR: 캐시 업데이트 로직 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-012

### 4.2 useUpdateOrderStatus() - 롤백 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-020 테스트 작성
- [ ] GREEN: onError 롤백 구현
- [ ] REFACTOR: 에러 처리 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-012

### 4.3 useDeleteOrder() - 낙관적 삭제 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-021 테스트 작성
- [ ] GREEN: 낙관적 삭제 구현
- [ ] REFACTOR: 캐시 무효화 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-015

### 4.4 useCreateMenu() - 낙관적 생성 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-022 테스트 작성
- [ ] GREEN: 낙관적 생성 구현
- [ ] REFACTOR: 임시 ID 처리 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-019

---

## Plan Step 5: Component Layer (TDD)

### 5.1 AdminLogin - 렌더링 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-023 테스트 작성
- [ ] GREEN: 기본 렌더링 구현
- [ ] REFACTOR: Material-UI 컴포넌트 적용
- [ ] VERIFY: 테스트 통과
- **Story**: US-009

### 5.2 AdminLogin - 폼 검증 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-024 테스트 작성
- [ ] GREEN: 검증 로직 구현
- [ ] REFACTOR: 에러 메시지 표시 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-009

### 5.3 AdminLogin - 로그인 성공 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-025 테스트 작성
- [ ] GREEN: 제출 핸들러 구현
- [ ] REFACTOR: 리다이렉트 로직 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-009

### 5.4 OrderDashboard - 초기 로드 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-026 테스트 작성
- [ ] GREEN: 데이터 로드 및 그룹화 구현
- [ ] REFACTOR: 그리드 레이아웃 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-010

### 5.5 OrderDashboard - 신규 주문 강조 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-027 테스트 작성
- [ ] GREEN: isNew 플래그 처리 구현
- [ ] REFACTOR: 애니메이션 추가
- [ ] VERIFY: 테스트 통과
- **Story**: US-010, US-013

### 5.6 OrderDashboard - 테이블 카드 클릭 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-028 테스트 작성
- [ ] GREEN: 클릭 핸들러 구현
- [ ] REFACTOR: 모달 상태 관리 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-011

### 5.7 TableCard - 렌더링 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-029 테스트 작성
- [ ] GREEN: 기본 렌더링 구현
- [ ] REFACTOR: React.memo 적용
- [ ] VERIFY: 테스트 통과
- **Story**: US-010

### 5.8 TableCard - 신규 주문 스타일 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-030 테스트 작성
- [ ] GREEN: 조건부 스타일 구현
- [ ] REFACTOR: CSS 클래스 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-010

### 5.9 OrderDetailModal - 렌더링 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-031 테스트 작성
- [ ] GREEN: 모달 기본 구조 구현
- [ ] REFACTOR: Material-UI Dialog 적용
- [ ] VERIFY: 테스트 통과
- **Story**: US-011

### 5.10 OrderDetailModal - 상태 변경 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-032 테스트 작성
- [ ] GREEN: 상태 변경 핸들러 구현
- [ ] REFACTOR: 모달 닫기 로직 추가
- [ ] VERIFY: 테스트 통과
- **Story**: US-012

### 5.11 OrderDetailModal - 삭제 확인 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-033 테스트 작성
- [ ] GREEN: 확인 팝업 구현
- [ ] REFACTOR: 삭제 로직 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-015

### 5.12 MenuManagement - 목록 렌더링 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-034 테스트 작성
- [ ] GREEN: 메뉴 목록 표시 구현
- [ ] REFACTOR: 카테고리 필터 추가
- [ ] VERIFY: 테스트 통과
- **Story**: US-018

### 5.13 MenuManagement - 추가 폼 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-035 테스트 작성
- [ ] GREEN: 폼 렌더링 구현
- [ ] REFACTOR: 이미지 업로드 UI 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-019

### 5.14 MenuManagement - 추가 검증 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-036 테스트 작성
- [ ] GREEN: 검증 로직 구현
- [ ] REFACTOR: 에러 메시지 표시 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-019

### 5.15 TableManagement - 생성 폼 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-037 테스트 작성
- [ ] GREEN: 테이블 생성 폼 구현
- [ ] REFACTOR: 폼 레이아웃 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-014

### 5.16 TableManagement - 세션 종료 확인 - RED-GREEN-REFACTOR
- [ ] RED: TC-U2-038 테스트 작성
- [ ] GREEN: 확인 팝업 구현
- [ ] REFACTOR: 세션 종료 로직 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-016

---

## Plan Step 6: Context 및 Provider (TDD)

### 6.1 AdminContext - 초기 상태 - RED-GREEN-REFACTOR
- [ ] RED: Context 초기 상태 테스트 작성
- [ ] GREEN: AdminContext 및 Provider 구현
- [ ] REFACTOR: 타입 정의 개선
- [ ] VERIFY: 테스트 통과
- **Story**: US-009

---

## Plan Step 7: 라우팅 및 App 구조 (TDD)

### 7.1 AdminApp - 라우팅 - RED-GREEN-REFACTOR
- [ ] RED: 라우팅 테스트 작성
- [ ] GREEN: React Router 설정 구현
- [ ] REFACTOR: ProtectedRoute 추가
- [ ] VERIFY: 테스트 통과
- **Story**: US-009

---

## Plan Step 8: 통합 테스트

### 8.1 전체 플로우 테스트
- [ ] 로그인 → 대시보드 → 주문 상태 변경 플로우
- [ ] 메뉴 관리 전체 플로우 (CRUD)
- [ ] 테이블 관리 전체 플로우

---

## Plan Step 9: 추가 아티팩트

### 9.1 설정 파일
- [ ] package.json (의존성)
- [ ] vite.config.js (Vite 설정)
- [ ] .env.example (환경 변수 템플릿)
- [ ] tsconfig.json (TypeScript 설정 - 선택)

### 9.2 문서
- [ ] README.md (설치 및 실행 가이드)
- [ ] API.md (API 엔드포인트 문서)

---

## Story Completion Tracking

- [ ] US-009: 관리자 로그인
- [ ] US-010: 실시간 주문 대시보드 모니터링
- [ ] US-011: 주문 상세 정보 확인
- [ ] US-012: 주문 상태 변경
- [ ] US-013: SSE 실시간 업데이트
- [ ] US-014: 테이블 태블릿 초기 설정
- [ ] US-015: 주문 삭제
- [ ] US-016: 테이블 세션 종료
- [ ] US-017: 과거 주문 내역 조회
- [ ] US-018: 메뉴 조회
- [ ] US-019: 메뉴 등록
- [ ] US-020: 메뉴 수정
- [ ] US-021: 메뉴 삭제
- [ ] US-022: 메뉴 순서 조정

---

## 총 단계 수: 70+ 단계 (RED-GREEN-REFACTOR 사이클 포함)
