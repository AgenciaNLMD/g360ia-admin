// app/api/admin/modulos/[modulo]/route.js
// Ruta dinámica que maneja GET/POST para todos los módulos tenant desde el admin.
// GET  /api/admin/modulos/ot?tenant_id=X[&params]
// POST /api/admin/modulos/ot  body: { tenant_id, ...data }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantDbForAdmin } from "@/lib/admin-tenant-db";

function err(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

// ── Handlers GET por módulo ─────────────────────────────────────────
const GET_HANDLERS = {

  async ot(tdb, sp) {
    const [etapas] = await tdb.query("SELECT * FROM ot_etapas_config WHERE activa=1 ORDER BY orden");
    const [ots] = await tdb.query(`
      SELECT ot.*, e.nombre AS etapa_nombre, e.color AS etapa_color,
             c.nombre AS cliente_nombre,
             COALESCE(SUM(i.subtotal),0) AS total
      FROM ordenes_trabajo ot
      LEFT JOIN ot_etapas_config e ON e.id = ot.etapa_id
      LEFT JOIN clientes c ON c.id = ot.cliente_id
      LEFT JOIN ot_items i ON i.ot_id = ot.id
      ${sp.get("etapa") ? "WHERE ot.etapa_id = ?" : "WHERE 1=1"}
      GROUP BY ot.id
      ORDER BY ot.creado_en DESC LIMIT 200
    `, sp.get("etapa") ? [sp.get("etapa")] : []);
    return { etapas, ots };
  },

  async catalogo(tdb, sp) {
    const [rows] = await tdb.query(
      "SELECT * FROM catalogo ORDER BY nombre ASC LIMIT 500"
    );
    return { catalogo: rows };
  },

  async inventario(tdb) {
    const [rows] = await tdb.query(`
      SELECT c.id, c.codigo, c.nombre, c.unidad, c.precio_venta,
             COALESCE(i.stock_actual,0) AS stock_actual,
             COALESCE(i.stock_minimo,0) AS stock_minimo,
             i.ubicacion,
             CASE
               WHEN COALESCE(i.stock_actual,0) = 0 THEN 'sin_stock'
               WHEN COALESCE(i.stock_actual,0) <= COALESCE(i.stock_minimo,0) THEN 'bajo'
               ELSE 'ok'
             END AS estado_stock
      FROM catalogo c
      LEFT JOIN inventario i ON i.catalogo_id = c.id
      WHERE c.tipo = 'producto' AND c.activo = 1
      ORDER BY c.nombre ASC
    `);
    return { inventario: rows };
  },

  async ventas(tdb) {
    const [rows] = await tdb.query(`
      SELECT v.*, c.nombre AS cliente_nombre,
             COUNT(vi.id) AS cant_items
      FROM ventas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      LEFT JOIN ventas_items vi ON vi.venta_id = v.id
      GROUP BY v.id
      ORDER BY v.creado_en DESC LIMIT 200
    `);
    return { ventas: rows };
  },

  async facturacion(tdb) {
    const [facturas] = await tdb.query(`
      SELECT f.*, v.numero_venta, v.total AS venta_total
      FROM facturas f
      LEFT JOIN ventas v ON v.id = f.venta_id
      ORDER BY f.creado_en DESC LIMIT 200
    `);
    const [config] = await tdb.query("SELECT * FROM tenant_arca_config LIMIT 1");
    return { facturas, config: config[0] || null };
  },

  async caja(tdb, sp) {
    const fecha = sp.get("fecha") || new Date().toISOString().slice(0, 10);
    const [cobros] = await tdb.query(
      `SELECT co.*, v.numero_venta
       FROM cobros co
       LEFT JOIN ventas v ON v.id = co.venta_id
       WHERE DATE(co.creado_en) = ?
       ORDER BY co.creado_en DESC`,
      [fecha]
    );
    const [resumen] = await tdb.query(
      `SELECT medio, SUM(monto) AS total, COUNT(*) AS cant
       FROM cobros WHERE DATE(creado_en) = ?
       GROUP BY medio`,
      [fecha]
    );
    return { cobros, resumen, fecha };
  },

  async comunicaciones(tdb) {
    const [log] = await tdb.query(
      `SELECT cl.*, c.nombre AS cliente_nombre
       FROM comunicaciones_log cl
       LEFT JOIN clientes c ON c.id = cl.cliente_id
       ORDER BY cl.creado_en DESC LIMIT 100`
    );
    const [plantillas] = await tdb.query("SELECT * FROM comunicaciones_plantillas ORDER BY nombre");
    return { log, plantillas };
  },

  async equipo(tdb) {
    const [rows] = await tdb.query(`
      SELECT tp.*, u.nombre, u.email,
             COUNT(DISTINCT ot.id) AS ots_activas
      FROM tecnicos_perfil tp
      JOIN g360ia.usuarios u ON u.id = tp.usuario_id
      LEFT JOIN ordenes_trabajo ot ON ot.tecnico_id = tp.usuario_id AND ot.estado = 'abierta'
      GROUP BY tp.id
      ORDER BY u.nombre
    `);
    return { equipo: rows };
  },

  async proveedores(tdb) {
    const [proveedores] = await tdb.query(
      "SELECT * FROM proveedores WHERE activo=1 ORDER BY nombre"
    );
    const [ocs] = await tdb.query(`
      SELECT oc.*, p.nombre AS proveedor_nombre,
             COUNT(i.id) AS cant_items
      FROM ordenes_compra oc
      LEFT JOIN proveedores p ON p.id = oc.proveedor_id
      LEFT JOIN ordenes_compra_items i ON i.oc_id = oc.id
      GROUP BY oc.id
      ORDER BY oc.creado_en DESC LIMIT 100
    `);
    return { proveedores, ocs };
  },
};

// ── Handlers POST por módulo ────────────────────────────────────────
const POST_HANDLERS = {

  async ot(tdb, body) {
    const { cliente_id, titulo, descripcion, prioridad, fecha_ingreso } = body;
    if (!titulo && !descripcion) throw new Error("Título o descripción requerida");
    const [[{ max_n }]] = await tdb.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ot,4) AS UNSIGNED)),0) AS max_n FROM ordenes_trabajo"
    );
    const numero_ot = `OT-${String(max_n + 1).padStart(5, "0")}`;
    const [r] = await tdb.query(
      `INSERT INTO ordenes_trabajo (numero_ot,cliente_id,titulo,descripcion,prioridad,fecha_ingreso,etapa_id)
       VALUES (?,?,?,?,?,?,1)`,
      [numero_ot, cliente_id || null, titulo || descripcion?.slice(0,100), descripcion || null, prioridad || "normal", fecha_ingreso || new Date().toISOString().slice(0,10)]
    );
    return { id: r.insertId, numero_ot };
  },

  async catalogo(tdb, body) {
    const { id, nombre, tipo, precio_costo, precio_venta, unidad, codigo } = body;
    if (id) {
      await tdb.query(
        "UPDATE catalogo SET nombre=?,tipo=?,precio_costo=?,precio_venta=?,unidad=?,codigo=?,actualizado_en=NOW() WHERE id=?",
        [nombre, tipo||"producto", precio_costo||null, precio_venta||0, unidad||"unidad", codigo||null, id]
      );
      return { id };
    }
    const [r] = await tdb.query(
      "INSERT INTO catalogo (nombre,tipo,precio_costo,precio_venta,unidad,codigo) VALUES (?,?,?,?,?,?)",
      [nombre, tipo||"producto", precio_costo||null, precio_venta||0, unidad||"unidad", codigo||null]
    );
    if ((tipo||"producto") === "producto") {
      await tdb.query("INSERT INTO inventario (catalogo_id) VALUES (?)", [r.insertId]);
    }
    return { id: r.insertId };
  },

  async inventario(tdb, body) {
    const { catalogo_id, tipo, cantidad, notas } = body;
    if (!catalogo_id || !tipo || !cantidad) throw new Error("catalogo_id, tipo y cantidad requeridos");
    const delta = tipo === "salida" ? -Math.abs(cantidad) : Math.abs(cantidad);
    await tdb.query(
      "INSERT INTO inventario_movimientos (catalogo_id,tipo,cantidad,notas) VALUES (?,?,?,?)",
      [catalogo_id, tipo, Math.abs(cantidad), notas||null]
    );
    await tdb.query(
      "UPDATE inventario SET stock_actual = stock_actual + ?, actualizado_en=NOW() WHERE catalogo_id=?",
      [delta, catalogo_id]
    );
    return { ok: true };
  },

  async proveedores(tdb, body) {
    const { accion } = body;
    if (accion === "crear_proveedor") {
      const { nombre, contacto, telefono, email } = body;
      if (!nombre) throw new Error("Nombre requerido");
      const [r] = await tdb.query(
        "INSERT INTO proveedores (nombre,contacto,telefono,email) VALUES (?,?,?,?)",
        [nombre, contacto||null, telefono||null, email||null]
      );
      return { id: r.insertId };
    }
    throw new Error("Acción no reconocida");
  },
};

// ── GET ─────────────────────────────────────────────────────────────
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return err("Sin autorización", 401);

  const { modulo } = await params;
  const sp = new URL(req.url).searchParams;
  const tenant_id = sp.get("tenant_id");
  if (!tenant_id) return err("tenant_id requerido");

  const handler = GET_HANDLERS[modulo];
  if (!handler) return err(`Módulo "${modulo}" no reconocido`);

  try {
    const { tdb } = await getTenantDbForAdmin(tenant_id);
    const data = await handler(tdb, sp);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return err(e.message, 500);
  }
}

// ── POST ────────────────────────────────────────────────────────────
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return err("Sin autorización", 401);

  const { modulo } = await params;
  const body = await req.json();
  const tenant_id = body.tenant_id;
  if (!tenant_id) return err("tenant_id requerido");

  const handler = POST_HANDLERS[modulo];
  if (!handler) return err(`Módulo "${modulo}" sin soporte POST aún`);

  try {
    const { tdb } = await getTenantDbForAdmin(tenant_id);
    const data = await handler(tdb, body);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return err(e.message, 500);
  }
}
