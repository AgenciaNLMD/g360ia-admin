import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { instance_key } = await request.json();
  if (!instance_key) return NextResponse.json({ ok: false, error: "instance_key requerido" }, { status: 400 });

  const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
  const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
  const NEXTAUTH_URL  = process.env.NEXTAUTH_URL;

  const webhookUrl = `${NEXTAUTH_URL}/api/webhooks/whatsapp`;

  const res = await fetch(`${EVOLUTION_URL}/webhook/set/${instance_key}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": EVOLUTION_KEY,
    },
    body: JSON.stringify({
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "CONNECTION_UPDATE",
        "QRCODE_UPDATED",
      ],
    }),
  });

  const data = await res.json();
  return NextResponse.json({ ok: res.ok, data });
}
