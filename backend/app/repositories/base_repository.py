"""
Repository genérico com operações CRUD comuns. Repositórios de entidade
(ex.: VehicleRepository) herdam daqui e adicionam consultas específicas
(filtros, buscas), mantendo a camada de serviço livre de SQL/ORM direto.
"""
from typing import Generic, Type, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, db: Session, model: Type[ModelType]):
        self.db = db
        self.model = model

    def get(self, id_: int) -> ModelType | None:
        return self.db.get(self.model, id_)

    def list(self, *, offset: int = 0, limit: int = 50) -> list[ModelType]:
        stmt = select(self.model).offset(offset).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def create(self, obj: ModelType) -> ModelType:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, obj: ModelType) -> ModelType:
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: ModelType) -> None:
        self.db.delete(obj)
        self.db.commit()
