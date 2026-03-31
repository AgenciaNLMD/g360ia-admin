import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { tenant_id, access_token, public_key, modo } = await request.json();
  const tenantId = (tenant_id === null || tenant_id === undefined || tenant_id === "null" || tenant_id === "")
    ? null
    : (Number(tenant_id) || null);

  if (!access_token) return NextResponse.json({ ok: false, error: "access_token requerido" }, { status: 400 });

  const validRes = await fetch("https://api.mercadopago.com/v1/account", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!validRes.ok) {
    return NextResponse.json({ ok: false, error: "Token de MercadoPago inválido" }, { status: 400 });
  }

  const mpData = await validRes.json();
  const mpUserId    = mpData.id    || null;
  const emailCuenta = mpData.email || null;
  const modoFinal   = modo || "sandbox";

  await modDb.query(
    `INSERT INTO mcp_api_mercadopago
       (tenant_id, mp_user_id, email_cuenta, access_token, public_key, modo, estado, conectado_en)
     VALUES (?, ?, ?, ?, ?, ?, 'conectado', NOW())
     ON DUPLICATE KEY UPDATE
       mp_user_id    = VALUES(mp_user_id),
       email_cuenta  = VALUES(email_cuenta),
       access_token  = VALUES(access_token),
       public_key    = VALUES(public_key),
       modo          = VALUES(modo),
       estado        = 'conectado',
       conectado_en  = NOW()`,
    [tenantId, mpUserId, emailCuenta, access_token, public_key || null, modoFinal]
  );

  return NextResponse.json({ ok: true, email_cuenta: emailCuenta, modo: modoFinal });
}
