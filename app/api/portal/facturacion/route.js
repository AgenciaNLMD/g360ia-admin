// app/api/portal/facturacion/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";
import { canUse } from "@/lib/plan-guard";

function getDb(session) {
  return getTenantDb(session?.user?.tenantDbName);
}

// ── GET — listar facturas o config ARCA ──────────────────────────
export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const modo = searchParams.get("modo"); // 'config' | null

  try {
    const db = getDb(session);

    if (modo === "config") {
      const [[config]] = await db.query(`SELECT * FROM tenant_arca_config LIMIT 1`);
      return NextResponse.json({ ok: true, config: config || null });
    }

    const tipo     = searchParams.get("tipo");
    const desde    = searchParams.get("desde");
    const hasta    = searchParams.get("hasta");
    const cliente  = searchParams.get("cliente_id");

    let query = `
      SELECT f.*, c.nombre AS cliente_nombre, v.numero_venta
      FROM facturas f
      LEFT JOIN clientes c ON c.id = f.cliente_id
      LEFT JOIN ventas v ON v.id = f.venta_id
      WHERE 1=1
    `;
    const params = [];

    if (tipo)     { query += ` AND f.tipo_comprobante = ?`;  params.push(tipo); }
    if (cliente)  { query += ` AND f.cliente_id = ?`;        params.push(cliente); }
    if (desde)    { query += ` AND DATE(f.creado_en) >= ?`;  params.push(desde); }
    if (hasta)    { query += ` AND DATE(f.creado_en) <= ?`;  params.push(hasta); }

    query += ` ORDER BY f.creado_en DESC`;
    const [rows] = await db.query(query, params);
    return NextResponse.json({ ok: true, facturas: rows });
  } catch (err) {
    console.error("facturacion GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — emitir factura ARCA ────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const plan = session.user.tenantPlan || "free";
  if (!canUse(plan, "facturacion_arca")) {
    return NextResponse.json({ ok: false, error: "Facturación ARCA requiere plan Pro o superior" }, { status: 403 });
  }

  try {
    const { venta_id, accion } = await req.json();
    const db = getDb(session);

    // ── Guardar/actualizar config ARCA ───────────────────────
    if (accion === "guardar_config") {
      const { cuit, punto_venta, condicion_fiscal, certificado_crt, certificado_key } = await req.json().catch(() => ({}));
      const [[cfg]] = await db.query(`SELECT id FROM tenant_arca_config LIMIT 1`);
      if (cfg) {
        await db.query(
          `UPDATE tenant_arca_config SET cuit=?, punto_venta=?, condicion_fiscal=?,
           certificado_crt=?, certificado_key=?, activo=1 WHERE id=?`,
          [cuit, punto_venta, condicion_fiscal, certificado_crt || null, certificado_key || null, cfg.id]
        );
      } else {
        await db.query(
          `INSERT INTO tenant_arca_config (cuit, punto_venta, condicion_fiscal, certificado_crt, certificado_key)
           VALUES (?, ?, ?, ?, ?)`,
          [cuit, punto_venta, condicion_fiscal, certificado_crt || null, certificado_key || null]
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (!venta_id) return NextResponse.json({ ok: false, error: "venta_id requerido" }, { status: 400 });

    // Obtener datos de la venta y el cliente
    const [[venta]] = await db.query(
      `SELECT v.*, c.nombre AS cliente_nombre, c.cuit AS cliente_cuit, c.condicion_fiscal AS cliente_cf
       FROM ventas v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?`, [venta_id]
    );
    if (!venta) return NextResponse.json({ ok: false, error: "Venta no encontrada" }, { status: 404 });
    if (venta.estado_facturacion === "facturado") {
      return NextResponse.json({ ok: false, error: "Esta venta ya fue facturada" }, { status: 400 });
    }

    // Obtener config ARCA del tenant
    const [[arcaCfg]] = await db.query(`SELECT * FROM tenant_arca_config WHERE activo = 1 LIMIT 1`);
    if (!arcaCfg) {
      return NextResponse.json({ ok: false, error: "Configure ARCA primero en Configuración → ARCA" }, { status: 400 });
    }

    // Determinar tipo de comprobante según condición fiscal del cliente
    let tipo_comprobante = "B"; // default: consumidor final
    if (venta.cliente_cf === "RI") tipo_comprobante = "A";
    else if (venta.cliente_cf === "EX") tipo_comprobante = "C";

    // ── TODO: Integrar AfipSDK aquí ───────────────────────────
    // const { cae, cae_vencimiento, numero_comprobante } = await emitirFacturaARCA({
    //   arcaCfg, venta, tipo_comprobante
    // });
    //
    // Por ahora guardamos con CAE placeholder para testing:
    const cae              = "00000000000000";
    const cae_vencimiento  = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const numero_comprobante = `${String(arcaCfg.punto_venta).padStart(4,"0")}-00000001`;

    // Guardar factura
    const [result] = await db.query(
      `INSERT INTO facturas
        (venta_id, cliente_id, tipo_comprobante, numero_comprobante, punto_venta, cae, cae_vencimiento, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [venta_id, venta.cliente_id, tipo_comprobante, numero_comprobante,
       arcaCfg.punto_venta, cae, cae_vencimiento, venta.total]
    );

    // Marcar venta como facturada
    await db.query(
      `UPDATE ventas SET estado_facturacion = 'facturado' WHERE id = ?`, [venta_id]
    );

    return NextResponse.json({
      ok: true, id: result.insertId,
      tipo_comprobante, numero_comprobante, cae, cae_vencimiento,
    });
  } catch (err) {
    console.error("facturacion POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — guardar config ARCA ──────────────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { cuit, punto_venta, condicion_fiscal } = await req.json();
    const db = getDb(session);
    const [[cfg]] = await db.query(`SELECT id FROM tenant_arca_config LIMIT 1`);
    if (cfg) {
      await db.query(
        `UPDATE tenant_arca_config SET cuit=?, punto_venta=?, condicion_fiscal=? WHERE id=?`,
        [cuit, punto_venta, condicion_fiscal, cfg.id]
      );
    } else {
      await db.query(
        `INSERT INTO tenant_arca_config (cuit, punto_venta, condicion_fiscal) VALUES (?, ?, ?)`,
        [cuit, punto_venta, condicion_fiscal]
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
