"use client";

import { useState, useEffect, useCallback } from "react";
import OTPopup from "./OTPopup";

const ESTADOS_FILTRO = [
  { value: "",               label: "Todos los estados"   },
  { value: "recibido",       label: "Recibido"            },
  { value: "en_diagnostico", label: "En diagnóstico"      },
  { value: "presupuestado",  label: "Presupuestado"       },
  { value: "aprobado",       label: "Aprobado"            },
  { value: "en_reparacion",  label: "En reparación"       },
  { value: "listo",          label: "Listo para retirar"  },
  { value: "entregado",      label: "Entregado"           },
];

const PRIORIDADES_FILTRO = [
  { value: "",         label: "Todas las prioridades" },
  { value: "normal",   label: "Normal"                },
  { value: "alta",     label: "Alta"                  },
  { value: "urgente",  label: "Urgente"               },
];

const QUICK_TABS = [
  { id: "todas",   label: "Todas",              filter: () => true                          },
  { id: "activas", label: "Activas",            filter: o => o.estado !== "entregado"       },
  { id: "listas",  label: "Listas para retirar",filter: o => o.estado === "listo"           },
  { id: "urgentes",label: "Urgentes",           filter: o => o.prioridad === "urgente"      },
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
  listo:          "Listo para retirar",
  entregado:      "Entregado",
};

function PrioridadDot({ prioridad }) {
  if (!prioridad || prioridad === "normal") {
    return <span className="ot-prio ot-prio--normal"><span className="ot-prio__dot" />Normal</span>;
  }
  return (
    <span className={`ot-prio ot-prio--${prioridad}`}>
      <span className="ot-prio__dot" />
      {prioridad === "urgente" ? "Urgente" : "Alta"}
    </span>
  );
}

function Iniciales({ nombre }) {
  if (!nombre) return <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>;
  const parts = nombre.trim().split(" ");
  const ini   = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: "50%", background: "var(--grad-slate)",
      color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
    }} title={nombre}>
      {ini.toUpperCase()}
    </span>
  );
}

export default function TabOrdenes({ refreshKey, rol }) {
  const [ordenes,   setOrdenes]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [buscar,    setBuscar]    = useState("");
  const [filtroEst, setFiltroEst] = useState("");
  const [filtroPri, setFiltroPri] = useState("");
  const [quickTab,  setQuickTab]  = useState("todas");
  const [selected,  setSelected]  = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filtroEst) p.set("estado",    filtroEst);
      if (filtroPri) p.set("prioridad", filtroPri);
      if (buscar)    p.set("q",         buscar);
      const res  = await fetch(`/api/ot/ordenes?${p}`);
      const data = await res.json();
      if (data.ok) setOrdenes(data.ordenes ?? []);
    } catch { /* silent */ }
    finally  { setLoading(false); }
  }, [filtroEst, filtroPri, buscar, refreshKey]);

  useEffect(() => {
    const t = setTimeout(cargar, buscar ? 350 : 0);
    return () => clearTimeout(t);
  }, [cargar]);

  const qtFilter = QUICK_TABS.find(t => t.id === quickTab)?.filter ?? (() => true);
  const visibles = ordenes.filter(qtFilter);
  const counts   = Object.fromEntries(QUICK_TABS.map(t => [t.id, ordenes.filter(t.filter).length]));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Quick tabs */}
      <div className="ot-qtabs">
        {QUICK_TABS.map(t => (
          <button
            key={t.id}
            className={`ot-qtab${quickTab === t.id ? " ot-qtab--active" : ""}`}
            onClick={() => setQuickTab(t.id)}
          >
            {t.label}
            <span className="ot-qtab__count">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="table-toolbar">
        <input
          className="ui-input"
          style={{ maxWidth: 240 }}
          placeholder="Buscar OT, cliente, equipo…"
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
        />
        <select className="ui-select" style={{ maxWidth: 185 }} value={filtroEst} onChange={e => setFiltroEst(e.target.value)}>
          {ESTADOS_FILTRO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select className="ui-select" style={{ maxWidth: 175 }} value={filtroPri} onChange={e => setFiltroPri(e.target.value)}>
          {PRIORIDADES_FILTRO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <div className="table-toolbar__right">
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            {visibles.length} {visibles.length === 1 ? "orden" : "órdenes"}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {loading ? (
          <div className="ui-empty" style={{ padding: 48 }}>
            <div className="ui-empty__icon"><i className="bi bi-arrow-repeat" /></div>
            <div className="ui-empty__text">Cargando…</div>
          </div>
        ) : !visibles.length ? (
          <div className="ui-empty" style={{ padding: 48 }}>
            <div className="ui-empty__icon"><i className="bi bi-clipboard-x" /></div>
            <div className="ui-empty__text">Sin órdenes</div>
            <div className="ui-empty__sub">
              {ordenes.length
                ? "Ninguna orden coincide con el filtro activo"
                : 'Creá la primera OT desde la pestaña "Nueva OT"'}
            </div>
          </div>
        ) : (
          <table className="ui-table">
            <thead>
              <tr>
                <th># ORDEN</th>
                <th>CLIENTE</th>
                <th>EQUIPO / FALLA</th>
                <th>ESTADO</th>
                <th>PRIORIDAD</th>
                <th>TÉCNICO</th>
                <th>INGRESO</th>
                <th style={{ width: 36, textAlign: "center" }}></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(o => (
                <tr
                  key={o.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(o)}
                >
                  <td>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--pr)" }}>
                      {o.numero_ot}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>
                      {new Date(o.creado_en).toLocaleDateString("es-AR")}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>
                    {o.cliente_nombre || <span style={{ color: "var(--muted)" }}>—</span>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {[o.equipo_marca, o.equipo_modelo].filter(Boolean).join(" ") || o.equipo_tipo}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--sub)" }}>
                      {o.problema_reportado?.slice(0, 55)}{(o.problema_reportado?.length ?? 0) > 55 ? "…" : ""}
                    </div>
                  </td>
                  <td>
                    <span className={`ui-badge ${BADGE_MAP[o.estado] || "ui-badge--gray"}`}>
                      {LABEL_MAP[o.estado] || o.estado}
                    </span>
                  </td>
                  <td><PrioridadDot prioridad={o.prioridad} /></td>
                  <td>
                    {o.tecnico_nombre
                      ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Iniciales nombre={o.tecnico_nombre} />
                          <span style={{ fontSize: 12, color: "var(--text2)" }}>{o.tecnico_nombre}</span>
                        </div>
                      : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td style={{ fontSize: 12, color: "var(--sub)" }}>
                    {new Date(o.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
                  </td>
                  <td style={{ textAlign: "center" }} onClick={e => { e.stopPropagation(); setSelected(o); }}>
                    <i className="bi bi-qr-code" style={{ fontSize: 16, color: "var(--muted)", cursor: "pointer" }} title="Ver detalle" />
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
          onActualizada={() => { cargar(); setSelected(null); }}
        />
      )}
    </div>
  );
}
