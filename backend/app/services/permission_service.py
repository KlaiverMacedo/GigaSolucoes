"""Calcula o conjunto efetivo de permissões de um usuário: permissões do papel
mais overrides individuais (concessão ou revogação)."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.rbac import Permission, RolePermission, UserPermission
from app.models.user import User


def get_effective_permissions(db: Session, user: User) -> list[str]:
    role_perm_codes = db.execute(
        select(Permission.code)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .where(RolePermission.role_id == user.role_id)
    ).scalars().all()

    effective = set(role_perm_codes)

    overrides = db.execute(
        select(Permission.code, UserPermission.is_granted)
        .join(UserPermission, UserPermission.permission_id == Permission.id)
        .where(UserPermission.user_id == user.id)
    ).all()

    for code, is_granted in overrides:
        if is_granted:
            effective.add(code)
        else:
            effective.discard(code)

    return sorted(effective)
