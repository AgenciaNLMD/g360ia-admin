// app/api/integraciones/google/disconnect/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body     = await request.json();
    const tenantId = body.tenant_id || null;

    await db.query(
      `UPDATE integraciones_tokens
       SET estado = 'desconectado', access_token = NULL, refresh_token = NULL,
           desconectado_en = NOW()
       WHERE tipo IN ('gmail', 'google_calendar')
         AND (tenant_id = ? OR (? IS NULL AND tenant_id IS NULL))`,
      [tenantId, tenantId]
    );

    await db.query(
      `UPDATE integraciones SET activo = 0
       WHERE tipo IN ('gmail', 'google_calendar')
         AND (tenant_id = ? OR (? IS NULL AND tenant_id IS NULL))`,
      [tenantId, tenantId]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Google disconnect:", err);
    return NextResponse.json({ ok: false, error: "Error al desconectar" }, { status: 500 });
  }
}
