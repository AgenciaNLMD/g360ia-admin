"use client";
// app/portal/dashboard/page.js

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import { PLAN_LABELS } from "@/lib/plan-guard";

const MODULOS_CARDS = [
  { id:"clientes",        label:"Clientes",          icon:"bi-people",          href:"/portal/dashboard/clientes" },
  { id:"ot",             label:"Órdenes de trabajo", icon:"bi-tools",           href:"/portal/dashboard/ot" },
  { id:"catalogo",       label:"Catálogo",           icon:"bi-box-seam",        href:"/portal/dashboard/catalogo" },
  { id:"inventario",     label:"Inventario",         icon:"bi-archive",         href:"/portal/dashboard/inventario" },
  { id:"ventas",         label:"Ventas",             icon:"bi-cart3",           href:"/portal/dashboard/ventas" },
  { id:"facturacion",    label:"Facturación ARCA",   icon:"bi-receipt",         href:"/portal/dashboard/facturacion" },
  { id:"caja",           label:"Caja",               icon:"bi-cash-stack",      href:"/portal/dashboard/caja" },
  { id:"comunicaciones", label:"Comunicaciones",     icon:"bi-whatsapp",        href:"/portal/dashboard/comunicaciones" },
  { id:"equipo",         label:"Equipo",             icon:"bi-people-fill",     href:"/portal/dashboard/equipo" },
  { id:"proveedores",    label:"Proveedores",        icon:"bi-truck",           href:"/portal/dashboard/proveedores" },
];

export default function PortalDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div style={{ minHeight:"100vh",background:"#F0F4F0",display:"flex",alignItems:"center",justifyContent:"center",color:"#9CA3AF",fontSize:"0.85rem" }}>
        Cargando...
      </div>
    );
  }
  if (status === "unauthenticated") {
    if (typeof window !== "undefined") window.location.href = "/portal";
    return null;
  }

  const tenant = {
    nombre: session?.user?.tenantNombre || "Mi negocio",
    rubro:  session?.user?.tenantRubro  || "",
    plan:   session?.user?.tenantPlan   || "free",
  };

  return (
    <PortalShell title="Dashboard" subtitle={`${tenant.rubro}${tenant.rubro ? " · " : ""}Plan ${PLAN_LABELS[tenant.plan] || tenant.plan}`}>
      <div className="ps-anim">

        {/* Bienvenida */}
        <div style={{ marginBottom:20 }}>
          <h1 style={{ fontSize:"1.25rem",fontWeight:700,color:"var(--text)",marginBottom:4 }}>
            Bienvenido, {tenant.nombre}
          </h1>
          <p style={{ fontSize:"0.82rem",color:"var(--muted)" }}>
            {tenant.rubro}{tenant.rubro ? " · " : ""}Plan {PLAN_LABELS[tenant.plan] || tenant.plan}
          </p>
        </div>

        {/* Panel MAIA */}
        <div style={{
          background:"#1C3D2E",borderRadius:"var(--r)",padding:"16px 18px",
          marginBottom:20,color:"rgba(255,255,255,.9)"
        }}>
          <div style={{ display:"flex",alignItems:"center",gap:7,fontSize:"0.65rem",fontWeight:700,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:10 }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:"#4EC88A" }} />
            Asistente IA · MAIA
          </div>
          <div style={{ fontSize:"0.82rem",lineHeight:1.55,color:"rgba(255,255,255,.85)" }}>
            Tu espacio está listo. A medida que uses la plataforma, voy a generarte sugerencias personalizadas para tu negocio.
          </div>
        </div>

        {/* Módulos */}
        <div style={{ fontSize:"0.72rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10 }}>
          Accesos rápidos
        </div>
        <div className="ps-g3" style={{ marginBottom:20 }}>
          {MODULOS_CARDS.map(m => (
            <div key={m.id} className="ps-card" style={{ cursor:"pointer" }}
              onClick={() => router.push(m.href)}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:34,height:34,borderRadius:8,background:"var(--green-l)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <i className={`bi ${m.icon}`} style={{ color:"var(--green)",fontSize:"0.95rem" }} />
                </div>
                <div style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--text)" }}>
                  {m.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade banner para free */}
        {tenant.plan === "free" && (
          <div style={{ background:"var(--gold-l)",border:"1px solid #E8D5AF",borderRadius:"var(--r)",padding:"14px 16px",display:"flex",alignItems:"flex-start",gap:10 }}>
            <i className="bi bi-stars" style={{ color:"var(--gold)",fontSize:"1rem",flexShrink:0,marginTop:1 }} />
            <div>
              <div style={{ fontSize:"0.82rem",fontWeight:600,color:"#7A5800",marginBottom:3 }}>
                Expandí tu negocio con más módulos
              </div>
              <div style={{ fontSize:"0.75rem",color:"#92680A",lineHeight:1.5 }}>
                Actualizá tu plan para acceder a facturación ARCA, WhatsApp, proveedores y el asistente IA completo.
              </div>
            </div>
          </div>
        )}

      </div>
    </PortalShell>
  );
}
