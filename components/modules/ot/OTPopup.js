"use client";

import { useState, useEffect } from "react";

const ESTADOS = [
  { value: "recibido",       label: "Recibido"            },
  { value: "en_diagnostico", label: "En diagnóstico"      },
  { value: "presupuestado",  label: "Presupuestado"       },
  { value: "aprobado",       label: "Aprobado"            },
  { value: "en_reparacion",  label: "En reparación"       },
  { value: "listo",          label: "Listo para entregar" },
  { value: "entregado",      label: "Entregado"           },
];

const BADGE_MAP = {
  recibido:       "ui-badge--blue",
  en_diagnostico: "ui-badge--amber",
  presupuestado:  "ui-badge--amber",
  aprobado:       "ui-badge--green",
  en_reparacion:  "ui-badge--blue",
  listo:          "ui-badge--green",
  entregado:      "ui-badge--gray",
};

export default function OTPopup({ orden, rol, onClose, onActualizada }) {
  const [detalle,      setDetalle]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [nuevoEstado,  setNuevoEstado]  = useState(orden.estado);
  const [nota,         setNota]         = useState("");
  const [cambiando,    setCambiando]    = useState(false);
  const [pedirGar,     setPedirGar]     = useState(false);
  const [diasGar,      setDiasGar]      = useState("");
  const [msgEstado,    setMsgEstado]    = useState("");

  useEffect(() => {
    fetch(`/api/ot/ordenes/${orden.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setDetalle(d.orden);
          setNuevoEstado(d.orden.estado);
        }
      })
      .finally(() => setLoading(false));
  }, [orden.id]);

  async function confirmarEstado() {
    if (!nuevoEstado || nuevoEstado === detalle?.estado) return;

    // Si va a entregado y aún no pedimos días de garantía → mostrar input
    if (nuevoEstado === "entregado" && !pedirGar) {
      setPedirGar(true);
      return;
    }

    setCambiando(true);
    setMsgEstado("");
    try {
      const res = await fetch(`/api/ot/ordenes/${orden.id}/estado`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          estado:        nuevoEstado,
          nota:          nota || null,
          dias_garantia: nuevoEstado === "entregado" ? (parseInt(diasGar) || 0) : null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setDetalle(d => ({ ...d, estado: nuevoEstado }));
        setPedirGar(false);
        setDiasGar("");
        setNota("");
        setMsgEstado("Estado actualizado ✓");
        onActualizada();
      } else {
        setMsgEstado(data.error || "Error al actualizar");
      }
    } finally {
      setCambiando(false);
    }
  }

  const base      = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = detalle ? `${base}/ot/${detalle.token_publico}` : null;
  const qrSrc     = publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(publicUrl)}&size=120x120`
    : null;
  const garVigente = detalle?.garantia?.estado === "vigente";
  const wspGar     = garVigente && publicUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Garantía digital — ${detalle.numero_ot}:\n${publicUrl}`)}`
    : null;

  return (
    <div className="pmodal-backdrop" onClick={onClose}>
      <div className="pmodal pmodal--lg" onClick={e => e.stopPropagation()}>

        <div className="pmodal__header">
          <div className="pmodal__title">
            {loading ? "Cargando…" : `OT ${detalle?.numero_ot}`}
            {detalle && (
              <span className={`ui-badge ${BADGE_MAP[detalle.estado] || "ui-badge--gray"}`}
                style={{ marginLeft: 10, fontSize: 11 }}>
                {ESTADOS.find(e => e.value === detalle.estado)?.label || detalle.estado}
              </span>
            )}
          </div>
          <button className="pmodal__close" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="pmodal__body">
          {loading ? (
            <div className="ui-empty">
              <div className="ui-empty__icon"><i className="bi bi-arrow-repeat" /></div>
              <div className="ui-empty__text">Cargando…</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Datos del equipo */}
              <div>
                <div style={sTitle}><i className="bi bi-cpu" style={{ marginRight: 6 }} />Equipo</div>
                <Row label="Tipo"         val={detalle.equipo_tipo} />
                <Row label="Marca / Modelo" val={`${detalle.equipo_marca || ""} ${detalle.equipo_modelo || ""}`.trim() || "—"} />
                {detalle.equipo_serie && <Row label="Serie / IMEI" val={detalle.equipo_serie} />}
                <Row label="Problema" val={detalle.problema_reportado} />
                {detalle.diagnostico && <Row label="Diagnóstico" val={detalle.diagnostico} />}
                {detalle.presupuesto_total && (
                  <Row label="Presupuesto" val={`$${parseFloat(detalle.presupuesto_total).toLocaleString("es-AR")}`} />
                )}
                <Row label="Ingreso" val={new Date(detalle.creado_en).toLocaleDateString("es-AR")} />
                {detalle.entrega_fecha && (
                  <Row label="Entregado" val={new Date(detalle.entrega_fecha).toLocaleDateString("es-AR")} />
                )}
              </div>

              {/* Garantía */}
              {detalle.garantia && (
                <div style={{ background: garVigente ? "var(--em-pale)" : "var(--bg-soft)", borderRadius: 10, padding: 14 }}>
                  <div style={sTitle}>
                    <i className="bi bi-shield-check" style={{ marginRight: 6, color: garVigente ? "var(--em)" : "var(--sub)" }} />
                    Garantía
                    <span className={`ui-badge ${garVigente ? "ui-badge--green" : "ui-badge--gray"}`} style={{ marginLeft: 8, fontSize: 10 }}>
                      {detalle.garantia.estado}
                    </span>
                  </div>
                  {garVigente && (
                    <>
                      <Row label="Período" val={`${detalle.garantia.dias_garantia} días`} />
                      <Row label="Válida hasta" val={new Date(detalle.garantia.fecha_vence).toLocaleDateString("es-AR")} />
                    </>
                  )}
                  {detalle.garantia.motivo_anulacion && (
                    <Row label="Motivo anulación" val={detalle.garantia.motivo_anulacion} />
                  )}
                </div>
              )}

              {/* QR + WhatsApp */}
              {qrSrc && (
                <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "14px 0", borderTop: "var(--divider)", borderBottom: "var(--divider)" }}>
                  <img
                    src={qrSrc}
                    alt="QR"
                    style={{ width: 80, height: 80, borderRadius: 8, border: "1px solid var(--border)", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>
                      Archivo digital de la OT
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", wordBreak: "break-all", marginBottom: 8 }}>
                      {publicUrl}
                    </div>
                    {wspGar ? (
                      <a href={wspGar} target="_blank" rel="noreferrer" className="ui-btn ui-btn--primary ui-btn--sm">
                        <i className="bi bi-whatsapp" style={{ marginRight: 4 }} />Enviar garantía por WhatsApp
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        WhatsApp disponible cuando la garantía esté vigente
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Cambiar estado */}
              <div>
                <div style={sTitle}><i className="bi bi-arrow-left-right" style={{ marginRight: 6 }} />Cambiar estado</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <select
                    className="ui-select"
                    style={{ flex: 1, minWidth: 180 }}
                    value={nuevoEstado}
                    onChange={e => { setNuevoEstado(e.target.value); setPedirGar(false); setMsgEstado(""); }}
                  >
                    {ESTADOS.map(e => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                  <button
                    className="ui-btn ui-btn--primary ui-btn--sm"
                    onClick={confirmarEstado}
                    disabled={cambiando || nuevoEstado === detalle?.estado}
                  >
                    {cambiando ? "Guardando…" : "Confirmar"}
                  </button>
                </div>

                {/* Input garantía al entregar */}
                {pedirGar && nuevoEstado === "entregado" && (
                  <div style={{ marginTop: 12, padding: 14, background: "var(--bg-soft)", borderRadius: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--text2)" }}>
                      <i className="bi bi-shield-check" style={{ marginRight: 6, color: "var(--em)" }} />
                      ¿Aplicar garantía? (0 = sin garantía)
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        className="ui-input"
                        type="number"
                        min="0"
                        placeholder="Días de garantía"
                        value={diasGar}
                        onChange={e => setDiasGar(e.target.value)}
                        style={{ maxWidth: 200 }}
                      />
                      <button
                        className="ui-btn ui-btn--primary ui-btn--sm"
                        onClick={confirmarEstado}
                        disabled={cambiando}
                      >
                        {cambiando ? "Guardando…" : "Confirmar entrega"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Nota */}
                <div style={{ marginTop: 10 }}>
                  <input
                    className="ui-input"
                    placeholder="Nota del cambio (opcional)"
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                  />
                </div>

                {msgEstado && (
                  <div style={{ marginTop: 8, fontSize: 13, color: msgEstado.includes("✓") ? "var(--em)" : "var(--alert, #dc2626)" }}>
                    {msgEstado}
                  </div>
                )}
              </div>

              {/* Log de estados */}
              {detalle.log?.length > 0 && (
                <div>
                  <div style={sTitle}><i className="bi bi-clock-history" style={{ marginRight: 6 }} />Historial de estados</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {detalle.log.map((l, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "var(--divider)", fontSize: 13, alignItems: "baseline" }}>
                        <span style={{ color: "var(--muted)", fontSize: 11, minWidth: 80 }}>
                          {new Date(l.creado_en).toLocaleDateString("es-AR")}
                        </span>
                        <span style={{ color: "var(--sub)" }}>{l.estado_anterior || "—"}</span>
                        <i className="bi bi-arrow-right" style={{ fontSize: 10, color: "var(--muted)" }} />
                        <span style={{ fontWeight: 600, color: "var(--pr)" }}>{l.estado_actual}</span>
                        {l.nota && (
                          <span style={{ color: "var(--sub)", fontStyle: "italic", fontSize: 12 }}>— {l.nota}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, val }) {
  return (
    <div style={{ display: "flex", padding: "6px 0", borderBottom: "var(--divider)", fontSize: 13, gap: 12 }}>
      <span style={{ color: "var(--sub)", minWidth: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--text)", fontWeight: 500 }}>{val || "—"}</span>
    </div>
  );
}

const sTitle = {
  fontWeight: 700,
  fontSize: 13,
  color: "var(--text2)",
  marginBottom: 8,
  display: "flex",
  alignItems: "center",
};
