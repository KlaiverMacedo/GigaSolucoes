import os

class Config:
    # Captura a variável de ambiente do Docker ou usa a string padrão de conexão
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        'postgresql://giga_user:giga_secure_pass@db:5432/giga_sys_db'
    )
    # Desativa o rastreamento de modificações para economizar memória (Performance)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Chave de segurança para futuros tokens JWT (Login)
    SECRET_KEY = os.environ.get('SECRET_KEY', 'giga-chave-mestra-super-segura-2026')