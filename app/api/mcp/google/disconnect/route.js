import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { tenant_id } = await request.json();
  const tenantId = (tenant_id === null || tenant_id === undefined || tenant_id === "null" || tenant_id === "")
    ? null
    : (Number(tenant_id) || null);

  await modDb.query(
    "UPDATE mcp_api_google SET estado = 'desconectado', access_token = NULL, refresh_token = NULL, desconectado_en = NOW() WHERE tenant_id <=> ?",
    [tenantId]
  );

  return NextResponse.json({ ok: true });
}
