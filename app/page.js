"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={styles.splash}>
        <div style={styles.logoBox}>
          <div style={styles.logoIcon}></div>
        </div>
        <div style={styles.title}>Gestión 360 iA</div>
        <div style={styles.subtitle}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.logoBox}>
        <div style={styles.logoIcon}></div>
      </div>

      <h1 style={styles.title}>Gestión 360 iA</h1>

      <button style={styles.button} onClick={() => signIn("google")}>
        Iniciar sesión
      </button>
    </div>
  );
}

const styles = {
  splash: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#F2F4F6"
  },
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
  logoIcon: {
    width: 30,
    height: 30,
    background: "#fff",
    borderRadius: 6
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: "#1F2937"
  },
  subtitle: {
    fontSize: 12,
    color: "#9CA3AF"
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
