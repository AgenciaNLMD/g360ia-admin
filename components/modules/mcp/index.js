"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import TabHub         from "./TabHub";
import TabWhatsapp    from "./TabWhatsapp";
import TabMercadoPago from "./TabMercadoPago";
import TabGoogle      from "./TabGoogle";
import TabMeta        from "./TabMeta";

const TABS = [
  { id: "hub",         label: "Conexiones",  icon: "bi-grid-1x2"          },
  { id: "whatsapp",    label: "WhatsApp",     icon: "bi-whatsapp"           },
  { id: "mercadopago", label: "MercadoPago",  icon: "bi-credit-card-2-front"},
  { id: "google",      label: "Google",       icon: "bi-google"             },
  { id: "meta",        label: "Meta",         icon: "bi-meta"               },
];

export default function MCPModule() {
  const { data: session } = useSession();
  const [tab, setTab] = useState("hub");

  const ctx = {
    tenant_id:  session?.user?.tenant_id ?? null,
    usuario_id: session?.user?.id        ?? null,
    rol:        session?.user?.rol       ?? null,
  };

  return (
    <div className="mod-tabs-layout">

      <div className="mod-page-header">
        <div>
          <div className="mod-title">MCP</div>
          <div className="mod-sub">Multi-Channel Platform · Conexiones externas</div>
        </div>
      </div>

      <div className="ui-tabs">
        {TABS.map(t => (
          <div
            key={t.id}
            className={`ui-tab${tab === t.id ? " ui-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`bi ${t.icon}`} /> {t.label}
          </div>
        ))}
      </div>

      <div className="mod-tab-body">
        {tab === "hub"         && <TabHub         {...ctx} onTabChange={setTab} />}
        {tab === "whatsapp"    && <TabWhatsapp    {...ctx} />}
        {tab === "mercadopago" && <TabMercadoPago {...ctx} />}
        {tab === "google"      && <TabGoogle      {...ctx} />}
        {tab === "meta"        && <TabMeta        {...ctx} />}
      </div>

    </div>
  );
}
