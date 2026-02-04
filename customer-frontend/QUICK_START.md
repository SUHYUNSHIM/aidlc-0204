# 🚀 빠른 시작 가이드

## 1️⃣ 설치

```bash
# 저장소 클론
git clone <repository-url>
cd table-order-customer-frontend

# 의존성 설치
npm install
```

## 2️⃣ 환경 설정

```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일 내용:
```env
VITE_API_BASE_URL=https://api.example.com
VITE_USE_MOCK=true
VITE_ENCRYPTION_KEY=your-secret-key
```

## 3️⃣ 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 4️⃣ Mock 데이터로 테스트

### 로그인 정보
- **매장 ID**: `store-1`
- **테이블 번호**: `1` (또는 임의의 숫자)
- **비밀번호**: `password` 또는 `1234`

### 테스트 시나리오

1. **로그인**
   - 위 정보로 로그인
   - 자동으로 메뉴 페이지로 이동

2. **메뉴 탐색**
   - 카테고리 필터 사용 (전체, 메인, 사이드, 음료, 디저트)
   - 메뉴 아이템 확인
   - 품절 메뉴 확인

3. **장바구니**
   - 메뉴 추가
   - 수량 조절
   - 항목 삭제
   - 장바구니 비우기

4. **주문**
   - 주문하기 버튼 클릭
   - 주문 확인 페이지 확인
   - 5초 후 자동 리다이렉트

5. **주문 내역**
   - 주문 내역 메뉴 클릭
   - 과거 주문 확인
   - 주문 상태 확인

6. **로그아웃**
   - 로그아웃 버튼 클릭
   - 로그인 페이지로 리다이렉트

## 5️⃣ 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 6️⃣ 테스트

```bash
# 테스트 실행
npm run test

# 테스트 UI
npm run test:ui

# 커버리지
npm run test:coverage
```

## 📱 반응형 테스트

### 브라우저 개발자 도구
1. F12 또는 Ctrl+Shift+I (Windows) / Cmd+Option+I (Mac)
2. 디바이스 툴바 토글 (Ctrl+Shift+M / Cmd+Shift+M)
3. 다양한 디바이스 크기로 테스트

### 권장 테스트 크기
- **모바일**: 375x667 (iPhone SE)
- **태블릿**: 768x1024 (iPad)
- **데스크톱**: 1920x1080

## 🎨 디자인 시스템

### 색상
- Primary: `#2563eb` (Blue)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)

### 폰트
- Inter (Google Fonts)
- Weights: 400, 500, 600, 700, 800

## 🔧 문제 해결

### 포트 충돌
```bash
# 다른 포트로 실행
npm run dev -- --port 3000
```

### 캐시 문제
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# Vite 캐시 삭제
rm -rf .vite
```

### 빌드 오류
```bash
# TypeScript 타입 체크
npx tsc --noEmit

# 린트 체크
npx eslint src/
```

## 📚 추가 문서

- [README.md](./README.md) - 전체 프로젝트 문서
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 배포 가이드
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 기여 가이드
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 프로젝트 요약

## 💡 팁

- Mock 모드는 `.env`의 `VITE_USE_MOCK=true`로 제어
- 장바구니는 로컬 스토리지에 저장되어 새로고침 후에도 유지
- 세션은 1시간 동안 유효
- 주문 내역은 5분마다 자동 갱신

## 🆘 도움이 필요하신가요?

- [GitHub Issues](https://github.com/your-org/table-order-customer-frontend/issues)
- [GitHub Discussions](https://github.com/your-org/table-order-customer-frontend/discussions)

즐거운 개발 되세요! 🎉
