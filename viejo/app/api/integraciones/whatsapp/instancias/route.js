// app/api/integraciones/whatsapp/instancias/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id") || null;

  try {
    const [rows] = await db.query(
      `SELECT * FROM whatsapp_instancias
       WHERE tenant_id IS NULL OR tenant_id = ?
       ORDER BY creado_en ASC`,
      [tenantId]
    );
    return NextResponse.json({ ok: true, instancias: rows });
  } catch (err) {
    console.error("GET /whatsapp/instancias:", err);
    return NextResponse.json({ ok: false, error: "Error al obtener instancias" }, { status: 500 });
  }
}
