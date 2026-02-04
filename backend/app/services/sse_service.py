import asyncio
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
        """새 SSE 연결 등록"""
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
        """SSE 연결 해제"""
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
        """매장의 모든 연결에 이벤트 브로드캐스트"""
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
        """초기 데이터 전송"""
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
