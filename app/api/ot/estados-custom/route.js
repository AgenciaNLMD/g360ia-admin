// app/api/ot/estados-custom/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb       from "@/lib/modulos-db";

// Estados base del sistema — se auto-siembran si la tabla está vacía
const DEFAULTS = [
  { slug: "recibido",       nombre: "Recibido",           orden: 0 },
  { slug: "en_diagnostico", nombre: "En diagnóstico",     orden: 1 },
  { slug: "presupuestado",  nombre: "Presupuestado",       orden: 2 },
  { slug: "aprobado",       nombre: "Aprobado",            orden: 3 },
  { slug: "en_reparacion",  nombre: "En reparación",       orden: 4 },
  { slug: "listo",          nombre: "Listo para retirar",  orden: 5 },
  { slug: "entregado",      nombre: "Entregado",           orden: 6 },
];

// ── GET — listar estados (auto-siembra si vacío) ──────────────────────────────
export async function GET() {
  try {
    let [rows] = await modulosDb.query(
      "SELECT * FROM ot_estados_custom ORDER BY orden ASC, id ASC"
    );

    if (rows.length === 0) {
      for (const d of DEFAULTS) {
        await modulosDb.query(
          "INSERT INTO ot_estados_custom (nombre, color, orden) VALUES (?, ?, ?)",
          [d.slug, "#6b7280", d.orden]
        );
      }
      [rows] = await modulosDb.query(
        "SELECT * FROM ot_estados_custom ORDER BY orden ASC, id ASC"
      );
    }

    return NextResponse.json({ ok: true, estados: rows });
  } catch (err) {
    console.error("ot/estados-custom GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PUT — guardar nuevo orden (drag & drop) ───────────────────────────────────
export async function PUT(req) {
  try {
    const { orden } = await req.json();
    if (!Array.isArray(orden))
      return NextResponse.json({ ok: false, error: "Formato inválido" }, { status: 400 });
    await Promise.all(
      orden.map((id, i) => modulosDb.query(
        "UPDATE ot_estados_custom SET orden = ? WHERE id = ?", [i, id]
      ))
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ot/estados-custom PUT:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — crear estado personalizado (máx 7 total) ───────────────────────────
export async function POST(req) {
  try {
    const { nombre, orden } = await req.json();
    if (!nombre?.trim())
      return NextResponse.json({ ok: false, error: "El nombre es obligatorio" }, { status: 400 });

    const [[{ total }]] = await modulosDb.query(
      "SELECT COUNT(*) AS total FROM ot_estados_custom"
    );
    if (total >= 7)
      return NextResponse.json({ ok: false, error: "Máximo 7 estados" }, { status: 400 });

    const slug = nombre.trim().toLowerCase()
      .replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

    const [result] = await modulosDb.query(
      "INSERT INTO ot_estados_custom (nombre, color, orden) VALUES (?, ?, ?)",
      [slug || nombre.trim(), "#6b7280", orden ?? total]
    );
    const [row] = await modulosDb.query(
      "SELECT * FROM ot_estados_custom WHERE id = ?", [result.insertId]
    );
    return NextResponse.json({ ok: true, estado: row[0] });
  } catch (err) {
    console.error("ot/estados-custom POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
