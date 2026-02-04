# 배포 가이드

## 프로덕션 배포

### 1. 환경 변수 설정

프로덕션 환경에 맞는 `.env` 파일을 생성합니다:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCK=false
VITE_ENCRYPTION_KEY=your-production-secret-key
```

### 2. 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 3. 배포 옵션

#### Option 1: Vercel

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

#### Option 2: Netlify

```bash
# Netlify CLI 설치
npm i -g netlify-cli

# 배포
netlify deploy --prod --dir=dist
```

#### Option 3: AWS S3 + CloudFront

```bash
# AWS CLI로 S3에 업로드
aws s3 sync dist/ s3://your-bucket-name --delete

# CloudFront 캐시 무효화
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Option 4: Nginx

`dist/` 디렉토리의 내용을 Nginx 서버의 웹 루트에 복사:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/table-order;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 성능 최적화

### 1. 이미지 최적화

- 메뉴 이미지는 WebP 포맷 사용 권장
- 이미지 크기: 최대 800x600px
- CDN 사용 권장

### 2. 캐싱 전략

- HTML: no-cache
- JS/CSS: 1년 캐싱 (파일명에 해시 포함)
- 이미지: 1년 캐싱

### 3. 번들 크기 최적화

현재 번들 크기:
- Vendor (React): ~155KB (gzip: 50KB)
- Vendor (Crypto): ~70KB (gzip: 26KB)
- Vendor (Query): ~50KB (gzip: 15KB)
- App Code: ~28KB (gzip: 10KB)

## 모니터링

### 권장 도구

- **Sentry**: 에러 트래킹
- **Google Analytics**: 사용자 분석
- **Lighthouse**: 성능 측정

### 성능 목표

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 90

## 보안 체크리스트

- [ ] HTTPS 사용
- [ ] CSP (Content Security Policy) 설정
- [ ] 환경 변수 암호화
- [ ] API 엔드포인트 CORS 설정
- [ ] Rate Limiting 적용

## 롤백 절차

문제 발생 시 이전 버전으로 롤백:

```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# S3 (버전 관리 활성화 필요)
aws s3 sync s3://your-bucket-name-backup/ s3://your-bucket-name/
```
