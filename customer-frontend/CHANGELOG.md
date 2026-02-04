# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-02-04

### Added

#### 기능
- 테이블 로그인 기능 (세션 기반 인증)
- 자동 로그인 (세션 복원)
- 메뉴 탐색 및 카테고리별 필터링
- 장바구니 관리 (추가, 수정, 삭제)
- 주문 생성 및 확인
- 주문 내역 조회 (5분 자동 갱신)
- 로그아웃 기능

#### UI/UX
- 세련된 디자인 시스템 (CSS Variables 기반)
- Inter 폰트 적용 (Google Fonts)
- 그라디언트 효과 및 애니메이션
- 완벽한 반응형 디자인 (모바일/태블릿/데스크톱)
- 로딩 상태 표시
- 에러 메시지 표시
- 토스트 알림
- 호버/액티브 상태 피드백

#### 성능
- 코드 스플리팅 (5개 vendor 청크)
- 이미지 Lazy Loading
- React Query 캐싱
- 로컬 스토리지 기반 장바구니 영속성
- 최적화된 번들 크기 (~116KB gzipped)

#### 보안
- 세션 기반 인증
- 로컬 스토리지 암호화
- 환경 변수 관리
- TypeScript 타입 안전성
- XSS 방지

#### 개발 환경
- React 18 + TypeScript
- Vite 빌드 도구
- React Router v6
- React Query (TanStack Query)
- Axios HTTP 클라이언트
- Vitest 테스트 프레임워크
- ESLint + TypeScript

#### 문서화
- README.md (프로젝트 소개 및 사용법)
- DEPLOYMENT.md (배포 가이드)
- CONTRIBUTING.md (기여 가이드)
- PROJECT_SUMMARY.md (프로젝트 요약)
- MERGE_CHECKLIST.md (병합 체크리스트)
- CHANGELOG.md (변경 이력)

### Changed
- 로그아웃 후 로그인 페이지로 자동 리다이렉트
- 모든 페이지에 인증 보호 추가
- 인라인 스타일을 CSS 클래스로 변경

### Fixed
- 로그아웃 후 리다이렉트 누락 문제 해결
- 인증되지 않은 사용자 접근 제어
- 스타일 일관성 문제 해결

### Security
- 세션 만료 자동 처리
- 암호화된 로컬 스토리지
- HTTPS 권장

## [Unreleased]

### Planned
- PWA 지원 (Service Worker, 오프라인 모드)
- 다국어 지원 (i18n)
- 접근성 개선 (ARIA, 키보드 네비게이션)
- E2E 테스트 추가
- 성능 모니터링 (Sentry, Google Analytics)
- 다크 모드 지원

---

[1.0.0]: https://github.com/your-org/table-order-customer-frontend/releases/tag/v1.0.0
