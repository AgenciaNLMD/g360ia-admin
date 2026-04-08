import { NextResponse } from 'next/server';
import pool from '@/lib/modulos-db';

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ['pregunta','respuesta','orden'];
    const fields = {};
    for (const k of allowed) {
      if (k in body) fields[k] = body[k];
    }
    if (Object.keys(fields).length === 0) return NextResponse.json({ ok: true });
    const set = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE neg_faq SET ${set} WHERE id=?`, [...Object.values(fields), id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await pool.query('DELETE FROM neg_faq WHERE id=?', [id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
