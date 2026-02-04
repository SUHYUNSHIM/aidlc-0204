# 기여 가이드

테이블 오더 프로젝트에 기여해주셔서 감사합니다! 🎉

## 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/table-order-customer-frontend.git
cd table-order-customer-frontend
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

```bash
cp .env.example .env
```

### 4. 개발 서버 실행

```bash
npm run dev
```

## 코딩 컨벤션

### TypeScript

- 모든 컴포넌트는 TypeScript로 작성
- `any` 타입 사용 금지
- 명시적 타입 정의 권장

### 네이밍

- 컴포넌트: PascalCase (예: `MenuBrowser.tsx`)
- 함수/변수: camelCase (예: `fetchMenus`)
- 상수: UPPER_SNAKE_CASE (예: `API_BASE_URL`)
- CSS 클래스: kebab-case (예: `menu-item`)

### 파일 구조

```
src/
├── components/
│   └── ComponentName/
│       ├── ComponentName.tsx
│       └── ComponentName.test.tsx
```

### 컴포넌트 작성 규칙

```typescript
// ✅ Good
export function MenuBrowser(): JSX.Element {
  const { data, isLoading } = useMenus();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>{/* ... */}</div>;
}

// ❌ Bad
export default function MenuBrowser() {
  // ...
}
```

## 커밋 메시지

### 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 타입

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스 또는 도구 변경

### 예시

```
feat(menu): 메뉴 검색 기능 추가

- 메뉴 이름으로 검색 가능
- 실시간 필터링 적용

Closes #123
```

## Pull Request

### PR 생성 전 체크리스트

- [ ] 코드가 빌드되는지 확인 (`npm run build`)
- [ ] 테스트가 통과하는지 확인 (`npm run test`)
- [ ] 린트 에러가 없는지 확인
- [ ] 타입 에러가 없는지 확인 (`tsc --noEmit`)
- [ ] 변경사항을 문서화했는지 확인

### PR 템플릿

```markdown
## 변경 사항

- 

## 테스트

- [ ] 단위 테스트 추가/수정
- [ ] 수동 테스트 완료

## 스크린샷 (UI 변경 시)

## 관련 이슈

Closes #
```

## 테스트 작성

### 단위 테스트

```typescript
import { render, screen } from '@testing-library/react';
import { MenuBrowser } from './MenuBrowser';

describe('MenuBrowser', () => {
  it('메뉴 목록을 렌더링한다', () => {
    render(<MenuBrowser />);
    expect(screen.getByText('메뉴')).toBeInTheDocument();
  });
});
```

### 테스트 실행

```bash
# 전체 테스트
npm run test

# Watch 모드
npm run test -- --watch

# 커버리지
npm run test:coverage
```

## 코드 리뷰

### 리뷰어 가이드

- 코드 품질 확인
- 성능 이슈 확인
- 보안 취약점 확인
- 접근성 확인
- 반응형 디자인 확인

### 리뷰이 가이드

- 피드백에 열린 자세로 대응
- 변경 이유 명확히 설명
- 요청사항 신속히 반영

## 질문이나 도움이 필요하신가요?

- 이슈 생성: [GitHub Issues](https://github.com/your-org/table-order-customer-frontend/issues)
- 디스커션: [GitHub Discussions](https://github.com/your-org/table-order-customer-frontend/discussions)

감사합니다! 🙏
