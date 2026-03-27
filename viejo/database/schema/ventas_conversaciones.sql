-- Ventas: conversaciones con leads/prospectos
CREATE TABLE IF NOT EXISTS ventas_conversaciones (
  id                INT NOT NULL AUTO_INCREMENT,
  lead_id           INT NULL,
  canal             ENUM('whatsapp','email','web','instagram','facebook') NOT NULL DEFAULT 'whatsapp',
  contacto_nombre   VARCHAR(200) NULL,
  contacto_telefono VARCHAR(50) NULL,
  contacto_email    VARCHAR(200) NULL,
  asignado_a        INT NULL,
  estado            ENUM('nueva','en_curso','cerrada') NOT NULL DEFAULT 'nueva',
  creado_en         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_vc_lead (lead_id),
  INDEX idx_vc_asignado (asignado_a),
  INDEX idx_vc_estado (estado),
  FOREIGN KEY (lead_id) REFERENCES ventas_leads(id) ON DELETE SET NULL,
  FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL
);
