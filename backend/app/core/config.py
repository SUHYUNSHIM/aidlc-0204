from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # Application
    app_name: str = "Table Order Service"
    environment: str = "development"
    
    # Database
    database_url: str = "postgresql+asyncpg://tableorder:tableorder_dev_pw@localhost:5432/tableorder_db"
    db_pool_size: int = 5
    db_max_overflow: int = 10
    
    # Security
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 16
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    log_level: str = "INFO"
    
    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    
    # SSE
    sse_heartbeat_interval: int = 30
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def DEBUG(self) -> bool:
        return self.debug
    
    @property
    def HOST(self) -> str:
        return self.host
    
    @property
    def PORT(self) -> int:
        return self.port
    
    @property
    def LOG_LEVEL(self) -> str:
        return self.log_level
    
    @property
    def APP_NAME(self) -> str:
        return self.app_name
    
    @property
    def ENVIRONMENT(self) -> str:
        return self.environment
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
