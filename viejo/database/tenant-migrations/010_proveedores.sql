-- database/tenant-migrations/010_proveedores.sql
-- Proveedores completos, catálogo por proveedor y órdenes de compra con ítems
-- @rubro: serv_tecnico, tecnico, reparacion, todos
-- @plan: business, ia
-- Ejecutar: node scripts/migrar-tenants.js --migracion=010_proveedores
--
-- NOTA: La migración 002_modulo_ots.sql ya creó una tabla `proveedores` básica
-- y una tabla `ordenes_compra` simplificada. Esta migración extiende proveedores
-- con ALTER TABLE y crea las nuevas tablas proveedores_catalogo y ordenes_compra_items.

-- Extender tabla proveedores existente con campos adicionales
ALTER TABLE proveedores
  ADD COLUMN direccion         VARCHAR(300) NULL      AFTER telefono,
  ADD COLUMN condiciones_pago  TEXT NULL               AFTER cuit,
  ADD COLUMN notas             TEXT NULL               AFTER condiciones_pago,
  ADD COLUMN activo            TINYINT(1) NOT NULL DEFAULT 1 AFTER notas,
  ADD COLUMN actualizado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Si la tabla proveedores NO existe (tenants que no aplicaron 002), crearla completa
-- (Solo alcanza si 002 no se ejecutó — el sistema de migraciones previene duplicados)

-- Vínculo proveedor ↔ catálogo: qué repuestos provee y a qué precio
CREATE TABLE IF NOT EXISTS proveedores_catalogo (
  id                  INT NOT NULL AUTO_INCREMENT,
  proveedor_id        INT NOT NULL,
  catalogo_id         INT NOT NULL,
  precio_costo        DECIMAL(10,2) NOT NULL DEFAULT 0,
  codigo_proveedor    VARCHAR(100) NULL,
  activo              TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_provcal (proveedor_id, catalogo_id),
  INDEX idx_provcal_proveedor (proveedor_id),
  INDEX idx_provcal_catalogo  (catalogo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ítems de la orden de compra (la OC tiene un JSON `items` pero lo normalizamos)
CREATE TABLE IF NOT EXISTS ordenes_compra_items (
  id              INT NOT NULL AUTO_INCREMENT,
  oc_id           INT NOT NULL,
  catalogo_id     INT NOT NULL,
  cantidad        DECIMAL(10,3) NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_oci_oc      (oc_id),
  INDEX idx_oci_catalogo (catalogo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extender ordenes_compra con campo notas (si no existe)
ALTER TABLE ordenes_compra
  ADD COLUMN notas         TEXT NULL           AFTER items,
  ADD COLUMN actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
