// app/api/portal/inventario/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";

function getDb(session) {
  return getTenantDb(session?.user?.tenantDbName);
}

// ── GET — estado de inventario ───────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const catalogo_id = searchParams.get("catalogo_id");
  const alerta      = searchParams.get("alerta"); // solo items con stock bajo

  try {
    const db = getDb(session);

    if (catalogo_id) {
      const [movs] = await db.query(
        `SELECT m.*, c.nombre AS producto FROM inventario_movimientos m
         JOIN catalogo c ON c.id = m.catalogo_id
         WHERE m.catalogo_id = ? ORDER BY m.creado_en DESC LIMIT 100`,
        [catalogo_id]
      );
      return NextResponse.json({ ok: true, movimientos: movs });
    }

    let query = `
      SELECT i.*, c.nombre, c.sku, c.categoria, c.precio_venta,
        CASE
          WHEN i.stock_actual = 0 THEN 'sin_stock'
          WHEN i.stock_actual <= i.stock_minimo THEN 'bajo'
          ELSE 'ok'
        END AS estado_stock
      FROM inventario i
      JOIN catalogo c ON c.id = i.catalogo_id
      WHERE c.activo = 1
    `;
    const params = [];

    if (alerta === "1") {
      query += ` AND i.stock_actual <= i.stock_minimo`;
    }

    query += ` ORDER BY estado_stock ASC, c.nombre ASC`;
    const [rows] = await db.query(query, params);

    const alertas = rows.filter(r => r.estado_stock !== "ok").length;
    return NextResponse.json({ ok: true, inventario: rows, alertas });
  } catch (err) {
    console.error("inventario GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — registrar movimiento de stock ─────────────────────────
export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { catalogo_id, tipo, cantidad, origen, origen_id, nota } = await req.json();

    if (!catalogo_id || !tipo || !cantidad) {
      return NextResponse.json({ ok: false, error: "catalogo_id, tipo y cantidad son requeridos" }, { status: 400 });
    }

    const db = getDb(session);

    // Obtener stock actual
    const [[inv]] = await db.query(
      `SELECT stock_actual FROM inventario WHERE catalogo_id = ?`, [catalogo_id]
    );
    if (!inv) return NextResponse.json({ ok: false, error: "Producto no encontrado en inventario" }, { status: 404 });

    let nuevo_stock = Number(inv.stock_actual);
    if (["entrada", "liberacion", "ajuste"].includes(tipo)) {
      nuevo_stock += Number(cantidad);
    } else if (["salida", "reserva"].includes(tipo)) {
      nuevo_stock -= Number(cantidad);
      if (nuevo_stock < 0) nuevo_stock = 0;
    }

    // Actualizar stock
    await db.query(
      `UPDATE inventario SET stock_actual = ? WHERE catalogo_id = ?`,
      [nuevo_stock, catalogo_id]
    );

    // Registrar movimiento
    await db.query(
      `INSERT INTO inventario_movimientos
        (catalogo_id, tipo, cantidad, stock_resultante, origen, origen_id, nota)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [catalogo_id, tipo, cantidad, nuevo_stock, origen || "ajuste_manual", origen_id || null, nota || null]
    );

    return NextResponse.json({ ok: true, stock_actual: nuevo_stock });
  } catch (err) {
    console.error("inventario POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualizar stock mínimo ─────────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { catalogo_id, stock_minimo } = await req.json();
    if (!catalogo_id) return NextResponse.json({ ok: false, error: "Falta catalogo_id" }, { status: 400 });

    const db = getDb(session);
    await db.query(
      `UPDATE inventario SET stock_minimo = ? WHERE catalogo_id = ?`,
      [stock_minimo || 0, catalogo_id]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
