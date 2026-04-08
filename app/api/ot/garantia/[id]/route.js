// app/api/ot/garantia/[id]/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb       from "@/lib/modulos-db";

// ── GET — detalle de una garantía ─────────────────────────────────────────────
export async function GET(req, { params }) {
  try {
    const [rows] = await modulosDb.query(
      `SELECT g.*, o.numero_ot, o.equipo_tipo, o.equipo_marca, o.equipo_modelo, o.token_publico
       FROM ot_garantia g
       JOIN ot_ordenes  o ON o.id = g.orden_id
       WHERE g.id = ?`,
      [params.id]
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
  try {
    const { estado, motivo_anulacion } = await req.json();

    if (estado !== "anulada") {
      return NextResponse.json({ ok: false, error: "Solo se puede cambiar a 'anulada'" }, { status: 400 });
    }

    await modulosDb.query(
      `UPDATE ot_garantia
         SET estado = 'anulada',
             anulado_en       = NOW(),
             motivo_anulacion = ?
       WHERE id = ?`,
      [motivo_anulacion || null, params.id]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ot/garantia/[id] PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
