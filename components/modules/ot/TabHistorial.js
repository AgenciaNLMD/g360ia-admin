"use client";

import { useState, useEffect, useCallback } from "react";

const BADGE_MAP = {
  recibido:       "ui-badge--blue",
  en_diagnostico: "ui-badge--amber",
  presupuestado:  "ui-badge--amber",
  aprobado:       "ui-badge--green",
  en_reparacion:  "ui-badge--blue",
  listo:          "ui-badge--green",
  entregado:      "ui-badge--gray",
};

const LABEL_MAP = {
  recibido:       "Recibido",
  en_diagnostico: "En diagnóstico",
  presupuestado:  "Presupuestado",
  aprobado:       "Aprobado",
  en_reparacion:  "En reparación",
  listo:          "Listo para retirar",
  entregado:      "Entregado",
};

export default function TabHistorial() {
  const [query,   setQuery]   = useState("");
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const buscar = useCallback(async (q) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setLoading(true);
    setBuscado(true);
    try {
      const res  = await fetch(`/api/ot/ordenes?serie=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.ok) setOrdenes(data.ordenes ?? []);
    } catch { setOrdenes([]); }
    finally  { setLoading(false); }
  }, [query]);

  // Auto-buscar con debounce al escribir
  useEffect(() => {
    if (!query.trim()) { setOrdenes([]); setBuscado(false); return; }
    const t = setTimeout(() => buscar(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div>
      <div className="ui-card" style={{ marginTop: 0 }}>
        <div className="ui-card__header">
          <div className="ui-card__title">Historial por equipo</div>
        </div>
        <div className="ui-card__body">

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input
              className="ui-input"
              style={{ flex: 1, maxWidth: 400 }}
              placeholder="N° de serie, IMEI, marca o modelo…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && buscar()}
            />
            <button className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => buscar()}>
              <i className="bi bi-search" style={{ marginRight: 4 }} />Buscar
            </button>
          </div>

          {loading ? (
            <div className="ui-empty">
              <div className="ui-empty__icon"><i className="bi bi-arrow-repeat" /></div>
              <div className="ui-empty__text">Buscando…</div>
            </div>
          ) : buscado && !ordenes.length ? (
            <div className="ui-empty">
              <div className="ui-empty__icon"><i className="bi bi-search" /></div>
              <div className="ui-empty__text">Sin resultados</div>
              <div className="ui-empty__sub">No se encontraron órdenes para ese equipo</div>
            </div>
          ) : ordenes.length > 0 ? (
            <>
              <div style={{ fontSize: 12, color: "var(--sub)", marginBottom: 12 }}>
                {ordenes.length} {ordenes.length === 1 ? "orden encontrada" : "órdenes encontradas"}
              </div>
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>N° OT</th>
                    <th>Cliente</th>
                    <th>Equipo</th>
                    <th>Problema</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--pr)", fontSize: 12 }}>
                        {o.numero_ot}
                      </td>
                      <td style={{ fontSize: 13 }}>{o.cliente_nombre || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {[o.equipo_marca, o.equipo_modelo].filter(Boolean).join(" ") || "—"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--sub)" }}>{o.equipo_tipo}</div>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text2)", maxWidth: 200 }}>
                        {o.problema_reportado?.slice(0, 60)}{(o.problema_reportado?.length ?? 0) > 60 ? "…" : ""}
                      </td>
                      <td>
                        <span className={`ui-badge ${BADGE_MAP[o.estado] || "ui-badge--gray"}`}>
                          {LABEL_MAP[o.estado] || o.estado}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--sub)" }}>
                        {new Date(o.creado_en).toLocaleDateString("es-AR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="ui-empty">
              <div className="ui-empty__icon"><i className="bi bi-clock-history" /></div>
              <div className="ui-empty__text">Buscá por equipo</div>
              <div className="ui-empty__sub">Ingresá el N° de serie, IMEI, marca o modelo para ver todas las OTs de ese equipo</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
