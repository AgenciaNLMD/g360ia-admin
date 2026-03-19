import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import db from "../../../lib/db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tenant_id = searchParams.get("tenant_id") || null;

  try {
    const [rows] = await db.query(
      `SELECT * FROM integraciones WHERE tenant_id ${tenant_id ? "= ?" : "IS NULL"} ORDER BY id ASC`,
      tenant_id ? [tenant_id] : []
    );
    return NextResponse.json({ ok: true, integraciones: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener integraciones" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, activo, sugerencia_dismisseada, config, nombre } = body;

    const sets = [];
    const vals = [];

    if (activo !== undefined)                 { sets.push("activo = ?");                  vals.push(activo); }
    if (sugerencia_dismisseada !== undefined) { sets.push("sugerencia_dismisseada = ?");  vals.push(sugerencia_dismisseada); }
    if (config !== undefined)                 { sets.push("config = ?");                  vals.push(JSON.stringify(config)); }
    if (nombre !== undefined)                 { sets.push("nombre = ?");                  vals.push(nombre); }

    if (sets.length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

    vals.push(id);
    await db.query(`UPDATE integraciones SET ${sets.join(", ")} WHERE id = ?`, vals);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar integración" }, { status: 500 });
  }
}
