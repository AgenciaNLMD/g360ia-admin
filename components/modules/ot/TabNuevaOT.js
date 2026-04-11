"use client";

import { useState, useEffect } from "react";

const PRIORIDADES = [
  { value: "normal",  label: "Normal"  },
  { value: "alta",    label: "Alta"    },
  { value: "urgente", label: "Urgente" },
];

const CANALES = [
  { value: "",            label: "— Sin especificar —" },
  { value: "WhatsApp",    label: "WhatsApp"            },
  { value: "Presencial",  label: "Presencial"          },
  { value: "Email",       label: "Email"               },
  { value: "Teléfono",    label: "Teléfono"            },
];

const FORM_VACIO = {
  numero_ot:          "",
  cliente_nombre:     "",
  equipo_tipo:        "",
  equipo_marca:       "",
  equipo_modelo:      "",
  equipo_serie:       "",
  problema_reportado: "",
  foto_url:           "",
  prioridad:          "normal",
  canal_ingreso:      "",
  entrega_estimada:   "",
  tecnico_nombre:     "",
};

export default function TabNuevaOT({ tenant_id, usuario_id, rol, onCreada }) {
  const [config,    setConfig]    = useState(null);
  const [form,      setForm]      = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [creada,    setCreada]    = useState(null);
  const [error,     setError]     = useState("");

  useEffect(() => {
    fetch("/api/ot/config")
      .then(r => r.json())
      .then(d => { if (d.ok) setConfig(d.config); });
  }, []);

  async function generarNumero() {
    const res  = await fetch("/api/ot/config/siguiente");
    const data = await res.json();
    if (data.ok) setForm(f => ({ ...f, numero_ot: data.numero }));
  }

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setError("");
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.numero_ot.trim())          return setError("El número de OT es obligatorio.");
    if (!form.equipo_tipo.trim())        return setError("El tipo de equipo es obligatorio.");
    if (!form.problema_reportado.trim()) return setError("Describí el problema reportado.");

    setGuardando(true);
    try {
      const res  = await fetch("/api/ot/ordenes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) return setError(data.error || "Error al guardar");
      setCreada(data.orden);
    } catch {
      setError("Error de conexión. Intentá nuevamente.");
    } finally {
      setGuardando(false);
    }
  }

  function nueva() {
    setCreada(null);
    setForm(FORM_VACIO);
    setError("");
  }

  /* ── Vista: OT creada con QR ── */
  if (creada) {
    const base  = typeof window !== "undefined" ? window.location.origin : "";
    const url   = `${base}/ot/${creada.token_publico}`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=220x220`;
    const wsp   = `https://wa.me/?text=${encodeURIComponent(`OT ${creada.numero_ot} — Seguí el estado de tu reparación:\n${url}`)}`;

    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div className="ui-card" style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
          <div className="ui-card__body" style={{ padding: 32 }}>
            <div style={{ color: "var(--em,#22c55e)", fontSize: 44, marginBottom: 8 }}>
              <i className="bi bi-check-circle-fill" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Orden creada</div>
            <div style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 800, color: "var(--pr)", marginBottom: 20 }}>
              {creada.numero_ot}
            </div>
            <img
              src={qrSrc} alt="QR"
              style={{ width: 180, height: 180, display: "block", margin: "0 auto 12px", borderRadius: 10, border: "1px solid var(--border)" }}
            />
            <div style={{ fontSize: 12, color: "var(--sub)", marginBottom: 24 }}>
              Escaneá el QR o enviá el link al cliente
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a href={wsp} target="_blank" rel="noreferrer" className="ui-btn ui-btn--primary">
                <i className="bi bi-whatsapp" style={{ marginRight: 6 }} />Enviar por WhatsApp
              </a>
              <button className="ui-btn ui-btn--secondary" onClick={nueva}>Nueva OT</button>
              <button className="ui-btn ui-btn--secondary" onClick={onCreada}>Ver órdenes</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Vista: Formulario ── */
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div className="ui-card" style={{ maxWidth: 620, width: "100%" }}>
        <div className="ui-card__header">
          <div className="ui-card__title">Nueva Orden de Trabajo</div>
        </div>
        <div className="ui-card__body">
          <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* N° OT */}
            <div className="ui-field">
              <label className="ui-label">Número de OT *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="ui-input" style={{ flex: 1 }}
                  placeholder={config?.prefijo ? `${config.prefijo}0001` : "OT-0001"}
                  value={form.numero_ot}
                  onChange={e => setField("numero_ot", e.target.value)}
                />
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={generarNumero}>
                  <i className="bi bi-magic" style={{ marginRight: 4 }} />Auto
                </button>
              </div>
            </div>

            {/* Cliente + prioridad */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="ui-field">
                <label className="ui-label">Nombre del cliente</label>
                <input className="ui-input" placeholder="Ej: Juan García" value={form.cliente_nombre} onChange={e => setField("cliente_nombre", e.target.value)} />
              </div>
              <div className="ui-field">
                <label className="ui-label">Prioridad</label>
                <select className="ui-select" value={form.prioridad} onChange={e => setField("prioridad", e.target.value)}>
                  {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {/* Tipo de equipo */}
            <div className="ui-field">
              <label className="ui-label">Tipo de equipo *</label>
              <input className="ui-input" placeholder="Ej: Notebook, Celular, Tablet, Impresora…" value={form.equipo_tipo} onChange={e => setField("equipo_tipo", e.target.value)} />
            </div>

            {/* Marca + Modelo */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="ui-field">
                <label className="ui-label">Marca</label>
                <input className="ui-input" placeholder="Ej: Samsung, Apple…" value={form.equipo_marca} onChange={e => setField("equipo_marca", e.target.value)} />
              </div>
              <div className="ui-field">
                <label className="ui-label">Modelo</label>
                <input className="ui-input" placeholder="Ej: Galaxy S21" value={form.equipo_modelo} onChange={e => setField("equipo_modelo", e.target.value)} />
              </div>
            </div>

            {/* Serie */}
            <div className="ui-field">
              <label className="ui-label">N° de serie / IMEI</label>
              <input className="ui-input" placeholder="Opcional — útil para historial" value={form.equipo_serie} onChange={e => setField("equipo_serie", e.target.value)} />
            </div>

            {/* Problema */}
            <div className="ui-field">
              <label className="ui-label">Problema reportado *</label>
              <textarea className="ui-input" rows={3} placeholder="Describí el problema tal como lo reporta el cliente" value={form.problema_reportado} onChange={e => setField("problema_reportado", e.target.value)} style={{ resize: "vertical" }} />
            </div>

            {/* Canal + Técnico */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="ui-field">
                <label className="ui-label">Canal de ingreso</label>
                <select className="ui-select" value={form.canal_ingreso} onChange={e => setField("canal_ingreso", e.target.value)}>
                  {CANALES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="ui-field">
                <label className="ui-label">Técnico asignado</label>
                <input className="ui-input" placeholder="Nombre del técnico" value={form.tecnico_nombre} onChange={e => setField("tecnico_nombre", e.target.value)} />
              </div>
            </div>

            {/* Entrega estimada */}
            <div className="ui-field">
              <label className="ui-label">Entrega estimada</label>
              <input className="ui-input" type="date" value={form.entrega_estimada} onChange={e => setField("entrega_estimada", e.target.value)} style={{ maxWidth: 200 }} />
            </div>

            {/* Foto URL */}
            <div className="ui-field">
              <label className="ui-label">URL de foto del equipo</label>
              <input className="ui-input" placeholder="https://… (estado del equipo al ingreso)" value={form.foto_url} onChange={e => setField("foto_url", e.target.value)} />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="ui-btn ui-btn--primary" disabled={guardando}>
                {guardando
                  ? <><i className="bi bi-arrow-repeat" style={{ marginRight: 6 }} />Guardando…</>
                  : <><i className="bi bi-check-lg" style={{ marginRight: 6 }} />Crear OT</>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
