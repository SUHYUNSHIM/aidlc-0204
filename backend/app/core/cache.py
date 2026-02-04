from typing import Any, Optional, Dict
from datetime import datetime, timedelta
import threading


class InMemoryCacheManager:
    """인메모리 캐시 매니저"""
    
    def __init__(self):
        self._cache: Dict[str, dict] = {}
        self._lock = threading.Lock()
    
    def get(self, key: str) -> Optional[Any]:
        """캐시에서 값 조회"""
        with self._lock:
            if key not in self._cache:
                return None
            entry = self._cache[key]
            if datetime.utcnow() > entry["expires_at"]:
                del self._cache[key]
                return None
            return entry["value"]
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """캐시에 값 저장"""
        with self._lock:
            self._cache[key] = {
                "value": value,
                "expires_at": datetime.utcnow() + timedelta(seconds=ttl)
            }
        return True
    
    def delete(self, key: str) -> bool:
        """캐시에서 값 삭제"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """패턴에 맞는 캐시 무효화"""
        prefix = pattern.rstrip("*")
        count = 0
        with self._lock:
            keys_to_delete = [k for k in self._cache.keys() if k.startswith(prefix)]
            for key in keys_to_delete:
                del self._cache[key]
                count += 1
        return count
    
    def clear(self) -> None:
        """전체 캐시 삭제"""
        with self._lock:
            self._cache.clear()


_cache_manager: Optional[InMemoryCacheManager] = None


def get_cache_manager() -> InMemoryCacheManager:
    """캐시 매니저 싱글톤 인스턴스 반환"""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = InMemoryCacheManager()
    return _cache_manager
