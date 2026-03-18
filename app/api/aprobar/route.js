import { NextResponse } from "next/server";
import db from "../../../lib/db";
import nodemailer from "nodemailer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({
        ok: false,
        error: "Falta email"
      });
    }

    // 🔹 Aprobar usuario
    await db.query(
      "UPDATE usuarios SET status = 'approved' WHERE email = ?",
      [email]
    );

    // 🔹 Configurar transporte email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 🔹 Enviar email
    await transporter.sendMail({
      from: `"Gestión 360 IA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Acceso aprobado",
      html: `
        <h2>Tu acceso fue aprobado ✅</h2>
        <p>Ya podés ingresar a la plataforma:</p>
        <a href="https://gestion360ia.com.ar">Ingresar</a>
      `,
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("ERROR APROBAR:", error);

    return NextResponse.json({
      ok: false,
      error: error.message
    });
  }
}
