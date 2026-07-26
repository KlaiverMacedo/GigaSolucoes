import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date
from app.core.database import SessionLocal
from app.models.operation import Operation, OperationStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.technician import Technician

def sync_all_status():
    db = SessionLocal()
    try:
        today = date.today()
        
        # Buscar operações ativas hoje
        active_operations = db.query(Operation).filter(
            Operation.event_date == today,
            Operation.status.in_([OperationStatus.EM_MONTAGEM, OperationStatus.EM_OPERACAO])
        ).all()
        
        # Resetar todos os veículos para DISPONIVEL
        db.query(Vehicle).update({Vehicle.status: VehicleStatus.DISPONIVEL})
        
        # Resetar todos os técnicos para disponíveis
        db.query(Technician).update({Technician.is_available: True})
        
        # Atualizar veículos em uso
        for op in active_operations:
            if op.vehicle_plate:
                vehicle = db.query(Vehicle).filter(Vehicle.plate == op.vehicle_plate).first()
                if vehicle:
                    vehicle.status = VehicleStatus.EM_USO
        
        # Atualizar técnicos ocupados
        for op in active_operations:
            if op.technician_names:
                tech_names = [name.strip() for name in op.technician_names.split(',')]
                for tech_name in tech_names:
                    technician = db.query(Technician).filter(Technician.name == tech_name).first()
                    if technician:
                        technician.is_available = False
        
        db.commit()
        print("✅ Status sincronizado com sucesso!")
        print(f"   - Operações ativas: {len(active_operations)}")
        
        # Mostrar resumo
        vehicles_in_use = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.EM_USO).count()
        techs_available = db.query(Technician).filter(Technician.is_available == True).count()
        total_techs = db.query(Technician).count()
        
        print(f"   - Veículos em uso: {vehicles_in_use}")
        print(f"   - Técnicos disponíveis: {techs_available}/{total_techs}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    sync_all_status()