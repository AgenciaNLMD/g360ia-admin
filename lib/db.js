import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: "mysql://admin:user123@g360ia_mysql:3306/g360ia",
});

export default pool;
