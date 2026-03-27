-- database/core-migrations/001_tenant_modulos.sql
-- Ejecutar en la base de datos CORE: g360ia
-- Registra qué módulos están activos por tenant y cuándo fueron activados.

CREATE TABLE IF NOT EXISTS tenant_modulos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id     INT          NOT NULL,
  modulo        VARCHAR(50)  NOT NULL,
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  activado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activado_por  INT          NULL COMMENT 'usuario_id del admin que lo activó',
  notas         TEXT         NULL,
  UNIQUE KEY uq_tenant_modulo (tenant_id, modulo),
  KEY idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
