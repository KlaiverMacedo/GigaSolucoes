"""Exceções de domínio. Traduzidas para respostas HTTP por um handler global
em main.py, mantendo a camada de serviço independente do FastAPI."""


class AppException(Exception):
    status_code = 400

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class InvalidCredentialsException(AppException):
    status_code = 401


class AccountLockedException(AppException):
    status_code = 423  # Locked


class InactiveAccountException(AppException):
    status_code = 403


class InvalidRefreshTokenException(AppException):
    status_code = 401


class NotFoundException(AppException):
    status_code = 404


class ConflictException(AppException):
    status_code = 409
