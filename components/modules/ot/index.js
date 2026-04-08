"use client";

import { useState }      from "react";
import { useSession }    from "next-auth/react";
import SlidingTabs       from "@/components/ui/SlidingTabs";
import TabOrdenes        from "./TabOrdenes";
import TabNuevaOT        from "./TabNuevaOT";
import TabGarantias      from "./TabGarantias";
import TabHistorial      from "./TabHistorial";

const TABS = [
  { id: "ordenes",   label: "Órdenes",   icon: "bi-clipboard-check" },
  { id: "nueva",     label: "Nueva OT",  icon: "bi-plus-circle"     },
  { id: "garantias", label: "Garantías", icon: "bi-shield-check"    },
  { id: "historial", label: "Historial", icon: "bi-clock-history"   },
];

export default function OTModule() {
  const { data: session } = useSession();
  const [tab, setTab]     = useState("ordenes");

  const ctx = {
    tenant_id:  session?.user?.tenant_id ?? null,
    usuario_id: session?.user?.id        ?? null,
    rol:        session?.user?.rol        ?? null,
  };

  if (!ctx.tenant_id) {
    return (
      <div className="mod-tabs-layout">
        <div className="ui-empty">
          <div className="ui-empty__icon"><i className="bi bi-building-slash" /></div>
          <div className="ui-empty__text">Sin tenant asignado</div>
          <div className="ui-empty__sub">Tu usuario no tiene un tenant asociado. Contactá al administrador.</div>
        </div>
      </div>
    );
  }

  function irAOrdenes() { setTab("ordenes"); }

  return (
    <div className="mod-tabs-layout">
      <div className="mod-page-header">
        <div>
          <div className="mod-title">Órdenes de Trabajo</div>
          <div className="mod-sub">Recepción · Seguimiento · Garantía digital</div>
        </div>
      </div>

      <SlidingTabs tabs={TABS} activeTab={tab} onTabChange={setTab}>
        <TabOrdenes   {...ctx} />
        <TabNuevaOT   {...ctx} onCreada={irAOrdenes} />
        <TabGarantias {...ctx} />
        <TabHistorial {...ctx} />
      </SlidingTabs>
    </div>
  );
}
