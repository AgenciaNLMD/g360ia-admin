import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

function guardAdmin(session) {
  return session?.user?.rol === "superadmin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const [rows] = await pool.query("SELECT * FROM rubros ORDER BY nombre");
  return NextResponse.json({ ok: true, rubros: rows });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { nombre, descripcion } = await request.json();
  if (!nombre?.trim())
    return NextResponse.json({ ok: false, error: "El nombre es requerido" }, { status: 400 });

  const [result] = await pool.query(
    "INSERT INTO rubros (nombre, descripcion, activo) VALUES (?, ?, 1)",
    [nombre.trim(), descripcion?.trim() ?? ""]
  );
  return NextResponse.json({ ok: true, id: result.insertId });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id, nombre, descripcion } = await request.json();
  if (!id || !nombre?.trim())
    return NextResponse.json({ ok: false, error: "id y nombre son requeridos" }, { status: 400 });

  await pool.query(
    "UPDATE rubros SET nombre = ?, descripcion = ? WHERE id = ?",
    [nombre.trim(), descripcion?.trim() ?? "", id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Falta el id" }, { status: 400 });

  await pool.query("DELETE FROM rubros WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
