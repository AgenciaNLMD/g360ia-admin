"use client";
// components/profile/IdiomaContent.js
// Contenido del popup "Idioma"

import { useState } from "react";

const IDIOMAS = [
  { code: "es", label: "Español",   flag: "🇦🇷" },
  { code: "en", label: "English",   flag: "🇺🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
];

export default function IdiomaContent() {
  const [selected, setSelected] = useState("es");

  return (
    <div className="prof-content">
      <div className="prof-section-title">Seleccioná el idioma del panel</div>
      {IDIOMAS.map((lang) => (
        <div
          key={lang.code}
          className={`prof-lang-row${selected === lang.code ? " prof-lang-row--active" : ""}`}
          onClick={() => setSelected(lang.code)}
        >
          <span className="prof-lang-flag">{lang.flag}</span>
          <span className="prof-lang-label">{lang.label}</span>
          {selected === lang.code && <i className="bi bi-check2 prof-lang-check" />}
        </div>
      ))}
    </div>
  );
}
