"use client";
// app/portal/dashboard/comunicaciones/page.js

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PortalShell, { UpgradeBanner } from "@/components/PortalShell";
import { canUse } from "@/lib/plan-guard";

const TIPO_LABELS  = { notif_ot:"Notif. OT", presupuesto:"Presupuesto", factura:"Factura", link_pago:"Link de pago", otro:"Otro" };
const CANAL_LABELS = { whatsapp:"WhatsApp", email:"Email", sms:"SMS" };

export default function ComunicacionesPage() {
  const { data: session } = useSession();
  const plan = session?.user?.tenantPlan || "free";

  const [tab, setTab]               = useState("historial"); // 'historial' | 'plantillas' | 'config'
  const [comunicaciones, setComunicaciones] = useState([]);
  const [plantillas, setPlantillas]         = useState([]);
  const [config, setConfig]                 = useState(null);
  const [loading, setLoading]               = useState(true);
  const [formConfig, setFormConfig]         = useState({});
  const [saving, setSaving]                 = useState(false);
  const [editPlantilla, setEditPlantilla]   = useState(null);

  useEffect(() => { cargarTab(); }, [tab]);

  async function cargarTab() {
    setLoading(true);
    if (tab === "historial") {
      const res = await fetch("/api/portal/comunicaciones");
      const d   = await res.json();
      if (d.ok) setComunicaciones(d.comunicaciones);
    } else if (tab === "plantillas") {
      const res = await fetch("/api/portal/comunicaciones?modo=plantillas");
      const d   = await res.json();
      if (d.ok) setPlantillas(d.plantillas);
    } else if (tab === "config") {
      const res = await fetch("/api/portal/comunicaciones?modo=config");
      const d   = await res.json();
      if (d.ok) { setConfig(d.config); setFormConfig(d.config || {}); }
    }
    setLoading(false);
  }

  async function guardarConfig() {
    setSaving(true);
    const res = await fetch("/api/portal/comunicaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "guardar_config", ...formConfig }),
    });
    setSaving(false);
    if ((await res.json()).ok) cargarTab();
  }

  async function guardarPlantilla(p) {
    await fetch("/api/portal/comunicaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "guardar_plantilla", ...p }),
    });
    setEditPlantilla(null);
    cargarTab();
  }

  if (!canUse(plan, "comunicaciones_auto")) {
    return (
      <PortalShell title="Comunicaciones" subtitle="Notificaciones automáticas">
        <div className="ps-anim">
          <UpgradeBanner feature="Notificaciones automáticas por WhatsApp" planRequerido="Pro" />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="Comunicaciones" subtitle="Notificaciones y mensajes enviados">
      <div className="ps-anim">

        {/* Tabs */}
        <div style={{ display:"flex",gap:4,marginBottom:16 }}>
          {[["historial","Historial"],["plantillas","Plantillas"],["config","Configuración WA"]].map(([id,label]) => (
            <button key={id} className={`ps-btn ${tab===id?"ps-btn-primary":"ps-btn-secondary"}`}
              style={{ fontSize:"0.78rem" }} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* Historial */}
        {tab === "historial" && (
          <div className="ps-card" style={{ padding:0,overflow:"hidden" }}>
            <div className="ps-table-wrap">
              <table className="ps-table">
                <thead>
                  <tr><th>Fecha</th><th>Cliente</th><th>Canal</th><th>Tipo</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={5} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Cargando…</td></tr>}
                  {!loading && comunicaciones.length === 0 && <tr><td colSpan={5} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Sin comunicaciones registradas</td></tr>}
                  {comunicaciones.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontSize:"0.72rem" }}>{new Date(c.creado_en).toLocaleString("es-AR")}</td>
                      <td>{c.cliente_nombre || "—"}</td>
                      <td><span className="ps-badge ps-badge-blue">{CANAL_LABELS[c.canal]}</span></td>
                      <td>{TIPO_LABELS[c.tipo] || c.tipo}</td>
                      <td>
                        <span className={`ps-badge ${c.estado==="enviado"?"ps-badge-green":c.estado==="fallido"?"ps-badge-red":"ps-badge-gray"}`}>
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Plantillas */}
        {tab === "plantillas" && (
          <div>
            <div style={{ fontSize:"0.75rem",color:"var(--muted)",marginBottom:12 }}>
              Variables disponibles: <code style={{ background:"var(--bg)",padding:"1px 5px",borderRadius:4 }}>{"{{nombre_cliente}}"}</code>{" "}
              <code style={{ background:"var(--bg)",padding:"1px 5px",borderRadius:4 }}>{"{{numero_ot}}"}</code>{" "}
              <code style={{ background:"var(--bg)",padding:"1px 5px",borderRadius:4 }}>{"{{equipo}}"}</code>{" "}
              <code style={{ background:"var(--bg)",padding:"1px 5px",borderRadius:4 }}>{"{{etapa}}"}</code>
            </div>
            {loading ? <div style={{ color:"var(--muted)",padding:16 }}>Cargando…</div> : plantillas.map(p => (
              <div key={p.id} className="ps-card" style={{ marginBottom:8 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>
                      {p.etapa_nombre ? `Etapa: ${p.etapa_nombre}` : p.tipo}
                      <span className="ps-badge ps-badge-blue" style={{ marginLeft:8 }}>{CANAL_LABELS[p.canal]}</span>
                      {!p.activa && <span className="ps-badge ps-badge-gray" style={{ marginLeft:4 }}>Inactiva</span>}
                    </div>
                    {editPlantilla?.id === p.id ? (
                      <div>
                        <textarea className="ps-input" rows={3} style={{ marginTop:6,resize:"vertical",width:"100%" }}
                          value={editPlantilla.plantilla}
                          onChange={e=>setEditPlantilla({...editPlantilla,plantilla:e.target.value})} />
                        <div style={{ display:"flex",gap:6,marginTop:8 }}>
                          <button className="ps-btn ps-btn-primary" style={{ fontSize:"0.75rem" }} onClick={() => guardarPlantilla(editPlantilla)}>Guardar</button>
                          <button className="ps-btn ps-btn-secondary" style={{ fontSize:"0.75rem" }} onClick={() => setEditPlantilla(null)}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize:"0.78rem",color:"var(--text2)",marginTop:4,lineHeight:1.5 }}>{p.plantilla}</div>
                    )}
                  </div>
                  {editPlantilla?.id !== p.id && (
                    <button className="ps-btn ps-btn-secondary" style={{ padding:"4px 8px",fontSize:"0.72rem",flexShrink:0,marginLeft:12 }}
                      onClick={() => setEditPlantilla({ ...p })}>Editar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Config WhatsApp */}
        {tab === "config" && (
          <div className="ps-card" style={{ maxWidth:520 }}>
            <div style={{ fontWeight:700,marginBottom:16,fontSize:"0.82rem" }}>Configuración de WhatsApp (Evolution API)</div>
            <div style={{ marginBottom:12 }}>
              <label className="ps-label">Número de WhatsApp</label>
              <input className="ps-input" value={formConfig.numero_whatsapp||""} placeholder="5491112345678"
                onChange={e=>setFormConfig({...formConfig,numero_whatsapp:e.target.value})} />
            </div>
            <div style={{ marginBottom:12 }}>
              <label className="ps-label">URL de Evolution API</label>
              <input className="ps-input" value={formConfig.evolution_api_url||""} placeholder="https://evolution.tudominio.com"
                onChange={e=>setFormConfig({...formConfig,evolution_api_url:e.target.value})} />
            </div>
            <div style={{ marginBottom:12 }}>
              <label className="ps-label">API Key</label>
              <input className="ps-input" type="password" value={formConfig.evolution_api_key||""}
                onChange={e=>setFormConfig({...formConfig,evolution_api_key:e.target.value})} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label className="ps-label">Nombre de instancia</label>
              <input className="ps-input" value={formConfig.instancia_nombre||""} placeholder="mi-negocio"
                onChange={e=>setFormConfig({...formConfig,instancia_nombre:e.target.value})} />
            </div>
            <button className="ps-btn ps-btn-primary" onClick={guardarConfig} disabled={saving}>
              {saving ? "Guardando…" : "Guardar configuración"}
            </button>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
