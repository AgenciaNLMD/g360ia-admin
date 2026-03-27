// app/api/portal/caja/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";

function getDb(session) {
  return getTenantDb(session?.user?.tenantDbName);
}

// ── GET — cobros del día / periodo ───────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fecha  = searchParams.get("fecha") || new Date().toISOString().split("T")[0];
  const modo   = searchParams.get("modo"); // 'config'

  try {
    const db = getDb(session);

    if (modo === "config") {
      const [[config]] = await db.query(`SELECT * FROM tenant_mp_config LIMIT 1`);
      return NextResponse.json({ ok: true, config: config || null });
    }

    const [cobros] = await db.query(`
      SELECT cb.*, v.numero_venta, c.nombre AS cliente_nombre
      FROM cobros cb
      LEFT JOIN ventas v ON v.id = cb.venta_id
      LEFT JOIN clientes c ON c.id = cb.cliente_id
      WHERE cb.fecha = ? AND cb.estado = 'aprobado'
      ORDER BY cb.creado_en DESC
    `, [fecha]);

    // Resumen por medio de pago
    const resumen = cobros.reduce((acc, c) => {
      acc[c.medio] = (acc[c.medio] || 0) + Number(c.monto);
      acc.total = (acc.total || 0) + Number(c.monto);
      return acc;
    }, {});

    return NextResponse.json({ ok: true, cobros, resumen, fecha });
  } catch (err) {
    console.error("caja GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — registrar cobro manual ────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { venta_id, cliente_id, medio, monto, referencia, fecha } = await req.json();
    if (!monto || !medio) return NextResponse.json({ ok: false, error: "Monto y medio son requeridos" }, { status: 400 });

    const db = getDb(session);
    const hoy = fecha || new Date().toISOString().split("T")[0];

    const [result] = await db.query(
      `INSERT INTO cobros (venta_id, cliente_id, medio, monto, referencia, estado, fecha)
       VALUES (?, ?, ?, ?, ?, 'aprobado', ?)`,
      [venta_id || null, cliente_id || null, medio, monto, referencia || null, hoy]
    );

    // Actualizar estado de pago de la venta si aplica
    if (venta_id) {
      const [[venta]] = await db.query(
        `SELECT v.total,
          COALESCE(SUM(c.monto), 0) AS cobrado
         FROM ventas v
         LEFT JOIN cobros c ON c.venta_id = v.id AND c.estado = 'aprobado'
         WHERE v.id = ?
         GROUP BY v.id`, [venta_id]
      );
      if (venta) {
        const cobrado = Number(venta.cobrado) + Number(monto);
        const estado_pago = cobrado >= Number(venta.total) ? "pagado"
          : cobrado > 0 ? "parcial" : "pendiente";
        await db.query(`UPDATE ventas SET estado_pago = ? WHERE id = ?`, [estado_pago, venta_id]);
      }
    }

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("caja POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — guardar config MercadoPago ───────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { access_token_prod, access_token_sandbox, modo } = await req.json();
    const db = getDb(session);
    const [[cfg]] = await db.query(`SELECT id FROM tenant_mp_config LIMIT 1`);

    if (cfg) {
      await db.query(
        `UPDATE tenant_mp_config SET access_token_prod=?, access_token_sandbox=?, modo=? WHERE id=?`,
        [access_token_prod || null, access_token_sandbox || null, modo || "sandbox", cfg.id]
      );
    } else {
      await db.query(
        `INSERT INTO tenant_mp_config (access_token_prod, access_token_sandbox, modo)
         VALUES (?, ?, ?)`,
        [access_token_prod || null, access_token_sandbox || null, modo || "sandbox"]
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
