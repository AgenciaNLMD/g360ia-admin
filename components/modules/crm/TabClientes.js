"use client";

import { useState, useEffect, useCallback } from "react";

export default function TabClientes({ tenant_id, usuario_id, rol }) {
  const [contactos, setContactos] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [buscar,    setBuscar]     = useState("");
  const [selected,  setSelected]  = useState(null);
  const esAdmin = ["superadmin", "admin"].includes(rol);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (buscar) params.set("q", buscar);
      const res  = await fetch(`/api/crm/contactos?${params}`);
      const data = await res.json();
      if (data.ok) setContactos(data.contactos);
    } finally {
      setLoading(false);
    }
  }, [buscar]);

  useEffect(() => {
    const t = setTimeout(() => { cargar(); }, buscar ? 350 : 0);
    return () => clearTimeout(t);
  }, [cargar, buscar]);

  async function desactivar(id) {
    await fetch("/api/crm/contactos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activo: false }),
    });
    setContactos(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function etiquetas(raw) {
    try {
      const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!Array.isArray(arr) || !arr.length) return null;
      return arr;
    } catch {
      return null;
    }
  }

  function iniciales(c) {
    const n = `${c.nombre || ""} ${c.apellido || ""}`.trim();
    return n.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase() || "?";
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="table-toolbar">
        <input
          className="ui-input"
          style={{ maxWidth: 240 }}
          placeholder="Buscar nombre, empresa, email…"
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
        />
        <div className="table-toolbar__right">
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            {contactos.length} contactos
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
        ) : !contactos.length ? (
          <div className="ui-empty">
            <div className="ui-empty__icon"><i className="bi bi-people" /></div>
            <div className="ui-empty__text">Sin clientes aún</div>
            <div className="ui-empty__sub">Los contactos se crean automáticamente al ganar un lead</div>
          </div>
        ) : (
          <table className="ui-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Fuente</th>
                <th>Etiquetas</th>
                {esAdmin && <th>Score IA</th>}
                <th className="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contactos.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "var(--pr-bg)", color: "var(--pr)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>
                        {iniciales(c)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.nombre} {c.apellido || ""}</div>
                        {c.cargo && <div style={{ fontSize: 11, color: "var(--sub)" }}>{c.cargo}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{c.empresa || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td>
                    {c.email    && <div>{c.email}</div>}
                    {c.telefono && <div style={{ color: "var(--sub)" }}>{c.telefono}</div>}
                    {c.whatsapp && !c.telefono && (
                      <div style={{ color: "var(--sub)" }}>
                        <i className="bi bi-whatsapp" style={{ marginRight: 3 }} />{c.whatsapp}
                      </div>
                    )}
                  </td>
                  <td>
                    {c.fuente
                      ? <span className="ui-badge ui-badge--gray">{c.fuente}</span>
                      : <span style={{ color: "var(--muted)" }}>—</span>}
                  </td>
                  <td>
                    {etiquetas(c.etiquetas)?.map((et, i) => (
                      <span key={i} className="ui-badge ui-badge--blue" style={{ marginRight: 3 }}>{et}</span>
                    )) || <span style={{ color: "var(--muted)" }}>—</span>}
                  </td>
                  {esAdmin && (
                    <td style={{ fontFamily: "var(--font-mono)", color: "var(--sub)" }}>
                      {c.score_ia ?? "—"}
                    </td>
                  )}
                  <td className="col-actions">
                    <i className="bi bi-eye" title="Ver detalle" onClick={() => setSelected(c)} />
                    {esAdmin && (
                      <i
                        className="bi bi-person-dash"
                        title="Desactivar"
                        style={{ marginLeft: 4, color: "var(--alert)" }}
                        onClick={() => desactivar(c.id)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle contacto */}
      {selected && (
        <div className="pmodal-backdrop" onClick={() => setSelected(null)}>
          <div className="pmodal pmodal--lg" onClick={e => e.stopPropagation()}>
            <div className="pmodal__header">
              <div className="pmodal__title">
                {selected.nombre} {selected.apellido || ""}
              </div>
              <button className="pmodal__close" onClick={() => setSelected(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="pmodal__body">
              <div className="detail-row">
                <div className="detail-key"><i className="bi bi-briefcase" /> Cargo</div>
                <div className="detail-val">{selected.cargo || "—"}</div>
              </div>
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
                <div className="detail-val">{selected.fuente || "—"}</div>
              </div>
              {selected.notas && (
                <div className="detail-row">
                  <div className="detail-key"><i className="bi bi-chat-text" /> Notas</div>
                  <div className="detail-val">{selected.notas}</div>
                </div>
              )}
              {etiquetas(selected.etiquetas) && (
                <div className="detail-row">
                  <div className="detail-key"><i className="bi bi-tags" /> Etiquetas</div>
                  <div className="detail-val">
                    {etiquetas(selected.etiquetas).map((et, i) => (
                      <span key={i} className="ui-badge ui-badge--blue" style={{ marginRight: 4 }}>{et}</span>
                    ))}
                  </div>
                </div>
              )}
              {esAdmin && selected.score_ia != null && (
                <div className="detail-row">
                  <div className="detail-key"><i className="bi bi-robot" /> Score IA</div>
                  <div className="detail-val">{selected.score_ia}</div>
                </div>
              )}
              <div className="detail-row">
                <div className="detail-key"><i className="bi bi-calendar" /> Creado</div>
                <div className="detail-val">
                  {selected.creado_en
                    ? new Date(selected.creado_en).toLocaleDateString("es-AR")
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
