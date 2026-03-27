-- Schema actualizado: tabla usuarios
-- Versión: migration 003
-- Roles: superadmin | admin | vendedor | viewer

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT NOT NULL AUTO_INCREMENT,
  tenant_id     CHAR(36) NULL,
  nombre        VARCHAR(200) NULL,
  email         VARCHAR(200) NOT NULL,
  password_hash TEXT NULL,
  rol           ENUM('superadmin','admin','vendedor','viewer') NOT NULL DEFAULT 'viewer',
  status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  activo        TINYINT(1) NOT NULL DEFAULT 0,
  ultimo_acceso TIMESTAMP NULL DEFAULT NULL,
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  INDEX idx_usuarios_rol (rol),
  INDEX idx_usuarios_status (status)
);
