# 🍕 테이블 오더 - 스마트 레스토랑 주문 시스템

실제 매장에서 사용 가능한 고객용 테이블 오더 프론트엔드 애플리케이션입니다.

## ✨ 주요 기능

- 🔐 **테이블 자동 로그인** - 세션 기반 인증 및 자동 로그인
- 📱 **메뉴 탐색** - 카테고리별 필터링 및 실시간 재고 확인
- 🛒 **장바구니 관리** - 로컬 스토리지 기반 장바구니 (새로고침 후에도 유지)
- 📦 **주문 생성** - 실시간 주문 생성 및 확인
- 📜 **주문 내역** - 세션별 주문 내역 조회 (5분 자동 갱신)
- 🎨 **세련된 UI/UX** - 모던하고 직관적인 인터페이스
- 📱 **완벽한 반응형** - 모바일, 태블릿, 데스크톱 최적화
- ⚡ **빠른 성능** - Vite 기반 빌드 및 코드 스플리팅

## 🛠 기술 스택

### Core
- **React 18** - 최신 React 기능 활용
- **TypeScript** - 타입 안전성 보장
- **Vite** - 초고속 빌드 도구

### State Management
- **React Query (TanStack Query)** - 서버 상태 관리 및 캐싱
- **React Context** - 전역 상태 관리 (Auth, Cart, UI)

### Routing & HTTP
- **React Router v6** - 클라이언트 사이드 라우팅
- **Axios** - HTTP 클라이언트

### Security & Utils
- **Crypto-JS** - 데이터 암호화
- **date-fns** - 날짜 포맷팅

### Testing
- **Vitest** - 단위 테스트 프레임워크
- **Testing Library** - React 컴포넌트 테스트

## 📦 설치 방법

```bash
# 의존성 설치
npm install
```

## ⚙️ 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 설정하세요.

```bash
cp .env.example .env
```

### 환경 변수 설명

```env
# API 엔드포인트
VITE_API_BASE_URL=https://api.example.com

# Mock 모드 (개발용)
VITE_USE_MOCK=true

# 암호화 키
VITE_ENCRYPTION_KEY=your-secret-key-here
```

## 🚀 실행 방법

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 프로덕션 미리보기

```bash
npm run preview
```

## 🧪 테스트

### 테스트 실행

```bash
npm run test
```

### 테스트 UI (인터랙티브)

```bash
npm run test:ui
```

### 커버리지 확인

```bash
npm run test:coverage
```

## 📁 프로젝트 구조

```
customer-frontend/
├── src/
│   ├── api/              # API 서비스 레이어
│   ├── components/       # React 컴포넌트
│   │   └── common/       # 공통 컴포넌트
│   ├── contexts/         # Context Providers
│   ├── hooks/            # 커스텀 훅
│   ├── lib/              # 라이브러리 설정
│   ├── mocks/            # Mock 데이터 (개발용)
│   ├── pages/            # 페이지 컴포넌트
│   ├── services/         # 비즈니스 로직
│   ├── styles/           # 스타일시트
│   ├── tests/            # 테스트 설정 및 유틸
│   ├── transformers/     # 데이터 변환 로직
│   ├── types/            # TypeScript 타입 정의
│   ├── utils/            # 유틸리티 함수
│   ├── App.tsx           # 루트 컴포넌트
│   └── main.tsx          # 엔트리 포인트
├── index.html            # HTML 템플릿
├── package.json          # 프로젝트 설정
├── tsconfig.json         # TypeScript 설정
├── vite.config.ts        # Vite 설정
├── .env.example          # 환경 변수 예시
├── .gitignore            # Git 제외 파일
├── README.md             # 프로젝트 문서
├── QUICK_START.md        # 빠른 시작 가이드
├── DEPLOYMENT.md         # 배포 가이드
├── CONTRIBUTING.md       # 기여 가이드
└── CHANGELOG.md          # 변경 이력
```

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: `#2563eb` (Blue)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)

### 타이포그래피
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 400, 500, 600, 700, 800

### 간격 시스템
- CSS Variables 기반 일관된 간격 시스템
- `--spacing-xs` ~ `--spacing-2xl`

## 🔒 보안 기능

- ✅ 세션 기반 인증
- ✅ 로컬 스토리지 암호화
- ✅ XSS 방지
- ✅ CSRF 토큰 지원
- ✅ 세션 만료 자동 처리

## 📱 반응형 디자인

- **모바일**: < 768px
- **태블릿**: 768px ~ 1024px
- **데스크톱**: > 1024px
- **대형 데스크톱**: > 1280px

## 🌐 브라우저 지원

- Chrome (최신 2개 버전)
- Firefox (최신 2개 버전)
- Safari (최신 2개 버전)
- Edge (최신 2개 버전)

## 📊 성능 지표

- **번들 크기**: ~116KB (gzipped)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90

## 📚 추가 문서

- [QUICK_START.md](./QUICK_START.md) - 빠른 시작 가이드
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 배포 가이드
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 기여 가이드
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 프로젝트 요약
- [CHANGELOG.md](./CHANGELOG.md) - 변경 이력

## 📄 라이선스

MIT License

## 👥 기여

이슈 및 PR은 언제나 환영합니다!

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

Made with ❤️ for better restaurant experience
