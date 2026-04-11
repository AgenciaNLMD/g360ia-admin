// app/api/ot/ordenes/[id]/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb       from "@/lib/modulos-db";

// ── GET — detalle completo: OT + log + items + garantía ──────────────────────
export async function GET(req, { params }) {
  try {
    const [ordenes] = await modulosDb.query(
      "SELECT * FROM ot_ordenes WHERE id = ?",
      [params.id]
    );
    if (!ordenes.length) {
      return NextResponse.json({ ok: false, error: "Orden no encontrada" }, { status: 404 });
    }

    const orden = ordenes[0];

    const [log] = await modulosDb.query(
      "SELECT * FROM ot_log WHERE orden_id = ? ORDER BY creado_en ASC",
      [params.id]
    );

    const [items] = await modulosDb.query(
      "SELECT * FROM ot_presupuesto_items WHERE orden_id = ? ORDER BY id ASC",
      [params.id]
    );

    const [garantia] = await modulosDb.query(
      "SELECT * FROM ot_garantia WHERE orden_id = ? LIMIT 1",
      [params.id]
    );

    // Auto-vencer garantía si ya pasó la fecha
    if (garantia[0]?.estado === "vigente" && new Date(garantia[0].fecha_vence) < new Date()) {
      await modulosDb.query(
        "UPDATE ot_garantia SET estado = 'vencida' WHERE id = ?",
        [garantia[0].id]
      );
      garantia[0].estado = "vencida";
    }

    return NextResponse.json({
      ok: true,
      orden: { ...orden, log, items, garantia: garantia[0] || null },
    });
  } catch (err) {
    console.error("ot/ordenes/[id] GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualizar campos editables de la OT ─────────────────────────────
export async function PATCH(req, { params }) {
  try {
    const body = await req.json();

    const PERMITIDOS = [
      "tecnico_id", "diagnostico", "presupuesto_total",
      "aprobacion_medio", "aprobacion_fecha", "entrega_fecha", "foto_url",
    ];

    const campos  = [];
    const valores = [];

    for (const k of PERMITIDOS) {
      if (body[k] !== undefined) {
        campos.push(`${k} = ?`);
        valores.push(body[k]);
      }
    }

    if (!campos.length) {
      return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });
    }

    valores.push(params.id);
    await modulosDb.query(
      `UPDATE ot_ordenes SET ${campos.join(", ")}, actualizado_en = NOW() WHERE id = ?`,
      valores
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ot/ordenes/[id] PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
