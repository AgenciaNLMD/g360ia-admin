// app/api/crm/leads/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
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
  const tab    = searchParams.get("tab")    || "sin_tomar";
  const estado = searchParams.get("estado") || null;
  const fuente = searchParams.get("fuente") || null;
  const esAdmin = ["superadmin", "admin"].includes(rol);

  try {
    let query = `
      SELECT
        cl.*,
        u.nombre AS vendedor_nombre,
        u.email  AS vendedor_email,
        cc.id    AS conversacion_id,
        cc.estado AS conv_estado,
        cc.ultimo_mensaje,
        cc.ultimo_mensaje_at,
        DATEDIFF(NOW(), cl.fecha_ultimo_contacto) AS dias_sin_contacto
      FROM crm_leads cl
      LEFT JOIN db_g360ia.usuarios u ON u.id = cl.asignado_a
      LEFT JOIN crm_conversaciones cc ON cc.lead_id = cl.id
        AND cc.estado != 'cerrada'
      WHERE cl.tenant_id = ?
    `;
    const params = [tenant_id];

    if (tab === "sin_tomar") {
      query += ` AND cl.asignado_a IS NULL AND cl.estado = 'nuevo'`;
    } else if (tab === "mis_leads") {
      query += ` AND cl.asignado_a = ?`;
      params.push(usuario_id);
    } else if (tab === "todos" && !esAdmin) {
      query += ` AND (cl.asignado_a = ? OR (cl.asignado_a IS NULL AND cl.estado = 'nuevo'))`;
      params.push(usuario_id);
    }

    if (estado) { query += ` AND cl.estado = ?`;  params.push(estado); }
    if (fuente) { query += ` AND cl.fuente = ?`;  params.push(fuente); }

    query += ` ORDER BY cl.creado_en DESC`;

    const [rows] = await modulosDb.query(query, params);

    // Stats rápidas
    const [[stats]] = await modulosDb.query(`
      SELECT
        COUNT(CASE WHEN estado = 'nuevo'      AND asignado_a IS NULL THEN 1 END) AS sin_tomar,
        COUNT(CASE WHEN estado = 'contactado'                        THEN 1 END) AS contactado,
        COUNT(CASE WHEN estado = 'calificado'                        THEN 1 END) AS calificado,
        COUNT(CASE WHEN estado = 'demo'                              THEN 1 END) AS demo,
        COUNT(CASE WHEN estado = 'propuesta'                         THEN 1 END) AS propuesta,
        COUNT(CASE WHEN estado = 'ganado'
          AND MONTH(actualizado_en) = MONTH(NOW())
          AND YEAR(actualizado_en)  = YEAR(NOW())  THEN 1 END)                   AS ganados_mes,
        COUNT(CASE WHEN estado = 'perdido'                           THEN 1 END) AS perdidos
      FROM crm_leads
      WHERE tenant_id = ?
    `, [tenant_id]);

    return NextResponse.json({ ok: true, leads: rows, stats });
  } catch (err) {
    console.error("crm/leads GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — crear lead ────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { tenant_id, id: creado_por } = session.user;
  if (!tenant_id) return NextResponse.json({ ok: false, error: "Sin tenant" }, { status: 400 });

  try {
    const {
      nombre, empresa, email, telefono, whatsapp,
      fuente, asignado_a, valor_estimado, probabilidad, notas_ia,
    } = await req.json();

    if (!nombre) return NextResponse.json({ ok: false, error: "Nombre obligatorio" }, { status: 400 });

    const [result] = await modulosDb.query(
      `INSERT INTO crm_leads
        (tenant_id, nombre, empresa, email, telefono, whatsapp,
         fuente, asignado_a, valor_estimado, probabilidad, notas_ia, creado_por, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'nuevo')`,
      [
        tenant_id,
        nombre,
        empresa        || null,
        email          || null,
        telefono       || null,
        whatsapp       || null,
        fuente         || "manual",
        asignado_a     || null,
        valor_estimado || null,
        probabilidad   || null,
        notas_ia       || null,
        creado_por,
      ]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("crm/leads POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualizar / tomar lead ─────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { tenant_id, id: usuario_id, rol } = session.user;
  if (!tenant_id) return NextResponse.json({ ok: false, error: "Sin tenant" }, { status: 400 });
  const esAdmin = ["superadmin", "admin"].includes(rol);

  try {
    const body = await req.json();
    const {
      id, nombre, empresa, email, telefono, whatsapp,
      fuente, estado, asignado_a, valor_estimado, probabilidad,
      notas_ia, fecha_proximo_contacto, motivo_perdida, tomar,
    } = body;

    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    // Verificar que el lead pertenece a este tenant
    const [[lead]] = await modulosDb.query(
      "SELECT id, email FROM crm_leads WHERE id = ? AND tenant_id = ?",
      [id, tenant_id]
    );
    if (!lead) return NextResponse.json({ ok: false, error: "Lead no encontrado" }, { status: 404 });

    const campos  = [];
    const valores = [];

    if (tomar) {
      const asignado = esAdmin && asignado_a ? asignado_a : usuario_id;
      campos.push("asignado_a = ?", "estado = 'contactado'",
                  "tomado_en = NOW()", "fecha_ultimo_contacto = NOW()");
      valores.push(asignado);
    } else {
      if (nombre          !== undefined) { campos.push("nombre = ?");                   valores.push(nombre); }
      if (empresa         !== undefined) { campos.push("empresa = ?");                  valores.push(empresa); }
      if (email           !== undefined) { campos.push("email = ?");                    valores.push(email); }
      if (telefono        !== undefined) { campos.push("telefono = ?");                 valores.push(telefono); }
      if (whatsapp        !== undefined) { campos.push("whatsapp = ?");                 valores.push(whatsapp); }
      if (fuente          !== undefined) { campos.push("fuente = ?");                   valores.push(fuente); }
      if (asignado_a      !== undefined) { campos.push("asignado_a = ?");               valores.push(asignado_a); }
      if (valor_estimado  !== undefined) { campos.push("valor_estimado = ?");           valores.push(valor_estimado); }
      if (probabilidad    !== undefined) { campos.push("probabilidad = ?");             valores.push(probabilidad); }
      if (notas_ia        !== undefined) { campos.push("notas_ia = ?");                 valores.push(notas_ia); }
      if (motivo_perdida  !== undefined) { campos.push("motivo_perdida = ?");           valores.push(motivo_perdida); }
      if (fecha_proximo_contacto !== undefined) {
        campos.push("fecha_proximo_contacto = ?");
        valores.push(fecha_proximo_contacto);
      }
      if (estado !== undefined) {
        campos.push("estado = ?");
        valores.push(estado);
        if (["contactado","calificado","demo","propuesta"].includes(estado)) {
          campos.push("fecha_ultimo_contacto = NOW()");
        }
        // Conversión: lead ganado → crear contacto
        if (estado === "ganado" && lead.email) {
          const [existe] = await modulosDb.query(
            "SELECT id FROM crm_contactos WHERE email = ? AND tenant_id = ?",
            [lead.email, tenant_id]
          );
          if (!existe.length) {
            const [[leadFull]] = await modulosDb.query(
              "SELECT * FROM crm_leads WHERE id = ?", [id]
            );
            await modulosDb.query(
              `INSERT INTO crm_contactos
                (tenant_id, lead_id, nombre, empresa, email, telefono, whatsapp, fuente, creado_por)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                tenant_id,
                id,
                leadFull.nombre,
                leadFull.empresa || null,
                leadFull.email,
                leadFull.telefono || null,
                leadFull.whatsapp || null,
                leadFull.fuente   || null,
                usuario_id,
              ]
            );
          }
        }
      }
    }

    if (!campos.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });

    valores.push(id, tenant_id);
    await modulosDb.query(
      `UPDATE crm_leads SET ${campos.join(", ")} WHERE id = ? AND tenant_id = ?`,
      valores
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("crm/leads PATCH:", err);
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
    await modulosDb.query("DELETE FROM crm_leads WHERE id = ? AND tenant_id = ?", [id, tenant_id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
