from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse, UserMeResponse
from app.services import auth_service
from app.services.permission_service import get_effective_permissions

router = APIRouter()


def _client_ip(request: Request) -> str:
    return request.headers.get("x-forwarded-for", request.client.host if request.client else "")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")  # camada extra ao lockout por conta: mitiga brute-force distribuído por IP
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    return auth_service.authenticate(
        db, payload.email, payload.password,
        ip=_client_ip(request), user_agent=request.headers.get("user-agent"),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    return auth_service.refresh_access_token(
        db, payload.refresh_token,
        ip=_client_ip(request), user_agent=request.headers.get("user-agent"),
    )


@router.post("/logout", status_code=204)
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    auth_service.logout(db, payload.refresh_token)


@router.get("/me", response_model=UserMeResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return UserMeResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role.slug,
        permissions=get_effective_permissions(db, current_user),
        avatar_url=current_user.avatar_url,
        must_change_password=current_user.must_change_password,
    )
