"use client";

export default function Pendiente() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#F2F4F6",
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
        maxWidth: 420,
        boxShadow: "0 4px 24px rgba(15,23,42,.08)",
        textAlign: "center",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, background: "#506886", borderRadius: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="26" height="21">
              <rect x="0"  y="10" width="6" height="6" rx="1.5" fill="white" opacity=".35"/>
              <rect x="0"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
              <rect x="0"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
              <rect x="8"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
              <rect x="8"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
              <rect x="16" y="0"  width="6" height="6" rx="1.5" fill="#B08A55"/>
            </svg>
          </div>
        </div>

        {/* Nombre */}
        <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "#1F2937", marginBottom: 16 }}>
          Gestión 360 <span style={{ color: "#B08A55" }}>iA</span>
        </div>

        {/* Badge */}
        <span style={{
          display: "inline-block",
          background: "rgba(234,179,8,.10)",
          color: "#92680A",
          border: "1px solid rgba(234,179,8,.25)",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          padding: "5px 14px",
          marginBottom: 18,
        }}>
          Cuenta pendiente de aprobación
        </span>

        {/* Título */}
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1F2937", marginBottom: 10, letterSpacing: "-.2px" }}>
          Estamos revisando tu solicitud
        </h1>

        {/* Texto */}
        <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          Tu cuenta fue registrada correctamente. Un administrador debe aprobar tu acceso antes de que puedas ingresar al panel.
        </p>

        {/* Info box */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "#FFFBF5", border: "1px solid #E8D5AF",
          borderRadius: 12, padding: "14px 16px", textAlign: "left",
          marginBottom: 24,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M20 4H4C2.897 4 2 4.897 2 6v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zm0 2-8 5-8-5h16zm0 12H4V8.158l8 5 8-5V18z" fill="#B08A55"/>
          </svg>
          <p style={{ fontSize: 13, color: "#7A5C1E", lineHeight: 1.5, margin: 0 }}>
            Recibirás un correo cuando tu cuenta esté habilitada y lista para usar.
          </p>
        </div>

        {/* Stepper */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Step num="1" label="Registrada" done />
          <div style={{ flex: 1, height: 1, background: "#E5E7EB", maxWidth: 36 }} />
          <Step num="2" label="En revisión" active />
          <div style={{ flex: 1, height: 1, background: "#E5E7EB", maxWidth: 36 }} />
          <Step num="3" label="Aprobada" />
        </div>

      </div>
    </div>
  );
}

function Step({ num, label, done, active }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 80 }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        background: done ? "#506886" : active ? "#EEF2F7" : "#F3F4F6",
        border: active ? "2px solid #506886" : done ? "none" : "1.5px solid #D1D5DB",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: done ? "white" : active ? "#506886" : "#9CA3AF",
        fontSize: 13, fontWeight: 700,
      }}>
        {done ? "✓" : num}
      </div>
      <span style={{
        fontSize: 11,
        color: done ? "#506886" : active ? "#374151" : "#9CA3AF",
        fontWeight: active || done ? 600 : 400,
        textAlign: "center", lineHeight: 1.3,
      }}>
        {label}
      </span>
    </div>
  );
}
