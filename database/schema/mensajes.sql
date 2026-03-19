CREATE TABLE IF NOT EXISTS mensajes (
  id               INT NOT NULL AUTO_INCREMENT,
  conversacion_id  INT NOT NULL,
  direccion        ENUM('entrante','saliente') NOT NULL,
  contenido        TEXT NOT NULL,
  tipo             ENUM('texto','imagen','audio','archivo') NOT NULL DEFAULT 'texto',
  enviado_por      INT NULL,
  sugerido_por_ia  TINYINT(1) NOT NULL DEFAULT 0,
  creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_msg_conversacion (conversacion_id),
  FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (enviado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);
