export default function Pendiente() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0D1117",
        color: "#FFFFFF",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          background: "#161B22",
          border: "1px solid #30363D",
          borderRadius: "16px",
          padding: "30px",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        {/* LOGO */}
        <div style={{ marginBottom: "20px" }}>
          <img src="/logo.svg" alt="Gestion 360 IA" style={{ height: "50px" }} />
        </div>

        {/* BADGE */}
        <div style={{ marginBottom: "15px" }}>
          <span
            style={{
              background: "rgba(234,179,8,0.1)",
              color: "#FACC15",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              border: "1px solid rgba(234,179,8,0.2)",
            }}
          >
            Cuenta pendiente
          </span>
        </div>

        {/* TITULO */}
        <h1 style={{ fontSize: "20px", marginBottom: "10px" }}>
          Estamos revisando tu solicitud
        </h1>

        {/* TEXTO */}
        <p style={{ color: "#9CA3AF", fontSize: "14px", marginBottom: "20px" }}>
          Tu cuenta fue creada correctamente.  
          Un administrador debe aprobar el acceso antes de ingresar.
        </p>

        {/* INFO */}
        <div
          style={{
            background: "#0D1117",
            border: "1px solid #30363D",
            borderRadius: "10px",
            padding: "15px",
            fontSize: "13px",
            color: "#9CA3AF",
          }}
        >
          Te avisaremos por email cuando tu cuenta esté habilitada.
        </div>
      </div>
    </div>
  );
}
