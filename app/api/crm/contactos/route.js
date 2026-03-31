// app/api/crm/contactos/route.js
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

  const { tenant_id } = session.user;
  if (!tenant_id) return NextResponse.json({ ok: false, error: "Sin tenant" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const buscar = searchParams.get("q") || null;

  try {
    let query = `
      SELECT
        cc.*,
        u.nombre AS creador_nombre
      FROM crm_contactos cc
      LEFT JOIN db_g360ia.usuarios u ON u.id = cc.creado_por
      WHERE cc.tenant_id = ? AND cc.activo = 1
    `;
    const params = [tenant_id];

    if (buscar) {
      query += ` AND (cc.nombre LIKE ? OR cc.apellido LIKE ? OR cc.email LIKE ? OR cc.empresa LIKE ?)`;
      const like = `%${buscar}%`;
      params.push(like, like, like, like);
    }

    query += ` ORDER BY cc.creado_en DESC`;

    const [rows] = await modulosDb.query(query, params);
    return NextResponse.json({ ok: true, contactos: rows });
  } catch (err) {
    console.error("crm/contactos GET:", err);
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
      lead_id, nombre, apellido, email, telefono, whatsapp,
      empresa, cargo, fuente, etiquetas, notas, score_ia,
    } = await req.json();

    if (!nombre) return NextResponse.json({ ok: false, error: "Nombre obligatorio" }, { status: 400 });

    const [result] = await modulosDb.query(
      `INSERT INTO crm_contactos
        (tenant_id, lead_id, nombre, apellido, email, telefono, whatsapp,
         empresa, cargo, fuente, etiquetas, notas, score_ia, creado_por, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        tenant_id,
        lead_id   || null,
        nombre,
        apellido  || null,
        email     || null,
        telefono  || null,
        whatsapp  || null,
        empresa   || null,
        cargo     || null,
        fuente    || null,
        etiquetas ? JSON.stringify(etiquetas) : null,
        notas     || null,
        score_ia  || null,
        creado_por,
      ]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("crm/contactos POST:", err);
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
    const {
      id, nombre, apellido, email, telefono, whatsapp,
      empresa, cargo, fuente, etiquetas, notas, score_ia, activo,
    } = await req.json();

    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const campos  = [];
    const valores = [];

    if (nombre    !== undefined) { campos.push("nombre = ?");    valores.push(nombre); }
    if (apellido  !== undefined) { campos.push("apellido = ?");  valores.push(apellido); }
    if (email     !== undefined) { campos.push("email = ?");     valores.push(email); }
    if (telefono  !== undefined) { campos.push("telefono = ?");  valores.push(telefono); }
    if (whatsapp  !== undefined) { campos.push("whatsapp = ?");  valores.push(whatsapp); }
    if (empresa   !== undefined) { campos.push("empresa = ?");   valores.push(empresa); }
    if (cargo     !== undefined) { campos.push("cargo = ?");     valores.push(cargo); }
    if (fuente    !== undefined) { campos.push("fuente = ?");    valores.push(fuente); }
    if (etiquetas !== undefined) { campos.push("etiquetas = ?"); valores.push(JSON.stringify(etiquetas)); }
    if (notas     !== undefined) { campos.push("notas = ?");     valores.push(notas); }
    if (score_ia  !== undefined) { campos.push("score_ia = ?");  valores.push(score_ia); }
    if (activo    !== undefined) { campos.push("activo = ?");    valores.push(activo ? 1 : 0); }

    if (!campos.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });

    valores.push(id, tenant_id);
    await modulosDb.query(
      `UPDATE crm_contactos SET ${campos.join(", ")} WHERE id = ? AND tenant_id = ?`,
      valores
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("crm/contactos PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
