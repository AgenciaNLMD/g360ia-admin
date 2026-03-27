// app/api/portal/catalogo/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";

function getDb(session) {
  return getTenantDb(session?.user?.tenantDbName);
}

// ── GET — listar catálogo ────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tipo     = searchParams.get("tipo");
  const activo   = searchParams.get("activo");
  const buscar   = searchParams.get("q");
  const categoria = searchParams.get("categoria");

  try {
    const db = getDb(session);
    let query = `
      SELECT c.*, inv.stock_actual, inv.stock_minimo
      FROM catalogo c
      LEFT JOIN inventario inv ON inv.catalogo_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (tipo)     { query += ` AND c.tipo = ?`;       params.push(tipo); }
    if (categoria){ query += ` AND c.categoria = ?`;  params.push(categoria); }
    if (activo !== null && activo !== undefined) {
      query += ` AND c.activo = ?`;
      params.push(activo === "true" || activo === "1" ? 1 : 0);
    }
    if (buscar) {
      query += ` AND (c.nombre LIKE ? OR c.sku LIKE ? OR c.descripcion LIKE ?)`;
      const like = `%${buscar}%`;
      params.push(like, like, like);
    }

    query += ` ORDER BY c.nombre ASC`;
    const [rows] = await db.query(query, params);
    return NextResponse.json({ ok: true, items: rows });
  } catch (err) {
    console.error("catalogo GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — crear ítem ────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { tipo, nombre, descripcion, sku, precio_costo, precio_venta, unidad, categoria } = await req.json();
    if (!nombre) return NextResponse.json({ ok: false, error: "Nombre obligatorio" }, { status: 400 });

    const db = getDb(session);
    const [result] = await db.query(
      `INSERT INTO catalogo (tipo, nombre, descripcion, sku, precio_costo, precio_venta, unidad, categoria)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo || "producto", nombre, descripcion || null, sku || null,
       precio_costo || 0, precio_venta || 0, unidad || "unidad", categoria || null]
    );

    const id = result.insertId;

    // Si es producto, crear registro de inventario
    if ((tipo || "producto") === "producto") {
      await db.query(
        `INSERT INTO inventario (catalogo_id, stock_actual, stock_minimo) VALUES (?, 0, 0)`,
        [id]
      );
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("catalogo POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualizar ítem ──────────────────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const CAMPOS = ["tipo","nombre","descripcion","sku","precio_costo","precio_venta","unidad","categoria","activo"];
    const sets = [];
    const vals = [];
    for (const c of CAMPOS) {
      if (c in data) { sets.push(`${c} = ?`); vals.push(data[c]); }
    }
    if (!sets.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });

    vals.push(id);
    const db = getDb(session);
    await db.query(`UPDATE catalogo SET ${sets.join(", ")} WHERE id = ?`, vals);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("catalogo PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
