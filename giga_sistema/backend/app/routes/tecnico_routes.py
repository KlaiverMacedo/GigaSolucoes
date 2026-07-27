from flask import Blueprint, request, jsonify
from app.models import Tecnico
from app.extensions import db

# Criando o Blueprint para as rotas de técnicos
tecnico_bp = Blueprint('tecnico_bp', __name__)

@tecnico_bp.route('/api/tecnicos', methods=['POST'])
def criar_tecnico():
    """Cadastra um novo técnico no sistema"""
    dados = request.get_json()
    
    # Validação básica
    if not dados or not dados.get('nome'):
        return jsonify({"erro": "O campo 'nome' é obrigatório."}), 400
        
    novo_tecnico = Tecnico(
        nome=dados.get('nome'),
        funcao=dados.get('funcao', 'Geral'), # Ex: Áudio, LED, etc.
        telefone=dados.get('telefone', '')
    )
    
    try:
        db.session.add(novo_tecnico)
        db.session.commit()
        return jsonify({
            "mensagem": "Técnico cadastrado com sucesso!",
            "tecnico": {
                "id": novo_tecnico.id,
                "nome": novo_tecnico.nome,
                "funcao": novo_tecnico.funcao
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Falha ao cadastrar: {str(e)}"}), 500


@tecnico_bp.route('/api/tecnicos', methods=['GET'])
def listar_tecnicos():
    """Retorna todos os técnicos disponíveis e ocupados"""
    tecnicos = Tecnico.query.all()
    
    resultado = []
    for t in tecnicos:
        resultado.append({
            "id": t.id,
            "nome": t.nome,
            "funcao": t.funcao,
            "disponivel": t.disponivel
        })
        
    return jsonify(resultado), 200