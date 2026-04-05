"use client";

import { useState, useEffect } from "react";

const ICONOS = {
  crm:          "bi-people",
  mcp:          "bi-grid-1x2",
  "adm-rubros": "bi-building",
};

const PLAN_ORDER  = ["free", "pro", "business", "ia"];
const PLAN_LABELS = { free: "Free", pro: "Pro", business: "Business", ia: "Plan IA" };
const PLAN_COLORS = { free: "#64748b", pro: "#3b82f6", business: "#8b5cf6", ia: "#f59e0b" };

export default function TabRubrosMolde() {
  const [rubros,          setRubros]          = useState([]);
  const [modulos,         setModulos]         = useState([]);
  const [asignaciones,    setAsignaciones]    = useState([]);
  const [rubroSel,        setRubroSel]        = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [moduloData,      setModuloData]      = useState({});
  const [toggling,        setToggling]        = useState(null);
  const [savingCell,      setSavingCell]      = useState(null);
  const [savedCell,       setSavedCell]       = useState(null);

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
      setRubroSel(prev => prev ?? (listaRubros[0]?.id ?? null));

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

  const asignadasAlRubro   = asignaciones.filter(a => Number(a.rubro_id) === rubroSel);
  const modulosHabilitados = modulos.filter(m => asignadasAlRubro.find(a => Number(a.modulo_id) === m.id));

  async function toggleModulo(modulo) {
    const habilitado = !!asignadasAlRubro.find(a => Number(a.modulo_id) === modulo.id);
    setToggling(modulo.id);
    try {
      if (habilitado) {
        await fetch(`/api/adm-rubros/rubros-modulos?rubro_id=${rubroSel}&modulo_id=${modulo.id}`, { method: "DELETE" });
      } else {
        await fetch("/api/adm-rubros/rubros-modulos", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ rubro_id: rubroSel, modulo_id: modulo.id, plan_minimo: "free" }),
        });
      }
      const aRes = await fetch("/api/adm-rubros/rubros-modulos").then(r => r.json());
      if (aRes.ok) setAsignaciones(aRes.asignaciones);
    } catch (e) {
      console.error("[toggleModulo]", e);
    } finally {
      setToggling(null);
    }
  }

  // Click en celda del plan: cambia plan_minimo de la herramienta
  async function handleCellClick(herramienta, plan, moduloNombre) {
    const currentIdx = PLAN_ORDER.indexOf(herramienta.plan_minimo);
    const clickedIdx = PLAN_ORDER.indexOf(plan);

    let nuevoPlan;
    if (clickedIdx === currentIdx) {
      // clic en plan_minimo actual → subir un nivel (hacerlo más restrictivo)
      nuevoPlan = PLAN_ORDER[currentIdx + 1] ?? herramienta.plan_minimo;
    } else if (clickedIdx < currentIdx) {
      // clic en plan menor → bajar plan_minimo (más accesible)
      nuevoPlan = plan;
    } else {
      // clic en plan mayor ya incluido → no hace nada
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
      console.error("[handleCellClick]", e);
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
      <div className="ui-empty__text">Cargando asignaciones...</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, alignItems: "start" }}>

      {/* ── columna izquierda ── */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title">Rubros</span>
        </div>
        <div className="ui-card__body" style={{ padding: 0 }}>
          {rubros.length === 0 ? (
            <div style={{ padding: "12px 16px" }} className="mod-sub">
              Sin rubros. Creá uno en la pestaña Rubros.
            </div>
          ) : rubros.map(r => (
            <div
              key={r.id}
              onClick={() => setRubroSel(r.id)}
              style={{
                padding:    "10px 16px", cursor: "pointer",
                borderLeft: rubroSel === r.id ? "3px solid var(--pr)" : "3px solid transparent",
                background: rubroSel === r.id ? "var(--bg-hover)" : "transparent",
                fontWeight: rubroSel === r.id ? 600 : 400,
                fontSize: 14, color: "var(--text)", transition: "all 0.12s", userSelect: "none",
              }}
            >
              {r.nombre}
            </div>
          ))}
        </div>
      </div>

      {/* ── columna derecha ── */}
      {rubroSel ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* sección 1: módulos */}
          <div className="ui-card">
            <div className="ui-card__header">
              <span className="ui-card__title">
                Módulos habilitados para <strong>{rubros.find(r => r.id === rubroSel)?.nombre}</strong>
              </span>
            </div>
            <div className="ui-card__body" style={{ padding: 0 }}>
              {modulos.length === 0 ? (
                <div style={{ padding: "12px 16px" }} className="mod-sub">Sin módulos en el sistema.</div>
              ) : modulos.map((m, idx) => {
                const habilitado = !!asignadasAlRubro.find(a => Number(a.modulo_id) === m.id);
                const icon       = ICONOS[m.nombre] ?? "bi-box-seam";
                const isLast     = idx === modulos.length - 1;
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                    <i className={`bi ${icon}`} style={{ fontSize: 18, color: "var(--pr)", width: 22, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{m.nombre}</div>
                      {m.descripcion && (
                        <div className="mod-sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{m.descripcion}</div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleModulo(m)}
                      disabled={toggling === m.id}
                      style={{
                        width: 42, height: 22, borderRadius: 11, border: "none",
                        cursor: toggling === m.id ? "wait" : "pointer",
                        background: habilitado ? "var(--pr)" : "var(--border)",
                        transition: "background 0.2s", position: "relative", flexShrink: 0,
                        opacity: toggling === m.id ? 0.6 : 1,
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 3, left: habilitado ? 21 : 3,
                        width: 16, height: 16, borderRadius: "50%",
                        background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                      }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* sección 2: tabla de planes */}
          {modulosHabilitados.length === 0 ? (
            <div className="ui-card">
              <div className="ui-card__body">
                <div className="ui-empty" style={{ padding: "8px 0" }}>
                  <i className="bi bi-toggles ui-empty__icon" style={{ fontSize: 28 }} />
                  <div className="ui-empty__text">Sin módulos habilitados</div>
                  <div className="ui-empty__sub">Habilitá módulos arriba para configurar sus planes.</div>
                </div>
              </div>
            </div>
          ) : modulosHabilitados.map(m => {
            const data = moduloData[m.nombre] ?? { herramientas: [], planes: [] };
            return (
              <div key={m.id} className="ui-card">
                <div className="ui-card__header">
                  <span className="ui-card__title">{m.nombre} — Planes</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {/* columna herramienta */}
                        <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid var(--border)", width: "40%", fontSize: 11, color: "var(--sub)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                          Herramienta
                        </th>
                        {PLAN_ORDER.map(plan => {
                          const planRow = data.planes.find(p => p.plan === plan);
                          return (
                            <th key={plan} style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--border)", minWidth: 110 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: PLAN_COLORS[plan], marginBottom: 6 }}>
                                {PLAN_LABELS[plan]}
                              </div>
                              {planRow ? (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                                  <span style={{ fontSize: 11, color: "var(--sub)" }}>$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    style={{
                                      width: 60, border: "none", borderBottom: "1px solid var(--border)",
                                      background: "transparent", textAlign: "center",
                                      fontSize: 14, fontWeight: 700, color: "var(--text)",
                                      outline: "none", padding: "2px 0",
                                    }}
                                    value={planRow.precio}
                                    onChange={e => setModuloData(prev => ({
                                      ...prev,
                                      [m.nombre]: {
                                        ...prev[m.nombre],
                                        planes: prev[m.nombre].planes.map(p =>
                                          p.id === planRow.id ? { ...p, precio: e.target.value } : p
                                        ),
                                      },
                                    }))}
                                    onBlur={e => actualizarPrecio(planRow.id, e.target.value, m.nombre)}
                                  />
                                  <span style={{ fontSize: 11, color: "var(--sub)" }}>/mes</span>
                                </div>
                              ) : (
                                <span className="mod-sub">—</span>
                              )}
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
                        const minIdx  = PLAN_ORDER.indexOf(h.plan_minimo);
                        const isLast  = idx === data.herramientas.length - 1;
                        const rowBg   = idx % 2 === 0 ? "transparent" : "var(--bg-soft)";
                        return (
                          <tr key={h.id} style={{ background: rowBg }}>
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
                                  style={{
                                    textAlign: "center",
                                    padding: "12px 16px",
                                    borderBottom: isLast ? "none" : "1px solid var(--border)",
                                    borderLeft: "1px solid var(--border)",
                                    cursor: pIdx <= minIdx ? "pointer" : "default",
                                  }}
                                  onClick={() => handleCellClick(h, plan, m.nombre)}
                                  title={
                                    pIdx < minIdx  ? `Mover a ${PLAN_LABELS[plan]}` :
                                    isMinPlan      ? `Quitar de ${PLAN_LABELS[plan]}` :
                                    `Incluido por ser ${PLAN_LABELS[h.plan_minimo]}+`
                                  }
                                >
                                  {isSaving ? (
                                    <i className="bi bi-arrow-repeat" style={{ fontSize: 14, color: "var(--sub)" }} />
                                  ) : isSaved ? (
                                    <i className="bi bi-check-lg" style={{ fontSize: 16, color: PLAN_COLORS[plan] }} />
                                  ) : included ? (
                                    <span style={{
                                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                                      width: 22, height: 22, borderRadius: "50%",
                                      background: isMinPlan ? PLAN_COLORS[plan] : `${PLAN_COLORS[plan]}22`,
                                      color: isMinPlan ? "#fff" : PLAN_COLORS[plan],
                                    }}>
                                      <i className="bi bi-check" style={{ fontSize: 13 }} />
                                    </span>
                                  ) : (
                                    <span style={{
                                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                                      width: 22, height: 22, borderRadius: "50%",
                                      border: "1.5px dashed var(--border)", color: "var(--border)",
                                    }}>
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
          })}

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
