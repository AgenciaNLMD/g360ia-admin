import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado") || null;
  const prioridad = searchParams.get("prioridad") || null;
  const asignado = searchParams.get("asignado") || null;

  try {
    let query = `
      SELECT 
        st.*,
        t.nombre AS tenant_nombre,
        u.nombre AS agente_nombre
      FROM soporte_tickets st
      LEFT JOIN tenants t ON st.tenant_id = t.id
      LEFT JOIN usuarios u ON st.asignado_a = u.id
      WHERE 1=1
    `;
    const params = [];

    if (estado) { query += ` AND st.estado = ?`; params.push(estado); }
    if (prioridad) { query += ` AND st.prioridad = ?`; params.push(prioridad); }
    if (asignado === "null") { query += ` AND st.asignado_a IS NULL`; }
    else if (asignado) { query += ` AND st.asignado_a = ?`; params.push(asignado); }

    query += ` ORDER BY 
      FIELD(st.prioridad, 'urgente', 'alta', 'media', 'baja'),
      st.creado_en DESC`;

    const [rows] = await db.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener tickets" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { tenant_id, canal, categoria, prioridad, titulo, descripcion, asignado_a } = body;

    const [result] = await db.query(
      `INSERT INTO soporte_tickets 
        (tenant_id, canal, categoria, prioridad, titulo, descripcion, asignado_a, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'nuevo')`,
      [tenant_id || null, canal, categoria, prioridad || "media", titulo, descripcion || null, asignado_a || null]
    );
    return NextResponse.json({ id: result.insertId, ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear ticket" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, estado, prioridad, asignado_a, satisfaccion } = body;

    await db.query(
      `UPDATE soporte_tickets SET
        estado = COALESCE(?, estado),
        prioridad = COALESCE(?, prioridad),
        asignado_a = COALESCE(?, asignado_a),
        satisfaccion = COALESCE(?, satisfaccion)
       WHERE id = ?`,
      [estado || null, prioridad || null, asignado_a || null, satisfaccion || null, id]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar ticket" }, { status: 500 });
  }
}
