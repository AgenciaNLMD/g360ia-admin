import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "187.77.233.49",
  port: 3306,
  user: "admin",
  password: "user123",
  database: "g360ia",
});

export default pool;
