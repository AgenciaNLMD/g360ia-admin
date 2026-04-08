import { NextResponse } from 'next/server';
import pool from '@/lib/modulos-db';

const DEFAULTS = [
  { dia: 0, abierto: 1, desde1: '09:00', hasta1: '19:00', desde2: null, hasta2: null },
  { dia: 1, abierto: 1, desde1: '09:00', hasta1: '19:00', desde2: null, hasta2: null },
  { dia: 2, abierto: 1, desde1: '09:00', hasta1: '19:00', desde2: null, hasta2: null },
  { dia: 3, abierto: 1, desde1: '09:00', hasta1: '19:00', desde2: null, hasta2: null },
  { dia: 4, abierto: 1, desde1: '09:00', hasta1: '19:00', desde2: null, hasta2: null },
  { dia: 5, abierto: 1, desde1: '10:00', hasta1: '16:00', desde2: null, hasta2: null },
  { dia: 6, abierto: 0, desde1: null,    hasta1: null,    desde2: null, hasta2: null },
];

async function seedHorarios() {
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM neg_horarios');
  if (rows[0].cnt < 7) {
    await pool.query('DELETE FROM neg_horarios');
    for (const h of DEFAULTS) {
      await pool.query(
        'INSERT INTO neg_horarios (dia_semana,abierto,hora_desde_1,hora_hasta_1,hora_desde_2,hora_hasta_2) VALUES (?,?,?,?,?,?)',
        [h.dia, h.abierto, h.desde1, h.hasta1, h.desde2, h.hasta2]
      );
    }
  }
}

async function seedIaConfig() {
  const [rows] = await pool.query('SELECT id FROM neg_ia_config LIMIT 1');
  if (rows.length === 0) {
    await pool.query("INSERT INTO neg_ia_config (tono) VALUES ('amigable')");
  }
}

export async function GET() {
  try {
    await seedHorarios();
    await seedIaConfig();
    const [horarios] = await pool.query('SELECT * FROM neg_horarios ORDER BY dia_semana');
    const [cierres] = await pool.query(
      'SELECT * FROM neg_cierre_especial WHERE activo=1 ORDER BY fecha_desde LIMIT 1'
    );
    const [ia] = await pool.query('SELECT mensaje_fuera_horario FROM neg_ia_config LIMIT 1');
    return NextResponse.json({
      horarios,
      cierre: cierres[0] || null,
      mensaje_fuera_horario: ia[0]?.mensaje_fuera_horario || '',
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { horarios, cierre, mensaje_fuera_horario } = await req.json();

    if (Array.isArray(horarios)) {
      for (const h of horarios) {
        await pool.query(
          'UPDATE neg_horarios SET abierto=?,hora_desde_1=?,hora_hasta_1=?,hora_desde_2=?,hora_hasta_2=? WHERE dia_semana=?',
          [h.abierto ? 1 : 0, h.hora_desde_1||null, h.hora_hasta_1||null, h.hora_desde_2||null, h.hora_hasta_2||null, h.dia_semana]
        );
      }
    }

    if (cierre !== undefined && cierre !== null && cierre.fecha_desde) {
      if (cierre.id) {
        await pool.query(
          'UPDATE neg_cierre_especial SET fecha_desde=?,fecha_hasta=?,mensaje_bot=? WHERE id=?',
          [cierre.fecha_desde, cierre.fecha_hasta, cierre.mensaje_bot||null, cierre.id]
        );
      } else {
        await pool.query(
          'INSERT INTO neg_cierre_especial (fecha_desde,fecha_hasta,mensaje_bot) VALUES (?,?,?)',
          [cierre.fecha_desde, cierre.fecha_hasta||cierre.fecha_desde, cierre.mensaje_bot||null]
        );
      }
    }

    if (mensaje_fuera_horario !== undefined) {
      await seedIaConfig();
      const [rows] = await pool.query('SELECT id FROM neg_ia_config LIMIT 1');
      await pool.query(
        'UPDATE neg_ia_config SET mensaje_fuera_horario=? WHERE id=?',
        [mensaje_fuera_horario, rows[0].id]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
