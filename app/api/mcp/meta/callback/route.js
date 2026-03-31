import { NextResponse } from "next/server";
import modDb from "@/lib/modulos-db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");  // tenant_id o "admin"
  const error = searchParams.get("error");

  const adminUrl   = process.env.NEXTAUTH_URL || "https://admin.gestion360ia.com.ar";
  const appId      = process.env.META_APP_ID;
  const appSecret  = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (error || !code) {
    return NextResponse.redirect(`${adminUrl}/dashboard/mcp?int=error&tipo=meta`);
  }

  try {
    // 1. Short-lived token
    const shortRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code })
    );
    const shortData = await shortRes.json();
    if (!shortData.access_token) throw new Error("No access_token en respuesta de Meta");

    // 2. Long-lived token
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type:        "fb_exchange_token",
        client_id:         appId,
        client_secret:     appSecret,
        fb_exchange_token: shortData.access_token,
      })
    );
    const longData = await longRes.json();
    const longToken = longData.access_token || shortData.access_token;

    // 3. Páginas del usuario
    const pagesRes  = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`);
    const pagesData = await pagesRes.json();
    const page      = pagesData?.data?.[0];
    if (!page) throw new Error("No se encontraron páginas de Facebook");

    // 4. Instagram Business account de la página
    let instagramId = null;
    try {
      const igRes  = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
      const igData = await igRes.json();
      instagramId  = igData?.instagram_business_account?.id || null;
    } catch {}

    const tenantId = (state === "admin" || !state) ? null : (parseInt(state) || null);

    await modDb.query(
      `INSERT INTO mcp_api_meta
         (tenant_id, page_id, page_name, page_access_token, instagram_account_id, app_id, estado, conectado_en)
       VALUES (?, ?, ?, ?, ?, ?, 'conectado', NOW())
       ON DUPLICATE KEY UPDATE
         page_id              = VALUES(page_id),
         page_name            = VALUES(page_name),
         page_access_token    = VALUES(page_access_token),
         instagram_account_id = VALUES(instagram_account_id),
         estado               = 'conectado',
         conectado_en         = NOW(),
         desconectado_en      = NULL`,
      [tenantId, page.id, page.name, page.access_token, instagramId, appId]
    );

    return NextResponse.redirect(`${adminUrl}/dashboard/mcp?int=ok&tipo=meta`);
  } catch (err) {
    console.error("Meta OAuth callback:", err);
    return NextResponse.redirect(`${adminUrl}/dashboard/mcp?int=error&tipo=meta`);
  }
}
