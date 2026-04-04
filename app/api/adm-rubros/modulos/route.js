import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

function guardG360ia(session) {
  return session?.user?.rol === "superadmin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardG360ia(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const [rows] = await modDb.query("SELECT * FROM adm_rubros_modulos ORDER BY slug");
  return NextResponse.json({ ok: true, modulos: rows });
}
