"use client";

import { useState } from "react";
import TabRubros      from "./TabRubros";
import TabRubrosMolde from "./TabRubrosMolde";

const TABS = [
  { id: "rubros",       label: "Rubros",       icon: "bi-building"  },
  { id: "asignaciones", label: "Asignaciones", icon: "bi-grid-3x3"  },
];

export default function AdmRubrosModule() {
  const [tab, setTab] = useState("rubros");

  return (
    <div className="mod-tabs-layout">

      <div className="mod-page-header">
        <div>
          <div className="mod-title">Administración de Rubros</div>
          <div className="mod-sub">Rubros · Asignaciones</div>
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
        {tab === "asignaciones" && <TabRubrosMolde />}
      </div>

    </div>
  );
}
