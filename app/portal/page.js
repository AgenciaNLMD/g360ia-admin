"use client";

// app/portal/page.js
// Página de login del portal tenant

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
      callbackUrl: "/portal/dashboard",
      // Usa el provider de portal (ruta diferente al admin)
    });
  };

  return (
    <>
      <div style={{
        minHeight: "100vh",
        background: "#F0F4F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 4px 24px rgba(15,23,42,.08)",
        }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 44, height: 44,
              background: "#1A7A4A",
              borderRadius: 11,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="22" height="18">
                <rect x="0" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".35"/>
                <rect x="0" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
                <rect x="0" y="0"  width="6" height="6" rx="1.5" fill="white"/>
                <rect x="8" y="0"  width="6" height="6" rx="1.5" fill="white"/>
                <rect x="8" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
                <rect x="16" y="0" width="6" height="6" rx="1.5" fill="#B08A55"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1F2937" }}>
                Gestión 360 <span style={{ color: "#B08A55" }}>iA</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Portal del cliente
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "#F3F4F6", marginBottom: 24 }} />

          <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: 20, lineHeight: 1.6 }}>
            Ingresá con la cuenta de Google asociada a tu negocio.
          </p>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              background: "#1A7A4A",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "13px 18px",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {loading ? "Conectando..." : (
              <>
                <GoogleIcon />
                Acceder con Google
              </>
            )}
          </button>

          <p style={{ fontSize: "0.72rem", color: "#9CA3AF", textAlign: "center", marginTop: 16 }}>
            ¿Problemas para ingresar? Contactá a tu proveedor.
          </p>

        </div>
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.292C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
