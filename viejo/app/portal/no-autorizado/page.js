"use client";
// app/portal/no-autorizado/page.js

export default function NoAutorizado() {
  return (
    <PaginaEstado
      titulo="Acceso no autorizado"
      mensaje="Tu cuenta de Google no está registrada en ningún negocio. Contactá a tu proveedor para que te active el acceso."
      color="#D9534F"
      icono="✕"
    />
  );
}

// ─────────────────────────────────────────────
// Reutilizable para los otros estados
function PaginaEstado({ titulo, mensaje, color, icono }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#F0F4F0",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        background: "#fff", border: "1px solid #E5E7EB",
        borderRadius: 16, padding: "32px 28px",
        width: "100%", maxWidth: 400,
        boxShadow: "0 4px 24px rgba(15,23,42,.08)", textAlign: "center",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: color + "20", border: `2px solid ${color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.4rem", margin: "0 auto 1rem",
        }}>
          {icono}
        </div>
        <h1 style={{ fontSize: "1rem", fontWeight: 700, color: "#1F2937", marginBottom: 8 }}>
          {titulo}
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#6B7280", lineHeight: 1.6, marginBottom: 20 }}>
          {mensaje}
        </p>
        <a href="/portal" style={{
          display: "inline-block", background: "#1A7A4A", color: "#fff",
          textDecoration: "none", borderRadius: 8, padding: "10px 24px",
          fontSize: "0.85rem", fontWeight: 600,
        }}>
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
