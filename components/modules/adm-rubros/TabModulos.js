"use client";

import { useState, useEffect } from "react";

export default function TabModulos() {
  const [modulos,  setModulos]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch("/api/adm-rubros/modulos")
      .then(r => r.json())
      .then(d => { if (d.ok) setModulos(d.modulos); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="ui-empty">
      <i className="bi bi-arrow-repeat ui-empty__icon" />
      <div className="ui-empty__text">Cargando módulos...</div>
    </div>
  );

  return (
    <div className="ui-card">
      <div className="ui-card__header">
        <span className="ui-card__title">Catálogo de módulos</span>
        <span className="ui-badge ui-badge--blue">{modulos.length} módulos</span>
      </div>
      <div className="ui-card__body">
        {modulos.length === 0 ? (
          <div className="ui-empty">
            <i className="bi bi-box-seam ui-empty__icon" />
            <div className="ui-empty__text">Sin módulos registrados</div>
            <div className="ui-empty__sub">Registrá módulos en db_rubros_molde para verlos aquí.</div>
          </div>
        ) : (
          <table className="ui-table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Nombre</th>
                <th>DB Origen</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {modulos.map(m => (
                <tr key={m.id}>
                  <td><code>{m.slug}</code></td>
                  <td>{m.nombre}</td>
                  <td><code>{m.db_origen ?? "—"}</code></td>
                  <td>
                    <span className={`ui-badge ui-badge--${m.activo ? "green" : "gray"}`}>
                      {m.activo ? "activo" : "inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
