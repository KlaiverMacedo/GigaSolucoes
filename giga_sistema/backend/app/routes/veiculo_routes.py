from flask import Blueprint, request, jsonify
from app.models import Veiculo
from app.extensions import db

veiculo_bp = Blueprint('veiculo_bp', __name__) # <-- Esta linha tem que estar assim

@veiculo_bp.route('/api/veiculos', methods=['POST'])
def criar_veiculo():
    """Cadastra um novo veículo na frota"""
    dados = request.get_json()
    
    # Validação dos campos obrigatórios
    if not dados or not dados.get('placa') or not dados.get('modelo'):
        return jsonify({"erro": "Os campos 'placa' e 'modelo' são obrigatórios."}), 400
        
    # Tratamento de dados: Padroniza a placa (Maiúscula e sem espaços/traços)
    placa_formatada = dados.get('placa').upper().replace(" ", "").replace("-", "")
    
    # Verifica se o veículo já está cadastrado
    veiculo_existente = Veiculo.query.filter_by(placa=placa_formatada).first()
    if veiculo_existente:
        return jsonify({"erro": "Já existe um veículo cadastrado com esta placa."}), 409
        
    novo_veiculo = Veiculo(
        placa=placa_formatada,
        modelo=dados.get('modelo'),
        situacao=dados.get('situacao', 'disponivel')
    )
    
    try:
        db.session.add(novo_veiculo)
        db.session.commit()
        return jsonify({
            "mensagem": "Veículo cadastrado com sucesso!",
            "veiculo": {
                "id": novo_veiculo.id,
                "placa": novo_veiculo.placa,
                "modelo": novo_veiculo.modelo,
                "situacao": novo_veiculo.situacao
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Falha ao cadastrar: {str(e)}"}), 500


@veiculo_bp.route('/api/veiculos', methods=['GET'])
def listar_veiculos():
    """Retorna todos os veículos da frota"""
    veiculos = Veiculo.query.all()
    
    resultado = []
    for v in veiculos:
        resultado.append({
            "id": v.id,
            "placa": v.placa,
            "modelo": v.modelo,
            "situacao": v.situacao
        })
        
    return jsonify(resultado), 200