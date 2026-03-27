export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { id, email, nombre } = await req.json();

    if (!id || !email) {
      return NextResponse.json({ ok: false, error: "Faltan datos" }, { status: 400 });
    }

    await db.query(
      "UPDATE usuarios SET status = 'approved', activo = 1 WHERE id = ?",
      [id]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Gestión 360 iA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Tu acceso fue aprobado — Gestión 360 iA",
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#F0F2F5;padding:32px 16px;">
          <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
            <div style="background:#506886;padding:28px 32px;text-align:center;">
              <div style="font-size:20px;font-weight:700;color:#fff;">Gestión 360 <span style="color:#F0C878;">iA</span></div>
              <div style="font-size:11px;color:rgba(255,255,255,.6);letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">Panel de administración</div>
            </div>
            <div style="padding:28px 32px;text-align:center;">
              <div style="display:inline-block;background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0;border-radius:999px;font-size:13px;font-weight:600;padding:6px 18px;margin-bottom:16px;">✓ Acceso aprobado</div>
              <h1 style="font-size:22px;font-weight:700;color:#1F2937;margin:0 0 10px;">¡Hola${nombre ? " " + nombre : ""}!</h1>
              <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0 0 24px;">Tu acceso al panel de Gestión 360 iA fue aprobado. Ya podés ingresar con tu cuenta de Google.</p>
              <a href="https://admin.gestion360ia.com.ar" style="display:inline-block;background:#506886;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;">Ingresar al panel →</a>
            </div>
            <div style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:16px 32px;text-align:center;">
              <p style="font-size:12px;color:#9CA3AF;margin:0;">Este correo fue enviado automáticamente por Gestión 360 iA.</p>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
