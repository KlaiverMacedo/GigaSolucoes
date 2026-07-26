import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import get_password_hash

# Gerar hash para Admin@123
senha = "Admin@123"
hash_criada = get_password_hash(senha)

print("=" * 50)
print("NOVA SENHA HASH GERADA")
print("=" * 50)
print(f"Senha: {senha}")
print(f"Hash: {hash_criada}")
print(f"Tamanho: {len(hash_criada)} caracteres")
print("=" * 50)

# Também gerar para teste
print("\nOutros exemplos:")
print(f"senha '123456': {get_password_hash('123456')}")
print(f"senha 'giga2026': {get_password_hash('giga2026')}")