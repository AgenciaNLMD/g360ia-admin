"use client";
import { useState } from "react";
import { useTenants, useModuloData, TenantSelector, ModuloLoading, ModuloVacio, ModuloError, postModulo } from "./AdminModuloShell";

const STOCK_META = {
  ok:       { label:"OK",        cls:"bdg-em"   },
  bajo:     { label:"Stock bajo", cls:"bdg-amber"},
  sin_stock:{ label:"Sin stock",  cls:"bdg-red"  },
};

export default function ViewAdminInventario() {
  const tenants = useTenants();
  const [tid, setTid] = useState("");
  const { data, loading, error, recargar } = useModuloData("inventario", tid);
  const [modal, setModal] = useState(false);
  const [selItem, setSelItem] = useState(null);
  const [form, setForm]   = useState({ tipo:"entrada", cantidad:"", notas:"" });
  const [saving, setSaving] = useState(false);

  const abrirMovimiento = (item) => { setSelItem(item); setForm({ tipo:"entrada", cantidad:"", notas:"" }); setModal(true); };

  const registrar = async () => {
    if (!form.cantidad) return;
    setSaving(true);
    await postModulo("inventario", tid, { catalogo_id: selItem.id, ...form });
    setSaving(false);
    setModal(false);
    recargar();
  };

  const sinStock = data?.inventario?.filter(i => i.estado_stock !== "ok").length || 0;

  return (
    <div className="view-anim">
      <div className="vh">
        <div>
          <div className="vh-title">Inventario</div>
          <div className="vh-sub">{data ? `${data.inventario?.length || 0} productos${sinStock > 0 ? ` · ${sinStock} con alertas` : ""}` : "Stock del tenant"}</div>
        </div>
      </div>
      <TenantSelector tenants={tenants} value={tid} onChange={setTid} />
      {!tid ? null : error ? <ModuloError mensaje={error} /> : loading ? <ModuloLoading /> : (
        <>
          {sinStock > 0 && (
            <div style={{ background:"var(--red-bg)", color:"var(--red)", borderRadius:"var(--r-sm)",
              padding:"8px 14px", fontSize:"0.78rem", marginBottom:12, display:"flex", gap:8, alignItems:"center" }}>
              <i className="bi bi-exclamation-triangle-fill" />
              {sinStock} producto{sinStock > 1 ? "s" : ""} con stock bajo o sin stock
            </div>
          )}
          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            {!data?.inventario?.length ? <ModuloVacio texto="Sin productos en inventario" icono="bi-archive" /> : (
              <table className="tbl">
                <thead><tr><th>Nombre</th><th>Stock actual</th><th>Stock mínimo</th><th>Estado</th><th>Ubicación</th><th></th></tr></thead>
                <tbody>
                  {data.inventario.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight:600, fontSize:"0.8rem" }}>{item.nombre}</td>
                      <td style={{ fontWeight:700, fontSize:"0.9rem", color: item.estado_stock === "ok" ? "var(--em-d)" : "var(--red)" }}>
                        {Number(item.stock_actual).toFixed(0)} <span style={{ fontWeight:400, fontSize:"0.72rem", color:"var(--muted)" }}>{item.unidad}</span>
                      </td>
                      <td style={{ fontSize:"0.78rem", color:"var(--sub)" }}>{Number(item.stock_minimo).toFixed(0)}</td>
                      <td><span className={`bdg ${STOCK_META[item.estado_stock]?.cls}`}>{STOCK_META[item.estado_stock]?.label}</span></td>
                      <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{item.ubicacion || "—"}</td>
                      <td><button className="btn btn-out btn-xs" onClick={() => abrirMovimiento(item)}>Movimiento</button></td>
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
            <div className="modal-hdr"><span className="modal-title">Movimiento — {selItem?.nombre}</span><button className="btn btn-out btn-xs" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="fg"><label className="fl">Tipo</label>
                <select className="fi" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))}>
                  <option value="entrada">Entrada</option><option value="salida">Salida</option><option value="ajuste">Ajuste</option>
                </select>
              </div>
              <div className="fg"><label className="fl">Cantidad *</label><input className="fi" type="number" min="0" value={form.cantidad} onChange={e=>setForm(p=>({...p,cantidad:e.target.value}))} /></div>
              <div className="fg"><label className="fl">Notas</label><input className="fi" value={form.notas} onChange={e=>setForm(p=>({...p,notas:e.target.value}))} /></div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-out btn-sm" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-em btn-sm" onClick={registrar} disabled={saving || !form.cantidad}>{saving ? "Guardando…" : "Registrar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
