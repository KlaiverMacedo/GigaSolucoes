from sqlalchemy import Column, Integer, String, Date, Time, Text, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class OperationStatus(str, enum.Enum):
    AGENDADO = "AGENDADO"
    EM_MONTAGEM = "EM_MONTAGEM"
    EM_OPERACAO = "EM_OPERACAO"
    EM_DESMONTAGEM = "EM_DESMONTAGEM"
    FINALIZADO = "FINALIZADO"
    CANCELADO = "CANCELADO"

class Operation(Base):
    __tablename__ = "operations"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    event_name = Column(String(100), nullable=False)
    event_date = Column(Date, nullable=False)
    address = Column(String(255), nullable=True)
    setup_time = Column(Time, nullable=True)
    breakdown_time = Column(Time, nullable=True)
    pickup_time = Column(Time, nullable=True)
    maintenance_notes = Column(Text, nullable=True)
    observations = Column(Text, nullable=True)
    status = Column(Enum(OperationStatus), default=OperationStatus.AGENDADO)
    vehicle_plate = Column(String(10), nullable=True)
    technician_names = Column(String(255), nullable=True)
    driver_name = Column(String(100), nullable=True)
    period = Column(String(20), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relacionamento com Client
    client = relationship("Client", back_populates="operations")