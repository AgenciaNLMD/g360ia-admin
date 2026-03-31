// lib/modulos-db.js — Pool de conexión a db_modulos
// Tablas compartidas entre tenants (todas filtran por tenant_id)
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT || 3306),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_MODULOS_NAME,
});

export default pool;
