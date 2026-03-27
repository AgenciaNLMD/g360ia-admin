export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET() {
  try {
    const [logs] = await db.query(
      `SELECT 
        sl.id, sl.ip, sl.dispositivo, sl.ubicacion, sl.creado_en,
        u.nombre, u.email
       FROM sesiones_log sl
       LEFT JOIN usuarios u ON u.id = sl.usuario_id
       ORDER BY sl.creado_en DESC
       LIMIT 200`
    );
    return NextResponse.json({ ok: true, logs });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
