"use client";

import { useState, useEffect, useRef } from "react";

const MAX_ESTADOS = 7;

// Slugs del sistema → etiqueta legible
const LABEL_MAP = {
  recibido:       "Recibido",
  en_diagnostico: "En diagnóstico",
  presupuestado:  "Presupuestado",
  aprobado:       "Aprobado",
  en_reparacion:  "En reparación",
  listo:          "Listo para retirar",
  entregado:      "Entregado",
};

// Slugs base del sistema (no se eliminan — son parte del flujo)
const CORE_SLUGS = Object.keys(LABEL_MAP);

function getLabel(nombre) {
  return LABEL_MAP[nombre] ?? nombre;
}

export default function TabConfiguracion() {
  const [estados,    setEstados]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [nombre,     setNombre]     = useState("");
  const [guardando,  setGuardando]  = useState(false);
  const [msg,        setMsg]        = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [dragOver,   setDragOver]   = useState(null);
  const dragIdx = useRef(null);

  async function cargar() {
    setLoading(true);
    try {
      const res  = await fetch("/api/ot/estados-custom");
      const data = await res.json();
      if (data.ok) setEstados(data.estados ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  async function agregar(e) {
    e.preventDefault();
    if (!nombre.trim() || estados.length >= MAX_ESTADOS) return;
    setGuardando(true); setMsg("");
    try {
      const res  = await fetch("/api/ot/estados-custom", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nombre: nombre.trim(), orden: estados.length }),
      });
      const data = await res.json();
      if (data.ok) {
        setNombre("");
        setMsg("Estado agregado ✓");
        cargar();
      } else {
        setMsg(data.error || "Error al guardar");
      }
    } finally { setGuardando(false); }
  }

  async function eliminar(id) {
    setDeletingId(id);
    try {
      await fetch(`/api/ot/estados-custom/${id}`, { method: "DELETE" });
      setEstados(prev => prev.filter(e => e.id !== id));
    } finally { setDeletingId(null); }
  }

  function onDragStart(i) { dragIdx.current = i; }

  function onDragOver(e, i) { e.preventDefault(); setDragOver(i); }

  async function onDrop(i) {
    const from = dragIdx.current;
    if (from === null || from === i) { setDragOver(null); return; }
    const newList = [...estados];
    const [moved] = newList.splice(from, 1);
    newList.splice(i, 0, moved);
    setEstados(newList);
    setDragOver(null);
    dragIdx.current = null;
    await fetch("/api/ot/estados-custom", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ orden: newList.map(e => e.id) }),
    });
  }

  function onDragEnd() { setDragOver(null); dragIdx.current = null; }

  const isCore = (nombre) => CORE_SLUGS.includes(nombre);

  return (
    <div className="ot-config-wrap">
      <div className="ui-card">
        <div className="ui-card__header">
          <div className="ui-card__title">
            <i className="bi bi-diagram-3" style={{ marginRight: 6 }} />
            Estados del ciclo de reparación
          </div>
        </div>
        <div className="ui-card__body">

          <p className="ot-config-desc">
            Arrastrá para cambiar el orden del ciclo. Los estados del sistema no se pueden eliminar.
          </p>

          {loading ? (
            <div className="ui-empty">
              <div className="ui-empty__icon"><i className="bi bi-arrow-repeat" /></div>
              <div className="ui-empty__text">Cargando…</div>
            </div>
          ) : (
            <div className="ot-state-list">
              {estados.map((est, i) => (
                <div
                  key={est.id}
                  className={`ot-state-item${dragOver === i ? " ot-state-item--over" : ""}`}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDrop={() => onDrop(i)}
                  onDragEnd={onDragEnd}
                >
                  <i className="bi bi-grip-vertical ot-state-item__grip" />
                  <span className="ot-state-item__name">{getLabel(est.nombre)}</span>
                  {isCore(est.nombre) ? (
                    <i className="bi bi-lock ot-state-item__lock" title="Estado del sistema" />
                  ) : (
                    <button
                      className="ui-btn ui-btn--secondary ui-btn--sm"
                      onClick={() => eliminar(est.id)}
                      disabled={deletingId === est.id}
                      title="Eliminar"
                    >
                      {deletingId === est.id
                        ? <i className="bi bi-arrow-repeat" />
                        : <i className="bi bi-trash3" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && estados.length < MAX_ESTADOS && (
            <form className="ot-config-form" onSubmit={agregar}>
              <div className="ui-field">
                <label className="ui-label">Agregar estado personalizado</label>
                <input
                  className="ui-input"
                  placeholder="Ej: En espera de repuesto"
                  value={nombre}
                  onChange={e => { setNombre(e.target.value); setMsg(""); }}
                  required
                />
              </div>
              {msg && (
                <span className={msg.includes("✓") ? "ot-config-msg--ok" : "ot-config-msg--err"}>
                  {msg}
                </span>
              )}
              <div>
                <button
                  type="submit"
                  className="ui-btn ui-btn--primary ui-btn--sm"
                  disabled={guardando || !nombre.trim()}
                >
                  {guardando
                    ? <><i className="bi bi-arrow-repeat" style={{ marginRight: 4 }} />Guardando…</>
                    : <><i className="bi bi-plus-lg" style={{ marginRight: 4 }} />Agregar estado</>}
                </button>
              </div>
            </form>
          )}

          {!loading && estados.length >= MAX_ESTADOS && (
            <div className="ot-config-max">
              <i className="bi bi-info-circle" />
              Máximo de {MAX_ESTADOS} estados alcanzado.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
