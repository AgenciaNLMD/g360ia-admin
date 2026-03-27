-- database/tenant-migrations/005_catalogo_inventario.sql
-- Catálogo de productos/servicios e inventario de stock
-- @rubro: todos
-- @plan: free, pro, business, ia
-- Ejecutar: node scripts/migrar-tenants.js --migracion=005_catalogo_inventario

-- Catálogo unificado: productos (repuestos) y servicios (mano de obra)
CREATE TABLE IF NOT EXISTS catalogo (
  id              INT NOT NULL AUTO_INCREMENT,
  tipo            ENUM('producto','servicio') NOT NULL DEFAULT 'producto',
  nombre          VARCHAR(200) NOT NULL,
  descripcion     TEXT NULL,
  sku             VARCHAR(100) NULL,
  precio_costo    DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_venta    DECIMAL(10,2) NOT NULL DEFAULT 0,
  unidad          VARCHAR(50) NOT NULL DEFAULT 'unidad',
  categoria       VARCHAR(100) NULL,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_cat_tipo      (tipo),
  INDEX idx_cat_sku       (sku),
  INDEX idx_cat_categoria (categoria),
  INDEX idx_cat_activo    (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock actual por producto del catálogo (solo aplica a tipo='producto')
CREATE TABLE IF NOT EXISTS inventario (
  id              INT NOT NULL AUTO_INCREMENT,
  catalogo_id     INT NOT NULL,
  stock_actual    DECIMAL(10,3) NOT NULL DEFAULT 0,
  stock_minimo    DECIMAL(10,3) NOT NULL DEFAULT 0,
  actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inv_catalogo (catalogo_id),
  INDEX idx_inv_bajo_stock (stock_actual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Movimientos de stock: entradas, salidas, reservas, ajustes
CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id               INT NOT NULL AUTO_INCREMENT,
  catalogo_id      INT NOT NULL,
  tipo             ENUM('entrada','salida','reserva','liberacion','ajuste') NOT NULL,
  cantidad         DECIMAL(10,3) NOT NULL,
  stock_resultante DECIMAL(10,3) NOT NULL,
  origen           ENUM('ot','compra','ajuste_manual') NOT NULL DEFAULT 'ajuste_manual',
  origen_id        INT NULL,
  nota             TEXT NULL,
  usuario_id       INT NULL,
  creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_invmov_catalogo (catalogo_id),
  INDEX idx_invmov_origen   (origen, origen_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
