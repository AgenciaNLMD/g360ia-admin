// lib/auth.js
import GoogleProvider from "next-auth/providers/google";
import db from "@/lib/db";
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

export const authOptions = {
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
                  </div>
                  <div style="padding:28px 32px;text-align:center;">
                    <h1 style="font-size:20px;font-weight:700;color:#1F2937;margin:0 0 16px;">Nueva solicitud de acceso</h1>
                    <p style="color:#6B7280;">${user.name} — ${user.email}</p>
                    <a href="https://admin.gestion360ia.com.ar/dashboard" style="display:inline-block;background:#506886;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 32px;border-radius:10px;">Ir al panel →</a>
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
      if (dbUser.status !== "approved") return "/pendiente";

      try {
        await db.query(
          `UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?`,
          [dbUser.id]
        );
        await db.query(
          `INSERT INTO sesiones_log (usuario_id, ip, user_agent, dispositivo)
           VALUES (?, ?, ?, ?)`,
          [dbUser.id, null, profile?.sub ?? "", parseDispositivo("")]
        );
      } catch (logError) {
        console.error("Error registrando sesión:", logError);
      }

      return true;
    },

    // ── JWT: persiste id/rol/status/tenant_id en el token cifrado ──
    async jwt({ token }) {
      if (token.email) {
        try {
          const [rows] = await db.query(
            "SELECT id, rol, status, tenant_id FROM usuarios WHERE email = ?",
            [token.email]
          );
          if (rows.length > 0) {
            token.id        = rows[0].id;
            token.rol       = rows[0].rol;
            token.status    = rows[0].status;
            token.tenant_id = rows[0].tenant_id;
          }
        } catch (err) {
          console.error("JWT callback DB error:", err);
        }
      }
      return token;
    },

    // ── Session: lee del token, nunca falla ──
    async session({ session, token }) {
      if (token) {
        session.user.id        = token.id        ?? null;
        session.user.rol       = token.rol       ?? null;
        session.user.status    = token.status    ?? null;
        session.user.tenant_id = token.tenant_id ?? null;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.includes("/pendiente")) return `${baseUrl}/pendiente`;
      return `${baseUrl}/bienvenido`;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
