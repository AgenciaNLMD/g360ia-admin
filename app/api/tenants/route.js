export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "../../../lib/db";

// GET — listar todos los tenants
export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, rubro, plan, subdominio, logo_url, email, telefono, activo, creado_en
       FROM tenants
       ORDER BY creado_en DESC`
    );
    return NextResponse.json({ ok: true, tenants: rows });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST — crear nuevo tenant
export async function POST(req) {
  try {
    const { nombre, rubro, plan, subdominio, logo_url, email, telefono } = await req.json();

    if (!nombre || !rubro) {
      return NextResponse.json({ ok: false, error: "Nombre y rubro son obligatorios" }, { status: 400 });
    }

    const [result] = await db.query(
      `INSERT INTO tenants (nombre, rubro, plan, subdominio, logo_url, email, telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, rubro, plan || "starter", subdominio || null, logo_url || null, email || null, telefono || null]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ ok: false, error: "El subdominio ya está en uso" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// PATCH — actualizar tenant
export async function PATCH(req) {
  try {
    const { id, nombre, rubro, plan, subdominio, logo_url, email, telefono, activo } = await req.json();

    if (!id) {
      return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    }

    const campos = [];
    const valores = [];

    if (nombre     !== undefined) { campos.push("nombre = ?");      valores.push(nombre); }
    if (rubro      !== undefined) { campos.push("rubro = ?");       valores.push(rubro); }
    if (plan       !== undefined) { campos.push("plan = ?");        valores.push(plan); }
    if (subdominio !== undefined) { campos.push("subdominio = ?");  valores.push(subdominio); }
    if (logo_url   !== undefined) { campos.push("logo_url = ?");    valores.push(logo_url); }
    if (email      !== undefined) { campos.push("email = ?");       valores.push(email); }
    if (telefono   !== undefined) { campos.push("telefono = ?");    valores.push(telefono); }
    if (activo     !== undefined) { campos.push("activo = ?");      valores.push(activo); }

    if (campos.length === 0) {
      return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });
    }

    valores.push(id);

    await db.query(
      `UPDATE tenants SET ${campos.join(", ")} WHERE id = ?`,
      valores
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ ok: false, error: "El subdominio ya está en uso" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// DELETE — eliminar tenant
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    }
    await db.query("DELETE FROM tenants WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
