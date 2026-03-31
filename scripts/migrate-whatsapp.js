/**
 * scripts/migrate-whatsapp.js
 * Migra datos de db_g360ia.whatsapp_instancias → db_modulos.mcp_api_whatsapp
 *
 * Uso: node scripts/migrate-whatsapp.js
 * Requiere las mismas variables de entorno que la app (.env.local o .env)
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const sourcePool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT || 3306),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,        // db_g360ia
});

const destPool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT || 3306),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_MODULOS_NAME, // db_modulos
});

async function run() {
  const [rows] = await sourcePool.query(
    "SELECT tenant_id, nombre, numero, instance_key, estado FROM whatsapp_instancias"
  );

  console.log(`Registros encontrados: ${rows.length}`);
  if (rows.length === 0) {
    console.log("Nada que migrar.");
    return;
  }

  let ok = 0;
  let skip = 0;

  for (const row of rows) {
    try {
      await destPool.query(
        `INSERT INTO mcp_api_whatsapp
           (tenant_id, nombre, numero, instance_key, estado, creado_en)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           tenant_id    = VALUES(tenant_id),
           nombre       = VALUES(nombre),
           numero       = VALUES(numero),
           estado       = VALUES(estado)`,
        [row.tenant_id, row.nombre || null, row.numero || null, row.instance_key, row.estado || "desconectado"]
      );
      console.log(`  ✓ ${row.instance_key} (tenant ${row.tenant_id})`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${row.instance_key}: ${err.message}`);
      skip++;
    }
  }

  console.log(`\nMigración completa: ${ok} insertados / actualizados, ${skip} errores.`);
}

run()
  .catch(err => { console.error("Error fatal:", err); process.exit(1); })
  .finally(() => { sourcePool.end(); destPool.end(); });
