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

  const [rows] = await modDb.query(
    "SELECT * FROM mcp_api_whatsapp WHERE tenant_id <=> ? ORDER BY creado_en ASC",
    [tenantId]
  );

  return NextResponse.json({ ok: true, instancias: rows });
}
