# Backend API Functional Design

## 개요

테이블 오더 서비스 백엔드 API의 상세 기능 설계 문서입니다.

**기술 스택**:
- Framework: FastAPI (Python 3.10+)
- Database: PostgreSQL 14+
- ORM: SQLAlchemy 2.0
- Authentication: JWT + bcrypt
- Real-time: Server-Sent Events (SSE)
- Caching: In-Memory

---

## 문서 목록

### 1. [데이터 모델](./data-models.md)
- 8개 엔티티 정의 (Store, Table, TableSession, Category, Menu, Order, OrderItem, OrderHistory)
- 테이블 스키마 (SQL)
- SQLAlchemy 모델
- 비즈니스 규칙
- ER 다이어그램

### 2. [API 명세서](./api-specifications.md)
- 고객용 API (4개 엔드포인트)
  - `POST /customer/login` - 테이블 로그인
  - `GET /customer/menus` - 메뉴 조회
  - `POST /customer/orders` - 주문 생성
  - `GET /customer/orders` - 주문 내역 조회
- 관리자용 API (13개 엔드포인트)
  - 인증, 주문 관리, 테이블 관리, 메뉴 관리
  - SSE 실시간 업데이트
- Request/Response 스키마
- 에러 응답 정의

### 3. [비즈니스 로직](./business-logic.md)
- AuthService: 인증 플로우 (테이블/관리자)
- OrderService: 주문 생성, 상태 변경, 삭제
- TableService: 테이블 생성, 세션 관리
- MenuService: 메뉴 CRUD, 캐싱
- SSEService: 실시간 통신
- 주문 번호 생성 규칙
- 에러 처리 전략

### 4. [Pydantic 스키마](./pydantic-schemas.md)
- 인증 스키마 (Request/Response)
- 메뉴 스키마
- 주문 스키마
- 테이블 스키마
- SSE 이벤트 스키마
- 카테고리 스키마

### 5. [서비스 인터페이스](./service-interfaces.md)
- IAuthService
- IOrderService
- ITableService
- IMenuService
- ISSEService
- ICacheManager
- 의존성 주입 구조

### 6. [Repository 인터페이스](./repository-interfaces.md)
- IStoreRepository
- ITableRepository
- ITableSessionRepository
- ICategoryRepository
- IMenuRepository
- IOrderRepository
- IOrderItemRepository
- IOrderHistoryRepository
- SQLAlchemy 구현 예시

### 7. [설정 및 환경 변수](./configuration.md)
- 환경 변수 정의 (.env)
- Settings 클래스
- 데이터베이스 설정
- 로깅 설정
- 캐시 설정
- 에러 핸들러
- 메인 애플리케이션
- Docker Compose
- requirements.txt

---

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ CustomerRouter  │  │  AdminRouter    │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
└───────────┼────────────────────┼────────────────────────────┘
            │                    │
┌───────────┼────────────────────┼────────────────────────────┐
│           │    Service Layer   │                             │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌──────────────┐ │
│  │   AuthService   │  │  OrderService   │  │  SSEService  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  TableService   │  │   MenuService   │  │ CacheManager │ │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┘ │
└───────────┼────────────────────┼────────────────────────────┘
            │                    │
┌───────────┼────────────────────┼────────────────────────────┐
│           │  Repository Layer  │                             │
│  ┌────────▼────────┐  ┌────────▼────────┐                   │
│  │ StoreRepository │  │ MenuRepository  │                   │
│  │ TableRepository │  │CategoryRepository│                  │
│  │SessionRepository│  │ OrderRepository │                   │
│  │HistoryRepository│  │OrderItemRepository│                 │
│  └────────┬────────┘  └────────┬────────┘                   │
└───────────┼────────────────────┼────────────────────────────┘
            │                    │
┌───────────┼────────────────────┼────────────────────────────┐
│           │    Model Layer     │                             │
│  ┌────────▼────────────────────▼────────┐                   │
│  │  SQLAlchemy Models (8 Entities)      │                   │
│  │  Store, Table, TableSession,         │                   │
│  │  Category, Menu, Order, OrderItem,   │                   │
│  │  OrderHistory                        │                   │
│  └──────────────────┬───────────────────┘                   │
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   PostgreSQL                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## API 엔드포인트 요약

| 구분 | 메서드 | 엔드포인트 | 설명 |
|------|--------|-----------|------|
| 고객 | POST | /customer/login | 테이블 로그인 |
| 고객 | GET | /customer/menus | 메뉴 조회 |
| 고객 | POST | /customer/orders | 주문 생성 |
| 고객 | GET | /customer/orders | 주문 내역 조회 |
| 관리자 | POST | /admin/login | 관리자 로그인 |
| 관리자 | GET | /admin/orders | 주문 목록 조회 |
| 관리자 | GET | /admin/orders/sse | 실시간 주문 업데이트 |
| 관리자 | PATCH | /admin/orders/{id}/status | 주문 상태 변경 |
| 관리자 | DELETE | /admin/orders/{id} | 주문 삭제 |
| 관리자 | POST | /admin/tables | 테이블 생성 |
| 관리자 | POST | /admin/tables/{id}/end-session | 세션 종료 |
| 관리자 | GET | /admin/tables/{id}/history | 과거 내역 조회 |
| 관리자 | GET | /admin/menus | 메뉴 목록 조회 |
| 관리자 | POST | /admin/menus | 메뉴 등록 |
| 관리자 | PATCH | /admin/menus/{id} | 메뉴 수정 |
| 관리자 | DELETE | /admin/menus/{id} | 메뉴 삭제 |
| 관리자 | PATCH | /admin/menus/{id}/order | 메뉴 순서 변경 |

---

## 주요 비즈니스 규칙

### 인증
- JWT 토큰 유효 기간: 16시간
- 비밀번호 해싱: bcrypt
- 테이블당 활성 세션: 최대 1개

### 주문
- 주문 번호 형식: `ORD-YYYYMMDD-NNN`
- 주문 상태: 대기중 → 준비중 → 완료 (부분 강제)
- 메뉴 가격/이름: 주문 시점 스냅샷 저장

### 세션
- 세션 ID: UUID v4
- 세션 종료 시: 주문 아카이브 → OrderHistory

### 캐싱
- 메뉴 캐시 TTL: 1시간
- 메뉴 변경 시 캐시 무효화

### 실시간 통신
- SSE 하이브리드: 초기 전체 + 증분 업데이트
- Heartbeat: 30초
- 자동 재연결: 지수 백오프

---

## 다음 단계

1. **NFR Requirements**: 비기능 요구사항 분석
2. **NFR Design**: 성능, 보안, 확장성 설계
3. **Infrastructure Design**: 인프라 구조 설계
4. **Code Generation**: 실제 코드 구현
5. **Build and Test**: 빌드 및 테스트
