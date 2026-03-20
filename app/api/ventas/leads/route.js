// app/api/ventas/leads/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

// ── GET — listar leads ────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const rol        = searchParams.get("rol")        || session.user.rol;
    const usuario_id = searchParams.get("usuario_id") || session.user.id;
    const estado     = searchParams.get("estado")     || null;
    const sin_asignar = searchParams.get("sin_asignar") === "1";

    let query = `
      SELECT
        vl.*,
        u.nombre AS vendedor_nombre,
        u.email  AS vendedor_email,
        DATEDIFF(NOW(), vl.fecha_ultimo_contacto) AS dias_sin_contacto
      FROM ventas_leads vl
      LEFT JOIN usuarios u ON u.id = vl.asignado_a
    `;

    const condiciones = [];
    const valores     = [];

    if (rol === "vendedor" && usuario_id) {
      // Vendedor ve los suyos + los sin asignar
      condiciones.push("(vl.asignado_a = ? OR vl.asignado_a IS NULL)");
      valores.push(usuario_id);
    }

    if (estado) {
      condiciones.push("vl.estado = ?");
      valores.push(estado);
    }

    if (sin_asignar) {
      condiciones.push("vl.asignado_a IS NULL");
    }

    if (condiciones.length) {
      query += " WHERE " + condiciones.join(" AND ");
    }

    query += " ORDER BY vl.creado_en DESC";

    const [rows] = await db.query(query, valores);
    return NextResponse.json({ ok: true, leads: rows });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// ── POST — crear nuevo lead ──────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const {
      nombre, empresa, email, telefono,
      rubro_interes, plan_interes, fuente,
      asignado_a, valor_mrr_estimado, notas
    } = await req.json();

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "Nombre es obligatorio" }, { status: 400 });
    }

    const [result] = await db.query(
      `INSERT INTO ventas_leads
       (nombre, empresa, email, telefono, rubro_interes, plan_interes,
        fuente, asignado_a, valor_mrr_estimado, notas, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'nuevo')`,
      [
        nombre,
        empresa             || null,
        email               || null,
        telefono            || null,
        rubro_interes       || null,
        plan_interes        || null,
        fuente              || "web",
        asignado_a          || null,
        valor_mrr_estimado  || null,
        notas               || null,
      ]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// ── PATCH — actualizar lead / cambiar etapa ──────────────────
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      id, nombre, empresa, email, telefono,
      rubro_interes, plan_interes, fuente, estado,
      asignado_a, valor_mrr_estimado, notas,
      fecha_proximo_contacto, motivo_perdida,
      // Acción especial: tomar el lead
      tomar,
    } = body;

    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

    const campos  = [];
    const valores = [];

    // Tomar lead (vendedor se auto-asigna)
    if (tomar) {
      campos.push("asignado_a = ?", "tomado_en = NOW()");
      valores.push(session.user.id);
    }

    if (nombre             !== undefined) { campos.push("nombre = ?");              valores.push(nombre); }
    if (empresa            !== undefined) { campos.push("empresa = ?");             valores.push(empresa); }
    if (email              !== undefined) { campos.push("email = ?");               valores.push(email); }
    if (telefono           !== undefined) { campos.push("telefono = ?");            valores.push(telefono); }
    if (rubro_interes      !== undefined) { campos.push("rubro_interes = ?");       valores.push(rubro_interes); }
    if (plan_interes       !== undefined) { campos.push("plan_interes = ?");        valores.push(plan_interes); }
    if (fuente             !== undefined) { campos.push("fuente = ?");              valores.push(fuente); }
    if (asignado_a         !== undefined) { campos.push("asignado_a = ?");          valores.push(asignado_a); }
    if (valor_mrr_estimado !== undefined) { campos.push("valor_mrr_estimado = ?");  valores.push(valor_mrr_estimado); }
    if (notas              !== undefined) { campos.push("notas = ?");               valores.push(notas); }
    if (motivo_perdida     !== undefined) { campos.push("motivo_perdida = ?");      valores.push(motivo_perdida); }
    if (fecha_proximo_contacto !== undefined) { campos.push("fecha_proximo_contacto = ?"); valores.push(fecha_proximo_contacto); }

    // Cambio de estado
    if (estado !== undefined) {
      campos.push("estado = ?");
      valores.push(estado);

      // Al contactar → registrar fecha
      if (estado === "contactado" || estado === "interesado" || estado === "seguimiento") {
        campos.push("fecha_ultimo_contacto = NOW()");
      }

      // Al cerrar → crear tenant automáticamente
      if (estado === "cerrado") {
        const [[lead]] = await db.query("SELECT * FROM ventas_leads WHERE id = ?", [id]);
        if (lead?.email) {
          const [existe] = await db.query("SELECT id FROM tenants WHERE email = ?", [lead.email]);
          if (!existe.length) {
            const [tenant] = await db.query(
              `INSERT INTO tenants (nombre, rubro, plan, email, telefono, activo, onboarding_completo)
               VALUES (?, ?, ?, ?, ?, 1, 0)`,
              [
                lead.empresa || lead.nombre,
                lead.rubro_interes || "otro",
                lead.plan_interes  || "starter",
                lead.email,
                lead.telefono || null,
              ]
            );
            // Vincular tenant al lead
            campos.push("tenant_id = ?");
            valores.push(tenant.insertId);
          }
        }
      }
    }

    if (!campos.length) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });

    valores.push(id);
    await db.query(`UPDATE ventas_leads SET ${campos.join(", ")} WHERE id = ?`, valores);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// ── DELETE — eliminar lead ───────────────────────────────────
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    await db.query("DELETE FROM ventas_leads WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
