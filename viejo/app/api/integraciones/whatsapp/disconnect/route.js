// app/api/integraciones/whatsapp/disconnect/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body       = await request.json();
    const instanceId = body.instance_id;

    if (!instanceId) return NextResponse.json({ ok: false, error: "Falta instance_id" }, { status: 400 });

    const [rows] = await db.query(
      `SELECT * FROM whatsapp_instancias WHERE id = ?`,
      [instanceId]
    );

    if (!rows.length) return NextResponse.json({ ok: false, error: "Instancia no encontrada" }, { status: 404 });

    const inst = rows[0];
    const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
    const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

    // Desconectar en Evolution API
    try {
      await fetch(`${EVOLUTION_URL}/instance/logout/${inst.instance_key}`, {
        method:  "DELETE",
        headers: { "apikey": EVOLUTION_KEY },
      });
    } catch (e) {
      console.warn("Evolution API logout error (ignorado):", e.message);
    }

    // Actualizar DB
    await db.query(
      `UPDATE whatsapp_instancias
       SET estado = 'desconectado', wsp_status = 'close', wsp_qr = NULL,
           desconectado_en = NOW()
       WHERE id = ?`,
      [instanceId]
    );

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("WhatsApp disconnect:", err);
    return NextResponse.json({ ok: false, error: "Error al desconectar" }, { status: 500 });
  }
}
