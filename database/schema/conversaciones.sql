CREATE TABLE IF NOT EXISTS conversaciones (
  id              INT NOT NULL AUTO_INCREMENT,
  tenant_id       INT NOT NULL,
  contacto_id     INT NULL,
  canal           ENUM('whatsapp','email','instagram','facebook','web') NOT NULL DEFAULT 'whatsapp',
  asunto          VARCHAR(300) NULL,
  estado          ENUM('abierta','cerrada','pendiente') NOT NULL DEFAULT 'abierta',
  asignado_a      INT NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_conv_tenant (tenant_id),
  INDEX idx_conv_contacto (contacto_id),
  INDEX idx_conv_estado (estado),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE SET NULL,
  FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL
);
