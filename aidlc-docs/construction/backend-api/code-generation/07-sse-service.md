# Phase 3-2: SSE 서비스

## 목표

Server-Sent Events 연결 관리 및 브로드캐스트 서비스 구현

---

## services/sse_service.py

```python
import asyncio
import json
from typing import Dict, List, Tuple, Optional
from uuid import uuid4


class SSEService:
    """SSE 연결 관리 및 브로드캐스트 서비스"""
    
    def __init__(self):
        # connection_id -> {"store_id": int, "queue": asyncio.Queue}
        self._connections: Dict[str, dict] = {}
        # store_id -> [connection_id, ...]
        self._store_connections: Dict[int, List[str]] = {}
    
    async def register_connection(self, store_id: int) -> Tuple[str, asyncio.Queue]:
        """
        새 SSE 연결 등록
        
        Args:
            store_id: 매장 ID
            
        Returns:
            (connection_id, queue) 튜플
        """
        connection_id = str(uuid4())
        queue: asyncio.Queue = asyncio.Queue()
        
        self._connections[connection_id] = {
            "store_id": store_id,
            "queue": queue,
        }
        
        if store_id not in self._store_connections:
            self._store_connections[store_id] = []
        self._store_connections[store_id].append(connection_id)
        
        return connection_id, queue
    
    def unregister_connection(self, connection_id: str) -> bool:
        """
        SSE 연결 해제
        
        Args:
            connection_id: 연결 ID
            
        Returns:
            성공 여부
        """
        if connection_id not in self._connections:
            return False
        
        store_id = self._connections[connection_id]["store_id"]
        del self._connections[connection_id]
        
        if store_id in self._store_connections:
            if connection_id in self._store_connections[store_id]:
                self._store_connections[store_id].remove(connection_id)
            if not self._store_connections[store_id]:
                del self._store_connections[store_id]
        
        return True
    
    async def broadcast_order_update(
        self, 
        store_id: int, 
        event_type: str, 
        data: dict
    ) -> bool:
        """
        매장의 모든 연결에 이벤트 브로드캐스트
        
        Args:
            store_id: 매장 ID
            event_type: 이벤트 타입 (order_created, order_updated, etc.)
            data: 이벤트 데이터
            
        Returns:
            성공 여부
        """
        if store_id not in self._store_connections:
            return False
        
        event = {
            "event": event_type,
            "data": data,
        }
        
        failed_connections = []
        
        for connection_id in self._store_connections[store_id]:
            try:
                queue = self._connections[connection_id]["queue"]
                await queue.put(event)
            except Exception:
                failed_connections.append(connection_id)
        
        # 실패한 연결 정리
        for conn_id in failed_connections:
            self.unregister_connection(conn_id)
        
        return True
    
    async def send_initial_data(
        self, 
        connection_id: str, 
        data: dict
    ) -> bool:
        """
        초기 데이터 전송
        
        Args:
            connection_id: 연결 ID
            data: 초기 데이터
            
        Returns:
            성공 여부
        """
        if connection_id not in self._connections:
            return False
        
        event = {
            "event": "initial",
            "data": data,
        }
        
        try:
            queue = self._connections[connection_id]["queue"]
            await queue.put(event)
            return True
        except Exception:
            return False
    
    def get_connection_count(self, store_id: int) -> int:
        """매장의 활성 연결 수 조회"""
        if store_id not in self._store_connections:
            return 0
        return len(self._store_connections[store_id])
    
    def get_total_connections(self) -> int:
        """전체 활성 연결 수 조회"""
        return len(self._connections)


# 싱글톤 인스턴스
_sse_service: Optional[SSEService] = None


def get_sse_service() -> SSEService:
    """SSEService 싱글톤"""
    global _sse_service
    if _sse_service is None:
        _sse_service = SSEService()
    return _sse_service
```

---

## SSE 이벤트 포맷

### 이벤트 구조

```
event: {event_type}
data: {json_data}

```

### 이벤트 타입

| 이벤트 | 설명 | 데이터 |
|-------|-----|-------|
| `initial` | 초기 데이터 | 전체 주문 목록 |
| `order_created` | 새 주문 | 주문 상세 |
| `order_updated` | 상태 변경 | order_id, status |
| `order_deleted` | 주문 삭제 | order_id, table_id |
| `session_ended` | 세션 종료 | table_id, session_id |
| `ping` | 하트비트 | 없음 |

---

## SSE 엔드포인트 구현 (api/v1/endpoints/admin.py)

```python
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.core.dependencies import get_current_admin, get_db
from app.services.sse_service import get_sse_service
from app.services.order_service import OrderService
import asyncio
import json

router = APIRouter()


async def event_generator(store_id: int, connection_id: str, queue: asyncio.Queue):
    """SSE 이벤트 제너레이터"""
    sse_service = get_sse_service()
    
    try:
        while True:
            try:
                # 30초 타임아웃으로 이벤트 대기
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                
                event_type = event["event"]
                data = json.dumps(event["data"], ensure_ascii=False, default=str)
                
                yield f"event: {event_type}\ndata: {data}\n\n"
                
            except asyncio.TimeoutError:
                # 하트비트 전송
                yield ": ping\n\n"
                
    except asyncio.CancelledError:
        pass
    finally:
        sse_service.unregister_connection(connection_id)


@router.get("/orders/sse")
async def order_stream(
    current_admin: dict = Depends(get_current_admin),
    db = Depends(get_db)
):
    """실시간 주문 업데이트 SSE 스트림"""
    store_id = current_admin["store_id"]
    sse_service = get_sse_service()
    
    # 연결 등록
    connection_id, queue = await sse_service.register_connection(store_id)
    
    # 초기 데이터 전송
    order_service = OrderService(...)  # 의존성 주입
    initial_data = await order_service.get_orders_by_store(store_id)
    await sse_service.send_initial_data(connection_id, initial_data)
    
    return StreamingResponse(
        event_generator(store_id, connection_id, queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
```

---

## 클라이언트 연결 예시

```javascript
// JavaScript 클라이언트
const eventSource = new EventSource('/admin/orders/sse', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

eventSource.addEventListener('initial', (event) => {
    const data = JSON.parse(event.data);
    console.log('Initial data:', data);
});

eventSource.addEventListener('order_created', (event) => {
    const order = JSON.parse(event.data);
    console.log('New order:', order);
});

eventSource.addEventListener('order_updated', (event) => {
    const update = JSON.parse(event.data);
    console.log('Order updated:', update);
});

eventSource.addEventListener('order_deleted', (event) => {
    const deleted = JSON.parse(event.data);
    console.log('Order deleted:', deleted);
});

eventSource.addEventListener('session_ended', (event) => {
    const session = JSON.parse(event.data);
    console.log('Session ended:', session);
});

eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    // 재연결 로직 (지수 백오프)
};
```

---

## 체크리스트

- [ ] services/sse_service.py 구현
- [ ] SSE 엔드포인트 구현
- [ ] 하트비트 메커니즘 구현
- [ ] 연결 정리 로직 구현
