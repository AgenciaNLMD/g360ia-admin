// app/api/ot/bot/[token]/route.js
// Endpoint preparado para bot de WhatsApp. Sin autenticación.
// Devuelve datos estructurados listos para formatear en un mensaje.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb        from "@/lib/modulos-db";

const ESTADO_LABEL = {
  recibido:       "Tu equipo fue recibido y está en espera de diagnóstico.",
  en_diagnostico: "Tu equipo está siendo revisado por nuestros técnicos.",
  presupuestado:  "El diagnóstico está listo. Te contactaremos con el presupuesto.",
  aprobado:       "El presupuesto fue aprobado. Pronto comenzamos la reparación.",
  en_reparacion:  "Tu equipo está siendo reparado.",
  listo:          "¡Tu equipo está listo! Podés pasar a retirarlo.",
  entregado:      "El equipo fue entregado.",
};

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

    const [garantia] = await modulosDb.query(
      "SELECT estado, fecha_vence, dias_garantia FROM ot_garantia WHERE orden_id = ? LIMIT 1",
      [orden.id]
    );

    // Auto-vencer
    if (garantia[0]?.estado === "vigente" && new Date(garantia[0].fecha_vence) < new Date()) {
      await modulosDb.query(
        "UPDATE ot_garantia SET estado = 'vencida' WHERE orden_id = ?",
        [orden.id]
      );
      if (garantia[0]) garantia[0].estado = "vencida";
    }

    return NextResponse.json({
      ok:            true,
      numero_ot:     orden.numero_ot,
      estado:        orden.estado,
      estado_label:  ESTADO_LABEL[orden.estado] || orden.estado,
      equipo:        [orden.equipo_marca, orden.equipo_modelo].filter(Boolean).join(" ") || orden.equipo_tipo,
      garantia_estado: garantia[0]?.estado     || null,
      garantia_vence:  garantia[0]?.fecha_vence || null,
    });
  } catch (err) {
    console.error("ot/bot/[token] GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
