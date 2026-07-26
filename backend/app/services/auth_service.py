from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    AccountLockedException,
    InactiveAccountException,
    InvalidCredentialsException,
    InvalidRefreshTokenException,
)
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    get_password_hash,
    hash_refresh_token,
    refresh_token_expiry,
    verify_password,
)
from app.models.session import Session as UserSession
from app.models.user import User
from app.schemas.auth import TokenResponse
from app.services import audit_service
from app.services.permission_service import get_effective_permissions


def _issue_tokens(db: Session, user: User, ip: str | None, user_agent: str | None) -> TokenResponse:
    permissions = get_effective_permissions(db, user)
    access_token = create_access_token(subject=user.id, role=user.role.slug, permissions=permissions)

    raw_refresh = generate_refresh_token()
    db.add(
        UserSession(
            user_id=user.id,
            refresh_token_hash=hash_refresh_token(raw_refresh),
            ip_address=ip,
            user_agent=user_agent,
            expires_at=refresh_token_expiry(),
        )
    )
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def authenticate(db: Session, email: str, password: str, ip: str | None, user_agent: str | None) -> TokenResponse:
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()

    if user and user.locked_until and user.locked_until > datetime.now(timezone.utc).replace(tzinfo=None):
        audit_service.log_action(
            db, user_id=user.id, action="login_blocked", entity_type="user",
            entity_id=user.id, ip_address=ip, user_agent=user_agent,
        )
        raise AccountLockedException(
            f"Conta bloqueada por excesso de tentativas. Tente novamente após "
            f"{settings.LOCKOUT_DURATION_MINUTES} minutos ou contate um administrador."
        )

    if not user or not verify_password(password, user.password_hash):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.now(timezone.utc).replace(tzinfo=None) + \
                    timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            db.commit()
            audit_service.log_action(
                db, user_id=user.id, action="login_failed", entity_type="user",
                entity_id=user.id, ip_address=ip, user_agent=user_agent,
            )
        raise InvalidCredentialsException("E-mail ou senha inválidos.")

    if not user.is_active:
        raise InactiveAccountException("Conta desativada. Contate um administrador.")

    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.now(timezone.utc).replace(tzinfo=None)
    user.last_login_ip = ip
    db.commit()

    audit_service.log_action(
        db, user_id=user.id, action="login", entity_type="user",
        entity_id=user.id, ip_address=ip, user_agent=user_agent,
    )
    return _issue_tokens(db, user, ip, user_agent)


def refresh_access_token(db: Session, raw_refresh_token: str, ip: str | None, user_agent: str | None) -> TokenResponse:
    token_hash = hash_refresh_token(raw_refresh_token)
    session = db.execute(
        select(UserSession).where(UserSession.refresh_token_hash == token_hash)
    ).scalar_one_or_none()

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if not session or session.revoked_at is not None or session.expires_at < now:
        raise InvalidRefreshTokenException("Sessão inválida ou expirada. Faça login novamente.")

    user = db.get(User, session.user_id)
    if not user or not user.is_active:
        raise InvalidRefreshTokenException("Usuário inválido ou inativo.")

    # rotação: revoga o token usado e emite um novo par (mitiga replay de refresh token roubado)
    session.revoked_at = now
    db.commit()

    return _issue_tokens(db, user, ip, user_agent)


def logout(db: Session, raw_refresh_token: str) -> None:
    token_hash = hash_refresh_token(raw_refresh_token)
    session = db.execute(
        select(UserSession).where(UserSession.refresh_token_hash == token_hash)
    ).scalar_one_or_none()
    if session and session.revoked_at is None:
        session.revoked_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()
        audit_service.log_action(db, user_id=session.user_id, action="logout", entity_type="user", entity_id=session.user_id)
