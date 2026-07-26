from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum

class VehicleStatus(str, Enum):
    DISPONIVEL = "DISPONIVEL"
    EM_USO = "EM_USO"
    MANUTENCAO = "MANUTENCAO"
    RESERVADO = "RESERVADO"

class VehicleBase(BaseModel):
    plate: str
    model: str
    brand: str
    capacity: Optional[str] = None
    status: VehicleStatus = VehicleStatus.DISPONIVEL
    mileage: Optional[float] = 0
    driver_name: Optional[str] = None
    documentation_date: Optional[date] = None
    next_maintenance: Optional[date] = None
    observations: Optional[str] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    plate: Optional[str] = None
    model: Optional[str] = None
    brand: Optional[str] = None
    capacity: Optional[str] = None
    status: Optional[VehicleStatus] = None
    mileage: Optional[float] = None
    driver_name: Optional[str] = None
    documentation_date: Optional[date] = None
    next_maintenance: Optional[date] = None
    observations: Optional[str] = None

class VehicleResponse(VehicleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True