from flask import Blueprint, request, jsonify
from app.models import Usuario
from app.extensions import db

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/api/login', methods=['POST'])
def login():
    dados = request.get_json()
    username = dados.get('username')
    password = dados.get('password')

    # Validação rápida de segurança (Para o nosso teste inicial)
    # Na Fase 3 implementaremos o Hash (Bcrypt) real e a geração do Token JWT
    if username == "master@giga" and password == "123456":
        return jsonify({
            "mensagem": "Autenticado com sucesso",
            "usuario": {
                "nome": "Mestre Jedi",
                "role": "admin"
            },
            "token": "fake-jwt-token-para-testes-iniciais"
        }), 200
        
    return jsonify({"erro": "Credenciais inválidas"}), 401