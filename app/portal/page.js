// app/portal/page.js
"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

export default function PortalLoginPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.tenantId) {
      window.location.href = "/portal/dashboard";
    }
  }, [status, session]);

  const handleLogin = () => {
    setLoading(true);
    signIn("google", {
      callbackUrl: "https://app.gestion360ia.com.ar/portal/bienvenido",
    });
  };

  if (status === "loading") return null;

  return (
    // ... el resto del JSX igual, sin cambios
  );
}
```

El único cambio real es reemplazar las 4 líneas del `handleLogin` viejo por `signIn("google", { callbackUrl: "..." })`. Esto hace que NextAuth use el provider correcto a través del `PortalProviders` que ya está configurado con `basePath="/api/portal/auth"`.

Adicionalmente, la redirect URI de Google Console que tiene que quedar activa es **solo esta**:
```
https://app.gestion360ia.com.ar/api/portal/auth/callback/google
