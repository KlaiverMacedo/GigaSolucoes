# Utiliza uma imagem oficial e leve do Python
FROM python:3.11-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Instala dependências do sistema necessárias para compilar pacotes do PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala as dependências do Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o código da API para dentro do container
COPY . .

# Expõe a porta 5000
EXPOSE 5000

# Comando para iniciar o servidor (em modo desenvolvimento para termos auto-reload)
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000", "--debug"]