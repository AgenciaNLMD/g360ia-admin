-- database/tenant-migrations/009_equipo_tecnicos.sql
-- Perfil extendido de técnicos (complementa la tabla usuarios de g360ia core)
-- @rubro: serv_tecnico, tecnico, reparacion, todos
-- @plan: pro, business, ia
-- Ejecutar: node scripts/migrar-tenants.js --migracion=009_equipo_tecnicos

-- Datos adicionales del técnico almacenados en la DB del tenant
-- usuario_id referencia a g360ia.usuarios.id
CREATE TABLE IF NOT EXISTS tecnicos_perfil (
  id            INT NOT NULL AUTO_INCREMENT,
  usuario_id    INT NOT NULL,
  especialidad  VARCHAR(200) NULL,
  telefono      VARCHAR(50) NULL,
  activo        TINYINT(1) NOT NULL DEFAULT 1,
  notas         TEXT NULL,
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tec_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
