// app/api/ot/garantias/route.js
export const dynamic = "force-dynamic";

import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }     from "@/lib/auth";
import modulosDb           from "@/lib/modulos-db";

// ── GET — lista todas las garantías del tenant ───────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  const { tenant_id } = session.user;

  try {
    // Auto-vencer garantías cuya fecha ya pasó
    await modulosDb.query(
      `UPDATE ot_garantia g
         JOIN ot_ordenes o ON o.id = g.orden_id
         SET g.estado = 'vencida'
       WHERE g.tenant_id = ? AND g.estado = 'vigente' AND g.fecha_vence < NOW()`,
      [tenant_id]
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
       WHERE g.tenant_id = ?
       ORDER BY g.creado_en DESC`,
      [tenant_id]
    );

    return NextResponse.json({ ok: true, garantias: rows });
  } catch (err) {
    console.error("ot/garantias GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
