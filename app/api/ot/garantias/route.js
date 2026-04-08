// app/api/ot/garantias/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb       from "@/lib/modulos-db";

// ── GET — lista todas las garantías ─────────────────────────────────────────
export async function GET() {
  try {
    // Auto-vencer garantías cuya fecha ya pasó
    await modulosDb.query(
      `UPDATE ot_garantia SET estado = 'vencida'
       WHERE estado = 'vigente' AND fecha_vence < NOW()`
    );

    const [rows] = await modulosDb.query(
      `SELECT
         g.*,
         o.numero_ot,
         o.equipo_tipo,
         o.equipo_marca,
         o.equipo_modelo,
         o.token_publico
       FROM ot_garantia g
       JOIN ot_ordenes  o ON o.id = g.orden_id
       ORDER BY g.creado_en DESC`
    );

    return NextResponse.json({ ok: true, garantias: rows });
  } catch (err) {
    console.error("ot/garantias GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
