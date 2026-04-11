// app/api/ot/publica/[token]/route.js
// Ruta pública — sin autenticación. Devuelve datos del ADT según estado de la OT.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb        from "@/lib/modulos-db";

export async function GET(req, { params }) {
  try {
    const [ordenes] = await modulosDb.query(
      "SELECT * FROM ot_ordenes WHERE token_publico = ?",
      [params.token]
    );

    if (!ordenes.length) {
      return NextResponse.json({ ok: false, error: "OT no encontrada" }, { status: 404 });
    }

    const orden = ordenes[0];

    // Garantía
    const [garantia] = await modulosDb.query(
      "SELECT * FROM ot_garantia WHERE orden_id = ? LIMIT 1",
      [orden.id]
    );

    // Auto-vencer si pasó la fecha
    if (garantia[0]?.estado === "vigente" && new Date(garantia[0].fecha_vence) < new Date()) {
      await modulosDb.query(
        "UPDATE ot_garantia SET estado = 'vencida' WHERE id = ?",
        [garantia[0].id]
      );
      garantia[0].estado = "vencida";
    }

    // Solo campos públicos — sin datos internos del tenant
    return NextResponse.json({
      ok: true,
      ot: {
        numero_ot:          orden.numero_ot,
        equipo_tipo:        orden.equipo_tipo,
        equipo_marca:       orden.equipo_marca,
        equipo_modelo:      orden.equipo_modelo,
        equipo_serie:       orden.equipo_serie,
        problema_reportado: orden.problema_reportado,
        diagnostico:        orden.diagnostico,
        estado:             orden.estado,
        creado_en:          orden.creado_en,
        entrega_fecha:      orden.entrega_fecha,
        token_publico:      orden.token_publico,
      },
      garantia: garantia[0]
        ? {
            estado:           garantia[0].estado,
            dias_garantia:    garantia[0].dias_garantia,
            fecha_emision:    garantia[0].fecha_emision,
            fecha_vence:      garantia[0].fecha_vence,
            motivo_anulacion: garantia[0].motivo_anulacion,
          }
        : null,
    });
  } catch (err) {
    console.error("ot/publica/[token] GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
