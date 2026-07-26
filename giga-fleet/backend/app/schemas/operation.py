from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from enum import Enum

class OperationStatus(str, Enum):
    AGENDADO = "AGENDADO"
    EM_MONTAGEM = "EM_MONTAGEM"
    EM_OPERACAO = "EM_OPERACAO"
    EM_DESMONTAGEM = "EM_DESMONTAGEM"
    FINALIZADO = "FINALIZADO"
    CANCELADO = "CANCELADO"

class OperationBase(BaseModel):
    client_id: int  # Mudar para client_id
    event_name: str
    event_date: date
    address: Optional[str] = None
    setup_time: Optional[time] = None
    breakdown_time: Optional[time] = None
    pickup_time: Optional[time] = None
    maintenance_notes: Optional[str] = None
    status: OperationStatus = OperationStatus.AGENDADO
    vehicle: Optional[str] = None
    technician: Optional[str] = None
    driver: Optional[str] = None
    period: Optional[str] = None
    observations: Optional[str] = None

class OperationCreate(OperationBase):
    pass

class OperationUpdate(BaseModel):
    client_id: Optional[int] = None
    event_name: Optional[str] = None
    event_date: Optional[date] = None
    address: Optional[str] = None
    setup_time: Optional[time] = None
    breakdown_time: Optional[time] = None
    pickup_time: Optional[time] = None
    maintenance_notes: Optional[str] = None
    status: Optional[OperationStatus] = None
    vehicle: Optional[str] = None
    technician: Optional[str] = None
    driver: Optional[str] = None
    period: Optional[str] = None
    observations: Optional[str] = None

class OperationResponse(OperationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    client_name: Optional[str] = None  # Adicionar nome do cliente

    class Config:
        from_attributes = True