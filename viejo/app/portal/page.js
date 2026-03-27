"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/portal/bienvenido");
    }
  }, [status, router]);

  if (status === "loading") {
    return null;
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          textAlign: "center",
          width: "320px",
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>Gestión 360 IA</h2>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          Ingresá con tu cuenta de Google
        </p>

        <button
          onClick={() =>
            signIn("google", {
              callbackUrl: "/portal/bienvenido",
            })
          }
          style={{
            background: "#1f7a4d",
            color: "#fff",
            border: "none",
            padding: "12px",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
            fontWeight: "bold",
          }}
        >
          Acceder con Google
        </button>
      </div>
    </div>
  );
}
