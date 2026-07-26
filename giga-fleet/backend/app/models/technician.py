from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Technician(Base):
    __tablename__ = "technicians"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    function = Column(String(50), nullable=True)
    team = Column(String(50), nullable=True)
    is_available = Column(Boolean, default=True)
    status = Column(String(20), default="DISPONIVEL")  # DISPONIVEL, OCUPADO, FOLGA, AUSENTE
    photo_url = Column(String(255), nullable=True)
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())