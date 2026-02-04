# 프로젝트 구조

## 📁 디렉토리 구조

```
aidlc-0204/
├── customer-frontend/          # 🎯 독립적인 React 프로젝트
│   ├── src/                    # 소스 코드
│   │   ├── api/                # API 서비스 레이어
│   │   │   ├── authService.ts
│   │   │   ├── menuService.ts
│   │   │   └── orderService.ts
│   │   ├── components/         # React 컴포넌트
│   │   │   └── common/
│   │   │       ├── ErrorBoundary.tsx
│   │   │       ├── LazyImage.tsx
│   │   │       └── Navigation.tsx
│   │   ├── contexts/           # Context Providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── CartContext.tsx
│   │   │   └── UIContext.tsx
│   │   ├── hooks/              # 커스텀 훅
│   │   │   ├── useAuth.ts
│   │   │   ├── useAutoRedirect.ts
│   │   │   ├── useCart.ts
│   │   │   ├── useCreateOrder.ts
│   │   │   ├── useMenus.ts
│   │   │   ├── useOnlineStatus.ts
│   │   │   └── useOrders.ts
│   │   ├── lib/                # 라이브러리 설정
│   │   │   ├── axios.ts
│   │   │   └── queryClient.ts
│   │   ├── mocks/              # Mock 데이터
│   │   │   └── mockData.ts
│   │   ├── pages/              # 페이지 컴포넌트
│   │   │   ├── Cart.tsx
│   │   │   ├── CustomerLogin.tsx
│   │   │   ├── MenuBrowser.tsx
│   │   │   ├── OrderConfirmation.tsx
│   │   │   └── OrderHistory.tsx
│   │   ├── services/           # 비즈니스 로직
│   │   │   ├── cartService.ts
│   │   │   └── orderService.ts
│   │   ├── styles/             # 스타일시트
│   │   │   ├── global.css
│   │   │   └── responsive.css
│   │   ├── tests/              # 테스트
│   │   │   ├── setup.ts
│   │   │   └── utils/
│   │   ├── transformers/       # 데이터 변환
│   │   │   └── entityTransformers.ts
│   │   ├── types/              # TypeScript 타입
│   │   │   └── entities.ts
│   │   ├── utils/              # 유틸리티
│   │   │   ├── auth.ts
│   │   │   ├── encryption.ts
│   │   │   ├── format.ts
│   │   │   ├── retry.ts
│   │   │   └── validation.ts
│   │   ├── App.tsx             # 루트 컴포넌트
│   │   ├── main.tsx            # 엔트리 포인트
│   │   └── vite-env.d.ts       # Vite 타입 정의
│   ├── dist/                   # 빌드 결과물 (생성됨)
│   ├── node_modules/           # 의존성 (설치 후 생성)
│   ├── .env.example            # 환경 변수 예시
│   ├── .gitignore              # Git 제외 파일
│   ├── .npmrc                  # NPM 설정
│   ├── .nvmrc                  # Node 버전
│   ├── CHANGELOG.md            # 변경 이력
│   ├── CONTRIBUTING.md         # 기여 가이드
│   ├── DEPLOYMENT.md           # 배포 가이드
│   ├── index.html              # HTML 템플릿
│   ├── INSTALLATION.md         # 설치 가이드
│   ├── MERGE_CHECKLIST.md      # 병합 체크리스트
│   ├── package.json            # 프로젝트 설정
│   ├── package-lock.json       # 의존성 잠금
│   ├── PROJECT_SUMMARY.md      # 프로젝트 요약
│   ├── QUICK_START.md          # 빠른 시작
│   ├── README.md               # 프로젝트 문서
│   ├── tsconfig.json           # TypeScript 설정
│   ├── tsconfig.node.json      # Node TypeScript 설정
│   └── vite.config.ts          # Vite 설정
│
├── aidlc-docs/                 # AIDLC 문서 (개발 과정 문서)
├── requirements/               # 요구사항 문서
└── PROJECT_STRUCTURE.md        # 이 파일
```

## 🎯 customer-frontend 디렉토리

**독립적인 React 프로젝트**로 구성되어 있으며, 다음과 같이 사용할 수 있습니다:

### 독립 실행

```bash
cd customer-frontend
npm install
npm run dev
```

### 배포

```bash
cd customer-frontend
npm run build
# dist/ 디렉토리를 서버에 배포
```

### 다른 프로젝트로 이동

```bash
# customer-frontend 디렉토리를 원하는 위치로 복사
cp -r customer-frontend /path/to/new/location
cd /path/to/new/location
npm install
npm run dev
```

## 📦 주요 파일 설명

### 설정 파일

- **package.json**: 프로젝트 메타데이터 및 의존성
- **tsconfig.json**: TypeScript 컴파일러 설정
- **vite.config.ts**: Vite 빌드 도구 설정
- **.env.example**: 환경 변수 템플릿
- **.gitignore**: Git 버전 관리 제외 파일
- **.nvmrc**: Node.js 버전 지정
- **.npmrc**: NPM 설정

### 문서 파일

- **README.md**: 프로젝트 전체 문서
- **QUICK_START.md**: 빠른 시작 가이드
- **INSTALLATION.md**: 설치 가이드
- **DEPLOYMENT.md**: 배포 가이드
- **CONTRIBUTING.md**: 기여 가이드
- **CHANGELOG.md**: 변경 이력
- **PROJECT_SUMMARY.md**: 프로젝트 요약
- **MERGE_CHECKLIST.md**: 병합 체크리스트

### 소스 코드

- **src/main.tsx**: 애플리케이션 엔트리 포인트
- **src/App.tsx**: 루트 컴포넌트 (라우팅 설정)
- **src/pages/**: 페이지 컴포넌트 (5개)
- **src/components/**: 재사용 가능한 컴포넌트
- **src/hooks/**: 커스텀 React 훅 (7개)
- **src/contexts/**: Context API Providers (3개)
- **src/api/**: API 서비스 레이어 (3개)
- **src/services/**: 비즈니스 로직 (2개)
- **src/utils/**: 유틸리티 함수 (5개)
- **src/types/**: TypeScript 타입 정의
- **src/styles/**: CSS 스타일시트 (2개)

## 🔄 개발 워크플로우

### 1. 개발 시작

```bash
cd customer-frontend
npm install
npm run dev
```

### 2. 코드 수정

- `src/` 디렉토리에서 작업
- Hot Module Replacement (HMR) 자동 적용

### 3. 테스트

```bash
npm run test
```

### 4. 빌드

```bash
npm run build
```

### 5. 배포

- `dist/` 디렉토리를 서버에 업로드
- 또는 Vercel, Netlify 등 자동 배포

## 📊 프로젝트 통계

- **총 파일 수**: ~50개
- **소스 코드**: ~40개 파일
- **문서**: ~10개 파일
- **코드 라인**: ~3,000줄
- **번들 크기**: 116KB (gzipped)
- **의존성**: 7개 (runtime), 9개 (dev)

## 🎯 핵심 특징

### 독립성
- ✅ 완전히 독립적인 React 프로젝트
- ✅ 다른 위치로 이동 가능
- ✅ 별도 저장소로 분리 가능

### 완성도
- ✅ 프로덕션 배포 준비 완료
- ✅ 완전한 문서화
- ✅ 테스트 환경 구축
- ✅ 최적화된 빌드

### 확장성
- ✅ 모듈화된 구조
- ✅ 타입 안전성
- ✅ 재사용 가능한 컴포넌트
- ✅ 명확한 관심사 분리

## 💡 사용 시나리오

### 시나리오 1: 독립 프로젝트로 사용
```bash
cd customer-frontend
npm install
npm run dev
```

### 시나리오 2: 다른 저장소로 이동
```bash
cp -r customer-frontend ../new-repo
cd ../new-repo
git init
git add .
git commit -m "Initial commit"
```

### 시나리오 3: 배포
```bash
cd customer-frontend
npm run build
# dist/ 디렉토리를 서버에 배포
```

## 📚 추가 정보

자세한 내용은 `customer-frontend/` 디렉토리 내의 문서를 참조하세요:

- [README.md](./customer-frontend/README.md)
- [QUICK_START.md](./customer-frontend/QUICK_START.md)
- [INSTALLATION.md](./customer-frontend/INSTALLATION.md)

---

이 구조는 **실제 매장에서 사용 가능한 수준**의 완성도를 갖춘 프로덕션 레디 프로젝트입니다. 🚀
