import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("tenant_id");
  const tenantId = (!raw || raw === "null") ? null : (Number(raw) || null);

  const state = tenantId !== null ? String(tenantId) : "admin";

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  process.env.GOOGLE_INTEGRATION_REDIRECT_URI,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/calendar",
      "openid",
      "email",
      "profile",
    ].join(" "),
    access_type:   "offline",
    prompt:        "consent",
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.json({ ok: true, url });
}
