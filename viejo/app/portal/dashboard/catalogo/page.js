"use client";
// app/portal/dashboard/catalogo/page.js

import { useState, useEffect } from "react";
import PortalShell from "@/components/PortalShell";

export default function CatalogoPage() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo]     = useState("");
  const [buscar, setBuscar] = useState("");
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => { cargar(); }, [tipo]);

  async function cargar() {
    setLoading(true);
    const params = new URLSearchParams({ activo: "1" });
    if (tipo) params.set("tipo", tipo);
    const res = await fetch(`/api/portal/catalogo?${params}`);
    const d   = await res.json();
    if (d.ok) setItems(d.items);
    setLoading(false);
  }

  function abrirNuevo() {
    setForm({ tipo:"producto", nombre:"", descripcion:"", sku:"", precio_costo:0, precio_venta:0, unidad:"unidad", categoria:"" });
    setError("");
    setModal("nuevo");
  }

  function abrirEditar(item) {
    setForm({ ...item });
    setError("");
    setModal(item);
  }

  async function guardar() {
    if (!form.nombre) { setError("El nombre es obligatorio"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/portal/catalogo", {
      method: modal === "nuevo" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modal === "nuevo" ? form : { id: modal.id, ...form }),
    });
    const d = await res.json();
    setSaving(false);
    if (d.ok) { setModal(null); cargar(); }
    else setError(d.error || "Error");
  }

  const filtrados = items.filter(i =>
    !buscar ||
    i.nombre?.toLowerCase().includes(buscar.toLowerCase()) ||
    i.sku?.toLowerCase().includes(buscar.toLowerCase())
  );

  const margen = (f) => f.precio_costo > 0
    ? (((f.precio_venta - f.precio_costo) / f.precio_costo) * 100).toFixed(0) + "%"
    : "—";

  return (
    <PortalShell title="Catálogo" subtitle="Productos y servicios">
      <div className="ps-anim">
        <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" }}>
          <input className="ps-input" placeholder="Buscar por nombre o SKU…" style={{ maxWidth:260 }}
            value={buscar} onChange={e => setBuscar(e.target.value)} />
          <select className="ps-input" style={{ maxWidth:160 }} value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="producto">Productos</option>
            <option value="servicio">Servicios</option>
          </select>
          <div style={{ flex:1 }} />
          <button className="ps-btn ps-btn-primary" onClick={abrirNuevo}>
            <i className="bi bi-plus-lg" /> Nuevo ítem
          </button>
        </div>

        <div className="ps-card" style={{ padding:0,overflow:"hidden" }}>
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>SKU</th>
                  <th>Costo</th>
                  <th>Venta</th>
                  <th>Margen</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Cargando…</td></tr>}
                {!loading && filtrados.length === 0 && <tr><td colSpan={8} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Sin ítems en el catálogo</td></tr>}
                {filtrados.map(item => (
                  <tr key={item.id} style={{ cursor:"pointer" }} onClick={() => abrirEditar(item)}>
                    <td>
                      <div style={{ fontWeight:600 }}>{item.nombre}</div>
                      {item.categoria && <div style={{ fontSize:"0.68rem",color:"var(--muted)" }}>{item.categoria}</div>}
                    </td>
                    <td><span className={`ps-badge ${item.tipo === "producto" ? "ps-badge-blue" : "ps-badge-green"}`}>{item.tipo === "producto" ? "Producto" : "Servicio"}</span></td>
                    <td style={{ fontFamily:"monospace",fontSize:"0.75rem" }}>{item.sku || "—"}</td>
                    <td>${Number(item.precio_costo).toFixed(2)}</td>
                    <td style={{ fontWeight:600 }}>${Number(item.precio_venta).toFixed(2)}</td>
                    <td style={{ color:"var(--green)",fontWeight:600 }}>{margen(item)}</td>
                    <td>{item.tipo === "producto" ? (item.stock_actual ?? "—") : "N/A"}</td>
                    <td><i className="bi bi-chevron-right" style={{ color:"var(--muted)" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modal && (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div className="ps-card" style={{ width:"100%",maxWidth:480 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                <div style={{ fontWeight:700,fontSize:"0.92rem" }}>{modal === "nuevo" ? "Nuevo ítem" : "Editar ítem"}</div>
                <button className="ps-btn ps-btn-secondary" style={{ padding:"4px 10px" }} onClick={() => setModal(null)}>✕</button>
              </div>
              {error && <div style={{ background:"var(--red-bg)",color:"var(--red)",padding:"8px 12px",borderRadius:"var(--r-sm)",marginBottom:12,fontSize:"0.78rem" }}>{error}</div>}
              <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
                <div>
                  <label className="ps-label">Nombre *</label>
                  <input className="ps-input" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} />
                </div>
                <div>
                  <label className="ps-label">Tipo</label>
                  <select className="ps-input" value={form.tipo||"producto"} onChange={e=>setForm({...form,tipo:e.target.value})}>
                    <option value="producto">Producto</option>
                    <option value="servicio">Servicio</option>
                  </select>
                </div>
              </div>
              <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
                <div>
                  <label className="ps-label">SKU / Código</label>
                  <input className="ps-input" value={form.sku||""} onChange={e=>setForm({...form,sku:e.target.value})} />
                </div>
                <div>
                  <label className="ps-label">Unidad</label>
                  <select className="ps-input" value={form.unidad||"unidad"} onChange={e=>setForm({...form,unidad:e.target.value})}>
                    <option value="unidad">Unidad</option>
                    <option value="hora">Hora</option>
                    <option value="kg">Kg</option>
                    <option value="litro">Litro</option>
                    <option value="metro">Metro</option>
                  </select>
                </div>
              </div>
              <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
                <div>
                  <label className="ps-label">Precio de costo</label>
                  <input className="ps-input" type="number" value={form.precio_costo||0} onChange={e=>setForm({...form,precio_costo:e.target.value})} />
                </div>
                <div>
                  <label className="ps-label">Precio de venta</label>
                  <input className="ps-input" type="number" value={form.precio_venta||0} onChange={e=>setForm({...form,precio_venta:e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Categoría</label>
                <input className="ps-input" value={form.categoria||""} onChange={e=>setForm({...form,categoria:e.target.value})} placeholder="Ej: Pantallas, Baterías…" />
              </div>
              <div style={{ marginBottom:16 }}>
                <label className="ps-label">Descripción</label>
                <textarea className="ps-input" rows={2} value={form.descripcion||""} onChange={e=>setForm({...form,descripcion:e.target.value})} style={{ resize:"vertical" }} />
              </div>
              {modal !== "nuevo" && (
                <div style={{ marginBottom:16 }}>
                  <label className="ps-label">Estado</label>
                  <select className="ps-input" value={form.activo ? "1" : "0"} onChange={e=>setForm({...form,activo:e.target.value==="1"})}>
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                </div>
              )}
              <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                <button className="ps-btn ps-btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button className="ps-btn ps-btn-primary" onClick={guardar} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
