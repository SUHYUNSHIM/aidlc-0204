# Business Logic Model - Unit 2: Admin Frontend

## 1. 관리자 인증 로직

### 1.1 로그인 프로세스

```
사용자 입력 (storeId, username, password)
  ↓
폼 검증
  ↓
POST /admin/login
  ↓
성공 → JWT 토큰 수신
  ↓
localStorage 저장 (token, tokenExpiry)
  ↓
AdminContext 업데이트 (isAuthenticated=true, adminUser)
  ↓
/admin/dashboard 리다이렉트
```

**에러 처리**:
- 빈 필드: "모든 필드를 입력해주세요"
- 401: "인증 실패. 정보를 확인해주세요"
- 500: "서버 오류. 잠시 후 다시 시도해주세요"

---

### 1.2 자동 로그인 (페이지 새로고침 시)

```
앱 마운트
  ↓
localStorage에서 token, tokenExpiry 확인
  ↓
토큰 존재 && 만료 전?
  ↓ YES
AdminContext 복원 (isAuthenticated=true)
  ↓
/admin/dashboard 리다이렉트
  ↓ NO
localStorage 클리어
  ↓
/admin/login 리다이렉트
```

---

### 1.3 JWT 토큰 자동 갱신

```
앱 실행 중 (백그라운드 타이머)
  ↓
토큰 만료까지 남은 시간 체크 (매 1분)
  ↓
만료 5분 전?
  ↓ YES
POST /admin/refresh-token (현재 토큰 전송)
  ↓
성공 → 새 토큰 수신
  ↓
localStorage 업데이트
  ↓
AdminContext 업데이트
  ↓ NO (갱신 실패)
로그아웃 처리
  ↓
"세션이 만료되었습니다" 알림
  ↓
/admin/login 리다이렉트
```

---

### 1.4 로그아웃

```
로그아웃 버튼 클릭
  ↓
localStorage 클리어 (token, tokenExpiry)
  ↓
AdminContext 리셋 (isAuthenticated=false, adminUser=null)
  ↓
SSE 연결 종료
  ↓
/admin/login 리다이렉트
```

---

## 2. 실시간 주문 모니터링 로직

### 2.1 초기 데이터 로드

```
OrderDashboard 마운트
  ↓
GET /admin/orders?store_id={storeId}
  ↓
orders 배열 수신
  ↓
테이블별 그룹화 (groupOrdersByTable)
  ↓
TableOrders 생성 (tableId → TableOrders)
  ↓
활성 테이블만 필터링 (orders.length > 0)
  ↓
테이블 번호 오름차순 정렬
  ↓
대시보드 렌더링
```

**groupOrdersByTable 알고리즘**:
```typescript
function groupOrdersByTable(orders: Order[]): Map<number, TableOrders> {
  const map = new Map<number, TableOrders>();
  
  orders.forEach(order => {
    if (!map.has(order.tableId)) {
      map.set(order.tableId, {
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        totalAmount: 0,
        orders: [],
        latestOrders: [],
        hasNewOrder: false,
      });
    }
    
    const tableOrders = map.get(order.tableId)!;
    tableOrders.orders.push(order);
    tableOrders.totalAmount += order.totalAmount;
  });
  
  // 최신 3개 주문 추출
  map.forEach(tableOrders => {
    tableOrders.latestOrders = tableOrders.orders
      .sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime())
      .slice(0, 3);
  });
  
  return map;
}
```

---

### 2.2 SSE 연결 및 실시간 업데이트

```
OrderDashboard 마운트 (초기 로드 후)
  ↓
EventSource 생성: GET /admin/orders/sse?store_id={storeId}
  ↓
onopen → sseConnected = true, reconnectAttempts = 0
  ↓
onmessage → 이벤트 처리 (handleSSEEvent)
  ↓
onerror → 재연결 로직 (exponential backoff)
```

**handleSSEEvent 알고리즘**:
```typescript
function handleSSEEvent(event: SSEEvent) {
  switch (event.type) {
    case 'initial':
      // 전체 주문 목록 수신 (초기 동기화)
      setOrders(event.data.orders);
      break;
      
    case 'order_created':
      // 신규 주문 추가
      const newOrder = { ...event.data, isNew: true };
      setOrders(prev => [...prev, newOrder]);
      
      // 3초 후 isNew 플래그 제거
      setTimeout(() => {
        setOrders(prev => prev.map(o => 
          o.orderId === newOrder.orderId ? { ...o, isNew: false } : o
        ));
      }, 3000);
      
      // 알림 표시
      showNotification(`새 주문: 테이블 ${newOrder.tableNumber}`);
      break;
      
    case 'order_updated':
      // 주문 상태 업데이트
      setOrders(prev => prev.map(o => 
        o.orderId === event.data.orderId 
          ? { ...o, status: event.data.status } 
          : o
      ));
      break;
      
    case 'order_deleted':
      // 주문 삭제
      setOrders(prev => prev.filter(o => o.orderId !== event.data.orderId));
      break;
      
    case 'session_ended':
      // 테이블 세션 종료 (해당 테이블 주문 모두 제거)
      setOrders(prev => prev.filter(o => o.tableId !== event.data.tableId));
      showNotification(`테이블 ${event.data.tableNumber} 세션 종료`);
      break;
  }
}
```

---

### 2.3 SSE 재연결 로직 (지수 백오프)

```
SSE onerror 발생
  ↓
sseConnected = false
  ↓
reconnectAttempts < 5?
  ↓ YES
지연 시간 계산: delay = min(1000 * 2^reconnectAttempts, 16000)
  ↓
setTimeout(delay) 후 재연결 시도
  ↓
reconnectAttempts++
  ↓
EventSource 재생성
  ↓ NO (5회 초과)
sseError = "서버 연결 불가"
  ↓
폴링 모드 활성화 (pollingEnabled = true)
```

**재연결 지연 시간**:
- 1회: 1초
- 2회: 2초
- 3회: 4초
- 4회: 8초
- 5회: 16초
- 6회 이상: 폴링 모드

---

### 2.4 폴링 백업 로직 (SSE 실패 시)

```
pollingEnabled = true
  ↓
setInterval(10000) → 10초마다 실행
  ↓
GET /admin/orders?store_id={storeId}
  ↓
orders 배열 수신
  ↓
기존 orders와 비교 (diff 계산)
  ↓
변경사항만 업데이트
  ↓
수동 새로고침 버튼도 제공
```

---

## 3. 주문 관리 로직

### 3.1 주문 상태 변경

```
OrderDetailModal에서 상태 드롭다운 변경
  ↓
상태 전환 규칙 검증 (isValidTransition)
  ↓ 유효
PATCH /admin/orders/{orderId}/status { status: newStatus }
  ↓
성공
  ↓
로컬 상태 업데이트 (orders 배열)
  ↓
모달 자동 닫기
  ↓
SSE로도 order_updated 이벤트 수신 (이중 업데이트 방지 필요)
  ↓ 실패
에러 메시지 표시: "상태 변경 실패. 다시 시도해주세요"
```

**상태 전환 규칙 (isValidTransition)**:
```typescript
function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  const validTransitions = {
    'pending': ['preparing', 'completed'],
    'preparing': ['completed'],
    'completed': [], // 완료 후 변경 불가
  };
  
  return validTransitions[from].includes(to);
}
```

---

### 3.2 주문 삭제

```
OrderDetailModal에서 삭제 버튼 클릭
  ↓
확인 팝업: "정말 삭제하시겠습니까?"
  ↓ 확인
DELETE /admin/orders/{orderId}
  ↓
성공
  ↓
로컬 상태 업데이트 (orders 배열에서 제거)
  ↓
TableOrders 재계산 (totalAmount 업데이트)
  ↓
모달 자동 닫기
  ↓
SSE로도 order_deleted 이벤트 수신
  ↓ 실패
에러 메시지 표시: "주문 삭제 실패. 다시 시도해주세요"
```

---

## 4. 테이블 관리 로직

### 4.1 테이블 생성 (초기 설정)

```
"테이블 추가" 버튼 클릭
  ↓
폼 표시 (tableNumber, tablePassword)
  ↓
폼 검증
  ↓
POST /admin/tables { tableNumber, tablePassword, storeId }
  ↓
성공
  ↓
테이블 목록에 추가
  ↓
설정 정보 표시 (테이블 번호, 비밀번호)
  ↓ 실패
에러 처리:
- 409 (중복): "이미 존재하는 테이블입니다"
- 기타: "테이블 생성 실패. 다시 시도해주세요"
```

---

### 4.2 세션 종료 (매장 이용 완료)

```
"매장 이용 완료" 버튼 클릭
  ↓
확인 팝업: "테이블 세션을 종료하시겠습니까?"
  ↓ 확인
POST /admin/tables/{tableId}/end-session
  ↓
성공
  ↓
해당 테이블의 모든 주문 제거 (로컬 상태)
  ↓
"세션 종료됨" 메시지 표시
  ↓
SSE로도 session_ended 이벤트 수신
  ↓ 실패
에러 메시지 표시: "세션 종료 실패. 다시 시도해주세요"
```

---

### 4.3 과거 주문 내역 조회

```
"과거 내역" 버튼 클릭
  ↓
GET /admin/tables/{tableId}/history?page=1&limit=20
  ↓
OrderHistory 배열 수신
  ↓
모달에 표시 (시간 역순)
  ↓
페이지네이션 제공 (20개씩)
  ↓
"다음 페이지" 클릭 → page++, API 재호출
  ↓
"닫기" 버튼 → 모달 닫기
```

---

## 5. 메뉴 관리 로직

### 5.1 메뉴 조회

```
MenuManagement 마운트
  ↓
GET /admin/menus?store_id={storeId}
  ↓
Menu 배열 수신
  ↓
카테고리별 그룹화 (groupMenusByCategory)
  ↓
카테고리 필터 제공
  ↓
메뉴 목록 렌더링 (displayOrder 순)
```

---

### 5.2 메뉴 등록

```
"메뉴 추가" 버튼 클릭
  ↓
폼 표시 (menuName, price, description, categoryId, image)
  ↓
이미지 선택 시 → Base64 인코딩 + 크기 검증 (최대 1MB)
  ↓
폼 검증:
- menuName: 필수
- price: 필수, > 0
- categoryId: 필수
  ↓
POST /admin/menus { menuName, price, description, categoryId, imageBase64, storeId }
  ↓
성공
  ↓
메뉴 목록에 추가
  ↓
폼 닫기
  ↓ 실패
에러 처리:
- 이미지 > 1MB: "이미지 크기는 1MB 이하여야 합니다"
- 기타: "메뉴 등록 실패. 다시 시도해주세요"
```

**이미지 Base64 인코딩 및 검증**:
```typescript
function encodeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // 크기 검증 (1MB = 1,048,576 bytes)
    if (file.size > 1048576) {
      reject(new Error('이미지 크기는 1MB 이하여야 합니다'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

---

### 5.3 메뉴 수정

```
메뉴 "수정" 버튼 클릭
  ↓
기존 정보가 채워진 폼 표시
  ↓
수정 후 폼 검증
  ↓
PATCH /admin/menus/{menuId} { menuName, price, description, categoryId, imageBase64 }
  ↓
성공
  ↓
메뉴 목록 업데이트
  ↓
폼 닫기
  ↓ 실패
에러 메시지 표시: "메뉴 수정 실패. 다시 시도해주세요"
```

---

### 5.4 메뉴 삭제

```
메뉴 "삭제" 버튼 클릭
  ↓
확인 팝업: "정말 삭제하시겠습니까?"
  ↓ 확인
DELETE /admin/menus/{menuId}
  ↓
성공
  ↓
메뉴 목록에서 제거
  ↓ 실패
에러 메시지 표시: "메뉴 삭제 실패. 다시 시도해주세요"
```

---

### 5.5 메뉴 순서 조정

```
드래그 앤 드롭으로 순서 변경
  ↓
새 displayOrder 계산
  ↓
PATCH /admin/menus/{menuId}/order { displayOrder: newOrder }
  ↓
성공
  ↓
메뉴 목록 순서 업데이트
  ↓ 실패
이전 순서로 롤백
  ↓
에러 메시지 표시: "순서 변경 실패. 다시 시도해주세요"
```

---

## 6. 에러 처리 전략

### 6.1 네트워크 에러
- React Query 자동 재시도 (3회, 지수 백오프)
- 실패 시 에러 메시지 표시
- 재시도 버튼 제공

### 6.2 인증 에러 (401)
- 자동 로그아웃
- localStorage 클리어
- /admin/login 리다이렉트
- "세션이 만료되었습니다" 알림

### 6.3 SSE 연결 에러
- 자동 재연결 (최대 5회, 지수 백오프)
- 연결 상태 표시 (연결됨/재연결 중/연결 실패)
- 5회 실패 시 폴링 모드 + 수동 새로고침 버튼

### 6.4 서버 에러 (500)
- 에러 메시지 표시
- 재시도 버튼 제공
- 콘솔 로그 기록

---

## 7. 성능 최적화

### 7.1 React Query 캐싱
- 메뉴 데이터: 5분 staleTime (자주 변경되지 않음)
- 주문 데이터: SSE로 실시간 업데이트, 캐싱 비활성화

### 7.2 컴포넌트 최적화
- React.memo로 TableCard 리렌더링 방지
- useMemo로 groupOrdersByTable 메모이제이션
- useCallback로 이벤트 핸들러 재생성 방지

### 7.3 SSE 최적화
- 하이브리드 방식: 초기 전체 목록 + 증분 업데이트
- 불필요한 업데이트 필터링 (중복 이벤트 무시)
