"use client";
import { useState } from "react";
import "../../styles/panel-system.css";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="panel-wrap">
      <aside className={`sb${collapsed ? " sb--collapsed" : ""}`}>
        <div
          className="sb-logo sb-logo--clickable"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <div className="sb-logo__icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="18" height="14">
              <rect x="0"  y="10" width="6" height="6" rx="1.5" fill="white" opacity=".35"/>
              <rect x="0"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
              <rect x="0"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
              <rect x="8"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
              <rect x="8"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
              <rect x="16" y="0"  width="6" height="6" rx="1.5" fill="#B08A55"/>
            </svg>
          </div>
          <div className="sb-logo__text">
            <div className="sb-logo__title">Gestión 360 <span>iA</span></div>
            <div className="sb-logo__sub">Panel Admin</div>
          </div>
        </div>
        <nav className="sb-nav" />
      </aside>
      <main className="panel-content">
        {children}
      </main>
    </div>
  );
}
