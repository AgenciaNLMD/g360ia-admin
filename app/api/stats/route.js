export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET() {
  try {
    const [[{ clientes }]] = await db.query(
      "SELECT COUNT(*) as clientes FROM tenants WHERE activo = 1"
    );

    // Alertas: tenants con trial vencido o sin actividad (por ahora trial vencido)
    const [[{ alertas }]] = await db.query(
      `SELECT COUNT(*) as alertas FROM tenants 
       WHERE activo = 1 AND trial_hasta IS NOT NULL AND trial_hasta < CURDATE()`
    );

    // Conversaciones: por ahora 0 hasta tener el módulo de WhatsApp
    const conversaciones = 0;

    return NextResponse.json({ ok: true, clientes, alertas, conversaciones });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
