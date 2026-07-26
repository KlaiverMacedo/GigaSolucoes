from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.technician import Technician
from app.schemas.technician import TechnicianCreate, TechnicianUpdate, TechnicianResponse
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TechnicianResponse])
async def get_technicians(
    skip: int = 0,
    limit: int = 100,
    is_available: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Technician)
    if is_available is not None:
        query = query.filter(Technician.is_available == is_available)
    return query.offset(skip).limit(limit).all()

@router.get("/available", response_model=List[TechnicianResponse])
async def get_available_technicians(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retorna apenas técnicos disponíveis"""
    return db.query(Technician).filter(Technician.is_available == True).all()

# ... resto do código

@router.get("/{technician_id}", response_model=TechnicianResponse)
async def get_technician(
    technician_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    technician = db.query(Technician).filter(Technician.id == technician_id).first()
    if not technician:
        raise HTTPException(status_code=404, detail="Técnico não encontrado")
    return technician

@router.post("/", response_model=TechnicianResponse)
async def create_technician(
    technician: TechnicianCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_technician = Technician(**technician.model_dump())
    db.add(db_technician)
    db.commit()
    db.refresh(db_technician)
    return db_technician

@router.put("/{technician_id}", response_model=TechnicianResponse)
async def update_technician(
    technician_id: int,
    technician: TechnicianUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_technician = db.query(Technician).filter(Technician.id == technician_id).first()
    if not db_technician:
        raise HTTPException(status_code=404, detail="Técnico não encontrado")
    
    update_data = technician.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_technician, key, value)
    
    db.commit()
    db.refresh(db_technician)
    return db_technician

@router.delete("/{technician_id}")
async def delete_technician(
    technician_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    technician = db.query(Technician).filter(Technician.id == technician_id).first()
    if not technician:
        raise HTTPException(status_code=404, detail="Técnico não encontrado")
    
    db.delete(technician)
    db.commit()
    return {"message": "Técnico excluído com sucesso"}