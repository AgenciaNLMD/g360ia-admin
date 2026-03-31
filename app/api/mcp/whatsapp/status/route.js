import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get("instance_id");
  if (!instanceId) return NextResponse.json({ ok: false, error: "instance_id requerido" }, { status: 400 });

  const [rows] = await modDb.query(
    "SELECT * FROM mcp_api_whatsapp WHERE id = ? LIMIT 1",
    [instanceId]
  );
  if (!rows.length) return NextResponse.json({ ok: false, error: "Instancia no encontrada" }, { status: 404 });

  const instancia = rows[0];
  const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
  const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

  let wspStatus = null;
  let conectado = false;
  let numero = null;
  let qrFromResponse = null;

  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instancia.instance_key}`, {
      headers: { "apikey": EVOLUTION_KEY },
    });
    const data = await res.json();

    wspStatus = data?.instance?.state || data?.state || null;
    if (data?.instance?.jid) numero = data.instance.jid.replace(/@.*/, "");
    if (data?.qrcode?.base64) qrFromResponse = data.qrcode.base64;
    conectado = wspStatus === "open";
  } catch {}

  const updates = [];
  const params = [];

  if (wspStatus !== null) { updates.push("wsp_status = ?"); params.push(wspStatus); }
  if (wspStatus === "open") { updates.push("estado = 'conectado'"); }
  else if (wspStatus === "close") { updates.push("estado = 'desconectado'"); }
  else if (wspStatus) { updates.push("estado = 'conectando'"); }
  if (numero) { updates.push("numero = ?"); params.push(numero); }
  if (conectado) { updates.push("conectado_en = NOW()"); }
  if (qrFromResponse) { updates.push("wsp_qr = ?"); params.push(qrFromResponse); }

  if (updates.length > 0) {
    params.push(instanceId);
    await modDb.query(
      `UPDATE mcp_api_whatsapp SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
  }

  const [updatedRows] = await modDb.query(
    "SELECT wsp_qr FROM mcp_api_whatsapp WHERE id = ? LIMIT 1",
    [instanceId]
  );

  return NextResponse.json({
    ok: true,
    status: wspStatus,
    conectado,
    qr: updatedRows[0]?.wsp_qr || null,
  });
}
