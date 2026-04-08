import { NextResponse } from 'next/server';
import pool from '@/lib/modulos-db';

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await pool.query('DELETE FROM neg_ia_servicios WHERE id=?', [id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
