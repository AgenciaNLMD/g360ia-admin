// app/api/crm/conversaciones/route.js
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
  const estado  = searchParams.get("estado")  || null;
  const canal   = searchParams.get("canal")   || null;
  const lead_id = searchParams.get("lead_id") || null;
  const esAdmin = ["superadmin", "admin"].includes(rol);

  try {
    let query = `
      SELECT
        cc.*,
        u.nombre    AS vendedor_nombre,
        u.email     AS vendedor_email,
        cl.nombre   AS lead_nombre,
        cl.empresa  AS lead_empresa,
        cl.estado   AS lead_estado,
        cl.fuente   AS lead_fuente,
        ct.nombre   AS contacto_nombre,
        ct.apellido AS contacto_apellido,
        ct.empresa  AS contacto_empresa
      FROM crm_conversaciones cc
      LEFT JOIN db_g360ia.usuarios u ON u.id = cc.asignado_a
      LEFT JOIN crm_leads cl     ON cl.id = cc.lead_id
      LEFT JOIN crm_contactos ct ON ct.id = cc.contacto_id
      WHERE cc.tenant_id = ?
    `;
    const params = [tenant_id];

    if (!esAdmin) {
      query += ` AND cc.asignado_a = ?`;
      params.push(usuario_id);
    }
    if (estado  && estado  !== "todas") { query += ` AND cc.estado = ?`; params.push(estado); }
    if (canal   && canal   !== "todos") { query += ` AND cc.canal = ?`;  params.push(canal); }
    if (lead_id)                        { query += ` AND cc.lead_id = ?`; params.push(lead_id); }

    query += ` ORDER BY cc.ultimo_mensaje_at DESC`;

    const [rows] = await modulosDb.query(query, params);
    return NextResponse.json({ ok: true, conversaciones: rows });
  } catch (err) {
    console.error("crm/conversaciones GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { tenant_id, id: asignado_a } = session.user;
  if (!tenant_id) return NextResponse.json({ ok: false, error: "Sin tenant" }, { status: 400 });

  try {
    const { lead_id, contacto_id, canal, asunto } = await req.json();

    const [result] = await modulosDb.query(
      `INSERT INTO crm_conversaciones
        (tenant_id, lead_id, contacto_id, canal, asunto, asignado_a, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'abierta')`,
      [
        tenant_id,
        lead_id     || null,
        contacto_id || null,
        canal       || "whatsapp",
        asunto      || null,
        asignado_a,
      ]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("crm/conversaciones POST:", err);
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
    const { id, asignado_a, estado, lead_id, contacto_id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const campos  = [];
    const valores = [];

    if (asignado_a  !== undefined) { campos.push("asignado_a = ?");  valores.push(asignado_a); }
    if (estado      !== undefined) { campos.push("estado = ?");      valores.push(estado); }
    if (lead_id     !== undefined) { campos.push("lead_id = ?");     valores.push(lead_id); }
    if (contacto_id !== undefined) { campos.push("contacto_id = ?"); valores.push(contacto_id); }

    if (!campos.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });

    valores.push(id, tenant_id);
    await modulosDb.query(
      `UPDATE crm_conversaciones SET ${campos.join(", ")} WHERE id = ? AND tenant_id = ?`,
      valores
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("crm/conversaciones PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
