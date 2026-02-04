import logging
import sys
import json
from datetime import datetime


class JSONFormatter(logging.Formatter):
    """JSON 형식 로그 포매터"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # extra 필드 추가
        for key in ["request_id", "method", "path", "status_code", 
                    "process_time_ms", "error_code", "client_ip"]:
            if hasattr(record, key):
                log_data[key] = getattr(record, key)
        
        # 예외 정보
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data, ensure_ascii=False)


class ConsoleFormatter(logging.Formatter):
    """콘솔용 컬러 포매터"""
    
    COLORS = {
        "DEBUG": "\033[36m",    # Cyan
        "INFO": "\033[32m",     # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",    # Red
        "CRITICAL": "\033[35m", # Magenta
    }
    RESET = "\033[0m"
    
    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # request_id가 있으면 추가
        if hasattr(record, "request_id"):
            return f"{color}[{timestamp}] {record.levelname:8}{self.RESET} [{record.request_id}] {record.name}: {record.getMessage()}"
        
        return f"{color}[{timestamp}] {record.levelname:8}{self.RESET} {record.name}: {record.getMessage()}"


def setup_logging():
    """로깅 설정"""
    from app.core.config import settings
    
    # 루트 로거 설정
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.log_level))
    
    # 기존 핸들러 제거
    root_logger.handlers.clear()
    
    # 콘솔 핸들러
    console_handler = logging.StreamHandler(sys.stdout)
    
    if settings.debug:
        console_handler.setFormatter(ConsoleFormatter())
    else:
        console_handler.setFormatter(JSONFormatter())
    
    root_logger.addHandler(console_handler)
    
    # SQLAlchemy 로깅 레벨 조정
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
    
    # Uvicorn 로깅 레벨 조정
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
