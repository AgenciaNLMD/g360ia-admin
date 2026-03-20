// app/api/integraciones/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// GET /api/integraciones
// Lista integraciones con su estado de token
// ─────────────────────────────────────────────────────────────
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id") || null;

  try {
    const [rows] = await db.query(
      `SELECT
         i.id, i.nombre, i.tipo, i.activo, i.sugerencia_dismisseada,
         t.id         AS token_id,
         t.estado,
         t.wsp_status,
         t.metadata,
         t.error_msg,
         t.conectado_en
       FROM integraciones i
       LEFT JOIN integraciones_tokens t
         ON t.integracion_id = i.id
         AND (
           (? IS NULL AND t.tenant_id IS NULL)
           OR t.tenant_id = ?
         )
       WHERE i.tenant_id IS NULL OR i.tenant_id = ?
       ORDER BY i.id ASC`,
      [tenantId, tenantId, tenantId]
    );

    // Parsear metadata JSON si viene como string
    const integraciones = rows.map(r => ({
      ...r,
      metadata: r.metadata
        ? (typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata)
        : null,
    }));

    return NextResponse.json({ ok: true, integraciones });
  } catch (err) {
    console.error("GET /api/integraciones:", err);
    return NextResponse.json({ ok: false, error: "Error al obtener integraciones" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/integraciones
// Toggle activo / dismiss sugerencia
// ─────────────────────────────────────────────────────────────
export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, activo, sugerencia_dismisseada } = body;

    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const campos = [];
    const vals   = [];

    if (activo !== undefined)                { campos.push("activo = ?");                vals.push(activo); }
    if (sugerencia_dismisseada !== undefined) { campos.push("sugerencia_dismisseada = ?"); vals.push(sugerencia_dismisseada); }

    if (!campos.length) return NextResponse.json({ ok: false, error: "Sin campos" }, { status: 400 });

    vals.push(id);
    await db.query(`UPDATE integraciones SET ${campos.join(", ")} WHERE id = ?`, vals);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/integraciones:", err);
    return NextResponse.json({ ok: false, error: "Error al actualizar" }, { status: 500 });
  }
}
