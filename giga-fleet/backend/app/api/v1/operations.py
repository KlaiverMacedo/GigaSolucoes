from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.core.database import get_db
from app.models.operation import Operation
from app.models.vehicle import Vehicle
from app.models.technician import Technician
from app.models.client import Client
from app.schemas.operation import OperationCreate, OperationUpdate, OperationResponse
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[OperationResponse])
async def get_operations(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    event_date: date = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Operation)
    if status:
        query = query.filter(Operation.status == status)
    if event_date:
        query = query.filter(Operation.event_date == event_date)
    
    operations = query.offset(skip).limit(limit).all()
    
    # Adicionar nome do cliente
    result = []
    for op in operations:
        client = db.query(Client).filter(Client.id == op.client_id).first()
        op_dict = {
            "id": op.id,
            "client_id": op.client_id,
            "client_name": client.name if client else "",
            "event_name": op.event_name,
            "event_date": op.event_date,
            "address": op.address,
            "setup_time": op.setup_time,
            "breakdown_time": op.breakdown_time,
            "pickup_time": op.pickup_time,
            "maintenance_notes": op.maintenance_notes,
            "status": op.status,
            "vehicle": op.vehicle_plate,  # Mudar para vehicle_plate
            "technician": op.technician_names,  # Mudar para technician_names
            "driver": op.driver_name,
            "period": op.period,
            "observations": op.observations,
            "created_at": op.created_at,
            "updated_at": op.updated_at
        }
        result.append(OperationResponse(**op_dict))
    
    return result

@router.get("/{operation_id}", response_model=OperationResponse)
async def get_operation(
    operation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operação não encontrada")
    
    client = db.query(Client).filter(Client.id == operation.client_id).first()
    op_dict = {
        "id": operation.id,
        "client_id": operation.client_id,
        "client_name": client.name if client else "",
        "event_name": operation.event_name,
        "event_date": operation.event_date,
        "address": operation.address,
        "setup_time": operation.setup_time,
        "breakdown_time": operation.breakdown_time,
        "pickup_time": operation.pickup_time,
        "maintenance_notes": operation.maintenance_notes,
        "status": operation.status,
        "vehicle": operation.vehicle_plate,
        "technician": operation.technician_names,
        "driver": operation.driver_name,
        "period": operation.period,
        "observations": operation.observations,
        "created_at": operation.created_at,
        "updated_at": operation.updated_at
    }
    return OperationResponse(**op_dict)

@router.post("/", response_model=OperationResponse)
async def create_operation(
    operation: OperationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar se cliente existe
    client = db.query(Client).filter(Client.id == operation.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Converter os dados para o formato do modelo
    operation_data = operation.model_dump()
    # Renomear campos se necessário
    if 'vehicle' in operation_data:
        operation_data['vehicle_plate'] = operation_data.pop('vehicle')
    if 'technician' in operation_data:
        operation_data['technician_names'] = operation_data.pop('technician')
    if 'driver' in operation_data:
        operation_data['driver_name'] = operation_data.pop('driver')
    
    db_operation = Operation(**operation_data)
    db.add(db_operation)
    db.commit()
    db.refresh(db_operation)
    
    # Buscar o cliente novamente para o nome
    client = db.query(Client).filter(Client.id == db_operation.client_id).first()
    op_dict = {
        "id": db_operation.id,
        "client_id": db_operation.client_id,
        "client_name": client.name if client else "",
        "event_name": db_operation.event_name,
        "event_date": db_operation.event_date,
        "address": db_operation.address,
        "setup_time": db_operation.setup_time,
        "breakdown_time": db_operation.breakdown_time,
        "pickup_time": db_operation.pickup_time,
        "maintenance_notes": db_operation.maintenance_notes,
        "status": db_operation.status,
        "vehicle": db_operation.vehicle_plate,
        "technician": db_operation.technician_names,
        "driver": db_operation.driver_name,
        "period": db_operation.period,
        "observations": db_operation.observations,
        "created_at": db_operation.created_at,
        "updated_at": db_operation.updated_at
    }
    return OperationResponse(**op_dict)

@router.put("/{operation_id}", response_model=OperationResponse)
async def update_operation(
    operation_id: int,
    operation: OperationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not db_operation:
        raise HTTPException(status_code=404, detail="Operação não encontrada")
    
    update_data = operation.model_dump(exclude_unset=True)
    
    # Renomear campos se necessário
    if 'vehicle' in update_data:
        update_data['vehicle_plate'] = update_data.pop('vehicle')
    if 'technician' in update_data:
        update_data['technician_names'] = update_data.pop('technician')
    if 'driver' in update_data:
        update_data['driver_name'] = update_data.pop('driver')
    
    for key, value in update_data.items():
        setattr(db_operation, key, value)
    
    db.commit()
    db.refresh(db_operation)
    
    client = db.query(Client).filter(Client.id == db_operation.client_id).first()
    op_dict = {
        "id": db_operation.id,
        "client_id": db_operation.client_id,
        "client_name": client.name if client else "",
        "event_name": db_operation.event_name,
        "event_date": db_operation.event_date,
        "address": db_operation.address,
        "setup_time": db_operation.setup_time,
        "breakdown_time": db_operation.breakdown_time,
        "pickup_time": db_operation.pickup_time,
        "maintenance_notes": db_operation.maintenance_notes,
        "status": db_operation.status,
        "vehicle": db_operation.vehicle_plate,
        "technician": db_operation.technician_names,
        "driver": db_operation.driver_name,
        "period": db_operation.period,
        "observations": db_operation.observations,
        "created_at": db_operation.created_at,
        "updated_at": db_operation.updated_at
    }
    return OperationResponse(**op_dict)

@router.delete("/{operation_id}")
async def delete_operation(
    operation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operação não encontrada")
    
    db.delete(operation)
    db.commit()
    return {"message": "Operação excluída com sucesso"}

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    today = datetime.now().date()
    
    # Veículos em uso (EM_USO)
    vehicles_in_use = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.EM_USO).count()
    
    # Veículos em manutenção
    vehicles_maintenance = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MANUTENCAO).count()
    
    # Técnicos disponíveis
    technicians_available = db.query(Technician).filter(
        Technician.is_available == True,
        Technician.status == "DISPONIVEL"
    ).count()
    
    # Técnicos em folga
    technicians_on_leave = db.query(Technician).filter(Technician.status == "FOLGA").count()
    
    # Operações hoje
    operations_today = db.query(Operation).filter(Operation.event_date == today).count()
    
    # Manutenções pendentes
    maintenance_pending = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MANUTENCAO).count()
    
    return {
        "vehicles_in_use": vehicles_in_use,
        "vehicles_maintenance": vehicles_maintenance,
        "technicians_available": technicians_available,
        "technicians_on_leave": technicians_on_leave,
        "operations_today": operations_today,
        "maintenance_pending": maintenance_pending
    }

@router.post("/", response_model=OperationResponse)
async def create_operation(
    operation: OperationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # ... código existente ...
    
    # Sincronizar status após criar
    await sync_operation_status(db_operation.id, db, current_user)
    
    return OperationResponse(**op_dict)

@router.put("/{operation_id}", response_model=OperationResponse)
async def update_operation(
    operation_id: int,
    operation: OperationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # ... código existente ...
    
    # Sincronizar status após atualizar
    await sync_operation_status(db_operation.id, db, current_user)
    
    return OperationResponse(**op_dict)