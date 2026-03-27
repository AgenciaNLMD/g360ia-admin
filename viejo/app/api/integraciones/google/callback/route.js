// app/api/integraciones/google/callback/route.js
// Recibe el código OAuth de Google, obtiene tokens y los guarda en DB
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code     = searchParams.get("code");
  const state    = searchParams.get("state");  // tenant_id o "admin"
  const error    = searchParams.get("error");

  const adminUrl = process.env.NEXTAUTH_URL || "https://admin.gestion360ia.com.ar";

  if (error || !code) {
    return NextResponse.redirect(`${adminUrl}/dashboard?int=error&tipo=google`);
  }

  try {
    // Intercambiar código por tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
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

    if (!tokens.access_token) {
      console.error("Error obteniendo tokens de Google:", tokens);
      return NextResponse.redirect(`${adminUrl}/dashboard?int=error&tipo=google`);
    }

    // Obtener info del usuario de Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const perfil = await userRes.json();

    const tenantId  = state === "admin" ? null : parseInt(state) || null;
    const expira    = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString().slice(0, 19).replace("T", " ")
      : null;
    const metadata  = JSON.stringify({ email: perfil.email, nombre: perfil.name });

    // ── Guardar token de Gmail ──────────────────────────────
    const [gmailRows] = await db.query(
      `SELECT id FROM integraciones WHERE tipo = 'gmail' AND tenant_id IS NULL`,
      []
    );

    if (gmailRows.length) {
      await db.query(
        `INSERT INTO integraciones_tokens
           (integracion_id, tenant_id, tipo, estado, access_token, refresh_token,
            token_expira_en, scope, metadata, conectado_en)
         VALUES (?, ?, 'gmail', 'conectado', ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           estado        = 'conectado',
           access_token  = VALUES(access_token),
           refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
           token_expira_en = VALUES(token_expira_en),
           scope         = VALUES(scope),
           metadata      = VALUES(metadata),
           conectado_en  = NOW(),
           error_msg     = NULL`,
        [gmailRows[0].id, tenantId, tokens.access_token, tokens.refresh_token || null,
         expira, tokens.scope || null, metadata]
      );
      await db.query(
        `UPDATE integraciones SET activo = 1 WHERE id = ?`,
        [gmailRows[0].id]
      );
    }

    // ── Guardar token de Google Calendar ───────────────────
    const [calRows] = await db.query(
      `SELECT id FROM integraciones WHERE tipo = 'google_calendar' AND tenant_id IS NULL`,
      []
    );

    if (calRows.length) {
      await db.query(
        `INSERT INTO integraciones_tokens
           (integracion_id, tenant_id, tipo, estado, access_token, refresh_token,
            token_expira_en, scope, metadata, conectado_en)
         VALUES (?, ?, 'google_calendar', 'conectado', ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           estado        = 'conectado',
           access_token  = VALUES(access_token),
           refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
           token_expira_en = VALUES(token_expira_en),
           scope         = VALUES(scope),
           metadata      = VALUES(metadata),
           conectado_en  = NOW(),
           error_msg     = NULL`,
        [calRows[0].id, tenantId, tokens.access_token, tokens.refresh_token || null,
         expira, tokens.scope || null, metadata]
      );
      await db.query(
        `UPDATE integraciones SET activo = 1 WHERE id = ?`,
        [calRows[0].id]
      );
    }

    return NextResponse.redirect(`${adminUrl}/dashboard?int=ok&tipo=google`);

  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${adminUrl}/dashboard?int=error&tipo=google`);
  }
}
