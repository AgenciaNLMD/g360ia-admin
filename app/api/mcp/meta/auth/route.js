import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const raw      = searchParams.get("tenant_id");
  const tenantId = (!raw || raw === "null") ? "admin" : raw;

  const appId      = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!appId || !redirectUri) {
    return NextResponse.json({ ok: false, error: "Variables META_APP_ID / META_REDIRECT_URI no configuradas" }, { status: 500 });
  }

  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_metadata",
    "instagram_basic",
    "instagram_manage_messages",
    "instagram_manage_comments",
  ].join(",");

  const params = new URLSearchParams({
    client_id:     appId,
    redirect_uri:  redirectUri,
    state:         tenantId,
    scope:         scopes,
    response_type: "code",
  });

  const url = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;

  return NextResponse.json({ ok: true, url });
}
