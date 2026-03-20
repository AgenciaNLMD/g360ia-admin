// app/api/ventas/crm/route.js
// Endpoint unificado para el módulo CRM
// Retorna leads, funnel y conversaciones en una sola llamada
// o individualmente según el parámetro ?vista=

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const vista      = searchParams.get("vista") || "todo"; // todo | leads | funnel | conversaciones
  const rol        = session.user.rol;
  const usuario_id = session.user.id;
  const esAdmin    = ["superadmin","admin"].includes(rol);

  try {
    const resultado = {};

    // ── LEADS (sin tomar) ────────────────────────────────────
    if (["todo","leads"].includes(vista)) {
      let q = `
        SELECT
          vl.*,
          u.nombre AS vendedor_nombre
        FROM ventas_leads vl
        LEFT JOIN usuarios u ON u.id = vl.asignado_a
        WHERE vl.asignado_a IS NULL AND vl.estado = 'nuevo'
        ORDER BY vl.creado_en DESC
      `;
      const [leads] = await db.query(q);
      resultado.leads = leads;

      // Conteos por fuente para el admin
      if (esAdmin) {
        const [porFuente] = await db.query(
          `SELECT fuente, COUNT(*) AS total
           FROM ventas_leads
           WHERE asignado_a IS NULL AND estado = 'nuevo'
           GROUP BY fuente`
        );
        resultado.leads_por_fuente = porFuente;
      }
    }

    // ── FUNNEL (leads tomados por etapa) ─────────────────────
    if (["todo","funnel"].includes(vista)) {
      let q = `
        SELECT
          vl.*,
          u.nombre AS vendedor_nombre,
          vc.id    AS conversacion_id,
          vc.canal AS conv_canal,
          vc.ultimo_mensaje,
          vc.ultimo_mensaje_at
        FROM ventas_leads vl
        LEFT JOIN usuarios u ON u.id = vl.asignado_a
        LEFT JOIN ventas_conversaciones vc ON vc.lead_id = vl.id
          AND vc.estado != 'cerrada'
        WHERE vl.estado IN ('contactado','interesado','seguimiento')
          AND vl.asignado_a IS NOT NULL
      `;
      const params = [];

      // Vendedor solo ve los suyos
      if (!esAdmin) {
        q += ` AND vl.asignado_a = ?`;
        params.push(usuario_id);
      }

      q += ` ORDER BY vl.actualizado_en DESC`;

      const [funnel] = await db.query(q, params);

      // Agrupar por etapa
      const etapas = {
        contactado:  [],
        interesado:  [],
        seguimiento: [],
      };
      funnel.forEach(l => {
        if (etapas[l.estado]) etapas[l.estado].push(l);
      });

      resultado.funnel = etapas;
      resultado.funnel_total = funnel.length;
    }

    // ── CONVERSACIONES ───────────────────────────────────────
    if (["todo","conversaciones"].includes(vista)) {
      let q = `
        SELECT
          vc.*,
          u.nombre   AS vendedor_nombre,
          vl.nombre  AS lead_nombre,
          vl.empresa AS lead_empresa,
          vl.rubro_interes,
          vl.plan_interes,
          vl.sitio_web,
          vl.instagram,
          vl.facebook,
          vl.ubicacion,
          vl.estado  AS lead_estado,
          vl.fuente  AS lead_fuente,
          vl.notas   AS lead_notas
        FROM ventas_conversaciones vc
        LEFT JOIN usuarios u      ON vc.asignado_a = u.id
        LEFT JOIN ventas_leads vl ON vc.lead_id    = vl.id
        WHERE vc.estado != 'cerrada'
      `;
      const params = [];

      // Vendedor solo ve las suyas
      if (!esAdmin) {
        q += ` AND vc.asignado_a = ?`;
        params.push(usuario_id);
      }

      q += ` ORDER BY vc.actualizado_en DESC`;

      const [convs] = await db.query(q, params);
      resultado.conversaciones = convs;
    }

    // ── STATS RÁPIDAS ────────────────────────────────────────
    if (vista === "todo") {
      let statsQ = `
        SELECT
          COUNT(CASE WHEN estado = 'nuevo' AND asignado_a IS NULL THEN 1 END)     AS leads_sin_tomar,
          COUNT(CASE WHEN estado = 'contactado'  THEN 1 END)                      AS en_contactado,
          COUNT(CASE WHEN estado = 'interesado'  THEN 1 END)                      AS en_interesado,
          COUNT(CASE WHEN estado = 'seguimiento' THEN 1 END)                      AS en_seguimiento,
          COUNT(CASE WHEN estado = 'cerrado'
            AND MONTH(actualizado_en) = MONTH(NOW())
            AND YEAR(actualizado_en)  = YEAR(NOW())  THEN 1 END)                  AS cerrados_mes,
          COUNT(CASE WHEN estado = 'perdido'     THEN 1 END)                      AS perdidos
        FROM ventas_leads
      `;
      const statsParams = [];
      if (!esAdmin) {
        statsQ += ` WHERE asignado_a = ? OR (asignado_a IS NULL AND estado = 'nuevo')`;
        statsParams.push(usuario_id);
      }

      const [[stats]] = await db.query(statsQ, statsParams);
      resultado.stats = stats;
    }

    return NextResponse.json({ ok: true, ...resultado });

  } catch (err) {
    console.error("CRM GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
