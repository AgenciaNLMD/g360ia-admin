// middleware.js
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/perfil/:path*",
    "/bienvenido/:path*",
    "/portal/dashboard/:path*",
    "/portal/bienvenido/:path*",
  ],
};
