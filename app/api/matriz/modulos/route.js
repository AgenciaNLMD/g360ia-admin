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

  const [rows] = await pool.query("SELECT * FROM modulos ORDER BY id");
  return NextResponse.json({ ok: true, modulos: rows });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id, grupo } = await request.json();
  if (!id) return NextResponse.json({ ok: false, error: "id requerido" }, { status: 400 });

  await pool.query("UPDATE modulos SET grupo = ? WHERE id = ?", [grupo ?? null, id]);
  return NextResponse.json({ ok: true });
}
