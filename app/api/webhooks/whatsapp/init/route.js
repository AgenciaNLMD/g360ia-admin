// app/api/integraciones/whatsapp/init/route.js
// Crea instancia en Evolution API, guarda en DB y configura webhook automáticamente

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body     = await request.json();
    const tenantId = body.tenant_id || null;
    const nombre   = body.nombre || "Principal";

    const suffix       = Date.now().toString(36);
    const tenantPrefix = tenantId ? `t${tenantId}` : "admin";
    const instanceKey  = `${tenantPrefix}_${suffix}`;

    const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
    const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
    const WEBHOOK_URL   = `${process.env.NEXTAUTH_URL}/api/webhooks/whatsapp`;

    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
      return NextResponse.json({ ok: false, error: "Evolution API no configurada" }, { status: 500 });
    }

    // ── 1. Crear instancia en Evolution ─────────────────────
    const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "apikey": EVOLUTION_KEY },
      body: JSON.stringify({
        instanceName: instanceKey,
        qrcode:       true,
        integration:  "WHATSAPP-BAILEYS",
      }),
    });

    const createData = await createRes.json();
    let qrBase64     = createData.qrcode?.base64 || null;

    // Si ya existe, reconectar
    if (!createRes.ok) {
      const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceKey}`, {
        headers: { "apikey": EVOLUTION_KEY },
      });
      const connectData = await connectRes.json();
      qrBase64 = connectData.base64 || null;
    }

    // ── 2. Configurar webhook automáticamente ────────────────
    try {
      await fetch(`${EVOLUTION_URL}/webhook/set/${instanceKey}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "apikey": EVOLUTION_KEY },
        body: JSON.stringify({
          webhook: {
            enabled:  true,
            url:      WEBHOOK_URL,
            byEvents: false,
            base64:   false,
            events:   ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
          },
        }),
      });
    } catch (webhookErr) {
      console.warn("Webhook setup warning:", webhookErr.message);
      // No bloqueamos si falla el webhook, la instancia igual se crea
    }

    // ── 3. Guardar en whatsapp_instancias ────────────────────
    const [result] = await db.query(
      `INSERT INTO whatsapp_instancias (tenant_id, nombre, instance_key, estado, wsp_qr)
       VALUES (?, ?, ?, 'conectando', ?)
       ON DUPLICATE KEY UPDATE
         estado = 'conectando', nombre = VALUES(nombre), wsp_qr = VALUES(wsp_qr)`,
      [tenantId, nombre, instanceKey, qrBase64]
    );

    const instanceId = result.insertId || null;

    return NextResponse.json({
      ok:           true,
      qr:           qrBase64,
      instance_id:  instanceId,
      instance_key: instanceKey,
      status:       "connecting",
    });

  } catch (err) {
    console.error("WhatsApp init:", err);
    return NextResponse.json({ ok: false, error: "Error al inicializar WhatsApp" }, { status: 500 });
  }
}
