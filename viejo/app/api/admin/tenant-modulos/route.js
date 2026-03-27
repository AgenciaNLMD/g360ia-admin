// app/api/admin/tenant-modulos/route.js
// Gestión de módulos activos por tenant.
// GET    ?tenant_id=X          → lista módulos activos + catálogo completo
// POST   { tenant_id, modulo } → activa el módulo (crea tablas en DB tenant)
// DELETE { tenant_id, modulo } → marca módulo como inactivo (NO elimina tablas)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { activarModulo, MODULOS_CATALOG, modulosRecomendados } from "@/lib/module-activator";

function unauth() {
  return NextResponse.json({ ok: false, error: "Sin autorización" }, { status: 401 });
}

// ── GET ────────────────────────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauth();

  const { searchParams } = new URL(req.url);
  const tenant_id = searchParams.get("tenant_id");
  if (!tenant_id) {
    return NextResponse.json({ ok: false, error: "tenant_id requerido" }, { status: 400 });
  }

  // Datos del tenant
  const [tenants] = await db.query(
    "SELECT id, nombre, rubro, plan, db_name FROM tenants WHERE id = ?",
    [tenant_id]
  );
  if (!tenants.length) {
    return NextResponse.json({ ok: false, error: "Tenant no encontrado" }, { status: 404 });
  }
  const tenant = tenants[0];

  // Módulos activos en core DB
  const [activos] = await db.query(
    "SELECT modulo, activado_en, activo FROM tenant_modulos WHERE tenant_id = ?",
    [tenant_id]
  );
  const activosMap = Object.fromEntries(activos.map(r => [r.modulo, r]));

  // Armar catálogo completo con estado
  const catalogo = Object.entries(MODULOS_CATALOG).map(([id, meta]) => ({
    id,
    ...meta,
    activo:       activosMap[id]?.activo === 1,
    activado_en:  activosMap[id]?.activado_en || null,
    disponible:   esDisponible(meta.plan_minimo, tenant.plan),
  }));

  // Módulos recomendados para este rubro/plan
  const recomendados = modulosRecomendados(tenant.rubro, tenant.plan).map(m => m.id);

  return NextResponse.json({ ok: true, tenant, catalogo, recomendados });
}

// ── POST: activar módulo ────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauth();

  const body = await req.json();
  const { tenant_id, modulo } = body;

  if (!tenant_id || !modulo) {
    return NextResponse.json({ ok: false, error: "tenant_id y modulo son requeridos" }, { status: 400 });
  }
  if (!MODULOS_CATALOG[modulo]) {
    return NextResponse.json({ ok: false, error: "Módulo inválido" }, { status: 400 });
  }

  // Obtener DB del tenant
  const [tenants] = await db.query(
    "SELECT id, nombre, plan, db_name FROM tenants WHERE id = ?",
    [tenant_id]
  );
  if (!tenants.length) {
    return NextResponse.json({ ok: false, error: "Tenant no encontrado" }, { status: 404 });
  }
  const tenant = tenants[0];

  if (!tenant.db_name) {
    return NextResponse.json({ ok: false, error: "El tenant no tiene base de datos asignada" }, { status: 400 });
  }

  // Verificar plan mínimo
  const meta = MODULOS_CATALOG[modulo];
  if (!esDisponible(meta.plan_minimo, tenant.plan)) {
    return NextResponse.json({
      ok: false,
      error: `Este módulo requiere plan ${meta.plan_minimo}. El tenant tiene plan ${tenant.plan}.`
    }, { status: 403 });
  }

  try {
    // Crear tablas en DB tenant
    await activarModulo(tenant.db_name, modulo);

    // Registrar en core DB
    await db.query(
      `INSERT INTO tenant_modulos (tenant_id, modulo, activo, activado_por)
       VALUES (?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE activo = 1, activado_en = NOW(), activado_por = ?`,
      [tenant_id, modulo, session.user?.id || null, session.user?.id || null]
    );

    return NextResponse.json({
      ok: true,
      mensaje: `Módulo "${meta.label}" activado correctamente en ${tenant.nombre}.`
    });
  } catch (err) {
    console.error("Error activando módulo:", err);
    return NextResponse.json({
      ok: false,
      error: `Error al crear tablas: ${err.message}`
    }, { status: 500 });
  }
}

// ── DELETE: desactivar módulo ───────────────────────────────────────
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauth();

  const body = await req.json();
  const { tenant_id, modulo } = body;

  if (!tenant_id || !modulo) {
    return NextResponse.json({ ok: false, error: "tenant_id y modulo son requeridos" }, { status: 400 });
  }

  await db.query(
    "UPDATE tenant_modulos SET activo = 0 WHERE tenant_id = ? AND modulo = ?",
    [tenant_id, modulo]
  );

  return NextResponse.json({ ok: true, mensaje: "Módulo desactivado. Las tablas no fueron eliminadas." });
}

// ── Helper ──────────────────────────────────────────────────────────
const PLAN_ORDER = ["free", "pro", "business", "ia"];
function esDisponible(plan_minimo, plan_tenant) {
  return PLAN_ORDER.indexOf(plan_minimo) <= PLAN_ORDER.indexOf(plan_tenant);
}
