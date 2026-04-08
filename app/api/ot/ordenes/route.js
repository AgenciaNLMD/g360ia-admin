// app/api/ot/ordenes/route.js
export const dynamic = "force-dynamic";

import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }     from "@/lib/auth";
import modulosDb           from "@/lib/modulos-db";
import { randomUUID }      from "crypto";

function unauth() {
  return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
}

// ── GET — lista de OTs con filtros opcionales ─────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauth();
  const { tenant_id } = session.user;

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado");
  const buscar = searchParams.get("q");
  const serie  = searchParams.get("serie");

  try {
    let query  = "SELECT * FROM ot_ordenes WHERE tenant_id = ?";
    const params = [tenant_id];

    if (estado) {
      query += " AND estado = ?";
      params.push(estado);
    }
    if (buscar) {
      query += " AND (numero_ot LIKE ? OR equipo_marca LIKE ? OR equipo_modelo LIKE ?)";
      const like = `%${buscar}%`;
      params.push(like, like, like);
    }
    if (serie) {
      query += " AND (equipo_serie LIKE ? OR equipo_modelo LIKE ? OR equipo_marca LIKE ?)";
      const like = `%${serie}%`;
      params.push(like, like, like);
    }

    query += " ORDER BY creado_en DESC";

    const [rows] = await modulosDb.query(query, params);
    return NextResponse.json({ ok: true, ordenes: rows });
  } catch (err) {
    console.error("ot/ordenes GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — crear nueva OT ─────────────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauth();
  const { tenant_id, id: creado_por } = session.user;

  try {
    const {
      numero_ot,
      cliente_id,
      equipo_tipo,
      equipo_marca,
      equipo_modelo,
      equipo_serie,
      problema_reportado,
      foto_url,
    } = await req.json();

    // Validaciones
    if (!numero_ot?.trim())
      return NextResponse.json({ ok: false, error: "El número de OT es obligatorio" }, { status: 400 });
    if (!equipo_tipo?.trim())
      return NextResponse.json({ ok: false, error: "El tipo de equipo es obligatorio" }, { status: 400 });
    if (!problema_reportado?.trim())
      return NextResponse.json({ ok: false, error: "El problema reportado es obligatorio" }, { status: 400 });

    // Verificar unicidad del número de OT por tenant
    const [existe] = await modulosDb.query(
      "SELECT id FROM ot_ordenes WHERE tenant_id = ? AND numero_ot = ?",
      [tenant_id, numero_ot.trim()]
    );
    if (existe.length) {
      return NextResponse.json({ ok: false, error: "Ya existe una OT con ese número" }, { status: 400 });
    }

    const token_publico = randomUUID();

    const [result] = await modulosDb.query(
      `INSERT INTO ot_ordenes
         (tenant_id, numero_ot, token_publico, cliente_id,
          equipo_tipo, equipo_marca, equipo_modelo, equipo_serie,
          problema_reportado, foto_url, estado, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recibido', ?)`,
      [
        tenant_id,
        numero_ot.trim(),
        token_publico,
        cliente_id     || null,
        equipo_tipo.trim(),
        equipo_marca   || null,
        equipo_modelo  || null,
        equipo_serie   || null,
        problema_reportado.trim(),
        foto_url       || null,
        creado_por,
      ]
    );

    // Log de creación
    await modulosDb.query(
      `INSERT INTO ot_log (tenant_id, orden_id, estado_anterior, estado_actual, usuario_id)
       VALUES (?, ?, NULL, 'recibido', ?)`,
      [tenant_id, result.insertId, creado_por]
    );

    // Incrementar contador correlativo
    await modulosDb.query(
      "UPDATE ot_config SET ultimo_numero = ultimo_numero + 1 WHERE tenant_id = ?",
      [tenant_id]
    );

    const [nueva] = await modulosDb.query(
      "SELECT * FROM ot_ordenes WHERE id = ?",
      [result.insertId]
    );

    return NextResponse.json({ ok: true, orden: nueva[0] });
  } catch (err) {
    console.error("ot/ordenes POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
