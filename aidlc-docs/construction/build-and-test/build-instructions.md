# Build Instructions - Customer Frontend

## 프로젝트 정보
- **유닛**: Customer Frontend
- **기술 스택**: React 18 + TypeScript + Vite
- **패키지 매니저**: npm

---

## 1. 의존성 설치

### 1.1 Node.js 버전 확인
```bash
node --version
# 권장: v18.x 이상
```

### 1.2 npm 의존성 설치
```bash
npm install
```

**예상 설치 패키지**:
- react, react-dom (^18.2.0)
- react-router-dom (^6.20.0)
- @tanstack/react-query (^5.0.0)
- axios (^1.6.0)
- crypto-js (^4.2.0)
- date-fns (^3.0.0)

**개발 의존성**:
- typescript (^5.0.0)
- vite (^5.0.0)
- @vitejs/plugin-react (^4.0.0)
- @types/react, @types/react-dom
- @types/crypto-js

---

## 2. 환경 변수 설정

### 2.1 .env 파일 생성
```bash
cp .env.example .env
```

### 2.2 환경 변수 설정
`.env` 파일을 열고 다음 값을 설정:

```env
# API 서버 URL
VITE_API_BASE_URL=http://localhost:8000

# 암호화 키 (32자 이상 권장)
VITE_ENCRYPTION_KEY=your-secret-encryption-key-here

# 기타 설정
VITE_APP_NAME=Table Order Service
```

**중요**: 프로덕션 환경에서는 반드시 강력한 암호화 키를 사용하세요.

---

## 3. 개발 서버 실행

### 3.1 개발 모드 실행
```bash
npm run dev
```

**예상 출력**:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3.2 브라우저에서 확인
- URL: `http://localhost:5173/`
- 자동 새로고침 (HMR) 활성화

---

## 4. 프로덕션 빌드

### 4.1 빌드 실행
```bash
npm run build
```

**빌드 프로세스**:
1. TypeScript 타입 체크
2. Vite 번들링
3. 코드 최적화 (minification, tree-shaking)
4. 정적 파일 생성 (`dist/` 디렉토리)

**예상 출력**:
```
vite v5.x.x building for production...
✓ xxx modules transformed.
dist/index.html                  x.xx kB
dist/assets/index-xxxxx.css      x.xx kB │ gzip: x.xx kB
dist/assets/index-xxxxx.js     xxx.xx kB │ gzip: xx.xx kB
✓ built in x.xxs
```

### 4.2 빌드 결과 확인
```bash
ls -lh dist/
```

**예상 파일 구조**:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].css
│   └── index-[hash].js
└── vite.svg (favicon)
```

---

## 5. 프로덕션 빌드 미리보기

### 5.1 미리보기 서버 실행
```bash
npm run preview
```

**예상 출력**:
```
➜  Local:   http://localhost:4173/
➜  Network: use --host to expose
```

### 5.2 브라우저에서 확인
- URL: `http://localhost:4173/`
- 프로덕션 빌드 동작 확인

---

## 6. 타입 체크

### 6.1 TypeScript 타입 체크
```bash
npx tsc --noEmit
```

**예상 결과**: 에러 없음

---

## 7. 코드 품질 검사 (선택 사항)

### 7.1 ESLint 실행 (설정된 경우)
```bash
npm run lint
```

### 7.2 Prettier 실행 (설정된 경우)
```bash
npm run format
```

---

## 8. 빌드 문제 해결

### 8.1 의존성 문제
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 8.2 캐시 문제
```bash
# Vite 캐시 삭제
rm -rf node_modules/.vite
npm run dev
```

### 8.3 포트 충돌
```bash
# 다른 포트로 실행
npm run dev -- --port 3000
```

---

## 9. 빌드 최적화 확인

### 9.1 번들 크기 분석
```bash
npm run build -- --mode analyze
```

### 9.2 성능 메트릭 확인
- Lighthouse 실행 (Chrome DevTools)
- Core Web Vitals 확인

---

## 10. 배포 준비

### 10.1 프로덕션 체크리스트
- [ ] 환경 변수 설정 확인
- [ ] API 엔드포인트 URL 확인
- [ ] 암호화 키 강도 확인
- [ ] 빌드 에러 없음
- [ ] 타입 체크 통과
- [ ] 브라우저 호환성 테스트
- [ ] 성능 최적화 확인

### 10.2 배포 방법
**정적 호스팅** (Vercel, Netlify, GitHub Pages 등):
```bash
# dist/ 디렉토리를 배포
npm run build
# dist/ 폴더를 호스팅 서비스에 업로드
```

**Docker 배포**:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 빌드 성공 기준
- ✅ `npm install` 에러 없음
- ✅ `npm run build` 성공
- ✅ `npx tsc --noEmit` 에러 없음
- ✅ `dist/` 디렉토리 생성됨
- ✅ `npm run preview`로 앱 실행 가능

---

**작성일**: 2026-02-04
**작성자**: AI-DLC System
