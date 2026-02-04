# Unit of Work - User Story 매핑

## 매핑 개요

총 25개 User Stories를 4개 유닛에 매핑합니다.

---

## Unit 1: Customer Frontend (8개 스토리)

### US-001: 테이블 태블릿 자동 로그인 [MVP]
- **유닛**: Customer Frontend
- **의존성**: Backend API (`POST /customer/login`)
- **구현 범위**: 
  - 로그인 폼 컴포넌트
  - localStorage 저장 로직
  - 자동 로그인 훅

### US-002: 메뉴 카테고리별 조회 [MVP]
- **유닛**: Customer Frontend
- **의존성**: Backend API (`GET /customer/menus`)
- **구현 범위**:
  - MenuBrowser 컴포넌트
  - 카테고리 필터
  - 메뉴 카드 표시

### US-003: 메뉴 상세 정보 확인 [MVP]
- **유닛**: Customer Frontend
- **의존성**: Backend API (`GET /customer/menus`)
- **구현 범위**:
  - 메뉴 상세 모달
  - 이미지 표시

### US-004: 장바구니에 메뉴 추가 [MVP]
- **유닛**: Customer Frontend
- **의존성**: None (클라이언트 측)
- **구현 범위**:
  - 장바구니 Context
  - localStorage 동기화

### US-005: 장바구니 내용 관리 [MVP]
- **유닛**: Customer Frontend
- **의존성**: None (클라이언트 측)
- **구현 범위**:
  - Cart 컴포넌트
  - 수량 조절 로직
  - 총 금액 계산

### US-006: 장바구니 지속성 유지 [MVP]
- **유닛**: Customer Frontend
- **의존성**: None (클라이언트 측)
- **구현 범위**:
  - localStorage 읽기/쓰기
  - 페이지 로드 시 복원

### US-007: 주문 생성 및 확정 [MVP]
- **유닛**: Customer Frontend
- **의존성**: Backend API (`POST /customer/orders`)
- **구현 범위**:
  - OrderConfirmation 컴포넌트
  - 주문 생성 요청
  - 자동 리다이렉트

### US-008: 주문 내역 조회 [MVP]
- **유닛**: Customer Frontend
- **의존성**: Backend API (`GET /customer/orders`)
- **구현 범위**:
  - OrderHistory 컴포넌트
  - 주문 목록 표시

---

## Unit 2: Admin Frontend (14개 스토리)

### US-009: 관리자 로그인 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`POST /admin/login`)
- **구현 범위**:
  - AdminLogin 컴포넌트
  - JWT 토큰 저장
  - 16시간 세션 관리

### US-010: 실시간 주문 대시보드 모니터링 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`GET /admin/orders`, `GET /admin/orders/sse`)
- **구현 범위**:
  - OrderDashboard 컴포넌트
  - 그리드 레이아웃
  - SSE 연결 관리

### US-011: 주문 상세 정보 확인 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`GET /admin/orders`)
- **구현 범위**:
  - OrderDetailModal 컴포넌트
  - 주문 상세 표시

### US-012: 주문 상태 변경 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`PATCH /admin/orders/{id}/status`)
- **구현 범위**:
  - 상태 드롭다운
  - 상태 변경 요청

### US-013: SSE 실시간 업데이트 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`GET /admin/orders/sse`)
- **구현 범위**:
  - useSSE 훅
  - 자동 재연결 로직
  - 하이브리드 업데이트 처리

### US-014: 테이블 태블릿 초기 설정 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`POST /admin/tables`)
- **구현 범위**:
  - TableManagement 컴포넌트
  - 테이블 생성 폼

### US-015: 주문 삭제 (직권 수정) [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`DELETE /admin/orders/{id}`)
- **구현 범위**:
  - 삭제 버튼
  - 확인 팝업

### US-016: 테이블 세션 종료 (매장 이용 완료) [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`POST /admin/tables/{id}/end-session`)
- **구현 범위**:
  - 세션 종료 버튼
  - 확인 팝업

### US-017: 과거 주문 내역 조회 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`GET /admin/tables/{id}/history`)
- **구현 범위**:
  - 과거 내역 모달
  - 날짜 필터

### US-018: 메뉴 조회 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`GET /admin/menus`)
- **구현 범위**:
  - MenuManagement 컴포넌트
  - 메뉴 목록 표시

### US-019: 메뉴 등록 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`POST /admin/menus`)
- **구현 범위**:
  - 메뉴 등록 폼
  - Base64 이미지 인코딩

### US-020: 메뉴 수정 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`PATCH /admin/menus/{id}`)
- **구현 범위**:
  - 메뉴 수정 폼

### US-021: 메뉴 삭제 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`DELETE /admin/menus/{id}`)
- **구현 범위**:
  - 삭제 버튼
  - 확인 팝업

### US-022: 메뉴 노출 순서 조정 [MVP]
- **유닛**: Admin Frontend
- **의존성**: Backend API (`PATCH /admin/menus/{id}/order`)
- **구현 범위**:
  - 드래그 앤 드롭
  - 순서 업데이트 요청

---

## Unit 3: Backend API (25개 스토리 - 모든 스토리의 백엔드 로직)

### 고객 기능 (8개 스토리)

**US-001 ~ US-008**: 
- **구현 범위**:
  - CustomerRouter 엔드포인트
  - AuthService (테이블 인증)
  - MenuService (메뉴 조회, 캐싱)
  - OrderService (주문 생성, 조회)
  - 관련 Repository 및 Model

### 관리자 기능 (14개 스토리)

**US-009 ~ US-022**:
- **구현 범위**:
  - AdminRouter 엔드포인트
  - AuthService (관리자 인증)
  - OrderService (주문 관리, 상태 변경, 삭제)
  - TableService (테이블 관리, 세션 처리)
  - MenuService (메뉴 CRUD)
  - SSEService (실시간 통신)
  - 관련 Repository 및 Model

### 비기능 요구사항 (3개 스토리)

**US-023: 실시간 업데이트 성능**:
- **구현 범위**:
  - SSEService 최적화
  - 하이브리드 업데이트 로직

**US-024: 멀티 테넌트 데이터 격리**:
- **구현 범위**:
  - store_id 필터링 (모든 Repository)
  - 인증 미들웨어

**US-025: 메뉴 데이터 캐싱**:
- **구현 범위**:
  - CacheManager
  - MenuService 캐싱 로직

---

## Unit 4: Database Schema (25개 스토리 - 모든 스토리의 데이터 모델)

### 데이터 모델 (8개 엔티티)

**모든 User Stories**:
- **구현 범위**:
  - Store 테이블
  - Table 테이블
  - TableSession 테이블
  - Menu 테이블
  - Category 테이블
  - Order 테이블
  - OrderItem 테이블
  - OrderHistory 테이블
  - 인덱스 및 제약조건
  - 마이그레이션 스크립트

---

## 크로스 유닛 스토리

다음 스토리들은 여러 유닛에 걸쳐 구현됩니다:

### US-007: 주문 생성 및 확정
- **Customer Frontend**: 주문 확인 UI, 주문 생성 요청
- **Backend API**: 주문 생성 로직, SSE 브로드캐스트
- **Database Schema**: Order, OrderItem 테이블에 저장

### US-010: 실시간 주문 대시보드 모니터링
- **Admin Frontend**: SSE 연결, 실시간 업데이트 UI
- **Backend API**: SSE 엔드포인트, 브로드캐스트 로직
- **Database Schema**: Order 데이터 조회

### US-013: SSE 실시간 업데이트
- **Admin Frontend**: SSE 클라이언트, 재연결 로직
- **Backend API**: SSE 서버, 하이브리드 업데이트
- **Database Schema**: 초기 데이터 조회

### US-016: 테이블 세션 종료
- **Admin Frontend**: 세션 종료 UI
- **Backend API**: 세션 종료 로직, 주문 아카이브
- **Database Schema**: TableSession 종료, OrderHistory 저장

---

## 개발 순서 권장사항

### Phase 1: 기반 구축 (병렬)
1. **Database Schema**: 모든 테이블 생성 및 마이그레이션
2. **Backend API**: 기본 구조 및 인증 API
3. **Frontend**: 프로젝트 구조 및 라우팅 설정

### Phase 2: 고객 기능 (병렬)
1. **Backend API**: 고객용 API 구현 (US-001 ~ US-008)
2. **Customer Frontend**: Mock API로 UI 개발
3. **통합**: Mock → Real API 전환

### Phase 3: 관리자 기능 (병렬)
1. **Backend API**: 관리자용 API 구현 (US-009 ~ US-022)
2. **Admin Frontend**: Mock API로 UI 개발
3. **SSE**: 실시간 통신 구현
4. **통합**: Mock → Real API 전환

### Phase 4: 통합 및 테스트
1. **End-to-End 테스트**: 전체 플로우 검증
2. **성능 테스트**: 실시간 업데이트 성능 (US-023)
3. **보안 테스트**: 멀티 테넌트 격리 (US-024)
4. **캐싱 검증**: 메뉴 캐싱 (US-025)

---

## 스토리 우선순위 (MVP)

모든 25개 스토리가 MVP 범위에 포함되지만, 개발 순서는 다음과 같이 권장합니다:

**P0 (최우선)**:
- US-001: 테이블 로그인
- US-002: 메뉴 조회
- US-007: 주문 생성
- US-009: 관리자 로그인
- US-010: 주문 모니터링

**P1 (중요)**:
- US-004, US-005, US-006: 장바구니
- US-008: 주문 내역
- US-012: 주문 상태 변경
- US-013: SSE 실시간 업데이트
- US-016: 세션 종료

**P2 (일반)**:
- US-003: 메뉴 상세
- US-011: 주문 상세
- US-014, US-015, US-017: 테이블 관리
- US-018 ~ US-022: 메뉴 관리
- US-023 ~ US-025: 비기능 요구사항
