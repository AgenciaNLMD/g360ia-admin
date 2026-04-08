// app/ot/[token]/page.js
// Página pública del Archivo Digital del Trabajo (ADT)
// Sin autenticación — accesible via QR o link de WhatsApp

import modulosDb from "@/lib/modulos-db";

/* ── Mapa de estados ─────────────────────────────────────────────────────── */
const ESTADO = {
  recibido: {
    label: "Equipo recibido",
    emoji: "📥",
    color: "#1499C2",
    desc:  "Tu equipo fue recibido. Pronto comenzamos el diagnóstico.",
  },
  en_diagnostico: {
    label: "En diagnóstico",
    emoji: "🔍",
    color: "#B08A55",
    desc:  "Nuestros técnicos están revisando tu equipo.",
  },
  presupuestado: {
    label: "Presupuesto listo",
    emoji: "📋",
    color: "#B08A55",
    desc:  "El diagnóstico está completo. Te contactaremos con el presupuesto.",
  },
  aprobado: {
    label: "Presupuesto aprobado",
    emoji: "✅",
    color: "#1A7A4A",
    desc:  "El presupuesto fue aprobado. Comenzamos la reparación.",
  },
  en_reparacion: {
    label: "En reparación",
    emoji: "🔧",
    color: "#1499C2",
    desc:  "Tu equipo está siendo reparado por nuestros técnicos.",
  },
  listo: {
    label: "Listo para retirar",
    emoji: "🎉",
    color: "#1A7A4A",
    desc:  "¡Tu equipo está listo! Podés pasar a retirarlo cuando quieras.",
  },
  entregado: {
    label: "Entregado",
    emoji: "📦",
    color: "#5C6E85",
    desc:  "El equipo fue entregado.",
  },
};

/* ── Fetch de datos ──────────────────────────────────────────────────────── */
async function getData(token) {
  try {
    const [ordenes] = await modulosDb.query(
      "SELECT * FROM ot_ordenes WHERE token_publico = ?",
      [token]
    );
    if (!ordenes.length) return null;

    const orden = ordenes[0];

    const [garantia] = await modulosDb.query(
      "SELECT * FROM ot_garantia WHERE orden_id = ? LIMIT 1",
      [orden.id]
    );

    // Auto-vencer garantía vencida
    if (garantia[0]?.estado === "vigente" && new Date(garantia[0].fecha_vence) < new Date()) {
      await modulosDb.query(
        "UPDATE ot_garantia SET estado = 'vencida' WHERE id = ?",
        [garantia[0].id]
      );
      garantia[0].estado = "vencida";
    }

    return { orden, garantia: garantia[0] || null };
  } catch {
    return null;
  }
}

/* ── Página ──────────────────────────────────────────────────────────────── */
export default async function OTPublicaPage({ params }) {
  const data = await getData(params.token);

  /* 404 inline */
  if (!data) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ ...s.header, background: "#6b7280" }}>
            <div style={{ fontSize: 40 }}>❌</div>
            <div style={s.hNumero}>OT no encontrada</div>
          </div>
          <div style={s.body}>
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14 }}>
              El link que utilizaste no es válido o la orden no existe.
            </p>
          </div>
          <div style={s.footer}>Powered by G360iA</div>
        </div>
      </div>
    );
  }

  const { orden, garantia } = data;
  const info              = ESTADO[orden.estado] || { label: orden.estado, emoji: "📋", color: "#5C6E85", desc: "" };
  const esEntregada       = orden.estado === "entregado";
  const garVigente        = garantia?.estado === "vigente";
  const baseUrl           = process.env.NEXTAUTH_URL || "";
  const publicUrl         = `${baseUrl}/ot/${params.token}`;
  const qrSrc             = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(publicUrl)}&size=180x180`;
  const wspText           = garVigente
    ? `Garantía digital de tu reparación — ${orden.numero_ot}:\n${publicUrl}`
    : null;

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header con estado */}
        <div style={{ ...s.header, background: info.color }}>
          <div style={{ fontSize: 38 }}>{info.emoji}</div>
          <div style={s.hNumero}>{orden.numero_ot}</div>
          <div style={s.hEstado}>{info.label}</div>
        </div>

        <div style={s.body}>

          {/* Descripción del estado */}
          <p style={s.desc}>{info.desc}</p>

          {/* Datos del equipo */}
          <div style={s.section}>
            <div style={s.sTitle}>🖥 Equipo</div>
            <DataRow label="Tipo"         val={orden.equipo_tipo} />
            {(orden.equipo_marca || orden.equipo_modelo) && (
              <DataRow
                label="Marca / Modelo"
                val={`${orden.equipo_marca || ""} ${orden.equipo_modelo || ""}`.trim()}
              />
            )}
            {orden.equipo_serie && (
              <DataRow label="Serie / IMEI" val={orden.equipo_serie} />
            )}
            <DataRow
              label="Ingresó"
              val={new Date(orden.creado_en).toLocaleDateString("es-AR")}
            />
            {orden.entrega_fecha && (
              <DataRow
                label="Entregado"
                val={new Date(orden.entrega_fecha).toLocaleDateString("es-AR")}
              />
            )}
          </div>

          {/* Garantía — solo cuando la OT está entregada */}
          {esEntregada && garantia && (
            <div style={{
              ...s.section,
              background: garVigente ? "#f0faf4" : "#f5f5f5",
              borderRadius: 12,
              padding: 16,
              marginTop: 8,
            }}>
              <div style={s.sTitle}>
                🛡 Garantía{" "}
                <span style={{
                  marginLeft: 8,
                  padding: "2px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: garVigente ? "#1A7A4A" : garantia.estado === "anulada" ? "#dc2626" : "#6b7280",
                  color: "#fff",
                }}>
                  {garantia.estado}
                </span>
              </div>

              {garVigente && (
                <>
                  <DataRow label="Período"      val={`${garantia.dias_garantia} días`} />
                  <DataRow
                    label="Válida hasta"
                    val={new Date(garantia.fecha_vence).toLocaleDateString("es-AR")}
                    highlight
                  />
                </>
              )}

              {garantia.estado === "vencida" && (
                <p style={{ fontSize: 13, color: "#6b7280", margin: "8px 0 0" }}>
                  La garantía venció el{" "}
                  {new Date(garantia.fecha_vence).toLocaleDateString("es-AR")}.
                </p>
              )}

              {garantia.estado === "anulada" && (
                <>
                  <p style={{ fontSize: 13, color: "#dc2626", margin: "8px 0 0" }}>
                    Esta garantía fue anulada.
                  </p>
                  {garantia.motivo_anulacion && (
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>
                      Motivo: {garantia.motivo_anulacion}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Sin garantía */}
          {esEntregada && !garantia && (
            <div style={{ background: "#f5f5f5", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>🔒</div>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                Este trabajo no incluye garantía.
              </p>
            </div>
          )}

          {/* QR + WhatsApp — solo con garantía vigente */}
          {garVigente && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <img
                src={qrSrc}
                alt="QR garantía"
                style={{ width: 150, height: 150, borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 12 }}
              />
              <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 16px" }}>
                Compartí este QR o el link para acceder al documento de garantía
              </p>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(wspText)}`}
                target="_blank"
                rel="noreferrer"
                style={s.wspBtn}
              >
                📱 Enviar por WhatsApp
              </a>
            </div>
          )}

        </div>

        <div style={s.footer}>Powered by G360iA</div>
      </div>
    </div>
  );
}

/* ── Componente fila de datos ──────────────────────────────────────────────── */
function DataRow({ label, val, highlight }) {
  return (
    <div style={{
      display:       "flex",
      justifyContent: "space-between",
      padding:       "7px 0",
      borderBottom:  "1px solid #F0F3F6",
      fontSize:      14,
      gap:           12,
    }}>
      <span style={{ color: "#7A8898", minWidth: 120 }}>{label}</span>
      <span style={{ color: highlight ? "#1A7A4A" : "#1E2A36", fontWeight: highlight ? 700 : 500, textAlign: "right" }}>
        {val || "—"}
      </span>
    </div>
  );
}

/* ── Estilos ─────────────────────────────────────────────────────────────── */
const s = {
  page: {
    minHeight:       "100vh",
    background:      "#F4F6F8",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    padding:         "20px 16px",
    fontFamily:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    background:    "#ffffff",
    borderRadius:  16,
    boxShadow:     "0 4px 24px rgba(0,0,0,0.10)",
    width:         "100%",
    maxWidth:      460,
    overflow:      "hidden",
  },
  header: {
    padding:    "28px 24px",
    color:      "#fff",
    textAlign:  "center",
  },
  hNumero: {
    fontSize:      28,
    fontWeight:    800,
    letterSpacing: 1,
    marginTop:     10,
  },
  hEstado: {
    fontSize:  15,
    fontWeight: 500,
    opacity:   0.9,
    marginTop: 4,
  },
  body: {
    padding: "24px 24px 20px",
  },
  desc: {
    fontSize:     15,
    color:        "#3A4A5C",
    textAlign:    "center",
    marginBottom: 20,
    lineHeight:   1.6,
    margin:       "0 0 20px",
  },
  section: {
    marginBottom: 16,
  },
  sTitle: {
    fontWeight:    700,
    fontSize:      13,
    color:         "#3A4A5C",
    marginBottom:  10,
    display:       "flex",
    alignItems:    "center",
    gap:           6,
  },
  wspBtn: {
    display:        "inline-flex",
    alignItems:     "center",
    gap:            8,
    background:     "#25D366",
    color:          "#fff",
    padding:        "13px 28px",
    borderRadius:   10,
    textDecoration: "none",
    fontWeight:     700,
    fontSize:       15,
  },
  footer: {
    textAlign:   "center",
    padding:     "12px 24px",
    borderTop:   "1px solid #F0F3F6",
    fontSize:    11,
    color:       "#9AAAB8",
    letterSpacing: 0.5,
  },
};
