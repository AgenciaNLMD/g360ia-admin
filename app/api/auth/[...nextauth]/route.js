import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import db from "../../../../lib/db";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      const [rows] = await db.query(
        "SELECT * FROM usuarios WHERE email = ?",
        [user.email]
      );

      // Si no existe → lo creamos pendiente
      if (rows.length === 0) {
        await db.query(
          `INSERT INTO usuarios 
          (tenant_id, nombre, email, password_hash, rol, status, activo, creado_en) 
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            null,
            user.name,
            user.email,
            "",
            "usuario",
            "pending",
            true
          ]
        );

        return false; // ❌ no deja entrar
      }

      const dbUser = rows[0];

      // Si no está aprobado → bloquear
      if (dbUser.status !== "approved") {
        return false;
      }

      return true;
    },
  },
});

export { handler as GET, handler as POST };
