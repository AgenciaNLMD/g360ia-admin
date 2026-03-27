-- database/tenant-migrations/001_base.sql
-- Migración base — tablas que se crean al dar de alta cualquier tenant.
-- Esta migración ya se aplica automáticamente en tenant-provisioner.js
-- El script migrar-tenants.js la va a detectar como "ya aplicada" en tenants existentes.
-- NO tiene @rubro ni @plan — aplica a todos.

-- Esta migración es un marcador. Las tablas reales se crean en tenant-provisioner.js
SELECT 1;
