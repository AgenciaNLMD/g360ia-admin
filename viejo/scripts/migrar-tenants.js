// scripts/migrar-tenants.js
// Aplica migraciones pendientes a todos los tenants activos.
// Uso: node scripts/migrar-tenants.js
// Uso con filtro de rubro: node scripts/migrar-tenants.js --rubro=hotel
// Uso con migración específica: node scripts/migrar-tenants.js --migracion=002_modulo_ots

const mysql = require("mysql2/promise");
const fs    = require("fs");
const path  = require("path");

// ── Leer argumentos ───────────────────────────────────────────────
const args = process.argv.slice(2);
const filtroRubro      = args.find(a => a.startsWith("--rubro="))?.split("=")[1] || null;
const filtroMigracion  = args.find(a => a.startsWith("--migracion="))?.split("=")[1] || null;

// ── Conexión al core ──────────────────────────────────────────────
async function getCorePool() {
  return mysql.createPool({
    host:     process.env.DB_HOST     || "187.77.233.49",
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER     || "admin",
    password: process.env.DB_PASSWORD || "user123",
    database: process.env.DB_NAME     || "g360ia",
  });
}

// ── Conexión a la DB de un tenant específico ──────────────────────
async function getTenantConnection(dbName) {
  return mysql.createConnection({
    host:     process.env.DB_HOST     || "187.77.233.49",
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER     || "admin",
    password: process.env.DB_PASSWORD || "user123",
    database: dbName,
    multipleStatements: false,
  });
}

// ── Runner principal ──────────────────────────────────────────────
async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  G360iA — Migrador de tenants");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const corePool = await getCorePool();

  // 1. Obtener todos los tenants activos con DB asignada
  let query  = "SELECT id, nombre, rubro, plan, db_name FROM tenants WHERE activo = 1 AND db_name IS NOT NULL";
  const params = [];

  if (filtroRubro) {
    query += " AND rubro LIKE ?";
    params.push(`%${filtroRubro}%`);
    console.log(`🔍 Filtrando por rubro: ${filtroRubro}`);
  }

  const [tenants] = await corePool.query(query, params);
  console.log(`📦 Tenants a procesar: ${tenants.length}\n`);

  if (tenants.length === 0) {
    console.log("Sin tenants para migrar.");
    await corePool.end();
    return;
  }

  // 2. Leer archivos de migración disponibles
  const migrationsDir = path.join(process.cwd(), "database", "tenant-migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.log("❌ No existe la carpeta database/tenant-migrations/");
    console.log("   Creala y agregá archivos .sql con el formato: 001_base.sql");
    await corePool.end();
    return;
  }

  let migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  if (filtroMigracion) {
    migrationFiles = migrationFiles.filter(f => f.startsWith(filtroMigracion));
    console.log(`🔍 Filtrando migración: ${filtroMigracion}`);
  }

  console.log(`📄 Migraciones disponibles: ${migrationFiles.join(", ")}\n`);

  // 3. Procesar cada tenant
  let exitosos = 0;
  let errores  = 0;

  for (const tenant of tenants) {
    console.log(`\n▶ ${tenant.nombre} (${tenant.db_name}) — rubro: ${tenant.rubro} — plan: ${tenant.plan}`);

    let conn;
    try {
      conn = await getTenantConnection(tenant.db_name);

      // Asegurarse que existe la tabla de migraciones
      await conn.query(`
        CREATE TABLE IF NOT EXISTS tenant_migraciones (
          id          INT NOT NULL AUTO_INCREMENT,
          nombre      VARCHAR(100) NOT NULL,
          aplicada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_migracion (nombre)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Obtener migraciones ya aplicadas en este tenant
      const [aplicadas] = await conn.query("SELECT nombre FROM tenant_migraciones");
      const nombresAplicados = new Set(aplicadas.map(r => r.nombre));

      let aplicadasEsteRun = 0;

      for (const archivo of migrationFiles) {
        const nombreMigracion = archivo.replace(".sql", "");

        // Saltar si ya está aplicada
        if (nombresAplicados.has(nombreMigracion)) {
          console.log(`  ⏭  ${nombreMigracion} — ya aplicada`);
          continue;
        }

        // Leer el SQL
        const sqlRaw = fs.readFileSync(path.join(migrationsDir, archivo), "utf8");

        // Verificar si aplica al rubro de este tenant (metadata en el archivo)
        const rubroMatch = sqlRaw.match(/^--\s*@rubro:\s*(.+)$/m);
        if (rubroMatch) {
          const rubrosPermitidos = rubroMatch[1].split(",").map(r => r.trim().toLowerCase());
          const rubroTenant = tenant.rubro.toLowerCase();
          const aplica = rubrosPermitidos.some(r => rubroTenant.includes(r));
          if (!aplica) {
            console.log(`  ⏭  ${nombreMigracion} — no aplica a rubro "${tenant.rubro}"`);
            continue;
          }
        }

        // Verificar si aplica al plan de este tenant
        const planMatch = sqlRaw.match(/^--\s*@plan:\s*(.+)$/m);
        if (planMatch) {
          const planesPermitidos = planMatch[1].split(",").map(p => p.trim().toLowerCase());
          if (!planesPermitidos.includes(tenant.plan.toLowerCase())) {
            console.log(`  ⏭  ${nombreMigracion} — no aplica a plan "${tenant.plan}"`);
            continue;
          }
        }

        // Ejecutar el SQL statement por statement
        try {
          const statements = sqlRaw
            .split(";")
            .map(s => s.trim())
            .filter(s => s.length > 10 && !s.startsWith("--"));

          for (const stmt of statements) {
            await conn.query(stmt);
          }

          // Registrar como aplicada
          await conn.query(
            "INSERT IGNORE INTO tenant_migraciones (nombre) VALUES (?)",
            [nombreMigracion]
          );

          console.log(`  ✅ ${nombreMigracion} — aplicada`);
          aplicadasEsteRun++;

        } catch (sqlError) {
          console.log(`  ❌ ${nombreMigracion} — error: ${sqlError.message}`);
        }
      }

      if (aplicadasEsteRun === 0) {
        console.log(`  ℹ️  Sin migraciones nuevas para aplicar`);
      }

      exitosos++;

    } catch (err) {
      console.log(`  ❌ Error conectando a ${tenant.db_name}: ${err.message}`);
      errores++;
    } finally {
      if (conn) await conn.end();
    }
  }

  // 4. Resumen final
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  ✅ Exitosos: ${exitosos}`);
  console.log(`  ❌ Errores:  ${errores}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await corePool.end();
}

main().catch(err => {
  console.error("Error fatal:", err);
  process.exit(1);
});
