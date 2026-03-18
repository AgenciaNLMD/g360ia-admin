"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AuthCallback() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user) {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: "AUTH_SUCCESS",
          user: {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }
        }, window.location.origin);
        window.close();
      } else {
        window.location.href = "https://www.gestion360ia.com.ar/main.html";
      }
      return;
    }

    if (status === "unauthenticated") {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "AUTH_PENDING" }, window.location.origin);
        window.close();
      } else {
        window.location.href = "/pendiente";
      }
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
      <div style={{fontSize:14,color:"#6B7280"}}>Verificando acceso...</div>
      <div style={{display:"flex",gap:6}}>
        {[0,200,400].map((d,i)=>(
          <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#C5CDD6",animation:"pulse 1.2s ease infinite",animationDelay:d+"ms"}} />
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{background:#C5CDD6;transform:scale(1)}50%{background:#506886;transform:scale(1.3)}}`}</style>
    </div>
  );
}
