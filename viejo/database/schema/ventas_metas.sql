CREATE TABLE IF NOT EXISTS ventas_metas (
  id          INT NOT NULL AUTO_INCREMENT,
  usuario_id  INT NOT NULL,
  mes         TINYINT NOT NULL,
  anio        SMALLINT NOT NULL,
  meta_leads  INT NOT NULL DEFAULT 0,
  meta_cierres INT NOT NULL DEFAULT 0,
  meta_mrr    DECIMAL(10,2) NOT NULL DEFAULT 0,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_meta_usuario_mes (usuario_id, mes, anio),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
