export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "../../../lib/db";
import nodemailer from "nodemailer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ ok: false, error: "Falta email" });
    }

    await db.query(
      "UPDATE usuarios SET status = 'approved' WHERE email = ?",
      [email]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Acceso aprobado</title>
</head>
<body style="margin:0;padding:0;background:#F0F2F5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F2F5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(15,23,42,0.10);border:1px solid #E5E7EB;">

          <!-- Header -->
          <tr>
            <td style="background:#506886;padding:36px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:rgba(255,255,255,0.12);border-radius:16px;padding:14px 18px;">
                    <img src="https://admin.gestion360ia.com.ar/logo.svg" alt="Gestión 360 iA" height="36" style="display:block;" onerror="this.style.display='none'" />
                  </td>
                </tr>
              </table>
              <div style="margin-top:16px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Gestión 360 <span style="color:#F0C878;">iA</span>
              </div>
              <div style="margin-top:4px;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:1.5px;text-transform:uppercase;">
                Panel de administración
              </div>
            </td>
          </tr>

          <!-- Badge -->
          <tr>
            <td style="padding:32px 40px 0;text-align:center;">
              <span style="display:inline-block;background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0;border-radius:999px;font-size:13px;font-weight:600;padding:6px 18px;">
                ✓ Acceso aprobado
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 40px 28px;text-align:center;">
              <h1 style="font-size:24px;font-weight:700;color:#1F2937;margin:0 0 10px;letter-spacing:-0.3px;">
                ¡Tu cuenta está lista!
              </h1>
              <p style="font-size:15px;color:#6B7280;line-height:1.6;margin:0 0 28px;">
                Un administrador revisó tu solicitud y aprobó tu acceso al panel de Gestión 360 iA. Ya podés ingresar con tu cuenta de Google.
              </p>

              <!-- CTA Button -->
              <a href="https://admin.gestion360ia.com.ar" 
                 style="display:inline-block;background:#506886;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:16px 40px;border-radius:14px;box-shadow:0 8px 20px rgba(80,104,134,0.30);">
                Ingresar al panel →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#F3F4F6;"></div>
            </td>
          </tr>

          <!-- Info box -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF5;border:1px solid #E8D5AF;border-radius:14px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="font-size:13px;color:#7A5C1E;margin:0 0 8px;font-weight:600;">¿Cómo ingresar?</p>
                    <p style="font-size:13px;color:#92680A;margin:0;line-height:1.5;">
                      Hacé clic en el botón de arriba o visitá <a href="https://admin.gestion360ia.com.ar" style="color:#B08A55;">admin.gestion360ia.com.ar</a> y seleccioná <strong>"Acceder con Google"</strong> usando esta misma cuenta de email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:20px 40px;text-align:center;">
              <p style="font-size:12px;color:#9CA3AF;margin:0;line-height:1.6;">
                Este correo fue enviado automáticamente por Gestión 360 iA.<br/>
                Si no reconocés esta solicitud, podés ignorar este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"Gestión 360 iA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Tu acceso fue aprobado — Gestión 360 iA",
      html: emailHtml,
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("ERROR APROBAR:", error);
    return NextResponse.json({ ok: false, error: error.message });
  }
}
