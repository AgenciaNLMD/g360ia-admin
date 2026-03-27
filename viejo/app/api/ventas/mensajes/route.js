import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const conversacion_id = searchParams.get("conversacion_id");
  if (!conversacion_id) return NextResponse.json({ error: "Falta conversacion_id" }, { status: 400 });
  try {
    const [rows] = await db.query(
      `SELECT vm.*, u.nombre AS enviado_por_nombre
       FROM ventas_mensajes vm
       LEFT JOIN usuarios u ON vm.enviado_por = u.id
       WHERE vm.conversacion_id = ?
       ORDER BY vm.creado_en ASC`,
      [conversacion_id]
    );
    await db.query(
      `UPDATE ventas_mensajes SET leido = 1 
       WHERE conversacion_id = ? AND direccion = 'entrante' AND leido = 0`,
      [conversacion_id]
    );
    return NextResponse.json({ ok: true, mensajes: rows });
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
    const { conversacion_id, direccion, contenido } = body;
    const enviado_por = direccion === "saliente" ? session.user.id : null;

    const [result] = await db.query(
      `INSERT INTO ventas_mensajes (conversacion_id, direccion, contenido, enviado_por)
       VALUES (?, ?, ?, ?)`,
      [conversacion_id, direccion, contenido, enviado_por]
    );

    await db.query(
      `UPDATE ventas_conversaciones 
       SET ultimo_mensaje = ?, ultimo_mensaje_at = NOW(), estado = 'en_curso'
       WHERE id = ?`,
      [contenido.substring(0, 200), conversacion_id]
    );

    if (direccion === "saliente") {
      try {
        const [[conv]] = await db.query(
          `SELECT vc.contacto_telefono, wi.instance_key
           FROM ventas_conversaciones vc
           LEFT JOIN whatsapp_instancias wi ON wi.tenant_id IS NULL AND wi.estado = 'conectado'
           WHERE vc.id = ? AND vc.canal = 'whatsapp'`,
          [conversacion_id]
        );
        if (conv?.contacto_telefono && conv?.instance_key) {
          const telefono = conv.contacto_telefono.replace(/\D/g, "");
          await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${conv.instance_key}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": process.env.EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
              number: `${telefono}@s.whatsapp.net`,
              text: contenido,
            }),
          });
        }
      } catch (wspErr) {
        console.warn("WhatsApp send warning:", wspErr.message);
      }
    }

    return NextResponse.json({ id: result.insertId, ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 });
  }
}
