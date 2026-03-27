-- database/tenant-migrations/007_facturacion_cobros.sql
-- Facturación ARCA (ex-AFIP) y cobros / caja
-- @rubro: todos
-- @plan: pro, business, ia (ARCA); free (cobros básicos)
-- Ejecutar: node scripts/migrar-tenants.js --migracion=007_facturacion_cobros

-- Facturas electrónicas ARCA
CREATE TABLE IF NOT EXISTS facturas (
  id                  INT NOT NULL AUTO_INCREMENT,
  venta_id            INT NULL,
  cliente_id          INT NULL,
  tipo_comprobante    ENUM('A','B','C','NC_A','NC_B') NOT NULL DEFAULT 'B',
  numero_comprobante  VARCHAR(20) NULL,
  punto_venta         SMALLINT NOT NULL DEFAULT 1,
  cae                 VARCHAR(14) NULL,
  cae_vencimiento     DATE NULL,
  total               DECIMAL(10,2) NOT NULL DEFAULT 0,
  pdf_path            TEXT NULL,
  enviado_email       TINYINT(1) NOT NULL DEFAULT 0,
  enviado_whatsapp    TINYINT(1) NOT NULL DEFAULT 0,
  creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_fac_venta    (venta_id),
  INDEX idx_fac_cliente  (cliente_id),
  INDEX idx_fac_tipo     (tipo_comprobante),
  INDEX idx_fac_cae      (cae)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuración ARCA por tenant (almacenada en la DB del tenant)
CREATE TABLE IF NOT EXISTS tenant_arca_config (
  id                INT NOT NULL AUTO_INCREMENT,
  cuit              VARCHAR(15) NOT NULL,
  punto_venta       SMALLINT NOT NULL DEFAULT 1,
  condicion_fiscal  ENUM('RI','MT','EX') NOT NULL DEFAULT 'RI',
  certificado_crt   TEXT NULL,
  certificado_key   TEXT NULL,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  actualizado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cobros recibidos (efectivo, transferencia, MercadoPago)
CREATE TABLE IF NOT EXISTS cobros (
  id                     INT NOT NULL AUTO_INCREMENT,
  venta_id               INT NULL,
  cliente_id             INT NULL,
  medio                  ENUM('efectivo','transferencia','mercadopago','otro') NOT NULL DEFAULT 'efectivo',
  monto                  DECIMAL(10,2) NOT NULL DEFAULT 0,
  referencia             TEXT NULL,
  mp_payment_id          VARCHAR(100) NULL,
  mp_merchant_order_id   VARCHAR(100) NULL,
  estado                 ENUM('pendiente','aprobado','rechazado','devuelto') NOT NULL DEFAULT 'aprobado',
  fecha                  DATE NOT NULL,
  creado_en              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_cob_venta   (venta_id),
  INDEX idx_cob_cliente (cliente_id),
  INDEX idx_cob_fecha   (fecha),
  INDEX idx_cob_mp      (mp_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuración MercadoPago por tenant
CREATE TABLE IF NOT EXISTS tenant_mp_config (
  id                    INT NOT NULL AUTO_INCREMENT,
  access_token_prod     TEXT NULL,
  access_token_sandbox  TEXT NULL,
  modo                  ENUM('produccion','sandbox') NOT NULL DEFAULT 'sandbox',
  webhook_secret        TEXT NULL,
  actualizado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
