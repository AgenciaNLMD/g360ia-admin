CREATE TABLE IF NOT EXISTS negocios (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NULL,
  nombre VARCHAR(150) NOT NULL,
  rubro VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  email VARCHAR(190) NULL,
  telefono VARCHAR(50) NULL,
  whatsapp VARCHAR(50) NULL,
  direccion VARCHAR(255) NULL,
  ciudad VARCHAR(120) NULL,
  provincia VARCHAR(120) NULL,
  pais VARCHAR(120) NOT NULL DEFAULT 'Argentina',
  sitio_web VARCHAR(255) NULL,
  instagram VARCHAR(255) NULL,
  facebook VARCHAR(255) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_negocios_rubro (rubro),
  INDEX idx_negocios_ciudad (ciudad),
  INDEX idx_negocios_activo (activo)
);

INSERT INTO negocios
  (tenant_id, nombre, rubro, descripcion, email, telefono, whatsapp, direccion, ciudad, provincia, pais, sitio_web, instagram, facebook, activo)
VALUES
  (NULL, 'Hotel Aurora', 'hotel', 'Hotel urbano con reservas online y atención 24/7.', 'contacto@hotelaurora.com', '+54 11 4000 1001', '+54 9 11 4000 1001', 'Av. Libertad 123', 'Buenos Aires', 'Buenos Aires', 'Argentina', 'https://hotelaurora.com', 'https://instagram.com/hotelaurora', 'https://facebook.com/hotelaurora', 1),
  (NULL, 'Spa Brisa', 'spa', 'Centro de bienestar con turnos, membresías y promociones.', 'hola@spabrisa.com', '+54 11 4000 1002', '+54 9 11 4000 1002', 'Calle Sol 456', 'Córdoba', 'Córdoba', 'Argentina', 'https://spabrisa.com', 'https://instagram.com/spabrisa', 'https://facebook.com/spabrisa', 1),
  (NULL, 'Logística Sur', 'logistica', 'Operador logístico para distribución regional y seguimiento de envíos.', 'ventas@logisticasur.com', '+54 11 4000 1003', '+54 9 11 4000 1003', 'Ruta 205 Km 35', 'Ezeiza', 'Buenos Aires', 'Argentina', 'https://logisticasur.com', 'https://instagram.com/logisticasur', 'https://facebook.com/logisticasur', 1),
  (NULL, 'Eventos Prisma', 'eventos', 'Organización integral de eventos sociales y corporativos.', 'equipo@eventosprisma.com', '+54 11 4000 1004', '+54 9 11 4000 1004', 'Mitre 789', 'La Plata', 'Buenos Aires', 'Argentina', 'https://eventosprisma.com', 'https://instagram.com/eventosprisma', 'https://facebook.com/eventosprisma', 1),
  (NULL, 'Inmobiliaria Delta', 'inmobiliaria', 'Gestión de alquileres, ventas y administración de propiedades.', 'info@inmobiliariadelta.com', '+54 11 4000 1005', '+54 9 11 4000 1005', 'Belgrano 321', 'Rosario', 'Santa Fe', 'Argentina', 'https://inmobiliariadelta.com', 'https://instagram.com/inmobiliariadelta', 'https://facebook.com/inmobiliariadelta', 1);
