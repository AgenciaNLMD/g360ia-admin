// app/api/integraciones/whatsapp/init/route.js
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

    // Generar nombre único de instancia para Evolution API
    const suffix       = Date.now().toString(36);
    const tenantPrefix = tenantId ? `t${tenantId}` : "admin";
    const instanceKey  = `${tenantPrefix}_${suffix}`;

    const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
    const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
      return NextResponse.json({ ok: false, error: "Evolution API no configurada" }, { status: 500 });
    }

    // Crear instancia en Evolution API
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

    let qrBase64 = createData.qrcode?.base64 || null;

    // Si ya existe la instancia, conectar y pedir QR
    if (!createRes.ok) {
      const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceKey}`, {
        headers: { "apikey": EVOLUTION_KEY },
      });
      const connectData = await connectRes.json();
      qrBase64 = connectData.base64 || null;
    }

    // Guardar en whatsapp_instancias
    const [result] = await db.query(
      `INSERT INTO whatsapp_instancias (tenant_id, nombre, instance_key, estado)
       VALUES (?, ?, ?, 'conectando')
       ON DUPLICATE KEY UPDATE estado = 'conectando', nombre = VALUES(nombre)`,
      [tenantId, nombre, instanceKey]
    );

    const instanceId = result.insertId || result.id;

    // Actualizar QR si lo tenemos
    if (qrBase64 && instanceId) {
      await db.query(
        `UPDATE whatsapp_instancias SET wsp_qr = ? WHERE id = ?`,
        [qrBase64, instanceId]
      );
    }

    return NextResponse.json({
      ok:          true,
      qr:          qrBase64,
      instance_id: instanceId,
      instance_key: instanceKey,
      status:      "connecting",
    });

  } catch (err) {
    console.error("WhatsApp init:", err);
    return NextResponse.json({ ok: false, error: "Error al inicializar WhatsApp" }, { status: 500 });
  }
}
