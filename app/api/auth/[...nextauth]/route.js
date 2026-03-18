process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import db from "../../../../lib/db";

const handler = NextAuth({
  trustHost: true,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],

  pages: {
    signIn: "/",
  },

  callbacks: {
    async signIn({ user }) {
      const [rows] = await db.query(
        "SELECT * FROM usuarios WHERE email = ?",
        [user.email]
      );

      if (rows.length === 0) {
        await db.query(
          `INSERT INTO usuarios 
          (tenant_id, nombre, email, password_hash, rol, status, activo, creado_en) 
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [null, user.name, user.email, "", "usuario", "pending", true]
        );
        return "/pendiente";
      }

      const dbUser = rows[0];

      if (dbUser.status !== "approved") {
        return "/pendiente";
      }

      return true;
    },

    async session({ session }) {
      if (session?.user) {
        const [rows] = await db.query(
          "SELECT rol, status FROM usuarios WHERE email = ?",
          [session.user.email]
        );
        if (rows.length > 0) {
          session.user.rol = rows[0].rol;
          session.user.status = rows[0].status;
        }
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Si es pendiente, ir a /pendiente
      if (url.startsWith("/pendiente") || url.includes("/pendiente")) {
        return `${baseUrl}/pendiente`;
      }
      // Si el callbackUrl apunta a /auth-callback, respetarlo
      if (url.includes("/auth-callback")) {
        return url.startsWith("http") ? url : `${baseUrl}${url}`;
      }
      // Si es una URL relativa válida del mismo dominio
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default: ir a main
      return "https://www.gestion360ia.com.ar/main.html";
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
