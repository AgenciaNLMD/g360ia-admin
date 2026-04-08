// app/api/ot/estados-custom/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb       from "@/lib/modulos-db";

// ── GET — listar estados personalizados ───────────────────────────────────────
export async function GET() {
  try {
    const [rows] = await modulosDb.query(
      "SELECT * FROM ot_estados_custom ORDER BY orden ASC, id ASC"
    );
    return NextResponse.json({ ok: true, estados: rows });
  } catch (err) {
    console.error("ot/estados-custom GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — crear estado personalizado ────────────────────────────────────────
export async function POST(req) {
  try {
    const { nombre, color, orden } = await req.json();
    if (!nombre?.trim())
      return NextResponse.json({ ok: false, error: "El nombre es obligatorio" }, { status: 400 });

    const [result] = await modulosDb.query(
      "INSERT INTO ot_estados_custom (nombre, color, orden) VALUES (?, ?, ?)",
      [nombre.trim(), color || "#6b7280", orden ?? 0]
    );
    const [row] = await modulosDb.query(
      "SELECT * FROM ot_estados_custom WHERE id = ?",
      [result.insertId]
    );
    return NextResponse.json({ ok: true, estado: row[0] });
  } catch (err) {
    console.error("ot/estados-custom POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
