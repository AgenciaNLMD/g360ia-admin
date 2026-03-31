import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { tenant_id, nombre } = await request.json();
  const tenantId = (tenant_id === null || tenant_id === undefined || tenant_id === "null" || tenant_id === "")
    ? null
    : (Number(tenant_id) || null);

  const instanceKey = `t${tenantId ?? "admin"}_${Date.now().toString(36)}`;

  const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
  const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

  let qrBase64 = null;

  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_KEY,
      },
      body: JSON.stringify({ instanceName: instanceKey, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
    });
    const data = await res.json();
    if (data?.qrcode?.base64) qrBase64 = data.qrcode.base64;
  } catch {
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceKey}`, {
        headers: { "apikey": EVOLUTION_KEY },
      });
      const data = await res.json();
      if (data?.base64) qrBase64 = data.base64;
    } catch {}
  }

  await modDb.query(
    `INSERT INTO mcp_api_whatsapp (tenant_id, nombre, instance_key, estado)
     VALUES (?, ?, ?, 'conectando')
     ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), estado = 'conectando'`,
    [tenantId, nombre || "Principal", instanceKey]
  );

  const [rows] = await modDb.query(
    "SELECT id FROM mcp_api_whatsapp WHERE instance_key = ? LIMIT 1",
    [instanceKey]
  );
  const instanceId = rows[0]?.id || null;

  if (qrBase64 && instanceId) {
    await modDb.query(
      "UPDATE mcp_api_whatsapp SET wsp_qr = ? WHERE id = ?",
      [qrBase64, instanceId]
    );
  }

  return NextResponse.json({ ok: true, qr: qrBase64, instance_id: instanceId, instance_key: instanceKey });
}
