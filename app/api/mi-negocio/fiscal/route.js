import { NextResponse } from 'next/server';
import pool from '@/lib/modulos-db';

const FISCAL_ALLOWED = [
  'cuit','condicion_iva','categoria_monotributo','alicuota_iva',
  'punto_venta','inicio_actividades','domicilio_fiscal',
  'cbu','alias_cbu','banco','tipo_cuenta','titular_cuenta',
  'texto_pie_factura','condicion_pago_default',
];

async function seedFiscal() {
  const [rows] = await pool.query('SELECT id FROM neg_fiscal LIMIT 1');
  if (rows.length === 0) {
    await pool.query(
      "INSERT INTO neg_fiscal (condicion_iva,alicuota_iva) VALUES ('responsable_inscripto','21%')"
    );
  }
}

export async function GET() {
  try {
    await seedFiscal();
    const [fiscal] = await pool.query('SELECT * FROM neg_fiscal LIMIT 1');
    const [medios] = await pool.query('SELECT medio, activo FROM neg_medios_pago');
    return NextResponse.json({ fiscal: fiscal[0] || {}, medios });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { fiscal, medios } = await req.json();

    if (fiscal) {
      await seedFiscal();
      const [rows] = await pool.query('SELECT id FROM neg_fiscal LIMIT 1');
      const id = rows[0].id;
      const fields = {};
      for (const k of FISCAL_ALLOWED) {
        if (k in fiscal) fields[k] = fiscal[k] || null;
      }
      if (Object.keys(fields).length > 0) {
        const set = Object.keys(fields).map(k => `${k} = ?`).join(', ');
        await pool.query(`UPDATE neg_fiscal SET ${set} WHERE id=?`, [...Object.values(fields), id]);
      }
    }

    if (Array.isArray(medios)) {
      for (const m of medios) {
        const [existing] = await pool.query('SELECT id FROM neg_medios_pago WHERE medio=?', [m.medio]);
        if (existing.length > 0) {
          await pool.query('UPDATE neg_medios_pago SET activo=? WHERE medio=?', [m.activo ? 1 : 0, m.medio]);
        } else {
          await pool.query('INSERT INTO neg_medios_pago (medio,activo) VALUES (?,?)', [m.medio, m.activo ? 1 : 0]);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
