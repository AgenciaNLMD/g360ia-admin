// app/api/crm/actividades/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modulosDb from "@/lib/modulos-db";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
}

// ── GET — actividades de un lead o contacto ─────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { tenant_id } = session.user;
  if (!tenant_id) return NextResponse.json({ ok: false, error: "Sin tenant" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const lead_id     = searchParams.get("lead_id")     || null;
  const contacto_id = searchParams.get("contacto_id") || null;

  if (!lead_id && !contacto_id) {
    return NextResponse.json({ ok: false, error: "Falta lead_id o contacto_id" }, { status: 400 });
  }

  try {
    let query = `
      SELECT
        ca.*,
        uo.nombre AS origen_nombre,
        ud.nombre AS destino_nombre
      FROM crm_actividades ca
      LEFT JOIN db_g360ia.usuarios uo ON uo.id = ca.usuario_origen_id
      LEFT JOIN db_g360ia.usuarios ud ON ud.id = ca.usuario_destino_id
      WHERE ca.tenant_id = ?
    `;
    const params = [tenant_id];

    if (lead_id)     { query += ` AND ca.lead_id = ?`;     params.push(lead_id); }
    if (contacto_id) { query += ` AND ca.contacto_id = ?`; params.push(contacto_id); }

    query += ` ORDER BY ca.fecha_actividad DESC`;

    const [rows] = await modulosDb.query(query, params);
    return NextResponse.json({ ok: true, actividades: rows });
  } catch (err) {
    console.error("crm/actividades GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — registrar actividad ───────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { tenant_id, id: creado_por } = session.user;
  if (!tenant_id) return NextResponse.json({ ok: false, error: "Sin tenant" }, { status: 400 });

  try {
    const {
      lead_id, contacto_id, tipo, descripcion,
      usuario_origen_id, usuario_destino_id,
      proxima_accion, fecha_proxima_accion,
    } = await req.json();

    if (!tipo) return NextResponse.json({ ok: false, error: "Falta tipo" }, { status: 400 });
    if (!lead_id && !contacto_id) {
      return NextResponse.json({ ok: false, error: "Falta lead_id o contacto_id" }, { status: 400 });
    }

    const [result] = await modulosDb.query(
      `INSERT INTO crm_actividades
        (tenant_id, lead_id, contacto_id, tipo, descripcion,
         usuario_origen_id, usuario_destino_id, creado_por,
         proxima_accion, fecha_proxima_accion, fecha_actividad)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        tenant_id,
        lead_id              || null,
        contacto_id          || null,
        tipo,
        descripcion          || null,
        usuario_origen_id    || creado_por,
        usuario_destino_id   || null,
        creado_por,
        proxima_accion       || null,
        fecha_proxima_accion || null,
      ]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("crm/actividades POST:", err);
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
      "DELETE FROM crm_actividades WHERE id = ? AND tenant_id = ?",
      [id, tenant_id]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
