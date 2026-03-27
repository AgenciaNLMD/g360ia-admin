"use client";
// app/portal/providers.js
// SessionProvider específico del portal — apunta al endpoint de auth del portal

import { SessionProvider } from "next-auth/react";

export default function PortalProviders({ children }) {
  return (
    <SessionProvider basePath="/api/portal/auth">
      {children}
    </SessionProvider>
  );
}
