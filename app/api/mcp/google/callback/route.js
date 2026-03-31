import { NextResponse } from "next/server";
import modDb from "@/lib/modulos-db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

  if (error || !code) {
    return NextResponse.redirect(`${NEXTAUTH_URL}/dashboard/mcp?int=error&tipo=google`);
  }

  const tenantId = (state === "admin" || !state) ? null : (Number(state) || null);

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  process.env.GOOGLE_INTEGRATION_REDIRECT_URI,
        grant_type:    "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error("No access_token");

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userRes.json();
    const emailCuenta = userInfo.email || null;

    const expiraEn = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    await modDb.query(
      `INSERT INTO mcp_api_google
         (tenant_id, email_cuenta, access_token, refresh_token, scope, expira_en, estado, conectado_en)
       VALUES (?, ?, ?, ?, ?, ?, 'conectado', NOW())
       ON DUPLICATE KEY UPDATE
         email_cuenta  = VALUES(email_cuenta),
         access_token  = VALUES(access_token),
         refresh_token = VALUES(refresh_token),
         scope         = VALUES(scope),
         expira_en     = VALUES(expira_en),
         estado        = 'conectado',
         conectado_en  = NOW()`,
      [tenantId, emailCuenta, tokens.access_token, tokens.refresh_token || null, tokens.scope || null, expiraEn]
    );

    return NextResponse.redirect(`${NEXTAUTH_URL}/dashboard/mcp?int=ok&tipo=google`);
  } catch {
    return NextResponse.redirect(`${NEXTAUTH_URL}/dashboard/mcp?int=error&tipo=google`);
  }
}
