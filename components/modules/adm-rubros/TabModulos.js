"use client";

import { useState, useEffect } from "react";

// ── ModuloCard ────────────────────────────────────────────────────────────────
function ModuloCard({ modulo, gruposExistentes, onGuardar }) {
  const [editing,      setEditing]      = useState(false);
  const [selected,     setSelected]     = useState(modulo.grupo ?? "");
  const [nuevoNombre,  setNuevoNombre]  = useState("");

  function abrir() {
    setSelected(modulo.grupo ?? "");
    setNuevoNombre("");
    setEditing(true);
  }

  function guardar() {
    const grupo = selected === "__nuevo__"
      ? nuevoNombre.trim()
      : selected;
    onGuardar(modulo.id, grupo || null);
    setEditing(false);
  }

  return (
    <div className="ui-card" style={{ padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 10, minWidth: 200 }}>
      <i className="bi bi-box-seam" style={{ fontSize: 16, color: "var(--pr)", flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 4 }}>{modulo.nombre}</div>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              style={{ fontSize: 11, padding: "3px 6px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", width: "100%" }}
            >
              <option value="">Sin grupo</option>
              {gruposExistentes.map(g => <option key={g} value={g}>{g}</option>)}
              <option disabled>──────</option>
              <option value="__nuevo__">+ Nuevo grupo...</option>
            </select>
            {selected === "__nuevo__" && (
              <input
                autoFocus
                className="ui-input"
                style={{ fontSize: 11, padding: "3px 6px" }}
                placeholder="Nombre del grupo"
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                onKeyDown={e => e.key === "Enter" && guardar()}
              />
            )}
            <div style={{ display: "flex", gap: 4 }}>
              <button className="ui-btn ui-btn--primary ui-btn--sm" style={{ flex: 1 }} onClick={guardar}>
                Guardar
              </button>
              <button className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setEditing(false)}>
                <i className="bi bi-x" />
              </button>
            </div>
          </div>
        ) : (
          <span
            onClick={abrir}
            title="Click para cambiar grupo"
            style={{ fontSize: 11, color: "var(--sub)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            {modulo.grupo
              ? <><i className="bi bi-tag" style={{ fontSize: 10 }} />{modulo.grupo}</>
              : <span style={{ color: "var(--border)" }}>Sin grupo</span>
            }
            <i className="bi bi-pencil" style={{ fontSize: 9, opacity: 0.5 }} />
          </span>
        )}
      </div>
    </div>
  );
}

// ── TabModulos ────────────────────────────────────────────────────────────────
export default function TabModulos() {
  const [modulos,      setModulos]      = useState([]);
  const [rubros,       setRubros]       = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [toggling,     setToggling]     = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const [mRes, rRes, aRes] = await Promise.all([
        fetch("/api/matriz/modulos").then(r => r.json()),
        fetch("/api/matriz/rubros").then(r => r.json()),
        fetch("/api/matriz/rubros-modulos").then(r => r.json()),
      ]);
      if (mRes.ok) setModulos(mRes.modulos);
      if (rRes.ok) setRubros(rRes.rubros);
      if (aRes.ok) setAsignaciones(aRes.asignaciones);
    } catch (e) {
      console.error("[TabModulos]", e);
    } finally {
      setLoading(false);
    }
  }

  const gruposExistentes = [...new Set(modulos.map(m => m.grupo).filter(Boolean))];

  async function guardarGrupo(moduloId, grupo) {
    try {
      await fetch("/api/matriz/modulos", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: moduloId, grupo: grupo || null }),
      });
      setModulos(prev => prev.map(m => m.id === moduloId ? { ...m, grupo: grupo || null } : m));
    } catch (e) {
      console.error("[guardarGrupo]", e);
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
        await fetch(`/api/matriz/rubros-modulos?rubro_id=${rubro.id}&modulo_id=${modulo.id}`, { method: "DELETE" });
      } else {
        await fetch("/api/matriz/rubros-modulos", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ rubro_id: rubro.id, modulo_id: modulo.id, plan_minimo: "free" }),
        });
      }
      const aRes = await fetch("/api/matriz/rubros-modulos").then(r => r.json());
      if (aRes.ok) setAsignaciones(aRes.asignaciones);
    } catch (e) {
      console.error("[toggleCelda]", e);
    } finally {
      setToggling(null);
    }
  }

  if (loading) return (
    <div className="ui-empty">
      <i className="bi bi-arrow-repeat ui-empty__icon" />
      <div className="ui-empty__text">Cargando...</div>
    </div>
  );

  // Agrupar módulos por grupo
  const grupos = {};
  for (const m of modulos) {
    const g = m.grupo ?? "Sin grupo";
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(m);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Sección 1: Módulos y grupos ── */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title">Módulos y grupos</span>
          <span className="mod-sub">Asigná cada módulo a un grupo — impacta en el sidebar de cada cliente</span>
        </div>
        <div className="ui-card__body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {modulos.length === 0 ? (
            <div className="ui-empty">
              <i className="bi bi-box-seam ui-empty__icon" />
              <div className="ui-empty__text">Sin módulos registrados</div>
              <div className="ui-empty__sub">Insertá módulos en db_rubros_molde.modulos para comenzar.</div>
            </div>
          ) : Object.entries(grupos).map(([grupo, mods]) => (
            <div key={grupo}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--sub)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <i className="bi bi-collection" style={{ fontSize: 11 }} />
                {grupo}
                <span style={{ fontWeight: 400, opacity: 0.6 }}>({mods.length})</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {mods.map(m => (
                  <ModuloCard
                    key={m.id}
                    modulo={m}
                    gruposExistentes={gruposExistentes}
                    onGuardar={guardarGrupo}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sección 2: Matriz rubros × módulos ── */}
      <div className="ui-card" style={{ overflow: "hidden" }}>
        <div className="ui-card__header">
          <span className="ui-card__title">Asignación rubros × módulos</span>
          <span className="mod-sub">Click para asignar · Doble click para quitar</span>
        </div>
        {modulos.length === 0 || rubros.length === 0 ? (
          <div className="ui-card__body">
            <div className="ui-empty">
              <i className="bi bi-grid-3x3 ui-empty__icon" />
              <div className="ui-empty__text">
                {modulos.length === 0 ? "Sin módulos" : "Sin rubros"}
              </div>
              <div className="ui-empty__sub">
                {modulos.length === 0
                  ? "Registrá módulos para poder asignarlos."
                  : "Creá rubros en la pestaña Rubros para comenzar."}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "2px solid var(--border)", background: "var(--bg-soft)", minWidth: 160, fontSize: 11, color: "var(--sub)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Rubro
                  </th>
                  {modulos.map(m => (
                    <th key={m.id} style={{ padding: "12px 16px", textAlign: "center", borderBottom: "2px solid var(--border)", borderLeft: "1px solid var(--border)", background: "var(--bg-soft)", minWidth: 120 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{m.nombre}</span>
                        {m.grupo && (
                          <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: "var(--bg-hover)", color: "var(--sub)", lineHeight: 1.8 }}>
                            {m.grupo}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rubros.map((r, rIdx) => {
                  const isLast = rIdx === rubros.length - 1;
                  return (
                    <tr key={r.id} style={{ background: rIdx % 2 === 0 ? "transparent" : "var(--bg-soft)" }}>
                      <td style={{ padding: "12px 16px", borderBottom: isLast ? "none" : "1px solid var(--border)", fontWeight: 600, fontSize: 13, color: "var(--text)" }}>
                        {r.nombre}
                      </td>
                      {modulos.map(m => {
                        const asignado = isAsignado(r.id, m.id);
                        const key      = `${r.id}-${m.id}`;
                        const isBusy   = toggling === key;
                        return (
                          <td
                            key={m.id}
                            style={{ padding: "10px 16px", textAlign: "center", borderBottom: isLast ? "none" : "1px solid var(--border)", borderLeft: "1px solid var(--border)", cursor: isBusy ? "wait" : "pointer", transition: "background 0.12s" }}
                            onClick={() => !isBusy && toggleCelda(r, m)}
                            title={asignado ? `Quitar ${m.nombre} de ${r.nombre}` : `Asignar ${m.nombre} a ${r.nombre}`}
                          >
                            {isBusy ? (
                              <i className="bi bi-arrow-repeat" style={{ fontSize: 14, color: "var(--sub)" }} />
                            ) : asignado ? (
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "#3b82f622", color: "#3b82f6" }}>
                                <i className="bi bi-check2" style={{ fontSize: 14 }} />
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", border: "1.5px dashed var(--border)", color: "var(--border)" }}>
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
        )}
      </div>

    </div>
  );
}
