export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

// GET — actividades de un lead
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lead_id = searchParams.get("lead_id");

    if (!lead_id) {
      return NextResponse.json({ ok: false, error: "Falta lead_id" }, { status: 400 });
    }

    const [rows] = await db.query(
      `SELECT 
        va.*,
        u.nombre as usuario_nombre
       FROM ventas_actividades va
       LEFT JOIN usuarios u ON u.id = va.usuario_id
       WHERE va.lead_id = ?
       ORDER BY va.fecha_actividad DESC`,
      [lead_id]
    );

    return NextResponse.json({ ok: true, actividades: rows });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST — registrar actividad
export async function POST(req) {
  try {
    const {
      lead_id, usuario_id, tipo,
      descripcion, proxima_accion, fecha_proxima_accion
    } = await req.json();

    if (!lead_id || !usuario_id || !tipo) {
      return NextResponse.json({ ok: false, error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const [result] = await db.query(
      `INSERT INTO ventas_actividades 
       (lead_id, usuario_id, tipo, descripcion, proxima_accion, fecha_proxima_accion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        lead_id,
        usuario_id,
        tipo,
        descripcion || null,
        proxima_accion || null,
        fecha_proxima_accion || null,
      ]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// DELETE — eliminar actividad
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    await db.query("DELETE FROM ventas_actividades WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
