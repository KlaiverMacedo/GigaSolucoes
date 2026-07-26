from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional
from app.core.database import get_db
from app.models.operation import Operation, OperationStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.technician import Technician
from app.models.client import Client
from app.api.v1.auth import get_current_user

router = APIRouter()


# ============================================================
# ENDPOINTS DE STATUS E DASHBOARD
# ============================================================

@router.get("/status/dashboard")
async def get_status_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retorna o status atualizado para o dashboard"""
    
    today = date.today()
    
    try:
        # Veículos em uso hoje
        vehicles_in_use = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.EM_USO).count()
    except:
        vehicles_in_use = 0
    
    try:
        # Veículos em manutenção
        vehicles_maintenance = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MANUTENCAO).count()
    except:
        vehicles_maintenance = 0
    
    try:
        # Técnicos disponíveis
        technicians_available = db.query(Technician).filter(
            Technician.is_available == True
        ).count()
    except:
        technicians_available = 0
    
    try:
        # Técnicos ocupados
        technicians_occupied = db.query(Technician).filter(
            Technician.is_available == False
        ).count()
    except:
        technicians_occupied = 0
    
    try:
        # Operações hoje
        operations_today = db.query(Operation).filter(Operation.event_date == today).count()
    except:
        operations_today = 0
    
    try:
        # Manutenções pendentes
        maintenance_pending = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MANUTENCAO).count()
    except:
        maintenance_pending = 0
    
    return {
        "vehicles_in_use": vehicles_in_use,
        "vehicles_maintenance": vehicles_maintenance,
        "technicians_available": technicians_available,
        "technicians_occupied": technicians_occupied,
        "operations_today": operations_today,
        "maintenance_pending": maintenance_pending
    }


# ============================================================
# ENDPOINTS DE RECURSOS DISPONÍVEIS
# ============================================================

@router.get("/available")
async def get_available_resources(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retorna todos os recursos disponíveis (veículos e técnicos)"""
    
    # Veículos disponíveis (exclui em uso, manutenção e indisponíveis)
    available_vehicles = db.query(Vehicle).filter(
        Vehicle.status.in_([VehicleStatus.DISPONIVEL, VehicleStatus.RESERVADO])
    ).all()
    
    # Técnicos disponíveis (apenas os que estão disponíveis)
    available_technicians = db.query(Technician).filter(
        Technician.is_available == True
    ).all()
    
    # Lista de veículos formatada
    vehicles_list = []
    for v in available_vehicles:
        vehicles_list.append({
            "id": v.id,
            "plate": v.plate,
            "model": v.model,
            "brand": v.brand,
            "capacity": v.capacity,
            "status": v.status.value if hasattr(v.status, 'value') else str(v.status)
        })
    
    # Lista de técnicos formatada
    technicians_list = []
    for t in available_technicians:
        technicians_list.append({
            "id": t.id,
            "name": t.name,
            "function": t.function,
            "team": t.team,
            "is_available": t.is_available
        })
    
    return {
        "vehicles": vehicles_list,
        "technicians": technicians_list
    }


# ============================================================
# ENDPOINTS DE SINCRONIZAÇÃO DE OPERAÇÕES
# ============================================================

@router.post("/sync/operation/{operation_id}")
async def sync_operation_status(
    operation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Sincroniza o status da operação com técnicos e veículos"""
    
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operação não encontrada")
    
    # 1. ATUALIZAR VEÍCULO
    if operation.vehicle_plate:
        vehicle = db.query(Vehicle).filter(Vehicle.plate == operation.vehicle_plate).first()
        if vehicle:
            # Verificar se veículo está em manutenção (não pode ser usado)
            if vehicle.status == VehicleStatus.MANUTENCAO:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Veículo {vehicle.plate} está em manutenção"
                )
            
            # Atualizar status baseado na operação
            if operation.status in [OperationStatus.EM_MONTAGEM, OperationStatus.EM_OPERACAO]:
                vehicle.status = VehicleStatus.EM_USO
            elif operation.status == OperationStatus.FINALIZADO:
                vehicle.status = VehicleStatus.DISPONIVEL
            elif operation.status == OperationStatus.CANCELADO:
                vehicle.status = VehicleStatus.DISPONIVEL
            db.commit()
    
    # 2. ATUALIZAR TÉCNICOS
    if operation.technician_names:
        tech_names = [name.strip() for name in operation.technician_names.split(',')]
        for tech_name in tech_names:
            technician = db.query(Technician).filter(Technician.name == tech_name).first()
            if technician:
                # Atualizar status
                if operation.status in [OperationStatus.EM_MONTAGEM, OperationStatus.EM_OPERACAO]:
                    technician.is_available = False
                elif operation.status == OperationStatus.FINALIZADO:
                    technician.is_available = True
                elif operation.status == OperationStatus.CANCELADO:
                    technician.is_available = True
                db.commit()
    
    # 3. ATUALIZAR MOTORISTA
    if operation.driver_name:
        driver = db.query(Technician).filter(Technician.name == operation.driver_name).first()
        if driver:
            if operation.status in [OperationStatus.EM_MONTAGEM, OperationStatus.EM_OPERACAO]:
                driver.is_available = False
            elif operation.status == OperationStatus.FINALIZADO:
                driver.is_available = True
            elif operation.status == OperationStatus.CANCELADO:
                driver.is_available = True
            db.commit()
    
    return {
        "message": "Status sincronizado com sucesso",
        "operation_id": operation_id,
        "status": operation.status.value if hasattr(operation.status, 'value') else str(operation.status)
    }


@router.post("/sync/operations/today")
async def sync_all_today_operations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Sincroniza todas as operações do dia"""
    
    today = date.today()
    
    # Buscar operações ativas hoje
    active_operations = db.query(Operation).filter(
        Operation.event_date == today,
        Operation.status.in_([OperationStatus.EM_MONTAGEM, OperationStatus.EM_OPERACAO])
    ).all()
    
    # 1. Resetar todos os veículos para DISPONIVEL
    db.query(Vehicle).update({Vehicle.status: VehicleStatus.DISPONIVEL})
    
    # 2. Resetar todos os técnicos para disponíveis
    db.query(Technician).update({Technician.is_available: True})
    
    # 3. Atualizar veículos em uso
    for op in active_operations:
        if op.vehicle_plate:
            vehicle = db.query(Vehicle).filter(Vehicle.plate == op.vehicle_plate).first()
            if vehicle:
                vehicle.status = VehicleStatus.EM_USO
    
    # 4. Atualizar técnicos ocupados
    for op in active_operations:
        if op.technician_names:
            tech_names = [name.strip() for name in op.technician_names.split(',')]
            for tech_name in tech_names:
                technician = db.query(Technician).filter(Technician.name == tech_name).first()
                if technician:
                    technician.is_available = False
        
        # Atualizar motorista
        if op.driver_name:
            driver = db.query(Technician).filter(Technician.name == op.driver_name).first()
            if driver:
                driver.is_available = False
    
    db.commit()
    
    return {
        "message": "Todas as operações sincronizadas com sucesso",
        "active_operations": len(active_operations)
    }


# ============================================================
# ENDPOINTS DE ATUALIZAÇÃO MANUAL DE STATUS
# ============================================================

@router.put("/vehicle/{plate}/status")
async def update_vehicle_status(
    plate: str,
    new_status: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Atualiza manualmente o status de um veículo"""
    
    vehicle = db.query(Vehicle).filter(Vehicle.plate == plate).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    # Validar status
    valid_status = ["DISPONIVEL", "EM_USO", "MANUTENCAO", "RESERVADO", "INDISPONIVEL"]
    if new_status not in valid_status:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    # Converter para Enum
    try:
        vehicle.status = VehicleStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    db.commit()
    
    return {
        "message": f"Status do veículo {plate} atualizado para {new_status}",
        "plate": plate,
        "status": new_status
    }


@router.put("/technician/{technician_id}/status")
async def update_technician_status(
    technician_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Atualiza manualmente o status de um técnico"""
    
    technician = db.query(Technician).filter(Technician.id == technician_id).first()
    if not technician:
        raise HTTPException(status_code=404, detail="Técnico não encontrado")
    
    valid_status = ["DISPONIVEL", "OCUPADO", "FOLGA", "AUSENTE"]
    if new_status not in valid_status:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    technician.status = new_status
    technician.is_available = (new_status == "DISPONIVEL")
    
    db.commit()
    
    return {
        "message": f"Status do técnico {technician.name} atualizado para {new_status}",
        "id": technician_id,
        "name": technician.name,
        "status": new_status,
        "is_available": technician.is_available
    }


# ============================================================
# ENDPOINTS DE RELATÓRIOS
# ============================================================

@router.get("/report/operations")
async def get_operations_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Gera relatório de operações por período"""
    
    query = db.query(Operation)
    
    if start_date:
        query = query.filter(Operation.event_date >= start_date)
    if end_date:
        query = query.filter(Operation.event_date <= end_date)
    
    operations = query.all()
    
    # Estatísticas
    total = len(operations)
    by_status = {}
    for op in operations:
        status = op.status.value if hasattr(op.status, 'value') else str(op.status)
        by_status[status] = by_status.get(status, 0) + 1
    
    return {
        "total": total,
        "by_status": by_status,
        "operations": operations
    }


# ============================================================
# ENDPOINTS DE CLIENTES (para manter compatibilidade)
# ============================================================

@router.get("/clients")
async def get_clients_list(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lista todos os clientes"""
    return db.query(Client).all()