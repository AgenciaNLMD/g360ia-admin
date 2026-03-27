// app/api/portal/ventas/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";

function getDb(session) {
  return getTenantDb(session?.user?.tenantDbName);
}

function generarNumeroVenta(id) {
  return `V-${String(id).padStart(6, "0")}`;
}

// ── GET — listar ventas ──────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const estado_pago  = searchParams.get("estado_pago");
  const estado_factu = searchParams.get("estado_facturacion");
  const cliente_id   = searchParams.get("cliente_id");
  const desde        = searchParams.get("desde");
  const hasta        = searchParams.get("hasta");
  const id           = searchParams.get("id");

  try {
    const db = getDb(session);

    if (id) {
      const [[venta]] = await db.query(`
        SELECT v.*, c.nombre AS cliente_nombre, c.cuit, c.condicion_fiscal
        FROM ventas v
        LEFT JOIN clientes c ON c.id = v.cliente_id
        WHERE v.id = ?`, [id]);
      if (!venta) return NextResponse.json({ ok: false, error: "No encontrada" }, { status: 404 });

      const [items] = await db.query(
        `SELECT vi.*, cat.nombre AS catalogo_nombre
         FROM ventas_items vi
         LEFT JOIN catalogo cat ON cat.id = vi.catalogo_id
         WHERE vi.venta_id = ?`, [id]
      );
      const [cobros] = await db.query(
        `SELECT * FROM cobros WHERE venta_id = ? ORDER BY creado_en DESC`, [id]
      );
      return NextResponse.json({ ok: true, venta, items, cobros });
    }

    let query = `
      SELECT v.*, c.nombre AS cliente_nombre
      FROM ventas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE 1=1
    `;
    const params = [];

    if (estado_pago)  { query += ` AND v.estado_pago = ?`;        params.push(estado_pago); }
    if (estado_factu) { query += ` AND v.estado_facturacion = ?`;  params.push(estado_factu); }
    if (cliente_id)   { query += ` AND v.cliente_id = ?`;          params.push(cliente_id); }
    if (desde)        { query += ` AND DATE(v.creado_en) >= ?`;    params.push(desde); }
    if (hasta)        { query += ` AND DATE(v.creado_en) <= ?`;    params.push(hasta); }

    query += ` ORDER BY v.creado_en DESC`;

    const [rows] = await db.query(query, params);
    return NextResponse.json({ ok: true, ventas: rows });
  } catch (err) {
    console.error("ventas GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — crear venta ───────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { cliente_id, origen, origen_id, items, descuento, notas } = await req.json();
    if (!items?.length) return NextResponse.json({ ok: false, error: "Se requiere al menos un ítem" }, { status: 400 });

    const db = getDb(session);

    let subtotal = 0;
    for (const item of items) {
      subtotal += Number(item.cantidad) * Number(item.precio_unitario);
    }
    const desc  = Number(descuento || 0);
    const total = subtotal - desc;

    const [result] = await db.query(
      `INSERT INTO ventas (numero_venta, cliente_id, origen, origen_id, subtotal, descuento, total, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["TEMP", cliente_id || null, origen || "mostrador", origen_id || null, subtotal, desc, total, notas || null]
    );

    const id = result.insertId;
    const numero_venta = generarNumeroVenta(id);
    await db.query(`UPDATE ventas SET numero_venta = ? WHERE id = ?`, [numero_venta, id]);

    for (const item of items) {
      const sub = Number(item.cantidad) * Number(item.precio_unitario);
      await db.query(
        `INSERT INTO ventas_items (venta_id, catalogo_id, descripcion, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, item.catalogo_id || null, item.descripcion, item.cantidad, item.precio_unitario, sub]
      );
    }

    // Si viene de OT, marcar la OT como cerrada
    if (origen === "ot" && origen_id) {
      await db.query(
        `UPDATE ordenes_trabajo SET estado = 'cerrada' WHERE id = ?`, [origen_id]
      );
    }

    return NextResponse.json({ ok: true, id, numero_venta });
  } catch (err) {
    console.error("ventas POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualizar estado de pago / facturación ──────────────
export async function PATCH(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { id, estado_pago, estado_facturacion, notas } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const sets = [];
    const vals = [];
    if (estado_pago)         { sets.push("estado_pago = ?");        vals.push(estado_pago); }
    if (estado_facturacion)  { sets.push("estado_facturacion = ?"); vals.push(estado_facturacion); }
    if (notas !== undefined) { sets.push("notas = ?");             vals.push(notas); }

    if (!sets.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });
    vals.push(id);

    const db = getDb(session);
    await db.query(`UPDATE ventas SET ${sets.join(", ")} WHERE id = ?`, vals);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ventas PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
