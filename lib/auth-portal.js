// lib/auth-portal.js
// Autenticación para el portal del tenant.
// Verifica contra g360ia.tenants en vez de g360ia.usuarios

import GoogleProvider from "next-auth/providers/google";
import db from "@/lib/db";

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

export const authPortalOptions = {
  trustHost: true,

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
  ],

  // Páginas propias del portal
  pages: {
    signIn:  "/portal",
    error:   "/portal/error",
  },

  callbacks: {
    async signIn({ user }) {
      try {
        // Buscar el tenant por email
        const [rows] = await db.query(
          `SELECT id, nombre, rubro, plan, db_name, activo
           FROM tenants
           WHERE email = ? LIMIT 1`,
          [user.email]
        );

        // Email no registrado como tenant
        if (rows.length === 0) {
          return "/portal/no-autorizado";
        }

        const tenant = rows[0];

        // Tenant inactivo
        if (!tenant.activo) {
          return "/portal/inactivo";
        }

        // Tenant sin DB provisionada todavía
        if (!tenant.db_name) {
          return "/portal/configurando";
        }

        return true;

      } catch (err) {
        console.error("Portal signIn error:", err);
        return "/portal/error";
      }
    },

    // ── JWT: persiste datos del tenant en el token ──
    async jwt({ token }) {
      if (token.email) {
        try {
          const [rows] = await db.query(
            `SELECT id, nombre, rubro, plan, db_name, activo
             FROM tenants
             WHERE email = ? LIMIT 1`,
            [token.email]
          );
          if (rows.length > 0) {
            token.tenantId   = rows[0].id;
            token.tenantNombre = rows[0].nombre;
            token.tenantRubro  = rows[0].rubro;
            token.tenantPlan   = rows[0].plan;
            token.tenantDbName = rows[0].db_name;
          }
        } catch (err) {
          console.error("Portal JWT error:", err);
        }
      }
      return token;
    },

    // ── Session: expone datos del tenant al frontend ──
    async session({ session, token }) {
      if (token) {
        session.user.tenantId    = token.tenantId    ?? null;
        session.user.tenantNombre = token.tenantNombre ?? null;
        session.user.tenantRubro  = token.tenantRubro  ?? null;
        session.user.tenantPlan   = token.tenantPlan   ?? null;
        session.user.tenantDbName = token.tenantDbName ?? null;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.includes("/portal/no-autorizado")) return `${baseUrl}/portal/no-autorizado`;
      if (url.includes("/portal/inactivo"))      return `${baseUrl}/portal/inactivo`;
      if (url.includes("/portal/configurando"))  return `${baseUrl}/portal/configurando`;
      return `${baseUrl}/portal/dashboard`;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
