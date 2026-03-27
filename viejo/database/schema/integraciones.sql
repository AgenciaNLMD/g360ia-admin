CREATE TABLE IF NOT EXISTS integraciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo ENUM('whatsapp','instagram','facebook','email','web','tiktok','otra') NOT NULL,
  tenant_id INT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 0,
  config JSON NULL,
  sugerencia_dismisseada TINYINT(1) NOT NULL DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_int_tenant (tenant_id),
  INDEX idx_int_tipo (tipo)
);

INSERT INTO integraciones (nombre, tipo, tenant_id, activo) VALUES
('WhatsApp', 'whatsapp', NULL, 0),
('Instagram', 'instagram', NULL, 0),
('Facebook', 'facebook', NULL, 0),
('Email', 'email', NULL, 0),
('Web / Chat', 'web', NULL, 0),
('TikTok', 'tiktok', NULL, 0);
