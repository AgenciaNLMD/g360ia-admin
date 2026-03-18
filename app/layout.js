import Providers from "./providers";

export const metadata = {
  title: "G360 Admin — Gestión 360 iA",
  description: "Panel de administración de Gestión 360 iA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
          body{font-family:'Inter','Segoe UI',system-ui,sans-serif;background:#F2F4F6;min-height:100vh;}
        `}} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
