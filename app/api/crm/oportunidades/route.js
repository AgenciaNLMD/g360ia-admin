// app/api/crm/oportunidades/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modulosDb from "@/lib/modulos-db";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
}

// ── GET ─────────────────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { tenant_id, id: usuario_id, rol } = session.user;
  if (!tenant_id) return NextResponse.json({ ok: false, error: "Sin tenant" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const etapa   = searchParams.get("etapa")   || null;
  const lead_id = searchParams.get("lead_id") || null;
  const esAdmin = ["superadmin", "admin"].includes(rol);

  try {
    let query = `
      SELECT
        co.*,
        cl.nombre  AS lead_nombre,
        cl.empresa AS lead_empresa,
        u.nombre   AS creador_nombre
      FROM crm_oportunidades co
      LEFT JOIN crm_leads cl ON cl.id = co.lead_id
      LEFT JOIN db_g360ia.usuarios u ON u.id = co.creado_por
      WHERE co.tenant_id = ?
    `;
    const params = [tenant_id];

    if (!esAdmin) {
      query += ` AND co.creado_por = ?`;
      params.push(usuario_id);
    }
    if (etapa)   { query += ` AND co.etapa = ?`;   params.push(etapa); }
    if (lead_id) { query += ` AND co.lead_id = ?`; params.push(lead_id); }

    query += ` ORDER BY co.creado_en DESC`;

    const [rows] = await modulosDb.query(query, params);
    return NextResponse.json({ ok: true, oportunidades: rows });
  } catch (err) {
    console.error("crm/oportunidades GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { tenant_id, id: creado_por } = session.user;
  if (!tenant_id) return NextResponse.json({ ok: false, error: "Sin tenant" }, { status: 400 });

  try {
    const {
      lead_id, contacto_id, titulo, etapa,
      valor, probabilidad, fecha_cierre_est,
    } = await req.json();

    if (!titulo) return NextResponse.json({ ok: false, error: "Título obligatorio" }, { status: 400 });

    const [result] = await modulosDb.query(
      `INSERT INTO crm_oportunidades
        (tenant_id, lead_id, contacto_id, titulo, etapa, valor, probabilidad, fecha_cierre_est, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenant_id,
        lead_id          || null,
        contacto_id      || null,
        titulo,
        etapa            || "contacto",
        valor            || null,
        probabilidad     || null,
        fecha_cierre_est || null,
        creado_por,
      ]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("crm/oportunidades POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH ────────────────────────────────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { tenant_id } = session.user;
  if (!tenant_id) return NextResponse.json({ ok: false, error: "Sin tenant" }, { status: 400 });

  try {
    const { id, titulo, etapa, valor, probabilidad, fecha_cierre_est } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const campos  = [];
    const valores = [];

    if (titulo           !== undefined) { campos.push("titulo = ?");           valores.push(titulo); }
    if (etapa            !== undefined) { campos.push("etapa = ?");            valores.push(etapa); }
    if (valor            !== undefined) { campos.push("valor = ?");            valores.push(valor); }
    if (probabilidad     !== undefined) { campos.push("probabilidad = ?");     valores.push(probabilidad); }
    if (fecha_cierre_est !== undefined) { campos.push("fecha_cierre_est = ?"); valores.push(fecha_cierre_est); }

    if (!campos.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });

    valores.push(id, tenant_id);
    await modulosDb.query(
      `UPDATE crm_oportunidades SET ${campos.join(", ")} WHERE id = ? AND tenant_id = ?`,
      valores
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("crm/oportunidades PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (!["superadmin", "admin"].includes(session.user.rol)) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }
  const { tenant_id } = session.user;
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    await modulosDb.query(
      "DELETE FROM crm_oportunidades WHERE id = ? AND tenant_id = ?",
      [id, tenant_id]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
