import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

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
    // Superadmin ve todos los módulos directamente
    if (session.user.rol === "superadmin") {
      return NextResponse.json(
        MODULOS_SUPERADMIN.map(slug => ({
          slug,
          label: META[slug]?.label ?? slug,
          icon:  META[slug]?.icon  ?? "bi-box",
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

    return NextResponse.json(
      rows.map(row => ({
        slug:  row.slug,
        label: META[row.slug]?.label ?? row.slug,
        icon:  META[row.slug]?.icon  ?? "bi-box",
      }))
    );

  } catch (err) {
    console.error("[modulos/permitidos]", err);
    return NextResponse.json([]);
  }
}
