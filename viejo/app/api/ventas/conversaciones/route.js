// app/api/ventas/conversaciones/route.js
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
  const rol        = session.user.rol;
  const usuario_id = session.user.id;
  const estado     = searchParams.get("estado") || null;
  const canal      = searchParams.get("canal")  || null;

  try {
    let query = `
      SELECT
        vc.*,
        u.nombre   AS vendedor_nombre,
        u.email    AS vendedor_email,
        vl.nombre  AS lead_nombre,
        vl.empresa AS lead_empresa,
        vl.rubro_interes,
        vl.plan_interes,
        vl.sitio_web,
        vl.instagram,
        vl.facebook,
        vl.ubicacion,
        vl.estado  AS lead_estado,
        vl.fuente  AS lead_fuente
      FROM ventas_conversaciones vc
      LEFT JOIN usuarios u     ON vc.asignado_a = u.id
      LEFT JOIN ventas_leads vl ON vc.lead_id   = vl.id
      WHERE 1=1
    `;
    const params = [];

    // Vendedor solo ve sus conversaciones
    if (!["superadmin","admin"].includes(rol)) {
      query += ` AND vc.asignado_a = ?`;
      params.push(usuario_id);
    }

    if (estado && estado !== "todas") { query += ` AND vc.estado = ?`;  params.push(estado); }
    if (canal  && canal  !== "todos") { query += ` AND vc.canal = ?`;   params.push(canal); }

    query += ` ORDER BY vc.actualizado_en DESC`;

    const [rows] = await db.query(query, params);
    return NextResponse.json({ ok: true, conversaciones: rows });
  } catch (err) {
    console.error("conversaciones GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — crear conversación ────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const {
      lead_id, canal, contacto_nombre,
      contacto_telefono, contacto_email, asignado_a,
    } = await req.json();

    const [result] = await db.query(
      `INSERT INTO ventas_conversaciones
        (lead_id, canal, contacto_nombre, contacto_telefono, contacto_email, asignado_a, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'nueva')`,
      [
        lead_id           || null,
        canal             || "whatsapp",
        contacto_nombre   || null,
        contacto_telefono || null,
        contacto_email    || null,
        asignado_a        || null,
      ]
    );
    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("conversaciones POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualizar conversación ─────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { id, asignado_a, estado, lead_id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const campos  = [];
    const valores = [];

    if (asignado_a !== undefined) { campos.push("asignado_a = ?"); valores.push(asignado_a); }
    if (estado     !== undefined) { campos.push("estado = ?");     valores.push(estado); }
    if (lead_id    !== undefined) { campos.push("lead_id = ?");    valores.push(lead_id); }

    if (!campos.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });

    valores.push(id);
    await db.query(`UPDATE ventas_conversaciones SET ${campos.join(", ")} WHERE id = ?`, valores);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("conversaciones PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
