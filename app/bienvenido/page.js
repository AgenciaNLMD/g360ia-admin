"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function Bienvenido() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && session?.user) {
      const continuar = async () => {
        try {
          localStorage.setItem("g360_last_user", JSON.stringify({
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }));
        } catch (_) {}

        // Registrar sesión con IP y dispositivo real
        try {
          await fetch("/api/perfil/sesiones", { method: "POST" });
        } catch (_) {}

        window.location.href = "/dashboard";
      };
      continuar();
    } else {
      window.location.href = "/";
    }
  }, [status, session]);

  return (
    <div style={{
      minHeight:"100vh", background:"#F2F4F6",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",
      flexDirection:"column", gap:16,
    }}>
      <div style={{width:52,height:52,background:"#506886",borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="26" height="21">
          <rect x="0" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".35"/>
          <rect x="0" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
          <rect x="0" y="0"  width="6" height="6" rx="1.5" fill="white"/>
          <rect x="8" y="0"  width="6" height="6" rx="1.5" fill="white"/>
          <rect x="8" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
          <rect x="16" y="0" width="6" height="6" rx="1.5" fill="#B08A55"/>
        </svg>
      </div>
      <div style={{fontSize:14,color:"#6B7280"}}>Ingresando...</div>
    </div>
  );
}
