import { NextResponse } from 'next/server';
import pool from '@/lib/modulos-db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM neg_galeria ORDER BY tipo, orden');
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { url, caption, tipo, orden, tamanio_kb } = await req.json();
    if (!url || !tipo) return NextResponse.json({ error: 'url y tipo requeridos' }, { status: 400 });
    const [res] = await pool.query(
      'INSERT INTO neg_galeria (url,caption,tipo,orden,tamanio_kb) VALUES (?,?,?,?,?)',
      [url, caption || null, tipo, orden || 0, tamanio_kb || null]
    );
    return NextResponse.json({ ok: true, id: res.insertId });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
