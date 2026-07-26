from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1 import auth  # demais routers entram na Fase 2
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.limiter import limiter

app = FastAPI(
    title=settings.APP_NAME,
    description="API do Giga Fleet — gestão de frota, técnicos e operações da Giga Soluções Audiovisuais.",
    version="2.0.0",
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.APP_ENV == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticação"])
# Fase 2: vehicles, technicians, operations, clients, users, dashboard, planning

@app.get("/")
async def root():
    return {"message": settings.APP_NAME, "status": "online", "version": "2.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
