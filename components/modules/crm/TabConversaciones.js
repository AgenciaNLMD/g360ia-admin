"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const CANAL_ICON = {
  whatsapp:  "bi-whatsapp",
  email:     "bi-envelope",
  instagram: "bi-instagram",
  facebook:  "bi-facebook",
  web:       "bi-globe",
  tiktok:    "bi-tiktok",
};

const ESTADO_BADGE = {
  abierta:  { label: "Abierta",   cls: "ui-badge--green" },
  cerrada:  { label: "Cerrada",   cls: "ui-badge--gray"  },
  pendiente:{ label: "Pendiente", cls: "ui-badge--amber" },
};

export default function TabConversaciones({ tenant_id, usuario_id, rol }) {
  const [convs,    setConvs]    = useState([]);
  const [activa,   setActiva]   = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto,    setTexto]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("abierta");
  const [filtroCanal,  setFiltroCanal]  = useState("todos");
  const bodyRef = useRef(null);

  const cargarConvs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado !== "todas") params.set("estado", filtroEstado);
      if (filtroCanal  !== "todos") params.set("canal",  filtroCanal);
      const res  = await fetch(`/api/crm/conversaciones?${params}`);
      const data = await res.json();
      if (data.ok) setConvs(data.conversaciones);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroCanal]);

  useEffect(() => { cargarConvs(); }, [cargarConvs]);

  const cargarMensajes = useCallback(async (convId) => {
    const res  = await fetch(`/api/crm/mensajes?conversacion_id=${convId}`);
    const data = await res.json();
    if (data.ok) {
      setMensajes(data.mensajes);
      setTimeout(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }, 50);
    }
  }, []);

  function abrirConv(conv) {
    setActiva(conv);
    setMensajes([]);
    cargarMensajes(conv.id);
  }

  async function enviarMensaje(e) {
    e.preventDefault();
    if (!texto.trim() || !activa) return;
    setEnviando(true);
    try {
      const res  = await fetch("/api/crm/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversacion_id: activa.id,
          direccion: "saliente",
          tipo: "texto",
          contenido: texto,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTexto("");
        cargarMensajes(activa.id);
        // Actualizar preview en lista
        setConvs(prev => prev.map(c =>
          c.id === activa.id
            ? { ...c, ultimo_mensaje: texto, ultimo_mensaje_at: new Date().toISOString() }
            : c
        ));
      }
    } finally {
      setEnviando(false);
    }
  }

  async function cerrarConv(id) {
    await fetch("/api/crm/conversaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado: "cerrada" }),
    });
    cargarConvs();
    if (activa?.id === id) setActiva(prev => ({ ...prev, estado: "cerrada" }));
  }

  function nombreConv(c) {
    if (c.lead_nombre)    return c.lead_nombre + (c.lead_empresa ? ` · ${c.lead_empresa}` : "");
    if (c.contacto_nombre) return `${c.contacto_nombre} ${c.contacto_apellido || ""}`.trim();
    return "Conversación";
  }

  function fmtHora(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 520, overflow: "hidden", borderTop: "1px solid var(--border)" }}>
      {/* Lista izquierda */}
      <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
        <div className="conv-list-head">
          <div className="conv-list-head__title">Conversaciones</div>
          <div className="conv-list-head__sub">
            {convs.length} {filtroEstado !== "todas" ? filtroEstado : "total"}
          </div>
        </div>

        {/* Filtros */}
        <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["abierta","pendiente","cerrada","todas"].map(e => (
            <button
              key={e}
              className={`ui-btn ui-btn--sm${filtroEstado === e ? " ui-btn--primary" : " ui-btn--secondary"}`}
              onClick={() => setFiltroEstado(e)}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div className="ui-empty">
              <div className="ui-empty__icon"><i className="bi bi-arrow-repeat" /></div>
            </div>
          ) : !convs.length ? (
            <div className="ui-empty">
              <div className="ui-empty__icon"><i className="bi bi-chat-dots" /></div>
              <div className="ui-empty__sub">Sin conversaciones</div>
            </div>
          ) : convs.map(c => (
            <div
              key={c.id}
              className={`conv-item${activa?.id === c.id ? " conv-item--active" : ""}`}
              onClick={() => abrirConv(c)}
            >
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--pr-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className={`bi ${CANAL_ICON[c.canal] || "bi-chat"}`} style={{ color: "var(--pr)", fontSize: 14 }} />
              </div>
              <div className="conv-item__body">
                <div className="conv-item__top">
                  <div>
                    <span className="conv-item__name">{nombreConv(c)}</span>
                  </div>
                  <span className="conv-item__time">{fmtHora(c.ultimo_mensaje_at)}</span>
                </div>
                <div className="conv-item__preview">{c.ultimo_mensaje || "Sin mensajes"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel mensajes derecho */}
      {!activa ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-soft)" }}>
          <div className="ui-empty">
            <div className="ui-empty__icon"><i className="bi bi-chat-dots" /></div>
            <div className="ui-empty__text">Seleccioná una conversación</div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-soft)" }}>
          {/* Header conversación */}
          <div className="msg-head">
            <div>
              <div className="msg-head__title">{nombreConv(activa)}</div>
              <div className="msg-head__sub">
                <i className={`bi ${CANAL_ICON[activa.canal] || "bi-chat"}`} style={{ marginRight: 4 }} />
                {activa.canal}
                {" · "}
                <span className={`ui-badge ${ESTADO_BADGE[activa.estado]?.cls || "ui-badge--gray"}`} style={{ marginLeft: 4 }}>
                  {ESTADO_BADGE[activa.estado]?.label || activa.estado}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {activa.estado !== "cerrada" && (
                <button className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => cerrarConv(activa.id)}>
                  <i className="bi bi-check2-circle" style={{ marginRight: 4 }} />Cerrar
                </button>
              )}
            </div>
          </div>

          {/* Mensajes */}
          <div className="msg-body" ref={bodyRef}>
            {!mensajes.length ? (
              <div className="ui-empty">
                <div className="ui-empty__sub">Sin mensajes aún</div>
              </div>
            ) : mensajes.map(m => (
              <div key={m.id} className={`msg msg--${m.direccion === "entrante" ? "in" : "out"}`}>
                <div className="msg__bubble">{m.contenido}</div>
                <div className="msg__time">
                  {fmtHora(m.creado_en)}
                  {m.enviado_por_nombre && ` · ${m.enviado_por_nombre}`}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          {activa.estado !== "cerrada" && (
            <form className="msg-input-area" onSubmit={enviarMensaje}>
              <div className="msg-input-row">
                <input
                  className="msg-input-field"
                  placeholder="Escribí un mensaje…"
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  disabled={enviando}
                />
                <button
                  type="submit"
                  className="ui-btn ui-btn--primary ui-btn--sm"
                  disabled={!texto.trim() || enviando}
                >
                  <i className="bi bi-send" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
