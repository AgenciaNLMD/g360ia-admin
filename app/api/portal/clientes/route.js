// app/api/portal/clientes/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";

function getDb(session) {
  const dbName = session?.user?.tenantDbName;
  if (!dbName) throw new Error("Sin base de datos asignada");
  return getTenantDb(dbName);
}

// ── GET — listar clientes ────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const estado  = searchParams.get("estado");
  const buscar  = searchParams.get("q");
  const id      = searchParams.get("id");

  try {
    const db = getDb(session);

    if (id) {
      const [[cliente]] = await db.query(
        `SELECT * FROM clientes WHERE id = ? LIMIT 1`, [id]
      );
      if (!cliente) return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
      return NextResponse.json({ ok: true, cliente });
    }

    let query = `SELECT * FROM clientes WHERE 1=1`;
    const params = [];

    if (estado) { query += ` AND estado = ?`; params.push(estado); }
    if (buscar) {
      query += ` AND (nombre LIKE ? OR razon_social LIKE ? OR email LIKE ? OR cuit LIKE ? OR telefono LIKE ?)`;
      const like = `%${buscar}%`;
      params.push(like, like, like, like, like);
    }

    query += ` ORDER BY nombre ASC`;

    const [rows] = await db.query(query, params);
    return NextResponse.json({ ok: true, clientes: rows });
  } catch (err) {
    console.error("clientes GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — crear cliente ─────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const {
      nombre, razon_social, cuit, condicion_fiscal,
      telefono, whatsapp, email, direccion, rubro, notas, lead_id,
    } = await req.json();

    if (!nombre) return NextResponse.json({ ok: false, error: "Nombre obligatorio" }, { status: 400 });

    // Validar CUIT formato XX-XXXXXXXX-X
    if (cuit && !/^\d{2}-\d{8}-\d$/.test(cuit)) {
      return NextResponse.json({ ok: false, error: "CUIT inválido. Formato: XX-XXXXXXXX-X" }, { status: 400 });
    }

    const db = getDb(session);
    const [result] = await db.query(
      `INSERT INTO clientes
        (nombre, razon_social, cuit, condicion_fiscal, telefono, whatsapp, email,
         direccion, rubro, notas, lead_id, estado, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', 1)`,
      [nombre, razon_social || null, cuit || null, condicion_fiscal || null,
       telefono || null, whatsapp || null, email || null,
       direccion || null, rubro || null, notas || null, lead_id || null]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("clientes POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualizar cliente ───────────────────────────────────
export async function PATCH(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, ...campos_raw } = body;
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    if (campos_raw.cuit && !/^\d{2}-\d{8}-\d$/.test(campos_raw.cuit)) {
      return NextResponse.json({ ok: false, error: "CUIT inválido. Formato: XX-XXXXXXXX-X" }, { status: 400 });
    }

    const PERMITIDOS = ["nombre","razon_social","cuit","condicion_fiscal","telefono",
                        "whatsapp","email","direccion","rubro","notas","estado"];
    const campos = [];
    const valores = [];
    for (const key of PERMITIDOS) {
      if (key in campos_raw) { campos.push(`${key} = ?`); valores.push(campos_raw[key]); }
    }
    if (!campos.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });

    valores.push(id);
    const db = getDb(session);
    await db.query(`UPDATE clientes SET ${campos.join(", ")} WHERE id = ?`, valores);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("clientes PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── DELETE — desactivar cliente ──────────────────────────────────
export async function DELETE(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    const db = getDb(session);
    await db.query(`UPDATE clientes SET estado = 'inactivo', activo = 0 WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
