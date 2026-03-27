// app/api/portal/mp/create-preference/route.js
// Genera un link de pago de MercadoPago para una venta
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";
import { canUse } from "@/lib/plan-guard";

export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const plan = session.user.tenantPlan || "free";
  if (!canUse(plan, "mercadopago")) {
    return NextResponse.json({ ok: false, error: "MercadoPago requiere plan Pro o superior" }, { status: 403 });
  }

  try {
    const { venta_id } = await req.json();
    if (!venta_id) return NextResponse.json({ ok: false, error: "venta_id requerido" }, { status: 400 });

    const db = getTenantDb(session.user.tenantDbName);

    // Obtener venta e ítems
    const [[venta]] = await db.query(
      `SELECT v.*, c.nombre AS cliente_nombre, c.email AS cliente_email
       FROM ventas v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?`, [venta_id]
    );
    if (!venta) return NextResponse.json({ ok: false, error: "Venta no encontrada" }, { status: 404 });

    const [items] = await db.query(
      `SELECT * FROM ventas_items WHERE venta_id = ?`, [venta_id]
    );

    // Obtener token de MP
    const [[mpCfg]] = await db.query(`SELECT * FROM tenant_mp_config LIMIT 1`);
    if (!mpCfg) return NextResponse.json({ ok: false, error: "Configure MercadoPago primero" }, { status: 400 });

    const token = mpCfg.modo === "produccion"
      ? mpCfg.access_token_prod
      : mpCfg.access_token_sandbox;

    if (!token) return NextResponse.json({ ok: false, error: "Access token de MP no configurado" }, { status: 400 });

    const baseUrl = process.env.NEXTAUTH_URL_PORTAL || "https://app.gestion360ia.com.ar";

    // Crear preference en MP
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: items.map(i => ({
          title:       i.descripcion,
          quantity:    Number(i.cantidad),
          unit_price:  Number(i.precio_unitario),
          currency_id: "ARS",
        })),
        payer: venta.cliente_email ? { email: venta.cliente_email } : undefined,
        external_reference: String(venta_id),
        notification_url: `${baseUrl}/api/portal/mp/webhook`,
        back_urls: {
          success: `${baseUrl}/portal/dashboard/ventas?pago=ok&venta=${venta_id}`,
          failure: `${baseUrl}/portal/dashboard/ventas?pago=error&venta=${venta_id}`,
          pending: `${baseUrl}/portal/dashboard/ventas?pago=pendiente&venta=${venta_id}`,
        },
        auto_return: "approved",
      }),
    });

    if (!mpRes.ok) {
      const err = await mpRes.json();
      return NextResponse.json({ ok: false, error: err.message || "Error en MercadoPago" }, { status: 500 });
    }

    const preference = await mpRes.json();
    const link = mpCfg.modo === "produccion"
      ? preference.init_point
      : preference.sandbox_init_point;

    return NextResponse.json({ ok: true, link, preference_id: preference.id });
  } catch (err) {
    console.error("mp/create-preference:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
