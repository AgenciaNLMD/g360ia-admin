// app/api/portal/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import db from "@/lib/db";

const PORTAL_URL = "https://app.gestion360ia.com.ar";

const authPortalOptions = {
  trustHost: true,

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_PORTAL_CLIENT_ID,
clientSecret: process.env.GOOGLE_PORTAL_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],

  // Forzar la URL base del portal acá directamente
  cookies: {
    sessionToken: {
      name: `next-auth.portal.session-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    callbackUrl: {
      name: `next-auth.portal.callback-url`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    csrfToken: {
      name: `next-auth.portal.csrf-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
  },

  pages: { signIn: "/portal", error: "/portal" },

  callbacks: {
    async signIn({ user }) {
      try {
        const [rows] = await db.query(
          `SELECT id, activo, db_name FROM tenants WHERE email = ? LIMIT 1`,
          [user.email]
        );
        if (rows.length === 0) return true;
        if (!rows[0].activo)  return `${PORTAL_URL}/portal/inactivo`;
        if (!rows[0].db_name) return `${PORTAL_URL}/portal/configurando`;
        return true;
      } catch (err) {
        console.error("Portal signIn error:", err);
        return true;
      }
    },

    async jwt({ token }) {
      if (token.email) {
        try {
          const [rows] = await db.query(
            `SELECT id, nombre, rubro, plan, db_name, onboarding_completo
             FROM tenants WHERE email = ? LIMIT 1`,
            [token.email]
          );
          if (rows.length > 0) {
            token.tenantId           = rows[0].id;
            token.tenantNombre       = rows[0].nombre;
            token.tenantRubro        = rows[0].rubro;
            token.tenantPlan         = rows[0].plan;
            token.tenantDbName       = rows[0].db_name;
            token.onboardingCompleto = rows[0].onboarding_completo;
          } else {
            token.tenantId           = null;
            token.onboardingCompleto = 0;
          }
        } catch (err) {
          console.error("Portal JWT error:", err);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.tenantId           = token.tenantId           ?? null;
        session.user.tenantNombre       = token.tenantNombre       ?? null;
        session.user.tenantRubro        = token.tenantRubro        ?? null;
        session.user.tenantPlan         = token.tenantPlan         ?? null;
        session.user.tenantDbName       = token.tenantDbName       ?? null;
        session.user.onboardingCompleto = token.onboardingCompleto ?? 0;
      }
      return session;
    },

    async redirect({ url }) {
      if (url.includes("/portal/inactivo"))     return `${PORTAL_URL}/portal/inactivo`;
      if (url.includes("/portal/configurando")) return `${PORTAL_URL}/portal/configurando`;
      if (url.includes("/portal"))              return `${PORTAL_URL}/portal/bienvenido`;
      return `${PORTAL_URL}/portal/bienvenido`;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authPortalOptions);
export { handler as GET, handler as POST };
