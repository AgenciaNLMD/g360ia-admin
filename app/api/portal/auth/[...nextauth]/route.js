// app/api/portal/auth/[...nextauth]/route.js
// Forzamos NEXTAUTH_URL al dominio del portal antes de inicializar NextAuth
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL_PORTAL || "https://app.gestion360ia.com.ar";

import NextAuth from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";

const handler = NextAuth(authPortalOptions);
export { handler as GET, handler as POST };
