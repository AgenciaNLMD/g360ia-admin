import { NextResponse } from 'next/server';
import pool from '@/lib/modulos-db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT plataforma, url FROM neg_redes');
    const map = {};
    for (const r of rows) map[r.plataforma] = r.url || '';
    return NextResponse.json(map);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    for (const [plataforma, url] of Object.entries(body)) {
      const [existing] = await pool.query(
        'SELECT id FROM neg_redes WHERE plataforma=?', [plataforma]
      );
      if (existing.length > 0) {
        await pool.query('UPDATE neg_redes SET url=? WHERE plataforma=?', [url||null, plataforma]);
      } else if (url) {
        await pool.query('INSERT INTO neg_redes (plataforma,url) VALUES (?,?)', [plataforma, url]);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
