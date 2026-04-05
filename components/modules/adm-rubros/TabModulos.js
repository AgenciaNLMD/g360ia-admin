"use client";

import { useState, useEffect } from "react";

const ICONOS = {
  crm:          "bi-people",
  mcp:          "bi-grid-1x2",
  "adm-rubros": "bi-building",
};

const GRUPOS = {
  crm:          { label: "CRM",            color: "blue"   },
  mcp:          { label: "Conexiones",     color: "purple" },
  "adm-rubros": { label: "Administración", color: "green"  },
};

const HERRAMIENTAS_DEFAULT = {
  crm:          ["Contactos", "Pipeline", "Seguimiento", "Reportes"],
  mcp:          ["Integraciones", "Webhooks", "API", "Configuración"],
  "adm-rubros": ["Rubros", "Módulos", "Asignaciones"],
};

export default function TabModulos() {
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/adm-rubros/modulos")
      .then(r => r.json())
      .then(d => { if (d.ok) setModulos(d.modulos); })
      .catch(e => console.error("[TabModulos]", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="ui-empty">
      <i className="bi bi-arrow-repeat ui-empty__icon" />
      <div className="ui-empty__text">Cargando módulos...</div>
    </div>
  );

  if (modulos.length === 0) return (
    <div className="ui-empty">
      <i className="bi bi-box-seam ui-empty__icon" />
      <div className="ui-empty__text">Sin módulos registrados</div>
      <div className="ui-empty__sub">Los módulos se registran en db_rubros_molde.modulos.</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
      {modulos.map(m => {
        const slug  = m.slug ?? "";
        const nombre = m.nombre ?? slug ?? `Módulo #${m.id}`;
        const icon  = ICONOS[slug] ?? "bi-box-seam";
        const grupo = GRUPOS[slug] ?? { label: m.grupo ?? "Módulos", color: "gray" };

        let herramientas = HERRAMIENTAS_DEFAULT[slug] ?? [];
        if (m.herramientas) {
          try {
            herramientas = typeof m.herramientas === "string"
              ? JSON.parse(m.herramientas)
              : m.herramientas;
          } catch { /* usar default */ }
        }

        return (
          <div key={m.id} className="ui-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="ui-card__body" style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <i className={`bi ${icon}`} style={{ fontSize: 22, color: "var(--pr)" }} />
                <span className={`ui-badge ui-badge--${grupo.color}`}>{grupo.label}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>
                {nombre}
              </div>
              {m.descripcion && (
                <div className="mod-sub" style={{ marginBottom: 10 }}>{m.descripcion}</div>
              )}
              {herramientas.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 16, listStyle: "disc" }}>
                  {herramientas.map((h, i) => (
                    <li key={i} style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.9 }}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
