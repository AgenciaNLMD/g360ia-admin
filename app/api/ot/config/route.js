// app/api/ot/config/route.js
export const dynamic = "force-dynamic";

import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }     from "@/lib/auth";
import modulosDb           from "@/lib/modulos-db";

function unauth() {
  return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
}

// ── GET — devuelve config del tenant (crea default si no existe) ─────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return unauth();
  const { tenant_id } = session.user;

  try {
    const [rows] = await modulosDb.query(
      "SELECT * FROM ot_config WHERE tenant_id = ? LIMIT 1",
      [tenant_id]
    );

    if (!rows.length) {
      await modulosDb.query(
        `INSERT INTO ot_config (tenant_id, modo_numeracion, prefijo, ultimo_numero)
         VALUES (?, 'correlativo', 'OT-', 0)`,
        [tenant_id]
      );
      return NextResponse.json({
        ok: true,
        config: { modo_numeracion: "correlativo", prefijo: "OT-", ultimo_numero: 0 },
      });
    }

    return NextResponse.json({ ok: true, config: rows[0] });
  } catch (err) {
    console.error("ot/config GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualiza modo y prefijo ─────────────────────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauth();
  const { tenant_id } = session.user;

  try {
    const { modo_numeracion, prefijo } = await req.json();

    await modulosDb.query(
      `UPDATE ot_config
         SET modo_numeracion = ?, prefijo = ?, actualizado_en = NOW()
       WHERE tenant_id = ?`,
      [modo_numeracion, prefijo, tenant_id]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ot/config PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
