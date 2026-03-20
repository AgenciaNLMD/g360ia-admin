import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import db from "../../../lib/db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area") || null;

  try {
    const [equipos] = await db.query(
      `SELECT * FROM equipos WHERE tenant_id IS NULL AND activo = 1 ORDER BY id ASC`
    );

    let q = `
      SELECT 
        u.id, u.nombre, u.email, u.rol, u.area, u.titulo,
        u.status, u.activo, u.ultimo_acceso,
        u.tasa_cierre, u.mrr_generado, u.tickets_resueltos, u.satisfaccion_avg,
        u.rubros_especialidad, u.modulos_especialidad,
        COUNT(DISTINCT vl.id) AS leads_activos,
        COUNT(DISTINCT st.id) AS tickets_abiertos
      FROM usuarios u
      LEFT JOIN ventas_leads vl ON vl.asignado_a = u.id AND vl.estado NOT IN ('cerrado','perdido')
      LEFT JOIN soporte_tickets st ON st.asignado_a = u.id AND st.estado NOT IN ('resuelto','cerrado')
      WHERE u.rol NOT IN ('superadmin','viewer')
    `;
    const params = [];
    if (area) { q += ` AND u.area = ?`; params.push(area); }
    q += ` GROUP BY u.id ORDER BY u.area, u.nombre ASC`;

    const [usuarios] = await db.query(q, params);

    const porArea = {};
    usuarios.forEach(u => {
      const a = u.area || "sin_area";
      if (!porArea[a]) porArea[a] = [];
      porArea[a].push(u);
    });

    return NextResponse.json({ ok: true, equipos, usuarios, porArea });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener equipos" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { usuario_id, area, titulo, rol, activo } = body;

    const sets = [];
    const vals = [];
    if (area   !== undefined) { sets.push("area = ?");   vals.push(area); }
    if (titulo !== undefined) { sets.push("titulo = ?"); vals.push(titulo); }
    if (rol    !== undefined) { sets.push("rol = ?");    vals.push(rol); }
    if (activo !== undefined) { sets.push("activo = ?"); vals.push(activo); }

    if (sets.length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

    vals.push(usuario_id);
    await db.query(`UPDATE usuarios SET ${sets.join(", ")} WHERE id = ?`, vals);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
