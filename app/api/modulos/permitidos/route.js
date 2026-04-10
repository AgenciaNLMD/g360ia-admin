import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// Metadata visual de cada módulo (icon + label para el sidebar)
const META = {
  crm:    { label: "CRM",        icon: "bi-people"   },
  mcp:    { label: "Conexiones", icon: "bi-grid-1x2" },
  matriz: { label: "Matriz",     icon: "bi-grid-3x3" },
};

// Módulos exclusivos del superadmin
const MODULOS_SUPERADMIN = ["crm", "mcp", "matriz"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([]);

  try {
    // Superadmin ve todos los módulos — intenta obtener grupo desde DB, fallback a lista fija
    if (session.user.rol === "superadmin") {
      try {
        const [mods] = await pool.query("SELECT nombre, grupo FROM modulos WHERE activo = 1 ORDER BY id");
        if (mods.length > 0) {
          return NextResponse.json(
            mods.map(m => ({
              slug:  m.nombre,
              label: META[m.nombre]?.label ?? m.nombre,
              icon:  META[m.nombre]?.icon  ?? "bi-box",
              grupo: m.grupo ?? null,
            }))
          );
        }
      } catch { /* columna grupo no existe aún o error — usar fallback */ }

      return NextResponse.json(
        MODULOS_SUPERADMIN.map(slug => ({
          slug,
          label: META[slug]?.label ?? slug,
          icon:  META[slug]?.icon  ?? "bi-box",
          grupo: null,
        }))
      );
    }

    // Resto de usuarios: módulos activos según su tenant
    if (!session.user.tenant_id) return NextResponse.json([]);

    const [rows] = await pool.query(`
      SELECT m.nombre
      FROM mtz_rubros_modulos rm
      JOIN mtz_rubros  r ON r.id = rm.rubro_id
      JOIN mtz_modulos m ON m.id = rm.modulo_id
      WHERE rm.rubro_id = ? AND m.activo = 1
      ORDER BY m.nombre
    `, [session.user.tenant_id]);

    // Obtener grupo de cada módulo (best-effort)
    const nombres = rows.map(r => r.nombre);
    const grupoMap = {};
    if (nombres.length > 0) {
      try {
        const placeholders = nombres.map(() => "?").join(",");
        const [grupoRows] = await pool.query(
          `SELECT nombre, grupo FROM mtz_modulos WHERE nombre IN (${placeholders})`,
          nombres
        );
        for (const r of grupoRows) grupoMap[r.nombre] = r.grupo;
      } catch { /* grupo queda null si hay error */ }
    }

    return NextResponse.json(
      rows.map(row => ({
        slug:  row.nombre,
        label: META[row.nombre]?.label ?? row.nombre,
        icon:  META[row.nombre]?.icon  ?? "bi-box",
        grupo: grupoMap[row.nombre] ?? null,
      }))
    );

  } catch (err) {
    console.error("[modulos/permitidos]", err);
    return NextResponse.json([]);
  }
}
