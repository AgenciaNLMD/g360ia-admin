import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import rubrosDb from "@/lib/rubros-db";

function guardAdmin(session) {
  return session?.user?.rol === "superadmin";
}

// GET /api/adm-rubros/plan-herramientas?rubro_id=1
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const rubro_id = searchParams.get("rubro_id");
  if (!rubro_id) return NextResponse.json({ ok: false, error: "Falta rubro_id" }, { status: 400 });

  const [rows] = await rubrosDb.query(
    "SELECT modulo_id, plan, herramienta FROM rubros_plan_herramientas WHERE rubro_id = ?",
    [rubro_id]
  );
  return NextResponse.json({ ok: true, herramientas: rows });
}

// POST /api/adm-rubros/plan-herramientas
// body: { rubro_id, modulo_id, plan, herramientas: ["crm_leads", "crm_contactos"] }
// Reemplaza todas las herramientas del plan para ese rubro+módulo
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { rubro_id, modulo_id, plan, herramientas } = await request.json();
  if (!rubro_id || !modulo_id || !plan || !Array.isArray(herramientas))
    return NextResponse.json({ ok: false, error: "Faltan campos requeridos" }, { status: 400 });

  // Borrar las existentes para este rubro+módulo+plan y reinsertar
  await rubrosDb.query(
    "DELETE FROM rubros_plan_herramientas WHERE rubro_id = ? AND modulo_id = ? AND plan = ?",
    [rubro_id, modulo_id, plan]
  );

  if (herramientas.length > 0) {
    const values = herramientas.map(h => [rubro_id, modulo_id, plan, h]);
    await rubrosDb.query(
      "INSERT INTO rubros_plan_herramientas (rubro_id, modulo_id, plan, herramienta) VALUES ?",
      [values]
    );
  }

  return NextResponse.json({ ok: true });
}
