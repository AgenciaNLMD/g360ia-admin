// app/api/integraciones/whatsapp/status/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get("instance_id");

  if (!instanceId) return NextResponse.json({ ok: false, error: "Falta instance_id" }, { status: 400 });

  try {
    const [rows] = await db.query(
      `SELECT * FROM whatsapp_instancias WHERE id = ?`,
      [instanceId]
    );

    if (!rows.length) return NextResponse.json({ ok: false, error: "Instancia no encontrada" }, { status: 404 });

    const inst = rows[0];
    const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
    const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

    const statusRes = await fetch(
      `${EVOLUTION_URL}/instance/connectionState/${inst.instance_key}`,
      { headers: { "apikey": EVOLUTION_KEY } }
    );
    const statusData = await statusRes.json();
    const wspState   = statusData.instance?.state || "close";
    const conectado  = wspState === "open";

    // Actualizar DB
    await db.query(
      `UPDATE whatsapp_instancias
       SET wsp_status = ?, estado = ?, numero = COALESCE(?, numero),
           conectado_en = IF(? = 'conectado', NOW(), conectado_en)
       WHERE id = ?`,
      [
        wspState,
        conectado ? "conectado" : "conectando",
        statusData.instance?.jid ? statusData.instance.jid.replace("@s.whatsapp.net","") : null,
        conectado ? "conectado" : "otro",
        instanceId,
      ]
    );

    return NextResponse.json({ ok: true, status: wspState, conectado });

  } catch (err) {
    console.error("WhatsApp status:", err);
    return NextResponse.json({ ok: false, error: "Error al verificar estado" }, { status: 500 });
  }
}
