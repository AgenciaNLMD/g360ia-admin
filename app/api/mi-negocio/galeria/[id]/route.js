import { NextResponse } from 'next/server';
import pool from '@/lib/modulos-db';

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const { caption } = await req.json();
    await pool.query('UPDATE neg_galeria SET caption=? WHERE id=?', [caption || null, id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await pool.query('DELETE FROM neg_galeria WHERE id=?', [id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
