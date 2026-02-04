from typing import Optional, Any


class AppException(Exception):
    """기본 애플리케이션 예외"""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Any] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details
        super().__init__(self.message)


class NotFoundException(AppException):
    """리소스를 찾을 수 없음"""
    
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(message, 404, "NOT_FOUND", details)


class ValidationError(AppException):
    """유효성 검증 실패"""
    
    def __init__(self, message: str = "Validation failed", details: Optional[Any] = None):
        super().__init__(message, 400, "VALIDATION_ERROR", details)


class AuthenticationError(AppException):
    """인증 실패"""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Any] = None):
        super().__init__(message, 401, "AUTHENTICATION_ERROR", details)


class ForbiddenError(AppException):
    """접근 권한 없음"""
    
    def __init__(self, message: str = "Access forbidden", details: Optional[Any] = None):
        super().__init__(message, 403, "FORBIDDEN", details)


class ConflictError(AppException):
    """리소스 충돌"""
    
    def __init__(self, message: str = "Resource conflict", details: Optional[Any] = None):
        super().__init__(message, 409, "CONFLICT", details)


class BusinessLogicError(AppException):
    """비즈니스 로직 오류"""
    
    def __init__(self, message: str = "Business logic error", details: Optional[Any] = None):
        super().__init__(message, 422, "BUSINESS_LOGIC_ERROR", details)


# Alias for backward compatibility
NotFoundError = NotFoundException
AuthorizationError = ForbiddenError
