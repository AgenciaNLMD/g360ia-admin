export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "../../../../lib/db";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = params;

  try {
    // Datos del usuario
    const [[usuario]] = await db.query(
      `SELECT id, nombre, email, rol, area, activo, ultimo_acceso,
              tasa_cierre, mrr_generado, tickets_resueltos, satisfaccion_avg,
              rubros_especialidad, modulos_especialidad
       FROM usuarios WHERE id = ?`,
      [id]
    );

    if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Leads asignados
    const [leads] = await db.query(
      `SELECT id, nombre, empresa, estado, valor_mrr_estimado, creado_en, actualizado_en
       FROM ventas_leads
       WHERE asignado_a = ?
       ORDER BY actualizado_en DESC
       LIMIT 20`,
      [id]
    );

    // Actividades recientes
    const [actividades] = await db.query(
      `SELECT va.*, vl.nombre AS lead_nombre, vl.empresa AS lead_empresa
       FROM ventas_actividades va
       LEFT JOIN ventas_leads vl ON va.lead_id = vl.id
       WHERE va.usuario_id = ?
       ORDER BY va.fecha_actividad DESC
       LIMIT 30`,
      [id]
    );

    // Conversaciones asignadas
    const [conversaciones] = await db.query(
      `SELECT id, contacto_nombre, contacto_telefono, canal, estado,
              ultimo_mensaje, ultimo_mensaje_at, creado_en
       FROM ventas_conversaciones
       WHERE asignado_a = ?
       ORDER BY actualizado_en DESC
       LIMIT 20`,
      [id]
    );

    // KPIs del mes actual
    const [[kpiMes]] = await db.query(
      `SELECT
        COUNT(CASE WHEN estado NOT IN ('perdido') THEN 1 END) AS leads_activos,
        COUNT(CASE WHEN estado = 'cerrado' THEN 1 END) AS leads_cerrados,
        COUNT(CASE WHEN estado = 'contactado' OR estado = 'demo' OR estado = 'propuesta' THEN 1 END) AS leads_en_proceso,
        COALESCE(SUM(CASE WHEN estado = 'cerrado' THEN valor_mrr_estimado ELSE 0 END), 0) AS mrr_cerrado_mes
       FROM ventas_leads
       WHERE asignado_a = ?
       AND MONTH(creado_en) = MONTH(NOW())
       AND YEAR(creado_en) = YEAR(NOW())`,
      [id]
    );

    // Actividad por tipo (últimos 30 días)
    const [actividadPorTipo] = await db.query(
      `SELECT tipo, COUNT(*) AS total
       FROM ventas_actividades
       WHERE usuario_id = ?
       AND fecha_actividad >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY tipo`,
      [id]
    );

    // Metas del mes
    const [[metas]] = await db.query(
      `SELECT meta_leads, meta_cierres, meta_mrr
       FROM ventas_metas
       WHERE usuario_id = ?
       AND mes = MONTH(NOW())
       AND anio = YEAR(NOW())
       LIMIT 1`,
      [id]
    ).catch(() => [[null]]);

    return NextResponse.json({
      ok: true,
      usuario,
      leads,
      actividades,
      conversaciones,
      kpiMes,
      actividadPorTipo,
      metas: metas || null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
