from app import create_app
from app.extensions import db

app = create_app()

if __name__ == '__main__':
    # Cria o contexto da aplicação para manipular o banco de dados
    with app.app_context():
        # Lê nossos models e cria as tabelas no PostgreSQL se elas não existirem
        db.create_all()
        print("Tabelas do Banco de Dados criadas/verificadas com sucesso!")
        
    app.run(host='0.0.0.0', port=5000, debug=True)