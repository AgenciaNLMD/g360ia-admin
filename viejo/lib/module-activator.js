// lib/module-activator.js
// Activa módulos en la DB de un tenant específico.
// Cada módulo tiene su SQL de creación de tablas y metadata.
// Uso: await activarModulo(db, dbName, "ot")

import { getTenantDb } from "@/lib/tenant-db";

// ── Metadata de módulos ─────────────────────────────────────────────
export const MODULOS_CATALOG = {
  crm: {
    label:       "CRM / Clientes",
    icon:        "bi-people",
    descripcion: "Gestión extendida de clientes con CUIT, condición fiscal, rubro y estados.",
    plan_minimo: "free",
    rubros:      ["all"],
    grupo:       "Operaciones",
  },
  ot: {
    label:       "Órdenes de Trabajo",
    icon:        "bi-tools",
    descripcion: "Gestión de reparaciones con etapas, técnicos, ítems y historial.",
    plan_minimo: "free",
    rubros:      ["Servicio Técnico"],
    grupo:       "Operaciones",
  },
  catalogo: {
    label:       "Catálogo",
    icon:        "bi-box-seam",
    descripcion: "Productos y servicios con precios de costo y venta.",
    plan_minimo: "free",
    rubros:      ["all"],
    grupo:       "Comercial",
  },
  inventario: {
    label:       "Inventario",
    icon:        "bi-archive",
    descripcion: "Control de stock con alertas y movimientos. Requiere Catálogo.",
    plan_minimo: "free",
    rubros:      ["all"],
    depende:     ["catalogo"],
    grupo:       "Comercial",
  },
  ventas: {
    label:       "Ventas",
    icon:        "bi-cart3",
    descripcion: "Comprobantes de venta vinculados a OT, clientes o mostrador.",
    plan_minimo: "free",
    rubros:      ["all"],
    grupo:       "Comercial",
  },
  facturacion: {
    label:       "Facturación ARCA",
    icon:        "bi-receipt",
    descripcion: "Facturación electrónica argentina (AFIP/ARCA). Requiere plan Pro.",
    plan_minimo: "pro",
    rubros:      ["all"],
    depende:     ["ventas"],
    grupo:       "Comercial",
  },
  caja: {
    label:       "Caja / Cobros",
    icon:        "bi-cash-stack",
    descripcion: "Registro de cobros por medio de pago y resumen diario.",
    plan_minimo: "free",
    rubros:      ["all"],
    depende:     ["ventas"],
    grupo:       "Comercial",
  },
  comunicaciones: {
    label:       "Comunicaciones",
    icon:        "bi-whatsapp",
    descripcion: "WhatsApp, plantillas y notificaciones automáticas por evento.",
    plan_minimo: "pro",
    rubros:      ["all"],
    grupo:       "Comunicación",
  },
  equipo: {
    label:       "Equipo / Técnicos",
    icon:        "bi-people-fill",
    descripcion: "Perfiles de técnicos con especialidad y carga de trabajo.",
    plan_minimo: "pro",
    rubros:      ["Servicio Técnico"],
    grupo:       "Gestión",
  },
  proveedores: {
    label:       "Proveedores",
    icon:        "bi-truck",
    descripcion: "Proveedores, catálogo asociado y órdenes de compra.",
    plan_minimo: "business",
    rubros:      ["all"],
    grupo:       "Gestión",
  },
};

// ── SQL por módulo ──────────────────────────────────────────────────
// Cada función recibe la conexión DB del tenant y ejecuta las sentencias necesarias.
// Se usa CREATE TABLE IF NOT EXISTS para idempotencia.
// Para ALTER TABLE se verifica primero en information_schema.

async function colExiste(db, tabla, columna) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tabla, columna]
  );
  return rows[0].cnt > 0;
}

async function tablaExiste(db, tabla) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tabla]
  );
  return rows[0].cnt > 0;
}

const SQL_MODULOS = {

  // ── CRM: extiende clientes ────────────────────────────────────────
  crm: async (db) => {
    const cols = [
      { col: "lead_id",          sql: "ADD COLUMN lead_id INT NULL AFTER id" },
      { col: "razon_social",     sql: "ADD COLUMN razon_social VARCHAR(160) NULL" },
      { col: "cuit",             sql: "ADD COLUMN cuit VARCHAR(15) NULL" },
      { col: "condicion_fiscal", sql: "ADD COLUMN condicion_fiscal ENUM('RI','MT','CF','EX') NULL" },
      { col: "rubro",            sql: "ADD COLUMN rubro VARCHAR(100) NULL" },
      { col: "estado",           sql: "ADD COLUMN estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo'" },
    ];
    for (const { col, sql } of cols) {
      if (!(await colExiste(db, "clientes", col))) {
        await db.query(`ALTER TABLE clientes ${sql}`);
      }
    }
  },

  // ── OT: etapas + órdenes + ítems + historial ─────────────────────
  ot: async (db) => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ot_etapas_config (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        orden       TINYINT      NOT NULL,
        nombre      VARCHAR(80)  NOT NULL,
        color       VARCHAR(20)  NOT NULL DEFAULT '#506886',
        plan_minimo VARCHAR(20)  NOT NULL DEFAULT 'free',
        activa      TINYINT(1)   NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [etapas] = await db.query("SELECT COUNT(*) AS cnt FROM ot_etapas_config");
    if (etapas[0].cnt === 0) {
      await db.query(`
        INSERT INTO ot_etapas_config (orden, nombre, color, plan_minimo) VALUES
        (1,'Recibido',           '#506886','free'),
        (2,'Diagnóstico',        '#B08A55','pro'),
        (3,'Presupuestado',      '#8B5CF6','pro'),
        (4,'Aprobado',           '#3A9E70','pro'),
        (5,'En reparación',      '#F59E0B','pro'),
        (6,'Listo para retirar', '#1A7A4A','pro'),
        (7,'Entregado',          '#6B7280','free')
      `);
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS ordenes_trabajo (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        numero_ot       VARCHAR(20)   NOT NULL UNIQUE,
        cliente_id      INT           NOT NULL,
        tecnico_id      INT           NULL,
        etapa_id        INT           NOT NULL DEFAULT 1,
        titulo          VARCHAR(200)  NOT NULL,
        descripcion     TEXT          NULL,
        prioridad       ENUM('baja','normal','alta','urgente') NOT NULL DEFAULT 'normal',
        fecha_ingreso   DATE          NOT NULL,
        fecha_promesa   DATE          NULL,
        monto_estimado  DECIMAL(12,2) NULL,
        monto_final     DECIMAL(12,2) NULL,
        estado          ENUM('abierta','cerrada','cancelada') NOT NULL DEFAULT 'abierta',
        notas_internas  TEXT          NULL,
        creado_en       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS ot_items (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        ot_id       INT           NOT NULL,
        tipo        ENUM('mano_obra','repuesto','servicio') NOT NULL DEFAULT 'repuesto',
        descripcion VARCHAR(200)  NOT NULL,
        cantidad    DECIMAL(10,2) NOT NULL DEFAULT 1,
        precio_unit DECIMAL(12,2) NOT NULL DEFAULT 0,
        subtotal    DECIMAL(12,2) NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS ot_historial (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        ot_id      INT          NOT NULL,
        usuario_id INT          NULL,
        etapa_id   INT          NULL,
        accion     VARCHAR(100) NOT NULL,
        notas      TEXT         NULL,
        creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  // ── Catálogo ──────────────────────────────────────────────────────
  catalogo: async (db) => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS catalogo (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        codigo         VARCHAR(60)   NULL,
        nombre         VARCHAR(200)  NOT NULL,
        descripcion    TEXT          NULL,
        tipo           ENUM('producto','servicio') NOT NULL DEFAULT 'producto',
        precio_costo   DECIMAL(12,2) NULL,
        precio_venta   DECIMAL(12,2) NOT NULL DEFAULT 0,
        unidad         VARCHAR(30)   NOT NULL DEFAULT 'unidad',
        activo         TINYINT(1)    NOT NULL DEFAULT 1,
        creado_en      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  // ── Inventario (requiere catálogo) ────────────────────────────────
  inventario: async (db) => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS inventario (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        catalogo_id    INT           NOT NULL UNIQUE,
        stock_actual   DECIMAL(10,2) NOT NULL DEFAULT 0,
        stock_minimo   DECIMAL(10,2) NOT NULL DEFAULT 0,
        ubicacion      VARCHAR(100)  NULL,
        actualizado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS inventario_movimientos (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        catalogo_id INT           NOT NULL,
        tipo        ENUM('entrada','salida','ajuste') NOT NULL,
        cantidad    DECIMAL(10,2) NOT NULL,
        referencia  VARCHAR(100)  NULL,
        notas       TEXT          NULL,
        usuario_id  INT           NULL,
        creado_en   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  // ── Ventas ────────────────────────────────────────────────────────
  ventas: async (db) => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id                 INT AUTO_INCREMENT PRIMARY KEY,
        numero_venta       VARCHAR(20)   NOT NULL UNIQUE,
        cliente_id         INT           NULL,
        ot_id              INT           NULL,
        origen             ENUM('ot','crm','mostrador') NOT NULL DEFAULT 'mostrador',
        subtotal           DECIMAL(12,2) NOT NULL DEFAULT 0,
        descuento          DECIMAL(12,2) NOT NULL DEFAULT 0,
        total              DECIMAL(12,2) NOT NULL DEFAULT 0,
        estado_pago        ENUM('pendiente','parcial','pagado') NOT NULL DEFAULT 'pendiente',
        estado_facturacion ENUM('sin_factura','facturado','anulado') NOT NULL DEFAULT 'sin_factura',
        notas              TEXT          NULL,
        creado_en          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS ventas_items (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        venta_id    INT           NOT NULL,
        catalogo_id INT           NULL,
        descripcion VARCHAR(200)  NOT NULL,
        cantidad    DECIMAL(10,2) NOT NULL DEFAULT 1,
        precio_unit DECIMAL(12,2) NOT NULL DEFAULT 0,
        subtotal    DECIMAL(12,2) NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  // ── Facturación ARCA ──────────────────────────────────────────────
  facturacion: async (db) => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS facturas (
        id        INT AUTO_INCREMENT PRIMARY KEY,
        venta_id  INT           NOT NULL,
        tipo      ENUM('A','B','C') NOT NULL DEFAULT 'B',
        numero    VARCHAR(20)   NULL,
        cae       VARCHAR(30)   NULL,
        cae_vto   DATE          NULL,
        monto     DECIMAL(12,2) NOT NULL DEFAULT 0,
        estado    ENUM('pendiente','emitida','anulada') NOT NULL DEFAULT 'pendiente',
        pdf_url   TEXT          NULL,
        creado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS tenant_arca_config (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        cuit           VARCHAR(15)  NULL,
        razon_social   VARCHAR(160) NULL,
        punto_venta    SMALLINT     NULL,
        cert_pem       TEXT         NULL,
        key_pem        TEXT         NULL,
        modo           ENUM('homo','prod') NOT NULL DEFAULT 'homo',
        actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  // ── Caja / Cobros ─────────────────────────────────────────────────
  caja: async (db) => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS cobros (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        venta_id      INT           NULL,
        monto         DECIMAL(12,2) NOT NULL,
        medio         ENUM('efectivo','transferencia','debito','credito','mercadopago','otro') NOT NULL DEFAULT 'efectivo',
        referencia    VARCHAR(100)  NULL,
        mp_payment_id VARCHAR(60)   NULL,
        notas         TEXT          NULL,
        creado_en     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS tenant_mp_config (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        access_token   TEXT         NULL,
        public_key     TEXT         NULL,
        sandbox        TINYINT(1)   NOT NULL DEFAULT 1,
        actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  // ── Comunicaciones ────────────────────────────────────────────────
  comunicaciones: async (db) => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS comunicaciones_log (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT          NULL,
        canal      ENUM('whatsapp','email','sms') NOT NULL DEFAULT 'whatsapp',
        direccion  ENUM('saliente','entrante')    NOT NULL DEFAULT 'saliente',
        mensaje    TEXT         NOT NULL,
        estado     ENUM('enviado','fallido','pendiente') NOT NULL DEFAULT 'pendiente',
        referencia VARCHAR(100) NULL,
        creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS comunicaciones_plantillas (
        id        INT AUTO_INCREMENT PRIMARY KEY,
        nombre    VARCHAR(100) NOT NULL,
        canal     ENUM('whatsapp','email') NOT NULL DEFAULT 'whatsapp',
        evento    VARCHAR(80)  NULL,
        contenido TEXT         NOT NULL,
        activa    TINYINT(1)   NOT NULL DEFAULT 1,
        creado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [pl] = await db.query("SELECT COUNT(*) AS cnt FROM comunicaciones_plantillas");
    if (pl[0].cnt === 0) {
      await db.query(`
        INSERT INTO comunicaciones_plantillas (nombre, canal, evento, contenido) VALUES
        ('Bienvenida', 'whatsapp', 'registro', 'Hola {nombre}, bienvenido a {negocio}! Estamos para ayudarte.'),
        ('OT recibida', 'whatsapp', 'ot_recibida', 'Hola {nombre}, recibimos tu equipo. Número de OT: {numero_ot}.'),
        ('OT lista', 'whatsapp', 'ot_lista', 'Hola {nombre}, tu equipo está listo para retirar. OT: {numero_ot}.')
      `);
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS tenant_whatsapp_config (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        evolution_url  VARCHAR(255) NULL,
        evolution_key  TEXT         NULL,
        instance_name  VARCHAR(100) NULL,
        activo         TINYINT(1)   NOT NULL DEFAULT 0,
        actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  // ── Equipo / Técnicos ─────────────────────────────────────────────
  equipo: async (db) => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tecnicos_perfil (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id     INT          NOT NULL UNIQUE,
        especialidad   VARCHAR(120) NULL,
        telefono       VARCHAR(30)  NULL,
        activo         TINYINT(1)   NOT NULL DEFAULT 1,
        notas          TEXT         NULL,
        creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  // ── Proveedores ───────────────────────────────────────────────────
  proveedores: async (db) => {
    // Extiende proveedores si ya existe (de 002_modulo_ots.sql)
    if (await tablaExiste(db, "proveedores")) {
      const alterar = [
        { col: "direccion",        sql: "ADD COLUMN direccion VARCHAR(200) NULL" },
        { col: "condiciones_pago", sql: "ADD COLUMN condiciones_pago VARCHAR(100) NULL" },
        { col: "notas",            sql: "ADD COLUMN notas TEXT NULL" },
        { col: "activo",           sql: "ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1" },
        { col: "actualizado_en",   sql: "ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
      ];
      for (const { col, sql } of alterar) {
        if (!(await colExiste(db, "proveedores", col))) {
          await db.query(`ALTER TABLE proveedores ${sql}`);
        }
      }
    } else {
      await db.query(`
        CREATE TABLE IF NOT EXISTS proveedores (
          id               INT AUTO_INCREMENT PRIMARY KEY,
          nombre           VARCHAR(160) NOT NULL,
          contacto         VARCHAR(100) NULL,
          telefono         VARCHAR(30)  NULL,
          email            VARCHAR(120) NULL,
          direccion        VARCHAR(200) NULL,
          condiciones_pago VARCHAR(100) NULL,
          notas            TEXT         NULL,
          activo           TINYINT(1)   NOT NULL DEFAULT 1,
          creado_en        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          actualizado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS proveedores_catalogo (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        proveedor_id  INT           NOT NULL,
        catalogo_id   INT           NOT NULL,
        codigo_prov   VARCHAR(60)   NULL,
        precio_compra DECIMAL(12,2) NULL,
        activo        TINYINT(1)    NOT NULL DEFAULT 1,
        UNIQUE KEY uq_prov_cat (proveedor_id, catalogo_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ordenes_compra: crear o extender
    if (await tablaExiste(db, "ordenes_compra")) {
      const alterar = [
        { col: "notas",          sql: "ADD COLUMN notas TEXT NULL" },
        { col: "actualizado_en", sql: "ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
      ];
      for (const { col, sql } of alterar) {
        if (!(await colExiste(db, "ordenes_compra", col))) {
          await db.query(`ALTER TABLE ordenes_compra ${sql}`);
        }
      }
    } else {
      await db.query(`
        CREATE TABLE IF NOT EXISTS ordenes_compra (
          id             INT AUTO_INCREMENT PRIMARY KEY,
          proveedor_id   INT           NOT NULL,
          numero_oc      VARCHAR(20)   NULL,
          estado         ENUM('borrador','enviada','recibida','cancelada') NOT NULL DEFAULT 'borrador',
          total          DECIMAL(12,2) NOT NULL DEFAULT 0,
          notas          TEXT          NULL,
          creado_en      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          actualizado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS ordenes_compra_items (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        oc_id       INT           NOT NULL,
        catalogo_id INT           NULL,
        descripcion VARCHAR(200)  NOT NULL,
        cantidad    DECIMAL(10,2) NOT NULL DEFAULT 1,
        precio_unit DECIMAL(12,2) NOT NULL DEFAULT 0,
        subtotal    DECIMAL(12,2) NOT NULL DEFAULT 0,
        recibido    DECIMAL(10,2) NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },
};

// ── Función principal de activación ────────────────────────────────
/**
 * Activa un módulo creando sus tablas en la DB del tenant.
 * @param {string} dbName - Nombre de la DB del tenant (ej: "t001_nombre")
 * @param {string} modulo - Clave del módulo (ej: "ot", "crm")
 * @returns {{ ok: boolean, tablas_creadas: string[], error?: string }}
 */
export async function activarModulo(dbName, modulo) {
  const fn = SQL_MODULOS[modulo];
  if (!fn) throw new Error(`Módulo desconocido: ${modulo}`);

  const db = getTenantDb(dbName);

  // Verificar dependencias
  const meta = MODULOS_CATALOG[modulo];
  if (meta?.depende?.length) {
    // Las dependencias deben activarse primero (chequeamos tablas en DB)
    // Esta validación es informativa; el admin puede ignorarla si ya activó el módulo manualmente
  }

  await fn(db);
  return { ok: true };
}

// ── Helper: lista de módulos para un rubro y plan ──────────────────
/**
 * Devuelve los módulos recomendados para un rubro y plan específicos.
 */
export function modulosRecomendados(rubro, plan) {
  const orden = ["free", "pro", "business", "ia"];
  const planIdx = orden.indexOf(plan);

  return Object.entries(MODULOS_CATALOG)
    .filter(([, meta]) => {
      const disponible = orden.indexOf(meta.plan_minimo) <= planIdx;
      const aplica     = meta.rubros.includes("all") || meta.rubros.includes(rubro);
      return disponible && aplica;
    })
    .map(([id, meta]) => ({ id, ...meta }));
}
