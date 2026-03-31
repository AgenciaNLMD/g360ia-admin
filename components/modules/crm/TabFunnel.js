"use client";

import { useState, useEffect, useCallback } from "react";

const ETAPAS = [
  { id: "contacto",     label: "Contacto",    color: "var(--pr-light)"    },
  { id: "propuesta",    label: "Propuesta",   color: "var(--accent)"      },
  { id: "negociacion",  label: "Negociación", color: "var(--teal)"        },
  { id: "cierre",       label: "Cierre",      color: "var(--em-light)"    },
  { id: "ganada",       label: "Ganada",      color: "var(--em)"          },
  { id: "perdida",      label: "Perdida",     color: "var(--alert, #C0392B)" },
];

export default function TabFunnel({ tenant_id, usuario_id, rol }) {
  const [oportunidades, setOportunidades] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [form,          setForm]          = useState({ titulo: "", etapa: "contacto", valor: "", probabilidad: "", fecha_cierre_est: "" });
  const [saving,        setSaving]        = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/crm/oportunidades");
      const data = await res.json();
      if (data.ok) setOportunidades(data.oportunidades);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function moverEtapa(id, etapa) {
    await fetch("/api/crm/oportunidades", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, etapa }),
    });
    setOportunidades(prev => prev.map(o => o.id === id ? { ...o, etapa } : o));
    if (selected?.id === id) setSelected(prev => ({ ...prev, etapa }));
  }

  async function guardarOportunidad(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res  = await fetch("/api/crm/oportunidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setShowForm(false);
        setForm({ titulo: "", etapa: "contacto", valor: "", probabilidad: "", fecha_cierre_est: "" });
        cargar();
      }
    } finally {
      setSaving(false);
    }
  }

  const porEtapa   = etapa => oportunidades.filter(o => o.etapa === etapa);
  const totalEtapa = etapa => porEtapa(etapa).reduce((s, o) => s + Number(o.valor || 0), 0);
  const fmt        = v     => v ? `$${Number(v).toLocaleString("es-AR")}` : "—";

  const totalPipeline = oportunidades
    .filter(o => !["ganada","perdida"].includes(o.etapa))
    .reduce((s, o) => s + Number(o.valor || 0), 0);

  return (
    <div>
      {/* Resumen pipeline */}
      <div className="kpi-row" style={{ padding: "16px 0 4px" }}>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--slate"><i className="bi bi-graph-up" /></div>
          <div>
            <div className="kpi-label">Pipeline activo</div>
            <div className="kpi-val">{fmt(totalPipeline)}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--green"><i className="bi bi-trophy" /></div>
          <div>
            <div className="kpi-label">Ganadas</div>
            <div className="kpi-val">{fmt(totalEtapa("ganada"))}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--champ"><i className="bi bi-file-earmark-text" /></div>
          <div>
            <div className="kpi-label">Propuestas</div>
            <div className="kpi-val">{porEtapa("propuesta").length}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--teal"><i className="bi bi-layers" /></div>
          <div>
            <div className="kpi-label">Total oportunidades</div>
            <div className="kpi-val">{oportunidades.length}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="table-toolbar__right">
          <button className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg" style={{ marginRight: 4 }} />Nueva oportunidad
          </button>
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="ui-empty" style={{ marginTop: 16 }}>
          <div className="ui-empty__icon"><i className="bi bi-arrow-repeat" /></div>
          <div className="ui-empty__text">Cargando…</div>
        </div>
      ) : (
        <div className="kanban" style={{ marginTop: 12 }}>
          {ETAPAS.map(etapa => {
            const cards = porEtapa(etapa.id);
            return (
              <div key={etapa.id} className="k-col">
                <div className="k-col__bar" style={{ background: etapa.color }} />
                <div className="k-col__title">{etapa.label}</div>
                <div className="k-col__meta">
                  <span>{cards.length} oport.</span>
                  <span>{fmt(totalEtapa(etapa.id))}</span>
                </div>
                {cards.length === 0 && (
                  <div className="ui-empty">
                    <div className="ui-empty__icon"><i className="bi bi-inbox" /></div>
                    <div className="ui-empty__sub">Sin oportunidades</div>
                  </div>
                )}
                {cards.map(o => (
                  <div key={o.id} className="k-card" onClick={() => setSelected(o)}>
                    <div className="k-card__name">{o.titulo}</div>
                    {o.lead_nombre && (
                      <div className="k-card__date">
                        <i className="bi bi-person" />{o.lead_nombre}
                        {o.lead_empresa ? ` · ${o.lead_empresa}` : ""}
                      </div>
                    )}
                    <div className="k-card__footer">
                      <div className="k-card__amount">{fmt(o.valor)}</div>
                      {o.probabilidad && (
                        <span className="ui-badge ui-badge--blue">{o.probabilidad}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle oportunidad */}
      {selected && (
        <div className="pmodal-backdrop" onClick={() => setSelected(null)}>
          <div className="pmodal" onClick={e => e.stopPropagation()}>
            <div className="pmodal__header">
              <div className="pmodal__title">{selected.titulo}</div>
              <button className="pmodal__close" onClick={() => setSelected(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="pmodal__body">
              <div className="opp-card">
                <div className="opp-card__title">Detalles</div>
                <div className="opp-grid">
                  <div>
                    <div className="opp-field__label">Valor</div>
                    <div className="opp-field__val opp-field__val--green">{fmt(selected.valor)}</div>
                  </div>
                  <div>
                    <div className="opp-field__label">Probabilidad</div>
                    <div className="opp-field__val opp-field__val--champ">{selected.probabilidad ? `${selected.probabilidad}%` : "—"}</div>
                  </div>
                  <div>
                    <div className="opp-field__label">Lead</div>
                    <div className="opp-field__val">{selected.lead_nombre || "—"}</div>
                  </div>
                  <div>
                    <div className="opp-field__label">Cierre estimado</div>
                    <div className="opp-field__val">
                      {selected.fecha_cierre_est
                        ? new Date(selected.fecha_cierre_est).toLocaleDateString("es-AR")
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
              {/* Pipeline de etapas */}
              <div style={{ padding: "12px 0" }}>
                <div className="pipeline">
                  {ETAPAS.slice(0, 4).map(et => (
                    <div
                      key={et.id}
                      className={`pip-step${selected.etapa === et.id ? " pip-step--active" : ["ganada","perdida"].includes(selected.etapa) ? "" : ""}`}
                      onClick={() => moverEtapa(selected.id, et.id)}
                    >
                      {et.label}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, padding: "4px 0 12px" }}>
                {["ganada", "perdida"].map(et => (
                  <button
                    key={et}
                    className={`ui-btn ui-btn--sm${selected.etapa === et ? (et === "ganada" ? " ui-btn--primary" : " ui-btn--danger") : " ui-btn--secondary"}`}
                    onClick={() => moverEtapa(selected.id, et)}
                  >
                    {et === "ganada" ? "Marcar ganada" : "Marcar perdida"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva oportunidad */}
      {showForm && (
        <div className="pmodal-backdrop" onClick={() => setShowForm(false)}>
          <div className="pmodal" onClick={e => e.stopPropagation()}>
            <div className="pmodal__header">
              <div className="pmodal__title">Nueva oportunidad</div>
              <button className="pmodal__close" onClick={() => setShowForm(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <form onSubmit={guardarOportunidad}>
              <div className="pmodal__body">
                <div className="ui-field">
                  <label className="ui-label">Título *</label>
                  <input
                    className="ui-input"
                    value={form.titulo}
                    onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                    required
                  />
                </div>
                <div className="ui-field">
                  <label className="ui-label">Etapa</label>
                  <select
                    className="ui-select"
                    value={form.etapa}
                    onChange={e => setForm(p => ({ ...p, etapa: e.target.value }))}
                  >
                    {ETAPAS.map(et => (
                      <option key={et.id} value={et.id}>{et.label}</option>
                    ))}
                  </select>
                </div>
                <div className="ui-field">
                  <label className="ui-label">Valor estimado ($)</label>
                  <input
                    className="ui-input"
                    type="number"
                    value={form.valor}
                    onChange={e => setForm(p => ({ ...p, valor: e.target.value }))}
                  />
                </div>
                <div className="ui-field">
                  <label className="ui-label">Probabilidad (%)</label>
                  <input
                    className="ui-input"
                    type="number"
                    min="0"
                    max="100"
                    value={form.probabilidad}
                    onChange={e => setForm(p => ({ ...p, probabilidad: e.target.value }))}
                  />
                </div>
                <div className="ui-field">
                  <label className="ui-label">Fecha cierre estimada</label>
                  <input
                    className="ui-input"
                    type="date"
                    value={form.fecha_cierre_est}
                    onChange={e => setForm(p => ({ ...p, fecha_cierre_est: e.target.value }))}
                  />
                </div>
              </div>
              <div className="pmodal__footer">
                <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="ui-btn ui-btn--primary" disabled={saving}>
                  {saving ? "Guardando…" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
