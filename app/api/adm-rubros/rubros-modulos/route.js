import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import rubrosDb from "@/lib/rubros-db";

function guardAdmin(session) {
  return session?.user?.rol === "superadmin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const [rows] = await rubrosDb.query(`
    SELECT
      rm.rubro_id, rm.modulo_id, rm.plan_minimo,
      r.nombre AS rubro_nombre,
      m.nombre AS modulo_nombre, m.descripcion AS modulo_descripcion, m.db_origen
    FROM rubros_modulos rm
    JOIN rubros  r ON r.id = rm.rubro_id
    JOIN modulos m ON m.id = rm.modulo_id
    ORDER BY r.nombre, m.nombre
  `);
  return NextResponse.json({ ok: true, asignaciones: rows });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { rubro_id, modulo_id, plan_minimo } = await request.json();
  if (!rubro_id || !modulo_id || !plan_minimo)
    return NextResponse.json({ ok: false, error: "Faltan campos requeridos" }, { status: 400 });

  await rubrosDb.query(
    "INSERT INTO rubros_modulos (rubro_id, modulo_id, plan_minimo) VALUES (?, ?, ?)",
    [rubro_id, modulo_id, plan_minimo]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const rubro_id  = searchParams.get("rubro_id");
  const modulo_id = searchParams.get("modulo_id");
  if (!rubro_id || !modulo_id)
    return NextResponse.json({ ok: false, error: "Faltan parámetros" }, { status: 400 });

  await rubrosDb.query(
    "DELETE FROM rubros_modulos WHERE rubro_id = ? AND modulo_id = ?",
    [rubro_id, modulo_id]
  );
  return NextResponse.json({ ok: true });
}
