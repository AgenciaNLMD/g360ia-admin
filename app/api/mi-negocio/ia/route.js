import { NextResponse } from 'next/server';
import pool from '@/lib/modulos-db';

async function seedIaConfig() {
  const [rows] = await pool.query('SELECT id FROM neg_ia_config LIMIT 1');
  if (rows.length === 0) {
    await pool.query("INSERT INTO neg_ia_config (tono) VALUES ('amigable')");
  }
}

export async function GET() {
  try {
    await seedIaConfig();
    const [config] = await pool.query('SELECT * FROM neg_ia_config LIMIT 1');
    const [servicios] = await pool.query(
      "SELECT * FROM neg_ia_servicios WHERE tipo='servicio' ORDER BY orden"
    );
    const [keywords] = await pool.query(
      "SELECT * FROM neg_ia_servicios WHERE tipo='keyword' ORDER BY orden"
    );
    const [faq] = await pool.query(
      'SELECT * FROM neg_faq WHERE activo=1 ORDER BY orden'
    );
    return NextResponse.json({
      config: config[0] || {},
      servicios,
      keywords,
      faq,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    await seedIaConfig();
    const [rows] = await pool.query('SELECT id FROM neg_ia_config LIMIT 1');
    const id = rows[0].id;

    const allowed = ['descripcion_larga','tono','politica_precios'];
    const fields = {};
    for (const k of allowed) {
      if (k in body) fields[k] = body[k] || null;
    }
    if (Object.keys(fields).length === 0) return NextResponse.json({ ok: true });

    const set = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE neg_ia_config SET ${set} WHERE id = ?`, [...Object.values(fields), id]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — agrega servicio o keyword
export async function POST(req) {
  try {
    const { nombre, tipo } = await req.json();
    if (!nombre || !tipo) return NextResponse.json({ error: 'nombre y tipo requeridos' }, { status: 400 });
    const [res] = await pool.query(
      'INSERT INTO neg_ia_servicios (nombre, tipo, orden) VALUES (?,?,?)',
      [nombre, tipo, 0]
    );
    return NextResponse.json({ ok: true, id: res.insertId });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
