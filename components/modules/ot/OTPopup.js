"use client";

import { useState, useEffect } from "react";

// Metadatos fijos por slug — el ORDEN viene de la DB
const ICON_MAP = {
  recibido:       { icon: "bi-inbox",         label: "Ingreso"     },
  en_diagnostico: { icon: "bi-search",        label: "Diagnóst."   },
  presupuestado:  { icon: "bi-receipt",       label: "Presupuesto" },
  aprobado:       { icon: "bi-check-circle",  label: "Aprobado"    },
  en_reparacion:  { icon: "bi-tools",         label: "Reparac."    },
  listo:          { icon: "bi-box-seam",      label: "Listo"       },
  entregado:      { icon: "bi-bag-check",     label: "Entregado"   },
};

// Fallback estático mientras carga la DB
const LIFECYCLE_DEFAULT = Object.entries(ICON_MAP).map(([value, meta]) => ({
  value, ...meta,
}));

const LABEL_MAP = {
  recibido:       "Recibido",
  en_diagnostico: "En diagnóstico",
  presupuestado:  "Presupuestado",
  aprobado:       "Aprobado",
  en_reparacion:  "En reparación",
  listo:          "Listo para retirar",
  entregado:      "Entregado",
};

const BADGE_MAP = {
  recibido:       "ui-badge--blue",
  en_diagnostico: "ui-badge--amber",
  presupuestado:  "ui-badge--amber",
  aprobado:       "ui-badge--green",
  en_reparacion:  "ui-badge--blue",
  listo:          "ui-badge--green",
  entregado:      "ui-badge--gray",
};

const LOG_ICONS = {
  recibido:       { icon: "bi-inbox",         color: "#6b7280" },
  en_diagnostico: { icon: "bi-search",        color: "#f59e0b" },
  presupuestado:  { icon: "bi-receipt",       color: "#f59e0b" },
  aprobado:       { icon: "bi-check-circle",  color: "#22c55e" },
  en_reparacion:  { icon: "bi-tools",         color: "#3b82f6" },
  listo:          { icon: "bi-box-seam",      color: "#22c55e" },
  entregado:      { icon: "bi-bag-check",     color: "#506886" },
};

// nextEstado se computa dentro del componente usando lifecycle dinámico

function PrioridadDot({ p }) {
  if (!p || p === "normal") return null;
  return (
    <span className={`ot-prio ot-prio--${p}`} style={{ marginLeft: 8 }}>
      <span className="ot-prio__dot" />
      {p === "urgente" ? "Urgente" : "Alta"}
    </span>
  );
}

export default function OTPopup({ orden, rol, onClose, onActualizada }) {
  const [detalle,   setDetalle]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [avanzando, setAvanzando] = useState(false);
  const [pedirGar,  setPedirGar]  = useState(false);
  const [diasGar,   setDiasGar]   = useState("90");
  const [nota,      setNota]      = useState("");
  const [msg,       setMsg]       = useState("");
  const [lifecycle, setLifecycle] = useState(LIFECYCLE_DEFAULT);

  // Carga detalle y orden de estados en paralelo
  useEffect(() => {
    Promise.all([
      fetch(`/api/ot/ordenes/${orden.id}`).then(r => r.json()),
      fetch("/api/ot/estados-custom").then(r => r.json()),
    ]).then(([det, est]) => {
      if (det.ok) setDetalle(det.orden);
      if (est.ok && est.estados?.length) {
        setLifecycle(est.estados.map(e => ({
          value: e.nombre,
          label: ICON_MAP[e.nombre]?.label ?? e.nombre,
          icon:  ICON_MAP[e.nombre]?.icon  ?? "bi-circle",
        })));
      }
    }).finally(() => setLoading(false));
  }, [orden.id]);

  const estadoActual  = detalle?.estado ?? orden.estado;
  const lcIndex       = lifecycle.findIndex(s => s.value === estadoActual);
  const siguienteEst  = (lcIndex === -1 || lcIndex === lifecycle.length - 1)
    ? null
    : lifecycle[lcIndex + 1].value;
  const garVigente    = detalle?.garantia?.estado === "vigente";
  const base          = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl     = detalle ? `${base}/ot/${detalle.token_publico}` : null;
  const qrSrc         = publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(publicUrl)}&size=200x200`
    : null;

  async function avanzar() {
    if (!siguienteEst) return;
    if (siguienteEst === "entregado" && !pedirGar) { setPedirGar(true); return; }
    setAvanzando(true); setMsg("");
    try {
      const res = await fetch(`/api/ot/ordenes/${orden.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado:        siguienteEst,
          nota:          nota || null,
          dias_garantia: siguienteEst === "entregado" ? (parseInt(diasGar) || 0) : null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setDetalle(d => ({ ...d, estado: siguienteEst }));
        setPedirGar(false); setNota(""); setMsg("Estado actualizado ✓");
        onActualizada();
      } else { setMsg(data.error || "Error"); }
    } finally { setAvanzando(false); }
  }

  function notificar() {
    if (!publicUrl) return;
    const txt = garVigente
      ? `Garantía digital — ${detalle.numero_ot}:\n${publicUrl}`
      : `Seguí el estado de tu OT ${detalle.numero_ot}:\n${publicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
  }

  return (
    <>
      <div className="ot-drawer-bd" onClick={onClose} />
      <div className="ot-drawer">

        {/* ── Header ── */}
        <div className="ot-drawer__hd">
          <div className="ot-drawer__hd-meta">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="ot-drawer__num">{loading ? "Cargando…" : detalle?.numero_ot}</span>
              {detalle && (
                <span className={`ui-badge ${BADGE_MAP[estadoActual] || "ui-badge--gray"}`} style={{ fontSize: 10 }}>
                  {LABEL_MAP[estadoActual] || estadoActual}
                </span>
              )}
              {detalle && <PrioridadDot p={detalle.prioridad} />}
            </div>
            {detalle && (
              <span className="ot-drawer__date">
                Ingresada {new Date(detalle.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          <div className="ot-drawer__hd-actions">
            {qrSrc && (
              <a href={publicUrl} target="_blank" rel="noreferrer" title="Ver página pública">
                <i className="bi bi-qr-code" style={{ fontSize: 18, color: "var(--muted)", cursor: "pointer" }} />
              </a>
            )}
            <button className="pmodal__close" onClick={onClose}><i className="bi bi-x-lg" /></button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="ot-drawer__body">
          {loading ? (
            <div className="ui-empty" style={{ padding: 48 }}>
              <div className="ui-empty__icon"><i className="bi bi-arrow-repeat" /></div>
              <div className="ui-empty__text">Cargando…</div>
            </div>
          ) : (
            <>
              {/* Lifecycle */}
              <div className="ot-drawer__sec">
                <div className="ot-lifecycle">
                  {lifecycle.map((s, i) => {
                    const done    = i < lcIndex;
                    const current = i === lcIndex;
                    return (
                      <div key={s.value} className={`ot-lc-step${done ? " ot-lc-step--done" : ""}`}>
                        <div className={`ot-lc-dot${done ? " ot-lc-dot--done" : current ? " ot-lc-dot--current" : ""}`}>
                          <i className={`bi ${s.icon}`} />
                        </div>
                        <div className={`ot-lc-label${done ? " ot-lc-label--done" : current ? " ot-lc-label--current" : ""}`}>
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cliente + equipo */}
              <div className="ot-drawer__sec">
                {detalle.cliente_nombre && (
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{detalle.cliente_nombre}</div>
                )}
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>
                  {[detalle.equipo_marca, detalle.equipo_modelo].filter(Boolean).join(" ") || detalle.equipo_tipo}
                </div>
                {detalle.equipo_serie && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>S/N: {detalle.equipo_serie}</div>
                )}
                <div style={{ fontSize: 12, color: "var(--sub)", marginTop: 8, fontStyle: "italic" }}>
                  {detalle.problema_reportado}
                </div>
              </div>

              {/* Info general */}
              <div className="ot-drawer__sec">
                <div className="ot-drawer__sec-title"><i className="bi bi-info-circle" />Información general</div>
                <InfoRow label="Estado"      val={LABEL_MAP[estadoActual] || estadoActual} />
                {detalle.prioridad && detalle.prioridad !== "normal" && (
                  <InfoRow label="Prioridad"   val={detalle.prioridad === "urgente" ? "Urgente" : "Alta"} />
                )}
                {detalle.tecnico_nombre && <InfoRow label="Técnico"     val={detalle.tecnico_nombre} />}
                {detalle.entrega_estimada && (
                  <InfoRow label="Entrega est." val={new Date(detalle.entrega_estimada).toLocaleDateString("es-AR")} />
                )}
                {detalle.canal_ingreso && <InfoRow label="Canal ingreso" val={detalle.canal_ingreso} />}
                {detalle.entrega_fecha && (
                  <InfoRow label="Entregado"   val={new Date(detalle.entrega_fecha).toLocaleDateString("es-AR")} />
                )}
              </div>

              {/* Presupuesto */}
              {(detalle.items?.length > 0 || detalle.presupuesto_total) && (
                <div className="ot-drawer__sec">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div className="ot-drawer__sec-title" style={{ marginBottom: 0 }}>
                      <i className="bi bi-receipt" />Presupuesto
                    </div>
                    {detalle.estado === "aprobado" && (
                      <span className="ui-badge ui-badge--green" style={{ fontSize: 10 }}>Aprobado</span>
                    )}
                  </div>
                  {detalle.items?.map((it, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "var(--divider)", color: "var(--text2)" }}>
                      <span>{it.descripcion} {it.cantidad !== 1 ? `×${it.cantidad}` : ""}</span>
                      <span style={{ fontWeight: 600 }}>${parseFloat(it.precio * it.cantidad).toLocaleString("es-AR")}</span>
                    </div>
                  ))}
                  {detalle.presupuesto_total && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 700, fontSize: 14, color: "var(--pr)" }}>
                      <span>Total</span>
                      <span>${parseFloat(detalle.presupuesto_total).toLocaleString("es-AR")}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Garantía */}
              {detalle.garantia && (
                <div className="ot-drawer__sec">
                  <div className="ot-drawer__sec-title">
                    <i className="bi bi-shield-check" style={{ color: garVigente ? "var(--em,#22c55e)" : "var(--muted)" }} />
                    Garantía
                    <span className={`ui-badge ${garVigente ? "ui-badge--green" : "ui-badge--gray"}`} style={{ fontSize: 10, marginLeft: 6 }}>
                      {detalle.garantia.estado}
                    </span>
                  </div>
                  {garVigente && (
                    <>
                      <InfoRow label="Período"     val={`${detalle.garantia.dias_garantia} días`} />
                      <InfoRow label="Válida hasta" val={new Date(detalle.garantia.fecha_vence).toLocaleDateString("es-AR")} />
                    </>
                  )}
                  {detalle.garantia.motivo_anulacion && (
                    <InfoRow label="Motivo anulación" val={detalle.garantia.motivo_anulacion} />
                  )}
                </div>
              )}

              {/* QR */}
              {qrSrc && (
                <div className="ot-drawer__sec">
                  <div className="ot-drawer__sec-title"><i className="bi bi-qr-code" />Archivo digital</div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <img src={qrSrc} alt="QR" style={{ width: 80, height: 80, borderRadius: 8, border: "1px solid var(--border)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", wordBreak: "break-all", marginBottom: 8 }}>{publicUrl}</div>
                      <a href={publicUrl} target="_blank" rel="noreferrer" className="ui-btn ui-btn--secondary ui-btn--sm">
                        <i className="bi bi-box-arrow-up-right" style={{ marginRight: 4 }} />Abrir página
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Avanzar estado */}
              {siguienteEst && (
                <div className="ot-drawer__sec">
                  <div className="ot-drawer__sec-title"><i className="bi bi-arrow-right-circle" />Avanzar estado</div>
                  {pedirGar ? (
                    <div style={{ background: "var(--bg-soft)", borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                        <i className="bi bi-shield-check" style={{ marginRight: 6, color: "var(--em,#22c55e)" }} />
                        Días de garantía (0 = sin garantía)
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          className="ui-input" type="number" min="0" placeholder="Ej: 90"
                          value={diasGar} onChange={e => setDiasGar(e.target.value)}
                          style={{ maxWidth: 140 }}
                        />
                        <button className="ui-btn ui-btn--primary ui-btn--sm" onClick={avanzar} disabled={avanzando}>
                          {avanzando ? "Guardando…" : "Confirmar entrega"}
                        </button>
                        <button className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setPedirGar(false)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, color: "var(--sub)" }}>
                        Siguiente: <strong style={{ color: "var(--pr)" }}>{LABEL_MAP[siguienteEst]}</strong>
                      </div>
                      <button className="ui-btn ui-btn--primary ui-btn--sm" onClick={avanzar} disabled={avanzando}>
                        {avanzando ? "Guardando…" : <><i className="bi bi-arrow-right" style={{ marginRight: 4 }} />Avanzar</>}
                      </button>
                    </div>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <input
                      className="ui-input" placeholder="Nota del cambio (opcional)"
                      value={nota} onChange={e => setNota(e.target.value)}
                    />
                  </div>
                  {msg && (
                    <div style={{ marginTop: 8, fontSize: 13, color: msg.includes("✓") ? "var(--em,#22c55e)" : "#dc2626" }}>{msg}</div>
                  )}
                </div>
              )}

              {/* Historial */}
              {detalle.log?.length > 0 && (
                <div className="ot-drawer__sec">
                  <div className="ot-drawer__sec-title"><i className="bi bi-clock-history" />Historial de cambios</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {[...detalle.log].reverse().map((l, i) => {
                      const meta = LOG_ICONS[l.estado_actual] ?? { icon: "bi-circle", color: "#6b7280" };
                      return (
                        <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: "var(--divider)", alignItems: "flex-start" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <i className={`bi ${meta.icon}`} style={{ fontSize: 12, color: meta.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>
                              {LABEL_MAP[l.estado_actual] || l.estado_actual}
                              {l.estado_anterior && (
                                <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400, marginLeft: 6 }}>
                                  desde {LABEL_MAP[l.estado_anterior] || l.estado_anterior}
                                </span>
                              )}
                            </div>
                            {l.nota && <div style={{ fontSize: 12, color: "var(--sub)", marginTop: 2, fontStyle: "italic" }}>{l.nota}</div>}
                            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                              {new Date(l.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                              {" — "}
                              {new Date(l.creado_en).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Adjuntos placeholder */}
              <div className="ot-drawer__sec">
                <div className="ot-drawer__sec-title"><i className="bi bi-paperclip" />Adjuntos</div>
                {detalle.foto_url ? (
                  <a href={detalle.foto_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--pr)" }}>
                    <i className="bi bi-image" style={{ marginRight: 4 }} />Ver foto del equipo
                  </a>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Sin adjuntos</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && (
          <div className="ot-drawer__footer">
            {siguienteEst && !pedirGar && (
              <button className="ui-btn ui-btn--primary" style={{ flex: 1 }} onClick={avanzar} disabled={avanzando}>
                <i className="bi bi-arrow-right-circle" style={{ marginRight: 6 }} />
                {avanzando ? "Guardando…" : `Avanzar a ${LABEL_MAP[siguienteEst]}`}
              </button>
            )}
            <button
              className="ui-btn ui-btn--notify"
              style={{ flex: siguienteEst ? "0 0 auto" : 1 }}
              onClick={notificar}
            >
              <i className="bi bi-whatsapp" style={{ marginRight: 6 }} />Notificar
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function InfoRow({ label, val }) {
  return (
    <div style={{ display: "flex", padding: "5px 0", borderBottom: "var(--divider)", fontSize: 13, gap: 12 }}>
      <span style={{ color: "var(--sub)", minWidth: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--text)", fontWeight: 500 }}>{val || "—"}</span>
    </div>
  );
}
