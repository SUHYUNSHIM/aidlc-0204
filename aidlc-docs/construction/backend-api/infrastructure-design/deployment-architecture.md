# 배포 아키텍처 (Deployment Architecture)

## 개요

테이블 오더 서비스의 배포 아키텍처 및 환경별 구성입니다.

---

## 1. 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                        클라이언트                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 고객 웹 UI  │  │ 관리자 웹 UI │  │  외부 API   │         │
│  │ (태블릿)    │  │  (데스크탑)  │  │   클라이언트 │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    로드 밸런서 / 리버스 프록시                │
│                        (Nginx / ALB)                        │
└─────────────────────────────┬───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Backend API   │ │   Backend API   │ │   Backend API   │
│   Container 1   │ │   Container 2   │ │   Container N   │
│   (FastAPI)     │ │   (FastAPI)     │ │   (FastAPI)     │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                             │
│                   (Primary + Replica)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 프로덕션 Dockerfile

### 2.1 Dockerfile

```dockerfile
# Dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

# 빌드 의존성
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# 프로덕션 이미지
FROM python:3.11-slim

WORKDIR /app

# 런타임 의존성만 설치
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# 빌더에서 패키지 복사
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# 애플리케이션 코드 복사
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# 비루트 사용자 생성
RUN useradd --create-home appuser
USER appuser

# 포트 노출
EXPOSE 8000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# 프로덕션 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 2.2 .dockerignore

```
# .dockerignore
.git
.gitignore
.env*
.venv
__pycache__
*.pyc
*.pyo
.pytest_cache
.coverage
htmlcov
.mypy_cache
*.md
docs/
tests/
docker-compose*.yml
Dockerfile.dev
```

---

## 3. 프로덕션 Docker Compose

### 3.1 docker-compose.prod.yml

```yaml
version: '3.8'

services:
  backend:
    image: tableorder-api:${VERSION:-latest}
    build:
      context: .
      dockerfile: Dockerfile
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - DEBUG=false
      - LOG_LEVEL=INFO
      - CORS_ORIGINS=${CORS_ORIGINS}
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - tableorder_network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - tableorder_network

networks:
  tableorder_network:
    driver: bridge
```

---

## 4. Nginx 설정

### 4.1 nginx.conf

```nginx
# nginx/nginx.conf

worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 로깅 포맷
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # 성능 최적화
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/xml application/xml+rss text/javascript;

    # 업스트림 (백엔드 서버)
    upstream backend {
        least_conn;
        server backend:8000 weight=1 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP -> HTTPS 리다이렉트
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS 서버
    server {
        listen 443 ssl http2;
        server_name _;

        # SSL 설정
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # 보안 헤더
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API 프록시
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 타임아웃 설정
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # SSE 엔드포인트 (긴 타임아웃)
        location /api/v1/admin/orders/stream {
            proxy_pass http://backend/api/v1/admin/orders/stream;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Connection '';
            
            # SSE를 위한 설정
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 86400s;  # 24시간
            chunked_transfer_encoding off;
        }

        # 헬스 체크
        location /health {
            proxy_pass http://backend/health;
            proxy_http_version 1.1;
        }
    }
}
```

---

## 5. 환경별 설정

### 5.1 환경 변수 템플릿

```bash
# .env.production.template

# 데이터베이스 (프로덕션)
DATABASE_URL=postgresql+asyncpg://user:password@db-host:5432/tableorder_prod
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=20

# 보안 (반드시 변경!)
JWT_SECRET_KEY=<generate-secure-256bit-key>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=16

# 서버
DEBUG=false
LOG_LEVEL=INFO

# CORS (프로덕션 도메인)
CORS_ORIGINS=https://order.example.com,https://admin.example.com

# SSE
SSE_HEARTBEAT_INTERVAL=30
SSE_MAX_CONNECTIONS_PER_STORE=100
```

### 5.2 환경별 차이점

| 설정 | Development | Staging | Production |
|-----|-------------|---------|------------|
| DEBUG | true | false | false |
| LOG_LEVEL | DEBUG | INFO | INFO |
| DB_POOL_SIZE | 5 | 10 | 20 |
| Workers | 1 (reload) | 2 | 4 |
| SSL | 없음 | 자체 서명 | 정식 인증서 |
| Replicas | 1 | 1 | 2+ |

---

## 6. 배포 스크립트

### 6.1 배포 스크립트 (deploy.sh)

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

VERSION=${1:-latest}
ENV=${2:-production}

echo "🚀 Deploying Table Order Service v${VERSION} to ${ENV}..."

# 1. 이미지 빌드
echo "📦 Building Docker image..."
docker build -t tableorder-api:${VERSION} .

# 2. 마이그레이션 실행
echo "📦 Running database migrations..."
docker run --rm \
    --env-file .env.${ENV} \
    tableorder-api:${VERSION} \
    alembic upgrade head

# 3. 서비스 배포
echo "🔄 Deploying services..."
VERSION=${VERSION} docker-compose -f docker-compose.prod.yml up -d --scale backend=2

# 4. 헬스 체크
echo "🏥 Checking health..."
sleep 10
curl -f http://localhost:8000/health || exit 1

echo "✅ Deployment complete!"
```

---

## 7. 리소스 요구사항

### 7.1 최소 사양 (단일 매장)

| 구성 요소 | CPU | Memory | Storage |
|----------|-----|--------|---------|
| Backend (x2) | 0.5 core | 256MB | - |
| PostgreSQL | 1 core | 512MB | 10GB |
| Nginx | 0.25 core | 128MB | - |
| **합계** | 2.25 core | 1.1GB | 10GB |

### 7.2 권장 사양 (다중 매장)

| 구성 요소 | CPU | Memory | Storage |
|----------|-----|--------|---------|
| Backend (x4) | 1 core | 512MB | - |
| PostgreSQL | 2 core | 2GB | 50GB |
| Nginx | 0.5 core | 256MB | - |
| **합계** | 6.5 core | 4.3GB | 50GB |
