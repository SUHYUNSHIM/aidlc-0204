# Test Plan for Unit 2: Admin Frontend

## Unit Overview
- **Unit**: unit2-admin-frontend
- **Stories**: US-009 ~ US-022 (14개 스토리)
- **Requirements**: 관리자 인증, 실시간 주문 모니터링, 테이블 관리, 메뉴 관리

---

## 1. Hooks Layer Tests

### useAuth Hook

#### TC-U2-001: 로그인 성공
- **Given**: 유효한 storeId, username, password
- **When**: login() 호출
- **Then**: isAuthenticated = true, adminUser 설정, localStorage에 토큰 저장
- **Story**: US-009
- **Status**: ⬜ Not Started

#### TC-U2-002: 로그인 실패 (401)
- **Given**: 잘못된 인증 정보
- **When**: login() 호출
- **Then**: 에러 throw, isAuthenticated = false
- **Story**: US-009
- **Status**: ⬜ Not Started

#### TC-U2-003: 로그아웃
- **Given**: 로그인된 상태
- **When**: logout() 호출
- **Then**: isAuthenticated = false, localStorage 클리어
- **Story**: US-009
- **Status**: ⬜ Not Started

#### TC-U2-004: 토큰 자동 갱신
- **Given**: 토큰 만료 5분 전
- **When**: 1분 경과
- **Then**: refresh-token API 호출, 새 토큰 저장
- **Story**: US-009
- **Status**: ⬜ Not Started

---

### useSSE Hook

#### TC-U2-005: SSE 연결 성공
- **Given**: 유효한 storeId
- **When**: useSSE(storeId) 호출
- **Then**: connected = true, EventSource 생성
- **Story**: US-010, US-013
- **Status**: ⬜ Not Started

#### TC-U2-006: SSE 연결 실패 후 재연결
- **Given**: SSE 연결 끊김
- **When**: onerror 발생
- **Then**: 지수 백오프로 재연결 시도 (최대 5회)
- **Story**: US-013
- **Status**: ⬜ Not Started

#### TC-U2-007: SSE 재연결 5회 실패 후 폴링 모드
- **Given**: SSE 재연결 5회 실패
- **When**: 6번째 실패
- **Then**: pollingEnabled = true
- **Story**: US-013
- **Status**: ⬜ Not Started

#### TC-U2-008: SSE 이벤트 처리 (order_created)
- **Given**: SSE 연결됨
- **When**: order_created 이벤트 수신
- **Then**: React Query 캐시 업데이트, isNew = true
- **Story**: US-010, US-013
- **Status**: ⬜ Not Started

---

## 2. API Client Layer Tests

### orders API

#### TC-U2-009: fetchOrders 성공
- **Given**: 유효한 storeId
- **When**: fetchOrders(storeId) 호출
- **Then**: Order[] 반환
- **Story**: US-010
- **Status**: ⬜ Not Started

#### TC-U2-010: updateOrderStatus 성공
- **Given**: 유효한 orderId, status
- **When**: updateOrderStatus(orderId, status) 호출
- **Then**: 200 OK 응답
- **Story**: US-012
- **Status**: ⬜ Not Started

#### TC-U2-011: deleteOrder 성공
- **Given**: 유효한 orderId
- **When**: deleteOrder(orderId) 호출
- **Then**: 204 No Content 응답
- **Story**: US-015
- **Status**: ⬜ Not Started

---

### menus API

#### TC-U2-012: fetchMenus 성공
- **Given**: 유효한 storeId
- **When**: fetchMenus(storeId) 호출
- **Then**: Menu[] 반환
- **Story**: US-018
- **Status**: ⬜ Not Started

#### TC-U2-013: createMenu 성공
- **Given**: 유효한 menuData
- **When**: createMenu(menuData) 호출
- **Then**: 생성된 Menu 반환
- **Story**: US-019
- **Status**: ⬜ Not Started

#### TC-U2-014: updateMenu 성공
- **Given**: 유효한 menuId, menuData
- **When**: updateMenu(menuId, menuData) 호출
- **Then**: 수정된 Menu 반환
- **Story**: US-020
- **Status**: ⬜ Not Started

#### TC-U2-015: deleteMenu 성공
- **Given**: 유효한 menuId
- **When**: deleteMenu(menuId) 호출
- **Then**: 204 No Content 응답
- **Story**: US-021
- **Status**: ⬜ Not Started

---

### tables API

#### TC-U2-016: createTable 성공
- **Given**: 유효한 tableData
- **When**: createTable(tableData) 호출
- **Then**: 생성된 Table 반환
- **Story**: US-014
- **Status**: ⬜ Not Started

#### TC-U2-017: endTableSession 성공
- **Given**: 유효한 tableId
- **When**: endTableSession(tableId) 호출
- **Then**: 200 OK 응답
- **Story**: US-016
- **Status**: ⬜ Not Started

#### TC-U2-018: fetchTableHistory 성공
- **Given**: 유효한 tableId, page, limit
- **When**: fetchTableHistory(tableId, page, limit) 호출
- **Then**: OrderHistory[] 반환
- **Story**: US-017
- **Status**: ⬜ Not Started

---

## 3. React Query Hooks Layer Tests

### useUpdateOrderStatus

#### TC-U2-019: 낙관적 업데이트 성공
- **Given**: 주문 목록 캐시됨
- **When**: mutate({ orderId, status }) 호출
- **Then**: 즉시 UI 업데이트, API 성공 후 서버 데이터로 동기화
- **Story**: US-012
- **Status**: ⬜ Not Started

#### TC-U2-020: 낙관적 업데이트 실패 시 롤백
- **Given**: 주문 목록 캐시됨
- **When**: mutate 호출 후 API 실패
- **Then**: 이전 상태로 롤백, 에러 메시지 표시
- **Story**: US-012
- **Status**: ⬜ Not Started

---

### useDeleteOrder

#### TC-U2-021: 낙관적 삭제 성공
- **Given**: 주문 목록 캐시됨
- **When**: mutate(orderId) 호출
- **Then**: 즉시 UI에서 제거, API 성공 후 확정
- **Story**: US-015
- **Status**: ⬜ Not Started

---

### useCreateMenu

#### TC-U2-022: 낙관적 생성 성공
- **Given**: 메뉴 목록 캐시됨
- **When**: mutate(menuData) 호출
- **Then**: 즉시 UI에 추가, API 성공 후 서버 데이터로 교체
- **Story**: US-019
- **Status**: ⬜ Not Started

---

## 4. Component Layer Tests

### AdminLogin

#### TC-U2-023: 로그인 폼 렌더링
- **Given**: AdminLogin 컴포넌트 마운트
- **When**: 렌더링
- **Then**: storeId, username, password 입력 필드 표시
- **Story**: US-009
- **Status**: ⬜ Not Started

#### TC-U2-024: 로그인 폼 검증
- **Given**: 빈 필드
- **When**: 제출 버튼 클릭
- **Then**: "모든 필드를 입력해주세요" 에러 표시
- **Story**: US-009
- **Status**: ⬜ Not Started

#### TC-U2-025: 로그인 성공 후 리다이렉트
- **Given**: 유효한 인증 정보 입력
- **When**: 제출 버튼 클릭
- **Then**: /admin/dashboard로 리다이렉트
- **Story**: US-009
- **Status**: ⬜ Not Started

---

### OrderDashboard

#### TC-U2-026: 대시보드 초기 로드
- **Given**: OrderDashboard 마운트
- **When**: 렌더링
- **Then**: 주문 목록 조회, 테이블별 그룹화, 그리드 표시
- **Story**: US-010
- **Status**: ⬜ Not Started

#### TC-U2-027: 신규 주문 강조
- **Given**: SSE로 order_created 이벤트 수신
- **When**: 새 주문 추가
- **Then**: 노란색 배경 3초간 표시
- **Story**: US-010, US-013
- **Status**: ⬜ Not Started

#### TC-U2-028: 테이블 카드 클릭
- **Given**: 테이블 카드 표시됨
- **When**: 카드 클릭
- **Then**: OrderDetailModal 열림
- **Story**: US-011
- **Status**: ⬜ Not Started

---

### TableCard

#### TC-U2-029: 테이블 카드 렌더링
- **Given**: TableCard props 전달
- **When**: 렌더링
- **Then**: 테이블 번호, 총 주문액, 최신 3개 주문 표시
- **Story**: US-010
- **Status**: ⬜ Not Started

#### TC-U2-030: 신규 주문 스타일
- **Given**: isNew = true
- **When**: 렌더링
- **Then**: 노란색 배경 + 애니메이션
- **Story**: US-010
- **Status**: ⬜ Not Started

---

### OrderDetailModal

#### TC-U2-031: 모달 렌더링
- **Given**: open = true, orders 전달
- **When**: 렌더링
- **Then**: 주문 목록, 상태 드롭다운, 삭제 버튼 표시
- **Story**: US-011
- **Status**: ⬜ Not Started

#### TC-U2-032: 주문 상태 변경
- **Given**: 모달 열림
- **When**: 상태 드롭다운 변경
- **Then**: updateOrderStatus 호출, 모달 닫기
- **Story**: US-012
- **Status**: ⬜ Not Started

#### TC-U2-033: 주문 삭제 확인
- **Given**: 모달 열림
- **When**: 삭제 버튼 클릭
- **Then**: 확인 팝업 표시
- **Story**: US-015
- **Status**: ⬜ Not Started

---

### MenuManagement

#### TC-U2-034: 메뉴 목록 렌더링
- **Given**: MenuManagement 마운트
- **When**: 렌더링
- **Then**: 메뉴 목록 표시, 카테고리별 그룹화
- **Story**: US-018
- **Status**: ⬜ Not Started

#### TC-U2-035: 메뉴 추가 폼
- **Given**: "메뉴 추가" 버튼 클릭
- **When**: 폼 표시
- **Then**: 메뉴명, 가격, 설명, 카테고리, 이미지 입력 필드
- **Story**: US-019
- **Status**: ⬜ Not Started

#### TC-U2-036: 메뉴 추가 검증
- **Given**: 빈 메뉴명
- **When**: 제출
- **Then**: "메뉴명을 입력해주세요" 에러
- **Story**: US-019
- **Status**: ⬜ Not Started

---

### TableManagement

#### TC-U2-037: 테이블 생성 폼
- **Given**: "테이블 추가" 버튼 클릭
- **When**: 폼 표시
- **Then**: 테이블 번호, 비밀번호 입력 필드
- **Story**: US-014
- **Status**: ⬜ Not Started

#### TC-U2-038: 세션 종료 확인
- **Given**: "매장 이용 완료" 버튼 클릭
- **When**: 확인 팝업
- **Then**: "테이블 세션을 종료하시겠습니까?" 표시
- **Story**: US-016
- **Status**: ⬜ Not Started

---

## 5. Utility Functions Tests

### groupOrdersByTable

#### TC-U2-039: 주문 그룹화
- **Given**: Order[] (여러 테이블)
- **When**: groupOrdersByTable(orders) 호출
- **Then**: Map<tableId, TableOrders> 반환
- **Story**: US-010
- **Status**: ⬜ Not Started

#### TC-U2-040: 최신 3개 주문 추출
- **Given**: 테이블에 5개 주문
- **When**: groupOrdersByTable 호출
- **Then**: latestOrders에 최신 3개만 포함
- **Story**: US-010
- **Status**: ⬜ Not Started

---

### encodeImageToBase64

#### TC-U2-041: 이미지 인코딩 성공
- **Given**: 500KB 이미지 파일
- **When**: encodeImageToBase64(file) 호출
- **Then**: Base64 문자열 반환
- **Story**: US-019, US-020
- **Status**: ⬜ Not Started

#### TC-U2-042: 이미지 크기 초과
- **Given**: 2MB 이미지 파일
- **When**: encodeImageToBase64(file) 호출
- **Then**: "이미지 크기는 1MB 이하여야 합니다" 에러
- **Story**: US-019, US-020
- **Status**: ⬜ Not Started

---

### isValidTransition

#### TC-U2-043: 유효한 전환 (pending → preparing)
- **Given**: from = 'pending', to = 'preparing'
- **When**: isValidTransition(from, to) 호출
- **Then**: true 반환
- **Story**: US-012
- **Status**: ⬜ Not Started

#### TC-U2-044: 유효한 전환 (pending → completed)
- **Given**: from = 'pending', to = 'completed'
- **When**: isValidTransition(from, to) 호출
- **Then**: true 반환
- **Story**: US-012
- **Status**: ⬜ Not Started

#### TC-U2-045: 무효한 전환 (completed → pending)
- **Given**: from = 'completed', to = 'pending'
- **When**: isValidTransition(from, to) 호출
- **Then**: false 반환
- **Story**: US-012
- **Status**: ⬜ Not Started

---

## Requirements Coverage

| Story ID | Test Cases | Status |
|----------|------------|--------|
| US-009 | TC-U2-001 ~ TC-U2-004, TC-U2-023 ~ TC-U2-025 | ⬜ Pending |
| US-010 | TC-U2-005, TC-U2-008, TC-U2-009, TC-U2-026 ~ TC-U2-030, TC-U2-039 ~ TC-U2-040 | ⬜ Pending |
| US-011 | TC-U2-028, TC-U2-031 | ⬜ Pending |
| US-012 | TC-U2-010, TC-U2-019 ~ TC-U2-020, TC-U2-032, TC-U2-043 ~ TC-U2-045 | ⬜ Pending |
| US-013 | TC-U2-005 ~ TC-U2-008, TC-U2-027 | ⬜ Pending |
| US-014 | TC-U2-016, TC-U2-037 | ⬜ Pending |
| US-015 | TC-U2-011, TC-U2-021, TC-U2-033 | ⬜ Pending |
| US-016 | TC-U2-017, TC-U2-038 | ⬜ Pending |
| US-017 | TC-U2-018 | ⬜ Pending |
| US-018 | TC-U2-012, TC-U2-034 | ⬜ Pending |
| US-019 | TC-U2-013, TC-U2-022, TC-U2-035 ~ TC-U2-036, TC-U2-041 ~ TC-U2-042 | ⬜ Pending |
| US-020 | TC-U2-014, TC-U2-041 ~ TC-U2-042 | ⬜ Pending |
| US-021 | TC-U2-015 | ⬜ Pending |
| US-022 | TC-U2-014 | ⬜ Pending |

---

## Test Summary

- **총 테스트 케이스**: 45개
- **Hooks Layer**: 8개
- **API Client Layer**: 10개
- **React Query Layer**: 4개
- **Component Layer**: 17개
- **Utility Functions**: 6개
