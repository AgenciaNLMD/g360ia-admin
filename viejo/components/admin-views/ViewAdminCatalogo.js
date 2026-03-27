"use client";
import { useState } from "react";
import { useTenants, useModuloData, TenantSelector, ModuloLoading, ModuloVacio, ModuloError, postModulo } from "./AdminModuloShell";

export default function ViewAdminCatalogo() {
  const tenants = useTenants();
  const [tid, setTid] = useState("");
  const { data, loading, error, recargar } = useModuloData("catalogo", tid);
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ nombre:"", tipo:"producto", precio_costo:"", precio_venta:"", unidad:"unidad", codigo:"" });
  const [editando, setEditando] = useState(null);
  const [saving, setSaving] = useState(false);

  const abrirNuevo  = () => { setEditando(null); setForm({ nombre:"", tipo:"producto", precio_costo:"", precio_venta:"", unidad:"unidad", codigo:"" }); setModal(true); };
  const abrirEditar = (item) => { setEditando(item); setForm({ nombre:item.nombre, tipo:item.tipo, precio_costo:item.precio_costo||"", precio_venta:item.precio_venta, unidad:item.unidad, codigo:item.codigo||"" }); setModal(true); };

  const guardar = async () => {
    if (!form.nombre) return;
    setSaving(true);
    const d = await postModulo("catalogo", tid, editando ? { ...form, id: editando.id } : form);
    setSaving(false);
    if (d.ok) { setModal(false); recargar(); }
  };

  const margen = (costo, venta) => {
    if (!costo || !venta || Number(costo) === 0) return null;
    return (((Number(venta) - Number(costo)) / Number(costo)) * 100).toFixed(1);
  };

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Catálogo</div><div className="vh-sub">{data ? `${data.catalogo?.length || 0} ítems` : "Productos y servicios del tenant"}</div></div>
        {tid && <button className="btn btn-em btn-sm" onClick={abrirNuevo}><i className="bi bi-plus-lg" /> Nuevo ítem</button>}
      </div>
      <TenantSelector tenants={tenants} value={tid} onChange={setTid} />
      {!tid ? null : error ? <ModuloError mensaje={error} /> : loading ? <ModuloLoading /> : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {!data?.catalogo?.length ? <ModuloVacio texto="Sin ítems en el catálogo" icono="bi-box-seam" /> : (
            <table className="tbl">
              <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Costo</th><th>Venta</th><th>Margen</th><th>Unidad</th><th></th></tr></thead>
              <tbody>
                {data.catalogo.map(item => {
                  const mg = margen(item.precio_costo, item.precio_venta);
                  return (
                    <tr key={item.id}>
                      <td style={{ fontSize:"0.72rem", color:"var(--muted)", fontFamily:"monospace" }}>{item.codigo || "—"}</td>
                      <td style={{ fontWeight:600, fontSize:"0.8rem" }}>{item.nombre}</td>
                      <td><span className={`bdg ${item.tipo === "servicio" ? "bdg-blue" : "bdg-em"}`}>{item.tipo}</span></td>
                      <td style={{ fontSize:"0.78rem" }}>{item.precio_costo ? `$${Number(item.precio_costo).toFixed(2)}` : "—"}</td>
                      <td style={{ fontWeight:600, fontSize:"0.78rem" }}>${Number(item.precio_venta).toFixed(2)}</td>
                      <td style={{ fontSize:"0.78rem", color: mg && Number(mg) >= 30 ? "var(--em-d)" : "var(--amber)" }}>
                        {mg ? `${mg}%` : "—"}
                      </td>
                      <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{item.unidad}</td>
                      <td><button className="btn btn-out btn-xs" onClick={() => abrirEditar(item)}>Editar</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      {modal && (
        <div className="modal-over" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><span className="modal-title">{editando ? "Editar ítem" : "Nuevo ítem"}</span><button className="btn btn-out btn-xs" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="fi-row">
                <div className="fg"><label className="fl">Nombre *</label><input className="fi" value={form.nombre} onChange={e => setForm(p=>({...p,nombre:e.target.value}))} /></div>
                <div className="fg"><label className="fl">Código</label><input className="fi" value={form.codigo} onChange={e => setForm(p=>({...p,codigo:e.target.value}))} /></div>
              </div>
              <div className="fi-row">
                <div className="fg"><label className="fl">Tipo</label><select className="fi" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))}><option value="producto">Producto</option><option value="servicio">Servicio</option></select></div>
                <div className="fg"><label className="fl">Unidad</label><input className="fi" value={form.unidad} onChange={e => setForm(p=>({...p,unidad:e.target.value}))} /></div>
              </div>
              <div className="fi-row">
                <div className="fg"><label className="fl">Precio costo</label><input className="fi" type="number" value={form.precio_costo} onChange={e => setForm(p=>({...p,precio_costo:e.target.value}))} /></div>
                <div className="fg"><label className="fl">Precio venta *</label><input className="fi" type="number" value={form.precio_venta} onChange={e => setForm(p=>({...p,precio_venta:e.target.value}))} /></div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-out btn-sm" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-em btn-sm" onClick={guardar} disabled={saving || !form.nombre}>{saving ? "Guardando…" : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
