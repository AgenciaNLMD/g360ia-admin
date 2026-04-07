import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb    from "@/lib/modulos-db";
import rubrosDb from "@/lib/rubros-db";

// Metadata visual de cada módulo (icon + label para el sidebar)
const META = {
  crm:          { label: "CRM",          icon: "bi-people"   },
  mcp:          { label: "Conexiones",   icon: "bi-grid-1x2" },
  "adm-rubros": { label: "Adm. Rubros",  icon: "bi-building" },
};

// Módulos exclusivos del superadmin
const MODULOS_SUPERADMIN = ["crm", "mcp", "adm-rubros"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([]);

  try {
    // Superadmin ve todos los módulos — intenta obtener grupo desde DB, fallback a lista fija
    if (session.user.rol === "superadmin") {
      let grupoMap = {};
      try {
        const [mods] = await rubrosDb.query("SELECT slug, grupo FROM modulos ORDER BY id");
        // Si la query devuelve filas, armamos el mapa de grupos
        if (mods.length > 0) {
          return NextResponse.json(
            mods.map(m => ({
              slug:  m.slug,
              label: META[m.slug]?.label ?? m.slug,
              icon:  META[m.slug]?.icon  ?? "bi-box",
              grupo: m.grupo ?? null,
            }))
          );
        }
      } catch { /* columna grupo no existe aún o error de conexión — usar fallback */ }

      return NextResponse.json(
        MODULOS_SUPERADMIN.map(slug => ({
          slug,
          label: META[slug]?.label ?? slug,
          icon:  META[slug]?.icon  ?? "bi-box",
          grupo: grupoMap[slug] ?? null,
        }))
      );
    }

    // Resto de usuarios: módulos activos en adm_rubros_* según su tenant
    if (!session.user.tenant_id) return NextResponse.json([]);

    const [rows] = await modDb.query(`
      SELECT m.slug
      FROM adm_rubros_rubros_modulos rm
      JOIN adm_rubros_rubros  r ON r.id = rm.rubro_id
      JOIN adm_rubros_modulos m ON m.id = rm.modulo_id
      WHERE rm.rubro_id = ? AND m.activo = 1
      ORDER BY m.slug
    `, [session.user.tenant_id]);

    // Obtener grupo de cada módulo desde rubros_molde (best-effort)
    const slugs = rows.map(r => r.slug);
    const grupoMap = {};
    if (slugs.length > 0) {
      try {
        const placeholders = slugs.map(() => "?").join(",");
        const [grupoRows] = await rubrosDb.query(
          `SELECT slug, grupo FROM modulos WHERE slug IN (${placeholders})`,
          slugs
        );
        for (const r of grupoRows) grupoMap[r.slug] = r.grupo;
      } catch { /* grupo queda null si la columna no existe aún */ }
    }

    return NextResponse.json(
      rows.map(row => ({
        slug:  row.slug,
        label: META[row.slug]?.label ?? row.slug,
        icon:  META[row.slug]?.icon  ?? "bi-box",
        grupo: grupoMap[row.slug] ?? null,
      }))
    );

  } catch (err) {
    console.error("[modulos/permitidos]", err);
    return NextResponse.json([]);
  }
}
