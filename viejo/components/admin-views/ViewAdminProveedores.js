"use client";
import { useState } from "react";
import { useTenants, useModuloData, TenantSelector, ModuloLoading, ModuloVacio, ModuloError, postModulo } from "./AdminModuloShell";

const OC_ESTADO = { borrador:"bdg-moon", enviada:"bdg-blue", recibida:"bdg-em", cancelada:"bdg-red" };

export default function ViewAdminProveedores() {
  const tenants = useTenants();
  const [tid, setTid] = useState("");
  const [tab, setTab]  = useState("proveedores");
  const { data, loading, error, recargar } = useModuloData("proveedores", tid);
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ nombre:"", contacto:"", telefono:"", email:"" });
  const [saving, setSaving] = useState(false);

  const crear = async () => {
    if (!form.nombre) return;
    setSaving(true);
    await postModulo("proveedores", tid, { accion:"crear_proveedor", ...form });
    setSaving(false);
    setModal(false);
    recargar();
  };

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Proveedores</div><div className="vh-sub">{data ? `${data.proveedores?.length || 0} proveedores` : "Proveedores del tenant"}</div></div>
        {tid && tab === "proveedores" && <button className="btn btn-em btn-sm" onClick={() => { setForm({ nombre:"", contacto:"", telefono:"", email:"" }); setModal(true); }}><i className="bi bi-plus-lg" /> Nuevo proveedor</button>}
      </div>
      <TenantSelector tenants={tenants} value={tid} onChange={setTid} />
      {tid && (
        <div style={{ display:"flex", gap:4, marginBottom:14, background:"var(--bg)", borderRadius:"var(--r-sm)", padding:3, width:"fit-content" }}>
          {[["proveedores","Proveedores"],["ocs","Órdenes de compra"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding:"0.28rem 0.9rem", borderRadius:"var(--r-sm)", border:"none", cursor:"pointer", fontFamily:"inherit",
              background: tab===id ? "#fff" : "transparent", color: tab===id ? "var(--pr)" : "var(--muted)",
              fontWeight: tab===id ? 700 : 500, fontSize:"0.75rem", boxShadow: tab===id ? "var(--sh)" : "none",
            }}>{label}</button>
          ))}
        </div>
      )}
      {!tid ? null : error ? <ModuloError mensaje={error} /> : loading ? <ModuloLoading /> : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {tab === "proveedores" ? (
            !data?.proveedores?.length ? <ModuloVacio texto="Sin proveedores" icono="bi-truck" /> : (
              <table className="tbl">
                <thead><tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Email</th></tr></thead>
                <tbody>
                  {data.proveedores.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight:600, fontSize:"0.8rem" }}>{p.nombre}</td>
                      <td style={{ fontSize:"0.78rem", color:"var(--sub)" }}>{p.contacto || "—"}</td>
                      <td style={{ fontSize:"0.78rem", color:"var(--muted)" }}>{p.telefono || "—"}</td>
                      <td style={{ fontSize:"0.78rem", color:"var(--muted)" }}>{p.email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            !data?.ocs?.length ? <ModuloVacio texto="Sin órdenes de compra" icono="bi-box-arrow-in-right" /> : (
              <table className="tbl">
                <thead><tr><th>N° OC</th><th>Proveedor</th><th>Estado</th><th>Total</th><th>Ítems</th><th>Fecha</th></tr></thead>
                <tbody>
                  {data.ocs.map(oc => (
                    <tr key={oc.id}>
                      <td style={{ fontWeight:700, fontFamily:"monospace", fontSize:"0.78rem" }}>{oc.numero_oc || `OC-${oc.id}`}</td>
                      <td style={{ fontSize:"0.78rem" }}>{oc.proveedor_nombre}</td>
                      <td><span className={`bdg ${OC_ESTADO[oc.estado] || "bdg-moon"}`}>{oc.estado}</span></td>
                      <td style={{ fontWeight:600 }}>${Number(oc.total).toFixed(2)}</td>
                      <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{oc.cant_items}</td>
                      <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{new Date(oc.creado_en).toLocaleDateString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      )}
      {modal && (
        <div className="modal-over" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><span className="modal-title">Nuevo proveedor</span><button className="btn btn-out btn-xs" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="fg"><label className="fl">Nombre *</label><input className="fi" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} /></div>
              <div className="fi-row">
                <div className="fg"><label className="fl">Contacto</label><input className="fi" value={form.contacto} onChange={e=>setForm(p=>({...p,contacto:e.target.value}))} /></div>
                <div className="fg"><label className="fl">Teléfono</label><input className="fi" value={form.telefono} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))} /></div>
              </div>
              <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-out btn-sm" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-em btn-sm" onClick={crear} disabled={saving || !form.nombre}>{saving ? "Guardando…" : "Crear proveedor"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
