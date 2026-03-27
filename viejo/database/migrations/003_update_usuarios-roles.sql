-- Migration 003: Actualizar tabla usuarios
-- - Cambia columna rol de VARCHAR a ENUM con roles definidos
-- - Agrega columna ultimo_acceso
-- - Actualiza registros existentes con rol 'usuario' a 'viewer'

-- 1. Modificar columna rol a ENUM con todos los roles del sistema
ALTER TABLE usuarios 
  MODIFY COLUMN rol ENUM('superadmin', 'admin', 'vendedor', 'viewer') NOT NULL DEFAULT 'viewer';

-- 2. Actualizar registros existentes que tengan rol 'usuario' (valor viejo)
UPDATE usuarios SET rol = 'viewer' WHERE rol NOT IN ('superadmin', 'admin', 'vendedor', 'viewer');

-- 3. Asegurar que agencianlmd@gmail.com sea superadmin
UPDATE usuarios SET rol = 'superadmin' WHERE email = 'agencianlmd@gmail.com';

-- 4. Agregar columna ultimo_acceso para saber cuándo ingresó cada usuario por última vez
ALTER TABLE usuarios 
  ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP NULL DEFAULT NULL;
