-- Ventas: mensajes dentro de cada conversación
CREATE TABLE IF NOT EXISTS ventas_mensajes (
  id               INT NOT NULL AUTO_INCREMENT,
  conversacion_id  INT NOT NULL,
  direccion        ENUM('entrante','saliente') NOT NULL,
  contenido        TEXT NOT NULL,
  enviado_por      INT NULL,
  leido            TINYINT(1) NOT NULL DEFAULT 0,
  creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_vm_conversacion (conversacion_id),
  FOREIGN KEY (conversacion_id) REFERENCES ventas_conversaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (enviado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);
