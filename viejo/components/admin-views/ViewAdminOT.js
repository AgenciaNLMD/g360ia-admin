"use client";
import { useState } from "react";
import { useTenants, useModuloData, TenantSelector, ModuloLoading, ModuloVacio, ModuloError, postModulo } from "./AdminModuloShell";

const PRIORIDAD_META = {
  baja:    { label:"Baja",    cls:"bdg-moon" },
  normal:  { label:"Normal",  cls:"bdg-blue" },
  alta:    { label:"Alta",    cls:"bdg-amber"},
  urgente: { label:"Urgente", cls:"bdg-red"  },
};

export default function ViewAdminOT() {
  const tenants        = useTenants();
  const [tid, setTid]  = useState("");
  const { data, loading, error, recargar } = useModuloData("ot", tid);
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ titulo:"", descripcion:"", prioridad:"normal" });
  const [saving, setSaving] = useState(false);

  const crear = async () => {
    setSaving(true);
    const d = await postModulo("ot", tid, form);
    setSaving(false);
    if (d.ok) { setModal(false); recargar(); }
  };

  return (
    <div className="view-anim">
      <div className="vh">
        <div>
          <div className="vh-title">Órdenes de Trabajo</div>
          <div className="vh-sub">{data ? `${data.ots?.length || 0} órdenes` : "Gestión de OTs por tenant"}</div>
        </div>
        {tid && <button className="btn btn-em btn-sm" onClick={() => setModal(true)}><i className="bi bi-plus-lg" /> Nueva OT</button>}
      </div>

      <TenantSelector tenants={tenants} value={tid} onChange={setTid} />

      {!tid ? null : error ? <ModuloError mensaje={error} /> : loading ? <ModuloLoading /> : (
        <>
          {/* Etapas resumen */}
          {data?.etapas?.length > 0 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {data.etapas.map(e => {
                const cnt = data.ots?.filter(o => o.etapa_id === e.id).length || 0;
                return (
                  <div key={e.id} style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:"var(--r-sm)",
                    padding:"6px 12px", display:"flex", alignItems:"center", gap:6, fontSize:"0.75rem" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background: e.color || e.color_hex || "#506886" }} />
                    <span style={{ color:"var(--sub)" }}>{e.nombre}</span>
                    <span style={{ fontWeight:700, color:"var(--text)" }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            {!data?.ots?.length ? <ModuloVacio texto="Sin órdenes de trabajo" icono="bi-tools" /> : (
              <table className="tbl">
                <thead>
                  <tr><th>N° OT</th><th>Cliente</th><th>Título</th><th>Etapa</th><th>Prioridad</th><th>Total</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {data.ots.map(ot => (
                    <tr key={ot.id}>
                      <td style={{ fontWeight:700, fontFamily:"monospace", fontSize:"0.78rem" }}>{ot.numero_ot}</td>
                      <td style={{ fontSize:"0.78rem" }}>{ot.cliente_nombre || "—"}</td>
                      <td style={{ fontSize:"0.78rem", maxWidth:200 }}>{ot.titulo}</td>
                      <td>
                        <span className="bdg bdg-blue" style={{ background:(ot.etapa_color||"#506886")+"22", color:ot.etapa_color||"#506886" }}>
                          {ot.etapa_nombre}
                        </span>
                      </td>
                      <td><span className={`bdg ${PRIORIDAD_META[ot.prioridad]?.cls||"bdg-moon"}`}>{PRIORIDAD_META[ot.prioridad]?.label||ot.prioridad}</span></td>
                      <td style={{ fontWeight:600, fontSize:"0.78rem" }}>${Number(ot.total||0).toFixed(2)}</td>
                      <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{new Date(ot.creado_en).toLocaleDateString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {modal && (
        <div className="modal-over" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><span className="modal-title">Nueva OT</span><button className="btn btn-out btn-xs" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="fg"><label className="fl">Título *</label><input className="fi" value={form.titulo} onChange={e => setForm(p => ({...p, titulo:e.target.value}))} /></div>
              <div className="fg"><label className="fl">Descripción / Falla</label><textarea className="fi" rows={3} value={form.descripcion} onChange={e => setForm(p => ({...p, descripcion:e.target.value}))} /></div>
              <div className="fg"><label className="fl">Prioridad</label>
                <select className="fi" value={form.prioridad} onChange={e => setForm(p => ({...p, prioridad:e.target.value}))}>
                  <option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-out btn-sm" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-em btn-sm" onClick={crear} disabled={saving || !form.titulo}>{saving ? "Creando…" : "Crear OT"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
