// app/api/portal/comunicaciones/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";
import { getTenantDb } from "@/lib/tenant-db";
import { canUse } from "@/lib/plan-guard";

function getDb(session) {
  return getTenantDb(session?.user?.tenantDbName);
}

// ── GET — historial de comunicaciones o plantillas ───────────────
export async function GET(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const modo = searchParams.get("modo"); // 'plantillas' | 'config'

  try {
    const db = getDb(session);

    if (modo === "plantillas") {
      const [plantillas] = await db.query(
        `SELECT p.*, e.nombre AS etapa_nombre
         FROM comunicaciones_plantillas p
         LEFT JOIN ot_etapas_config e ON e.id = p.etapa_id
         ORDER BY p.etapa_id ASC, p.tipo ASC`
      );
      return NextResponse.json({ ok: true, plantillas });
    }

    if (modo === "config") {
      const [[config]] = await db.query(`SELECT * FROM tenant_whatsapp_config LIMIT 1`);
      return NextResponse.json({ ok: true, config: config || null });
    }

    const tipo      = searchParams.get("tipo");
    const cliente   = searchParams.get("cliente_id");
    const limit     = Number(searchParams.get("limit") || 100);

    let query = `
      SELECT cl.*, c.nombre AS cliente_nombre
      FROM comunicaciones_log cl
      LEFT JOIN clientes c ON c.id = cl.cliente_id
      WHERE 1=1
    `;
    const params = [];

    if (tipo)    { query += ` AND cl.tipo = ?`;       params.push(tipo); }
    if (cliente) { query += ` AND cl.cliente_id = ?`; params.push(cliente); }

    query += ` ORDER BY cl.creado_en DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await db.query(query, params);
    return NextResponse.json({ ok: true, comunicaciones: rows });
  } catch (err) {
    console.error("comunicaciones GET:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── POST — enviar notificación / guardar plantilla / guardar config ──
export async function POST(req) {
  const session = await getServerSession(authPortalOptions);
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  try {
    const body   = await req.json();
    const { accion } = body;
    const db     = getDb(session);
    const plan   = session.user.tenantPlan || "free";

    // ── Guardar config WhatsApp ────────────────────────────────
    if (accion === "guardar_config") {
      const { numero_whatsapp, evolution_api_url, evolution_api_key, instancia_nombre } = body;
      const [[cfg]] = await db.query(`SELECT id FROM tenant_whatsapp_config LIMIT 1`);
      if (cfg) {
        await db.query(
          `UPDATE tenant_whatsapp_config
           SET numero_whatsapp=?, evolution_api_url=?, evolution_api_key=?, instancia_nombre=?, activo=1
           WHERE id=?`,
          [numero_whatsapp, evolution_api_url, evolution_api_key, instancia_nombre, cfg.id]
        );
      } else {
        await db.query(
          `INSERT INTO tenant_whatsapp_config
            (numero_whatsapp, evolution_api_url, evolution_api_key, instancia_nombre)
           VALUES (?, ?, ?, ?)`,
          [numero_whatsapp, evolution_api_url, evolution_api_key, instancia_nombre]
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ── Guardar plantilla ──────────────────────────────────────
    if (accion === "guardar_plantilla") {
      const { id, etapa_id, tipo, canal, plantilla, activa } = body;
      if (id) {
        await db.query(
          `UPDATE comunicaciones_plantillas SET plantilla=?, activa=? WHERE id=?`,
          [plantilla, activa ? 1 : 0, id]
        );
      } else {
        await db.query(
          `INSERT INTO comunicaciones_plantillas (etapa_id, tipo, canal, plantilla, activa)
           VALUES (?, ?, ?, ?, ?)`,
          [etapa_id || null, tipo, canal || "whatsapp", plantilla, activa ? 1 : 0]
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ── Enviar mensaje por WhatsApp ────────────────────────────
    if (accion === "enviar_whatsapp") {
      if (!canUse(plan, "comunicaciones_auto") && body.automatico) {
        return NextResponse.json({ ok: false, error: "Notificaciones automáticas requieren plan Pro" }, { status: 403 });
      }

      const { cliente_id, telefono, contenido, tipo } = body;

      // Obtener config WA del tenant
      const [[waCfg]] = await db.query(`SELECT * FROM tenant_whatsapp_config WHERE activo = 1 LIMIT 1`);
      if (!waCfg?.evolution_api_url) {
        return NextResponse.json({ ok: false, error: "Configure WhatsApp primero" }, { status: 400 });
      }

      let estado = "pendiente";
      let error_msg = null;

      try {
        const waRes = await fetch(
          `${waCfg.evolution_api_url}/message/sendText/${waCfg.instancia_nombre}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": waCfg.evolution_api_key,
            },
            body: JSON.stringify({
              number: telefono,
              options: { delay: 1200 },
              textMessage: { text: contenido },
            }),
          }
        );
        estado = waRes.ok ? "enviado" : "fallido";
        if (!waRes.ok) {
          const errBody = await waRes.text();
          error_msg = errBody.slice(0, 200);
        }
      } catch (e) {
        estado = "fallido";
        error_msg = e.message;
      }

      // Registrar en log
      await db.query(
        `INSERT INTO comunicaciones_log (cliente_id, canal, tipo, contenido, estado, error_msg)
         VALUES (?, 'whatsapp', ?, ?, ?, ?)`,
        [cliente_id || null, tipo || "otro", contenido, estado, error_msg]
      );

      return NextResponse.json({ ok: estado === "enviado", estado });
    }

    return NextResponse.json({ ok: false, error: "Acción desconocida" }, { status: 400 });
  } catch (err) {
    console.error("comunicaciones POST:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
