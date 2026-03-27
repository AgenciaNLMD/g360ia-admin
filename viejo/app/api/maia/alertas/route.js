// app/api/maia/alertas/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

// ── GET — obtener alertas activas para el usuario ────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const rol        = session.user.rol;
  const usuario_id = session.user.id;

  try {
    // 1. Alertas manuales guardadas en DB
    const [alertasDB] = await db.query(
      `SELECT ma.*, vl.nombre AS lead_nombre, vl.empresa AS lead_empresa
       FROM maia_alertas ma
       LEFT JOIN ventas_leads vl ON ma.lead_id = vl.id
       WHERE (ma.usuario_id = ? OR ma.usuario_id IS NULL)
         AND ma.leida = 0 AND ma.descartada = 0
       ORDER BY ma.creado_en DESC
       LIMIT 10`,
      [usuario_id]
    );

    // 2. Alertas dinámicas — leads sin contacto hace +30 días (perdidos)
    const [reactivaciones] = await db.query(
      `SELECT id, nombre, empresa, estado, fecha_ultimo_contacto,
              DATEDIFF(NOW(), fecha_ultimo_contacto) AS dias
       FROM ventas_leads
       WHERE estado = 'perdido'
         AND fecha_ultimo_contacto IS NOT NULL
         AND DATEDIFF(NOW(), fecha_ultimo_contacto) >= 30
         AND (asignado_a = ? OR ? IN ('superadmin','admin'))
       ORDER BY dias DESC
       LIMIT 5`,
      [usuario_id, rol]
    );

    // 3. Leads en seguimiento que ya llegó su fecha
    const [seguimientos] = await db.query(
      `SELECT id, nombre, empresa, estado, fecha_proximo_contacto
       FROM ventas_leads
       WHERE estado = 'seguimiento'
         AND fecha_proximo_contacto IS NOT NULL
         AND fecha_proximo_contacto <= CURDATE()
         AND (asignado_a = ? OR ? IN ('superadmin','admin'))
       ORDER BY fecha_proximo_contacto ASC
       LIMIT 5`,
      [usuario_id, rol]
    );

    // 4. Leads nuevos sin asignar (solo para admin/superadmin)
    let sinAsignar = [];
    if (["superadmin","admin"].includes(rol)) {
      const [rows] = await db.query(
        `SELECT COUNT(*) AS total FROM ventas_leads
         WHERE estado = 'nuevo' AND asignado_a IS NULL`
      );
      if (rows[0].total > 0) {
        sinAsignar = [{
          tipo:        "sin_asignar",
          titulo:      `${rows[0].total} lead${rows[0].total > 1 ? "s" : ""} sin asignar`,
          descripcion: "Hay leads nuevos esperando ser asignados a un vendedor.",
          accion:      "ver_leads",
        }];
      }
    }

    // Armar lista final
    const alertas = [
      ...sinAsignar,
      ...reactivaciones.map(l => ({
        tipo:        "reactivacion",
        lead_id:     l.id,
        lead_nombre: l.nombre,
        titulo:      `${l.dias} días sin contacto con ${l.nombre}`,
        descripcion: `${l.nombre}${l.empresa ? ` (${l.empresa})` : ""} fue marcado como perdido hace ${l.dias} días. ¿Querés retomarlo?`,
        accion:      "contactar",
      })),
      ...seguimientos.map(l => ({
        tipo:        "seguimiento",
        lead_id:     l.id,
        lead_nombre: l.nombre,
        titulo:      `Momento de volver a contactar a ${l.nombre}`,
        descripcion: `Agendaste volver a contactar a ${l.nombre} para hoy.`,
        accion:      "contactar",
      })),
      ...alertasDB,
    ];

    return NextResponse.json({ ok: true, alertas, total: alertas.length });
  } catch (error) {
    console.error("Maia alertas:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// ── PATCH — marcar alerta como leída o descartada ────────────
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { id, leida, descartada } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const campos  = [];
    const valores = [];
    if (leida      !== undefined) { campos.push("leida = ?");      valores.push(leida); }
    if (descartada !== undefined) { campos.push("descartada = ?"); valores.push(descartada); }

    valores.push(id);
    await db.query(`UPDATE maia_alertas SET ${campos.join(", ")} WHERE id = ?`, valores);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
