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

  const [rows] = await modDb.query(`
    SELECT
      rm.rubro_id, rm.modulo_id, rm.plan_minimo,
      r.slug  AS rubro_slug,  r.nombre  AS rubro_nombre,
      m.slug  AS modulo_slug, m.nombre  AS modulo_nombre, m.db_origen
    FROM adm_rubros_rubros_modulos rm
    JOIN adm_rubros_rubros  r ON r.id = rm.rubro_id
    JOIN adm_rubros_modulos m ON m.id = rm.modulo_id
    ORDER BY r.nombre, m.nombre
  `);
  return NextResponse.json({ ok: true, asignaciones: rows });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!await guardG360ia(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { rubro_id, modulo_id, plan_minimo } = await request.json();
  if (!rubro_id || !modulo_id || !plan_minimo)
    return NextResponse.json({ ok: false, error: "Faltan campos requeridos" }, { status: 400 });

  await modDb.query(
    "INSERT INTO adm_rubros_rubros_modulos (rubro_id, modulo_id, plan_minimo) VALUES (?, ?, ?)",
    [rubro_id, modulo_id, plan_minimo]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!await guardG360ia(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const rubro_id  = searchParams.get("rubro_id");
  const modulo_id = searchParams.get("modulo_id");
  if (!rubro_id || !modulo_id)
    return NextResponse.json({ ok: false, error: "Faltan parámetros" }, { status: 400 });

  await modDb.query(
    "DELETE FROM adm_rubros_rubros_modulos WHERE rubro_id = ? AND modulo_id = ?",
    [rubro_id, modulo_id]
  );
  return NextResponse.json({ ok: true });
}
