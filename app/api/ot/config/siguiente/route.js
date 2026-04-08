// app/api/ot/config/siguiente/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb       from "@/lib/modulos-db";

// ── GET — devuelve el siguiente número correlativo (sin reservarlo) ──────────
export async function GET() {
  try {
    const [rows] = await modulosDb.query(
      "SELECT prefijo, ultimo_numero FROM ot_config LIMIT 1"
    );

    const prefijo   = rows[0]?.prefijo        ?? "OT-";
    const siguiente = (rows[0]?.ultimo_numero ?? 0) + 1;
    const numero    = `${prefijo}${String(siguiente).padStart(4, "0")}`;

    return NextResponse.json({ ok: true, numero });
  } catch (err) {
    console.error("ot/config/siguiente GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
