// app/api/ot/ordenes/[id]/estado/route.js
export const dynamic = "force-dynamic";

import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }     from "@/lib/auth";
import modulosDb           from "@/lib/modulos-db";

const ESTADOS_VALIDOS = [
  "recibido", "en_diagnostico", "presupuestado",
  "aprobado", "en_reparacion", "listo", "entregado",
];

// ── PATCH — cambia estado, registra log, crea garantía si corresponde ────────
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  const { tenant_id, id: usuario_id } = session.user;

  try {
    const { estado, nota, dias_garantia } = await req.json();

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
    }

    // Obtener estado actual
    const [rows] = await modulosDb.query(
      "SELECT id, estado FROM ot_ordenes WHERE id = ? AND tenant_id = ?",
      [params.id, tenant_id]
    );
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "Orden no encontrada" }, { status: 404 });
    }

    const estado_anterior = rows[0].estado;

    // Actualizar estado
    await modulosDb.query(
      "UPDATE ot_ordenes SET estado = ?, actualizado_en = NOW() WHERE id = ? AND tenant_id = ?",
      [estado, params.id, tenant_id]
    );

    // Registrar en log
    await modulosDb.query(
      `INSERT INTO ot_log (tenant_id, orden_id, estado_anterior, estado_actual, usuario_id, nota)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenant_id, params.id, estado_anterior, estado, usuario_id, nota || null]
    );

    // Si se marca como entregado → registrar fecha y gestionar garantía
    if (estado === "entregado") {
      await modulosDb.query(
        "UPDATE ot_ordenes SET entrega_fecha = NOW() WHERE id = ? AND tenant_id = ?",
        [params.id, tenant_id]
      );

      const diasNum = parseInt(dias_garantia) || 0;

      if (diasNum > 0) {
        const [existGar] = await modulosDb.query(
          "SELECT id FROM ot_garantia WHERE orden_id = ?",
          [params.id]
        );

        if (existGar.length) {
          await modulosDb.query(
            `UPDATE ot_garantia
               SET dias_garantia = ?, fecha_emision = NOW(),
                   fecha_vence = DATE_ADD(NOW(), INTERVAL ? DAY),
                   estado = 'vigente',
                   anulado_por = NULL, anulado_en = NULL, motivo_anulacion = NULL
             WHERE orden_id = ?`,
            [diasNum, diasNum, params.id]
          );
        } else {
          await modulosDb.query(
            `INSERT INTO ot_garantia
               (tenant_id, orden_id, dias_garantia, fecha_emision, fecha_vence, estado)
             VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), 'vigente')`,
            [tenant_id, params.id, diasNum, diasNum]
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ot/ordenes/[id]/estado PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
