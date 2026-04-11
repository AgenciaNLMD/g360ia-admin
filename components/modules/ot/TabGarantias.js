"use client";

import { useState, useEffect, useCallback } from "react";

const GAR_BADGE = {
  vigente: "ui-badge--green",
  vencida: "ui-badge--gray",
  anulada: "ui-badge--red",
};

export default function TabGarantias({ tenant_id, usuario_id, rol }) {
  const [garantias, setGarantias] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [anulando,  setAnulando]  = useState(null);
  const [motivo,    setMotivo]    = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/ot/garantias");
      const data = await res.json();
      if (data.ok) setGarantias(data.garantias);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function confirmarAnulacion() {
    if (!anulando) return;
    setGuardando(true);
    try {
      await fetch(`/api/ot/garantia/${anulando.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ estado: "anulada", motivo_anulacion: motivo }),
      });
      setAnulando(null);
      setMotivo("");
      cargar();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="ui-card" style={{ marginTop: 0 }}>
        {loading ? (
          <div className="ui-empty">
            <div className="ui-empty__icon"><i className="bi bi-arrow-repeat" /></div>
            <div className="ui-empty__text">Cargando…</div>
          </div>
        ) : !garantias.length ? (
          <div className="ui-empty">
            <div className="ui-empty__icon"><i className="bi bi-shield-x" /></div>
            <div className="ui-empty__text">Sin garantías registradas</div>
            <div className="ui-empty__sub">Las garantías se crean al marcar una OT como "Entregada" con días de garantía</div>
          </div>
        ) : (
          <table className="ui-table">
            <thead>
              <tr>
                <th>N° OT</th>
                <th>Equipo</th>
                <th>Estado</th>
                <th>Días</th>
                <th>Vence</th>
                <th className="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {garantias.map(g => {
                const base   = typeof window !== "undefined" ? window.location.origin : "";
                const url    = `${base}/ot/${g.token_publico}`;
                const wspUrl = g.estado === "vigente"
                  ? `https://wa.me/?text=${encodeURIComponent(`Garantía digital — ${g.numero_ot}:\n${url}`)}`
                  : null;

                return (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{g.numero_ot}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {[g.equipo_marca, g.equipo_modelo].filter(Boolean).join(" ") || "—"}
                      </div>
                    </td>
                    <td>
                      <span className={`ui-badge ${GAR_BADGE[g.estado] || "ui-badge--gray"}`}>
                        {g.estado}
                      </span>
                    </td>
                    <td style={{ color: "var(--sub)", fontSize: 13 }}>
                      {g.dias_garantia ? `${g.dias_garantia} días` : "—"}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--sub)" }}>
                      {g.fecha_vence
                        ? new Date(g.fecha_vence).toLocaleDateString("es-AR")
                        : "—"}
                    </td>
                    <td className="col-actions">
                      {wspUrl && (
                        <a href={wspUrl} target="_blank" rel="noreferrer" title="Enviar por WhatsApp">
                          <i className="bi bi-whatsapp" style={{ color: "#25D366" }} />
                        </a>
                      )}
                      {g.estado === "vigente" && (
                        <i
                          className="bi bi-shield-x"
                          title="Anular garantía"
                          style={{ marginLeft: 6, color: "var(--alert, #dc2626)", cursor: "pointer" }}
                          onClick={() => setAnulando(g)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal anular garantía */}
      {anulando && (
        <div className="pmodal-backdrop" onClick={() => setAnulando(null)}>
          <div className="pmodal pmodal--sm" onClick={e => e.stopPropagation()}>
            <div className="pmodal__header">
              <div className="pmodal__title">
                <i className="bi bi-shield-x" style={{ marginRight: 6 }} />
                Anular garantía — {anulando.numero_ot}
              </div>
              <button className="pmodal__close" onClick={() => setAnulando(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="pmodal__body">
              <div className="ui-field">
                <label className="ui-label">Motivo de anulación</label>
                <textarea
                  className="ui-input"
                  rows={3}
                  placeholder="Ej: Daño por mal uso fuera de la cobertura de garantía"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
            <div className="pmodal__footer">
              <button
                className="ui-btn ui-btn--secondary ui-btn--sm"
                onClick={() => setAnulando(null)}
              >
                Cancelar
              </button>
              <button
                className="ui-btn ui-btn--danger ui-btn--sm"
                onClick={confirmarAnulacion}
                disabled={guardando}
              >
                {guardando ? "Anulando…" : "Confirmar anulación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
