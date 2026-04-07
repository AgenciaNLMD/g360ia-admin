"use client";

import { useState, useRef, useLayoutEffect } from "react";
import TabRubros  from "./TabRubros";
import TabModulos from "./TabModulos";
import TabPlanes  from "./TabPlanes";

const TABS = [
  { id: "rubros",  label: "Rubros",  icon: "bi-building"  },
  { id: "modulos", label: "Módulos", icon: "bi-box-seam"  },
  { id: "planes",  label: "Planes",  icon: "bi-credit-card" },
];

export default function MatrizModule() {
  const [tab, setTab] = useState("rubros");
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = tabRefs.current[tab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  return (
    <div className="mod-tabs-layout">

      <div className="mod-page-header">
        <div>
          <div className="mod-title">Matriz</div>
          <div className="mod-sub">Rubros · Módulos · Planes</div>
        </div>
      </div>

      <div className="ui-tabs ui-tabs--sliding">
        {TABS.map(t => (
          <div
            key={t.id}
            ref={el => tabRefs.current[t.id] = el}
            className={`ui-tab${tab === t.id ? " ui-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`bi ${t.icon}`} /> {t.label}
          </div>
        ))}
        <span
          className="ui-tab-indicator"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>

      <div className="mod-tab-body">
        {tab === "rubros"  && <TabRubros />}
        {tab === "modulos" && <TabModulos />}
        {tab === "planes"  && <TabPlanes />}
      </div>

    </div>
  );
}
