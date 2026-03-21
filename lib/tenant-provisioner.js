// lib/tenant-provisioner.js
// Crea la base de datos con SOLO las tablas base al dar de alta un tenant.
// Los módulos adicionales se agregan después via scripts/migrar-tenants.js

import mysql from "mysql2/promise";

// ── Conexión sin base de datos específica (para poder crear DBs) ──
async function getRootConnection() {
  return mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
}

// ── Genera el nombre de la DB ─────────────────────────────────────
export function generarDbName(id, nombre) {
  const idPadded = String(id).padStart(3, "0");
  const slug = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  return `t${idPadded}_${slug}`;
}

// ── Tablas base — se crean en TODOS los tenants al dar de alta ────
const SQL_BASE = `
  CREATE TABLE IF NOT EXISTS tenant_migraciones (
    id          INT NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(100) NOT NULL,
    aplicada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_migracion (nombre)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS clientes (
    id             INT NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(200) NOT NULL,
    email          VARCHAR(200) NULL,
    telefono       VARCHAR(50) NULL,
    whatsapp       VARCHAR(50) NULL,
    direccion      VARCHAR(300) NULL,
    notas          TEXT NULL,
    score_ia       TINYINT NOT NULL DEFAULT 0,
    activo         TINYINT(1) NOT NULL DEFAULT 1,
    creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_cli_email (email),
    INDEX idx_cli_telefono (telefono)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS conversaciones (
    id             INT NOT NULL AUTO_INCREMENT,
    cliente_id     INT NULL,
    canal          ENUM('whatsapp','email','web') NOT NULL DEFAULT 'whatsapp',
    estado         ENUM('abierta','cerrada','pendiente') NOT NULL DEFAULT 'abierta',
    ultimo_mensaje TEXT NULL,
    ultimo_msg_at  TIMESTAMP NULL,
    creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_conv_cliente (cliente_id),
    INDEX idx_conv_estado (estado)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS mensajes (
    id               INT NOT NULL AUTO_INCREMENT,
    conversacion_id  INT NOT NULL,
    direccion        ENUM('entrante','saliente') NOT NULL,
    contenido        TEXT NOT NULL,
    sugerido_por_ia  TINYINT(1) NOT NULL DEFAULT 0,
    leido            TINYINT(1) NOT NULL DEFAULT 0,
    creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_msg_conv (conversacion_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS configuracion (
    clave          VARCHAR(100) NOT NULL,
    valor          TEXT NULL,
    tipo           ENUM('string','number','boolean','json') NOT NULL DEFAULT 'string',
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (clave)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS modulos_activos (
    modulo      VARCHAR(100) NOT NULL,
    habilitado  TINYINT(1) NOT NULL DEFAULT 0,
    config      JSON NULL,
    activado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (modulo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS ia_sugerencias (
    id         INT NOT NULL AUTO_INCREMENT,
    tipo       VARCHAR(100) NOT NULL,
    titulo     VARCHAR(300) NOT NULL,
    contenido  TEXT NOT NULL,
    accion     VARCHAR(100) NULL,
    estado     ENUM('pendiente','vista','aceptada','rechazada') NOT NULL DEFAULT 'pendiente',
    nivel      TINYINT NOT NULL DEFAULT 1,
    creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ia_estado (estado)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS notificaciones (
    id         INT NOT NULL AUTO_INCREMENT,
    cliente_id INT NULL,
    tipo       VARCHAR(50) NOT NULL,
    titulo     VARCHAR(300) NOT NULL,
    mensaje    TEXT NULL,
    canal      ENUM('whatsapp','email','sms','push') NOT NULL DEFAULT 'whatsapp',
    estado     ENUM('pendiente','enviada','fallida') NOT NULL DEFAULT 'pendiente',
    enviada_en TIMESTAMP NULL,
    creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_noti_cliente (cliente_id),
    INDEX idx_noti_estado (estado)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// ── Módulos que se habilitan según el plan inicial ────────────────
const MODULOS_POR_PLAN = {
  starter:    ["dashboard", "clientes", "whatsapp"],
  pro:        ["dashboard", "clientes", "whatsapp", "facturacion", "estadisticas", "notificaciones"],
  plan_ia:    ["dashboard", "clientes", "whatsapp", "facturacion", "estadisticas", "notificaciones", "ia_sugerencias"],
  enterprise: ["dashboard", "clientes", "whatsapp", "facturacion", "estadisticas", "notificaciones", "ia_sugerencias"],
};

// ── Función principal ─────────────────────────────────────────────
export async function provisionarTenant(tenantId, nombre, rubro, plan = "starter") {
  const dbName = generarDbName(tenantId, nombre);
  const conn   = await getRootConnection();

  try {
    // 1. Crear la base de datos
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.query(`USE \`${dbName}\``);

    // 2. Crear tablas base una por una
    const statements = SQL_BASE
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 10);

    for (const sql of statements) {
      await conn.query(sql);
    }

    // 3. Registrar la migración base como aplicada
    await conn.query(
      `INSERT IGNORE INTO tenant_migraciones (nombre) VALUES ('001_base')`
    );

    // 4. Activar módulos según el plan
    const modulos = MODULOS_POR_PLAN[plan] || MODULOS_POR_PLAN.starter;
    for (const modulo of modulos) {
      await conn.query(
        `INSERT IGNORE INTO modulos_activos (modulo, habilitado) VALUES (?, 1)`,
        [modulo]
      );
    }

    // 5. Insertar configuración inicial
    await conn.query(
      `INSERT IGNORE INTO configuracion (clave, valor, tipo) VALUES ('rubro', ?, 'string')`,
      [rubro]
    );
    await conn.query(
      `INSERT IGNORE INTO configuracion (clave, valor, tipo) VALUES ('plan', ?, 'string')`,
      [plan]
    );

    return { ok: true, dbName };

  } finally {
    await conn.end();
  }
}
