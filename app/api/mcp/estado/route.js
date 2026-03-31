import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("tenant_id");
  const tenantId = (!raw || raw === "null") ? null : (Number(raw) || null);

  const estado = {
    whatsapp:    { total: 0, conectados: 0 },
    google:      { estado: "desconectado", email_cuenta: null },
    mercadopago: { estado: "desconectado", email_cuenta: null, modo: null },
    meta:        { estado: "desconectado", page_name: null },
  };

  try {
    const [rows] = await modDb.query(
      "SELECT COUNT(*) AS total, SUM(estado = 'conectado') AS conectados FROM mcp_api_whatsapp WHERE tenant_id <=> ?",
      [tenantId]
    );
    estado.whatsapp.total     = rows[0].total     || 0;
    estado.whatsapp.conectados = rows[0].conectados || 0;
  } catch {}

  try {
    const [rows] = await modDb.query(
      "SELECT estado, email_cuenta FROM mcp_api_google WHERE tenant_id <=> ? LIMIT 1",
      [tenantId]
    );
    if (rows.length > 0) {
      estado.google.estado      = rows[0].estado      || "desconectado";
      estado.google.email_cuenta = rows[0].email_cuenta || null;
    }
  } catch {}

  try {
    const [rows] = await modDb.query(
      "SELECT estado, email_cuenta, modo FROM mcp_api_mercadopago WHERE tenant_id <=> ? LIMIT 1",
      [tenantId]
    );
    if (rows.length > 0) {
      estado.mercadopago.estado      = rows[0].estado      || "desconectado";
      estado.mercadopago.email_cuenta = rows[0].email_cuenta || null;
      estado.mercadopago.modo        = rows[0].modo         || null;
    }
  } catch {}

  try {
    const [rows] = await modDb.query(
      "SELECT estado, page_name FROM mcp_api_meta WHERE tenant_id <=> ? LIMIT 1",
      [tenantId]
    );
    if (rows.length > 0) {
      estado.meta.estado    = rows[0].estado    || "desconectado";
      estado.meta.page_name = rows[0].page_name || null;
    }
  } catch {}

  return NextResponse.json({ ok: true, estado });
}
