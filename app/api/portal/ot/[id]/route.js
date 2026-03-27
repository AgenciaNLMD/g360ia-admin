// app/api/portal/ot/[id]/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";
import { canUse } from "@/lib/plan-guard";

function getDb(session) {
  return getTenantDb(session?.user?.tenantDbName);
}

// ── GET — detalle de una OT ──────────────────────────────────────
export async function GET(req, { params }) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const db = getDb(session);
    const id = params.id;

    const [[ot]] = await db.query(`
      SELECT ot.*,
        c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email,
        c.cuit AS cliente_cuit, c.condicion_fiscal AS cliente_cf,
        e.nombre AS etapa_nombre, e.color_hex AS etapa_color, e.orden AS etapa_orden
      FROM ordenes_trabajo ot
      LEFT JOIN clientes c ON c.id = ot.cliente_id
      LEFT JOIN ot_etapas_config e ON e.id = ot.etapa_actual_id
      WHERE ot.id = ?
    `, [id]);

    if (!ot) return NextResponse.json({ ok: false, error: "OT no encontrada" }, { status: 404 });

    const [items] = await db.query(
      `SELECT oi.*, cat.nombre AS catalogo_nombre, cat.sku
       FROM ot_items oi
       LEFT JOIN catalogo cat ON cat.id = oi.catalogo_id
       WHERE oi.ot_id = ?
       ORDER BY oi.id ASC`,
      [id]
    );

    const [historial] = await db.query(
      `SELECT h.*, ea.nombre AS etapa_anterior, en.nombre AS etapa_nueva
       FROM ot_historial h
       LEFT JOIN ot_etapas_config ea ON ea.id = h.etapa_anterior_id
       LEFT JOIN ot_etapas_config en ON en.id = h.etapa_nueva_id
       WHERE h.ot_id = ?
       ORDER BY h.creado_en ASC`,
      [id]
    );

    const [etapas] = await db.query(
      `SELECT * FROM ot_etapas_config WHERE activa = 1 ORDER BY orden ASC`
    );

    return NextResponse.json({ ok: true, ot, items, historial, etapas });
  } catch (err) {
    console.error("ot/[id] GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH — actualizar OT (campos + avanzar etapa + items) ───────
export async function PATCH(req, { params }) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const id   = params.id;
    const body = await req.json();
    const { accion, ...data } = body;
    const db   = getDb(session);
    const plan = session.user.tenantPlan || "free";

    // ── Avanzar etapa ──────────────────────────────────────────
    if (accion === "avanzar_etapa") {
      const [[ot]] = await db.query(
        `SELECT ot.etapa_actual_id, e.orden, e.plan_minimo
         FROM ordenes_trabajo ot
         JOIN ot_etapas_config e ON e.id = ot.etapa_actual_id
         WHERE ot.id = ?`, [id]
      );
      if (!ot) return NextResponse.json({ ok: false, error: "OT no encontrada" }, { status: 404 });

      const [[nextEtapa]] = await db.query(
        `SELECT * FROM ot_etapas_config WHERE orden = ? AND activa = 1`,
        [ot.orden + 1]
      );
      if (!nextEtapa) return NextResponse.json({ ok: false, error: "Ya está en la última etapa" }, { status: 400 });

      // Verificar plan para la etapa destino
      if (nextEtapa.plan_minimo !== "free" && !canUse(plan, "ot_etapas_completas")) {
        return NextResponse.json({ ok: false, error: "Requiere plan Pro" }, { status: 403 });
      }

      await db.query(
        `UPDATE ordenes_trabajo SET etapa_actual_id = ? WHERE id = ?`,
        [nextEtapa.id, id]
      );
      await db.query(
        `INSERT INTO ot_historial (ot_id, etapa_anterior_id, etapa_nueva_id, usuario_id, nota)
         VALUES (?, ?, ?, ?, ?)`,
        [id, ot.etapa_actual_id, nextEtapa.id, null, data.nota || null]
      );

      return NextResponse.json({ ok: true, nueva_etapa: nextEtapa });
    }

    // ── Guardar diagnóstico / campos generales ─────────────────
    if (accion === "guardar") {
      const CAMPOS = ["diagnostico","tecnico_id","equipo_marca","equipo_modelo",
                      "equipo_serie","equipo_falla_reportada","estado"];
      const sets = [];
      const vals = [];
      for (const c of CAMPOS) {
        if (c in data) { sets.push(`${c} = ?`); vals.push(data[c]); }
      }
      if (!sets.length) return NextResponse.json({ ok: false, error: "Nada que guardar" }, { status: 400 });
      vals.push(id);
      await db.query(`UPDATE ordenes_trabajo SET ${sets.join(", ")} WHERE id = ?`, vals);
      return NextResponse.json({ ok: true });
    }

    // ── Sincronizar ítems ──────────────────────────────────────
    if (accion === "sync_items") {
      const { items } = data;
      if (!Array.isArray(items)) return NextResponse.json({ ok: false, error: "items requerido" }, { status: 400 });

      await db.query(`DELETE FROM ot_items WHERE ot_id = ?`, [id]);

      let totalRepuestos = 0;
      let totalManoObra = 0;

      for (const item of items) {
        const subtotal = Number(item.cantidad) * Number(item.precio_unitario);
        await db.query(
          `INSERT INTO ot_items (ot_id, tipo, catalogo_id, descripcion, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, item.tipo, item.catalogo_id || null, item.descripcion,
           item.cantidad, item.precio_unitario, subtotal]
        );
        if (item.tipo === "repuesto") totalRepuestos += subtotal;
        else totalManoObra += subtotal;
      }

      const total = totalRepuestos + totalManoObra;
      await db.query(
        `UPDATE ordenes_trabajo SET total_repuestos=?, total_mano_obra=?, total=? WHERE id=?`,
        [totalRepuestos, totalManoObra, total, id]
      );

      return NextResponse.json({ ok: true, total_repuestos: totalRepuestos, total_mano_obra: totalManoObra, total });
    }

    return NextResponse.json({ ok: false, error: "Acción desconocida" }, { status: 400 });
  } catch (err) {
    console.error("ot/[id] PATCH:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
