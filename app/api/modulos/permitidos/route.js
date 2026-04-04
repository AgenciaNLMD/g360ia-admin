import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import modDb from "@/lib/modulos-db";

// Metadata visual de cada módulo (icon + label para el sidebar)
const META = {
  crm:          { label: "CRM",          icon: "bi-people"    },
  mcp:          { label: "Conexiones",   icon: "bi-grid-1x2"  },
  "adm-rubros": { label: "Adm. Rubros",  icon: "bi-building"  },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenant_id) return NextResponse.json([]);

  try {
    // Obtener rubro y plan del tenant
    const [tenants] = await db.query(
      "SELECT rubro, plan FROM tenants WHERE id = ?",
      [session.user.tenant_id]
    );
    if (!tenants.length) return NextResponse.json([]);

    const { rubro, plan } = tenants[0];

    // Obtener módulos permitidos para ese rubro y plan
    const [rows] = await modDb.query(`
      SELECT m.slug
      FROM adm_rubros_rubros_modulos rm
      JOIN adm_rubros_rubros  r ON r.id = rm.rubro_id
      JOIN adm_rubros_modulos m ON m.id = rm.modulo_id
      WHERE r.slug = ? AND rm.plan_minimo <= ? AND m.activo = 1
      ORDER BY m.slug
    `, [rubro, plan ?? 99]);

    const items = rows.map(row => ({
      slug: row.slug,
      label: META[row.slug]?.label ?? row.slug,
      icon:  META[row.slug]?.icon  ?? "bi-box",
    }));

    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}
