"""
Registro central de models. O Alembic aponta para `Base.metadata` e depende de
todos os models estarem importados aqui para o autogenerate funcionar.
"""
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.rbac import Permission, Role, RolePermission, UserPermission  # noqa: F401
from app.models.session import Session  # noqa: F401
from app.models.user import User  # noqa: F401

# Módulos de domínio (Fase 2): client, vehicle, technician, operation
