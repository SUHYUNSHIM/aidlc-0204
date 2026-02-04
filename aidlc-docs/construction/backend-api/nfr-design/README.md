# Backend API NFR Design

## 개요

테이블 오더 서비스 백엔드 API의 비기능 요구사항(Non-Functional Requirements) 설계 문서입니다.

---

## NFR 카테고리

### 1. [성능 (Performance)](./performance.md)
- 실시간 업데이트 성능 (2초 이내)
- API 응답 시간 목표
- 데이터베이스 쿼리 최적화
- 캐싱 전략

### 2. [보안 (Security)](./security.md)
- JWT 인증/인가
- 비밀번호 해싱 (bcrypt)
- 멀티 테넌트 데이터 격리
- 입력 검증 및 SQL Injection 방지
- CORS 설정

### 3. [확장성 (Scalability)](./scalability.md)
- 멀티 테넌트 아키텍처
- 연결 풀 관리
- SSE 연결 관리
- 수평 확장 고려사항

### 4. [안정성 (Reliability)](./reliability.md)
- 에러 처리 전략
- 트랜잭션 관리
- SSE 재연결 메커니즘
- 데이터 무결성

### 5. [운영성 (Operability)](./operability.md)
- 로깅 전략
- 헬스 체크
- 모니터링 포인트
- 환경 설정 관리

---

## NFR 요약 매트릭스

| 카테고리 | 요구사항 | 목표값 | 우선순위 |
|---------|---------|--------|---------|
| 성능 | SSE 업데이트 지연 | < 2초 | P0 |
| 성능 | API 응답 시간 | < 500ms | P0 |
| 성능 | 메뉴 캐시 TTL | 1시간 | P1 |
| 보안 | JWT 토큰 유효기간 | 16시간 | P0 |
| 보안 | 비밀번호 해싱 | bcrypt | P0 |
| 보안 | 데이터 격리 | store_id 기반 | P0 |
| 확장성 | DB 연결 풀 | 5-20 | P1 |
| 확장성 | 동시 SSE 연결 | 100+ | P1 |
| 안정성 | 트랜잭션 롤백 | 자동 | P0 |
| 안정성 | SSE 재연결 | 지수 백오프 | P1 |
| 운영성 | 로그 레벨 | 설정 가능 | P1 |
| 운영성 | 헬스 체크 | /health | P0 |
