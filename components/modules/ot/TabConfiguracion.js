"use client";

import { useState, useEffect } from "react";

const COLORES = [
  { value: "#6b7280", label: "Gris"     },
  { value: "#3b82f6", label: "Azul"     },
  { value: "#10b981", label: "Esmeralda"},
  { value: "#22c55e", label: "Verde"    },
  { value: "#f59e0b", label: "Ámbar"   },
  { value: "#f97316", label: "Naranja"  },
  { value: "#ef4444", label: "Rojo"     },
  { value: "#8b5cf6", label: "Violeta"  },
];

export default function TabConfiguracion() {
  const [estados,   setEstados]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [nombre,    setNombre]    = useState("");
  const [color,     setColor]     = useState("#3b82f6");
  const [guardando, setGuardando] = useState(false);
  const [msg,       setMsg]       = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function cargar() {
    setLoading(true);
    try {
      const res  = await fetch("/api/ot/estados-custom");
      const data = await res.json();
      if (data.ok) setEstados(data.estados ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  async function agregar(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true); setMsg("");
    try {
      const res  = await fetch("/api/ot/estados-custom", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nombre: nombre.trim(), color, orden: estados.length }),
      });
      const data = await res.json();
      if (data.ok) {
        setNombre(""); setColor("#3b82f6");
        setMsg("Estado agregado ✓");
        cargar();
      } else {
        setMsg(data.error || "Error al guardar");
      }
    } finally { setGuardando(false); }
  }

  async function eliminar(id) {
    setDeletingId(id);
    try {
      await fetch(`/api/ot/estados-custom/${id}`, { method: "DELETE" });
      setEstados(prev => prev.filter(e => e.id !== id));
    } finally { setDeletingId(null); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 580 }}>

      <div className="ui-card">
        <div className="ui-card__header">
          <div className="ui-card__title">
            <i className="bi bi-diagram-3" style={{ marginRight: 6 }} />
            Estados personalizados del ciclo
          </div>
        </div>
        <div className="ui-card__body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          <p style={{ fontSize: 13, color: "var(--sub)", margin: 0 }}>
            Definí etapas adicionales para el ciclo de reparación. Estos estados aparecerán
            disponibles al gestionar una orden de trabajo.
          </p>

          {/* Lista de estados */}
          {loading ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              <i className="bi bi-arrow-repeat" style={{ marginRight: 6 }} />Cargando…
            </div>
          ) : estados.length === 0 ? (
            <div className="ui-empty" style={{ padding: "20px 0" }}>
              <div className="ui-empty__icon"><i className="bi bi-diagram-3" /></div>
              <div className="ui-empty__text">Sin estados personalizados</div>
              <div className="ui-empty__sub">Agregá el primero desde el formulario de abajo</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {estados.map(est => (
                <div key={est.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "var(--bg-soft)", borderRadius: 10, padding: "10px 14px",
                  border: "1px solid var(--border)",
                }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: est.color, flexShrink: 0,
                    boxShadow: `0 0 0 3px ${est.color}28`,
                  }} />
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
                    {est.nombre}
                  </span>
                  <button
                    className="ui-btn ui-btn--secondary ui-btn--sm"
                    style={{ padding: "3px 10px", fontSize: 12 }}
                    onClick={() => eliminar(est.id)}
                    disabled={deletingId === est.id}
                    title="Eliminar estado"
                  >
                    {deletingId === est.id
                      ? <i className="bi bi-arrow-repeat" />
                      : <i className="bi bi-trash3" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulario agregar */}
          <form onSubmit={agregar} style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>
              Agregar estado
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="ui-field" style={{ flex: 1, minWidth: 180, margin: 0 }}>
                <label className="ui-label">Nombre del estado</label>
                <input
                  className="ui-input"
                  placeholder="Ej: En espera de repuesto"
                  value={nombre}
                  onChange={e => { setNombre(e.target.value); setMsg(""); }}
                  required
                />
              </div>
              <div className="ui-field" style={{ margin: 0 }}>
                <label className="ui-label">Color</label>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {COLORES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => setColor(c.value)}
                      style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: c.value, border: "none", cursor: "pointer",
                        outline: color === c.value ? `3px solid ${c.value}` : "none",
                        outlineOffset: 2,
                        boxShadow: color === c.value ? `0 0 0 2px var(--surface)` : "none",
                        transition: "all .15s",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {msg && (
              <div style={{ fontSize: 13, color: msg.includes("✓") ? "#059669" : "#dc2626" }}>
                {msg}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="ui-btn ui-btn--primary ui-btn--sm"
                disabled={guardando || !nombre.trim()}
              >
                {guardando
                  ? <><i className="bi bi-arrow-repeat" style={{ marginRight: 6 }} />Guardando…</>
                  : <><i className="bi bi-plus-lg" style={{ marginRight: 6 }} />Agregar estado</>}
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}
