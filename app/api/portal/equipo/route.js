// app/api/portal/equipo/route.js
// Gestión del equipo técnico — reutiliza g360ia.usuarios + tecnicos_perfil en DB tenant
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";
import db from "@/lib/db";

function getTDb(session) {
  return getTenantDb(session?.user?.tenantDbName);
}

// ── GET — listar técnicos con carga de trabajo ───────────────────
export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const tenantDb  = getTDb(session);
    const tenant_id = session.user.tenantId;

    // Obtener perfiles de técnicos del tenant
    const [perfiles] = await tenantDb.query(
      `SELECT * FROM tecnicos_perfil WHERE activo = 1`
    );

    // Obtener datos de usuarios desde la DB core (g360ia)
    // Solo usuarios del mismo tenant aprobados con rol tecnico/admin
    let tecnicos = [];
    if (perfiles.length > 0) {
      const usuario_ids = perfiles.map(p => p.usuario_id);
      const placeholders = usuario_ids.map(() => "?").join(",");
      const [usuarios] = await db.query(
        `SELECT id, nombre, email, rol, status FROM usuarios WHERE id IN (${placeholders})`,
        usuario_ids
      );
      // Merge perfil + usuario
      tecnicos = perfiles.map(p => {
        const usr = usuarios.find(u => u.id === p.usuario_id) || {};
        return { ...p, ...usr, perfil_id: p.id };
      });
    }

    // Cargar de trabajo por técnico (OTs abiertas)
    const [carga] = await tenantDb.query(`
      SELECT ot.tecnico_id, e.nombre AS etapa, COUNT(*) AS cantidad
      FROM ordenes_trabajo ot
      JOIN ot_etapas_config e ON e.id = ot.etapa_actual_id
      WHERE ot.estado = 'abierta' AND ot.tecnico_id IS NOT NULL
      GROUP BY ot.tecnico_id, e.nombre
    `);

    return NextResponse.json({ ok: true, tecnicos, carga });
  } catch (err) {
    console.error("equipo GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — agregar técnico al equipo del tenant ──────────────────
export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { usuario_id, especialidad, telefono, notas } = await req.json();
    if (!usuario_id) return NextResponse.json({ ok: false, error: "usuario_id requerido" }, { status: 400 });

    const tenantDb = getTDb(session);
    const [result] = await tenantDb.query(
      `INSERT INTO tecnicos_perfil (usuario_id, especialidad, telefono, notas)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE especialidad=VALUES(especialidad), telefono=VALUES(telefono),
         notas=VALUES(notas), activo=1`,
      [usuario_id, especialidad || null, telefono || null, notas || null]
    );
    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("equipo POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualizar perfil de técnico ────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { id, especialidad, telefono, notas, activo } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const sets = [];
    const vals = [];
    if (especialidad !== undefined) { sets.push("especialidad = ?"); vals.push(especialidad); }
    if (telefono !== undefined)     { sets.push("telefono = ?");     vals.push(telefono); }
    if (notas !== undefined)        { sets.push("notas = ?");        vals.push(notas); }
    if (activo !== undefined)       { sets.push("activo = ?");       vals.push(activo ? 1 : 0); }

    if (!sets.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });
    vals.push(id);

    const tenantDb = getTDb(session);
    await tenantDb.query(`UPDATE tecnicos_perfil SET ${sets.join(", ")} WHERE id = ?`, vals);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
