# 컴포넌트 정의

## 1. 프론트엔드 컴포넌트

### 1.1 Customer UI Components (고객용 UI)

#### CustomerApp
- **목적**: 고객용 애플리케이션의 루트 컴포넌트
- **책임**:
  - 고객용 라우팅 관리
  - 테이블 세션 컨텍스트 제공
  - 자동 로그인 처리
- **인터페이스**: React Component

#### MenuBrowser
- **목적**: 메뉴 탐색 및 조회
- **책임**:
  - 카테고리별 메뉴 표시
  - 메뉴 상세 정보 표시
  - 메뉴 검색 및 필터링
- **인터페이스**: React Component

#### Cart
- **목적**: 장바구니 관리
- **책임**:
  - 장바구니 아이템 표시
  - 수량 조절
  - 총 금액 계산
  - localStorage 동기화
- **인터페이스**: React Component

#### OrderConfirmation
- **목적**: 주문 확정 및 완료
- **책임**:
  - 주문 내역 최종 확인
  - 주문 생성 요청
  - 주문 번호 표시
  - 자동 리다이렉트
- **인터페이스**: React Component

#### OrderHistory
- **목적**: 주문 내역 조회
- **책임**:
  - 현재 세션 주문 목록 표시
  - 주문 상태 표시
  - 주문 상세 정보 표시
- **인터페이스**: React Component

### 1.2 Admin UI Components (관리자용 UI)

#### AdminApp
- **목적**: 관리자용 애플리케이션의 루트 컴포넌트
- **책임**:
  - 관리자용 라우팅 관리
  - 인증 컨텍스트 제공
  - JWT 토큰 관리
- **인터페이스**: React Component

#### AdminLogin
- **목적**: 관리자 로그인
- **책임**:
  - 로그인 폼 표시
  - 인증 요청
  - JWT 토큰 저장
- **인터페이스**: React Component

#### OrderDashboard
- **목적**: 실시간 주문 모니터링
- **책임**:
  - 테이블별 주문 현황 그리드 표시
  - SSE 연결 관리
  - 실시간 업데이트 처리
  - 신규 주문 강조
- **인터페이스**: React Component

#### TableCard
- **목적**: 테이블별 주문 카드
- **책임**:
  - 테이블 번호 및 총 주문액 표시
  - 최신 주문 미리보기
  - 주문 상세 보기 트리거
- **인터페이스**: React Component

#### OrderDetailModal
- **목적**: 주문 상세 정보 모달
- **책임**:
  - 전체 주문 목록 표시
  - 주문 상태 변경
  - 주문 삭제
- **인터페이스**: React Component

#### TableManagement
- **목적**: 테이블 관리
- **책임**:
  - 테이블 초기 설정
  - 테이블 세션 종료
  - 과거 주문 내역 조회
- **인터페이스**: React Component

#### MenuManagement
- **목적**: 메뉴 관리
- **책임**:
  - 메뉴 목록 표시
  - 메뉴 등록/수정/삭제
  - 메뉴 순서 조정
- **인터페이스**: React Component

### 1.3 Shared UI Components (공통 컴포넌트)

#### Button
- **목적**: 재사용 가능한 버튼 컴포넌트
- **책임**: 일관된 버튼 스타일 및 동작 제공
- **인터페이스**: React Component

#### Input
- **목적**: 재사용 가능한 입력 필드
- **책임**: 일관된 입력 필드 스타일 및 검증
- **인터페이스**: React Component

#### Modal
- **목적**: 재사용 가능한 모달 다이얼로그
- **책임**: 모달 표시 및 닫기 관리
- **인터페이스**: React Component

#### Toast
- **목적**: 알림 메시지 표시
- **책임**: 성공/에러/정보 메시지 표시
- **인터페이스**: React Component

#### Loader
- **목적**: 로딩 인디케이터
- **책임**: 비동기 작업 중 로딩 상태 표시
- **인터페이스**: React Component

---

## 2. 백엔드 컴포넌트

### 2.1 API Layer (API 계층)

#### CustomerRouter
- **목적**: 고객용 API 엔드포인트
- **책임**:
  - `/customer/login` - 테이블 자동 로그인
  - `/customer/menus` - 메뉴 조회
  - `/customer/cart` - 장바구니 관리 (클라이언트 측)
  - `/customer/orders` - 주문 생성 및 조회
- **인터페이스**: FastAPI Router

#### AdminRouter
- **목적**: 관리자용 API 엔드포인트
- **책임**:
  - `/admin/login` - 관리자 로그인
  - `/admin/orders` - 주문 모니터링 및 관리
  - `/admin/orders/sse` - 실시간 주문 업데이트 (SSE)
  - `/admin/tables` - 테이블 관리
  - `/admin/menus` - 메뉴 관리
- **인터페이스**: FastAPI Router

### 2.2 Service Layer (서비스 계층)

#### AuthService
- **목적**: 인증 및 인가 처리
- **책임**:
  - JWT 토큰 생성 및 검증
  - 비밀번호 해싱 및 검증 (bcrypt)
  - 테이블 인증
  - 관리자 인증
- **인터페이스**: Python Class

#### OrderService
- **목적**: 주문 비즈니스 로직
- **책임**:
  - 주문 생성
  - 주문 조회 (현재 세션, 과거 내역)
  - 주문 상태 변경
  - 주문 삭제
  - 주문 통계 계산
- **인터페이스**: Python Class

#### TableService
- **목적**: 테이블 및 세션 관리
- **책임**:
  - 테이블 생성 및 설정
  - 테이블 세션 시작
  - 테이블 세션 종료 (매장 이용 완료)
  - 세션 ID 생성 (UUID)
- **인터페이스**: Python Class

#### MenuService
- **목적**: 메뉴 관리 비즈니스 로직
- **책임**:
  - 메뉴 조회 (카테고리별, 전체)
  - 메뉴 등록/수정/삭제
  - 메뉴 순서 조정
  - 메뉴 캐싱 관리
- **인터페이스**: Python Class

#### SSEService
- **목적**: 실시간 통신 관리
- **책임**:
  - SSE 연결 관리
  - 주문 업데이트 브로드캐스트
  - 하이브리드 업데이트 (초기 전체 + 증분)
  - 연결 상태 추적
- **인터페이스**: Python Class

### 2.3 Repository Layer (저장소 계층)

#### StoreRepository
- **목적**: Store 엔티티 데이터 액세스
- **책임**:
  - Store CRUD 작업
  - 매장 조회 (ID, 식별자)
- **인터페이스**: Python Class

#### TableRepository
- **목적**: Table 엔티티 데이터 액세스
- **책임**:
  - Table CRUD 작업
  - 테이블 조회 (매장별, 테이블 번호)
- **인터페이스**: Python Class

#### TableSessionRepository
- **목적**: TableSession 엔티티 데이터 액세스
- **책임**:
  - TableSession CRUD 작업
  - 활성 세션 조회
  - 세션 종료 처리
- **인터페이스**: Python Class

#### OrderRepository
- **목적**: Order 및 OrderItem 엔티티 데이터 액세스
- **책임**:
  - Order CRUD 작업
  - 주문 조회 (세션별, 테이블별, 매장별)
  - 주문 상태 업데이트
  - 주문 통계 쿼리
- **인터페이스**: Python Class

#### MenuRepository
- **목적**: Menu 및 Category 엔티티 데이터 액세스
- **책임**:
  - Menu CRUD 작업
  - Category CRUD 작업
  - 메뉴 조회 (카테고리별, 매장별)
  - 메뉴 순서 업데이트
- **인터페이스**: Python Class

#### OrderHistoryRepository
- **목적**: OrderHistory 엔티티 데이터 액세스
- **책임**:
  - 과거 주문 저장
  - 과거 주문 조회 (테이블별, 날짜별)
- **인터페이스**: Python Class

### 2.4 Model Layer (모델 계층)

#### Store
- **목적**: 매장 엔티티
- **속성**: store_id, store_name, admin_username, admin_password_hash
- **인터페이스**: SQLAlchemy Model

#### Table
- **목적**: 테이블 엔티티
- **속성**: table_id, store_id, table_number, table_password_hash, current_session_id
- **인터페이스**: SQLAlchemy Model

#### TableSession
- **목적**: 테이블 세션 엔티티
- **속성**: session_id (UUID), table_id, start_time, end_time, is_active
- **인터페이스**: SQLAlchemy Model

#### Menu
- **목적**: 메뉴 엔티티
- **속성**: menu_id, store_id, category_id, menu_name, price, description, image_base64, display_order
- **인터페이스**: SQLAlchemy Model

#### Category
- **목적**: 카테고리 엔티티
- **속성**: category_id, store_id, category_name, display_order
- **인터페이스**: SQLAlchemy Model

#### Order
- **목적**: 주문 엔티티
- **속성**: order_id, session_id, table_id, store_id, order_time, total_amount, status
- **인터페이스**: SQLAlchemy Model

#### OrderItem
- **목적**: 주문 항목 엔티티
- **속성**: order_item_id, order_id, menu_id, quantity, unit_price
- **인터페이스**: SQLAlchemy Model

#### OrderHistory
- **목적**: 주문 이력 엔티티
- **속성**: history_id, session_id, completed_time, archived_order_data (JSON)
- **인터페이스**: SQLAlchemy Model

---

## 3. 공통 컴포넌트

### CacheManager
- **목적**: 캐싱 관리
- **책임**:
  - 메뉴 데이터 캐싱
  - 카테고리 데이터 캐싱
  - 캐시 무효화
  - TTL 관리
- **인터페이스**: Python Class

### Logger
- **목적**: 로깅 관리
- **책임**:
  - 레벨별 로깅 (DEBUG, INFO, WARNING, ERROR)
  - 로그 포맷팅
  - 로그 출력 관리
- **인터페이스**: Python Module

### ErrorHandler
- **목적**: 에러 처리
- **책임**:
  - 전역 에러 핸들러
  - 커스텀 예외 정의
  - 에러 응답 포맷팅
- **인터페이스**: FastAPI Exception Handler

### DatabaseConnection
- **목적**: 데이터베이스 연결 관리
- **책임**:
  - SQLAlchemy 엔진 생성
  - 세션 관리
  - 연결 풀 관리
- **인터페이스**: Python Module
