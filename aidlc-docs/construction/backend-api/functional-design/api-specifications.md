# API 명세서

## 개요

- **Base URL**: `http://localhost:8000`
- **인증**: JWT Bearer Token
- **Content-Type**: `application/json`
- **에러 응답 형식**: `{"detail": "error message"}`

---

## 1. 고객용 API (Customer API)

### 1.1 테이블 로그인

**POST** `/customer/login`

테이블 태블릿에서 자동 로그인을 위한 인증 API

#### Request Body
```json
{
  "store_id": 1,
  "table_number": 5,
  "table_password": "1234"
}
```

#### Request Schema
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| store_id | integer | ✓ | 매장 ID |
| table_number | integer | ✓ | 테이블 번호 (1 이상) |
| table_password | string | ✓ | 테이블 비밀번호 |

#### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 57600,
  "table_id": 5,
  "table_number": 5,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "store_id": 1,
  "store_name": "카페 모카"
}
```

#### Response Schema
| 필드 | 타입 | 설명 |
|------|------|------|
| access_token | string | JWT 토큰 |
| token_type | string | 항상 "Bearer" |
| expires_in | integer | 토큰 만료 시간 (초) - 16시간 |
| table_id | integer | 테이블 ID |
| table_number | integer | 테이블 번호 |
| session_id | UUID | 현재 세션 ID |
| store_id | integer | 매장 ID |
| store_name | string | 매장 이름 |

#### Error Responses
| 상태 코드 | 상황 | 응답 |
|----------|------|------|
| 400 | 잘못된 요청 형식 | `{"detail": "Invalid request format"}` |
| 401 | 인증 실패 | `{"detail": "Invalid table credentials"}` |
| 404 | 매장/테이블 없음 | `{"detail": "Store or table not found"}` |

#### 비즈니스 로직
1. store_id로 매장 존재 확인
2. table_number로 테이블 조회
3. bcrypt로 비밀번호 검증
4. 활성 세션 확인 (없으면 새 세션 생성 - 트리거가 current_session_id 자동 업데이트)
5. JWT 토큰 생성 (16시간 유효)

---

### 1.2 메뉴 조회

**GET** `/customer/menus`

카테고리별 메뉴 목록 조회 (캐싱 적용)

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| category_id | integer | - | 특정 카테고리만 조회 |

#### Headers
```
Authorization: Bearer <access_token>
```

#### Response (200 OK)
```json
{
  "store_id": 1,
  "categories": [
    {
      "category_id": 1,
      "category_name": "커피",
      "display_order": 1,
      "menus": [
        {
          "menu_id": 1,
          "menu_name": "아메리카노",
          "price": 4500,
          "description": "깔끔하고 진한 에스프레소의 맛",
          "image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
          "display_order": 1
        }
      ]
    }
  ]
}
```

#### Error Responses
| 상태 코드 | 상황 | 응답 |
|----------|------|------|
| 401 | 인증 실패 | `{"detail": "Invalid or expired token"}` |
| 404 | 카테고리 없음 | `{"detail": "Category not found"}` |

---

### 1.3 주문 생성

**POST** `/customer/orders`

장바구니 내용을 주문으로 생성

#### Headers
```
Authorization: Bearer <access_token>
```

#### Request Body
```json
{
  "items": [
    {
      "menu_id": 1,
      "quantity": 2
    },
    {
      "menu_id": 3,
      "quantity": 1
    }
  ]
}
```

#### Request Schema
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| items | array | ✓ | 주문 항목 배열 (1개 이상) |
| items[].menu_id | integer | ✓ | 메뉴 ID |
| items[].quantity | integer | ✓ | 수량 (1 이상) |

#### Response (201 Created)
```json
{
  "order_id": 1,
  "table_id": 1,
  "table_number": 1,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_amount": 14500,
  "status": "대기중",
  "order_time": "2026-02-04T13:30:00Z",
  "items": [
    {
      "order_item_id": 1,
      "menu_id": 1,
      "menu_name": "아메리카노",
      "quantity": 2,
      "unit_price": 4500,
      "subtotal": 9000
    },
    {
      "order_item_id": 2,
      "menu_id": 3,
      "menu_name": "카푸치노",
      "quantity": 1,
      "unit_price": 5500,
      "subtotal": 5500
    }
  ]
}
```

#### Error Responses
| 상태 코드 | 상황 | 응답 |
|----------|------|------|
| 400 | 빈 주문 | `{"detail": "Order must have at least one item"}` |
| 400 | 잘못된 수량 | `{"detail": "Quantity must be positive"}` |
| 401 | 인증 실패 | `{"detail": "Invalid or expired token"}` |
| 404 | 메뉴 없음 | `{"detail": "Menu not found: {menu_id}"}` |
| 409 | 세션 종료됨 | `{"detail": "Session has ended"}` |

#### 비즈니스 로직
1. JWT 토큰에서 session_id, table_id, store_id 추출
2. 세션 활성 상태 확인
3. 각 메뉴 존재 및 가격 조회
4. 총 금액 계산
5. Order + OrderItem 저장
6. SSE로 관리자에게 브로드캐스트

---

### 1.4 주문 내역 조회

**GET** `/customer/orders`

현재 세션의 주문 내역 조회

#### Headers
```
Authorization: Bearer <access_token>
```

#### Response (200 OK)
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "table_number": 1,
  "total_session_amount": 14500,
  "orders": [
    {
      "order_id": 1,
      "total_amount": 14500,
      "status": "대기중",
      "order_time": "2026-02-04T13:30:00Z",
      "items": [
        {
          "order_item_id": 1,
          "menu_id": 1,
          "menu_name": "아메리카노",
          "quantity": 2,
          "unit_price": 4500,
          "subtotal": 9000
        }
      ]
    }
  ]
}
```

#### Error Responses
| 상태 코드 | 상황 | 응답 |
|----------|------|------|
| 401 | 인증 실패 | `{"detail": "Invalid or expired token"}` |

---

## 2. 관리자용 API (Admin API)

### 2.1 관리자 로그인

**POST** `/admin/login`

관리자 인증 및 JWT 토큰 발급

#### Request Body
```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 57600,
  "store_id": 1,
  "store_name": "카페 모카",
  "username": "admin"
}
```

#### Error Responses
| 상태 코드 | 상황 | 응답 |
|----------|------|------|
| 401 | 인증 실패 | `{"detail": "Invalid credentials"}` |

---

### 2.2 주문 목록 조회

**GET** `/admin/orders`

매장의 활성 주문 목록 조회 (테이블별 그룹화)

#### Headers
```
Authorization: Bearer <access_token>
```

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | string | - | 상태 필터 (대기중/준비중/완료) |
| table_id | integer | - | 특정 테이블만 조회 |

#### Response (200 OK)
```json
{
  "store_id": 1,
  "tables": [
    {
      "table_id": 1,
      "table_number": 1,
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "total_amount": 14500,
      "order_count": 1,
      "orders": [
        {
          "order_id": 1,
          "total_amount": 14500,
          "status": "대기중",
          "order_time": "2026-02-04T14:00:00Z",
          "items": [
            {
              "order_item_id": 1,
              "menu_id": 1,
              "menu_name": "아메리카노",
              "quantity": 2,
              "unit_price": 4500,
              "subtotal": 9000
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 2.3 실시간 주문 업데이트 (SSE)

**GET** `/admin/orders/sse`

Server-Sent Events를 통한 실시간 주문 업데이트

#### Headers
```
Authorization: Bearer <access_token>
Accept: text/event-stream
```

#### SSE Event Types

**1. initial (초기 데이터)**
```
event: initial
data: {"tables": [...]}
```

**2. order_created (새 주문)**
```
event: order_created
data: {
  "order_id": 2,
  "table_id": 1,
  "table_number": 1,
  "total_amount": 9000,
  "status": "대기중",
  "order_time": "2026-02-04T14:30:00Z",
  "items": [...]
}
```

**3. order_updated (상태 변경)**
```
event: order_updated
data: {
  "order_id": 1,
  "table_id": 1,
  "status": "준비중"
}
```

**4. order_deleted (주문 삭제)**
```
event: order_deleted
data: {
  "order_id": 1,
  "table_id": 1
}
```

**5. session_ended (세션 종료)**
```
event: session_ended
data: {
  "table_id": 1,
  "table_number": 1,
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 연결 관리
- 연결 시 `initial` 이벤트로 전체 데이터 전송
- 이후 변경 사항만 증분 업데이트
- 30초마다 heartbeat (`:ping`)
- 연결 끊김 시 클라이언트에서 재연결 (지수 백오프)

---

### 2.4 주문 상태 변경

**PATCH** `/admin/orders/{order_id}/status`

주문 상태 업데이트

#### Path Parameters
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| order_id | integer | 주문 ID |

#### Request Body
```json
{
  "status": "준비중"
}
```

#### Request Schema
| 필드 | 타입 | 필수 | 허용값 |
|------|------|------|--------|
| status | string | ✓ | "대기중", "준비중", "완료" |

#### Response (200 OK)
```json
{
  "order_id": 1,
  "status": "준비중"
}
```

#### Error Responses
| 상태 코드 | 상황 | 응답 |
|----------|------|------|
| 400 | 잘못된 상태값 | `{"detail": "Invalid status value"}` |
| 404 | 주문 없음 | `{"detail": "Order not found"}` |

#### 비즈니스 로직 (부분 강제)
- 대기중 → 준비중 ✓
- 대기중 → 완료 ✓ (준비중 건너뛰기 허용)
- 준비중 → 완료 ✓
- 완료 → 다른 상태 ✗ (역방향 불가)

---

### 2.5 주문 삭제

**DELETE** `/admin/orders/{order_id}`

잘못된 주문 삭제 (직권 수정)

#### Path Parameters
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| order_id | integer | 주문 ID |

#### Response (200 OK)
```json
{
  "message": "Order deleted successfully",
  "order_id": 1,
  "table_id": 1
}
```

#### Error Responses
| 상태 코드 | 상황 | 응답 |
|----------|------|------|
| 404 | 주문 없음 | `{"detail": "Order not found"}` |

#### 비즈니스 로직
1. 주문 존재 확인
2. 주문 삭제 (CASCADE로 OrderItem도 삭제)
3. SSE로 `order_deleted` 이벤트 브로드캐스트

---

### 2.6 테이블 생성

**POST** `/admin/tables`

새 테이블 추가

#### Request Body
```json
{
  "table_number": 10,
  "table_password": "1234"
}
```

#### Response (201 Created)
```json
{
  "table_id": 10,
  "table_number": 10,
  "store_id": 1,
  "current_session_id": null
}
```

#### Error Responses
| 상태 코드 | 상황 | 응답 |
|----------|------|------|
| 400 | 잘못된 테이블 번호 | `{"detail": "Table number must be positive"}` |
| 409 | 중복 테이블 | `{"detail": "Table number already exists"}` |

---

### 2.7 테이블 세션 종료

**POST** `/admin/tables/{table_id}/end-session`

테이블 세션 종료 (매장 이용 완료)

#### Path Parameters
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| table_id | integer | 테이블 ID |

#### Response (200 OK)
```json
{
  "message": "Session ended successfully",
  "table_id": 1,
  "table_number": 1,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_session_amount": 14500,
  "order_count": 1
}
```

#### Error Responses
| 상태 코드 | 상황 | 응답 |
|----------|------|------|
| 404 | 테이블 없음 | `{"detail": "Table not found"}` |
| 409 | 활성 세션 없음 | `{"detail": "No active session"}` |

#### 비즈니스 로직
1. 테이블의 활성 세션 확인
2. 세션의 모든 주문을 JSON으로 직렬화
3. OrderHistory에 아카이브 저장
4. TableSession 종료 (is_active=False, end_time 설정)
5. 트리거가 Table의 current_session_id를 NULL로 자동 설정
6. SSE로 `session_ended` 이벤트 브로드캐스트

---

### 2.8 과거 주문 내역 조회

**GET** `/admin/tables/{table_id}/history`

테이블의 과거 주문 이력 조회

#### Path Parameters
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| table_id | integer | 테이블 ID |

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| start_date | string | - | 시작 날짜 (YYYY-MM-DD) |
| end_date | string | - | 종료 날짜 (YYYY-MM-DD) |
| limit | integer | - | 조회 개수 (기본 20) |
| offset | integer | - | 오프셋 (기본 0) |

#### Response (200 OK)
```json
{
  "table_id": 1,
  "table_number": 1,
  "total_count": 5,
  "history": [
    {
      "history_id": 1,
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "completed_time": "2026-02-04T15:00:00Z",
      "archived_order_data": {
        "orders": [...],
        "session_total": 14500
      }
    }
  ]
}
```

---

### 2.9 메뉴 목록 조회

**GET** `/admin/menus`

관리자용 메뉴 목록 조회

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| category_id | integer | - | 카테고리 필터 |

#### Response (200 OK)
```json
{
  "store_id": 1,
  "categories": [
    {
      "category_id": 1,
      "category_name": "커피",
      "display_order": 1,
      "menus": [
        {
          "menu_id": 1,
          "menu_name": "아메리카노",
          "price": 4500,
          "description": "깔끔하고 진한 에스프레소의 맛",
          "image_base64": "...",
          "display_order": 1,
          "created_at": "2026-01-01T00:00:00Z",
          "updated_at": "2026-02-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

---

### 2.10 메뉴 등록

**POST** `/admin/menus`

새 메뉴 추가

#### Request Body
```json
{
  "category_id": 1,
  "menu_name": "바닐라라떼",
  "price": 5500,
  "description": "달콤한 바닐라 시럽이 들어간 라떼",
  "image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "display_order": 5
}
```

#### Request Schema
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| category_id | integer | ✓ | 카테고리 ID |
| menu_name | string | ✓ | 메뉴명 (1-100자) |
| price | integer | ✓ | 가격 (1 이상) |
| description | string | - | 설명 |
| image_base64 | string | - | Base64 이미지 |
| display_order | integer | - | 표시 순서 (기본 0) |

#### Response (201 Created)
```json
{
  "menu_id": 15,
  "menu_name": "바닐라라떼",
  "price": 5500,
  "category_id": 1,
  "category_name": "커피",
  "description": "달콤한 바닐라 시럽이 들어간 라떼",
  "display_order": 5
}
```

#### Error Responses
| 상태 코드 | 상황 | 응답 |
|----------|------|------|
| 400 | 잘못된 가격 | `{"detail": "Price must be positive"}` |
| 404 | 카테고리 없음 | `{"detail": "Category not found"}` |

---

### 2.11 메뉴 수정

**PATCH** `/admin/menus/{menu_id}`

메뉴 정보 수정

#### Path Parameters
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| menu_id | integer | 메뉴 ID |

#### Request Body (부분 업데이트)
```json
{
  "price": 6000
}
```

#### Response (200 OK)
```json
{
  "menu_id": 15,
  "menu_name": "바닐라라떼",
  "price": 6000,
  "updated_at": "2026-02-04T16:00:00Z"
}
```

---

### 2.12 메뉴 삭제

**DELETE** `/admin/menus/{menu_id}`

메뉴 삭제

#### Response (200 OK)
```json
{
  "message": "Menu deleted successfully",
  "menu_id": 15
}
```

#### Error Responses
| 상태 코드 | 상황 | 응답 |
|----------|------|------|
| 404 | 메뉴 없음 | `{"detail": "Menu not found"}` |

---

## 3. 공통 응답 코드

| 상태 코드 | 설명 |
|----------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복, 참조 등) |
| 500 | 서버 에러 |

---

## 4. JWT 토큰 구조

### 테이블 토큰 페이로드
```json
{
  "sub": "table_1",
  "user_type": "table",
  "store_id": 1,
  "table_id": 1,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "exp": 1738764000,
  "iat": 1738706400
}
```

### 관리자 토큰 페이로드
```json
{
  "sub": "admin",
  "user_type": "admin",
  "store_id": 1,
  "exp": 1738764000,
  "iat": 1738706400
}
```

### 토큰 설정
- 알고리즘: HS256
- 만료 시간: 16시간 (57600초)
- 시크릿 키: 환경 변수 `JWT_SECRET_KEY`
