// app/api/webhooks/whatsapp/route.js
// Recibe eventos de Evolution API
// Crea lead automáticamente si no existe + conversación vinculada

import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request) {
  try {
    const body  = await request.json();
    const event = body.event;

    // Solo mensajes entrantes
    if (event !== "messages.upsert") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const data    = body.data;
    const message = data?.message;
    const key     = data?.key;

    // Ignorar salientes
    if (key?.fromMe) {
      return NextResponse.json({ ok: true, skipped: "fromMe" });
    }

    if (!message) {
      return NextResponse.json({ ok: true, skipped: "no_message" });
    }

    const instanceName = body.instance;
    const remoteJid    = key?.remoteJid || "";
    const telefono     = remoteJid.replace("@s.whatsapp.net","").replace("@g.us","");
    const messageId    = key?.id || null;

    // Deduplicar por messageId
    if (messageId) {
      const [existing] = await db.query(
        `SELECT id FROM ventas_mensajes WHERE wsp_message_id = ? LIMIT 1`,
        [messageId]
      );
      if (existing.length) {
        return NextResponse.json({ ok: true, skipped: "duplicate" });
      }
    }

    // Extraer contenido
    let contenido = "";
    if (message?.conversation)                   contenido = message.conversation;
    else if (message?.extendedTextMessage?.text) contenido = message.extendedTextMessage.text;
    else if (message?.imageMessage?.caption)     contenido = `[Imagen] ${message.imageMessage.caption || ""}`;
    else if (message?.audioMessage)              contenido = "[Audio]";
    else if (message?.documentMessage)           contenido = `[Archivo] ${message.documentMessage.fileName || ""}`;
    else if (message?.videoMessage)              contenido = "[Video]";
    else if (message?.locationMessage)           contenido = "[Ubicación]";
    else contenido = "[Mensaje]";

    const pushName  = data?.pushName || "";
    const timestamp = data?.messageTimestamp
      ? new Date(data.messageTimestamp * 1000)
      : new Date();

    // ── 1. Buscar lead existente por teléfono ────────────────
    const [leadRows] = await db.query(
      `SELECT id, asignado_a FROM ventas_leads
       WHERE telefono = ? AND estado != 'cerrado'
       ORDER BY creado_en DESC LIMIT 1`,
      [telefono]
    );

    let leadId;

    if (leadRows.length) {
      leadId = leadRows[0].id;
    } else {
      // Crear nuevo lead con fuente whatsapp
      const [leadResult] = await db.query(
        `INSERT INTO ventas_leads
           (nombre, telefono, fuente, estado)
         VALUES (?, ?, 'whatsapp', 'nuevo')`,
        [pushName || telefono, telefono]
      );
      leadId = leadResult.insertId;
    }

    // ── 2. Buscar o crear conversación vinculada al lead ─────
    const [convRows] = await db.query(
      `SELECT id FROM ventas_conversaciones
       WHERE lead_id = ? AND canal = 'whatsapp' AND estado != 'cerrada'
       ORDER BY creado_en DESC LIMIT 1`,
      [leadId]
    );

    let conversacionId;

    if (convRows.length) {
      conversacionId = convRows[0].id;
      await db.query(
        `UPDATE ventas_conversaciones
         SET ultimo_mensaje = ?, ultimo_mensaje_at = ?, actualizado_en = NOW()
         WHERE id = ?`,
        [contenido.substring(0, 200), timestamp, conversacionId]
      );
    } else {
      const [convResult] = await db.query(
        `INSERT INTO ventas_conversaciones
           (lead_id, canal, contacto_nombre, contacto_telefono, estado, ultimo_mensaje, ultimo_mensaje_at)
         VALUES (?, 'whatsapp', ?, ?, 'nueva', ?, ?)`,
        [leadId, pushName || telefono, telefono, contenido.substring(0, 200), timestamp]
      );
      conversacionId = convResult.insertId;

      // Actualizar nombre en el lead si vino con pushName
      if (pushName && pushName !== telefono) {
        await db.query(
          `UPDATE ventas_leads SET nombre = ? WHERE id = ? AND nombre = ?`,
          [pushName, leadId, telefono]
        );
      }
    }

    // ── 3. Guardar mensaje ───────────────────────────────────
    await db.query(
      `INSERT INTO ventas_mensajes
         (conversacion_id, direccion, contenido, leido, creado_en, wsp_message_id)
       VALUES (?, 'entrante', ?, 0, ?, ?)`,
      [conversacionId, contenido, timestamp, messageId]
    );

    return NextResponse.json({ ok: true, lead_id: leadId, conversacion_id: conversacionId });

  } catch (err) {
    console.error("Webhook WhatsApp error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "G360iA WhatsApp Webhook" });
}
