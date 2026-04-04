"use client";

import { useState } from "react";
import TabRubros      from "./TabRubros";
import TabModulos     from "./TabModulos";
import TabRubrosMolde from "./TabRubrosMolde";

const TABS = [
  { id: "rubros",       label: "Rubros",       icon: "bi-building"   },
  { id: "modulos",      label: "Módulos",      icon: "bi-box-seam"   },
  { id: "asignaciones", label: "Asignaciones", icon: "bi-diagram-3"  },
];

export default function AdmRubrosModule() {
  const [tab, setTab] = useState("rubros");

  return (
    <div className="mod-tabs-layout">

      <div className="mod-page-header">
        <div>
          <div className="mod-title">Administración de Rubros</div>
          <div className="mod-sub">Rubros · Módulos · Asignaciones</div>
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
        {tab === "rubros"       && <TabRubros />}
        {tab === "modulos"      && <TabModulos />}
        {tab === "asignaciones" && <TabRubrosMolde />}
      </div>

    </div>
  );
}
