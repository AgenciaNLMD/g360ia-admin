"use client";
// app/portal/dashboard/equipo/page.js

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PortalShell, { UpgradeBanner } from "@/components/PortalShell";
import { canUse } from "@/lib/plan-guard";

export default function EquipoPage() {
  const { data: session } = useSession();
  const plan = session?.user?.tenantPlan || "free";

  const [tecnicos, setTecnicos] = useState([]);
  const [carga, setCarga]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);

  useEffect(() => { if (canUse(plan, "equipo")) cargar(); else setLoading(false); }, [plan]);

  async function cargar() {
    setLoading(true);
    const res = await fetch("/api/portal/equipo");
    const d   = await res.json();
    if (d.ok) { setTecnicos(d.tecnicos); setCarga(d.carga); }
    setLoading(false);
  }

  function cargaPorTecnico(id) {
    return carga.filter(c => c.tecnico_id === id);
  }

  async function guardar() {
    setSaving(true);
    const res = await fetch("/api/portal/equipo", {
      method: modal === "nuevo" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modal === "nuevo" ? form : { id: modal.perfil_id, ...form }),
    });
    setSaving(false);
    if ((await res.json()).ok) { setModal(null); cargar(); }
  }

  if (!canUse(plan, "equipo")) {
    return (
      <PortalShell title="Equipo" subtitle="Técnicos y carga de trabajo">
        <div className="ps-anim">
          <UpgradeBanner feature="Gestión de equipo técnico" planRequerido="Pro" />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="Equipo" subtitle="Técnicos y carga de trabajo">
      <div className="ps-anim">

        {/* Carga de trabajo */}
        {tecnicos.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",color:"var(--muted)",letterSpacing:".06em",marginBottom:10 }}>
              Carga de trabajo actual
            </div>
            <div className="ps-g3">
              {tecnicos.map(t => {
                const cts = cargaPorTecnico(t.usuario_id);
                const total = cts.reduce((a, c) => a + Number(c.cantidad), 0);
                return (
                  <div key={t.usuario_id} className="ps-card">
                    <div style={{ fontWeight:700,marginBottom:8 }}>{t.nombre || `Usuario ${t.usuario_id}`}</div>
                    <div style={{ fontSize:"0.72rem",color:"var(--muted)",marginBottom:8 }}>{t.especialidad || "Sin especialidad"}</div>
                    <div style={{ fontSize:"1.4rem",fontWeight:800,color:"var(--green)" }}>{total}</div>
                    <div style={{ fontSize:"0.68rem",color:"var(--muted)" }}>OTs activas</div>
                    {cts.map(c => (
                      <div key={c.etapa} style={{ display:"flex",justifyContent:"space-between",fontSize:"0.72rem",marginTop:4 }}>
                        <span style={{ color:"var(--text2)" }}>{c.etapa}</span>
                        <span style={{ fontWeight:600 }}>{c.cantidad}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista técnicos */}
        <div className="ps-card" style={{ padding:0,overflow:"hidden" }}>
          <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontWeight:700,fontSize:"0.82rem" }}>Técnicos del equipo</span>
          </div>
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead>
                <tr><th>Nombre</th><th>Email</th><th>Especialidad</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Cargando…</td></tr>}
                {!loading && tecnicos.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>
                    Sin técnicos. Agregá usuarios desde el sistema y vincúlalos al equipo.
                  </td></tr>
                )}
                {tecnicos.map(t => (
                  <tr key={t.usuario_id}>
                    <td style={{ fontWeight:600 }}>{t.nombre || `Usuario ${t.usuario_id}`}</td>
                    <td style={{ color:"var(--muted)" }}>{t.email || "—"}</td>
                    <td>{t.especialidad || "—"}</td>
                    <td>
                      <span className={`ps-badge ${t.activo?"ps-badge-green":"ps-badge-gray"}`}>
                        {t.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <button className="ps-btn ps-btn-secondary" style={{ padding:"4px 8px",fontSize:"0.72rem" }}
                        onClick={() => { setForm({ especialidad:t.especialidad||"",notas:t.notas||"",activo:t.activo }); setModal(t); }}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modal && modal !== "nuevo" && (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div className="ps-card" style={{ width:"100%",maxWidth:400 }}>
              <div style={{ fontWeight:700,marginBottom:16,fontSize:"0.92rem" }}>Editar técnico — {modal.nombre}</div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Especialidad</label>
                <input className="ps-input" value={form.especialidad||""} placeholder="Celulares, PCs, etc."
                  onChange={e=>setForm({...form,especialidad:e.target.value})} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Notas</label>
                <textarea className="ps-input" rows={2} value={form.notas||""}
                  onChange={e=>setForm({...form,notas:e.target.value})} style={{ resize:"vertical" }} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label className="ps-label">Estado</label>
                <select className="ps-input" value={form.activo?"1":"0"} onChange={e=>setForm({...form,activo:e.target.value==="1"})}>
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
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
