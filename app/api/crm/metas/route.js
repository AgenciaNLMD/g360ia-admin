// app/api/crm/metas/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modulosDb from "@/lib/modulos-db";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
}

// ── GET — metas del tenant (mes actual por defecto) ─────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { tenant_id } = session.user;
  if (!tenant_id) return NextResponse.json({ ok: false, error: "Sin tenant" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const now  = new Date();
  const mes  = Number(searchParams.get("mes")  || now.getMonth() + 1);
  const anio = Number(searchParams.get("anio") || now.getFullYear());

  try {
    const [rows] = await modulosDb.query(
      `SELECT cm.*, u.nombre AS vendedor_nombre
       FROM crm_metas cm
       LEFT JOIN db_g360ia.usuarios u ON u.id = cm.usuario_id
       WHERE cm.tenant_id = ? AND cm.mes = ? AND cm.anio = ?
       ORDER BY u.nombre ASC`,
      [tenant_id, mes, anio]
    );

    return NextResponse.json({ ok: true, metas: rows, mes, anio });
  } catch (err) {
    console.error("crm/metas GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST / UPSERT — crear o actualizar meta ─────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (!["superadmin", "admin"].includes(session.user.rol)) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const { tenant_id } = session.user;
  if (!tenant_id) return NextResponse.json({ ok: false, error: "Sin tenant" }, { status: 400 });

  try {
    const { usuario_id, mes, anio, meta_leads, meta_cierres, meta_valor } = await req.json();

    if (!usuario_id || !mes || !anio) {
      return NextResponse.json({ ok: false, error: "Faltan campos obligatorios" }, { status: 400 });
    }

    await modulosDb.query(
      `INSERT INTO crm_metas (tenant_id, usuario_id, mes, anio, meta_leads, meta_cierres, meta_valor)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         meta_leads   = VALUES(meta_leads),
         meta_cierres = VALUES(meta_cierres),
         meta_valor   = VALUES(meta_valor)`,
      [
        tenant_id,
        usuario_id,
        mes,
        anio,
        meta_leads   || 0,
        meta_cierres || 0,
        meta_valor   || 0,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("crm/metas POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
