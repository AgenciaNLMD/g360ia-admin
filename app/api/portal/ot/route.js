// app/api/portal/ot/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";
import { canUse } from "@/lib/plan-guard";

function getDb(session) {
  const dbName = session?.user?.tenantDbName;
  if (!dbName) throw new Error("Sin base de datos asignada");
  return getTenantDb(dbName);
}

function generarNumeroOT(id) {
  return `OT-${String(id).padStart(5, "0")}`;
}

// ── GET — listar OTs ─────────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const etapa     = searchParams.get("etapa");
  const estado    = searchParams.get("estado");
  const tecnico   = searchParams.get("tecnico_id");
  const buscar    = searchParams.get("q");
  const plan      = session.user.tenantPlan || "free";

  try {
    const db = getDb(session);

    let query = `
      SELECT ot.*,
        c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
        e.nombre AS etapa_nombre, e.color_hex AS etapa_color
      FROM ordenes_trabajo ot
      LEFT JOIN clientes c ON c.id = ot.cliente_id
      LEFT JOIN ot_etapas_config e ON e.id = ot.etapa_actual_id
      WHERE 1=1
    `;
    const params = [];

    // Plan Free: solo ve etapas 1 y 7
    if (!canUse(plan, "ot_etapas_completas")) {
      query += ` AND ot.etapa_actual_id IN (1, 7)`;
    }

    if (etapa)   { query += ` AND ot.etapa_actual_id = ?`;  params.push(etapa); }
    if (estado)  { query += ` AND ot.estado = ?`;           params.push(estado); }
    if (tecnico) { query += ` AND ot.tecnico_id = ?`;       params.push(tecnico); }
    if (buscar) {
      query += ` AND (ot.numero_ot LIKE ? OR c.nombre LIKE ? OR ot.equipo_marca LIKE ? OR ot.equipo_modelo LIKE ?)`;
      const like = `%${buscar}%`;
      params.push(like, like, like, like);
    }

    query += ` ORDER BY ot.creado_en DESC`;

    const [ots] = await db.query(query, params);

    // Obtener etapas config (respetando plan)
    let etapasQuery = `SELECT * FROM ot_etapas_config WHERE activa = 1 ORDER BY orden ASC`;
    const [etapas] = await db.query(etapasQuery);

    return NextResponse.json({ ok: true, ots, etapas });
  } catch (err) {
    console.error("ot GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — crear OT ──────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const {
      cliente_id, tecnico_id,
      equipo_marca, equipo_modelo, equipo_serie, equipo_falla_reportada,
    } = await req.json();

    if (!equipo_falla_reportada) {
      return NextResponse.json({ ok: false, error: "La falla reportada es obligatoria" }, { status: 400 });
    }

    const db = getDb(session);

    // Insertar con número temporal, luego actualizar con ID real
    const [result] = await db.query(
      `INSERT INTO ordenes_trabajo
        (numero_ot, cliente_id, tecnico_id, equipo_marca, equipo_modelo,
         equipo_serie, equipo_falla_reportada, etapa_actual_id, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'abierta')`,
      [
        "TEMP", cliente_id || null, tecnico_id || null,
        equipo_marca || null, equipo_modelo || null,
        equipo_serie || null, equipo_falla_reportada,
      ]
    );

    const id = result.insertId;
    const numero_ot = generarNumeroOT(id);
    await db.query(`UPDATE ordenes_trabajo SET numero_ot = ? WHERE id = ?`, [numero_ot, id]);

    // Registrar en historial
    await db.query(
      `INSERT INTO ot_historial (ot_id, etapa_anterior_id, etapa_nueva_id, nota)
       VALUES (?, NULL, 1, 'OT creada')`,
      [id]
    );

    return NextResponse.json({ ok: true, id, numero_ot });
  } catch (err) {
    console.error("ot POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
