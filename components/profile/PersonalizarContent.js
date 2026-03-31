"use client";
// components/profile/PersonalizarContent.js
// Contenido del popup "Personalizar" — selector de paleta de colores del sidebar

import { useState } from "react";
import { THEMES, THEME_STORAGE_KEY, applyTheme } from "@/lib/panel-themes";

export default function PersonalizarContent() {
  const [selected, setSelected] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem(THEME_STORAGE_KEY)) || "slate"
  );

  function handleSelect(key) {
    setSelected(key);
    applyTheme(key);
    localStorage.setItem(THEME_STORAGE_KEY, key);
  }

  return (
    <div className="prof-content">
      <div className="prof-section-title">Color del sidebar</div>
      <div className="prof-themes-grid">
        {Object.entries(THEMES).map(([key, t]) => {
          const gradient =
            t.preview.length === 1
              ? t.preview[0]
              : `linear-gradient(135deg, ${t.preview.join(", ")})`;
          const active = selected === key;
          return (
            <div
              key={key}
              className={`prof-theme-card${active ? " prof-theme-card--active" : ""}`}
              onClick={() => handleSelect(key)}
            >
              <div className="prof-theme-swatch" style={{ background: gradient }}>
                {active && (
                  <div className="prof-theme-check">
                    <i className="bi bi-check" />
                  </div>
                )}
              </div>
              <div className="prof-theme-label">{t.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
