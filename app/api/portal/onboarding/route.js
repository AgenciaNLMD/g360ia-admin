// app/api/portal/onboarding/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "@/lib/db";
import { provisionarTenant } from "@/lib/tenant-provisioner";

export async function POST(req) {
  try {
    const { email, nombre, empresa, telefono, web, instagram, rubro, plan } = await req.json();

    if (!email || !nombre || !empresa || !rubro) {
      return NextResponse.json({ ok: false, error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Verificar si ya existe un tenant con ese email
    const [existe] = await db.query(
      `SELECT id FROM tenants WHERE email = ? LIMIT 1`,
      [email]
    );
    if (existe.length > 0) {
      return NextResponse.json({ ok: false, error: "Ya existe una cuenta con este email" }, { status: 400 });
    }

    // Crear el tenant en g360ia.tenants
    const [result] = await db.query(
      `INSERT INTO tenants (nombre, rubro, plan, email, telefono, activo, onboarding_completo)
       VALUES (?, ?, ?, ?, ?, 1, 1)`,
      [
        empresa,
        rubro,
        plan || "starter",
        email,
        telefono || null,
      ]
    );

    const tenantId = result.insertId;

    // Provisionar DB del tenant
    const { dbName } = await provisionarTenant(tenantId, empresa, rubro, plan || "starter");

    // Guardar db_name y datos extra en el tenant
    await db.query(
      `UPDATE tenants SET db_name = ?, subdominio = ? WHERE id = ?`,
      [dbName, empresa.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30), tenantId]
    );

    // Guardar nombre del contacto en configuracion de la DB del tenant
    const tenantDb = (await import("@/lib/tenant-db")).getTenantDb(dbName);
    await tenantDb.query(
      `INSERT IGNORE INTO configuracion (clave, valor, tipo) VALUES ('nombre_contacto', ?, 'string')`,
      [nombre]
    );
    if (web) {
      await tenantDb.query(
        `INSERT IGNORE INTO configuracion (clave, valor, tipo) VALUES ('sitio_web', ?, 'string')`,
        [web]
      );
    }
    if (instagram) {
      await tenantDb.query(
        `INSERT IGNORE INTO configuracion (clave, valor, tipo) VALUES ('instagram', ?, 'string')`,
        [instagram]
      );
    }

    return NextResponse.json({ ok: true, tenantId, dbName });

  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
