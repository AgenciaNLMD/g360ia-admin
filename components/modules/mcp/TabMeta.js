"use client";

import { useState, useEffect, useCallback } from "react";

export default function TabMeta({ tenant_id }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [toast,   setToast]   = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/mcp/estado?tenant_id=${tenant_id ?? "null"}`);
      const d = await r.json();
      if (d.ok) setData(d.estado.meta);
    } finally {
      setLoading(false);
    }
  }, [tenant_id]);

  useEffect(() => {
    cargar();
    const params = new URLSearchParams(window.location.search);
    if (params.get("int") === "ok"    && params.get("tipo") === "meta") setToast("¡Meta conectado correctamente!");
    if (params.get("int") === "error" && params.get("tipo") === "meta") setToast("Error al conectar Meta. Intentá de nuevo.");
  }, [cargar]);

  async function conectar() {
    setWorking(true);
    try {
      const r = await fetch(`/api/mcp/meta/auth?tenant_id=${tenant_id ?? "null"}`);
      const d = await r.json();
      if (d.ok) window.location.href = d.url;
    } finally {
      setWorking(false);
    }
  }

  async function desconectar() {
    if (!confirm("¿Desconectar Meta?")) return;
    await fetch("/api/mcp/meta/disconnect", {
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
            <i className="bi bi-meta" /> Meta
          </span>
          <span className={`ui-badge ui-badge--${conectado ? "green" : "gray"}`}>
            {data?.estado || "desconectado"}
          </span>
        </div>
        <div className="ui-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {conectado ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div className="mod-sub" style={{ fontSize: 11 }}>Página conectada</div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>{data.page_name || "—"}</div>
              </div>
              <div className="mod-sub">
                Mensajes de Facebook e Instagram gestionados desde la plataforma.
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
                Conectá tu <strong>página de Facebook</strong> e <strong>Instagram Business</strong> para
                recibir y responder mensajes directamente desde la plataforma.
              </div>
              <div className="mod-sub" style={{ fontSize: 11 }}>
                Requiere: página de Facebook con acceso de administrador + cuenta de Instagram Business vinculada.
              </div>
              <button
                className="ui-btn ui-btn--primary"
                onClick={conectar}
                disabled={working}
                style={{ alignSelf: "flex-start" }}
              >
                <i className="bi bi-meta" />
                {working ? "Redirigiendo..." : "Conectar con Meta"}
              </button>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
