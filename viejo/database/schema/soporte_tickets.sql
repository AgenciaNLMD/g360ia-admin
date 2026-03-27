-- Soporte: tickets de tenants activos
CREATE TABLE IF NOT EXISTS soporte_tickets (
  id            INT NOT NULL AUTO_INCREMENT,
  tenant_id     INT NOT NULL,
  asignado_a    INT NULL,
  canal         ENUM('whatsapp','email','web','chat') NOT NULL DEFAULT 'email',
  categoria     ENUM('tecnico','facturacion','capacitacion','otro') NOT NULL DEFAULT 'otro',
  prioridad     ENUM('baja','media','alta','urgente') NOT NULL DEFAULT 'media',
  estado        ENUM('nuevo','en_curso','esperando','resuelto','cerrado') NOT NULL DEFAULT 'nuevo',
  titulo        VARCHAR(300) NOT NULL,
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_st_tenant (tenant_id),
  INDEX idx_st_asignado (asignado_a),
  INDEX idx_st_estado (estado),
  INDEX idx_st_prioridad (prioridad),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Soporte: mensajes dentro de cada ticket
CREATE TABLE IF NOT EXISTS soporte_mensajes (
  id         INT NOT NULL AUTO_INCREMENT,
  ticket_id  INT NOT NULL,
  direccion  ENUM('entrante','saliente') NOT NULL,
  contenido  TEXT NOT NULL,
  enviado_por INT NULL,
  leido      TINYINT(1) NOT NULL DEFAULT 0,
  creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sm_ticket (ticket_id),
  FOREIGN KEY (ticket_id) REFERENCES soporte_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (enviado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Soporte: stats por agente
CREATE TABLE IF NOT EXISTS soporte_stats (
  id                    INT NOT NULL AUTO_INCREMENT,
  usuario_id            INT NOT NULL,
  mes                   TINYINT NOT NULL,
  anio                  SMALLINT NOT NULL,
  tickets_resueltos     INT NOT NULL DEFAULT 0,
  tiempo_respuesta_avg  INT NOT NULL DEFAULT 0,
  satisfaccion_avg      DECIMAL(3,2) NULL DEFAULT 0,
  creado_en             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stats_usuario_mes (usuario_id, mes, anio),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
También guardá estos schemas en database/schema/:

Archivo	Tabla
ventas_conversaciones.sql	ventas_conversaciones
ventas_mensajes.sql	ventas_mensajes
soporte_tickets.sql	soporte_tickets
soporte_mensajes.sql	soporte_mensajes
soporte_stats.sql	soporte_stats
Avisame cuando esté listo y arrancamos con las APIs y las vistas.



