"""
Dependencies de autenticação e autorização usadas em todas as rotas protegidas.

Modelo de permissões: o access token carrega a lista efetiva de permissões do
usuário (papel + overrides individuais) no momento da emissão. Isso evita uma
consulta ao banco a cada request, ao custo de a permissão só ser reavaliada
quando o token expira/renova (no máximo ACCESS_TOKEN_EXPIRE_MINUTES). Ações
destrutivas sensíveis (ex.: exclusão de usuário) sempre podem revalidar contra
o banco se necessário — ver `require_fresh_permission`.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Não autenticado.")

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido ou expirado.")

    user_id = payload.get("sub")
    user = db.get(User, int(user_id)) if user_id else None
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuário inválido ou inativo.")

    # anexa as permissões do token ao objeto (não persistido) para uso pelos
    # dependencies de autorização, sem round-trip extra ao banco
    user._token_permissions = set(payload.get("perms", []))  # type: ignore[attr-defined]
    return user


def require_permission(permission_code: str):
    """Dependency factory: `Depends(require_permission("vehicles.delete"))`."""

    def checker(current_user: User = Depends(get_current_user)) -> User:
        perms: set[str] = getattr(current_user, "_token_permissions", set())
        if permission_code not in perms:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Permissão negada: requer '{permission_code}'.",
            )
        return current_user

    return checker


def require_role(*role_slugs: str):
    """Dependency factory para checagens simples por papel (ex.: telas exclusivas de admin)."""

    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.slug not in role_slugs:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Acesso restrito para este papel.")
        return current_user

    return checker
