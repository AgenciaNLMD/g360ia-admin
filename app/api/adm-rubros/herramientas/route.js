import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

function guardAdmin(session) {
  return session?.user?.rol === "superadmin";
}

// GET /api/adm-rubros/herramientas?modulo_slug=crm
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("modulo_slug");
  if (!slug) return NextResponse.json({ ok: false, error: "Falta modulo_slug" }, { status: 400 });

  const dbName = process.env.DB_MODULOS_NAME;
  const [rows] = await modDb.query(
    `SELECT TABLE_NAME AS tabla
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE ?
     ORDER BY TABLE_NAME`,
    [dbName, `${slug}_%`]
  );

  const herramientas = rows.map(r => r.tabla);
  return NextResponse.json({ ok: true, herramientas });
}
