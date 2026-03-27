import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const ticket_id = searchParams.get("ticket_id");

  if (!ticket_id) return NextResponse.json({ error: "Falta ticket_id" }, { status: 400 });

  try {
    const [rows] = await db.query(
      `SELECT sm.*, u.nombre AS enviado_por_nombre
       FROM soporte_mensajes sm
       LEFT JOIN usuarios u ON sm.enviado_por = u.id
       WHERE sm.ticket_id = ?
       ORDER BY sm.creado_en ASC`,
      [ticket_id]
    );

    await db.query(
      `UPDATE soporte_mensajes SET leido = 1
       WHERE ticket_id = ? AND direccion = 'entrante' AND leido = 0`,
      [ticket_id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { ticket_id, direccion, contenido } = body;
    const enviado_por = direccion === "saliente" ? session.user.id : null;

    const [result] = await db.query(
      `INSERT INTO soporte_mensajes (ticket_id, direccion, contenido, enviado_por)
       VALUES (?, ?, ?, ?)`,
      [ticket_id, direccion, contenido, enviado_por]
    );

    await db.query(
      `UPDATE soporte_tickets SET estado = 'en_curso', actualizado_en = NOW()
       WHERE id = ? AND estado = 'nuevo'`,
      [ticket_id]
    );

    return NextResponse.json({ id: result.insertId, ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 });
  }
}
