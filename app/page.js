"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

function LogoIcon() {
  return (
    <svg viewBox="0 0 28 24" width="30" height="26">
      <rect x="0" y="14" width="8" height="8" rx="2" fill="white" opacity=".3"/>
      <rect x="0" y="7" width="8" height="8" rx="2" fill="white" opacity=".6"/>
      <rect x="0" y="0" width="8" height="8" rx="2" fill="white"/>
      <rect x="10" y="0" width="8" height="8" rx="2" fill="white"/>
      <rect x="10" y="7" width="8" height="8" rx="2" fill="white" opacity=".6"/>
      <rect x="20" y="0" width="8" height="8" rx="2" fill="#B08A55"/>
    </svg>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* 🔥 SPLASH */}
      {loading && (
        <div id="g360-splash">
          <div id="g360-splash-icon">
            <LogoIcon />
          </div>

          <div id="g360-splash-name">
            Gestión 360 <span>iA</span>
          </div>

          <div id="g360-splash-sub">Cargando...</div>

          <div id="g360-splash-dots">
            <div className="g360-dot"></div>
            <div className="g360-dot"></div>
            <div className="g360-dot"></div>
          </div>
        </div>
      )}

      {/* 🔥 LOGIN */}
      {!loading && (
        <div style={styles.container}>
          <div style={styles.logoBox}>
            <LogoIcon /> {/* ✅ MISMO ICONO */}
          </div>

          <h1 style={styles.title}>
            Gestión 360 <span style={{ color: "#B08A55" }}>iA</span>
          </h1>

          <button style={styles.button} onClick={() => signIn("google")}>
            Iniciar sesión con Google
          </button>
        </div>
      )}

      {/* 🔥 ESTILOS */}
      <style jsx global>{`
        #g360-splash {
          position: fixed;
          inset: 0;
          background: #F2F4F6;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          z-index: 9999;
        }

        #g360-splash-icon {
          width: 80px;
          height: 80px;
          background: #506886;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(80,104,134,.4);
          animation: g360IconPop .5s cubic-bezier(.34,1.56,.64,1) forwards;
        }

        #g360-splash-name {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #1F2937;
        }

        #g360-splash-name span {
          color: #B08A55;
        }

        #g360-splash-sub {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #9CA3AF;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .g360-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #D1D5DB;
          animation: g360Pulse 1.2s ease infinite;
        }

        @keyframes g360IconPop {
          from { transform: scale(.4); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }

        @keyframes g360Pulse {
          0%,100% { background: #D1D5DB; transform: scale(1) }
          50% { background: #506886; transform: scale(1.4) }
        }
      `}</style>
    </>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#F2F4F6",
    gap: "20px"
  },
  logoBox: {
    width: 70,
    height: 70,
    background: "#506886",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: "#1F2937"
  },
  button: {
    padding: "12px 24px",
    borderRadius: 10,
    border: "none",
    background: "#506886",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14
  }
};
