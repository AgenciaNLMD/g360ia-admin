import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "G360 Admin — Gestión 360 iA",
  description: "Panel de administración de Gestión 360 iA",
  icons: {
    icon: "/gestion360ia.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
        <link rel="icon" href="/gestion360ia.ico" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
