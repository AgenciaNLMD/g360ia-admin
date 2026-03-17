export default function Pendiente() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "#F2F4F6",
      textAlign: "center",
      padding: "20px"
    }}>
      <h1>Acceso pendiente</h1>
      <p>
        Tu cuenta fue registrada correctamente.<br />
        Un administrador debe aprobar tu acceso.<br /><br />
        Te notificaremos por email cuando esté habilitado.
      </p>
    </div>
  );
}
