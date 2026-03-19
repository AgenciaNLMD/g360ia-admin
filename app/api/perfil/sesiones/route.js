export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import db from "../../../../lib/db";

function parseDispositivo(ua = "") {
  if (!ua) return "Desconocido";
  let os = "Desconocido";
  let browser = "Desconocido";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os/i.test(ua)) os = "Mac";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/edg/i.test(ua)) browser = "Edge";
  return `${browser} · ${os}`;
}

// GET — historial de sesiones del usuario logueado
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const [userRows] = await db.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [session.user.email]
    );
    if (userRows.length === 0) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const [sesiones] = await db.query(
      `SELECT id, ip, dispositivo, ubicacion, creado_en
       FROM sesiones_log
       WHERE usuario_id = ?
       ORDER BY creado_en DESC
       LIMIT 20`,
      [userRows[0].id]
    );

    return NextResponse.json({ ok: true, sesiones });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST — registrar nueva sesión con IP y dispositivo real
export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "Desconocida";

    const ua = req.headers.get("user-agent") || "";
    const dispositivo = parseDispositivo(ua);

    const [userRows] = await db.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [session.user.email]
    );
    if (userRows.length === 0) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const userId = userRows[0].id;

    await db.query(
      `INSERT INTO sesiones_log (usuario_id, ip, user_agent, dispositivo) VALUES (?, ?, ?, ?)`,
      [userId, ip, ua, dispositivo]
    );

    await db.query(
      `UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?`,
      [userId]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
