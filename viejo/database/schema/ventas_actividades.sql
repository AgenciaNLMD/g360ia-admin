CREATE TABLE IF NOT EXISTS ventas_actividades (
  id                    INT NOT NULL AUTO_INCREMENT,
  lead_id               INT NOT NULL,
  usuario_id            INT NOT NULL,
  tipo                  ENUM('llamada','email','whatsapp','reunion','nota') NOT NULL,
  descripcion           TEXT NULL,
  fecha_actividad       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  proxima_accion        VARCHAR(300) NULL,
  fecha_proxima_accion  DATE NULL,
  creado_en             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_act_lead (lead_id),
  INDEX idx_act_usuario (usuario_id),
  FOREIGN KEY (lead_id) REFERENCES ventas_leads(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
