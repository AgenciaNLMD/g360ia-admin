// app/api/ot/estados-custom/[id]/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb       from "@/lib/modulos-db";

// ── DELETE — eliminar estado personalizado ────────────────────────────────────
export async function DELETE(_req, { params }) {
  const id = parseInt(params.id);
  if (!id) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  try {
    await modulosDb.query("DELETE FROM ot_estados_custom WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ot/estados-custom DELETE:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
