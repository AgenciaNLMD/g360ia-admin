"use client";

import { useState }        from "react";
import SlidingTabs         from "@/components/ui/SlidingTabs";
import TabOrdenes          from "./TabOrdenes";
import TabNuevaOT          from "./TabNuevaOT";
import TabGarantias        from "./TabGarantias";
import TabHistorial        from "./TabHistorial";
import TabConfiguracion    from "./TabConfiguracion";

const TABS = [
  { id: "ordenes",        label: "Órdenes",        icon: "bi-clipboard-check" },
  { id: "nueva",          label: "Nueva OT",        icon: "bi-plus-circle"     },
  { id: "garantias",      label: "Garantías",       icon: "bi-shield-check"    },
  { id: "historial",      label: "Historial",       icon: "bi-clock-history"   },
  { id: "configuracion",  label: "Config.",         icon: "bi-gear"            },
];

export default function OTModule({ ctx = {} }) {
  const [tab,        setTab]        = useState("ordenes");
  const [refreshKey, setRefreshKey] = useState(0);

  function irAOrdenes() {
    setRefreshKey(k => k + 1);
    setTab("ordenes");
  }

  return (
    <div className="mod-tabs-layout">
      <div className="mod-page-header">
        <div>
          <div className="mod-title">Órdenes de Trabajo</div>
          <div className="mod-sub">Recepción · Seguimiento · Garantía digital</div>
        </div>
      </div>

      <SlidingTabs tabs={TABS} activeTab={tab} onTabChange={setTab}>
        <TabOrdenes      refreshKey={refreshKey} rol={ctx.rol} />
        <TabNuevaOT      {...ctx} onCreada={irAOrdenes} />
        <TabGarantias    {...ctx} />
        <TabHistorial    {...ctx} />
        <TabConfiguracion {...ctx} />
      </SlidingTabs>
    </div>
  );
}
