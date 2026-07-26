from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TechnicianBase(BaseModel):
    name: str
    phone: Optional[str] = None
    function: Optional[str] = None
    team: Optional[str] = None
    is_available: bool = True
    photo_url: Optional[str] = None
    observations: Optional[str] = None

class TechnicianCreate(TechnicianBase):
    pass

class TechnicianUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    function: Optional[str] = None
    team: Optional[str] = None
    is_available: Optional[bool] = None
    photo_url: Optional[str] = None
    observations: Optional[str] = None

class TechnicianResponse(TechnicianBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True