from flask import Blueprint, request, jsonify
from app.models import Alocacao, Tecnico, Veiculo, Operacao
from app.extensions import db

alocacao_bp = Blueprint('alocacao_bp', __name__)

@alocacao_bp.route('/api/alocacoes', methods=['POST'])
def criar_alocacao():
    """Vincula um técnico a uma operação e a um veículo (opcional)"""
    dados = request.get_json()
    
    if not dados or not dados.get('operacao_id') or not dados.get('tecnico_id'):
        return jsonify({"erro": "Os IDs da operação e do técnico são obrigatórios."}), 400
        
    # Como Arquitetos, devemos validar se os registros realmente existem antes de vincular
    operacao = Operacao.query.get(dados.get('operacao_id'))
    tecnico = Tecnico.query.get(dados.get('tecnico_id'))
    
    if not operacao or not tecnico:
        return jsonify({"erro": "Operação ou Técnico não encontrados no banco de dados."}), 404
        
    nova_alocacao = Alocacao(
        operacao_id=operacao.id,
        tecnico_id=tecnico.id,
        veiculo_id=dados.get('veiculo_id') # Pode ser nulo caso o técnico vá direto
    )
    
    # Atualiza o status do técnico para indisponível
    tecnico.disponivel = False
    
    try:
        db.session.add(nova_alocacao)
        db.session.commit()
        return jsonify({"mensagem": "Alocação realizada com sucesso!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Falha ao alocar: {str(e)}"}), 500