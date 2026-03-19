process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import db from "../../../../lib/db";
import nodemailer from "nodemailer";

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

const handler = NextAuth({
  trustHost: true,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
  ],

  pages: { signIn: "/" },

  callbacks: {
    async signIn({ user, profile }) {
      const [rows] = await db.query(
        "SELECT * FROM usuarios WHERE email = ?",
        [user.email]
      );

      if (rows.length === 0) {
        await db.query(
          `INSERT INTO usuarios 
          (tenant_id, nombre, email, password_hash, rol, status, activo, creado_en) 
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [null, user.name, user.email, "", "viewer", "pending", false]
        );

        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          });

          await transporter.sendMail({
            from: `"Gestión 360 iA" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `🔔 Nueva solicitud de acceso — ${user.name}`,
            html: `
              <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#F0F2F5;padding:32px 16px;">
                <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
                  <div style="background:#506886;padding:28px 32px;text-align:center;">
                    <div style="font-size:20px;font-weight:700;color:#fff;">Gestión 360 <span style="color:#F0C878;">iA</span></div>
                    <div style="font-size:11px;color:rgba(255,255,255,.6);letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">Panel de administración</div>
                  </div>
                  <div style="padding:28px 32px;">
                    <div style="display:inline-block;background:#EDF1F6;color:#506886;border:1px solid #C2CFD9;border-radius:999px;font-size:13px;font-weight:600;padding:6px 18px;margin-bottom:16px;">
                      🔔 Nueva solicitud de acceso
                    </div>
                    <h1 style="font-size:20px;font-weight:700;color:#1F2937;margin:0 0 16px;">Alguien quiere ingresar al panel</h1>
                    <div style="background:#F4F7FA;border:1px solid #E5E7EB;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
                      <table style="width:100%;font-size:13px;border-collapse:collapse;">
                        <tr><td style="color:#9CA3AF;font-weight:600;padding:4px 0;width:100px;">Nombre</td><td style="color:#1F2937;font-weight:600;padding:4px 0;">${user.name}</td></tr>
                        <tr><td style="color:#9CA3AF;font-weight:600;padding:4px 0;">Email</td><td style="color:#1F2937;padding:4px 0;">${user.email}</td></tr>
                        <tr><td style="color:#9CA3AF;font-weight:600;padding:4px 0;">Estado</td><td style="padding:4px 0;"><span style="background:#FBF6EE;color:#92680A;border:1px solid #E8D5AF;border-radius:999px;font-size:11px;font-weight:600;padding:2px 10px;">Pendiente de aprobación</span></td></tr>
                      </table>
                    </div>
                    <div style="text-align:center;">
                      <a href="https://admin.gestion360ia.com.ar/dashboard" style="display:inline-block;background:#506886;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 32px;border-radius:10px;">Ir al panel para aprobar →</a>
                    </div>
                  </div>
                  <div style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:16px 32px;text-align:center;">
                    <p style="font-size:12px;color:#9CA3AF;margin:0;">Este correo fue enviado automáticamente por Gestión 360 iA.</p>
                  </div>
                </div>
              </div>
            `,
          });
        } catch (emailError) {
          console.error("Error enviando email al admin:", emailError);
        }

        return "/pendiente";
      }

      const dbUser = rows[0];

      if (dbUser.status !== "approved") {
        return "/pendiente";
      }

      // Registrar sesión
      try {
        await db.query(
          `UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?`,
          [dbUser.id]
        );
        await db.query(
          `INSERT INTO sesiones_log (usuario_id, ip, user_agent, dispositivo) VALUES (?, ?, ?, ?)`,
          [
            dbUser.id,
            null, // IP no disponible en este callback, se puede enriquecer desde middleware
            profile?.sub ?? "",
            parseDispositivo(""),
          ]
        );
      } catch (logError) {
        console.error("Error registrando sesión:", logError);
      }

      return true;
    },

    async session({ session }) {
      if (session?.user) {
        const [rows] = await db.query(
          "SELECT id, rol, status FROM usuarios WHERE email = ?",
          [session.user.email]
        );
        if (rows.length > 0) {
          session.user.id = rows[0].id;
          session.user.rol = rows[0].rol;
          session.user.status = rows[0].status;
        }
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.includes("/pendiente")) return `${baseUrl}/pendiente`;
      return `${baseUrl}/bienvenido`;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
