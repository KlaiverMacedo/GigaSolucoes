from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, DECIMAL, Date, Text
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class VehicleStatus(str, enum.Enum):
    DISPONIVEL = "DISPONIVEL"
    EM_USO = "EM_USO"
    MANUTENCAO = "MANUTENCAO"
    RESERVADO = "RESERVADO"
    INDISPONIVEL = "INDISPONIVEL"  # Novo status

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    plate = Column(String(10), unique=True, nullable=False, index=True)
    model = Column(String(50), nullable=False)
    brand = Column(String(50), nullable=False)
    capacity = Column(String(20), nullable=True)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.DISPONIVEL)
    mileage = Column(DECIMAL(10,2), default=0)
    driver_name = Column(String(100), nullable=True)
    documentation_date = Column(Date, nullable=True)
    next_maintenance = Column(Date, nullable=True)
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())