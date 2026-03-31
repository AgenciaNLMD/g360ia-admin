"use client";

import { useState, useEffect, useCallback } from "react";

export default function TabGoogle({ tenant_id }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [toast,   setToast]   = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/mcp/estado?tenant_id=${tenant_id ?? "null"}`);
      const d = await r.json();
      if (d.ok) setData(d.estado.google);
    } finally {
      setLoading(false);
    }
  }, [tenant_id]);

  useEffect(() => {
    cargar();
    // Detectar retorno de OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get("int") === "ok" && params.get("tipo") === "google")  setToast("¡Google conectado correctamente!");
    if (params.get("int") === "error" && params.get("tipo") === "google") setToast("Error al conectar Google. Intentá de nuevo.");
  }, [cargar]);

  async function conectar() {
    setWorking(true);
    try {
      const r = await fetch(`/api/mcp/google/auth?tenant_id=${tenant_id ?? "null"}`);
      const d = await r.json();
      if (d.ok) window.location.href = d.url;
    } finally {
      setWorking(false);
    }
  }

  async function desconectar() {
    if (!confirm("¿Desconectar Google?")) return;
    await fetch("/api/mcp/google/disconnect", {
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

      {toast && (
        <div
          className={`ui-badge ${toast.includes("Error") ? "ui-badge--red" : "ui-badge--green"}`}
          style={{ padding: "10px 14px", fontSize: 12 }}
        >
          {toast}
        </div>
      )}

      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title">
            <i className="bi bi-google" /> Google
          </span>
          <span className={`ui-badge ui-badge--${conectado ? "green" : "gray"}`}>
            {data?.estado || "desconectado"}
          </span>
        </div>
        <div className="ui-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {conectado ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div className="mod-sub" style={{ fontSize: 11 }}>Cuenta conectada</div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>{data.email_cuenta}</div>
              </div>
              <div className="mod-sub">
                Acceso habilitado a Gmail (lectura) y Google Calendar.
              </div>
              <button
                className="ui-btn ui-btn--danger ui-btn--sm"
                onClick={desconectar}
                style={{ alignSelf: "flex-start" }}
              >
                <i className="bi bi-plug" /> Desconectar
              </button>
            </>
          ) : (
            <>
              <div className="mod-sub">
                Al conectar se habilitará acceso a <strong>Gmail</strong> (lectura de emails)
                y <strong>Google Calendar</strong> (crear y leer eventos).
              </div>
              <button
                className="ui-btn ui-btn--primary"
                onClick={conectar}
                disabled={working}
                style={{ alignSelf: "flex-start" }}
              >
                <i className="bi bi-google" />
                {working ? "Redirigiendo..." : "Conectar con Google"}
              </button>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
