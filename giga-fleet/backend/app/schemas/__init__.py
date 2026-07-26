from .auth import LoginRequest, TokenResponse, RefreshTokenRequest, ChangePasswordRequest
from .user import UserCreate, UserUpdate, UserResponse, UserRole
from .client import ClientCreate, ClientUpdate, ClientResponse
from .vehicle import VehicleCreate, VehicleUpdate, VehicleResponse, VehicleStatus
from .technician import TechnicianCreate, TechnicianUpdate, TechnicianResponse
from .operation import OperationCreate, OperationUpdate, OperationResponse, OperationStatus