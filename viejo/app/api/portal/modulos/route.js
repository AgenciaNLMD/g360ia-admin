// app/api/portal/modulos/route.js
// Devuelve los módulos habilitados del tenant
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";

export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session?.user?.tenantDbName) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const db = getTenantDb(session.user.tenantDbName);
    const [rows] = await db.query(
      `SELECT modulo FROM modulos_activos WHERE habilitado = 1 ORDER BY activado_en ASC`
    );
    const modulos = rows.map(r => r.modulo);
    return NextResponse.json({ ok: true, modulos });
  } catch (error) {
    // Si la tabla no existe todavía, devuelve solo dashboard
    return NextResponse.json({ ok: true, modulos: ["dashboard"] });
  }
}
