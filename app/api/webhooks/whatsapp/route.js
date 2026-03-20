// app/api/webhooks/whatsapp/route.js
// Recibe eventos de Evolution API y los guarda en ventas_conversaciones + ventas_mensajes

import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const event = body.event;

    // Solo procesar mensajes entrantes
    if (event !== "messages.upsert") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const data     = body.data;
    const message  = data?.message;
    const key      = data?.key;

    // Ignorar mensajes propios (salientes)
    if (key?.fromMe) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const instanceName = body.instance;
    const remoteJid    = key?.remoteJid || "";
    const telefono     = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");

    // Extraer contenido del mensaje
    let contenido = "";
    if (message?.conversation)                    contenido = message.conversation;
    else if (message?.extendedTextMessage?.text)  contenido = message.extendedTextMessage.text;
    else if (message?.imageMessage?.caption)      contenido = `[Imagen] ${message.imageMessage.caption || ""}`;
    else if (message?.audioMessage)               contenido = "[Audio]";
    else if (message?.documentMessage)            contenido = `[Archivo] ${message.documentMessage.fileName || ""}`;
    else if (message?.videoMessage)               contenido = "[Video]";
    else if (message?.locationMessage)            contenido = "[Ubicación]";
    else contenido = "[Mensaje]";

    const pushName = data?.pushName || "";
    const timestamp = data?.messageTimestamp
      ? new Date(data.messageTimestamp * 1000)
      : new Date();

    // ── Buscar instancia en whatsapp_instancias ──────────────
    const [instRows] = await db.query(
      `SELECT id, tenant_id FROM whatsapp_instancias WHERE instance_key = ?`,
      [instanceName]
    );

    const tenantId = instRows.length ? instRows[0].tenant_id : null;

    // ── Buscar o crear conversación ──────────────────────────
    const [convRows] = await db.query(
      `SELECT id FROM ventas_conversaciones
       WHERE contacto_telefono = ? AND canal = 'whatsapp'
         AND estado != 'cerrada'
       ORDER BY creado_en DESC LIMIT 1`,
      [telefono]
    );

    let conversacionId;

    if (convRows.length) {
      conversacionId = convRows[0].id;

      // Actualizar último mensaje
      await db.query(
        `UPDATE ventas_conversaciones
         SET ultimo_mensaje = ?, ultimo_mensaje_at = ?, estado = 'nueva', actualizado_en = NOW()
         WHERE id = ?`,
        [contenido.substring(0, 200), timestamp, conversacionId]
      );
    } else {
      // Crear nueva conversación
      const [result] = await db.query(
        `INSERT INTO ventas_conversaciones
           (canal, contacto_nombre, contacto_telefono, estado, ultimo_mensaje, ultimo_mensaje_at)
         VALUES ('whatsapp', ?, ?, 'nueva', ?, ?)`,
        [
          pushName || telefono,
          telefono,
          contenido.substring(0, 200),
          timestamp,
        ]
      );
      conversacionId = result.insertId;
    }

    // ── Guardar mensaje ──────────────────────────────────────
    await db.query(
      `INSERT INTO ventas_mensajes
         (conversacion_id, direccion, contenido, leido, creado_en)
       VALUES (?, 'entrante', ?, 0, ?)`,
      [conversacionId, contenido, timestamp]
    );

    return NextResponse.json({ ok: true, conversacion_id: conversacionId });

  } catch (err) {
    console.error("Webhook WhatsApp error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// Evolution API hace GET para verificar el webhook
export async function GET() {
  return NextResponse.json({ ok: true, service: "G360iA WhatsApp Webhook" });
}
