FROM node:20-slim

WORKDIR /app

# Copia os arquivos de dependências
COPY package.json package-lock.json ./

# Instala as dependências
RUN npm install

# Copia o restante do projeto
COPY . .

# Expõe a porta padrão do Vite
EXPOSE 5173

# Comando para rodar em modo desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]