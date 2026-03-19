import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado") || null;
  const asignado = searchParams.get("asignado") || null;

  try {
    let query = `
      SELECT 
        vc.*,
        u.nombre AS vendedor_nombre,
        u.email AS vendedor_email,
        vl.nombre AS lead_nombre,
        vl.empresa AS lead_empresa
      FROM ventas_conversaciones vc
      LEFT JOIN usuarios u ON vc.asignado_a = u.id
      LEFT JOIN ventas_leads vl ON vc.lead_id = vl.id
      WHERE 1=1
    `;
    const params = [];

    if (estado) { query += ` AND vc.estado = ?`; params.push(estado); }
    if (asignado === "null") { query += ` AND vc.asignado_a IS NULL`; }
    else if (asignado) { query += ` AND vc.asignado_a = ?`; params.push(asignado); }

    query += ` ORDER BY vc.actualizado_en DESC`;

    const [rows] = await db.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener conversaciones" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { lead_id, canal, contacto_nombre, contacto_telefono, contacto_email, asignado_a } = body;

    const [result] = await db.query(
      `INSERT INTO ventas_conversaciones 
        (lead_id, canal, contacto_nombre, contacto_telefono, contacto_email, asignado_a, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'nueva')`,
      [lead_id || null, canal, contacto_nombre, contacto_telefono || null, contacto_email || null, asignado_a || null]
    );
    return NextResponse.json({ id: result.insertId, ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear conversación" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, asignado_a, estado, lead_id } = body;

    await db.query(
      `UPDATE ventas_conversaciones 
       SET asignado_a = ?, estado = COALESCE(?, estado), lead_id = COALESCE(?, lead_id)
       WHERE id = ?`,
      [asignado_a !== undefined ? asignado_a : null, estado || null, lead_id || null, id]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar conversación" }, { status: 500 });
  }
}
