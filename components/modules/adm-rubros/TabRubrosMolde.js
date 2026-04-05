"use client";

import { useState, useEffect } from "react";

const ICONOS = {
  crm:          "bi-people",
  mcp:          "bi-grid-1x2",
  "adm-rubros": "bi-building",
};

const PLANES = [
  { id: "free",     label: "Free"     },
  { id: "pro",      label: "Pro"      },
  { id: "business", label: "Business" },
  { id: "ia",       label: "Plan IA"  },
];

const HERRAMIENTAS_DEFAULT = {
  crm:          ["Contactos", "Pipeline", "Seguimiento", "Reportes"],
  mcp:          ["Integraciones", "Webhooks", "API", "Configuración"],
  "adm-rubros": ["Rubros", "Módulos", "Asignaciones"],
};

export default function TabRubrosMolde() {
  const [rubros,       setRubros]       = useState([]);
  const [modulos,      setModulos]      = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [rubroSel,     setRubroSel]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [planTab,      setPlanTab]      = useState("free");
  const [planData,     setPlanData]     = useState({});
  const [savedFeedback,setSavedFeedback]= useState(false);
  const [toggling,     setToggling]     = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const [rRes, mRes, aRes] = await Promise.all([
        fetch("/api/adm-rubros/rubros").then(r => r.json()),
        fetch("/api/adm-rubros/modulos").then(r => r.json()),
        fetch("/api/adm-rubros/rubros-modulos").then(r => r.json()),
      ]);
      const listaRubros = rRes.ok ? rRes.rubros : [];
      setRubros(listaRubros);
      setRubroSel(prev => prev ?? (listaRubros[0]?.id ?? null));
      if (mRes.ok) setModulos(mRes.modulos);
      if (aRes.ok) setAsignaciones(aRes.asignaciones);
    } catch (e) {
      console.error("[TabRubrosMolde]", e);
    } finally {
      setLoading(false);
    }
  }

  const asignadasAlRubro   = asignaciones.filter(a => Number(a.rubro_id) === rubroSel);
  const modulosHabilitados = modulos.filter(m => asignadasAlRubro.find(a => Number(a.modulo_id) === m.id));

  async function toggleModulo(modulo) {
    const habilitado = !!asignadasAlRubro.find(a => Number(a.modulo_id) === modulo.id);
    setToggling(modulo.id);
    try {
      if (habilitado) {
        await fetch(`/api/adm-rubros/rubros-modulos?rubro_id=${rubroSel}&modulo_id=${modulo.id}`, {
          method: "DELETE",
        });
      } else {
        await fetch("/api/adm-rubros/rubros-modulos", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ rubro_id: rubroSel, modulo_id: modulo.id, plan_minimo: "free" }),
        });
      }
      await cargar();
    } catch (e) {
      console.error("[toggleModulo]", e);
    } finally {
      setToggling(null);
    }
  }

  function getPlanState(rubroId, planId) {
    return planData[rubroId]?.[planId] ?? { precio: "", tools: {} };
  }

  function setPlanPrice(rubroId, planId, precio) {
    setPlanData(d => ({
      ...d,
      [rubroId]: {
        ...d[rubroId],
        [planId]: { ...getPlanState(rubroId, planId), precio },
      },
    }));
  }

  function toggleTool(rubroId, planId, modId, toolName) {
    const state    = getPlanState(rubroId, planId);
    const modTools = state.tools[modId] ?? {};
    setPlanData(d => ({
      ...d,
      [rubroId]: {
        ...d[rubroId],
        [planId]: {
          ...state,
          tools: { ...state.tools, [modId]: { ...modTools, [toolName]: !modTools[toolName] } },
        },
      },
    }));
  }

  function guardarPlan() {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  }

  if (loading) return (
    <div className="ui-empty">
      <i className="bi bi-arrow-repeat ui-empty__icon" />
      <div className="ui-empty__text">Cargando asignaciones...</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, alignItems: "start" }}>

      {/* ── columna izquierda: lista de rubros ── */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title">Rubros</span>
        </div>
        <div className="ui-card__body" style={{ padding: 0 }}>
          {rubros.length === 0 ? (
            <div style={{ padding: "12px 16px" }} className="mod-sub">
              Sin rubros. Creá uno en la pestaña Rubros.
            </div>
          ) : (
            rubros.map(r => (
              <div
                key={r.id}
                onClick={() => setRubroSel(r.id)}
                style={{
                  padding:     "10px 16px",
                  cursor:      "pointer",
                  borderLeft:  rubroSel === r.id ? "3px solid var(--pr)" : "3px solid transparent",
                  background:  rubroSel === r.id ? "var(--bg-hover)" : "transparent",
                  fontWeight:  rubroSel === r.id ? 600 : 400,
                  fontSize:    14,
                  color:       "var(--text)",
                  transition:  "all 0.12s",
                  userSelect:  "none",
                }}
              >
                {r.nombre}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── columna derecha: configuración ── */}
      {rubroSel ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* sección 1: módulos habilitados */}
          <div className="ui-card">
            <div className="ui-card__header">
              <span className="ui-card__title">
                Módulos habilitados para <strong>{rubros.find(r => r.id === rubroSel)?.nombre}</strong>
              </span>
            </div>
            <div className="ui-card__body" style={{ padding: 0 }}>
              {modulos.length === 0 ? (
                <div style={{ padding: "12px 16px" }} className="mod-sub">
                  Sin módulos en el sistema.
                </div>
              ) : (
                modulos.map((m, idx) => {
                  const habilitado = !!asignadasAlRubro.find(a => Number(a.modulo_id) === m.id);
                  const icon       = ICONOS[m.slug] ?? "bi-box-seam";
                  const isLast     = idx === modulos.length - 1;

                  return (
                    <div
                      key={m.id}
                      style={{
                        display:       "flex",
                        alignItems:    "center",
                        gap:           12,
                        padding:       "10px 16px",
                        borderBottom:  isLast ? "none" : "1px solid var(--border)",
                      }}
                    >
                      <i className={`bi ${icon}`} style={{ fontSize: 18, color: "var(--pr)", width: 22, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
                          {m.nombre ?? m.slug}
                        </div>
                        {m.descripcion && (
                          <div
                            className="mod-sub"
                            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}
                          >
                            {m.descripcion}
                          </div>
                        )}
                      </div>

                      {/* toggle switch */}
                      <button
                        onClick={() => toggleModulo(m)}
                        disabled={toggling === m.id}
                        title={habilitado ? "Deshabilitar" : "Habilitar"}
                        style={{
                          width:      42,
                          height:     22,
                          borderRadius: 11,
                          border:     "none",
                          cursor:     toggling === m.id ? "wait" : "pointer",
                          background: habilitado ? "var(--pr)" : "var(--border)",
                          transition: "background 0.2s",
                          position:   "relative",
                          flexShrink: 0,
                          opacity:    toggling === m.id ? 0.6 : 1,
                        }}
                      >
                        <span style={{
                          position:   "absolute",
                          top:        3,
                          left:       habilitado ? 21 : 3,
                          width:      16,
                          height:     16,
                          borderRadius: "50%",
                          background: "white",
                          transition: "left 0.2s",
                          boxShadow:  "0 1px 3px rgba(0,0,0,.2)",
                        }} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* sección 2: planes y precios */}
          <div className="ui-card">
            <div className="ui-card__header">
              <span className="ui-card__title">Planes y precios</span>
            </div>
            <div className="ui-card__body">

              {/* pill tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
                {PLANES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlanTab(p.id)}
                    style={{
                      padding:     "5px 14px",
                      borderRadius: 20,
                      border:      `1px solid ${planTab === p.id ? "var(--pr)" : "var(--border)"}`,
                      background:  planTab === p.id ? "var(--pr)" : "transparent",
                      color:       planTab === p.id ? "#fff" : "var(--sub)",
                      cursor:      "pointer",
                      fontSize:    13,
                      fontWeight:  planTab === p.id ? 600 : 400,
                      transition:  "all 0.15s",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* campo precio */}
              <div className="ui-field" style={{ maxWidth: 180, marginBottom: 20 }}>
                <label className="ui-label">Precio (USD/mes)</label>
                <input
                  type="number"
                  min="0"
                  className="ui-input"
                  placeholder="0"
                  value={getPlanState(rubroSel, planTab).precio}
                  onChange={e => setPlanPrice(rubroSel, planTab, e.target.value)}
                />
              </div>

              {/* herramientas por módulo */}
              {modulosHabilitados.length === 0 ? (
                <div className="ui-empty" style={{ paddingTop: 8, paddingBottom: 8 }}>
                  <i className="bi bi-toggles ui-empty__icon" style={{ fontSize: 28 }} />
                  <div className="ui-empty__text">Sin módulos habilitados</div>
                  <div className="ui-empty__sub">
                    Habilitá módulos arriba para configurar sus herramientas por plan.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {modulosHabilitados.map(m => {
                    let herramientas = HERRAMIENTAS_DEFAULT[m.slug] ?? [];
                    if (m.herramientas) {
                      try {
                        herramientas = typeof m.herramientas === "string"
                          ? JSON.parse(m.herramientas)
                          : m.herramientas;
                      } catch { /* usar default */ }
                    }

                    const planState = getPlanState(rubroSel, planTab);

                    return (
                      <div key={m.id}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "var(--text)" }}>
                          {m.nombre ?? m.slug}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {herramientas.map(h => {
                            const checked = planState.tools[m.id]?.[h] ?? false;
                            return (
                              <label
                                key={h}
                                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleTool(rubroSel, planTab, m.id, h)}
                                />
                                <span style={{ fontSize: 13, color: "var(--sub)" }}>{h}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: 24 }}>
                <button className="ui-btn ui-btn--primary" onClick={guardarPlan}>
                  {savedFeedback
                    ? <><i className="bi bi-check-lg" /> Guardado</>
                    : "Guardar plan"
                  }
                </button>
              </div>

            </div>
          </div>

        </div>
      ) : (
        <div className="ui-empty">
          <i className="bi bi-building ui-empty__icon" />
          <div className="ui-empty__text">Seleccioná un rubro</div>
        </div>
      )}

    </div>
  );
}
