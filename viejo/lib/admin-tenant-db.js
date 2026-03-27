// lib/admin-tenant-db.js
// Helper para que las rutas admin accedan a la DB de cualquier tenant.

import db from "@/lib/db";
import { getTenantDb } from "@/lib/tenant-db";

/**
 * Obtiene la conexión a la DB del tenant y sus datos básicos.
 * Lanza error si el tenant no existe o no tiene DB asignada.
 */
export async function getTenantDbForAdmin(tenant_id) {
  if (!tenant_id) throw new Error("tenant_id requerido");
  const [rows] = await db.query(
    "SELECT id, nombre, rubro, plan, db_name FROM tenants WHERE id = ?",
    [tenant_id]
  );
  if (!rows.length) throw new Error("Tenant no encontrado");
  if (!rows[0].db_name) throw new Error("El tenant no tiene base de datos asignada. Activá los módulos primero.");
  return {
    tenant: rows[0],
    tdb: getTenantDb(rows[0].db_name),
  };
}

/**
 * Lista todos los tenants activos (para el selector en los views admin).
 */
export async function listarTenants() {
  const [rows] = await db.query(
    "SELECT id, nombre, rubro, plan, db_name FROM tenants WHERE activo = 1 ORDER BY nombre ASC"
  );
  return rows;
}
