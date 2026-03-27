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
