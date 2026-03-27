-- Schema: tabla sesiones_log
-- Registra accesos y sesiones activas por usuario

CREATE TABLE IF NOT EXISTS sesiones_log (
  id            INT NOT NULL AUTO_INCREMENT,
  usuario_id    INT NOT NULL,
  ip            VARCHAR(45) NULL,
  user_agent    TEXT NULL,
  dispositivo   VARCHAR(100) NULL,
  ubicacion     VARCHAR(200) NULL,
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sesiones_usuario (usuario_id),
  INDEX idx_sesiones_fecha (creado_en),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
