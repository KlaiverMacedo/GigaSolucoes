from datetime import datetime
from app.extensions import db

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='operador') # admin, supervisor, operador, tecnico
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento: Um usuário pode ser um técnico no sistema
    tecnico = db.relationship('Tecnico', back_populates='usuario', uselist=False)

class Tecnico(db.Model):
    __tablename__ = 'tecnicos'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    funcao = db.Column(db.String(100)) # Áudio, LED, Iluminação
    telefone = db.Column(db.String(20))
    disponivel = db.Column(db.Boolean, default=True)
    
    # Chave estrangeira (FK) ligando ao usuário de acesso
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True)
    usuario = db.relationship('Usuario', back_populates='tecnico')
    
    # Relacionamento com as alocações em eventos
    alocacoes = db.relationship('Alocacao', back_populates='tecnico', cascade="all, delete-orphan")

class Veiculo(db.Model):
    __tablename__ = 'veiculos'
    
    id = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(10), unique=True, nullable=False)
    modelo = db.Column(db.String(50), nullable=False) # Ex: Fiorino, Scudo
    situacao = db.Column(db.String(50), default='disponivel') # disponivel, manutencao
    
    alocacoes = db.relationship('Alocacao', back_populates='veiculo')

class Operacao(db.Model):
    __tablename__ = 'operacoes'
    
    id = db.Column(db.Integer, primary_key=True)
    os_numero = db.Column(db.String(50), nullable=False) # Ex: 82510
    cliente_local = db.Column(db.String(200), nullable=False) # Ex: HOTEL DEVILLE
    tipo = db.Column(db.String(50)) # Montagem, Retirada, Manutencao
    data_operacao = db.Column(db.Date, nullable=False)
    horario_inicio = db.Column(db.Time)
    periodo = db.Column(db.String(20)) # Manha, Tarde
    observacoes = db.Column(db.Text)
    
    alocacoes = db.relationship('Alocacao', back_populates='operacao', cascade="all, delete-orphan")

class Alocacao(db.Model):
    __tablename__ = 'alocacoes'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Chaves estrangeiras (FK)
    operacao_id = db.Column(db.Integer, db.ForeignKey('operacoes.id'), nullable=False)
    tecnico_id = db.Column(db.Integer, db.ForeignKey('tecnicos.id'), nullable=False)
    veiculo_id = db.Column(db.Integer, db.ForeignKey('veiculos.id'), nullable=True) # Técnico pode ir direto sem veículo da empresa
    
    # Bidirecionalidade
    operacao = db.relationship('Operacao', back_populates='alocacoes')
    tecnico = db.relationship('Tecnico', back_populates='alocacoes')
    veiculo = db.relationship('Veiculo', back_populates='alocacoes')