# 설치 가이드

## 시스템 요구사항

- **Node.js**: 18.x 이상
- **npm**: 9.x 이상
- **운영체제**: Windows, macOS, Linux

## 설치 단계

### 1. Node.js 설치 확인

```bash
node --version  # v18.18.0 이상
npm --version   # v9.0.0 이상
```

Node.js가 설치되어 있지 않다면 [nodejs.org](https://nodejs.org)에서 다운로드하세요.

### 2. 프로젝트 클론 (또는 압축 해제)

```bash
# Git 클론
git clone <repository-url>
cd customer-frontend

# 또는 압축 파일 해제 후
cd customer-frontend
```

### 3. 의존성 설치

```bash
npm install
```

설치 시간: 약 2-3분 (인터넷 속도에 따라 다름)

### 4. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일을 열어 필요한 값을 설정:

```env
# API 엔드포인트 (실제 API 서버 주소로 변경)
VITE_API_BASE_URL=https://api.yourdomain.com

# Mock 모드 (개발 시 true, 프로덕션 시 false)
VITE_USE_MOCK=true

# 암호화 키 (랜덤 문자열로 변경)
VITE_ENCRYPTION_KEY=your-secret-key-here
```

### 5. 개발 서버 실행

```bash
npm run dev
```

성공 메시지:
```
VITE v5.4.21  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

브라우저에서 http://localhost:5173 접속

### 6. 빌드 테스트 (선택사항)

```bash
npm run build
```

성공 시 `dist/` 디렉토리에 빌드 파일 생성

## 문제 해결

### 포트 충돌 (Port 5173 already in use)

```bash
# 다른 포트로 실행
npm run dev -- --port 3000
```

### 의존성 설치 오류

```bash
# 캐시 삭제 후 재설치
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### TypeScript 오류

```bash
# TypeScript 타입 체크
npx tsc --noEmit
```

### 빌드 오류

```bash
# Vite 캐시 삭제
rm -rf node_modules/.vite
npm run build
```

## 다음 단계

설치가 완료되었다면:

1. [QUICK_START.md](./QUICK_START.md) - 빠른 시작 가이드
2. [README.md](./README.md) - 전체 프로젝트 문서
3. Mock 데이터로 테스트 시작

## 도움이 필요하신가요?

- [GitHub Issues](https://github.com/your-org/table-order-customer-frontend/issues)
- [문서](./README.md)

설치 완료! 🎉
