from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import Operacao
from app.extensions import db

operacao_bp = Blueprint('operacao_bp', __name__)

@operacao_bp.route('/api/operacoes', methods=['POST'])
def criar_operacao():
    """Cadastra um novo evento/operação no sistema"""
    dados = request.get_json()
    
    if not dados or not dados.get('os_numero') or not dados.get('cliente_local') or not dados.get('data_operacao'):
        return jsonify({"erro": "Os campos 'os_numero', 'cliente_local' e 'data_operacao' são obrigatórios."}), 400
        
    try:
        # Converte a string de data (YYYY-MM-DD) para objeto Date do Python
        data_op = datetime.strptime(dados.get('data_operacao'), '%Y-%m-%d').date()
        
        # Opcional: Converter horário
        horario = None
        if dados.get('horario_inicio'):
            horario = datetime.strptime(dados.get('horario_inicio'), '%H:%M').time()
            
        nova_operacao = Operacao(
            os_numero=dados.get('os_numero'),
            cliente_local=dados.get('cliente_local'),
            tipo=dados.get('tipo', 'Montagem'),
            data_operacao=data_op,
            horario_inicio=horario,
            periodo=dados.get('periodo', 'Manha'),
            observacoes=dados.get('observacoes', '')
        )
        
        db.session.add(nova_operacao)
        db.session.commit()
        
        return jsonify({
            "mensagem": "Operação cadastrada com sucesso!",
            "operacao": {
                "id": nova_operacao.id,
                "os_numero": nova_operacao.os_numero,
                "cliente_local": nova_operacao.cliente_local
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Falha ao cadastrar operação: {str(e)}"}), 500

@operacao_bp.route('/api/operacoes', methods=['GET'])
def listar_operacoes():
    """Retorna todas as operações cadastradas"""
    operacoes = Operacao.query.all()
    
    resultado = []
    for op in operacoes:
        resultado.append({
            "id": op.id,
            "os_numero": op.os_numero,
            "cliente_local": op.cliente_local,
            "data": op.data_operacao.strftime('%Y-%m-%d'),
            "periodo": op.periodo
        })
        
    return jsonify(resultado), 200