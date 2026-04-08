import { NextResponse } from 'next/server';
import pool from '@/lib/modulos-db';

// POST — crea nueva pregunta FAQ
export async function POST(req) {
  try {
    const { pregunta, respuesta, orden } = await req.json();
    if (!pregunta) return NextResponse.json({ error: 'pregunta requerida' }, { status: 400 });
    const [res] = await pool.query(
      'INSERT INTO neg_faq (pregunta, respuesta, orden) VALUES (?,?,?)',
      [pregunta, respuesta || '', orden || 0]
    );
    return NextResponse.json({ ok: true, id: res.insertId });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
