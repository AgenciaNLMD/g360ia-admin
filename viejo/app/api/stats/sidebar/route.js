import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const [[{ clientes_activos }]] = await db.query(
      `SELECT COUNT(*) AS clientes_activos FROM tenants WHERE activo = 1`
    );
    const [[{ trials_vencidos }]] = await db.query(
      `SELECT COUNT(*) AS trials_vencidos FROM tenants WHERE trial_hasta < NOW() AND plan = 'starter'`
    );
    const [[{ conv_sin_asignar }]] = await db.query(
      `SELECT COUNT(*) AS conv_sin_asignar FROM ventas_conversaciones WHERE asignado_a IS NULL AND estado != 'cerrada'`
    );
    const [[{ tickets_urgentes }]] = await db.query(
      `SELECT COUNT(*) AS tickets_urgentes FROM soporte_tickets WHERE prioridad = 'urgente' AND estado NOT IN ('resuelto','cerrado')`
    );
    const [[{ usuarios_pendientes }]] = await db.query(
      `SELECT COUNT(*) AS usuarios_pendientes FROM usuarios WHERE status = 'pendiente'`
    );

    return NextResponse.json({
      clientes_activos,
      trials_vencidos,
      conv_sin_asignar,
      tickets_urgentes,
      usuarios_pendientes
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener stats" }, { status: 500 });
  }
}
