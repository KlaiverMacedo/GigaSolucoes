# Giga Fleet — Fase 1: Fundação (Segurança, Banco, Auth, RBAC)

Esta é a primeira de várias entregas incrementais da reconstrução do Giga Fleet.
Cada fase é funcional e testável isoladamente. Este pacote testado (import real
do FastAPI + validação do schema ORM) contém a base sobre a qual todos os
próximos módulos (veículos, técnicos, operações, planejamento, dashboard) serão
construídos.

## O que foi entregue nesta fase

- **`database/01_schema.sql`** — schema MySQL 8 completo e normalizado: RBAC
  (`roles`, `permissions`, `role_permissions`, `user_permissions`), autenticação
  (`users`, `sessions`), auditoria (`audit_logs`), notificações, e todas as
  tabelas de domínio (clientes, veículos, manutenções, documentos, técnicos,
  especialidades, operações e suas relações), com índices e chaves estrangeiras.
- **`database/02_seed.sql`** — 5 papéis padrão (Administrador, Supervisor,
  Operador, Motorista, Técnico), 24 permissões granulares por módulo, um
  usuário administrador padrão e especialidades técnicas iniciais.
- **Backend (`backend/app`)**:
  - `core/config.py` — configuração tipada e validada (pydantic-settings);
    a aplicação **recusa subir** se `JWT_SECRET_KEY` estiver com valor padrão.
  - `core/security.py` — hashing de senha (bcrypt), emissão de JWT de acesso
    (curto, 15 min) e refresh token opaco de alta entropia, armazenado no
    banco **apenas como hash** (nunca em texto puro).
  - `api/deps.py` — **antes vazio no projeto original**; agora implementa
    `get_current_user` e `require_permission(...)` de fato, validando o token
    em toda rota protegida.
  - `services/auth_service.py` — login com **bloqueio automático** após N
    tentativas falhas (`MAX_LOGIN_ATTEMPTS`), rotação de refresh token a cada
    renovação (mitiga replay de token roubado), e auditoria de login/logout/
    tentativas bloqueadas.
  - `services/permission_service.py` — calcula a permissão efetiva de um
    usuário (permissões do papel + overrides individuais).
  - Migrations reais via **Alembic** (`backend/alembic/`), substituindo o
    `Base.metadata.create_all()` que existia no projeto original.

## Correções críticas de segurança feitas nesta fase

1. O `.env` do projeto original estava **versionado no Git** com credenciais
   reais. **Ação obrigatória sua**: troque a senha do banco e gere uma nova
   `JWT_SECRET_KEY` — as que estavam no repositório devem ser consideradas
   comprometidas, independentemente do que fizermos daqui pra frente.
2. O arquivo de exclusão do Git estava nomeado `gitignore` (sem o ponto) e
   por isso nunca funcionou — a pasta `venv/` inteira (141 MB) foi commitada.
   Corrigido: `.gitignore` na raiz deste pacote.
3. `app/api/deps.py` estava vazio — nenhuma rota tinha validação de token ou
   permissão de fato. Implementado nesta fase.

## Como rodar esta fase localmente

```bash
# 1. Banco de dados
mysql -u root -p < database/01_schema.sql
mysql -u root -p < database/02_seed.sql

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # edite DB_PASSWORD e gere um JWT_SECRET_KEY novo
uvicorn app.main:app --reload

# 3. Testar
# Documentação interativa: http://localhost:8000/docs
# Login padrão: admin@gigafleet.com.br / GigaFleet@2026 (troque no primeiro acesso)
```

Login testado: `POST /api/v1/auth/login` → retorna `access_token` +
`refresh_token`. `GET /api/v1/auth/me` (com `Authorization: Bearer <token>`)
retorna usuário, papel e lista de permissões efetivas.

## Próximas fases

- **Fase 2** — Backend completo: repositórios/serviços/rotas de Veículos,
  Técnicos, Operações, Clientes, Usuários e Dashboard (hoje inexistentes ou
  vazios no projeto original).
- **Fase 3** — Frontend: tela de login cinematográfica, splash com vídeo
  institucional, dashboard com KPIs/mapa/timeline.
- **Fase 4** — Planejamento operacional (kanban/timeline com drag-and-drop),
  substituindo a planilha.
- **Fase 5** — Polimento final, seed de dados de demonstração, README geral,
  scripts de instalação/inicialização e empacotamento em `.zip`.
