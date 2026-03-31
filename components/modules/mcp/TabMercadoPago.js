"use client";

import { useState, useEffect, useCallback } from "react";

const FORM_VACIO = { access_token: "", public_key: "", modo: "sandbox" };

export default function TabMercadoPago({ tenant_id }) {
  const [data,    setData]    = useState(null);   // { estado, email_cuenta, modo }
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(FORM_VACIO);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/mcp/estado?tenant_id=${tenant_id ?? "null"}`);
      const d = await r.json();
      if (d.ok) setData(d.estado.mercadopago);
    } finally {
      setLoading(false);
    }
  }, [tenant_id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function conectar() {
    setError(null);
    if (!form.access_token.trim() || !form.public_key.trim()) {
      setError("Completá Access Token y Public Key.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/mcp/mercadopago/connect", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tenant_id: tenant_id ?? null, ...form }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || "Error al conectar."); return; }
      setForm(FORM_VACIO);
      cargar();
    } finally {
      setSaving(false);
    }
  }

  async function desconectar() {
    if (!confirm("¿Desconectar MercadoPago?")) return;
    await fetch("/api/mcp/mercadopago/disconnect", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ tenant_id: tenant_id ?? null }),
    });
    cargar();
  }

  if (loading) return (
    <div className="ui-empty">
      <i className="bi bi-arrow-repeat ui-empty__icon" />
      <div className="ui-empty__text">Cargando...</div>
    </div>
  );

  const conectado = data?.estado === "conectado";

  return (
    <div style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Info card */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title">
            <i className="bi bi-credit-card-2-front" /> MercadoPago
          </span>
          <span className={`ui-badge ui-badge--${conectado ? "green" : "gray"}`}>
            {data?.estado || "desconectado"}
          </span>
        </div>
        <div className="ui-card__body">

          {conectado ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="mod-sub" style={{ fontSize: 11 }}>Cuenta conectada</div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>{data.email_cuenta}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="mod-sub" style={{ fontSize: 11 }}>Modo:</span>
                <span className={`ui-badge ui-badge--${data.modo === "produccion" ? "green" : "amber"}`}>
                  {data.modo}
                </span>
              </div>
              <button className="ui-btn ui-btn--danger ui-btn--sm" onClick={desconectar} style={{ alignSelf: "flex-start" }}>
                <i className="bi bi-plug" /> Desconectar
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div className="ui-field">
                <label className="ui-label">Access Token</label>
                <input
                  className="ui-input"
                  type="password"
                  placeholder="APP_USR-..."
                  value={form.access_token}
                  onChange={e => setForm(f => ({ ...f, access_token: e.target.value }))}
                />
              </div>

              <div className="ui-field">
                <label className="ui-label">Public Key</label>
                <input
                  className="ui-input"
                  placeholder="APP_USR-..."
                  value={form.public_key}
                  onChange={e => setForm(f => ({ ...f, public_key: e.target.value }))}
                />
              </div>

              <div className="ui-field">
                <label className="ui-label">Modo</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className={`ui-btn ui-btn--sm ${form.modo === "sandbox" ? "ui-btn--primary" : "ui-btn--secondary"}`}
                    onClick={() => setForm(f => ({ ...f, modo: "sandbox" }))}
                  >
                    Sandbox
                  </button>
                  <button
                    className={`ui-btn ui-btn--sm ${form.modo === "produccion" ? "ui-btn--primary" : "ui-btn--secondary"}`}
                    onClick={() => setForm(f => ({ ...f, modo: "produccion" }))}
                  >
                    Producción
                  </button>
                </div>
              </div>

              {error && (
                <div className="mod-sub" style={{ color: "var(--alert)" }}>
                  <i className="bi bi-exclamation-circle" /> {error}
                </div>
              )}

              <button
                className="ui-btn ui-btn--primary"
                onClick={conectar}
                disabled={saving}
              >
                <i className="bi bi-plug-fill" />
                {saving ? "Conectando..." : "Conectar MercadoPago"}
              </button>

            </div>
          )}

        </div>
      </div>

      <div className="mod-sub">
        Encontrás el Access Token y Public Key en tu cuenta de MercadoPago →
        Tus integraciones → Credenciales.
      </div>

    </div>
  );
}
