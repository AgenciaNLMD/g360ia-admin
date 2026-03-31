"use client";

import { useState, useEffect } from "react";

const INTEGRACIONES = [
  {
    id:    "whatsapp",
    label: "WhatsApp",
    icon:  "bi-whatsapp",
    desc:  "Instancias vía Evolution API para enviar y recibir mensajes.",
  },
  {
    id:    "mercadopago",
    label: "MercadoPago",
    icon:  "bi-credit-card-2-front",
    desc:  "Checkout Pro · Recibí pagos con tu propia cuenta de MercadoPago.",
  },
  {
    id:    "google",
    label: "Google",
    icon:  "bi-google",
    desc:  "Conectá Gmail y Google Calendar para automatizar comunicaciones.",
  },
  {
    id:    "meta",
    label: "Meta",
    icon:  "bi-meta",
    desc:  "Conectá páginas de Facebook e Instagram para gestionar mensajes.",
  },
];

export default function TabHub({ tenant_id, onTabChange }) {
  const [estado,  setEstado]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/mcp/estado?tenant_id=${tenant_id ?? "null"}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setEstado(d.estado); })
      .finally(() => setLoading(false));
  }, [tenant_id]);

  if (loading) return (
    <div className="ui-empty">
      <i className="bi bi-arrow-repeat ui-empty__icon" />
      <div className="ui-empty__text">Cargando conexiones...</div>
    </div>
  );

  function getBadge(id) {
    if (!estado) return "desconectado";
    if (id === "whatsapp")    return estado.whatsapp.conectados    > 0 ? "conectado" : "desconectado";
    if (id === "google")      return estado.google.estado;
    if (id === "mercadopago") return estado.mercadopago.estado;
    if (id === "meta")        return estado.meta.estado;
    return "desconectado";
  }

  function getSubInfo(id) {
    if (!estado) return null;
    if (id === "whatsapp" && estado.whatsapp.total > 0)
      return `${estado.whatsapp.conectados}/${estado.whatsapp.total} instancia${estado.whatsapp.total !== 1 ? "s" : ""} activa${estado.whatsapp.total !== 1 ? "s" : ""}`;
    if (id === "google"      && estado.google.email_cuenta)       return estado.google.email_cuenta;
    if (id === "mercadopago" && estado.mercadopago.email_cuenta)  return `${estado.mercadopago.email_cuenta} · ${estado.mercadopago.modo}`;
    if (id === "meta"        && estado.meta.page_name)            return estado.meta.page_name;
    return null;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
      {INTEGRACIONES.map(int => {
        const badge     = getBadge(int.id);
        const sub       = getSubInfo(int.id);
        const conectado = badge === "conectado";

        return (
          <div key={int.id} className="ui-card">
            <div className="ui-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <i className={`bi ${int.icon}`} style={{ fontSize: 22, color: "var(--pr)" }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{int.label}</span>
                </div>
                <span className={`ui-badge ui-badge--${conectado ? "green" : "gray"}`}>
                  {badge}
                </span>
              </div>

              <div className="mod-sub">{int.desc}</div>

              {sub && (
                <div className="mod-sub" style={{ fontSize: 11 }}>{sub}</div>
              )}

              <button
                className="ui-btn ui-btn--secondary ui-btn--sm"
                onClick={() => onTabChange(int.id)}
              >
                <i className={`bi ${conectado ? "bi-gear" : "bi-plug"}`} />
                {conectado ? "Gestionar" : "Conectar"}
              </button>

            </div>
          </div>
        );
      })}
    </div>
  );
}
