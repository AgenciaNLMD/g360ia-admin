import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { instance_id } = await request.json();
  if (!instance_id) return NextResponse.json({ ok: false, error: "instance_id requerido" }, { status: 400 });

  const [rows] = await modDb.query(
    "SELECT instance_key FROM mcp_api_whatsapp WHERE id = ? LIMIT 1",
    [instance_id]
  );
  if (!rows.length) return NextResponse.json({ ok: false, error: "Instancia no encontrada" }, { status: 404 });

  const { instance_key } = rows[0];
  const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
  const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

  try {
    await fetch(`${EVOLUTION_URL}/instance/logout/${instance_key}`, {
      method: "DELETE",
      headers: { "apikey": EVOLUTION_KEY },
    });
  } catch {}

  await modDb.query(
    "UPDATE mcp_api_whatsapp SET estado = 'desconectado', wsp_status = 'close', wsp_qr = NULL, desconectado_en = NOW() WHERE id = ?",
    [instance_id]
  );

  return NextResponse.json({ ok: true });
}
