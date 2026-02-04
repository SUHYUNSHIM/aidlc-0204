# Backend API Infrastructure Design

## 개요

테이블 오더 서비스 백엔드 API의 인프라 설계 문서입니다.

---

## 인프라 구성 요소

### 1. [로컬 개발 환경](./local-development.md)
- Docker Compose 구성
- 개발 환경 설정
- 로컬 테스트 환경

### 2. [배포 아키텍처](./deployment-architecture.md)
- 컨테이너 기반 배포
- 네트워크 구성
- 환경별 설정

### 3. [데이터베이스 인프라](./database-infrastructure.md)
- PostgreSQL 설정
- 마이그레이션 전략
- 백업 및 복구

---

## 기술 스택 요약

| 구성 요소 | 기술 | 버전 |
|----------|-----|------|
| 런타임 | Python | 3.11+ |
| 웹 프레임워크 | FastAPI | 0.109+ |
| ASGI 서버 | Uvicorn | 0.27+ |
| 데이터베이스 | PostgreSQL | 14+ |
| ORM | SQLAlchemy | 2.0+ |
| 마이그레이션 | Alembic | 1.13+ |
| 컨테이너 | Docker | 24+ |
| 오케스트레이션 | Docker Compose | 2.0+ |

---

## 환경 구분

| 환경 | 용도 | 특징 |
|-----|-----|-----|
| Local | 개발자 로컬 개발 | Docker Compose, Hot Reload |
| Development | 통합 개발/테스트 | 공유 개발 서버 |
| Staging | 배포 전 검증 | 프로덕션 유사 환경 |
| Production | 실제 서비스 | 고가용성, 모니터링 |

---

## 프로젝트 디렉토리 구조

```
table-order-service/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 애플리케이션 진입점
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # 환경 설정
│   │   ├── database.py         # DB 연결
│   │   ├── security.py         # JWT, 비밀번호
│   │   ├── cache.py            # 캐시 관리
│   │   └── dependencies.py     # 의존성 주입
│   ├── models/
│   │   ├── __init__.py
│   │   └── *.py                # SQLAlchemy 모델
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── *.py                # Pydantic 스키마
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── *.py                # 데이터 액세스 레이어
│   ├── services/
│   │   ├── __init__.py
│   │   └── *.py                # 비즈니스 로직
│   └── api/
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py
│           ├── router.py       # API 라우터 통합
│           └── endpoints/
│               ├── auth.py
│               ├── tables.py
│               ├── orders.py
│               ├── menu.py
│               └── health.py
├── alembic/
│   ├── versions/               # 마이그레이션 파일
│   └── env.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── *.py
├── .env.example
├── .gitignore
├── alembic.ini
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── README.md
```
