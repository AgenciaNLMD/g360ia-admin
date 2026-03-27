// app/api/integraciones/whatsapp/webhook/route.js
// Registra el webhook en Evolution API para una instancia específica

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { instance_key } = await request.json();

    if (!instance_key) {
      return NextResponse.json({ ok: false, error: "Falta instance_key" }, { status: 400 });
    }

    const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
    const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
    const WEBHOOK_URL   = `${process.env.NEXTAUTH_URL}/api/webhooks/whatsapp`;

    const res = await fetch(`${EVOLUTION_URL}/webhook/set/${instance_key}`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey":        EVOLUTION_KEY,
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url:     WEBHOOK_URL,
          byEvents: false,
          base64:   false,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "CONNECTION_UPDATE",
            "QRCODE_UPDATED",
          ],
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Error configurando webhook:", data);
      return NextResponse.json({ ok: false, error: "Error al configurar webhook en Evolution" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });

  } catch (err) {
    console.error("Webhook setup error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
