from flask import Flask
from app.config import Config
from app.extensions import db
from flask_cors import CORS

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Libera a API para receber requisições do Frontend (CORS)
    CORS(app)

    # Inicia as extensões
    db.init_app(app)

    # Importa os models para o SQLAlchemy reconhecê-los e criar as tabelas
    from app import models

    # Garante que as tabelas sejam criadas sempre que o app iniciar
    with app.app_context():
        db.create_all()

    # Rota de teste simples para verificar se a API está viva
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {"status": "online", "sistema": "Giga.Sys API"}, 200
        
    # === REGISTRO DOS BLUEPRINTS (ROTAS) ===
    from app.routes.tecnico_routes import tecnico_bp
    app.register_blueprint(tecnico_bp)
    
    from app.routes.veiculo_routes import veiculo_bp
    app.register_blueprint(veiculo_bp)
    
    from app.routes.operacao_routes import operacao_bp
    app.register_blueprint(operacao_bp)
    
    from app.routes.alocacao_routes import alocacao_bp
    app.register_blueprint(alocacao_bp)
    
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)
    # =======================================

    return app