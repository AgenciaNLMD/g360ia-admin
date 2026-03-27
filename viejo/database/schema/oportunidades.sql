CREATE TABLE IF NOT EXISTS oportunidades (
  id                INT NOT NULL AUTO_INCREMENT,
  tenant_id         INT NOT NULL,
  contacto_id       INT NULL,
  lead_id           INT NULL,
  titulo            VARCHAR(300) NOT NULL,
  etapa             ENUM('contacto','propuesta','negociacion','cierre','perdido') NOT NULL DEFAULT 'contacto',
  valor             DECIMAL(10,2) NULL,
  probabilidad      TINYINT NULL DEFAULT 0,
  fecha_cierre_est  DATE NULL,
  creado_en         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_op_tenant (tenant_id),
  INDEX idx_op_etapa (etapa),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);
