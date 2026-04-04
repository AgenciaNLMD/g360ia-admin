// lib/rubros-db.js — Pool de conexión a db_rubros_molde
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT || 3306),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_RUBROS_NAME,
});

export default pool;
