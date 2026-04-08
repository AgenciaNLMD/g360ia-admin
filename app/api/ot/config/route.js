// app/api/ot/config/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb       from "@/lib/modulos-db";

// ── GET — devuelve config (crea default si no existe) ────────────────────────
export async function GET() {
  try {
    const [rows] = await modulosDb.query(
      "SELECT * FROM ot_config LIMIT 1"
    );

    if (!rows.length) {
      await modulosDb.query(
        `INSERT INTO ot_config (modo_numeracion, prefijo, ultimo_numero)
         VALUES ('correlativo', 'OT-', 0)`
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
  try {
    const { modo_numeracion, prefijo } = await req.json();

    await modulosDb.query(
      `UPDATE ot_config
         SET modo_numeracion = ?, prefijo = ?, actualizado_en = NOW()`,
      [modo_numeracion, prefijo]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ot/config PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
