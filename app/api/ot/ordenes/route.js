// app/api/ot/ordenes/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb       from "@/lib/modulos-db";
import { randomUUID }  from "crypto";

// ── GET — lista de OTs con filtros opcionales ─────────────────────────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const estado    = searchParams.get("estado");
  const prioridad = searchParams.get("prioridad");
  const buscar    = searchParams.get("q");
  const serie     = searchParams.get("serie");

  try {
    let query    = "SELECT * FROM ot_ordenes WHERE 1=1";
    const params = [];

    if (estado) {
      query += " AND estado = ?";
      params.push(estado);
    }
    if (prioridad) {
      query += " AND prioridad = ?";
      params.push(prioridad);
    }
    if (buscar) {
      query += " AND (numero_ot LIKE ? OR cliente_nombre LIKE ? OR equipo_marca LIKE ? OR equipo_modelo LIKE ? OR tecnico_nombre LIKE ?)";
      const like = `%${buscar}%`;
      params.push(like, like, like, like, like);
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
  try {
    const {
      numero_ot,
      cliente_nombre,
      equipo_tipo,
      equipo_marca,
      equipo_modelo,
      equipo_serie,
      problema_reportado,
      foto_url,
      prioridad,
      canal_ingreso,
      entrega_estimada,
      tecnico_nombre,
    } = await req.json();

    if (!numero_ot?.trim())
      return NextResponse.json({ ok: false, error: "El número de OT es obligatorio" }, { status: 400 });
    if (!equipo_tipo?.trim())
      return NextResponse.json({ ok: false, error: "El tipo de equipo es obligatorio" }, { status: 400 });
    if (!problema_reportado?.trim())
      return NextResponse.json({ ok: false, error: "El problema reportado es obligatorio" }, { status: 400 });

    // Verificar unicidad del número de OT
    const [existe] = await modulosDb.query(
      "SELECT id FROM ot_ordenes WHERE numero_ot = ?",
      [numero_ot.trim()]
    );
    if (existe.length) {
      return NextResponse.json({ ok: false, error: "Ya existe una OT con ese número" }, { status: 400 });
    }

    const token_publico = randomUUID();

    const [result] = await modulosDb.query(
      `INSERT INTO ot_ordenes
         (numero_ot, token_publico, cliente_nombre,
          equipo_tipo, equipo_marca, equipo_modelo, equipo_serie,
          problema_reportado, foto_url, estado,
          prioridad, canal_ingreso, entrega_estimada, tecnico_nombre)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'recibido', ?, ?, ?, ?)`,
      [
        numero_ot.trim(),
        token_publico,
        cliente_nombre      || null,
        equipo_tipo.trim(),
        equipo_marca        || null,
        equipo_modelo       || null,
        equipo_serie        || null,
        problema_reportado.trim(),
        foto_url            || null,
        prioridad           || "normal",
        canal_ingreso       || null,
        entrega_estimada    || null,
        tecnico_nombre      || null,
      ]
    );

    // Log de creación
    await modulosDb.query(
      `INSERT INTO ot_log (orden_id, estado_anterior, estado_actual)
       VALUES (?, NULL, 'recibido')`,
      [result.insertId]
    );

    // Incrementar contador correlativo
    await modulosDb.query(
      "UPDATE ot_config SET ultimo_numero = ultimo_numero + 1"
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
