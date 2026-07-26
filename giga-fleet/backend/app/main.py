from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, vehicles, technicians, operations, clients, integration

# Criar tabelas
Base.metadata.create_all(bind=engine)

# App - DEFINIR O APP PRIMEIRO
app = FastAPI(
    title="Giga Fleet API",
    description="API para gestão de frota e operações da Giga Soluções Audiovisuais",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas - DEPOIS DE DEFINIR O APP
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(clients.router, prefix="/api/v1/clients", tags=["Clients"])
app.include_router(vehicles.router, prefix="/api/v1/vehicles", tags=["Vehicles"])
app.include_router(technicians.router, prefix="/api/v1/technicians", tags=["Technicians"])
app.include_router(operations.router, prefix="/api/v1/operations", tags=["Operations"])
app.include_router(integration.router, prefix="/api/v1/integration", tags=["Integration"])

@app.get("/")
async def root():
    return {"message": "Giga Fleet API", "status": "online"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}