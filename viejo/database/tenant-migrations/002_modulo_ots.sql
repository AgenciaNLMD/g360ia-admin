-- database/tenant-migrations/002_modulo_ots.sql
-- Módulo: Órdenes de Trabajo (OTs)
-- @rubro: serv_tecnico, tecnico, reparacion
-- @plan: pro, plan_ia, enterprise
-- Cuando este módulo esté listo, corrés:
-- node scripts/migrar-tenants.js --migracion=002_modulo_ots

CREATE TABLE IF NOT EXISTS tecnicos (
  id              INT NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(200) NOT NULL,
  email           VARCHAR(200) NULL,
  telefono        VARCHAR(50) NULL,
  especialidades  JSON NULL,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ots (
  id                  INT NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(20) NOT NULL,
  cliente_id          INT NULL,
  tecnico_id          INT NULL,
  dispositivo         VARCHAR(200) NOT NULL,
  marca               VARCHAR(100) NULL,
  modelo              VARCHAR(100) NULL,
  problema_reportado  TEXT NOT NULL,
  diagnostico         TEXT NULL,
  diagnostico_ia      TEXT NULL,
  estado              ENUM('ingreso','diagnostico','presupuesto_enviado','aprobado','en_reparacion','listo','entregado','cancelado') NOT NULL DEFAULT 'ingreso',
  prioridad           ENUM('normal','urgente') NOT NULL DEFAULT 'normal',
  fecha_estimada      DATE NULL,
  foto_ingreso        VARCHAR(500) NULL,
  foto_cierre         VARCHAR(500) NULL,
  firma_ingreso       TEXT NULL,
  firma_retiro        TEXT NULL,
  garantia_dias       INT NOT NULL DEFAULT 90,
  calificacion        TINYINT NULL,
  creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ot_codigo (codigo),
  INDEX idx_ot_cliente (cliente_id),
  INDEX idx_ot_tecnico (tecnico_id),
  INDEX idx_ot_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ot_estados_log (
  id        INT NOT NULL AUTO_INCREMENT,
  ot_id     INT NOT NULL,
  estado    VARCHAR(50) NOT NULL,
  nota      TEXT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_otel_ot (ot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS repuestos (
  id             INT NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(200) NOT NULL,
  codigo         VARCHAR(100) NULL,
  proveedor_id   INT NULL,
  precio_costo   DECIMAL(12,2) NOT NULL DEFAULT 0,
  precio_venta   DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock          INT NOT NULL DEFAULT 0,
  stock_minimo   INT NOT NULL DEFAULT 2,
  creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_rep_proveedor (proveedor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proveedores (
  id        INT NOT NULL AUTO_INCREMENT,
  nombre    VARCHAR(200) NOT NULL,
  email     VARCHAR(200) NULL,
  telefono  VARCHAR(50) NULL,
  cuit      VARCHAR(20) NULL,
  scoring   TINYINT NOT NULL DEFAULT 5,
  activo    TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ordenes_compra (
  id           INT NOT NULL AUTO_INCREMENT,
  ot_id        INT NULL,
  proveedor_id INT NULL,
  estado       ENUM('borrador','enviada','recibida','cancelada') NOT NULL DEFAULT 'borrador',
  total        DECIMAL(12,2) NOT NULL DEFAULT 0,
  items        JSON NULL,
  creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_oc_ot (ot_id),
  INDEX idx_oc_proveedor (proveedor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
