// app/api/ventas/leads/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

// ── GET ─────────────────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rol = session.user.rol;
  const usuario_id = session.user.id;
  const estado = searchParams.get("estado") || null;
  const fuente = searchParams.get("fuente") || null;
  const tab = searchParams.get("tab") || "sin_tomar";

  try {
    let query = `
      SELECT 
        vl.*,
        u.nombre  AS vendedor_nombre,
        u.email   AS vendedor_email,
        vc.id     AS conversacion_id,
        vc.estado AS conv_estado,
        vc.ultimo_mensaje,
        vc.ultimo_mensaje_at,
        DATEDIFF(NOW(), vl.fecha_ultimo_contacto) AS dias_sin_contacto
      FROM ventas_leads vl
      LEFT JOIN usuarios u ON u.id = vl.asignado_a
      LEFT JOIN ventas_conversaciones vc ON vc.lead_id = vl.id 
        AND vc.estado != 'cerrada'
      WHERE 1=1
    `;
    const params = [];

    if (["superadmin", "admin"].includes(rol)) {
      if (tab === "sin_tomar") {
        query += ` AND vl.asignado_a IS NULL AND vl.estado = 'nuevo'`;
      }
    } else {
      if (tab === "sin_tomar") {
        query += ` AND vl.asignado_a IS NULL AND vl.estado = 'nuevo'`;
      } else if (tab === "mis_leads") {
        query += ` AND vl.asignado_a = ?`;
        params.push(usuario_id);
      } else {
        query += ` AND (vl.asignado_a = ? OR (vl.asignado_a IS NULL AND vl.estado = 'nuevo'))`;
        params.push(usuario_id);
      }
    }

    if (estado) { query += ` AND vl.estado = ?`; params.push(estado); }
    if (fuente) { query += ` AND vl.fuente = ?`; params.push(fuente); }

    query += ` ORDER BY vl.creado_en DESC`;

    const [rows] = await db.query(query, params);
    return NextResponse.json({ ok: true, leads: rows });
  } catch (err) {
    console.error("leads GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — crear lead manual ─────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const {
      nombre, empresa, email, telefono,
      rubro_interes, plan_interes, fuente,
      asignado_a, valor_mrr_estimado, notas,
      sitio_web, instagram, facebook, ubicacion,
    } = await req.json();

    if (!nombre) return NextResponse.json({ ok: false, error: "Nombre obligatorio" }, { status: 400 });

    const [result] = await db.query(
      `INSERT INTO ventas_leads 
        (nombre, empresa, email, telefono, rubro_interes, plan_interes, 
         fuente, asignado_a, valor_mrr_estimado, notas, 
         sitio_web, instagram, facebook, ubicacion, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'nuevo')`,
      [
        nombre,
        empresa || null,
        email || null,
        telefono || null,
        rubro_interes || null,
        plan_interes || null,
        fuente || "manual",
        asignado_a || null,
        valor_mrr_estimado || null,
        notas || null,
        sitio_web || null,
        instagram || null,
        facebook || null,
        ubicacion || null,
      ]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("leads POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualizar / tomar lead ─────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      id, nombre, empresa, email, telefono,
      rubro_interes, plan_interes, fuente, estado,
      asignado_a, valor_mrr_estimado, notas,
      sitio_web, instagram, facebook, ubicacion,
      fecha_proximo_contacto, motivo_perdida,
      tomar,
    } = body;

    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const campos = [];
    const valores = [];

    if (tomar) {
      const rol = session.user.rol;
      const asignado = ["superadmin", "admin"].includes(rol) && asignado_a
        ? asignado_a
        : session.user.id;

      campos.push("asignado_a = ?");
      valores.push(asignado);
      campos.push("estado = 'contactado'");
      campos.push("tomado_en = NOW()");
      campos.push("fecha_ultimo_contacto = NOW()");
    } else {
      if (nombre !== undefined) { campos.push("nombre = ?"); valores.push(nombre); }
      if (empresa !== undefined) { campos.push("empresa = ?"); valores.push(empresa); }
      if (email !== undefined) { campos.push("email = ?"); valores.push(email); }
      if (telefono !== undefined) { campos.push("telefono = ?"); valores.push(telefono); }
      if (rubro_interes !== undefined) { campos.push("rubro_interes = ?"); valores.push(rubro_interes); }
      if (plan_interes !== undefined) { campos.push("plan_interes = ?"); valores.push(plan_interes); }
      if (fuente !== undefined) { campos.push("fuente = ?"); valores.push(fuente); }
      if (asignado_a !== undefined) { campos.push("asignado_a = ?"); valores.push(asignado_a); }
      if (valor_mrr_estimado !== undefined) { campos.push("valor_mrr_estimado = ?"); valores.push(valor_mrr_estimado); }
      if (notas !== undefined) { campos.push("notas = ?"); valores.push(notas); }
      if (sitio_web !== undefined) { campos.push("sitio_web = ?"); valores.push(sitio_web); }
      if (instagram !== undefined) { campos.push("instagram = ?"); valores.push(instagram); }
      if (facebook !== undefined) { campos.push("facebook = ?"); valores.push(facebook); }
      if (ubicacion !== undefined) { campos.push("ubicacion = ?"); valores.push(ubicacion); }
      if (motivo_perdida !== undefined) { campos.push("motivo_perdida = ?"); valores.push(motivo_perdida); }
      if (fecha_proximo_contacto !== undefined) { campos.push("fecha_proximo_contacto = ?"); valores.push(fecha_proximo_contacto); }

      if (estado !== undefined) {
        campos.push("estado = ?");
        valores.push(estado);
        if (["contactado", "interesado", "seguimiento"].includes(estado)) {
          campos.push("fecha_ultimo_contacto = NOW()");
        }
        if (estado === "cerrado" && ["superadmin", "admin"].includes(session.user.rol)) {
          const [[lead]] = await db.query("SELECT * FROM ventas_leads WHERE id = ?", [id]);
          if (lead?.email) {
            const [existe] = await db.query("SELECT id FROM tenants WHERE email = ?", [lead.email]);
            if (!existe.length) {
              const [tenant] = await db.query(
                `INSERT INTO tenants (nombre, rubro, plan, email, telefono, activo, onboarding_completo)
                 VALUES (?, ?, ?, ?, ?, 1, 0)`,
                [
                  lead.empresa || lead.nombre,
                  lead.rubro_interes || "otro",
                  lead.plan_interes || "starter",
                  lead.email,
                  lead.telefono || null,
                ]
              );
              campos.push("tenant_id = ?");
              valores.push(tenant.insertId);
            }
          }
        }
      }
    }

    if (!campos.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });

    // El ID siempre va al final para el WHERE id = ?
    valores.push(id);
    await db.query(`UPDATE ventas_leads SET ${campos.join(", ")} WHERE id = ?`, valores);

    // Si se tomó el lead, vincular la conversación existente por lead_id o teléfono
    if (tomar) {
      const [[leadData]] = await db.query(`SELECT telefono FROM ventas_leads WHERE id = ?`, [id]);
      if (leadData?.telefono) {
        await db.query(
          `UPDATE ventas_conversaciones 
           SET asignado_a = ?, lead_id = ? 
           WHERE lead_id = ? OR (contacto_telefono = ? AND lead_id IS NULL)`,
          [session.user.id, id, id, leadData.telefono]
        );
      } else {
        await db.query(
          `UPDATE ventas_conversaciones SET asignado_a = ?, lead_id = ? WHERE lead_id = ?`,
          [session.user.id, id, id]
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("leads PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  if (!["superadmin", "admin"].includes(session.user.rol)) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    await db.query("DELETE FROM ventas_leads WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
