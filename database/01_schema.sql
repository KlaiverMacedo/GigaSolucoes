-- ============================================================================
-- GIGA FLEET - Schema de Banco de Dados (MySQL 8.0+)
-- Empresa: Giga Soluções Audiovisuais
-- ============================================================================
-- Convenções:
--   - Todas as tabelas em InnoDB, utf8mb4
--   - Toda entidade principal tem created_at/updated_at
--   - Exclusão lógica (is_active) nas entidades de cadastro; auditoria via audit_logs
--   - Chaves estrangeiras nomeadas fk_<tabela>_<referencia>
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS giga_fleet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE giga_fleet;

-- ============================================================================
-- 1. RBAC — Papéis, Permissões e Overrides individuais
-- ============================================================================

CREATE TABLE roles (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug            VARCHAR(50) NOT NULL UNIQUE,      -- admin, supervisor, operador, motorista, tecnico
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(255) NULL,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,   -- papéis de sistema não podem ser excluídos
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(100) NOT NULL UNIQUE,     -- ex: vehicles.create, operations.delete
    module          VARCHAR(50) NOT NULL,             -- vehicles, technicians, operations, users, dashboard
    description     VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
    role_id         INT UNSIGNED NOT NULL,
    permission_id   INT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 2. Usuários e Sessões
-- ============================================================================

CREATE TABLE users (
    id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id                 INT UNSIGNED NOT NULL,
    name                    VARCHAR(150) NOT NULL,
    email                   VARCHAR(150) NOT NULL UNIQUE,
    password_hash           VARCHAR(255) NOT NULL,
    phone                   VARCHAR(20) NULL,
    avatar_url              VARCHAR(255) NULL,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password    BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    locked_until            DATETIME NULL,
    last_login_at           DATETIME NULL,
    last_login_ip           VARCHAR(45) NULL,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_users_role (role_id),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

-- Permissões individuais (override do papel — grant=TRUE concede, grant=FALSE revoga)
CREATE TABLE user_permissions (
    user_id         INT UNSIGNED NOT NULL,
    permission_id   INT UNSIGNED NOT NULL,
    is_granted      BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, permission_id),
    CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE sessions (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id             INT UNSIGNED NOT NULL,
    refresh_token_hash  VARCHAR(255) NOT NULL,
    ip_address          VARCHAR(45) NULL,
    user_agent          VARCHAR(255) NULL,
    expires_at          DATETIME NOT NULL,
    revoked_at          DATETIME NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NULL,
    action          VARCHAR(50) NOT NULL,       -- create, update, delete, login, logout, login_failed
    entity_type     VARCHAR(50) NOT NULL,       -- user, vehicle, technician, operation...
    entity_id       INT UNSIGNED NULL,
    old_values      JSON NULL,
    new_values      JSON NULL,
    ip_address      VARCHAR(45) NULL,
    user_agent      VARCHAR(255) NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE notifications (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    title           VARCHAR(150) NOT NULL,
    message         VARCHAR(500) NOT NULL,
    type            VARCHAR(30) NOT NULL DEFAULT 'info',  -- info, warning, success, danger
    link_url        VARCHAR(255) NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_unread (user_id, is_read)
) ENGINE=InnoDB;

-- ============================================================================
-- 3. Clientes
-- ============================================================================

CREATE TABLE clients (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    document        VARCHAR(20) NULL,          -- CNPJ/CPF
    email           VARCHAR(150) NULL,
    phone           VARCHAR(20) NULL,
    address_street  VARCHAR(200) NULL,
    address_city    VARCHAR(100) NULL,
    address_state   CHAR(2) NULL,
    address_zip     VARCHAR(10) NULL,
    notes           TEXT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clients_active (is_active),
    INDEX idx_clients_name (name)
) ENGINE=InnoDB;

-- ============================================================================
-- 4. Frota (Veículos)
-- ============================================================================

CREATE TABLE vehicles (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    plate               VARCHAR(10) NOT NULL UNIQUE,
    brand               VARCHAR(60) NOT NULL,
    model               VARCHAR(60) NOT NULL,
    year                SMALLINT UNSIGNED NULL,
    vehicle_type        VARCHAR(30) NOT NULL,      -- van, caminhao, utilitario, carro
    color               VARCHAR(30) NULL,
    capacity_kg         DECIMAL(8,2) NULL,
    fuel_type           VARCHAR(20) NULL,
    km_current          INT UNSIGNED NOT NULL DEFAULT 0,
    status              ENUM('available','in_use','maintenance','inactive') NOT NULL DEFAULT 'available',
    insurance_policy    VARCHAR(60) NULL,
    insurance_expiry    DATE NULL,
    license_expiry      DATE NULL,                 -- vencimento do licenciamento
    purchase_date       DATE NULL,
    notes               TEXT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vehicles_status (status),
    INDEX idx_vehicles_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE vehicle_maintenances (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vehicle_id          INT UNSIGNED NOT NULL,
    maintenance_type    VARCHAR(50) NOT NULL,      -- preventiva, corretiva, revisao
    description         VARCHAR(500) NULL,
    cost                DECIMAL(10,2) NULL,
    km_at_service       INT UNSIGNED NULL,
    service_date        DATE NOT NULL,
    next_service_km     INT UNSIGNED NULL,
    next_service_date   DATE NULL,
    provider            VARCHAR(150) NULL,
    status              ENUM('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_maintenances_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_vehicle_maintenances_vehicle (vehicle_id),
    INDEX idx_vehicle_maintenances_status (status)
) ENGINE=InnoDB;

CREATE TABLE vehicle_documents (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vehicle_id      INT UNSIGNED NOT NULL,
    doc_type        VARCHAR(50) NOT NULL,       -- crlv, seguro, ipva
    file_url        VARCHAR(255) NULL,
    expiry_date     DATE NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_documents_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_vehicle_documents_vehicle (vehicle_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 5. Técnicos
-- ============================================================================

CREATE TABLE technicians (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id             INT UNSIGNED NULL,          -- vínculo opcional a um usuário do sistema (login)
    name                VARCHAR(150) NOT NULL,
    document            VARCHAR(20) NULL,           -- CPF
    email               VARCHAR(150) NULL,
    phone               VARCHAR(20) NULL,
    availability_status ENUM('available','on_operation','on_leave','inactive') NOT NULL DEFAULT 'available',
    hire_date           DATE NULL,
    notes               TEXT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_technicians_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_technicians_status (availability_status),
    INDEX idx_technicians_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE specialties (
    id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(80) NOT NULL UNIQUE            -- iluminacao, som, video, streaming, eletrica
) ENGINE=InnoDB;

CREATE TABLE technician_specialties (
    technician_id   INT UNSIGNED NOT NULL,
    specialty_id    INT UNSIGNED NOT NULL,
    PRIMARY KEY (technician_id, specialty_id),
    CONSTRAINT fk_technician_specialties_technician FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
    CONSTRAINT fk_technician_specialties_specialty FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE technician_documents (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    technician_id   INT UNSIGNED NOT NULL,
    doc_type        VARCHAR(50) NOT NULL,
    file_url        VARCHAR(255) NULL,
    expiry_date     DATE NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_technician_documents_technician FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
    INDEX idx_technician_documents_technician (technician_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 6. Operações / Eventos
-- ============================================================================

CREATE TABLE operations (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code                VARCHAR(20) NOT NULL UNIQUE,   -- OP-2026-0001
    client_id           INT UNSIGNED NOT NULL,
    title               VARCHAR(150) NOT NULL,
    description         TEXT NULL,
    event_type          VARCHAR(50) NULL,               -- show, corporativo, streaming
    address_street      VARCHAR(200) NULL,
    address_city        VARCHAR(100) NULL,
    address_state       CHAR(2) NULL,
    address_zip         VARCHAR(10) NULL,
    latitude            DECIMAL(10,7) NULL,
    longitude           DECIMAL(10,7) NULL,
    start_datetime      DATETIME NOT NULL,
    end_datetime        DATETIME NOT NULL,
    status              ENUM('draft','scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
    priority            ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
    notes               TEXT NULL,
    created_by          INT UNSIGNED NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_operations_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_operations_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_operations_status (status),
    INDEX idx_operations_dates (start_datetime, end_datetime),
    INDEX idx_operations_client (client_id)
) ENGINE=InnoDB;

CREATE TABLE operation_technicians (
    operation_id    INT UNSIGNED NOT NULL,
    technician_id   INT UNSIGNED NOT NULL,
    role_in_op      VARCHAR(60) NULL,          -- coordenador, operador de som...
    confirmed       BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (operation_id, technician_id),
    CONSTRAINT fk_op_tech_operation FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
    CONSTRAINT fk_op_tech_technician FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
    INDEX idx_op_tech_technician (technician_id)
) ENGINE=InnoDB;

CREATE TABLE operation_vehicles (
    operation_id    INT UNSIGNED NOT NULL,
    vehicle_id      INT UNSIGNED NOT NULL,
    PRIMARY KEY (operation_id, vehicle_id),
    CONSTRAINT fk_op_veh_operation FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
    CONSTRAINT fk_op_veh_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_op_veh_vehicle (vehicle_id)
) ENGINE=InnoDB;

CREATE TABLE operation_checklist_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    operation_id    INT UNSIGNED NOT NULL,
    description     VARCHAR(255) NOT NULL,
    is_done         BOOLEAN NOT NULL DEFAULT FALSE,
    done_by         INT UNSIGNED NULL,
    done_at         DATETIME NULL,
    sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT fk_checklist_operation FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
    CONSTRAINT fk_checklist_done_by FOREIGN KEY (done_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_checklist_operation (operation_id)
) ENGINE=InnoDB;

CREATE TABLE operation_files (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    operation_id    INT UNSIGNED NOT NULL,
    file_url        VARCHAR(255) NOT NULL,
    file_type       VARCHAR(30) NULL,          -- photo, document
    uploaded_by     INT UNSIGNED NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_op_files_operation FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
    CONSTRAINT fk_op_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_op_files_operation (operation_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
