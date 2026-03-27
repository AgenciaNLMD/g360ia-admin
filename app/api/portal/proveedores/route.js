// app/api/portal/proveedores/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";
import { canUse } from "@/lib/plan-guard";

function getDb(session) {
  return getTenantDb(session?.user?.tenantDbName);
}

// ── GET — proveedores, catálogo por proveedor, OCs ───────────────
export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const plan = session.user.tenantPlan || "free";
  if (!canUse(plan, "proveedores")) {
    return NextResponse.json({ ok: false, error: "Módulo requiere plan Business o superior" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const modo         = searchParams.get("modo"); // 'catalogo' | 'oc'
  const proveedor_id = searchParams.get("proveedor_id");
  const oc_id        = searchParams.get("oc_id");

  try {
    const db = getDb(session);

    if (modo === "catalogo" && proveedor_id) {
      const [items] = await db.query(`
        SELECT pc.*, cat.nombre, cat.sku, cat.unidad
        FROM proveedores_catalogo pc
        JOIN catalogo cat ON cat.id = pc.catalogo_id
        WHERE pc.proveedor_id = ? AND pc.activo = 1
        ORDER BY cat.nombre ASC
      `, [proveedor_id]);
      return NextResponse.json({ ok: true, items });
    }

    if (modo === "oc") {
      let q = `
        SELECT oc.*, p.nombre AS proveedor_nombre
        FROM ordenes_compra oc
        LEFT JOIN proveedores p ON p.id = oc.proveedor_id
        WHERE 1=1
      `;
      const params = [];
      if (proveedor_id) { q += ` AND oc.proveedor_id = ?`; params.push(proveedor_id); }
      q += ` ORDER BY oc.creado_en DESC`;
      const [ocs] = await db.query(q, params);

      if (oc_id) {
        const [items] = await db.query(`
          SELECT oci.*, cat.nombre, cat.sku
          FROM ordenes_compra_items oci
          JOIN catalogo cat ON cat.id = oci.catalogo_id
          WHERE oci.oc_id = ?
        `, [oc_id]);
        return NextResponse.json({ ok: true, ocs, items });
      }
      return NextResponse.json({ ok: true, ocs });
    }

    // Listar proveedores
    let query = `SELECT * FROM proveedores WHERE 1=1`;
    const params = [];
    const activo = searchParams.get("activo");
    if (activo !== null) { query += ` AND activo = ?`; params.push(activo === "1" ? 1 : 0); }
    query += ` ORDER BY nombre ASC`;
    const [rows] = await db.query(query, params);
    return NextResponse.json({ ok: true, proveedores: rows });
  } catch (err) {
    console.error("proveedores GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — crear proveedor / OC ──────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const plan = session.user.tenantPlan || "free";
  if (!canUse(plan, "proveedores")) {
    return NextResponse.json({ ok: false, error: "Módulo requiere plan Business" }, { status: 403 });
  }

  try {
    const body   = await req.json();
    const { accion } = body;
    const db     = getDb(session);

    // ── Crear proveedor ────────────────────────────────────────
    if (accion === "crear_proveedor" || !accion) {
      const { nombre, cuit, telefono, email, direccion, condiciones_pago, notas } = body;
      if (!nombre) return NextResponse.json({ ok: false, error: "Nombre obligatorio" }, { status: 400 });
      const [r] = await db.query(
        `INSERT INTO proveedores (nombre, cuit, telefono, email, direccion, condiciones_pago, notas)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, cuit || null, telefono || null, email || null,
         direccion || null, condiciones_pago || null, notas || null]
      );
      return NextResponse.json({ ok: true, id: r.insertId });
    }

    // ── Crear OC ───────────────────────────────────────────────
    if (accion === "crear_oc") {
      const { proveedor_id, ot_id, items, notas } = body;
      if (!proveedor_id || !items?.length) {
        return NextResponse.json({ ok: false, error: "proveedor_id e items requeridos" }, { status: 400 });
      }

      let total = 0;
      for (const i of items) total += Number(i.cantidad) * Number(i.precio_unitario);

      const [ocResult] = await db.query(
        `INSERT INTO ordenes_compra (proveedor_id, ot_id, estado, total, notas)
         VALUES (?, ?, 'pendiente', ?, ?)`,
        [proveedor_id, ot_id || null, total, notas || null]
      );
      const oc_id = ocResult.insertId;

      for (const item of items) {
        const sub = Number(item.cantidad) * Number(item.precio_unitario);
        await db.query(
          `INSERT INTO ordenes_compra_items (oc_id, catalogo_id, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [oc_id, item.catalogo_id, item.cantidad, item.precio_unitario, sub]
        );
      }
      return NextResponse.json({ ok: true, id: oc_id });
    }

    return NextResponse.json({ ok: false, error: "Acción desconocida" }, { status: 400 });
  } catch (err) {
    console.error("proveedores POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualizar proveedor o marcar OC como recibida ───────
export async function PATCH(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body   = await req.json();
    const { accion } = body;
    const db     = getDb(session);

    if (accion === "recibir_oc") {
      const { oc_id } = body;
      if (!oc_id) return NextResponse.json({ ok: false, error: "oc_id requerido" }, { status: 400 });

      await db.query(`UPDATE ordenes_compra SET estado = 'recibida' WHERE id = ?`, [oc_id]);

      // Actualizar stock de cada ítem de la OC
      const [items] = await db.query(
        `SELECT * FROM ordenes_compra_items WHERE oc_id = ?`, [oc_id]
      );
      for (const item of items) {
        const [[inv]] = await db.query(
          `SELECT stock_actual FROM inventario WHERE catalogo_id = ?`, [item.catalogo_id]
        );
        if (inv) {
          const nuevo = Number(inv.stock_actual) + Number(item.cantidad);
          await db.query(
            `UPDATE inventario SET stock_actual = ? WHERE catalogo_id = ?`,
            [nuevo, item.catalogo_id]
          );
          await db.query(
            `INSERT INTO inventario_movimientos
              (catalogo_id, tipo, cantidad, stock_resultante, origen, origen_id, nota)
             VALUES (?, 'entrada', ?, ?, 'compra', ?, ?)`,
            [item.catalogo_id, item.cantidad, nuevo, oc_id, `OC #${oc_id} recibida`]
          );
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Actualizar proveedor
    const { id, ...campos_raw } = body;
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const CAMPOS = ["nombre","cuit","telefono","email","direccion","condiciones_pago","notas","activo"];
    const sets = [];
    const vals = [];
    for (const c of CAMPOS) {
      if (c in campos_raw) { sets.push(`${c} = ?`); vals.push(campos_raw[c]); }
    }
    if (!sets.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });
    vals.push(id);
    await db.query(`UPDATE proveedores SET ${sets.join(", ")} WHERE id = ?`, vals);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("proveedores PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
