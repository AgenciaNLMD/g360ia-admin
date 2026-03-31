// app/api/crm/mensajes/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modulosDb from "@/lib/modulos-db";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
}

// ── GET — mensajes de una conversación ──────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { tenant_id } = session.user;
  const { searchParams } = new URL(req.url);
  const conversacion_id = searchParams.get("conversacion_id");

  if (!conversacion_id) return NextResponse.json({ ok: false, error: "Falta conversacion_id" }, { status: 400 });

  try {
    // Verificar que la conversación pertenece al tenant
    const [[conv]] = await modulosDb.query(
      "SELECT id FROM crm_conversaciones WHERE id = ? AND tenant_id = ?",
      [conversacion_id, tenant_id]
    );
    if (!conv) return NextResponse.json({ ok: false, error: "Conversación no encontrada" }, { status: 404 });

    const [rows] = await modulosDb.query(
      `SELECT cm.*, u.nombre AS enviado_por_nombre
       FROM crm_mensajes cm
       LEFT JOIN db_g360ia.usuarios u ON u.id = cm.enviado_por
       WHERE cm.conversacion_id = ?
       ORDER BY cm.creado_en ASC`,
      [conversacion_id]
    );

    // Marcar entrantes como leídos
    await modulosDb.query(
      `UPDATE crm_mensajes SET leido = 1
       WHERE conversacion_id = ? AND direccion = 'entrante' AND leido = 0`,
      [conversacion_id]
    );

    return NextResponse.json({ ok: true, mensajes: rows });
  } catch (err) {
    console.error("crm/mensajes GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — enviar mensaje ────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { tenant_id, id: usuario_id } = session.user;

  try {
    const { conversacion_id, direccion, tipo, contenido, sugerido_por_ia } = await req.json();

    if (!conversacion_id || !contenido) {
      return NextResponse.json({ ok: false, error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Verificar pertenencia al tenant
    const [[conv]] = await modulosDb.query(
      "SELECT id FROM crm_conversaciones WHERE id = ? AND tenant_id = ?",
      [conversacion_id, tenant_id]
    );
    if (!conv) return NextResponse.json({ ok: false, error: "Conversación no encontrada" }, { status: 404 });

    const enviado_por = direccion === "saliente" ? usuario_id : null;

    const [result] = await modulosDb.query(
      `INSERT INTO crm_mensajes
        (conversacion_id, direccion, tipo, contenido, enviado_por, sugerido_por_ia, leido)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [
        conversacion_id,
        direccion       || "saliente",
        tipo            || "texto",
        contenido,
        enviado_por,
        sugerido_por_ia || null,
      ]
    );

    // Actualizar cache de último mensaje en la conversación
    await modulosDb.query(
      `UPDATE crm_conversaciones
       SET ultimo_mensaje = ?, ultimo_mensaje_at = NOW(), estado = 'abierta'
       WHERE id = ?`,
      [contenido.substring(0, 200), conversacion_id]
    );

    // Envío por WhatsApp si corresponde (saliente + canal whatsapp)
    if (direccion === "saliente") {
      try {
        const [[convFull]] = await modulosDb.query(
          `SELECT cc.canal, cl.whatsapp, cl.telefono
           FROM crm_conversaciones cc
           LEFT JOIN crm_leads cl ON cl.id = cc.lead_id
           WHERE cc.id = ?`,
          [conversacion_id]
        );
        if (convFull?.canal === "whatsapp" && (convFull.whatsapp || convFull.telefono)) {
          const numero = (convFull.whatsapp || convFull.telefono).replace(/\D/g, "");
          if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) {
            const [[instancia]] = await modulosDb.query(
              `SELECT instance_key FROM mcp_api_whatsapp
               WHERE tenant_id <=> ? AND estado = 'conectado' LIMIT 1`,
              [tenant_id]
            );
            if (instancia?.instance_key) {
              await fetch(
                `${process.env.EVOLUTION_API_URL}/message/sendText/${instancia.instance_key}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    apikey: process.env.EVOLUTION_API_KEY,
                  },
                  body: JSON.stringify({
                    number: `${numero}@s.whatsapp.net`,
                    text: contenido,
                  }),
                }
              );
            }
          }
        }
      } catch (wspErr) {
        console.warn("WhatsApp send warning:", wspErr.message);
      }
    }

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("crm/mensajes POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
