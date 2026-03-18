export default function Pendiente() {
  return (
    <>
      <div className="root">
        <div className="card">

          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo-box">
              <G360Logo />
            </div>
          </div>

          {/* Badge */}
          <span className="badge">Cuenta pendiente de aprobación</span>

          {/* Título */}
          <h1 className="title">Estamos revisando tu solicitud</h1>

          {/* Texto */}
          <p className="body">
            Tu cuenta fue registrada correctamente. Un administrador debe
            aprobar tu acceso antes de que puedas ingresar al panel.
          </p>

          {/* Info box */}
          <div className="infobox">
            <div className="infobox-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4C2.897 4 2 4.897 2 6v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zm0 2-8 5-8-5h16zm0 12H4V8.158l8 5 8-5V18z" fill="#B08A55"/>
              </svg>
            </div>
            <p className="infobox-text">
              Recibirás un correo electrónico cuando tu cuenta esté habilitada y lista para usar.
            </p>
          </div>

          {/* Steps */}
          <div className="steps">
            <Step num="1" label="Solicitud registrada" done />
            <div className="step-line" />
            <Step num="2" label="Revisión por administrador" active />
            <div className="step-line" />
            <Step num="3" label="Acceso habilitado" />
          </div>

        </div>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .root {
          min-height: 100vh;
          background: #F0F2F5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', system-ui, sans-serif;
          padding: 24px 16px;
        }

        .card {
          background: white;
          border-radius: 28px;
          box-shadow: 0 20px 60px rgba(15,23,42,.10);
          border: 1px solid #E5E7EB;
          padding: 40px 36px;
          max-width: 440px;
          width: 100%;
          text-align: center;
        }

        .logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .logo-box {
          width: 72px;
          height: 72px;
          background: #506886;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(80,104,134,.25);
        }

        .badge {
          display: inline-block;
          background: rgba(234,179,8,.10);
          color: #92680A;
          border: 1px solid rgba(234,179,8,.25);
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 14px;
          margin-bottom: 16px;
        }

        .title {
          font-size: 22px;
          font-weight: 700;
          color: #1F2937;
          letter-spacing: -.2px;
          margin-bottom: 10px;
        }

        .body {
          color: #6B7280;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .infobox {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #FFFBF5;
          border: 1px solid #E8D5AF;
          border-radius: 14px;
          padding: 14px 16px;
          text-align: left;
          margin-bottom: 28px;
        }

        .infobox-icon { flex-shrink: 0; margin-top: 1px; }

        .infobox-text {
          font-size: 13px;
          color: #7A5C1E;
          line-height: 1.5;
        }

        /* Steps */
        .steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .step-line {
          flex: 1;
          height: 1px;
          background: #E5E7EB;
          max-width: 40px;
        }
      `}</style>
    </>
  );
}

function Step({ num, label, done, active }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "0 0 auto", maxWidth: 90 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: done ? "#506886" : active ? "#EEF2F7" : "#F3F4F6",
        border: active ? "2px solid #506886" : done ? "none" : "1.5px solid #D1D5DB",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: done ? "white" : active ? "#506886" : "#9CA3AF",
        fontSize: 13, fontWeight: 700,
        transition: "all .3s",
      }}>
        {done ? "✓" : num}
      </div>
      <span style={{ fontSize: 11, color: done ? "#506886" : active ? "#374151" : "#9CA3AF", fontWeight: active || done ? 600 : 400, textAlign: "center", lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  );
}

function G360Logo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" width="38" height="33">
      <rect x="0" y="14" width="8" height="8" rx="2" fill="white" opacity=".3" />
      <rect x="0" y="7" width="8" height="8" rx="2" fill="white" opacity=".6" />
      <rect x="0" y="0" width="8" height="8" rx="2" fill="white" />
      <rect x="10" y="0" width="8" height="8" rx="2" fill="white" />
      <rect x="10" y="7" width="8" height="8" rx="2" fill="white" opacity=".6" />
      <rect x="20" y="0" width="8" height="8" rx="2" fill="#B08A55" />
    </svg>
  );
}
