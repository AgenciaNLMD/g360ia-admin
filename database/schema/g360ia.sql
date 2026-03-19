-- ============================================================
-- GESTIÓN 360 iA — Schema completo de base de datos
-- Base de datos: g360ia
-- Generado: 2026-03-19
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================================
-- TABLA: tenants
-- ============================================================
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `rubro` varchar(100) NOT NULL,
  `plan` enum('starter','pro','plan_ia','enterprise') NOT NULL DEFAULT 'starter',
  `subdominio` varchar(100) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `password_hash` text DEFAULT NULL,
  `google_id` varchar(200) DEFAULT NULL,
  `onboarding_completo` tinyint(1) NOT NULL DEFAULT 0,
  `trial_hasta` date DEFAULT NULL,
  `mercadopago_id` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subdominio` (`subdominio`),
  KEY `idx_ten_plan` (`plan`),
  KEY `idx_ten_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` char(36) DEFAULT NULL,
  `nombre` varchar(200) DEFAULT NULL,
  `email` varchar(200) NOT NULL,
  `password_hash` text DEFAULT NULL,
  `rol` enum('superadmin','admin','vendedor','cm','soporte','viewer') NOT NULL DEFAULT 'viewer',
  `area` enum('comercial','contenido','atencion','administracion','operaciones') DEFAULT NULL,
  `titulo` varchar(100) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `activo` tinyint(1) DEFAULT 0,
  `creado_en` timestamp DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acceso` timestamp DEFAULT NULL,
  `rubros_especialidad` json DEFAULT NULL,
  `modulos_especialidad` json DEFAULT NULL,
  `tasa_cierre` decimal(5,2) DEFAULT 0.00,
  `mrr_generado` decimal(10,2) DEFAULT 0.00,
  `tickets_resueltos` int DEFAULT 0,
  `satisfaccion_avg` decimal(3,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  KEY `idx_usr_rol` (`rol`),
  KEY `idx_usr_area` (`area`),
  KEY `idx_usr_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: sesiones_log
-- ============================================================
CREATE TABLE IF NOT EXISTS `sesiones_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `dispositivo` varchar(100) DEFAULT NULL,
  `ubicacion` varchar(200) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sl_usuario` (`usuario_id`),
  KEY `idx_sl_fecha` (`creado_en`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: equipos
-- ============================================================
CREATE TABLE IF NOT EXISTS `equipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `area` enum('comercial','contenido','atencion','administracion','operaciones') NOT NULL,
  `color` varchar(20) DEFAULT '#506886',
  `tenant_id` int DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_eq_area` (`area`),
  KEY `idx_eq_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipos base del admin panel
INSERT IGNORE INTO `equipos` (`nombre`, `area`, `color`, `tenant_id`) VALUES
('Equipo Comercial',  'comercial',      '#506886', NULL),
('Community Manager', 'contenido',      '#B08A55', NULL),
('Soporte',           'atencion',       '#3A9E70', NULL),
('Administración',    'administracion', '#445A73', NULL);

-- ============================================================
-- TABLA: permisos_modulo
-- ============================================================
CREATE TABLE IF NOT EXISTS `permisos_modulo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rol` varchar(50) NOT NULL,
  `area` varchar(50) NOT NULL,
  `modulo` varchar(100) NOT NULL,
  `puede_ver` tinyint(1) NOT NULL DEFAULT 1,
  `puede_editar` tinyint(1) NOT NULL DEFAULT 0,
  `puede_crear` tinyint(1) NOT NULL DEFAULT 0,
  `puede_eliminar` tinyint(1) NOT NULL DEFAULT 0,
  `tenant_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_permiso` (`rol`,`area`,`modulo`,`tenant_id`),
  KEY `idx_pm_rol` (`rol`),
  KEY `idx_pm_area` (`area`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permisos default
INSERT IGNORE INTO `permisos_modulo` (`rol`,`area`,`modulo`,`puede_ver`,`puede_editar`,`puede_crear`,`puede_eliminar`) VALUES
('vendedor','comercial',     'bandeja_comercial',1,1,0,0),
('vendedor','comercial',     'leads',            1,1,1,0),
('vendedor','comercial',     'mi_rendimiento',   1,0,0,0),
('vendedor','comercial',     'clientes',         1,0,0,0),
('cm',      'contenido',     'bandeja_rrss',     1,1,0,0),
('cm',      'contenido',     'leads',            1,0,0,0),
('cm',      'contenido',     'mi_rendimiento',   1,0,0,0),
('soporte', 'atencion',      'tickets',          1,1,1,0),
('soporte', 'atencion',      'bandeja_soporte',  1,1,0,0),
('soporte', 'atencion',      'clientes',         1,0,0,0),
('soporte', 'atencion',      'mi_rendimiento',   1,0,0,0),
('admin',   'administracion','bandeja_comercial',1,1,1,0),
('admin',   'administracion','leads',            1,1,1,1),
('admin',   'administracion','tickets',          1,1,1,1),
('admin',   'administracion','bandeja_rrss',     1,1,1,0),
('admin',   'administracion','clientes',         1,1,1,0),
('admin',   'administracion','usuarios',         1,1,1,0),
('admin',   'administracion','auditoria',        1,0,0,0),
('admin',   'administracion','equipos',          1,1,1,0);

-- ============================================================
-- TABLA: integraciones
-- ============================================================
CREATE TABLE IF NOT EXISTS `integraciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `tipo` enum('whatsapp','instagram','facebook','email','web','tiktok','otra') NOT NULL,
  `tenant_id` int DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 0,
  `config` json DEFAULT NULL,
  `sugerencia_dismisseada` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` timestamp DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_int_tenant` (`tenant_id`),
  KEY `idx_int_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Canales base del admin panel
INSERT IGNORE INTO `integraciones` (`nombre`,`tipo`,`tenant_id`,`activo`) VALUES
('WhatsApp',  'whatsapp',  NULL, 0),
('Instagram', 'instagram', NULL, 0),
('Facebook',  'facebook',  NULL, 0),
('Email',     'email',     NULL, 0),
('Web / Chat','web',       NULL, 0),
('TikTok',    'tiktok',    NULL, 0);

-- ============================================================
-- TABLA: contactos (portal tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS `contactos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `apellido` varchar(200) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `whatsapp` varchar(50) DEFAULT NULL,
  `empresa` varchar(200) DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `etiquetas` json DEFAULT NULL,
  `fuente` enum('web','whatsapp','manual','ads','referido') NOT NULL DEFAULT 'manual',
  `score_ia` tinyint DEFAULT 0,
  `notas` text DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_con_tenant` (`tenant_id`),
  KEY `idx_con_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: conversaciones (portal tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS `conversaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `contacto_id` int DEFAULT NULL,
  `canal` enum('whatsapp','email','instagram','facebook','web','tiktok') NOT NULL DEFAULT 'whatsapp',
  `asunto` varchar(300) DEFAULT NULL,
  `estado` enum('abierta','cerrada','pendiente') NOT NULL DEFAULT 'abierta',
  `asignado_a` int DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conv_tenant` (`tenant_id`),
  KEY `idx_conv_contacto` (`contacto_id`),
  KEY `idx_conv_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: mensajes (portal tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS `mensajes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversacion_id` int NOT NULL,
  `direccion` enum('entrante','saliente') NOT NULL,
  `contenido` text NOT NULL,
  `tipo` enum('texto','imagen','audio','archivo') NOT NULL DEFAULT 'texto',
  `enviado_por` int DEFAULT NULL,
  `sugerido_por_ia` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_msg_conv` (`conversacion_id`),
  FOREIGN KEY (`conversacion_id`) REFERENCES `conversaciones`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: leads (portal tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS `leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `contacto_id` int DEFAULT NULL,
  `fuente` varchar(100) DEFAULT NULL,
  `estado` enum('nuevo','contactado','calificado','descartado','ganado','perdido') NOT NULL DEFAULT 'nuevo',
  `valor_estimado` decimal(10,2) DEFAULT NULL,
  `probabilidad` tinyint DEFAULT 0,
  `asignado_a` int DEFAULT NULL,
  `notas_ia` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_tenant` (`tenant_id`),
  KEY `idx_ld_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: oportunidades (portal tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS `oportunidades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `contacto_id` int DEFAULT NULL,
  `lead_id` int DEFAULT NULL,
  `titulo` varchar(300) NOT NULL,
  `etapa` enum('contacto','propuesta','negociacion','cierre','ganada','perdida') NOT NULL DEFAULT 'contacto',
  `valor` decimal(10,2) DEFAULT NULL,
  `probabilidad` tinyint DEFAULT 0,
  `fecha_cierre_est` date DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_op_tenant` (`tenant_id`),
  KEY `idx_op_etapa` (`etapa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: ventas_leads (admin panel)
-- ============================================================
CREATE TABLE IF NOT EXISTS `ventas_leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `empresa` varchar(200) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `rubro_interes` varchar(100) DEFAULT NULL,
  `plan_interes` enum('starter','pro','plan_ia','enterprise') DEFAULT NULL,
  `fuente` enum('web','referido','ads','evento','cold') NOT NULL DEFAULT 'web',
  `estado` enum('nuevo','contactado','demo','propuesta','cerrado','perdido') NOT NULL DEFAULT 'nuevo',
  `asignado_a` int DEFAULT NULL,
  `valor_mrr_estimado` decimal(10,2) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vl_estado` (`estado`),
  KEY `idx_vl_asignado` (`asignado_a`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: ventas_actividades
-- ============================================================
CREATE TABLE IF NOT EXISTS `ventas_actividades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `tipo` enum('llamada','email','whatsapp','reunion','nota') NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_actividad` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `proxima_accion` varchar(300) DEFAULT NULL,
  `fecha_proxima_accion` date DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_va_lead` (`lead_id`),
  KEY `idx_va_usuario` (`usuario_id`),
  FOREIGN KEY (`lead_id`) REFERENCES `ventas_leads`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: ventas_conversaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS `ventas_conversaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int DEFAULT NULL,
  `canal` enum('whatsapp','email','web','instagram','facebook','tiktok') NOT NULL DEFAULT 'whatsapp',
  `contacto_nombre` varchar(200) DEFAULT NULL,
  `contacto_telefono` varchar(50) DEFAULT NULL,
  `contacto_email` varchar(200) DEFAULT NULL,
  `asignado_a` int DEFAULT NULL,
  `estado` enum('nueva','en_curso','cerrada') NOT NULL DEFAULT 'nueva',
  `ultimo_mensaje` text DEFAULT NULL,
  `ultimo_mensaje_at` timestamp DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vc_lead` (`lead_id`),
  KEY `idx_vc_asignado` (`asignado_a`),
  KEY `idx_vc_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: ventas_mensajes
-- ============================================================
CREATE TABLE IF NOT EXISTS `ventas_mensajes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversacion_id` int NOT NULL,
  `direccion` enum('entrante','saliente') NOT NULL,
  `contenido` text NOT NULL,
  `enviado_por` int DEFAULT NULL,
  `leido` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vm_conv` (`conversacion_id`),
  FOREIGN KEY (`conversacion_id`) REFERENCES `ventas_conversaciones`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: ventas_metas
-- ============================================================
CREATE TABLE IF NOT EXISTS `ventas_metas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `mes` tinyint NOT NULL,
  `anio` smallint NOT NULL,
  `meta_leads` int NOT NULL DEFAULT 0,
  `meta_cierres` int NOT NULL DEFAULT 0,
  `meta_mrr` decimal(10,2) NOT NULL DEFAULT 0.00,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_meta_usuario_mes` (`usuario_id`,`mes`,`anio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: soporte_tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS `soporte_tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `asignado_a` int DEFAULT NULL,
  `canal` enum('whatsapp','email','web','chat') NOT NULL DEFAULT 'email',
  `categoria` enum('tecnico','facturacion','capacitacion','otro') NOT NULL DEFAULT 'otro',
  `prioridad` enum('baja','media','alta','urgente') NOT NULL DEFAULT 'media',
  `estado` enum('nuevo','en_curso','esperando','resuelto','cerrado') NOT NULL DEFAULT 'nuevo',
  `titulo` varchar(300) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tiempo_respuesta_min` int DEFAULT NULL,
  `satisfaccion` tinyint DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_st_tenant` (`tenant_id`),
  KEY `idx_st_asignado` (`asignado_a`),
  KEY `idx_st_estado` (`estado`),
  KEY `idx_st_prioridad` (`prioridad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: soporte_mensajes
-- ============================================================
CREATE TABLE IF NOT EXISTS `soporte_mensajes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `direccion` enum('entrante','saliente') NOT NULL,
  `contenido` text NOT NULL,
  `enviado_por` int DEFAULT NULL,
  `leido` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sm_ticket` (`ticket_id`),
  FOREIGN KEY (`ticket_id`) REFERENCES `soporte_tickets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: soporte_stats
-- ============================================================
CREATE TABLE IF NOT EXISTS `soporte_stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `mes` tinyint NOT NULL,
  `anio` smallint NOT NULL,
  `tickets_resueltos` int NOT NULL DEFAULT 0,
  `tiempo_respuesta_avg` int NOT NULL DEFAULT 0,
  `satisfaccion_avg` decimal(3,2) DEFAULT 0.00,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_stats_usuario_mes` (`usuario_id`,`mes`,`anio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
-- ============================================================
-- FIN DEL SCHEMA — g360ia v1.0
-- Tablas: 20
-- Última actualización: 2026-03-19
-- ============================================================
