# Domain Entities - Unit 2: Admin Frontend

## 1. Admin 도메인 엔티티

### 1.1 AdminUser (관리자)

```typescript
interface AdminUser {
  userId: string;           // 관리자 ID
  username: string;         // 관리자 이름
  storeId: string;          // 소속 매장 ID
  token: string;            // JWT 토큰
  tokenExpiry: number;      // 토큰 만료 시간 (timestamp)
}
```

**설명**: 로그인한 관리자의 인증 정보

---

### 1.2 Order (주문)

```typescript
interface Order {
  orderId: number;          // 주문 ID
  orderNumber: string;      // 주문 번호 (예: "ORD-001")
  tableId: number;          // 테이블 ID
  tableNumber: number;      // 테이블 번호
  sessionId: string;        // 세션 ID
  totalAmount: number;      // 총 주문액
  status: OrderStatus;      // 주문 상태
  orderTime: string;        // 주문 시간 (ISO 8601)
  items: OrderItem[];       // 주문 항목 목록
  isNew?: boolean;          // 신규 주문 여부 (UI 강조용)
}

type OrderStatus = 'pending' | 'preparing' | 'completed';
```

**설명**: 개별 주문 정보

---

### 1.3 OrderItem (주문 항목)

```typescript
interface OrderItem {
  menuId: number;           // 메뉴 ID
  menuName: string;         // 메뉴명
  quantity: number;         // 수량
  unitPrice: number;        // 단가
}
```

**설명**: 주문에 포함된 메뉴 항목

---

### 1.4 TableOrders (테이블별 주문 그룹)

```typescript
interface TableOrders {
  tableId: number;          // 테이블 ID
  tableNumber: number;      // 테이블 번호
  totalAmount: number;      // 테이블 총 주문액
  orders: Order[];          // 전체 주문 목록
  latestOrders: Order[];    // 최신 3개 주문 (미리보기용)
  hasNewOrder: boolean;     // 신규 주문 존재 여부
}
```

**설명**: 대시보드에서 테이블별로 그룹화된 주문 정보

---

### 1.5 Table (테이블)

```typescript
interface Table {
  tableId: number;          // 테이블 ID
  tableNumber: number;      // 테이블 번호
  tablePassword: string;    // 테이블 비밀번호
  storeId: string;          // 소속 매장 ID
  sessionId: string | null; // 현재 세션 ID (null이면 비활성)
  isActive: boolean;        // 활성 상태
  createdAt: string;        // 생성 시간
}
```

**설명**: 테이블 정보 및 세션 상태

---

### 1.6 OrderHistory (과거 주문 내역)

```typescript
interface OrderHistory {
  orderId: number;          // 주문 ID
  orderNumber: string;      // 주문 번호
  tableNumber: number;      // 테이블 번호
  totalAmount: number;      // 총 주문액
  orderTime: string;        // 주문 시간
  completedTime: string;    // 완료 시간
  items: OrderItem[];       // 주문 항목
}
```

**설명**: 완료된 과거 주문 내역

---

### 1.7 Menu (메뉴)

```typescript
interface Menu {
  menuId: number;           // 메뉴 ID
  menuName: string;         // 메뉴명
  price: number;            // 가격
  description: string;      // 설명
  categoryId: number;       // 카테고리 ID
  categoryName: string;     // 카테고리명
  imageBase64: string | null; // 이미지 (Base64, 최대 1MB)
  displayOrder: number;     // 표시 순서
  isAvailable: boolean;     // 판매 가능 여부
  storeId: string;          // 소속 매장 ID
}
```

**설명**: 메뉴 정보

---

### 1.8 Category (카테고리)

```typescript
interface Category {
  categoryId: number;       // 카테고리 ID
  categoryName: string;     // 카테고리명
  displayOrder: number;     // 표시 순서
  storeId: string;          // 소속 매장 ID
}
```

**설명**: 메뉴 카테고리

---

### 1.9 SSEEvent (SSE 이벤트)

```typescript
interface SSEEvent {
  type: SSEEventType;       // 이벤트 타입
  data: any;                // 이벤트 데이터
  timestamp: string;        // 이벤트 발생 시간
}

type SSEEventType = 
  | 'initial'               // 초기 전체 데이터
  | 'order_created'         // 신규 주문 생성
  | 'order_updated'         // 주문 상태 변경
  | 'order_deleted'         // 주문 삭제
  | 'session_ended';        // 테이블 세션 종료
```

**설명**: 실시간 업데이트 이벤트

---

## 2. 엔티티 관계도

```
AdminUser (1) ─── (N) Order
    │
    └─── (1) Store ─── (N) Table
                  │
                  └─── (N) Menu ─── (1) Category

Table (1) ─── (N) Order ─── (N) OrderItem ─── (1) Menu

Order (N) ─── (1) TableOrders (그룹화)
```

**관계 설명**:
- 관리자는 하나의 매장에 소속
- 매장은 여러 테이블과 메뉴를 보유
- 테이블은 여러 주문을 가질 수 있음
- 주문은 여러 주문 항목을 포함
- 주문 항목은 하나의 메뉴를 참조
- TableOrders는 UI용 그룹화 엔티티 (테이블별 주문 집계)

---

## 3. 프론트엔드 상태 구조

### 3.1 AdminContext State

```typescript
interface AdminState {
  // 인증
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  
  // 주문 데이터
  orders: Order[];
  tableOrders: Map<number, TableOrders>;
  
  // SSE 연결
  sseConnected: boolean;
  sseError: string | null;
  sseReconnectAttempts: number;
  
  // UI 상태
  selectedTableId: number | null;
  showOrderDetailModal: boolean;
  showTableManagement: boolean;
  showMenuManagement: boolean;
  
  // 폴링 (SSE 백업)
  pollingEnabled: boolean;
  pollingInterval: number; // 10초
}
```

---

## 4. 데이터 흐름

### 4.1 초기 로드
```
AdminLogin → POST /admin/login → AdminUser 저장 (localStorage + Context)
  ↓
OrderDashboard → GET /admin/orders → orders 배열 수신
  ↓
테이블별 그룹화 → TableOrders 생성 → 대시보드 렌더링
```

### 4.2 실시간 업데이트
```
SSE 연결 → EventSource(/admin/orders/sse)
  ↓
이벤트 수신 (order_created, order_updated, etc.)
  ↓
AdminContext 상태 업데이트
  ↓
컴포넌트 자동 리렌더링
```

### 4.3 폴링 백업 (SSE 실패 시)
```
SSE 연결 실패 → pollingEnabled = true
  ↓
10초마다 GET /admin/orders 호출
  ↓
orders 배열 업데이트
  ↓
수동 새로고침 버튼도 제공
```

---

## 5. 데이터 검증 규칙

### 5.1 AdminUser
- `username`: 필수, 1-50자
- `password`: 필수, 8-100자
- `storeId`: 필수, UUID 형식

### 5.2 Order
- `totalAmount`: >= 0
- `status`: 'pending' | 'preparing' | 'completed' 중 하나
- `items`: 최소 1개 이상

### 5.3 Menu
- `menuName`: 필수, 1-100자
- `price`: 필수, > 0
- `categoryId`: 필수
- `imageBase64`: 선택, 최대 1MB (Base64 인코딩 후)

### 5.4 Table
- `tableNumber`: 필수, > 0, 중복 불가
- `tablePassword`: 필수, 4-20자

---

## 6. 엔티티 생명주기

### 6.1 Order 생명주기
```
생성 (pending) → 준비중 (preparing) → 완료 (completed) → 삭제 또는 보관
```

### 6.2 Table 생명주기
```
생성 (isActive=false) → 세션 시작 (isActive=true) → 세션 종료 (isActive=false)
```

### 6.3 JWT Token 생명주기
```
로그인 → 토큰 발급 (16시간) → 자동 갱신 (만료 전) → 갱신 실패 시 로그아웃
```
