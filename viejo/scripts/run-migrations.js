const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    multipleStatements: true,
  });

  const connection = await pool.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        ejecutada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = path.join(process.cwd(), 'database', 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('No existe la carpeta database/migrations. Nada para ejecutar.');
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const [rows] = await connection.query(
        'SELECT id FROM migrations WHERE nombre = ? LIMIT 1',
        [file]
      );

      if (rows.length > 0) {
        console.log(`Saltando ${file} (ya ejecutada)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      if (!sql.trim()) {
        console.log(`Saltando ${file} (vacía)`);
        continue;
      }

      console.log(`Ejecutando ${file}...`);
      await connection.query(sql);
      await connection.query('INSERT INTO migrations (nombre) VALUES (?)', [file]);
      console.log(`OK ${file}`);
    }

    console.log('Migraciones finalizadas correctamente.');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Error ejecutando migraciones:', error);
  process.exit(1);
});
