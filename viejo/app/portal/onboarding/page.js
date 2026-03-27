"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

const RUBROS = [
  { id: "hotel",         label: "Hotel / Cabañas",       icon: "🏨" },
  { id: "salud",         label: "Consultorio / Clínica",  icon: "🏥" },
  { id: "salon",         label: "Salón de Eventos",       icon: "🎉" },
  { id: "inmobiliaria",  label: "Inmobiliaria",            icon: "🏢" },
  { id: "restaurante",   label: "Restaurante",             icon: "🍽️" },
  { id: "profesional",   label: "Contador / Abogado",      icon: "⚖️" },
  { id: "seguros",       label: "Gestor de Seguros",       icon: "🛡️" },
  { id: "distribuidora", label: "Distribuidora",           icon: "🚚" },
  { id: "tecnico",       label: "Servicio Técnico",        icon: "🔧" },
  { id: "govtech",       label: "GovTech / Municipios",    icon: "🏛️" },
];

const PLANES = [
  {
    id: "starter",
    label: "Starter",
    precio: "Gratis",
    desc: "Dashboard básico · CRM limitado · 1 sugerencia IA por día",
    activo: true,
  },
  {
    id: "pro",
    label: "Pro",
    precio: "Próximamente",
    desc: "Todo Starter · WhatsApp · Facturación · Estadísticas IA",
    activo: false,
    popular: true,
  },
  {
    id: "plan_ia",
    label: "Plan IA",
    precio: "Próximamente",
    desc: "Todo Pro · Skills IA completas · Sugerencias reactivas",
    activo: false,
  },
  {
    id: "enterprise",
    label: "Enterprise",
    precio: "A consultar",
    desc: "Multi-cuenta · White label · Módulos custom",
    activo: false,
  },
];

const PASOS = ["Tu negocio", "Tu rubro", "Tu plan", "Listo"];

export default function OnboardingPage() {
  const { data: session } = useSession();
  const [paso, setPaso]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const [form, setForm] = useState({
    nombre: "", empresa: "", telefono: "",
    web: "", instagram: "", rubro: "", plan: "starter",
  });

  const f = (v) => setForm(p => ({ ...p, ...v }));

  const guardar = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/portal/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: session?.user?.email }),
      });
      const data = await res.json();
      if (data.ok) {
        setPaso(4);
      } else {
        setError(data.error || "Error al guardar");
      }
    } catch {
      setError("Error de conexión");
    }
    setSaving(false);
  };

  return (
    <>
      <div style={{
        minHeight: "100vh", background: "#F0F4F0",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      }}>
        <div style={{ width: "100%", maxWidth: 480 }}>

          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "#1A7A4A", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="18" height="14">
                  <rect x="0" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".35"/>
                  <rect x="0" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
                  <rect x="0" y="0"  width="6" height="6" rx="1.5" fill="white"/>
                  <rect x="8" y="0"  width="6" height="6" rx="1.5" fill="white"/>
                  <rect x="8" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
                  <rect x="16" y="0" width="6" height="6" rx="1.5" fill="#B08A55"/>
                </svg>
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1F2937" }}>
                Gestión 360 <span style={{ color: "#B08A55" }}>iA</span>
              </div>
            </div>
          </div>

          {/* Steps */}
          {paso < 4 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.75rem" }}>
              {PASOS.slice(0, 3).map((label, i) => {
                const n = i + 1;
                const done   = paso > n;
                const active = paso === n;
                return (
                  <div key={n} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: 80 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: done || active ? "#1A7A4A" : "#fff",
                        border: done || active ? "none" : "1px solid #D1D5DB",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 600,
                        color: done || active ? "#fff" : "#9CA3AF",
                      }}>
                        {done ? "✓" : n}
                      </div>
                      <span style={{ fontSize: 10, color: active ? "#1A7A4A" : "#9CA3AF", fontWeight: active ? 600 : 400, textAlign: "center" }}>
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div style={{ width: 40, height: 1, background: paso > n ? "#1A7A4A" : "#E5E7EB", marginBottom: 18, flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Card */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "28px 28px 24px", boxShadow: "0 4px 24px rgba(15,23,42,.08)" }}>

            {/* ── PASO 1 — Datos del negocio ── */}
            {paso === 1 && (
              <>
                <h2 style={titulo}>Contanos sobre tu negocio</h2>
                <p style={subtitulo}>Esta información personaliza tu panel desde el día 1.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={lbl}>Email</label>
                    <input style={{ ...fi, background: "#F9FAFB", color: "#6B7280", cursor: "not-allowed" }} value={session?.user?.email || ""} disabled />
                  </div>
                  <div>
                    <label style={lbl}>Nombre completo *</label>
                    <input style={fi} placeholder="Ej: Juan García" value={form.nombre} onChange={e => f({ nombre: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Nombre del negocio o empresa *</label>
                    <input style={fi} placeholder="Ej: Hotel Aurora" value={form.empresa} onChange={e => f({ empresa: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Teléfono / WhatsApp</label>
                    <input style={fi} placeholder="+54 11 xxxx xxxx" value={form.telefono} onChange={e => f({ telefono: e.target.value })} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={lbl}>Sitio web</label>
                      <input style={fi} placeholder="www.minegocio.com" value={form.web} onChange={e => f({ web: e.target.value })} />
                    </div>
                    <div>
                      <label style={lbl}>Instagram</label>
                      <input style={fi} placeholder="@usuario" value={form.instagram} onChange={e => f({ instagram: e.target.value })} />
                    </div>
                  </div>
                </div>

                {error && <p style={errStyle}>{error}</p>}
                <button onClick={() => {
                  if (!form.nombre || !form.empresa) { setError("Completá nombre y empresa para continuar"); return; }
                  setError(""); setPaso(2);
                }} style={btnPrimary}>Continuar →</button>
              </>
            )}

            {/* ── PASO 2 — Rubro ── */}
            {paso === 2 && (
              <>
                <h2 style={titulo}>¿Cuál es tu rubro?</h2>
                <p style={subtitulo}>Elegí el que mejor describe tu negocio. Precarga los módulos de tu panel.</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1.25rem" }}>
                  {RUBROS.map(r => (
                    <div
                      key={r.id}
                      onClick={() => f({ rubro: r.id })}
                      style={{
                        padding: "10px 12px", borderRadius: 10,
                        border: `1px solid ${form.rubro === r.id ? "#1A7A4A" : "#E5E7EB"}`,
                        background: form.rubro === r.id ? "#E8F5EE" : "#fff",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                        transition: "all .12s",
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{r.icon}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: form.rubro === r.id ? 600 : 400, color: form.rubro === r.id ? "#1A7A4A" : "#374151" }}>
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>

                {error && <p style={errStyle}>{error}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPaso(1)} style={btnSecondary}>← Atrás</button>
                  <button onClick={() => {
                    if (!form.rubro) { setError("Elegí un rubro para continuar"); return; }
                    setError(""); setPaso(3);
                  }} style={{ ...btnPrimary, flex: 1, marginTop: 0 }}>Continuar →</button>
                </div>
              </>
            )}

            {/* ── PASO 3 — Plan ── */}
            {paso === 3 && (
              <>
                <h2 style={titulo}>Elegí tu plan</h2>
                <p style={subtitulo}>Empezá gratis y escalá cuando quieras.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.25rem" }}>
                  {PLANES.map(p => (
                    <div
                      key={p.id}
                      onClick={() => p.activo && f({ plan: p.id })}
                      style={{
                        padding: "12px 14px", borderRadius: 10,
                        border: `1px solid ${form.plan === p.id ? "#1A7A4A" : "#E5E7EB"}`,
                        background: !p.activo ? "#F9FAFB" : form.plan === p.id ? "#E8F5EE" : "#fff",
                        cursor: p.activo ? "pointer" : "not-allowed",
                        opacity: p.activo ? 1 : 0.55,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        transition: "all .12s",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: form.plan === p.id ? "#1A7A4A" : "#1F2937" }}>
                            {p.label}
                          </span>
                          {p.popular && (
                            <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "#E8F0F8", color: "#3A5A80", padding: "2px 7px", borderRadius: 20 }}>
                              Popular
                            </span>
                          )}
                          {!p.activo && <span style={{ fontSize: "0.65rem", color: "#9CA3AF" }}>🔒</span>}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: 2 }}>{p.desc}</div>
                      </div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: p.activo ? "#1A7A4A" : "#9CA3AF", flexShrink: 0, marginLeft: 12 }}>
                        {p.precio}
                      </div>
                    </div>
                  ))}
                </div>

                {error && <p style={errStyle}>{error}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPaso(2)} style={btnSecondary}>← Atrás</button>
                  <button onClick={guardar} disabled={saving} style={{ ...btnPrimary, flex: 1, marginTop: 0 }}>
                    {saving ? "Creando tu cuenta..." : "Crear mi cuenta →"}
                  </button>
                </div>
              </>
            )}

            {/* ── PASO 4 — Listo ── */}
            {paso === 4 && (
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>

                {/* Steps completados */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                  {PASOS.map((label, i) => {
                    const n = i + 1;
                    return (
                      <div key={n} style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: 64 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1A7A4A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff" }}>
                            ✓
                          </div>
                          <span style={{ fontSize: 9, color: "#1A7A4A", fontWeight: 600, textAlign: "center" }}>{label}</span>
                        </div>
                        {i < 3 && <div style={{ width: 20, height: 1, background: "#1A7A4A", marginBottom: 16, flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>

                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E8F5EE", border: "2px solid #1A7A4A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", margin: "0 auto 1.25rem" }}>
                  ✓
                </div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1F2937", marginBottom: 8 }}>
                  ¡Tu panel está listo!
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#6B7280", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                  <strong>{form.empresa}</strong> ya tiene su espacio en Gestión 360 iA.<br />
                  Los módulos de tu rubro están activados.
                </p>

                <button onClick={() => { window.location.href = "/portal/dashboard"; }} style={btnPrimary}>
                  Ir a mi panel →
                </button>
              </div>
            )}

          </div>

          <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#9CA3AF", marginTop: "1rem" }}>
            ¿Problemas? Escribinos a hola@gestion360ia.com.ar
          </p>

        </div>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter','Segoe UI',system-ui,sans-serif; }
        input:disabled { -webkit-text-fill-color: #6B7280; }
        input:focus { outline: none; border-color: #1A7A4A !important; box-shadow: 0 0 0 3px rgba(26,122,74,.1); }
      `}</style>
    </>
  );
}

const titulo    = { fontSize: "1.1rem", fontWeight: 700, color: "#1F2937", marginBottom: 4 };
const subtitulo = { fontSize: "0.82rem", color: "#6B7280", marginBottom: "1.25rem", lineHeight: 1.6 };
const lbl       = { display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#6B7280", marginBottom: 4 };
const fi        = { width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontFamily: "inherit", fontSize: "0.82rem", color: "#1F2937" };
const btnPrimary   = { display: "block", width: "100%", marginTop: "1.25rem", padding: "12px", background: "#1A7A4A", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const btnSecondary = { padding: "12px 16px", background: "#fff", color: "#374151", border: "1px solid #D1D5DB", borderRadius: 10, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 };
const errStyle     = { marginTop: 8, fontSize: "0.75rem", color: "#D9534F", textAlign: "center" };
