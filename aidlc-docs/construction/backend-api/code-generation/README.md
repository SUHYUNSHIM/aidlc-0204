# Backend API Code Generation

## 개요

테이블 오더 서비스 백엔드 API 코드 생성 계획 및 절차입니다.

---

## 코드 생성 순서

### Phase 1: 프로젝트 구조 및 핵심 설정
1. [프로젝트 구조 생성](./01-project-structure.md)
2. [핵심 설정 모듈](./02-core-config.md)

### Phase 2: 데이터 레이어
3. [SQLAlchemy 모델](./03-models.md)
4. [Pydantic 스키마](./04-schemas.md)
5. [Repository 구현](./05-repositories.md)

### Phase 3: 비즈니스 레이어
6. [Service 구현](./06-services.md)
7. [SSE 서비스](./07-sse-service.md)

### Phase 4: API 레이어
8. [API 엔드포인트](./08-api-endpoints.md)
9. [미들웨어 및 의존성](./09-middleware.md)

### Phase 5: 통합 및 테스트
10. [메인 애플리케이션](./10-main-app.md)
11. [테스트 코드](./11-tests.md)

---

## 기술 스택

| 구성 요소 | 기술 | 버전 |
|----------|-----|------|
| 언어 | Python | 3.11+ |
| 웹 프레임워크 | FastAPI | 0.109+ |
| ORM | SQLAlchemy | 2.0+ |
| 검증 | Pydantic | 2.5+ |
| 인증 | python-jose, bcrypt | - |
| DB | PostgreSQL | 14+ |
| 서버 | Uvicorn | 0.27+ |

---

## 참조 문서

- [데이터 모델](../functional-design/data-models.md)
- [API 명세](../functional-design/api-specifications.md)
- [비즈니스 로직](../functional-design/business-logic.md)
- [Pydantic 스키마](../functional-design/pydantic-schemas.md)
- [서비스 인터페이스](../functional-design/service-interfaces.md)
- [Repository 인터페이스](../functional-design/repository-interfaces.md)
- [NFR 설계](../nfr-design/README.md)
- [인프라 설계](../infrastructure-design/README.md)

---

## 코드 생성 규칙

1. **기존 스키마 준수**: `database/schema/schema.sql` 기준
2. **타입 일관성**: store_id(int), session_id(UUID)
3. **비동기 우선**: async/await 패턴 사용
4. **의존성 주입**: FastAPI Depends 활용
5. **에러 처리**: 커스텀 예외 클래스 사용
6. **로깅**: 구조화된 JSON 로깅
