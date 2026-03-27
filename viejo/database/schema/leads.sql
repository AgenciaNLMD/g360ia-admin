CREATE TABLE IF NOT EXISTS leads (
  id              INT NOT NULL AUTO_INCREMENT,
  tenant_id       INT NOT NULL,
  contacto_id     INT NULL,
  fuente          VARCHAR(100) NULL,
  estado          ENUM('nuevo','contactado','calificado','descartado','convertido') NOT NULL DEFAULT 'nuevo',
  valor_estimado  DECIMAL(10,2) NULL,
  probabilidad    TINYINT NULL DEFAULT 0,
  asignado_a      INT NULL,
  notas_ia        TEXT NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_leads_tenant (tenant_id),
  INDEX idx_leads_estado (estado),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE SET NULL,
  FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL
);
