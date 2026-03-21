// lib/tenant-db.js
// Retorna una conexión a la base de datos del tenant específico.
// Se usa en todos los endpoints del portal (/api/portal/...)

import mysql from "mysql2/promise";

// Cache de pools por dbName para no crear conexiones nuevas en cada request
const pools = {};

export function getTenantDb(dbName) {
  if (!dbName) throw new Error("dbName es requerido");

  if (!pools[dbName]) {
    pools[dbName] = mysql.createPool({
      host:             process.env.DB_HOST,
      port:             Number(process.env.DB_PORT || 3306),
      user:             process.env.DB_USER,
      password:         process.env.DB_PASSWORD,
      database:         dbName,
      waitForConnections: true,
      connectionLimit:  5,
    });
  }

  return pools[dbName];
}

// Helper para obtener el dbName desde la sesión del portal
export function getDbNameFromSession(session) {
  const dbName = session?.user?.tenantDbName;
  if (!dbName) throw new Error("Sin base de datos asignada al tenant");
  return dbName;
}
