"use client";

import { useState, useEffect } from "react";

const PLAN_ORDER  = ["free", "pro", "business", "ia"];
const PLAN_LABELS = { free: "Free", pro: "Pro", business: "Business", ia: "Plan IA" };
const PLAN_COLORS = { free: "#64748b", pro: "#3b82f6", business: "#8b5cf6", ia: "#f59e0b" };

const ICONOS = {
  crm:          "bi-people",
  mcp:          "bi-grid-1x2",
  "adm-rubros": "bi-building",
};

function coverageColor(pct) {
  if (pct === 0)   return { bg: "#f1f5f9", text: "#94a3b8" };
  if (pct <= 0.33) return { bg: "#fef3c7", text: "#d97706" };
  if (pct <= 0.66) return { bg: "#dbeafe", text: "#2563eb" };
  return                  { bg: "#dcfce7", text: "#16a34a" };
}

export default function TabRubrosMolde() {
  const [rubros,       setRubros]       = useState([]);
  const [modulos,      setModulos]      = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [moduloData,   setModuloData]   = useState({});
  const [loading,      setLoading]      = useState(true);
  const [toggling,     setToggling]     = useState(null); // "rubroId-moduloId"

  // panel de detalle
  const [detalle,      setDetalle]      = useState(null); // { rubro, modulo }
  const [savingCell,   setSavingCell]   = useState(null);
  const [savedCell,    setSavedCell]    = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const [rRes, mRes, aRes] = await Promise.all([
        fetch("/api/adm-rubros/rubros").then(r => r.json()),
        fetch("/api/adm-rubros/modulos").then(r => r.json()),
        fetch("/api/adm-rubros/rubros-modulos").then(r => r.json()),
      ]);
      const listaRubros  = rRes.ok ? rRes.rubros  : [];
      const listaModulos = mRes.ok ? mRes.modulos : [];
      setRubros(listaRubros);
      setModulos(listaModulos);
      if (aRes.ok) setAsignaciones(aRes.asignaciones);

      const entradas = await Promise.all(
        listaModulos.map(async m => {
          const [hRes, pRes] = await Promise.all([
            fetch(`/api/adm-rubros/herramientas?modulo=${m.nombre}`).then(r => r.json()),
            fetch(`/api/adm-rubros/modulos-planes?modulo=${m.nombre}`).then(r => r.json()),
          ]);
          return [m.nombre, {
            herramientas: hRes.ok ? hRes.herramientas : [],
            planes:       pRes.ok ? pRes.planes       : [],
          }];
        })
      );
      setModuloData(Object.fromEntries(entradas));
    } catch (e) {
      console.error("[TabRubrosMolde]", e);
    } finally {
      setLoading(false);
    }
  }

  function isAsignado(rubroId, moduloId) {
    return asignaciones.some(a => Number(a.rubro_id) === rubroId && Number(a.modulo_id) === moduloId);
  }

  async function toggleCelda(rubro, modulo) {
    const key      = `${rubro.id}-${modulo.id}`;
    const asignado = isAsignado(rubro.id, modulo.id);
    setToggling(key);
    try {
      if (asignado) {
        await fetch(`/api/adm-rubros/rubros-modulos?rubro_id=${rubro.id}&modulo_id=${modulo.id}`, { method: "DELETE" });
        if (detalle?.rubro.id === rubro.id && detalle?.modulo.id === modulo.id) setDetalle(null);
      } else {
        await fetch("/api/adm-rubros/rubros-modulos", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ rubro_id: rubro.id, modulo_id: modulo.id, plan_minimo: "free" }),
        });
      }
      const aRes = await fetch("/api/adm-rubros/rubros-modulos").then(r => r.json());
      if (aRes.ok) setAsignaciones(aRes.asignaciones);
    } catch (e) {
      console.error("[toggleCelda]", e);
    } finally {
      setToggling(null);
    }
  }

  async function handlePlanMinimo(herramienta, plan, moduloNombre) {
    const currentIdx = PLAN_ORDER.indexOf(herramienta.plan_minimo);
    const clickedIdx = PLAN_ORDER.indexOf(plan);
    let nuevoPlan;
    if (clickedIdx === currentIdx) {
      nuevoPlan = PLAN_ORDER[currentIdx + 1] ?? herramienta.plan_minimo;
    } else if (clickedIdx < currentIdx) {
      nuevoPlan = plan;
    } else {
      return;
    }
    if (nuevoPlan === herramienta.plan_minimo) return;

    const cellKey = `${herramienta.id}-${plan}`;
    setSavingCell(cellKey);
    try {
      await fetch("/api/adm-rubros/herramientas", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: herramienta.id, plan_minimo: nuevoPlan }),
      });
      setModuloData(prev => ({
        ...prev,
        [moduloNombre]: {
          ...prev[moduloNombre],
          herramientas: prev[moduloNombre].herramientas.map(h =>
            h.id === herramienta.id ? { ...h, plan_minimo: nuevoPlan } : h
          ),
        },
      }));
      setSavedCell(cellKey);
      setTimeout(() => setSavedCell(null), 1000);
    } catch (e) {
      console.error("[handlePlanMinimo]", e);
    } finally {
      setSavingCell(null);
    }
  }

  async function actualizarPrecio(planId, precio, moduloNombre) {
    try {
      await fetch("/api/adm-rubros/modulos-planes", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: planId, precio: Number(precio) }),
      });
      setModuloData(prev => ({
        ...prev,
        [moduloNombre]: {
          ...prev[moduloNombre],
          planes: prev[moduloNombre].planes.map(p =>
            p.id === planId ? { ...p, precio } : p
          ),
        },
      }));
    } catch (e) {
      console.error("[actualizarPrecio]", e);
    }
  }

  if (loading) return (
    <div className="ui-empty">
      <i className="bi bi-arrow-repeat ui-empty__icon" />
      <div className="ui-empty__text">Cargando...</div>
    </div>
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalCeldas   = rubros.length * modulos.length;
  const totalAsig     = asignaciones.length;
  const coberturaPct  = totalCeldas > 0 ? Math.round((totalAsig / totalCeldas) * 100) : 0;
  const rubrosCero    = rubros.filter(r => !asignaciones.some(a => Number(a.rubro_id) === r.id)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Rubros",        value: rubros.length,  icon: "bi-building",    color: "#3b82f6" },
          { label: "Módulos",       value: modulos.length, icon: "bi-box-seam",    color: "#8b5cf6" },
          { label: "Cobertura",     value: `${coberturaPct}%`, icon: "bi-grid-3x3", color: "#16a34a" },
          { label: "Sin módulos",   value: rubrosCero,     icon: "bi-exclamation-triangle", color: rubrosCero > 0 ? "#d97706" : "#16a34a" },
        ].map(k => (
          <div key={k.label} className="ui-card">
            <div className="ui-card__body" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${k.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className={`bi ${k.icon}`} style={{ fontSize: 16, color: k.color }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{k.value}</div>
                <div className="mod-sub" style={{ marginTop: 2 }}>{k.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Matriz ── */}
      <div className="ui-card" style={{ overflow: "hidden" }}>
        <div className="ui-card__header">
          <span className="ui-card__title">Matriz de cobertura — Rubros × Módulos</span>
          <span className="mod-sub">Hacé click en una celda para asignar / desasignar</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "2px solid var(--border)", background: "var(--bg-soft)", minWidth: 160, fontSize: 11, color: "var(--sub)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Rubro
                </th>
                <th style={{ padding: "12px 8px", textAlign: "center", borderBottom: "2px solid var(--border)", background: "var(--bg-soft)", width: 80, fontSize: 11, color: "var(--sub)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Cobertura
                </th>
                {modulos.map(m => (
                  <th key={m.id} style={{ padding: "12px 16px", textAlign: "center", borderBottom: "2px solid var(--border)", borderLeft: "1px solid var(--border)", background: "var(--bg-soft)", minWidth: 100 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <i className={`bi ${ICONOS[m.nombre] ?? "bi-box-seam"}`} style={{ fontSize: 16, color: "var(--pr)" }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", textTransform: "capitalize" }}>{m.nombre}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rubros.length === 0 ? (
                <tr>
                  <td colSpan={modulos.length + 2} style={{ padding: 32, textAlign: "center" }} className="mod-sub">
                    Sin rubros. Creá uno en la pestaña Rubros.
                  </td>
                </tr>
              ) : rubros.map((r, rIdx) => {
                const asigCount = modulos.filter(m => isAsignado(r.id, m.id)).length;
                const pct       = modulos.length > 0 ? asigCount / modulos.length : 0;
                const col       = coverageColor(pct);
                const isLast    = rIdx === rubros.length - 1;

                return (
                  <tr key={r.id} style={{ background: rIdx % 2 === 0 ? "transparent" : "var(--bg-soft)" }}>
                    {/* nombre rubro */}
                    <td style={{ padding: "12px 16px", borderBottom: isLast ? "none" : "1px solid var(--border)", fontWeight: 600, fontSize: 13, color: "var(--text)" }}>
                      {r.nombre}
                    </td>
                    {/* cobertura */}
                    <td style={{ padding: "8px", textAlign: "center", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "2px 8px", borderRadius: 20, background: col.bg, color: col.text, fontSize: 11, fontWeight: 700 }}>
                        {asigCount}/{modulos.length}
                      </div>
                    </td>
                    {/* celdas de módulos */}
                    {modulos.map(m => {
                      const asignado = isAsignado(r.id, m.id);
                      const key      = `${r.id}-${m.id}`;
                      const isBusy   = toggling === key;
                      const isActive = detalle?.rubro.id === r.id && detalle?.modulo.id === m.id;

                      return (
                        <td
                          key={m.id}
                          style={{
                            padding: "10px 16px", textAlign: "center",
                            borderBottom: isLast ? "none" : "1px solid var(--border)",
                            borderLeft: "1px solid var(--border)",
                            cursor: isBusy ? "wait" : "pointer",
                            background: isActive ? "var(--bg-hover)" : "transparent",
                            transition: "background 0.12s",
                          }}
                          onClick={() => {
                            if (isBusy) return;
                            if (asignado) {
                              setDetalle(isActive ? null : { rubro: r, modulo: m });
                            } else {
                              toggleCelda(r, m);
                            }
                          }}
                          title={asignado ? `${r.nombre} — ${m.nombre} (click para ver planes / doble click para quitar)` : `Asignar ${m.nombre} a ${r.nombre}`}
                          onDoubleClick={() => asignado && toggleCelda(r, m)}
                        >
                          {isBusy ? (
                            <i className="bi bi-arrow-repeat" style={{ fontSize: 14, color: "var(--sub)" }} />
                          ) : asignado ? (
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 28, height: 28, borderRadius: "50%",
                              background: isActive ? "var(--pr)" : `${PLAN_COLORS.pro}22`,
                              color: isActive ? "#fff" : PLAN_COLORS.pro,
                              transition: "all 0.15s",
                            }}>
                              <i className="bi bi-check2" style={{ fontSize: 14 }} />
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 28, height: 28, borderRadius: "50%",
                              border: "1.5px dashed var(--border)", color: "var(--border)",
                              transition: "all 0.15s",
                            }}>
                              <i className="bi bi-plus" style={{ fontSize: 14 }} />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Panel de detalle ── */}
      {detalle && (() => {
        const data = moduloData[detalle.modulo.nombre] ?? { herramientas: [], planes: [] };
        return (
          <div className="ui-card" style={{ borderTop: `3px solid ${PLAN_COLORS.pro}` }}>
            <div className="ui-card__header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className={`bi ${ICONOS[detalle.modulo.nombre] ?? "bi-box-seam"}`} style={{ fontSize: 18, color: "var(--pr)" }} />
                <span className="ui-card__title">
                  {detalle.modulo.nombre} — {detalle.rubro.nombre}
                </span>
              </div>
              <button
                className="ui-btn ui-btn--secondary ui-btn--sm"
                onClick={() => setDetalle(null)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid var(--border)", background: "var(--bg-soft)", width: "40%", fontSize: 11, color: "var(--sub)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                      Herramienta
                    </th>
                    {PLAN_ORDER.map(plan => {
                      const planRow = data.planes.find(p => p.plan === plan);
                      return (
                        <th key={plan} style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--border)", background: "var(--bg-soft)", minWidth: 110 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: PLAN_COLORS[plan], marginBottom: 6 }}>
                            {PLAN_LABELS[plan]}
                          </div>
                          {planRow ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                              <span style={{ fontSize: 11, color: "var(--sub)" }}>$</span>
                              <input
                                type="number" min="0"
                                style={{ width: 60, border: "none", borderBottom: "1px solid var(--border)", background: "transparent", textAlign: "center", fontSize: 14, fontWeight: 700, color: "var(--text)", outline: "none", padding: "2px 0" }}
                                value={planRow.precio}
                                onChange={e => setModuloData(prev => ({
                                  ...prev,
                                  [detalle.modulo.nombre]: {
                                    ...prev[detalle.modulo.nombre],
                                    planes: prev[detalle.modulo.nombre].planes.map(p =>
                                      p.id === planRow.id ? { ...p, precio: e.target.value } : p
                                    ),
                                  },
                                }))}
                                onBlur={e => actualizarPrecio(planRow.id, e.target.value, detalle.modulo.nombre)}
                              />
                              <span style={{ fontSize: 11, color: "var(--sub)" }}>/mes</span>
                            </div>
                          ) : <span className="mod-sub">—</span>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {data.herramientas.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 16, textAlign: "center" }} className="mod-sub">
                        Sin herramientas registradas.
                      </td>
                    </tr>
                  ) : data.herramientas.map((h, idx) => {
                    const minIdx = PLAN_ORDER.indexOf(h.plan_minimo);
                    const isLast = idx === data.herramientas.length - 1;
                    return (
                      <tr key={h.id} style={{ background: idx % 2 === 0 ? "transparent" : "var(--bg-soft)" }}>
                        <td style={{ padding: "12px 16px", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{h.nombre}</div>
                          {h.descripcion && <div className="mod-sub">{h.descripcion}</div>}
                        </td>
                        {PLAN_ORDER.map((plan, pIdx) => {
                          const included  = pIdx >= minIdx;
                          const isMinPlan = pIdx === minIdx;
                          const cellKey   = `${h.id}-${plan}`;
                          const isSaving  = savingCell === cellKey;
                          const isSaved   = savedCell  === cellKey;
                          return (
                            <td
                              key={plan}
                              style={{ textAlign: "center", padding: "12px 16px", borderBottom: isLast ? "none" : "1px solid var(--border)", borderLeft: "1px solid var(--border)", cursor: pIdx <= minIdx ? "pointer" : "default" }}
                              onClick={() => handlePlanMinimo(h, plan, detalle.modulo.nombre)}
                              title={pIdx < minIdx ? `Mover a ${PLAN_LABELS[plan]}` : isMinPlan ? `Subir un nivel` : `Incluido (${PLAN_LABELS[h.plan_minimo]}+)`}
                            >
                              {isSaving ? (
                                <i className="bi bi-arrow-repeat" style={{ fontSize: 14, color: "var(--sub)" }} />
                              ) : isSaved ? (
                                <i className="bi bi-check-lg" style={{ fontSize: 16, color: PLAN_COLORS[plan] }} />
                              ) : included ? (
                                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: isMinPlan ? PLAN_COLORS[plan] : `${PLAN_COLORS[plan]}22`, color: isMinPlan ? "#fff" : PLAN_COLORS[plan] }}>
                                  <i className="bi bi-check" style={{ fontSize: 13 }} />
                                </span>
                              ) : (
                                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", border: "1.5px dashed var(--border)", color: "var(--border)" }}>
                                  <i className="bi bi-dash" style={{ fontSize: 13 }} />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
