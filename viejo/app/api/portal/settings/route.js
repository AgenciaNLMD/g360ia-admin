// app/api/portal/settings/route.js
// Configuración global del tenant: negocio, ARCA, MercadoPago, WhatsApp
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";
import db from "@/lib/db";

function getTDb(session) {
  return getTenantDb(session?.user?.tenantDbName);
}

// ── GET — leer toda la configuración del tenant ──────────────────
export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const tenantDb  = getTDb(session);
    const tenant_id = session.user.tenantId;

    // Config general (tabla configuracion en DB tenant)
    const [configRows] = await tenantDb.query(`SELECT clave, valor, tipo FROM configuracion`);
    const config = configRows.reduce((acc, r) => {
      acc[r.clave] = r.valor;
      return acc;
    }, {});

    // Datos del tenant desde DB core
    const [[tenant]] = await db.query(
      `SELECT nombre, rubro, plan, email, telefono, logo_url FROM tenants WHERE id = ? LIMIT 1`,
      [tenant_id]
    );

    // Config ARCA (sin certificados por seguridad)
    const [[arca]] = await tenantDb.query(
      `SELECT id, cuit, punto_venta, condicion_fiscal, activo FROM tenant_arca_config LIMIT 1`
    );

    // Config MP (sin tokens completos)
    const [[mp]] = await tenantDb.query(
      `SELECT id, modo,
        CASE WHEN access_token_prod IS NOT NULL THEN '***configurado***' ELSE NULL END AS access_token_prod,
        CASE WHEN access_token_sandbox IS NOT NULL THEN '***configurado***' ELSE NULL END AS access_token_sandbox
       FROM tenant_mp_config LIMIT 1`
    );

    // Config WhatsApp
    const [[wa]] = await tenantDb.query(
      `SELECT id, numero_whatsapp, evolution_api_url, instancia_nombre, activo FROM tenant_whatsapp_config LIMIT 1`
    );

    return NextResponse.json({
      ok: true,
      tenant:  tenant || {},
      config,
      arca:    arca || null,
      mp:      mp   || null,
      wa:      wa   || null,
      plan:    session.user.tenantPlan,
    });
  } catch (err) {
    console.error("settings GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — guardar configuración ─────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body   = await req.json();
    const { seccion } = body;
    const tenantDb   = getTDb(session);
    const tenant_id  = session.user.tenantId;

    // ── Datos del negocio ──────────────────────────────────────
    if (seccion === "negocio") {
      const { nombre, direccion, telefono, logo_url } = body;
      await db.query(
        `UPDATE tenants SET nombre=?, telefono=? WHERE id=?`,
        [nombre, telefono || null, tenant_id]
      );
      await upsertConfig(tenantDb, "direccion", direccion || "");
      if (logo_url) await upsertConfig(tenantDb, "logo_url", logo_url);
      return NextResponse.json({ ok: true });
    }

    // ── Config ARCA ────────────────────────────────────────────
    if (seccion === "arca") {
      const { cuit, punto_venta, condicion_fiscal } = body;
      const [[cfg]] = await tenantDb.query(`SELECT id FROM tenant_arca_config LIMIT 1`);
      if (cfg) {
        await tenantDb.query(
          `UPDATE tenant_arca_config SET cuit=?, punto_venta=?, condicion_fiscal=?, activo=1 WHERE id=?`,
          [cuit, punto_venta, condicion_fiscal, cfg.id]
        );
      } else {
        await tenantDb.query(
          `INSERT INTO tenant_arca_config (cuit, punto_venta, condicion_fiscal) VALUES (?, ?, ?)`,
          [cuit, punto_venta, condicion_fiscal]
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ── Config MercadoPago ─────────────────────────────────────
    if (seccion === "mp") {
      const { access_token_prod, access_token_sandbox, modo } = body;
      const [[cfg]] = await tenantDb.query(`SELECT id FROM tenant_mp_config LIMIT 1`);
      if (cfg) {
        const sets = ["modo = ?"];
        const vals = [modo || "sandbox"];
        if (access_token_prod && !access_token_prod.includes("***")) {
          sets.push("access_token_prod = ?"); vals.push(access_token_prod);
        }
        if (access_token_sandbox && !access_token_sandbox.includes("***")) {
          sets.push("access_token_sandbox = ?"); vals.push(access_token_sandbox);
        }
        vals.push(cfg.id);
        await tenantDb.query(`UPDATE tenant_mp_config SET ${sets.join(", ")} WHERE id = ?`, vals);
      } else {
        await tenantDb.query(
          `INSERT INTO tenant_mp_config (access_token_prod, access_token_sandbox, modo)
           VALUES (?, ?, ?)`,
          [access_token_prod || null, access_token_sandbox || null, modo || "sandbox"]
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ── Config WhatsApp ────────────────────────────────────────
    if (seccion === "whatsapp") {
      const { numero_whatsapp, evolution_api_url, evolution_api_key, instancia_nombre } = body;
      const [[cfg]] = await tenantDb.query(`SELECT id FROM tenant_whatsapp_config LIMIT 1`);
      if (cfg) {
        const sets = ["numero_whatsapp = ?", "evolution_api_url = ?", "instancia_nombre = ?"];
        const vals = [numero_whatsapp, evolution_api_url, instancia_nombre];
        if (evolution_api_key && !evolution_api_key.includes("***")) {
          sets.push("evolution_api_key = ?"); vals.push(evolution_api_key);
        }
        vals.push(cfg.id);
        await tenantDb.query(`UPDATE tenant_whatsapp_config SET ${sets.join(", ")} WHERE id = ?`, vals);
      } else {
        await tenantDb.query(
          `INSERT INTO tenant_whatsapp_config
            (numero_whatsapp, evolution_api_url, evolution_api_key, instancia_nombre)
           VALUES (?, ?, ?, ?)`,
          [numero_whatsapp, evolution_api_url, evolution_api_key || null, instancia_nombre || null]
        );
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Sección desconocida" }, { status: 400 });
  } catch (err) {
    console.error("settings POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

async function upsertConfig(tenantDb, clave, valor) {
  await tenantDb.query(
    `INSERT INTO configuracion (clave, valor, tipo) VALUES (?, ?, 'string')
     ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
    [clave, valor]
  );
}
