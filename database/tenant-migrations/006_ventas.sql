-- database/tenant-migrations/006_ventas.sql
-- Módulo de ventas: registro de transacciones comerciales
-- @rubro: todos
-- @plan: free, pro, business, ia
-- Ejecutar: node scripts/migrar-tenants.js --migracion=006_ventas

CREATE TABLE IF NOT EXISTS ventas (
  id                  INT NOT NULL AUTO_INCREMENT,
  numero_venta        VARCHAR(20) NOT NULL,
  cliente_id          INT NULL,
  origen              ENUM('ot','crm','mostrador') NOT NULL DEFAULT 'mostrador',
  origen_id           INT NULL,
  subtotal            DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuento           DECIMAL(10,2) NOT NULL DEFAULT 0,
  total               DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado_pago         ENUM('pendiente','parcial','pagado') NOT NULL DEFAULT 'pendiente',
  estado_facturacion  ENUM('sin_facturar','facturado') NOT NULL DEFAULT 'sin_facturar',
  notas               TEXT NULL,
  creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_venta_numero (numero_venta),
  INDEX idx_vta_cliente       (cliente_id),
  INDEX idx_vta_origen        (origen, origen_id),
  INDEX idx_vta_estado_pago   (estado_pago),
  INDEX idx_vta_estado_factu  (estado_facturacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ventas_items (
  id              INT NOT NULL AUTO_INCREMENT,
  venta_id        INT NOT NULL,
  catalogo_id     INT NULL,
  descripcion     VARCHAR(300) NOT NULL,
  cantidad        DECIMAL(10,3) NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_vi_venta   (venta_id),
  INDEX idx_vi_catalogo (catalogo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
