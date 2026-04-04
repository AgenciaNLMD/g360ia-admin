import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import modDb from "@/lib/modulos-db";

async function guardG360ia(session) {
  if (!session?.user?.tenant_id) return false;
  const [rows] = await db.query(
    "SELECT rubro FROM tenants WHERE id = ?",
    [session.user.tenant_id]
  );
  return rows.length > 0 && rows[0].rubro === "g360ia";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!await guardG360ia(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const [rows] = await modDb.query("SELECT * FROM adm_rubros_modulos ORDER BY slug");
  return NextResponse.json({ ok: true, modulos: rows });
}
