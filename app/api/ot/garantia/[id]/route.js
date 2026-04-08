// app/api/ot/garantia/[id]/route.js
export const dynamic = "force-dynamic";

import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }     from "@/lib/auth";
import modulosDb           from "@/lib/modulos-db";

function unauth() {
  return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
}

// ── GET — detalle de una garantía ─────────────────────────────────────────────
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return unauth();
  const { tenant_id } = session.user;

  try {
    const [rows] = await modulosDb.query(
      `SELECT g.*, o.numero_ot, o.equipo_tipo, o.equipo_marca, o.equipo_modelo, o.token_publico
       FROM ot_garantia g
       JOIN ot_ordenes  o ON o.id = g.orden_id
       WHERE g.id = ? AND g.tenant_id = ?`,
      [params.id, tenant_id]
    );

    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "Garantía no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, garantia: rows[0] });
  } catch (err) {
    console.error("ot/garantia/[id] GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — anular garantía ───────────────────────────────────────────────────
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return unauth();
  const { tenant_id, id: usuario_id } = session.user;

  try {
    const { estado, motivo_anulacion } = await req.json();

    if (estado !== "anulada") {
      return NextResponse.json({ ok: false, error: "Solo se puede cambiar a 'anulada'" }, { status: 400 });
    }

    await modulosDb.query(
      `UPDATE ot_garantia
         SET estado = 'anulada',
             anulado_por      = ?,
             anulado_en       = NOW(),
             motivo_anulacion = ?
       WHERE id = ? AND tenant_id = ?`,
      [usuario_id, motivo_anulacion || null, params.id, tenant_id]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ot/garantia/[id] PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
