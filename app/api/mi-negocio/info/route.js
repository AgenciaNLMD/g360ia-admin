import { NextResponse } from 'next/server';
import pool from '@/lib/modulos-db';

const ALLOWED = [
  'nombre_comercial','nombre_corto','razon_social','slogan',
  'logo_url','portada_url','video_url',
  'color_primario','color_secundario','color_fondo','color_acento',
  'calle','piso_dpto','barrio','localidad','provincia','codigo_postal','pais',
  'maps_url','latitud','longitud',
  'telefono_principal','telefono_secundario','whatsapp',
  'email_contacto','email_admin','sitio_web',
];

async function seed() {
  const [rows] = await pool.query('SELECT id FROM neg_info LIMIT 1');
  if (rows.length === 0) {
    await pool.query("INSERT INTO neg_info (nombre_comercial) VALUES ('')");
  }
}

export async function GET() {
  try {
    await seed();
    const [rows] = await pool.query('SELECT * FROM neg_info LIMIT 1');
    return NextResponse.json(rows[0] || {});
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    await seed();
    const [rows] = await pool.query('SELECT id FROM neg_info LIMIT 1');
    const id = rows[0].id;

    const fields = {};
    for (const k of ALLOWED) {
      if (k in body) fields[k] = body[k] || null;
    }
    if (Object.keys(fields).length === 0) return NextResponse.json({ ok: true });

    const set = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE neg_info SET ${set} WHERE id = ?`, [...Object.values(fields), id]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
