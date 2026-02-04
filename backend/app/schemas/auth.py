from pydantic import BaseModel, Field
from uuid import UUID


class TableLoginRequest(BaseModel):
    store_id: int = Field(..., description="매장 ID")
    table_number: int = Field(..., ge=1, description="테이블 번호")
    table_password: str = Field(..., min_length=1, description="테이블 비밀번호")

    class Config:
        json_schema_extra = {
            "example": {
                "store_id": 1,
                "table_number": 5,
                "table_password": "1234"
            }
        }


class TableLoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 57600
    table_id: int
    table_number: int
    session_id: UUID
    store_id: int
    store_name: str


class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)

    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "password": "admin123"
            }
        }


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 57600
    store_id: int
    store_name: str
    username: str
