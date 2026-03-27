"use client";
// app/portal/dashboard/proveedores/page.js

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PortalShell, { UpgradeBanner } from "@/components/PortalShell";
import { canUse } from "@/lib/plan-guard";

export default function ProveedoresPage() {
  const { data: session } = useSession();
  const plan = session?.user?.tenantPlan || "free";

  const [tab, setTab]           = useState("proveedores"); // 'proveedores' | 'oc'
  const [proveedores, setProveedores] = useState([]);
  const [ocs, setOcs]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => { if (canUse(plan,"proveedores")) cargar(); else setLoading(false); }, [tab, plan]);

  async function cargar() {
    setLoading(true);
    if (tab === "proveedores") {
      const res = await fetch("/api/portal/proveedores");
      const d   = await res.json();
      if (d.ok) setProveedores(d.proveedores);
    } else {
      const res = await fetch("/api/portal/proveedores?modo=oc");
      const d   = await res.json();
      if (d.ok) setOcs(d.ocs);
    }
    setLoading(false);
  }

  async function guardar() {
    if (!form.nombre) { setError("El nombre es obligatorio"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/portal/proveedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        modal === "nuevo"
          ? { accion:"crear_proveedor", ...form }
          : { id: modal.id, ...form }
      ),
    });
    const d = await res.json();
    setSaving(false);
    if (d.ok) { setModal(null); cargar(); }
    else setError(d.error || "Error");
  }

  async function recibirOC(oc_id) {
    if (!confirm("¿Confirmar recepción? Se actualizará el stock automáticamente.")) return;
    await fetch("/api/portal/proveedores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion:"recibir_oc", oc_id }),
    });
    cargar();
  }

  if (!canUse(plan, "proveedores")) {
    return (
      <PortalShell title="Proveedores" subtitle="Gestión de proveedores y órdenes de compra">
        <div className="ps-anim">
          <UpgradeBanner feature="Módulo de Proveedores" planRequerido="Business" />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="Proveedores" subtitle="Proveedores y órdenes de compra">
      <div className="ps-anim">
        <div style={{ display:"flex",gap:4,marginBottom:16,justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ display:"flex",gap:4 }}>
            {[["proveedores","Proveedores"],["oc","Órdenes de compra"]].map(([id,label]) => (
              <button key={id} className={`ps-btn ${tab===id?"ps-btn-primary":"ps-btn-secondary"}`}
                style={{ fontSize:"0.78rem" }} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
          {tab === "proveedores" && (
            <button className="ps-btn ps-btn-primary"
              onClick={() => { setForm({ nombre:"",cuit:"",telefono:"",email:"",direccion:"",condiciones_pago:"",notas:"" }); setError(""); setModal("nuevo"); }}>
              <i className="bi bi-plus-lg" /> Nuevo proveedor
            </button>
          )}
        </div>

        {tab === "proveedores" && (
          <div className="ps-card" style={{ padding:0,overflow:"hidden" }}>
            <div className="ps-table-wrap">
              <table className="ps-table">
                <thead>
                  <tr><th>Nombre</th><th>CUIT</th><th>Teléfono</th><th>Email</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={6} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Cargando…</td></tr>}
                  {!loading && proveedores.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Sin proveedores</td></tr>}
                  {proveedores.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight:600 }}>{p.nombre}</td>
                      <td style={{ fontFamily:"monospace",fontSize:"0.75rem" }}>{p.cuit||"—"}</td>
                      <td>{p.telefono||"—"}</td>
                      <td>{p.email||"—"}</td>
                      <td><span className={`ps-badge ${p.activo?"ps-badge-green":"ps-badge-gray"}`}>{p.activo?"Activo":"Inactivo"}</span></td>
                      <td>
                        <button className="ps-btn ps-btn-secondary" style={{ padding:"4px 8px",fontSize:"0.72rem" }}
                          onClick={() => { setForm({...p}); setError(""); setModal(p); }}>Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "oc" && (
          <div className="ps-card" style={{ padding:0,overflow:"hidden" }}>
            <div className="ps-table-wrap">
              <table className="ps-table">
                <thead>
                  <tr><th>ID</th><th>Proveedor</th><th>Estado</th><th>Total</th><th>Fecha</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={6} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Cargando…</td></tr>}
                  {!loading && ocs.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Sin órdenes de compra</td></tr>}
                  {ocs.map(oc => (
                    <tr key={oc.id}>
                      <td style={{ fontFamily:"monospace",fontWeight:700 }}>OC-{String(oc.id).padStart(4,"0")}</td>
                      <td>{oc.proveedor_nombre}</td>
                      <td>
                        <span className={`ps-badge ${oc.estado==="recibida"?"ps-badge-green":oc.estado==="cancelada"?"ps-badge-red":"ps-badge-amber"}`}>
                          {oc.estado}
                        </span>
                      </td>
                      <td style={{ fontWeight:600 }}>${Number(oc.total).toFixed(2)}</td>
                      <td>{new Date(oc.creado_en).toLocaleDateString("es-AR")}</td>
                      <td>
                        {oc.estado === "pendiente" && (
                          <button className="ps-btn ps-btn-primary" style={{ padding:"4px 10px",fontSize:"0.72rem" }}
                            onClick={() => recibirOC(oc.id)}>
                            <i className="bi bi-check-lg" /> Marcar recibida
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal proveedor */}
        {modal && (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div className="ps-card" style={{ width:"100%",maxWidth:480 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                <div style={{ fontWeight:700,fontSize:"0.92rem" }}>{modal==="nuevo"?"Nuevo proveedor":"Editar proveedor"}</div>
                <button className="ps-btn ps-btn-secondary" style={{ padding:"4px 10px" }} onClick={() => setModal(null)}>✕</button>
              </div>
              {error && <div style={{ background:"var(--red-bg)",color:"var(--red)",padding:"8px 12px",borderRadius:"var(--r-sm)",marginBottom:12,fontSize:"0.78rem" }}>{error}</div>}
              <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
                <div>
                  <label className="ps-label">Nombre *</label>
                  <input className="ps-input" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} />
                </div>
                <div>
                  <label className="ps-label">CUIT</label>
                  <input className="ps-input" value={form.cuit||""} onChange={e=>setForm({...form,cuit:e.target.value})} />
                </div>
              </div>
              <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
                <div>
                  <label className="ps-label">Teléfono</label>
                  <input className="ps-input" value={form.telefono||""} onChange={e=>setForm({...form,telefono:e.target.value})} />
                </div>
                <div>
                  <label className="ps-label">Email</label>
                  <input className="ps-input" type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Dirección</label>
                <input className="ps-input" value={form.direccion||""} onChange={e=>setForm({...form,direccion:e.target.value})} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Condiciones de pago</label>
                <input className="ps-input" value={form.condiciones_pago||""} placeholder="Ej: 30 días, contado…"
                  onChange={e=>setForm({...form,condiciones_pago:e.target.value})} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label className="ps-label">Notas</label>
                <textarea className="ps-input" rows={2} value={form.notas||""}
                  onChange={e=>setForm({...form,notas:e.target.value})} style={{ resize:"vertical" }} />
              </div>
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
