export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import db from "../../../lib/db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const [equipos] = await db.query(
      `SELECT * FROM equipos WHERE activo = 1 ORDER BY id ASC`
    );

    const [usuarios] = await db.query(
      `SELECT 
        id, nombre, email, rol, area, status, activo, ultimo_acceso,
        tasa_cierre, mrr_generado, tickets_resueltos, satisfaccion_avg,
        rubros_especialidad, modulos_especialidad
       FROM usuarios
       WHERE rol NOT IN ('superadmin', 'viewer')
       ORDER BY area, nombre ASC`
    );

    const porArea = {};
    usuarios.forEach(u => {
      const a = u.area || "sin_area";
      if (!porArea[a]) porArea[a] = [];
      porArea[a].push({ ...u, leads_activos: 0, tickets_abiertos: 0 });
    });

    return NextResponse.json({ ok: true, equipos, usuarios, porArea });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { usuario_id, area, rol, activo } = body;

    const sets = [];
    const vals = [];
    if (area   !== undefined) { sets.push("area = ?");   vals.push(area || null); }
    if (rol    !== undefined) { sets.push("rol = ?");    vals.push(rol); }
    if (activo !== undefined) { sets.push("activo = ?"); vals.push(activo); }

    if (sets.length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

    vals.push(usuario_id);
    await db.query(`UPDATE usuarios SET ${sets.join(", ")} WHERE id = ?`, vals);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
