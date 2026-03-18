export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "../../../lib/db";

// GET — listar todos los usuarios
export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, email, rol, status, activo, creado_en, ultimo_acceso
       FROM usuarios
       ORDER BY creado_en DESC`
    );
    return NextResponse.json({ ok: true, usuarios: rows });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// PATCH — actualizar rol, status o activo de un usuario
export async function PATCH(req) {
  try {
    const { id, rol, status, activo } = await req.json();

    if (!id) {
      return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    }

    const campos = [];
    const valores = [];

    if (rol !== undefined)    { campos.push("rol = ?");    valores.push(rol); }
    if (status !== undefined) { campos.push("status = ?"); valores.push(status); }
    if (activo !== undefined) { campos.push("activo = ?"); valores.push(activo); }

    if (campos.length === 0) {
      return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });
    }

    valores.push(id);

    await db.query(
      `UPDATE usuarios SET ${campos.join(", ")} WHERE id = ?`,
      valores
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// DELETE — eliminar usuario
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    await db.query("DELETE FROM usuarios WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
