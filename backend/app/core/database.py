"""
Engine e sessão do SQLAlchemy. As tabelas são criadas via migrations do Alembic
(ver /backend/alembic) — NÃO usamos Base.metadata.create_all em produção.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base declarativa (estilo SQLAlchemy 2.0) para todos os models."""
    pass


def get_db():
    """Dependency do FastAPI: entrega uma sessão por request e garante o fechamento."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
