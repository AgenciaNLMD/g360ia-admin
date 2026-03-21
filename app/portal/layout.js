// app/portal/layout.js
// Layout base del portal tenant — wrappea todas las páginas del portal

import PortalProviders from "./providers";

export const metadata = {
  title: "Portal — Gestión 360 iA",
  description: "Portal del cliente Gestión 360 iA",
};

export default function PortalLayout({ children }) {
  return (
    <PortalProviders>
      {children}
    </PortalProviders>
  );
}
