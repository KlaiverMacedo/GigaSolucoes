-- ============================================================================
-- GIGA FLEET - Seed inicial (papéis, permissões, admin padrão, especialidades)
-- ============================================================================
USE giga_fleet;

-- ---------------------------------------------------------------------------
-- Papéis
-- ---------------------------------------------------------------------------
INSERT INTO roles (slug, name, description, is_system) VALUES
('admin',      'Administrador', 'Acesso total ao sistema', TRUE),
('supervisor', 'Supervisor',    'Gestão operacional, sem administração de usuários', TRUE),
('operador',   'Operador',      'Planejamento e cadastros do dia a dia', TRUE),
('motorista',  'Motorista',     'Consulta de operações e veículos designados', TRUE),
('tecnico',    'Técnico',       'Consulta de escalas e operações designadas', TRUE);

-- ---------------------------------------------------------------------------
-- Permissões (código.módulo)
-- ---------------------------------------------------------------------------
INSERT INTO permissions (code, module, description) VALUES
('dashboard.view',        'dashboard',   'Visualizar dashboard'),
('vehicles.view',         'vehicles',    'Visualizar veículos'),
('vehicles.create',       'vehicles',    'Cadastrar veículos'),
('vehicles.edit',         'vehicles',    'Editar veículos'),
('vehicles.delete',       'vehicles',    'Excluir/inativar veículos'),
('technicians.view',      'technicians', 'Visualizar técnicos'),
('technicians.create',    'technicians', 'Cadastrar técnicos'),
('technicians.edit',      'technicians', 'Editar técnicos'),
('technicians.delete',    'technicians', 'Excluir/inativar técnicos'),
('operations.view',       'operations',  'Visualizar operações'),
('operations.create',     'operations',  'Criar operações'),
('operations.edit',       'operations',  'Editar operações'),
('operations.delete',     'operations',  'Excluir/cancelar operações'),
('clients.view',          'clients',     'Visualizar clientes'),
('clients.create',        'clients',     'Cadastrar clientes'),
('clients.edit',          'clients',     'Editar clientes'),
('clients.delete',        'clients',     'Excluir/inativar clientes'),
('planning.view',         'planning',    'Visualizar planejamento'),
('planning.edit',         'planning',    'Editar planejamento (arrastar/soltar, alocar)'),
('users.view',             'users',      'Visualizar usuários'),
('users.create',           'users',      'Criar usuários'),
('users.edit',             'users',      'Editar usuários'),
('users.delete',           'users',      'Excluir/inativar usuários'),
('users.manage_permissions','users',     'Gerenciar permissões individuais'),
('audit.view',              'audit',     'Visualizar logs de auditoria');

-- ---------------------------------------------------------------------------
-- Admin -> todas as permissões
-- ---------------------------------------------------------------------------
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'admin'), id FROM permissions;

-- Supervisor -> tudo exceto gestão de usuários/permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'supervisor'), id FROM permissions
WHERE module NOT IN ('users');

-- Operador -> operação do dia a dia (sem exclusões, sem usuários)
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'operador'), id FROM permissions
WHERE code IN (
    'dashboard.view',
    'vehicles.view','vehicles.edit',
    'technicians.view','technicians.edit',
    'operations.view','operations.create','operations.edit',
    'clients.view','clients.create','clients.edit',
    'planning.view','planning.edit'
);

-- Motorista -> somente consulta
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'motorista'), id FROM permissions
WHERE code IN ('dashboard.view','vehicles.view','operations.view');

-- Técnico -> somente consulta
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'tecnico'), id FROM permissions
WHERE code IN ('dashboard.view','operations.view','planning.view');

-- ---------------------------------------------------------------------------
-- Usuário administrador padrão
--   e-mail: admin@gigafleet.com.br
--   senha:  GigaFleet@2026   (hash bcrypt abaixo — TROCAR NO PRIMEIRO LOGIN)
-- ---------------------------------------------------------------------------
INSERT INTO users (role_id, name, email, password_hash, is_active, must_change_password)
VALUES (
    (SELECT id FROM roles WHERE slug = 'admin'),
    'Administrador Giga Fleet',
    'admin@gigafleet.com.br',
    '$2b$12$iEcPifC4EHuEb0vVWW/8PO8TFXSmTOn7rF7u9Nl3kBIOXozXMq5GK',
    TRUE,
    TRUE
);

-- ---------------------------------------------------------------------------
-- Especialidades técnicas
-- ---------------------------------------------------------------------------
INSERT INTO specialties (name) VALUES
('Iluminação'), ('Sonorização'), ('Vídeo'), ('Streaming'),
('Elétrica'), ('Rigging'), ('Cenografia'), ('Operação de Câmera');
