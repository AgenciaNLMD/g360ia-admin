// app/api/portal/mp/webhook/route.js
// Recibe notificaciones de pago de MercadoPago
// IMPORTANTE: Este endpoint es público (sin auth de sesión) porque MP lo llama directamente
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getTenantDb } from "@/lib/tenant-db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, data } = body;

    // Solo procesar pagos aprobados
    if (type !== "payment") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const payment_id = data?.id;
    if (!payment_id) return NextResponse.json({ ok: true });

    // Identificar el tenant por el webhook. El tenant_id viene en query string
    // La URL del webhook se configura por tenant como /api/portal/mp/webhook?tenant_id=XXX
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");

    if (!tenant_id) return NextResponse.json({ ok: false, error: "tenant_id requerido en webhook URL" }, { status: 400 });

    // Obtener db_name del tenant
    const [[tenant]] = await db.query(
      `SELECT db_name FROM tenants WHERE id = ? AND activo = 1 LIMIT 1`, [tenant_id]
    );
    if (!tenant?.db_name) return NextResponse.json({ ok: false, error: "Tenant no encontrado" }, { status: 404 });

    const tenantDb = getTenantDb(tenant.db_name);

    // Obtener config MP del tenant
    const [[mpCfg]] = await tenantDb.query(`SELECT * FROM tenant_mp_config LIMIT 1`);
    if (!mpCfg) return NextResponse.json({ ok: false, error: "Config MP no encontrada" }, { status: 400 });

    const token = mpCfg.modo === "produccion"
      ? mpCfg.access_token_prod
      : mpCfg.access_token_sandbox;

    // Consultar el pago en MP para verificar
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!mpRes.ok) return NextResponse.json({ ok: false, error: "Error consultando MP" }, { status: 500 });

    const pago = await mpRes.json();

    if (pago.status !== "approved") {
      return NextResponse.json({ ok: true, status: pago.status });
    }

    const venta_id         = pago.external_reference ? Number(pago.external_reference) : null;
    const mp_payment_id    = String(payment_id);
    const mp_merchant_order_id = pago.order?.id ? String(pago.order.id) : null;
    const monto            = pago.transaction_amount;

    // Buscar la venta
    if (venta_id) {
      const [[venta]] = await tenantDb.query(
        `SELECT id, cliente_id, total FROM ventas WHERE id = ? LIMIT 1`, [venta_id]
      );

      if (venta) {
        // Registrar cobro
        await tenantDb.query(
          `INSERT INTO cobros
            (venta_id, cliente_id, medio, monto, mp_payment_id, mp_merchant_order_id, estado, fecha)
           VALUES (?, ?, 'mercadopago', ?, ?, ?, 'aprobado', CURDATE())
           ON DUPLICATE KEY UPDATE estado = 'aprobado'`,
          [venta_id, venta.cliente_id, monto, mp_payment_id, mp_merchant_order_id || null]
        );

        // Marcar venta como pagada
        await tenantDb.query(
          `UPDATE ventas SET estado_pago = 'pagado' WHERE id = ?`, [venta_id]
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mp/webhook error:", err);
    // Devolver 200 a MP para que no reintente (loguear el error internamente)
    return NextResponse.json({ ok: false, error: err.message });
  }
}

// MP también puede enviar GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true, status: "webhook activo" });
}
