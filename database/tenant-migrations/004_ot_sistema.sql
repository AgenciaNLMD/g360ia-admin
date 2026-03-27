-- database/tenant-migrations/004_ot_sistema.sql
-- Sistema de Órdenes de Trabajo con etapas configurables
-- @rubro: serv_tecnico, tecnico, reparacion, todos
-- @plan: free, pro, business, ia
-- Ejecutar: node scripts/migrar-tenants.js --migracion=004_ot_sistema

-- Configuración de etapas (permite agregar etapas sin tocar código)
CREATE TABLE IF NOT EXISTS ot_etapas_config (
  id          INT NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(100) NOT NULL,
  orden       TINYINT NOT NULL,
  plan_minimo ENUM('free','pro','business','ia') NOT NULL DEFAULT 'free',
  color_hex   VARCHAR(7) NOT NULL DEFAULT '#506886',
  icono       VARCHAR(50) NULL,
  activa      TINYINT(1) NOT NULL DEFAULT 1,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_etapa_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Etapas iniciales
INSERT IGNORE INTO ot_etapas_config (nombre, orden, plan_minimo, color_hex, icono) VALUES
  ('Recibido',             1, 'free',  '#506886', 'bi-box-arrow-in-down'),
  ('Revisado',             2, 'pro',   '#B08A55', 'bi-search'),
  ('Esperando repuesto',   3, 'pro',   '#D97706', 'bi-clock'),
  ('En reparación',        4, 'pro',   '#2563EB', 'bi-tools'),
  ('Listo para retirar',   5, 'pro',   '#16A34A', 'bi-check-circle'),
  ('En reparto',           6, 'pro',   '#7C3AED', 'bi-truck'),
  ('Entregado',            7, 'free',  '#3A9E70', 'bi-bag-check');

-- Órdenes de trabajo (nueva tabla con estructura completa)
CREATE TABLE IF NOT EXISTS ordenes_trabajo (
  id                    INT NOT NULL AUTO_INCREMENT,
  numero_ot             VARCHAR(20) NOT NULL,
  cliente_id            INT NULL,
  tecnico_id            INT NULL,
  equipo_marca          VARCHAR(100) NULL,
  equipo_modelo         VARCHAR(100) NULL,
  equipo_serie          VARCHAR(100) NULL,
  equipo_falla_reportada TEXT NOT NULL,
  etapa_actual_id       INT NOT NULL DEFAULT 1,
  diagnostico           TEXT NULL,
  total_repuestos       DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_mano_obra       DECIMAL(10,2) NOT NULL DEFAULT 0,
  total                 DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado                ENUM('abierta','cerrada','cancelada') NOT NULL DEFAULT 'abierta',
  creado_en             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ot_numero (numero_ot),
  INDEX idx_ot_cliente   (cliente_id),
  INDEX idx_ot_tecnico   (tecnico_id),
  INDEX idx_ot_etapa     (etapa_actual_id),
  INDEX idx_ot_estado    (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ítems de una OT (repuestos y servicios usados)
CREATE TABLE IF NOT EXISTS ot_items (
  id              INT NOT NULL AUTO_INCREMENT,
  ot_id           INT NOT NULL,
  tipo            ENUM('repuesto','servicio') NOT NULL DEFAULT 'repuesto',
  catalogo_id     INT NULL,
  descripcion     VARCHAR(300) NOT NULL,
  cantidad        DECIMAL(10,3) NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_oti_ot       (ot_id),
  INDEX idx_oti_catalogo (catalogo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de cambios de etapa
CREATE TABLE IF NOT EXISTS ot_historial (
  id                INT NOT NULL AUTO_INCREMENT,
  ot_id             INT NOT NULL,
  etapa_anterior_id INT NULL,
  etapa_nueva_id    INT NOT NULL,
  usuario_id        INT NULL,
  nota              TEXT NULL,
  creado_en         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_oth_ot (ot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
