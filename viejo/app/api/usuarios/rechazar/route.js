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
      "UPDATE usuarios SET status = 'rejected', activo = 0 WHERE id = ?",
      [id]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Gestión 360 iA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Tu solicitud de acceso — Gestión 360 iA",
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#F0F2F5;padding:32px 16px;">
          <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">

            <div style="background:#506886;padding:28px 32px;text-align:center;">
              <div style="font-size:20px;font-weight:700;color:#fff;">Gestión 360 <span style="color:#F0C878;">iA</span></div>
              <div style="font-size:11px;color:rgba(255,255,255,.6);letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">Panel de administración</div>
            </div>

            <div style="padding:28px 32px;text-align:center;">
              <div style="display:inline-block;background:#FDF2F2;color:#9B1C1C;border:1px solid #FCA5A5;border-radius:999px;font-size:13px;font-weight:600;padding:6px 18px;margin-bottom:16px;">
                Solicitud no aprobada
              </div>
              <h1 style="font-size:20px;font-weight:700;color:#1F2937;margin:0 0 10px;">
                Hola${nombre ? " " + nombre : ""},
              </h1>
              <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0 0 24px;">
                Revisamos tu solicitud de acceso al panel de <strong>Gestión 360 iA</strong> y por el momento no pudimos aprobarla.
              </p>
            </div>

            <div style="padding:0 32px 24px;">
              <div style="background:#FFFBF5;border:1px solid #E8D5AF;border-radius:12px;padding:18px 20px;">
                <p style="font-size:13px;color:#7A5C1E;font-weight:600;margin:0 0 6px;">¿Creés que es un error?</p>
                <p style="font-size:13px;color:#92680A;line-height:1.5;margin:0;">
                  Si pensás que tu solicitud fue rechazada por error, podés contactarnos respondiendo este correo o escribirnos a
                  <a href="mailto:${process.env.EMAIL_USER}" style="color:#B08A55;font-weight:600;">${process.env.EMAIL_USER}</a>
                  y lo revisamos.
                </p>
              </div>
            </div>

            <div style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:16px 32px;text-align:center;">
              <p style="font-size:12px;color:#9CA3AF;margin:0;line-height:1.6;">
                Este correo fue enviado automáticamente por Gestión 360 iA.<br/>
                Si no reconocés esta solicitud, podés ignorar este mensaje.
              </p>
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
