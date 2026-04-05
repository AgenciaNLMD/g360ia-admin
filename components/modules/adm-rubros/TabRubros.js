"use client";

import { useState, useEffect } from "react";

const EMPTY_FORM = { nombre: "", descripcion: "" };

export default function TabRubros() {
  const [rubros,   setRubros]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editando, setEditando] = useState(null); // null = nuevo, objeto = editar
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [confirm,  setConfirm]  = useState(null); // id a borrar

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const r = await fetch("/api/adm-rubros/rubros");
      const d = await r.json();
      if (d.ok) setRubros(d.rubros);
    } catch (e) {
      console.error("[TabRubros]", e);
    } finally {
      setLoading(false);
    }
  }

  function abrirNuevo() {
    setEditando(null);
    setForm(EMPTY_FORM);
    setError("");
    setModal(true);
  }

  function abrirEditar(rubro) {
    setEditando(rubro);
    setForm({ nombre: rubro.nombre, descripcion: rubro.descripcion ?? "" });
    setError("");
    setModal(true);
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
    setSaving(true);
    setError("");
    try {
      const body = editando
        ? { id: editando.id, ...form }
        : form;
      const r = await fetch("/api/adm-rubros/rubros", {
        method:  editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const d = await r.json();
      if (d.ok) { setModal(false); cargar(); }
      else setError(d.error ?? "Error al guardar.");
    } catch { setError("Error de conexión."); }
    finally { setSaving(false); }
  }

  async function borrar(id) {
    try {
      await fetch(`/api/adm-rubros/rubros?id=${id}`, { method: "DELETE" });
      setConfirm(null);
      cargar();
    } catch (e) { console.error(e); }
  }

  if (loading) return (
    <div className="ui-empty">
      <i className="bi bi-arrow-repeat ui-empty__icon" />
      <div className="ui-empty__text">Cargando rubros...</div>
    </div>
  );

  return (
    <>
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title">Rubros registrados</span>
          <button className="ui-btn ui-btn--primary ui-btn--sm" onClick={abrirNuevo}>
            <i className="bi bi-plus-lg" /> Nuevo rubro
          </button>
        </div>
        <div className="ui-card__body">
          {rubros.length === 0 ? (
            <div className="ui-empty">
              <i className="bi bi-building ui-empty__icon" />
              <div className="ui-empty__text">Sin rubros</div>
              <div className="ui-empty__sub">Creá el primer rubro para comenzar.</div>
            </div>
          ) : (
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rubros.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.nombre}</strong></td>
                    <td>{r.descripcion ?? "—"}</td>
                    <td>
                      <span className={`ui-badge ui-badge--${r.activo ? "green" : "gray"}`}>
                        {r.activo ? "activo" : "inactivo"}
                      </span>
                    </td>
                    <td>
                      <button className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => abrirEditar(r)}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="ui-btn ui-btn--danger ui-btn--sm" onClick={() => setConfirm(r.id)} style={{marginLeft:4}}>
                        <i className="bi bi-trash3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="pmodal-backdrop" onClick={() => setModal(false)}>
          <div className="pmodal pmodal--sm" onClick={e => e.stopPropagation()}>
            <div className="pmodal__header">
              <span className="pmodal__title">{editando ? "Editar rubro" : "Nuevo rubro"}</span>
              <button className="pmodal__close" onClick={() => setModal(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="pmodal__body">
              <div className="ui-field">
                <label className="ui-label">Nombre</label>
                <input
                  className="ui-input"
                  placeholder="ej: Servicio Técnico"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                />
              </div>
              <div className="ui-field">
                <label className="ui-label">Descripción</label>
                <input
                  className="ui-input"
                  placeholder="ej: Talleres de reparación..."
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                />
              </div>
              {error && <p className="ui-badge ui-badge--red">{error}</p>}
            </div>
            <div className="pmodal__footer">
              <button className="ui-btn ui-btn--secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="ui-btn ui-btn--primary" onClick={guardar} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar borrado */}
      {confirm && (
        <div className="pmodal-backdrop" onClick={() => setConfirm(null)}>
          <div className="pmodal pmodal--sm" onClick={e => e.stopPropagation()}>
            <div className="pmodal__header">
              <span className="pmodal__title">Confirmar eliminación</span>
              <button className="pmodal__close" onClick={() => setConfirm(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="pmodal__body">
              <p>¿Estás seguro que querés eliminar este rubro? Esta acción no se puede deshacer.</p>
            </div>
            <div className="pmodal__footer">
              <button className="ui-btn ui-btn--secondary" onClick={() => setConfirm(null)}>Cancelar</button>
              <button className="ui-btn ui-btn--danger" onClick={() => borrar(confirm)}>
                <i className="bi bi-trash3" /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
