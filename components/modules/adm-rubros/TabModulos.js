"use client";

import { useState, useEffect } from "react";

const ICONOS = {
  crm:  "bi-people",
  mcp:  "bi-grid-1x2",
  "adm-rubros": "bi-building",
};

export default function TabModulos() {
  const [modulos,  setModulos]  = useState([]);
  const [loading,  setLoading]  = useState(true);

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
    <div className="ui-stats-grid">
      {modulos.map(m => {
        const nombre = m.nombre ?? m.slug ?? `Módulo #${m.id}`;
        const icon   = ICONOS[m.slug] ?? ICONOS[m.nombre?.toLowerCase()] ?? "bi-box-seam";
        const activo = m.activo ?? 1;

        return (
          <div key={m.id} className="ui-card">
            <div className="ui-card__body">
              <div className="ui-card__header" style={{marginBottom: 8}}>
                <i className={`bi ${icon}`} style={{fontSize: 22, color: "var(--pr)"}} />
                <span className={`ui-badge ui-badge--${activo ? "green" : "gray"}`}>
                  {activo ? "activo" : "inactivo"}
                </span>
              </div>
              <div style={{fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 4}}>
                {nombre}
              </div>
              {m.descripcion && (
                <div className="mod-sub">{m.descripcion}</div>
              )}
              {m.slug && (
                <div className="mod-sub" style={{marginTop: 8}}>
                  <code>{m.slug}</code>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
