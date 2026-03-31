import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body     = await request.json();
    const raw      = body.tenant_id;
    const tenantId = (!raw && raw !== 0) ? null : (Number(raw) || null);

    await modDb.query(
      `UPDATE mcp_api_meta
       SET estado = 'desconectado', page_access_token = NULL, desconectado_en = NOW()
       WHERE tenant_id <=> ?`,
      [tenantId]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Meta disconnect:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
