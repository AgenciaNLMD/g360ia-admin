"use client";

import { useState, useEffect } from "react";

const PLANES = [
  { value: 1, label: "Starter"    },
  { value: 2, label: "Pro"        },
  { value: 3, label: "Business"   },
  { value: 4, label: "Enterprise" },
];

export default function TabRubrosMolde() {
  const [rubros,       setRubros]       = useState([]);
  const [modulos,      setModulos]      = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [rubroSel,     setRubroSel]     = useState("");
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);
  const [form,         setForm]         = useState({ modulo_id: "", plan_minimo: 1 });
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    const [rRes, mRes, aRes] = await Promise.all([
      fetch("/api/adm-rubros/rubros").then(r => r.json()),
      fetch("/api/adm-rubros/modulos").then(r => r.json()),
      fetch("/api/adm-rubros/rubros-modulos").then(r => r.json()),
    ]);
    if (rRes.ok) {
      setRubros(rRes.rubros);
      setRubroSel(sel => sel || (rRes.rubros[0] ? String(rRes.rubros[0].id) : ""));
    }
    if (mRes.ok) setModulos(mRes.modulos);
    if (aRes.ok) setAsignaciones(aRes.asignaciones);
    setLoading(false);
  }

  const asignadasAlRubro    = asignaciones.filter(a => String(a.rubro_id) === rubroSel);
  const modulosDisponibles  = modulos.filter(m => !asignadasAlRubro.find(a => a.modulo_id === m.id));
  const rubroActual         = rubros.find(r => String(r.id) === rubroSel);

  function abrirModal() {
    setForm({ modulo_id: modulosDisponibles[0]?.id ?? "", plan_minimo: 1 });
    setError("");
    setModal(true);
  }

  async function agregar() {
    if (!form.modulo_id) { setError("Seleccioná un módulo."); return; }
    setSaving(true);
    setError("");
    const r = await fetch("/api/adm-rubros/rubros-modulos", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        rubro_id:    Number(rubroSel),
        modulo_id:   Number(form.modulo_id),
        plan_minimo: Number(form.plan_minimo),
      }),
    });
    const d = await r.json();
    setSaving(false);
    if (d.ok) { setModal(false); cargar(); }
    else setError(d.error ?? "Error al asignar.");
  }

  async function quitar(modulo_id) {
    await fetch(`/api/adm-rubros/rubros-modulos?rubro_id=${rubroSel}&modulo_id=${modulo_id}`, {
      method: "DELETE",
    });
    cargar();
  }

  if (loading) return (
    <div className="ui-empty">
      <i className="bi bi-arrow-repeat ui-empty__icon" />
      <div className="ui-empty__text">Cargando asignaciones...</div>
    </div>
  );

  return (
    <>
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title">Seleccionar rubro</span>
        </div>
        <div className="ui-card__body">
          {rubros.length === 0 ? (
            <div className="ui-empty">
              <i className="bi bi-building ui-empty__icon" />
              <div className="ui-empty__text">Sin rubros</div>
              <div className="ui-empty__sub">Creá rubros en la pestaña Rubros primero.</div>
            </div>
          ) : (
            <div className="ui-field">
              <label className="ui-label">Rubro</label>
              <select
                className="ui-select"
                value={rubroSel}
                onChange={e => setRubroSel(e.target.value)}
              >
                {rubros.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre} ({r.slug})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {rubroSel && (
        <div className="ui-card">
          <div className="ui-card__header">
            <span className="ui-card__title">
              Módulos de <strong>{rubroActual?.nombre}</strong>
            </span>
            <button
              className="ui-btn ui-btn--primary ui-btn--sm"
              onClick={abrirModal}
              disabled={modulosDisponibles.length === 0}
            >
              <i className="bi bi-plus-lg" /> Agregar módulo
            </button>
          </div>
          <div className="ui-card__body">
            {asignadasAlRubro.length === 0 ? (
              <div className="ui-empty">
                <i className="bi bi-diagram-3 ui-empty__icon" />
                <div className="ui-empty__text">Sin módulos asignados</div>
                <div className="ui-empty__sub">Asigná módulos a este rubro para que sus tenants puedan usarlos.</div>
              </div>
            ) : (
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Módulo</th>
                    <th>Plan mínimo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {asignadasAlRubro.map(a => (
                    <tr key={a.modulo_id}>
                      <td>
                        <strong>{a.modulo_nombre}</strong>
                        <span className="mod-sub"> · {a.modulo_slug}</span>
                      </td>
                      <td>
                        <span className="ui-badge ui-badge--blue">
                          {PLANES.find(p => p.value === a.plan_minimo)?.label ?? a.plan_minimo}
                        </span>
                      </td>
                      <td>
                        <button
                          className="ui-btn ui-btn--danger ui-btn--sm"
                          onClick={() => quitar(a.modulo_id)}
                        >
                          <i className="bi bi-trash3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {modal && (
        <div className="pmodal-backdrop" onClick={() => setModal(false)}>
          <div className="pmodal pmodal--sm" onClick={e => e.stopPropagation()}>
            <div className="pmodal__header">
              <span className="pmodal__title">Agregar módulo a {rubroActual?.nombre}</span>
              <button className="pmodal__close" onClick={() => setModal(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="pmodal__body">
              <div className="ui-field">
                <label className="ui-label">Módulo</label>
                <select
                  className="ui-select"
                  value={form.modulo_id}
                  onChange={e => setForm(f => ({ ...f, modulo_id: e.target.value }))}
                >
                  {modulosDisponibles.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.slug})</option>
                  ))}
                </select>
              </div>
              <div className="ui-field">
                <label className="ui-label">Plan mínimo</label>
                <select
                  className="ui-select"
                  value={form.plan_minimo}
                  onChange={e => setForm(f => ({ ...f, plan_minimo: Number(e.target.value) }))}
                >
                  {PLANES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              {error && <p className="ui-badge ui-badge--red">{error}</p>}
            </div>
            <div className="pmodal__footer">
              <button className="ui-btn ui-btn--secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="ui-btn ui-btn--primary" onClick={agregar} disabled={saving}>
                {saving ? "Guardando..." : "Asignar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
