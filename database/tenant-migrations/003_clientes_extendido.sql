-- database/tenant-migrations/003_clientes_extendido.sql
-- Extiende la tabla clientes con campos CRM completos (ficha cliente, CUIT, condición fiscal)
-- @rubro: todos
-- @plan: free, pro, business, ia
-- Ejecutar: node scripts/migrar-tenants.js --migracion=003_clientes_extendido
--
-- NOTA: usar ALTER TABLE sin IF NOT EXISTS (MySQL 9 no lo soporta en columnas).
-- El sistema de migraciones (tenant_migraciones) garantiza que se ejecute solo una vez.

ALTER TABLE clientes
  ADD COLUMN lead_id            INT NULL            AFTER id,
  ADD COLUMN razon_social       VARCHAR(200) NULL   AFTER nombre,
  ADD COLUMN cuit               VARCHAR(15) NULL    AFTER razon_social,
  ADD COLUMN condicion_fiscal   ENUM('RI','MT','CF','EX') NULL AFTER cuit,
  ADD COLUMN rubro              VARCHAR(100) NULL   AFTER direccion,
  ADD COLUMN estado             ENUM('activo','inactivo') NOT NULL DEFAULT 'activo' AFTER activo;

CREATE INDEX idx_cli_cuit ON clientes (cuit);
