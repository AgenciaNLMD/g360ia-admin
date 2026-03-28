"use client";

import { useState, useEffect, useCallback } from "react";

const ESTADO_META = {
  nuevo:      { label: "Nuevo",      cls: "ui-badge--gray"  },
  contactado: { label: "Contactado", cls: "ui-badge--blue"  },
  calificado: { label: "Calificado", cls: "ui-badge--amber" },
  demo:       { label: "Demo",       cls: "ui-badge--blue"  },
  propuesta:  { label: "Propuesta",  cls: "ui-badge--amber" },
  ganado:     { label: "Ganado",     cls: "ui-badge--green" },
  perdido:    { label: "Perdido",    cls: "ui-badge--red"   },
};

const FUENTE_META = {
  manual:    "Manual",
  whatsapp:  "WhatsApp",
  instagram: "Instagram",
  facebook:  "Facebook",
  web:       "Web",
  referido:  "Referido",
};

const FORM_VACIO = {
  nombre: "", empresa: "", email: "", telefono: "",
  whatsapp: "", fuente: "manual", valor_estimado: "", notas_ia: "",
};

export default function TabLeads({ tenant_id, usuario_id, rol }) {
  const [leads,    setLeads]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("sin_tomar");
  const [selected, setSelected] = useState(null);   // lead abierto en modal
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(FORM_VACIO);
  const [saving,   setSaving]   = useState(false);
  const esAdmin = ["superadmin", "admin"].includes(rol);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/crm/leads?tab=${tab}`);
      const data = await res.json();
      if (data.ok) {
        setLeads(data.leads);
        setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { cargar(); }, [cargar]);

  async function tomarLead(id) {
    await fetch("/api/crm/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, tomar: true }),
    });
    cargar();
  }

  async function cambiarEstado(id, estado) {
    await fetch("/api/crm/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    setSelected(prev => prev ? { ...prev, estado } : null);
    cargar();
  }

  async function guardarLead(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res  = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setShowForm(false);
        setForm(FORM_VACIO);
        cargar();
      }
    } finally {
      setSaving(false);
    }
  }

  const fmt = v => v ? `$${Number(v).toLocaleString("es-AR")}` : "—";

  return (
    <div>
      {/* KPIs */}
      {stats && (
        <div className="kpi-row" style={{ padding: "16px 0 4px" }}>
          {[
            { label: "Sin tomar",    val: stats.sin_tomar,    icon: "bi-inbox",        mod: "kpi-icon--slate" },
            { label: "En proceso",   val: (stats.contactado || 0) + (stats.calificado || 0) + (stats.demo || 0), icon: "bi-hourglass-split", mod: "kpi-icon--teal" },
            { label: "Propuestas",   val: stats.propuesta,    icon: "bi-file-earmark", mod: "kpi-icon--champ" },
            { label: "Ganados/mes",  val: stats.ganados_mes,  icon: "bi-check-circle", mod: "kpi-icon--green" },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className={`kpi-icon ${k.mod}`}><i className={`bi ${k.icon}`} /></div>
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-val">{k.val ?? 0}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="table-toolbar">
        {[
          { id: "sin_tomar", label: "Sin tomar" },
          { id: "mis_leads", label: "Mis leads"  },
          ...(esAdmin ? [{ id: "todos", label: "Todos" }] : []),
        ].map(t => (
          <button
            key={t.id}
            className={`ui-btn ui-btn--sm${tab === t.id ? " ui-btn--primary" : " ui-btn--secondary"}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <div className="table-toolbar__right">
          <button className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg" style={{ marginRight: 4 }} />Nuevo lead
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="ui-card" style={{ marginTop: 0 }}>
        {loading ? (
          <div className="ui-empty">
            <div className="ui-empty__icon"><i className="bi bi-arrow-repeat" /></div>
            <div className="ui-empty__text">Cargando…</div>
          </div>
        ) : !leads.length ? (
          <div className="ui-empty">
            <div className="ui-empty__icon"><i className="bi bi-person-plus" /></div>
            <div className="ui-empty__text">Sin leads en esta vista</div>
            <div className="ui-empty__sub">Cambiá el filtro o agregá un nuevo lead</div>
          </div>
        ) : (
          <table className="ui-table">
            <thead>
              <tr>
                <th>Nombre / Empresa</th>
                <th>Contacto</th>
                <th>Fuente</th>
                <th>Estado</th>
                <th>Vendedor</th>
                <th>Valor est.</th>
                <th>Sin contacto</th>
                <th className="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{l.nombre}</div>
                    {l.empresa && <div style={{ fontSize: 11, color: "var(--sub)" }}>{l.empresa}</div>}
                  </td>
                  <td>
                    {l.email    && <div>{l.email}</div>}
                    {l.telefono && <div style={{ color: "var(--sub)" }}>{l.telefono}</div>}
                  </td>
                  <td>
                    <span className="ui-badge ui-badge--gray">
                      {FUENTE_META[l.fuente] || l.fuente || "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`ui-badge ${ESTADO_META[l.estado]?.cls || "ui-badge--gray"}`}>
                      {ESTADO_META[l.estado]?.label || l.estado}
                    </span>
                  </td>
                  <td style={{ color: "var(--sub)" }}>
                    {l.vendedor_nombre || <span style={{ color: "var(--muted)" }}>—</span>}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{fmt(l.valor_estimado)}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: l.dias_sin_contacto > 7 ? "var(--alert)" : "var(--sub)" }}>
                    {l.dias_sin_contacto != null ? `${l.dias_sin_contacto}d` : "—"}
                  </td>
                  <td className="col-actions">
                    {tab === "sin_tomar" && (
                      <button className="ui-btn ui-btn--accent ui-btn--sm" onClick={() => tomarLead(l.id)}>
                        Tomar
                      </button>
                    )}
                    <i className="bi bi-eye" title="Ver detalle" onClick={() => setSelected(l)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle lead */}
      {selected && (
        <div className="pmodal-backdrop" onClick={() => setSelected(null)}>
          <div className="pmodal pmodal--lg" onClick={e => e.stopPropagation()}>
            <div className="pmodal__header">
              <div className="pmodal__title">{selected.nombre}</div>
              <button className="pmodal__close" onClick={() => setSelected(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="pmodal__body">
              <div className="detail-row">
                <div className="detail-key"><i className="bi bi-building" /> Empresa</div>
                <div className="detail-val">{selected.empresa || "—"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-key"><i className="bi bi-envelope" /> Email</div>
                <div className="detail-val">{selected.email || "—"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-key"><i className="bi bi-telephone" /> Teléfono</div>
                <div className="detail-val">{selected.telefono || "—"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-key"><i className="bi bi-whatsapp" /> WhatsApp</div>
                <div className="detail-val">{selected.whatsapp || "—"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-key"><i className="bi bi-funnel" /> Fuente</div>
                <div className="detail-val">{FUENTE_META[selected.fuente] || selected.fuente || "—"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-key"><i className="bi bi-cash" /> Valor est.</div>
                <div className="detail-val">{fmt(selected.valor_estimado)}</div>
              </div>
              <div className="detail-row">
                <div className="detail-key"><i className="bi bi-person" /> Vendedor</div>
                <div className="detail-val">{selected.vendedor_nombre || "Sin asignar"}</div>
              </div>
              {selected.notas_ia && (
                <div className="detail-row">
                  <div className="detail-key"><i className="bi bi-robot" /> Notas IA</div>
                  <div className="detail-val">{selected.notas_ia}</div>
                </div>
              )}
              {/* Cambio de estado */}
              <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 8 }}>Cambiar estado</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(ESTADO_META).map(([k, v]) => (
                    <button
                      key={k}
                      className={`ui-btn ui-btn--sm${selected.estado === k ? " ui-btn--primary" : " ui-btn--secondary"}`}
                      onClick={() => cambiarEstado(selected.id, k)}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo lead */}
      {showForm && (
        <div className="pmodal-backdrop" onClick={() => setShowForm(false)}>
          <div className="pmodal" onClick={e => e.stopPropagation()}>
            <div className="pmodal__header">
              <div className="pmodal__title">Nuevo lead</div>
              <button className="pmodal__close" onClick={() => setShowForm(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <form onSubmit={guardarLead}>
              <div className="pmodal__body">
                <div className="ui-field">
                  <label className="ui-label">Nombre *</label>
                  <input
                    className="ui-input"
                    value={form.nombre}
                    onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                    required
                  />
                </div>
                <div className="ui-field">
                  <label className="ui-label">Empresa</label>
                  <input
                    className="ui-input"
                    value={form.empresa}
                    onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))}
                  />
                </div>
                <div className="ui-field">
                  <label className="ui-label">Email</label>
                  <input
                    className="ui-input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="ui-field">
                  <label className="ui-label">Teléfono</label>
                  <input
                    className="ui-input"
                    value={form.telefono}
                    onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                  />
                </div>
                <div className="ui-field">
                  <label className="ui-label">WhatsApp</label>
                  <input
                    className="ui-input"
                    value={form.whatsapp}
                    onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))}
                  />
                </div>
                <div className="ui-field">
                  <label className="ui-label">Fuente</label>
                  <select
                    className="ui-select"
                    value={form.fuente}
                    onChange={e => setForm(p => ({ ...p, fuente: e.target.value }))}
                  >
                    {Object.entries(FUENTE_META).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="ui-field">
                  <label className="ui-label">Valor estimado ($)</label>
                  <input
                    className="ui-input"
                    type="number"
                    value={form.valor_estimado}
                    onChange={e => setForm(p => ({ ...p, valor_estimado: e.target.value }))}
                  />
                </div>
                <div className="ui-field">
                  <label className="ui-label">Notas</label>
                  <input
                    className="ui-input"
                    value={form.notas_ia}
                    onChange={e => setForm(p => ({ ...p, notas_ia: e.target.value }))}
                  />
                </div>
              </div>
              <div className="pmodal__footer">
                <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="ui-btn ui-btn--primary" disabled={saving}>
                  {saving ? "Guardando…" : "Crear lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
