"use client";
// components/PortalShell.js
// Shell compartido para todas las páginas del portal tenant.
// Incluye sidebar, topbar y área de contenido.
// Uso: <PortalShell title="Título" subtitle="Sub">...contenido...</PortalShell>

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  { id: "dashboard",      path: "/portal/dashboard",              label: "Dashboard",         icon: "bi-grid-1x2",       section: "Principal" },
  { id: "clientes",       path: "/portal/dashboard/clientes",     label: "Clientes",          icon: "bi-people",         section: "Principal" },
  { id: "ot",             path: "/portal/dashboard/ot",           label: "Órdenes de Trabajo",icon: "bi-tools",          section: "Operaciones" },
  { id: "catalogo",       path: "/portal/dashboard/catalogo",     label: "Catálogo",          icon: "bi-box-seam",       section: "Operaciones" },
  { id: "inventario",     path: "/portal/dashboard/inventario",   label: "Inventario",        icon: "bi-archive",        section: "Operaciones", badge: "stock" },
  { id: "ventas",         path: "/portal/dashboard/ventas",       label: "Ventas",            icon: "bi-graph-up-arrow", section: "Comercial" },
  { id: "facturacion",    path: "/portal/dashboard/facturacion",  label: "Facturación",       icon: "bi-receipt",        section: "Comercial", planMin: "pro" },
  { id: "caja",           path: "/portal/dashboard/caja",         label: "Caja",              icon: "bi-cash-coin",      section: "Comercial" },
  { id: "comunicaciones", path: "/portal/dashboard/comunicaciones",label: "Comunicaciones",   icon: "bi-chat-dots",      section: "Comunicación", planMin: "pro" },
  { id: "equipo",         path: "/portal/dashboard/equipo",       label: "Equipo",            icon: "bi-people-fill",    section: "Gestión",  planMin: "pro" },
  { id: "proveedores",    path: "/portal/dashboard/proveedores",  label: "Proveedores",       icon: "bi-truck",          section: "Gestión",  planMin: "business" },
  { id: "settings",       path: "/portal/dashboard/settings",     label: "Configuración",     icon: "bi-gear",           section: "Sistema" },
];

const PLAN_ORDER = ["free", "pro", "business", "ia"];
const PLAN_LABELS = { free: "Free", pro: "Pro", business: "Business", ia: "Plan IA" };

function planOk(tenantPlan, planMin) {
  if (!planMin) return true;
  return PLAN_ORDER.indexOf(tenantPlan) >= PLAN_ORDER.indexOf(planMin);
}

export default function PortalShell({ title, subtitle, children, badgeInventario = 0 }) {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed]     = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const menuRef = useRef(null);

  const tenant = {
    nombre: session?.user?.tenantNombre || "Mi negocio",
    rubro:  session?.user?.tenantRubro  || "",
    plan:   session?.user?.tenantPlan   || "free",
  };
  const userName    = session?.user?.name  || "";
  const userImage   = session?.user?.image || null;
  const userInitial = userName[0]?.toUpperCase() || "?";

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuUsuario(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (status === "loading") return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"var(--bg)" }}>
      <div style={{ fontSize:"0.82rem", color:"var(--muted)" }}>Cargando…</div>
    </div>
  );

  if (status === "unauthenticated") {
    router.push("/portal");
    return null;
  }

  // Agrupar nav items por sección
  const sections = [];
  let lastSection = null;
  for (const item of NAV_ITEMS) {
    if (item.section !== lastSection) {
      sections.push({ label: item.section, items: [] });
      lastSection = item.section;
    }
    sections[sections.length - 1].items.push(item);
  }

  const isActive = (path) => {
    if (path === "/portal/dashboard") return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      <div className="ps-wrap">

        {/* ── SIDEBAR ── */}
        <nav className={`ps-sb${collapsed ? " collapsed" : ""}`}>

          <div className="ps-sb-brand" onClick={() => setCollapsed(!collapsed)}>
            <div className="ps-sb-logo-mark">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="16" height="16">
                <rect x="0" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".3"/>
                <rect x="0" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".55"/>
                <rect x="0" y="0"  width="6" height="6" rx="1.5" fill="white"/>
                <rect x="8" y="0"  width="6" height="6" rx="1.5" fill="white"/>
                <rect x="8" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".55"/>
                <rect x="16" y="0" width="6" height="6" rx="1.5" fill="#B08A55"/>
              </svg>
            </div>
            <div className="ps-sb-texts">
              <div className="ps-sb-nombre">{tenant.nombre}</div>
              <div className="ps-sb-rubro">{tenant.rubro}</div>
            </div>
          </div>

          <div className="ps-sb-scroll">
            {sections.map(sec => (
              <div key={sec.label}>
                <div className="ps-sb-sec">{sec.label}</div>
                {sec.items.map(item => {
                  const disponible = planOk(tenant.plan, item.planMin);
                  const activo     = isActive(item.path);
                  const badge      = item.badge === "stock" && badgeInventario > 0 ? badgeInventario : null;
                  return (
                    <div
                      key={item.id}
                      className={`ps-ni${activo ? " on" : ""}${!disponible ? " locked" : ""}`}
                      onClick={() => disponible && router.push(item.path)}
                      title={!disponible ? `Requiere plan ${PLAN_LABELS[item.planMin]}` : item.label}
                    >
                      <span className="ps-ni-ic"><i className={`bi ${item.icon}`} /></span>
                      <span className="ps-ni-txt">{item.label}</span>
                      {badge && <span className="ps-ni-badge red">{badge}</span>}
                      {!disponible && <i className="bi bi-lock ps-ni-lock" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="ps-sb-foot" ref={menuRef}>
            <div className="ps-sb-user" onClick={() => setMenuUsuario(m => !m)}>
              {userImage
                ? <img src={userImage} className="ps-av-img" alt="" />
                : <div className="ps-av">{userInitial}</div>
              }
              <div className="ps-sb-texts">
                <div className="ps-sb-uname">{userName}</div>
                <div className="ps-sb-urole">{PLAN_LABELS[tenant.plan] || tenant.plan}</div>
              </div>
            </div>
            {menuUsuario && (
              <div className="ps-sb-menu">
                <div className="ps-sb-menu-item" onClick={() => router.push("/portal/dashboard/settings")}>
                  <i className="bi bi-gear" /> Configuración
                </div>
                <div className="ps-sb-menu-item danger" onClick={() => signOut({ callbackUrl: "/portal" })}>
                  <i className="bi bi-box-arrow-right" /> Cerrar sesión
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* ── MAIN ── */}
        <div className="ps-main">
          <div className="ps-topbar">
            <div>
              <span className="ps-tb-title">{title}</span>
              {subtitle && <span className="ps-tb-sub">{subtitle}</span>}
            </div>
            <div style={{ flex: 1 }} />
            <span className={`ps-plan-badge ps-plan-${tenant.plan}`}>
              {PLAN_LABELS[tenant.plan] || tenant.plan}
            </span>
          </div>

          <div className="ps-content">
            {children}
          </div>
        </div>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #1A7A4A; --green-l: #E8F5EE; --green-m: #3A9E70;
          --gold: #B08A55; --gold-l: #FDF3E0;
          --bg: #F0F4F0; --white: #fff; --border: #E5E7EB;
          --text: #1F2937; --text2: #4B5563; --sub: #6B7280; --muted: #9CA3AF;
          --red: #D9534F; --red-bg: #FDF2F2;
          --sh: 0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.04);
          --r: 11px; --r-sm: 7px;
        }
        body { font-family: 'Inter','Segoe UI',system-ui,sans-serif; background: var(--bg); color: var(--text); font-size: 13px; }

        .ps-wrap { display: flex; height: 100vh; overflow: hidden; }

        /* Sidebar */
        .ps-sb { width: 230px; min-width: 230px; background: var(--green); display: flex; flex-direction: column; height: 100vh; overflow: hidden; transition: width .2s, min-width .2s; flex-shrink: 0; }
        .ps-sb.collapsed { width: 52px; min-width: 52px; }
        .ps-sb-brand { display: flex; align-items: center; gap: 10px; padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,.15); flex-shrink: 0; cursor: pointer; overflow: hidden; }
        .ps-sb-logo-mark { width: 30px; height: 30px; flex-shrink: 0; background: rgba(255,255,255,.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .ps-sb-texts { overflow: hidden; white-space: nowrap; transition: opacity .15s, max-width .2s; max-width: 180px; }
        .collapsed .ps-sb-texts { opacity: 0; max-width: 0; }
        .ps-sb-nombre { font-size: 0.82rem; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; }
        .ps-sb-rubro  { font-size: 0.62rem; color: rgba(255,255,255,.6); margin-top: 1px; }
        .ps-sb-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 8px 0; scrollbar-width: none; }
        .ps-sb-scroll::-webkit-scrollbar { display: none; }
        .ps-sb-sec { font-size: 0.58rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.4); padding: 10px 14px 3px; white-space: nowrap; overflow: hidden; }
        .collapsed .ps-sb-sec { opacity: 0; height: 0; padding: 0; }

        .ps-ni { display: flex; align-items: center; gap: 9px; padding: 7px 12px; margin: 1px 6px; border-radius: var(--r-sm); color: rgba(255,255,255,.8); cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: background .12s; white-space: nowrap; overflow: hidden; }
        .ps-ni:hover:not(.locked) { background: rgba(255,255,255,.15); }
        .ps-ni.on { background: rgba(255,255,255,.2); color: #fff; font-weight: 600; }
        .ps-ni.locked { opacity: 0.45; cursor: default; }
        .ps-ni-ic { font-size: 0.92rem; flex-shrink: 0; width: 18px; text-align: center; }
        .ps-ni-txt { flex: 1; overflow: hidden; transition: opacity .15s, max-width .2s; max-width: 140px; }
        .collapsed .ps-ni-txt { opacity: 0; max-width: 0; }
        .ps-ni-badge { font-size: 0.56rem; font-weight: 700; padding: 1px 5px; border-radius: 9px; flex-shrink: 0; }
        .ps-ni-badge.red { background: #D9534F; color: #fff; }
        .ps-ni-lock { font-size: 0.7rem; color: rgba(255,255,255,.4); flex-shrink: 0; }
        .collapsed .ps-ni-badge, .collapsed .ps-ni-lock { display: none; }

        .ps-sb-foot { border-top: 1px solid rgba(255,255,255,.15); padding: 8px 6px; flex-shrink: 0; position: relative; }
        .ps-sb-user { display: flex; align-items: center; gap: 9px; padding: 6px 8px; border-radius: var(--r-sm); cursor: pointer; transition: background .12s; overflow: hidden; }
        .ps-sb-user:hover { background: rgba(255,255,255,.1); }
        .ps-av { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,.2); color: #fff; font-size: 0.72rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ps-av-img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .ps-sb-uname { font-size: 0.78rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ps-sb-urole { font-size: 0.6rem; color: rgba(255,255,255,.5); margin-top: 1px; }
        .ps-sb-menu { position: absolute; bottom: calc(100% + 6px); left: 6px; right: 6px; background: var(--white); border: 1px solid var(--border); border-radius: var(--r); box-shadow: var(--sh); overflow: hidden; z-index: 100; }
        .ps-sb-menu-item { display: flex; align-items: center; gap: 8px; padding: 10px 14px; cursor: pointer; font-size: 0.8rem; color: var(--text2); transition: background .12s; }
        .ps-sb-menu-item:hover { background: var(--bg); }
        .ps-sb-menu-item.danger { color: var(--red); }
        .ps-sb-menu-item.danger:hover { background: var(--red-bg); }

        /* Main */
        .ps-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
        .ps-topbar { height: 50px; background: var(--white); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; padding: 0 20px; flex-shrink: 0; }
        .ps-tb-title { font-size: 0.92rem; font-weight: 700; color: var(--text); }
        .ps-tb-sub { font-size: 0.78rem; color: var(--muted); margin-left: 8px; }
        .ps-plan-badge { font-size: 0.65rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
        .ps-plan-free     { background: #F3F4F6; color: #6B7280; }
        .ps-plan-pro      { background: var(--green-l); color: var(--green); }
        .ps-plan-business { background: #EDF1F6; color: #506886; }
        .ps-plan-ia       { background: var(--gold-l); color: #7A5800; }
        .ps-content { flex: 1; overflow-y: auto; padding: 20px; }
        .ps-content::-webkit-scrollbar { width: 4px; }
        .ps-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        /* Cards reutilizables */
        .ps-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--r); padding: 16px 18px; box-shadow: var(--sh); }
        .ps-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ps-g3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .ps-g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

        /* Tabla */
        .ps-table-wrap { overflow-x: auto; }
        .ps-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .ps-table th { text-align: left; padding: 8px 12px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); border-bottom: 1px solid var(--border); background: var(--bg); }
        .ps-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text2); vertical-align: middle; }
        .ps-table tr:last-child td { border-bottom: none; }
        .ps-table tr:hover td { background: #f9fafb; }

        /* Badges */
        .ps-badge { display: inline-flex; align-items: center; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
        .ps-badge-green  { background: var(--green-l); color: var(--green); }
        .ps-badge-red    { background: var(--red-bg); color: var(--red); }
        .ps-badge-amber  { background: var(--gold-l); color: #7A5800; }
        .ps-badge-gray   { background: #F3F4F6; color: #6B7280; }
        .ps-badge-blue   { background: #EDF1F6; color: #506886; }

        /* Botones */
        .ps-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: var(--r-sm); font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; transition: opacity .12s; }
        .ps-btn:hover { opacity: .85; }
        .ps-btn-primary { background: var(--green); color: #fff; }
        .ps-btn-secondary { background: var(--bg); color: var(--text2); border: 1px solid var(--border); }
        .ps-btn-danger { background: var(--red-bg); color: var(--red); border: 1px solid #F5C6C5; }

        /* Input */
        .ps-input { width: 100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 7px 10px; font-size: 0.8rem; font-family: inherit; color: var(--text); background: var(--white); outline: none; transition: border-color .12s; }
        .ps-input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(26,122,74,.1); }
        .ps-label { display: block; font-size: 0.72rem; font-weight: 600; color: var(--text2); margin-bottom: 4px; }

        /* Upgrade banner */
        .ps-upgrade { background: var(--gold-l); border: 1px solid #E8D5AF; border-radius: var(--r); padding: 14px 18px; display: flex; align-items: flex-start; gap: 12px; }
        .ps-upgrade i { color: var(--gold); font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
        .ps-upgrade-title { font-size: 0.82rem; font-weight: 700; color: #7A5800; margin-bottom: 2px; }
        .ps-upgrade-sub { font-size: 0.75rem; color: #A07040; }

        /* Animación */
        @keyframes ps-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .ps-anim { animation: ps-fadein .18s ease; }
      `}</style>
    </>
  );
}

// ── Banner de upgrade para features bloqueadas ─────────────────────
export function UpgradeBanner({ feature, planRequerido = "Pro" }) {
  return (
    <div className="ps-upgrade ps-anim">
      <i className="bi bi-lock-fill" />
      <div>
        <div className="ps-upgrade-title">Disponible en plan {planRequerido}</div>
        <div className="ps-upgrade-sub">
          Actualizá tu plan para acceder a {feature || "esta funcionalidad"}.
        </div>
      </div>
    </div>
  );
}
