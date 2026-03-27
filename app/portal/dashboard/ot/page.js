"use client";
// app/portal/dashboard/ot/page.js

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PortalShell, { UpgradeBanner } from "@/components/PortalShell";
import { canUse } from "@/lib/plan-guard";

export default function OTPage() {
  const { data: session } = useSession();
  const plan = session?.user?.tenantPlan || "free";

  const [ots, setOts]       = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista]   = useState("lista");  // 'lista' | id (detalle)
  const [otDetalle, setOtDetalle] = useState(null);
  const [otItems, setOtItems]     = useState([]);
  const [otHistorial, setOtHistorial] = useState([]);
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [buscar, setBuscar]           = useState("");
  const [modalNuevo, setModalNuevo]   = useState(false);
  const [form, setForm]               = useState({});
  const [clientes, setClientes]       = useState([]);
  const [saving, setSaving]           = useState(false);
  const [savingEtapa, setSavingEtapa] = useState(false);

  useEffect(() => { cargarLista(); }, [filtroEtapa]);
  useEffect(() => {
    if (typeof vista === "number") cargarDetalle(vista);
  }, [vista]);

  async function cargarLista() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroEtapa) params.set("etapa", filtroEtapa);
    if (buscar) params.set("q", buscar);
    const res = await fetch(`/api/portal/ot?${params}`);
    const d   = await res.json();
    if (d.ok) { setOts(d.ots); setEtapas(d.etapas); }
    setLoading(false);
  }

  async function cargarDetalle(id) {
    const res = await fetch(`/api/portal/ot/${id}`);
    const d   = await res.json();
    if (d.ok) {
      setOtDetalle(d.ot);
      setOtItems(d.items);
      setOtHistorial(d.historial);
      if (!etapas.length) setEtapas(d.etapas);
    }
  }

  async function abrirNuevo() {
    const res = await fetch("/api/portal/clientes");
    const d   = await res.json();
    if (d.ok) setClientes(d.clientes);
    setForm({ cliente_id: "", equipo_marca: "", equipo_modelo: "", equipo_serie: "", equipo_falla_reportada: "" });
    setModalNuevo(true);
  }

  async function crearOT() {
    if (!form.equipo_falla_reportada) return;
    setSaving(true);
    const res = await fetch("/api/portal/ot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setSaving(false);
    if (d.ok) { setModalNuevo(false); cargarLista(); }
  }

  async function avanzarEtapa(ot_id) {
    setSavingEtapa(true);
    const res = await fetch(`/api/portal/ot/${ot_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "avanzar_etapa" }),
    });
    const d = await res.json();
    setSavingEtapa(false);
    if (d.ok) { cargarDetalle(ot_id); cargarLista(); }
    else alert(d.error || "Error");
  }

  const etapaActual = otDetalle ? etapas.find(e => e.id === otDetalle.etapa_actual_id) : null;
  const etapaOrden  = etapaActual?.orden || 0;
  const esUltimaEtapa = etapaOrden >= 7;

  if (vista !== "lista" && otDetalle) {
    return (
      <PortalShell title={`OT ${otDetalle.numero_ot}`} subtitle={otDetalle.cliente_nombre || "Sin cliente"}>
        <div className="ps-anim">
          <button className="ps-btn ps-btn-secondary" style={{ marginBottom:16 }} onClick={() => { setVista("lista"); setOtDetalle(null); }}>
            <i className="bi bi-arrow-left" /> Volver a lista
          </button>

          {/* Header OT */}
          <div className="ps-card" style={{ marginBottom:12 }}>
            <div className="ps-g4" style={{ marginBottom:12 }}>
              <div><div style={{ fontSize:"0.65rem",color:"var(--muted)",textTransform:"uppercase",fontWeight:700,marginBottom:2 }}>OT</div><div style={{ fontWeight:700,fontSize:"1rem" }}>{otDetalle.numero_ot}</div></div>
              <div><div style={{ fontSize:"0.65rem",color:"var(--muted)",textTransform:"uppercase",fontWeight:700,marginBottom:2 }}>Cliente</div><div style={{ fontWeight:600 }}>{otDetalle.cliente_nombre || "—"}</div></div>
              <div><div style={{ fontSize:"0.65rem",color:"var(--muted)",textTransform:"uppercase",fontWeight:700,marginBottom:2 }}>Equipo</div><div>{[otDetalle.equipo_marca,otDetalle.equipo_modelo].filter(Boolean).join(" ") || "—"}</div></div>
              <div><div style={{ fontSize:"0.65rem",color:"var(--muted)",textTransform:"uppercase",fontWeight:700,marginBottom:2 }}>Ingreso</div><div>{new Date(otDetalle.creado_en).toLocaleDateString("es-AR")}</div></div>
            </div>

            {/* Stepper etapas */}
            <div style={{ display:"flex", gap:4, overflowX:"auto", paddingBottom:4 }}>
              {etapas.map(e => {
                const completada = e.orden < etapaOrden;
                const activa     = e.id === otDetalle.etapa_actual_id;
                const bloqueada  = e.plan_minimo !== "free" && !canUse(plan, "ot_etapas_completas");
                return (
                  <div key={e.id} style={{
                    display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                    minWidth:80,opacity:bloqueada ? 0.4 : 1,
                  }}>
                    <div style={{
                      width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:700,flexShrink:0,
                      background: activa ? e.color_hex : completada ? "var(--green)" : "#E5E7EB",
                      color: (activa || completada) ? "#fff" : "var(--muted)",
                    }}>
                      {completada ? <i className="bi bi-check" /> : bloqueada ? <i className="bi bi-lock" /> : e.orden}
                    </div>
                    <div style={{ fontSize:"0.6rem",textAlign:"center",color:activa ? "var(--text)" : "var(--muted)",fontWeight:activa ? 700 : 400,lineHeight:1.2,maxWidth:70 }}>
                      {e.nombre}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
            {/* Botón avanzar etapa */}
            {!esUltimaEtapa && otDetalle.estado === "abierta" && (
              <div className="ps-card">
                <div style={{ fontWeight:700,marginBottom:8,fontSize:"0.82rem" }}>Acción principal</div>
                {canUse(plan, "ot_etapas_completas") || etapaOrden === 1 ? (
                  <button className="ps-btn ps-btn-primary" style={{ width:"100%",justifyContent:"center" }}
                    onClick={() => avanzarEtapa(otDetalle.id)} disabled={savingEtapa}>
                    {savingEtapa ? "Avanzando…" : `Avanzar → ${etapas.find(e => e.orden === etapaOrden + 1)?.nombre || "Siguiente"}`}
                  </button>
                ) : (
                  <UpgradeBanner feature="etapas completas de OT" planRequerido="Pro" />
                )}
              </div>
            )}

            {/* Totales */}
            <div className="ps-card">
              <div style={{ fontWeight:700,marginBottom:8,fontSize:"0.82rem" }}>Totales</div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.78rem",color:"var(--text2)",marginBottom:4 }}>
                <span>Repuestos</span><span>${Number(otDetalle.total_repuestos).toFixed(2)}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.78rem",color:"var(--text2)",marginBottom:8 }}>
                <span>Mano de obra</span><span>${Number(otDetalle.total_mano_obra).toFixed(2)}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:"0.9rem",borderTop:"1px solid var(--border)",paddingTop:8 }}>
                <span>Total</span><span style={{ color:"var(--green)" }}>${Number(otDetalle.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Falla reportada */}
          <div className="ps-card" style={{ marginBottom:12 }}>
            <div style={{ fontWeight:700,marginBottom:8,fontSize:"0.82rem" }}>Falla reportada</div>
            <div style={{ fontSize:"0.8rem",color:"var(--text2)" }}>{otDetalle.equipo_falla_reportada}</div>
          </div>

          {/* Historial */}
          <div className="ps-card">
            <div style={{ fontWeight:700,marginBottom:12,fontSize:"0.82rem" }}>Historial de cambios</div>
            {otHistorial.length === 0
              ? <div style={{ color:"var(--muted)",fontSize:"0.78rem" }}>Sin registros</div>
              : otHistorial.map(h => (
                <div key={h.id} style={{ display:"flex",gap:10,marginBottom:8,paddingBottom:8,borderBottom:"1px solid var(--border)" }}>
                  <div style={{ width:7,height:7,borderRadius:"50%",background:"var(--green)",marginTop:5,flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:"0.78rem",fontWeight:600 }}>
                      {h.etapa_nueva} {h.etapa_anterior ? `← ${h.etapa_anterior}` : "(inicio)"}
                    </div>
                    <div style={{ fontSize:"0.68rem",color:"var(--muted)" }}>{new Date(h.creado_en).toLocaleString("es-AR")}</div>
                    {h.nota && <div style={{ fontSize:"0.72rem",color:"var(--text2)",marginTop:2 }}>{h.nota}</div>}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="Órdenes de Trabajo" subtitle="Gestión de OTs">
      <div className="ps-anim">
        <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" }}>
          <input className="ps-input" placeholder="Buscar OT, cliente, equipo…" style={{ maxWidth:260 }}
            value={buscar} onChange={e => setBuscar(e.target.value)}
            onKeyDown={e => e.key === "Enter" && cargarLista()} />
          <select className="ps-input" style={{ maxWidth:200 }} value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}>
            <option value="">Todas las etapas</option>
            {etapas.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
          <div style={{ flex:1 }} />
          <button className="ps-btn ps-btn-primary" onClick={abrirNuevo}>
            <i className="bi bi-plus-lg" /> Nueva OT
          </button>
        </div>

        <div className="ps-card" style={{ padding:0,overflow:"hidden" }}>
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>N° OT</th>
                  <th>Cliente</th>
                  <th>Equipo</th>
                  <th>Etapa</th>
                  <th>Ingreso</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Cargando…</td></tr>}
                {!loading && ots.length === 0 && <tr><td colSpan={7} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Sin órdenes de trabajo</td></tr>}
                {ots.map(ot => (
                  <tr key={ot.id} style={{ cursor:"pointer" }} onClick={() => { setVista(ot.id); }}>
                    <td style={{ fontWeight:700,fontFamily:"monospace" }}>{ot.numero_ot}</td>
                    <td>{ot.cliente_nombre || "—"}</td>
                    <td style={{ color:"var(--text2)" }}>{[ot.equipo_marca,ot.equipo_modelo].filter(Boolean).join(" ") || ot.equipo_falla_reportada?.slice(0,40)}</td>
                    <td>
                      <span className="ps-badge" style={{ background: ot.etapa_color + "22", color: ot.etapa_color }}>
                        {ot.etapa_nombre}
                      </span>
                    </td>
                    <td>{new Date(ot.creado_en).toLocaleDateString("es-AR")}</td>
                    <td style={{ fontWeight:600 }}>${Number(ot.total || 0).toFixed(2)}</td>
                    <td><i className="bi bi-chevron-right" style={{ color:"var(--muted)" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal nueva OT */}
        {modalNuevo && (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div className="ps-card" style={{ width:"100%",maxWidth:480 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                <div style={{ fontWeight:700,fontSize:"0.92rem" }}>Nueva Orden de Trabajo</div>
                <button className="ps-btn ps-btn-secondary" style={{ padding:"4px 10px" }} onClick={() => setModalNuevo(false)}>✕</button>
              </div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Cliente</label>
                <select className="ps-input" value={form.cliente_id||""} onChange={e=>setForm({...form,cliente_id:e.target.value})}>
                  <option value="">Sin cliente</option>
                  {clientes.filter(c=>c.activo).map(c=>(
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
                <div>
                  <label className="ps-label">Marca del equipo</label>
                  <input className="ps-input" value={form.equipo_marca||""} onChange={e=>setForm({...form,equipo_marca:e.target.value})} placeholder="Samsung, Apple…" />
                </div>
                <div>
                  <label className="ps-label">Modelo</label>
                  <input className="ps-input" value={form.equipo_modelo||""} onChange={e=>setForm({...form,equipo_modelo:e.target.value})} placeholder="S22, iPhone 14…" />
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">N° de serie / IMEI</label>
                <input className="ps-input" value={form.equipo_serie||""} onChange={e=>setForm({...form,equipo_serie:e.target.value})} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label className="ps-label">Falla reportada *</label>
                <textarea className="ps-input" rows={3} value={form.equipo_falla_reportada||""} onChange={e=>setForm({...form,equipo_falla_reportada:e.target.value})} placeholder="Describe el problema que reporta el cliente…" style={{ resize:"vertical" }} />
              </div>
              <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                <button className="ps-btn ps-btn-secondary" onClick={() => setModalNuevo(false)}>Cancelar</button>
                <button className="ps-btn ps-btn-primary" onClick={crearOT} disabled={saving || !form.equipo_falla_reportada}>
                  {saving ? "Creando…" : "Crear OT"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
