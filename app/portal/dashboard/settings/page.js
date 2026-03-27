"use client";
// app/portal/dashboard/settings/page.js

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PortalShell from "@/components/PortalShell";
import { canUse, PLAN_LABELS } from "@/lib/plan-guard";

export default function SettingsPage() {
  const { data: session } = useSession();
  const plan = session?.user?.tenantPlan || "free";

  const [tab, setTab]       = useState("negocio");
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => { cargar(); }, []);
  useEffect(() => { if (data) initForm(); }, [tab, data]);

  async function cargar() {
    setLoading(true);
    const res = await fetch("/api/portal/settings");
    const d   = await res.json();
    if (d.ok) setData(d);
    setLoading(false);
  }

  function initForm() {
    if (!data) return;
    if (tab === "negocio") {
      setForm({
        nombre:    data.tenant?.nombre || "",
        telefono:  data.tenant?.telefono || "",
        direccion: data.config?.direccion || "",
      });
    } else if (tab === "arca") {
      setForm({
        cuit:             data.arca?.cuit || "",
        punto_venta:      data.arca?.punto_venta || 1,
        condicion_fiscal: data.arca?.condicion_fiscal || "RI",
      });
    } else if (tab === "mp") {
      setForm({
        modo:                  data.mp?.modo || "sandbox",
        access_token_prod:     "",
        access_token_sandbox:  "",
      });
    } else if (tab === "whatsapp") {
      setForm({
        numero_whatsapp:   data.wa?.numero_whatsapp || "",
        evolution_api_url: data.wa?.evolution_api_url || "",
        evolution_api_key: "",
        instancia_nombre:  data.wa?.instancia_nombre || "",
      });
    }
  }

  async function guardar() {
    setSaving(true); setError(""); setSaved(false);
    const res = await fetch("/api/portal/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seccion: tab, ...form }),
    });
    const d = await res.json();
    setSaving(false);
    if (d.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); cargar(); }
    else setError(d.error || "Error al guardar");
  }

  const TABS = [
    { id:"negocio",  label:"Negocio",      icon:"bi-shop" },
    { id:"arca",     label:"ARCA",         icon:"bi-receipt",    planMin:"pro" },
    { id:"mp",       label:"MercadoPago",  icon:"bi-credit-card",planMin:"pro" },
    { id:"whatsapp", label:"WhatsApp",     icon:"bi-whatsapp",   planMin:"pro" },
    { id:"plan",     label:"Mi plan",      icon:"bi-star" },
  ].filter(t => !t.planMin || canUse(plan, "facturacion_arca") || t.id === "plan" || t.id === "negocio");

  if (loading) return (
    <PortalShell title="Configuración">
      <div style={{ color:"var(--muted)",padding:24 }}>Cargando…</div>
    </PortalShell>
  );

  return (
    <PortalShell title="Configuración" subtitle="Ajustes del negocio">
      <div className="ps-anim" style={{ display:"flex",gap:20 }}>

        {/* Sidebar de tabs */}
        <div style={{ width:200,flexShrink:0 }}>
          <div className="ps-card" style={{ padding:8 }}>
            {[
              { id:"negocio",  label:"Datos del negocio", icon:"bi-shop" },
              { id:"arca",     label:"ARCA / Facturación", icon:"bi-receipt" },
              { id:"mp",       label:"MercadoPago",       icon:"bi-credit-card" },
              { id:"whatsapp", label:"WhatsApp",          icon:"bi-whatsapp" },
              { id:"plan",     label:"Mi plan",           icon:"bi-star" },
            ].map(t => (
              <div key={t.id}
                style={{
                  display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                  borderRadius:"var(--r-sm)",cursor:"pointer",
                  fontSize:"0.8rem",fontWeight: tab===t.id ? 700 : 400,
                  background: tab===t.id ? "var(--green-l)" : "transparent",
                  color: tab===t.id ? "var(--green)" : "var(--text2)",
                  marginBottom:2,
                }}
                onClick={() => setTab(t.id)}>
                <i className={`bi ${t.icon}`} style={{ fontSize:"0.85rem" }} />
                {t.label}
              </div>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div style={{ flex:1, minWidth:0 }}>
          {error && <div style={{ background:"var(--red-bg)",color:"var(--red)",padding:"8px 12px",borderRadius:"var(--r-sm)",marginBottom:12,fontSize:"0.78rem" }}>{error}</div>}
          {saved && <div style={{ background:"var(--green-l)",color:"var(--green)",padding:"8px 12px",borderRadius:"var(--r-sm)",marginBottom:12,fontSize:"0.78rem",fontWeight:600 }}><i className="bi bi-check-circle" style={{ marginRight:6 }} />Guardado correctamente</div>}

          {/* Negocio */}
          {tab === "negocio" && (
            <div className="ps-card" style={{ maxWidth:480 }}>
              <div style={{ fontWeight:700,marginBottom:16,fontSize:"0.88rem" }}>Datos del negocio</div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Nombre del negocio</label>
                <input className="ps-input" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Teléfono</label>
                <input className="ps-input" value={form.telefono||""} onChange={e=>setForm({...form,telefono:e.target.value})} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label className="ps-label">Dirección</label>
                <input className="ps-input" value={form.direccion||""} onChange={e=>setForm({...form,direccion:e.target.value})} />
              </div>
              <button className="ps-btn ps-btn-primary" onClick={guardar} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          )}

          {/* ARCA */}
          {tab === "arca" && (
            <div className="ps-card" style={{ maxWidth:480 }}>
              <div style={{ fontWeight:700,marginBottom:4,fontSize:"0.88rem" }}>Configuración ARCA (ex-AFIP)</div>
              <div style={{ fontSize:"0.75rem",color:"var(--muted)",marginBottom:16 }}>
                Necesitás un certificado digital emitido por AFIP vinculado a tu CUIT.
              </div>
              {!canUse(plan, "facturacion_arca") ? (
                <div style={{ background:"var(--gold-l)",border:"1px solid #E8D5AF",borderRadius:"var(--r)",padding:"12px 14px",fontSize:"0.78rem",color:"#7A5800" }}>
                  <i className="bi bi-lock" style={{ marginRight:6 }} />Disponible desde plan Pro
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:12 }}>
                    <label className="ps-label">CUIT del emisor</label>
                    <input className="ps-input" value={form.cuit||""} placeholder="20-12345678-9"
                      onChange={e=>setForm({...form,cuit:e.target.value})} />
                  </div>
                  <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
                    <div>
                      <label className="ps-label">Punto de venta</label>
                      <input className="ps-input" type="number" min={1} value={form.punto_venta||1}
                        onChange={e=>setForm({...form,punto_venta:Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="ps-label">Condición fiscal</label>
                      <select className="ps-input" value={form.condicion_fiscal||"RI"}
                        onChange={e=>setForm({...form,condicion_fiscal:e.target.value})}>
                        <option value="RI">Responsable Inscripto</option>
                        <option value="MT">Monotributista</option>
                        <option value="EX">Exento</option>
                      </select>
                    </div>
                  </div>
                  {data.arca && (
                    <div style={{ background:"var(--green-l)",border:"1px solid var(--em-mid)",borderRadius:"var(--r-sm)",padding:"8px 12px",fontSize:"0.75rem",color:"var(--green)",marginBottom:12 }}>
                      <i className="bi bi-check-circle" style={{ marginRight:6 }} />
                      ARCA configurado — CUIT: {data.arca.cuit || "—"} · PV: {data.arca.punto_venta}
                    </div>
                  )}
                  <button className="ps-btn ps-btn-primary" onClick={guardar} disabled={saving}>
                    {saving ? "Guardando…" : "Guardar configuración ARCA"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* MercadoPago */}
          {tab === "mp" && (
            <div className="ps-card" style={{ maxWidth:480 }}>
              <div style={{ fontWeight:700,marginBottom:4,fontSize:"0.88rem" }}>MercadoPago</div>
              <div style={{ fontSize:"0.75rem",color:"var(--muted)",marginBottom:16 }}>
                Obtené tu Access Token desde tu cuenta de MercadoPago → Mis apps.
              </div>
              {!canUse(plan, "mercadopago") ? (
                <div style={{ background:"var(--gold-l)",border:"1px solid #E8D5AF",borderRadius:"var(--r)",padding:"12px 14px",fontSize:"0.78rem",color:"#7A5800" }}>
                  <i className="bi bi-lock" style={{ marginRight:6 }} />Disponible desde plan Pro
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:12 }}>
                    <label className="ps-label">Modo</label>
                    <select className="ps-input" value={form.modo||"sandbox"}
                      onChange={e=>setForm({...form,modo:e.target.value})}>
                      <option value="sandbox">Sandbox (pruebas)</option>
                      <option value="produccion">Producción</option>
                    </select>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label className="ps-label">Access Token Producción</label>
                    <input className="ps-input" type="password" value={form.access_token_prod||""}
                      placeholder={data.mp?.access_token_prod ? "••• configurado" : "APP_USR-..."}
                      onChange={e=>setForm({...form,access_token_prod:e.target.value})} />
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label className="ps-label">Access Token Sandbox</label>
                    <input className="ps-input" type="password" value={form.access_token_sandbox||""}
                      placeholder={data.mp?.access_token_sandbox ? "••• configurado" : "TEST-..."}
                      onChange={e=>setForm({...form,access_token_sandbox:e.target.value})} />
                  </div>
                  <div style={{ marginBottom:16,background:"var(--bg)",borderRadius:"var(--r-sm)",padding:"8px 12px",fontSize:"0.72rem" }}>
                    <div style={{ fontWeight:700,marginBottom:4 }}>URL del webhook</div>
                    <code style={{ wordBreak:"break-all",color:"var(--text2)" }}>
                      {typeof window !== "undefined" ? window.location.origin : "https://app.gestion360ia.com.ar"}
                      /api/portal/mp/webhook?tenant_id={session?.user?.tenantId}
                    </code>
                  </div>
                  <button className="ps-btn ps-btn-primary" onClick={guardar} disabled={saving}>
                    {saving ? "Guardando…" : "Guardar configuración MP"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* WhatsApp */}
          {tab === "whatsapp" && (
            <div className="ps-card" style={{ maxWidth:480 }}>
              <div style={{ fontWeight:700,marginBottom:4,fontSize:"0.88rem" }}>WhatsApp (Evolution API)</div>
              <div style={{ fontSize:"0.75rem",color:"var(--muted)",marginBottom:16 }}>
                Configurá la instancia de Evolution API vinculada a tu número de WhatsApp.
              </div>
              {!canUse(plan, "comunicaciones_auto") ? (
                <div style={{ background:"var(--gold-l)",border:"1px solid #E8D5AF",borderRadius:"var(--r)",padding:"12px 14px",fontSize:"0.78rem",color:"#7A5800" }}>
                  <i className="bi bi-lock" style={{ marginRight:6 }} />Disponible desde plan Pro
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:12 }}>
                    <label className="ps-label">Número de WhatsApp</label>
                    <input className="ps-input" value={form.numero_whatsapp||""} placeholder="5491112345678"
                      onChange={e=>setForm({...form,numero_whatsapp:e.target.value})} />
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label className="ps-label">URL de Evolution API</label>
                    <input className="ps-input" value={form.evolution_api_url||""} placeholder="https://evolution.tudominio.com"
                      onChange={e=>setForm({...form,evolution_api_url:e.target.value})} />
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label className="ps-label">API Key</label>
                    <input className="ps-input" type="password" value={form.evolution_api_key||""}
                      placeholder={data.wa?.instancia_nombre ? "••• configurado" : ""}
                      onChange={e=>setForm({...form,evolution_api_key:e.target.value})} />
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label className="ps-label">Nombre de instancia</label>
                    <input className="ps-input" value={form.instancia_nombre||""} placeholder="mi-negocio-wa"
                      onChange={e=>setForm({...form,instancia_nombre:e.target.value})} />
                  </div>
                  <button className="ps-btn ps-btn-primary" onClick={guardar} disabled={saving}>
                    {saving ? "Guardando…" : "Guardar configuración WhatsApp"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Plan */}
          {tab === "plan" && (
            <div className="ps-card" style={{ maxWidth:480 }}>
              <div style={{ fontWeight:700,marginBottom:16,fontSize:"0.88rem" }}>Tu plan actual</div>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
                <div style={{
                  width:48,height:48,borderRadius:"var(--r)",
                  background:"var(--green-l)",display:"flex",alignItems:"center",justifyContent:"center"
                }}>
                  <i className="bi bi-star-fill" style={{ color:"var(--green)",fontSize:"1.2rem" }} />
                </div>
                <div>
                  <div style={{ fontSize:"1.2rem",fontWeight:800 }}>{PLAN_LABELS[plan] || plan}</div>
                  <div style={{ fontSize:"0.75rem",color:"var(--muted)" }}>Plan activo en tu cuenta</div>
                </div>
              </div>
              <div style={{ background:"var(--bg)",borderRadius:"var(--r)",padding:"12px 14px",fontSize:"0.78rem",color:"var(--text2)" }}>
                Para cambiar de plan o conocer los precios, contactá a soporte o visitá{" "}
                <strong>gestion360ia.com.ar</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
