"use client";

import { useState, useEffect, useCallback } from "react";
import OTPopup from "./OTPopup";

const FILTROS = [
  { value: "",               label: "Todos los estados"   },
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

const LABEL_MAP = {
  recibido:       "Recibido",
  en_diagnostico: "En diagnóstico",
  presupuestado:  "Presupuestado",
  aprobado:       "Aprobado",
  en_reparacion:  "En reparación",
  listo:          "Listo para entregar",
  entregado:      "Entregado",
};

function EstadoBadge({ estado }) {
  return (
    <span className={`ui-badge ${BADGE_MAP[estado] || "ui-badge--gray"}`}>
      {LABEL_MAP[estado] || estado}
    </span>
  );
}

export default function TabOrdenes({ tenant_id, usuario_id, rol }) {
  const [ordenes,  setOrdenes]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filtro,   setFiltro]   = useState("");
  const [buscar,   setBuscar]   = useState("");
  const [selected, setSelected] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtro) params.set("estado", filtro);
      if (buscar) params.set("q", buscar);
      const res  = await fetch(`/api/ot/ordenes?${params}`);
      const data = await res.json();
      if (data.ok) setOrdenes(data.ordenes);
    } finally {
      setLoading(false);
    }
  }, [filtro, buscar]);

  useEffect(() => {
    const t = setTimeout(cargar, buscar ? 350 : 0);
    return () => clearTimeout(t);
  }, [cargar]);

  return (
    <div>
      {/* Toolbar */}
      <div className="table-toolbar">
        <input
          className="ui-input"
          style={{ maxWidth: 220 }}
          placeholder="Buscar N° OT, equipo…"
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
        />
        <select
          className="ui-select"
          style={{ maxWidth: 200 }}
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        >
          {FILTROS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <div className="table-toolbar__right">
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            {ordenes.length} {ordenes.length === 1 ? "orden" : "órdenes"}
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="ui-card" style={{ marginTop: 0 }}>
        {loading ? (
          <div className="ui-empty">
            <div className="ui-empty__icon"><i className="bi bi-arrow-repeat" /></div>
            <div className="ui-empty__text">Cargando…</div>
          </div>
        ) : !ordenes.length ? (
          <div className="ui-empty">
            <div className="ui-empty__icon"><i className="bi bi-clipboard-x" /></div>
            <div className="ui-empty__text">Sin órdenes</div>
            <div className="ui-empty__sub">Creá la primera OT desde la pestaña "Nueva OT"</div>
          </div>
        ) : (
          <table className="ui-table">
            <thead>
              <tr>
                <th>N° OT</th>
                <th>Equipo</th>
                <th>Estado</th>
                <th>Ingreso</th>
                <th className="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map(o => (
                <tr key={o.id}>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{o.numero_ot}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {[o.equipo_marca, o.equipo_modelo].filter(Boolean).join(" ") || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--sub)" }}>{o.equipo_tipo}</div>
                  </td>
                  <td><EstadoBadge estado={o.estado} /></td>
                  <td style={{ fontSize: 12, color: "var(--sub)" }}>
                    {new Date(o.creado_en).toLocaleDateString("es-AR")}
                  </td>
                  <td className="col-actions">
                    <i
                      className="bi bi-eye"
                      title="Ver detalle"
                      onClick={() => setSelected(o)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <OTPopup
          orden={selected}
          rol={rol}
          onClose={() => setSelected(null)}
          onActualizada={cargar}
        />
      )}
    </div>
  );
}
