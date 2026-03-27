// app/api/integraciones/google/auth/route.js
// Genera la URL de OAuth de Google para Gmail + Calendar
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id") || "admin";

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const redirectUri  = process.env.GOOGLE_INTEGRATION_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ ok: false, error: "Variables de entorno de Google no configuradas" }, { status: 500 });
  }

  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar",
    "openid",
    "email",
    "profile",
  ].join(" ");

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         scopes,
    access_type:   "offline",
    prompt:        "consent",
    state:         tenantId,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.json({ ok: true, url });
}
