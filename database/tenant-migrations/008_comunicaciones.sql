-- database/tenant-migrations/008_comunicaciones.sql
-- Log de comunicaciones enviadas y plantillas de mensajes
-- @rubro: todos
-- @plan: pro, business, ia (automáticas); free (manual)
-- Ejecutar: node scripts/migrar-tenants.js --migracion=008_comunicaciones

-- Log de mensajes enviados (WhatsApp, email, etc.)
CREATE TABLE IF NOT EXISTS comunicaciones_log (
  id          INT NOT NULL AUTO_INCREMENT,
  cliente_id  INT NULL,
  canal       ENUM('whatsapp','email','sms') NOT NULL DEFAULT 'whatsapp',
  tipo        ENUM('notif_ot','presupuesto','factura','link_pago','otro') NOT NULL DEFAULT 'otro',
  contenido   TEXT NOT NULL,
  estado      ENUM('enviado','fallido','pendiente') NOT NULL DEFAULT 'pendiente',
  error_msg   TEXT NULL,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_comlog_cliente (cliente_id),
  INDEX idx_comlog_estado  (estado),
  INDEX idx_comlog_tipo    (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plantillas de mensaje por etapa / tipo de comunicación
-- Soporta variables: {{nombre_cliente}}, {{numero_ot}}, {{equipo}}, {{etapa}}
CREATE TABLE IF NOT EXISTS comunicaciones_plantillas (
  id         INT NOT NULL AUTO_INCREMENT,
  etapa_id   INT NULL,
  tipo       VARCHAR(50) NOT NULL,
  canal      ENUM('whatsapp','email','sms') NOT NULL DEFAULT 'whatsapp',
  plantilla  TEXT NOT NULL,
  activa     TINYINT(1) NOT NULL DEFAULT 1,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_cplant_etapa (etapa_id),
  INDEX idx_cplant_tipo  (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plantillas iniciales por cambio de etapa
INSERT IGNORE INTO comunicaciones_plantillas (etapa_id, tipo, canal, plantilla, activa) VALUES
  (1, 'notif_ot', 'whatsapp', 'Hola {{nombre_cliente}}, recibimos tu {{equipo}} en nuestro taller. Tu OT es la N° {{numero_ot}}. Te avisamos cuando tengamos novedades.', 1),
  (5, 'notif_ot', 'whatsapp', 'Hola {{nombre_cliente}}, tu {{equipo}} ya está listo para retirar (OT N° {{numero_ot}}). ¡Te esperamos!', 1),
  (7, 'notif_ot', 'whatsapp', 'Gracias {{nombre_cliente}} por confiar en nosotros. Tu equipo fue entregado exitosamente (OT N° {{numero_ot}}).', 1);

-- Configuración WhatsApp / Evolution API del tenant
CREATE TABLE IF NOT EXISTS tenant_whatsapp_config (
  id                INT NOT NULL AUTO_INCREMENT,
  numero_whatsapp   VARCHAR(50) NULL,
  evolution_api_url TEXT NULL,
  evolution_api_key TEXT NULL,
  instancia_nombre  VARCHAR(100) NULL,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  actualizado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
