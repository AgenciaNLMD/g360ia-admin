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
