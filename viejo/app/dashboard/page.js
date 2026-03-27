"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import dynamic from "next/dynamic";

const ViewAdminOT            = dynamic(() => import("@/components/admin-views/ViewAdminOT"),            { ssr:false });
const ViewAdminCatalogo      = dynamic(() => import("@/components/admin-views/ViewAdminCatalogo"),      { ssr:false });
const ViewAdminInventario    = dynamic(() => import("@/components/admin-views/ViewAdminInventario"),    { ssr:false });
const ViewAdminVentas        = dynamic(() => import("@/components/admin-views/ViewAdminVentas"),        { ssr:false });
const ViewAdminFacturacion   = dynamic(() => import("@/components/admin-views/ViewAdminFacturacion"),   { ssr:false });
const ViewAdminCaja          = dynamic(() => import("@/components/admin-views/ViewAdminCaja"),          { ssr:false });
const ViewAdminComunicaciones= dynamic(() => import("@/components/admin-views/ViewAdminComunicaciones"),{ ssr:false });
const ViewAdminEquipo        = dynamic(() => import("@/components/admin-views/ViewAdminEquipo"),        { ssr:false });
const ViewAdminProveedores   = dynamic(() => import("@/components/admin-views/ViewAdminProveedores"),   { ssr:false });

// ── Temas de color del sidebar ────────────────────────────────────
const THEMES = {
  verde: {
    label: "Verde",      sub: "Predeterminado",
    sbBg: "#1A7A4A",     sbBrd: "rgba(255,255,255,.2)",  sbActive: "rgba(255,255,255,.2)",
    dark: true,          preview: ["#1A7A4A", "#2A9A60", "#1A7A4A"],
  },
  slate: {
    label: "Tiza",       sub: "Slate",
    sbBg: "linear-gradient(170deg,#7E8FA6 0%,#5C6E85 55%,#3A4A5C 100%)",
    sbBrd: "rgba(255,255,255,.15)", sbActive: "rgba(255,255,255,.18)",
    dark: true,          preview: ["#7E8FA6", "#5C6E85", "#3A4A5C"],
  },
  champagne: {
    label: "Champagne",  sub: "#03",
    sbBg: "linear-gradient(170deg,#F7D87C 0%,#C8922E 60%,#A87020 100%)",
    sbBrd: "rgba(0,0,0,.12)",       sbActive: "rgba(0,0,0,.12)",
    dark: false,         preview: ["#F7D87C", "#C8922E", "#A87020"],
  },
  teal: {
    label: "Teal",       sub: "→ Azul",
    sbBg: "linear-gradient(170deg,#1FC8A0 0%,#17B0A7 50%,#1499C2 100%)",
    sbBrd: "rgba(255,255,255,.18)", sbActive: "rgba(255,255,255,.18)",
    dark: true,          preview: ["#1FC8A0", "#17B0A7", "#1499C2"],
  },
};

const VIEWS = {
  dashboard:      ["Dashboard",           "Resumen general del sistema"],
  clientes:       ["Clientes",            "Tenants registrados"],
  crm:            ["CRM",                 "Leads, funnel y conversaciones"],
  equipo:         ["Equipo",              "Áreas y personal del equipo"],
  soporte:        ["Soporte",             "Tickets y atención a clientes"],
  modulos:        ["Módulos",             "Catálogo del sistema"],
  planes:         ["Planes",              "Gestión de suscripciones"],
  comunicaciones: ["Comunicaciones",      "Conversaciones con clientes"],
  seguimiento:    ["Seguimiento",         "Tareas y recordatorios"],
  alertas:        ["Alertas IA",          "Detecciones automáticas"],
  integraciones:  ["Integraciones",       "Conexiones externas"],
  auditoria:      ["Auditoría",           "Registro de actividad"],
  configuracion:  ["Configuración",       "Ajustes del sistema"],
  sistema:        ["Sistema",             "Usuarios, permisos y accesos"],
  perfil:         ["Mi perfil",           "Configuración de tu cuenta"],
  // ── Módulos Tenant ──
  m_ot:           ["Órdenes de Trabajo",  "OTs de tenants"],
  m_catalogo:     ["Catálogo",            "Productos y servicios del tenant"],
  m_inventario:   ["Inventario",          "Stock del tenant"],
  m_ventas:       ["Ventas",              "Comprobantes del tenant"],
  m_facturacion:  ["Facturación ARCA",    "Facturas electrónicas"],
  m_caja:         ["Caja",               "Cobros y caja diaria"],
  m_comunicaciones:["Comunicaciones WA",  "WhatsApp y plantillas"],
  m_equipo:       ["Técnicos",            "Equipo del tenant"],
  m_proveedores:  ["Proveedores",         "Proveedores y órdenes de compra"],
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [view, setView]   = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [menuPos, setMenuPos] = useState({ bottom: 0, left: 0, width: 0 });
  const [theme, setTheme]             = useState("slate");
  const [showPersonalizar, setShowPersonalizar] = useState(false);
  const [showRubroService, setShowRubroService] = useState(false);
  const [showSocialMedia, setShowSocialMedia]   = useState(false);
  const [stats, setStats] = useState({
    clientes_activos: null, conv_sin_asignar: null,
    tickets_urgentes: null, usuarios_pendientes: null,
  });
  const menuRef = useRef(null);
  const footRef = useRef(null);

  const nav = (id) => setView(id);
  const userName    = session?.user?.name || "Admin";
  const userInitial = userName[0]?.toUpperCase() || "A";
  const rol         = session?.user?.rol || "superadmin";
  const esVendedor  = rol === "vendedor";

  // Cargar y aplicar tema desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem("g360ia_admin_theme");
    if (saved && THEMES[saved]) applyTheme(saved, setTheme);
  }, []);

  useEffect(() => {
    fetch("/api/stats/sidebar").then(r=>r.json()).then(d=>{
      setStats({
        clientes_activos:    d.clientes_activos    ?? null,
        conv_sin_asignar:    d.conv_sin_asignar    ?? null,
        tickets_urgentes:    d.tickets_urgentes    ?? null,
        usuarios_pendientes: d.usuarios_pendientes ?? null,
      });
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuUsuario(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isCrmView   = view === "crm";
  const champagne   = theme === "champagne";
  const sbTxt       = champagne ? "rgba(60,30,0,.95)" : "#fff";
  const sbTxtDim    = champagne ? "rgba(60,30,0,.55)" : "rgba(255,255,255,.5)";

  return (
    <>
      <div className="g360-wrap">
        {/* SIDEBAR */}
        <nav id="sb" className={collapsed ? "collapsed" : ""} data-theme={theme}>
          <div className="sb-logo">
            <div className="sb-logo-mark" onClick={()=>setCollapsed(!collapsed)} style={{cursor:"pointer"}}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="18" height="18">
                <rect x="0" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".3"/>
                <rect x="0" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".55"/>
                <rect x="0" y="0"  width="6" height="6" rx="1.5" fill="white"/>
                <rect x="8" y="0"  width="6" height="6" rx="1.5" fill="white"/>
                <rect x="8" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".55"/>
                <rect x="16" y="0" width="6" height="6" rx="1.5" fill="#B08A55"/>
              </svg>
            </div>
            <div className="sb-logo-texts">
              <div className="sb-brand">Gestión 360 iA</div>
              <div className="sb-brand-sub">{esVendedor ? "Panel Vendedor" : "Panel Admin"}</div>
            </div>
          </div>

          <div className="sb-scroll">
            {!esVendedor && (
              <>
                <div className="sb-sec">Principal</div>
                <NavItem id="dashboard" icon="bi-grid-1x2" label="Dashboard" active={view==="dashboard"} onClick={nav} />
                <NavItem id="clientes"  icon="bi-people"   label="Clientes"  active={view==="clientes"}  onClick={nav}
                  badge={stats.clientes_activos > 0 ? String(stats.clientes_activos) : null} />
              </>
            )}

            <div className="sb-divider" />
            <div className="sb-sec">Ventas</div>
            <NavItem id="crm" label="CRM" active={view==="crm"} onClick={nav}
              badge={stats.conv_sin_asignar > 0 ? String(stats.conv_sin_asignar) : null} badgeClass="amber"
              iconSvg={<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>}
            />
            {!esVendedor && (
              <NavItem id="soporte" icon="bi-headset" label="Tickets" active={view==="soporte"} onClick={nav} incoming />
            )}

            {!esVendedor && (
              <>
                <div className="sb-divider" />
                <div className="sb-sec">Equipo</div>
                <NavItem id="equipo" icon="bi-people-fill" label="Áreas y personal" active={view==="equipo"} onClick={nav} />
              </>
            )}

            {!esVendedor && (
              <>
                <div className="sb-divider" />
                <div className="sb-sec">Sistema</div>
                <NavItem id="sistema"       icon="bi-shield-lock"  label="Usuarios"      active={view==="sistema"}       onClick={nav}
                  badge={stats.usuarios_pendientes > 0 ? String(stats.usuarios_pendientes) : null} badgeClass="red" />
                <NavItem id="auditoria"     icon="bi-journal-text" label="Auditoría"     active={view==="auditoria"}     onClick={nav} />
                <NavItem id="integraciones" icon="bi-plug"         label="Integraciones" active={view==="integraciones"} onClick={nav} />
                <NavItem id="configuracion" icon="bi-gear"         label="Configuración" active={view==="configuracion"} onClick={nav} incoming />
              </>
            )}

            {!esVendedor && (
              <>
                <div className="sb-divider" />
                <div className="sb-sec">Módulos Tenant</div>
                <NavItem id="m_ot"            icon="bi-tools"          label="Órdenes de Trabajo" active={view==="m_ot"}            onClick={nav} />
                <NavItem id="m_catalogo"      icon="bi-box-seam"       label="Catálogo"           active={view==="m_catalogo"}      onClick={nav} />
                <NavItem id="m_inventario"    icon="bi-archive"        label="Inventario"         active={view==="m_inventario"}    onClick={nav} />
                <NavItem id="m_ventas"        icon="bi-cart3"          label="Ventas"             active={view==="m_ventas"}        onClick={nav} />
                <NavItem id="m_facturacion"   icon="bi-receipt"        label="Facturación"        active={view==="m_facturacion"}   onClick={nav} />
                <NavItem id="m_caja"          icon="bi-cash-stack"     label="Caja"               active={view==="m_caja"}          onClick={nav} />
                <NavItem id="m_comunicaciones" icon="bi-whatsapp"      label="WhatsApp"           active={view==="m_comunicaciones"} onClick={nav} />
                <NavItem id="m_equipo"        icon="bi-people-fill"    label="Técnicos"           active={view==="m_equipo"}        onClick={nav} />
                <NavItem id="m_proveedores"   icon="bi-truck"          label="Proveedores"        active={view==="m_proveedores"}   onClick={nav} />
              </>
            )}

            {!esVendedor && (
              <>
                <div className="sb-divider" />
                <div className="sb-sec" style={{opacity:.4}}>Próximamente</div>
                <NavItem id="comunicaciones" icon="bi-envelope"      label="Mensajes"    active={view==="comunicaciones"} onClick={nav} incoming />
                <NavItem id="alertas"        icon="bi-bell"          label="Alertas IA"  active={view==="alertas"}        onClick={nav} incoming />
                <NavItem id="seguimiento"    icon="bi-check2-square" label="Seguimiento" active={view==="seguimiento"}    onClick={nav} incoming />
                <NavItem id="modulos"        icon="bi-puzzle"        label="Módulos"     active={view==="modulos"}        onClick={nav} incoming />
                <NavItem id="planes"         icon="bi-tag"           label="Planes"      active={view==="planes"}         onClick={nav} incoming />
              </>
            )}
          </div>

          <div className="sb-foot" ref={footRef}>
            <div ref={menuRef} style={{position:"relative"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.55rem",padding:"0.44rem 0.55rem",borderRadius:"var(--r-sm)"}}>
                <div onClick={()=>{
                  if (footRef.current) {
                    const r = footRef.current.getBoundingClientRect();
                    setMenuPos({ bottom: window.innerHeight - r.top + 6, left: r.left, width: r.width });
                  }
                  setMenuUsuario(m=>!m);
                }} style={{cursor:"pointer",flexShrink:0}}>
                  {session?.user?.image
                    ? <img src={session.user.image} style={{width:28,height:28,borderRadius:"50%",objectFit:"cover"}} alt="" />
                    : <Av letra={userInitial} size={28} />
                  }
                </div>
                <div className="sb-logo-texts" style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"0.78rem",fontWeight:600,color:sbTxt,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{userName}</div>
                  <div style={{fontSize:"0.62rem",color:sbTxtDim,marginTop:1}}>{esVendedor ? "Vendedor" : "Superadmin"}</div>
                </div>
              </div>
              {menuUsuario && (
                <div style={{position:"fixed",bottom:menuPos.bottom,left:menuPos.left,width:menuPos.width,background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--r)",boxShadow:"var(--sh-md)",zIndex:1000,overflow:"hidden"}}>
                  <div style={{padding:"0.6rem 0.85rem 0.5rem",borderBottom:"1px solid var(--border)"}}>
                    <div style={{fontSize:"0.78rem",fontWeight:700,color:"var(--text)"}}>{userName}</div>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
                      <span style={{fontSize:"0.65rem",color:"var(--muted)"}}>{esVendedor?"Vendedor":"Superadmin"}</span>
                      <span style={{background:"var(--em-pale)",color:"var(--em-d)",fontSize:"0.6rem",fontWeight:700,padding:"1px 7px",borderRadius:9}}>Pro</span>
                    </div>
                  </div>
                  <div style={{padding:"0.3rem 0"}}>
                    <DropdownItem icon="bi-person" label="Mi perfil" onClick={()=>{setMenuUsuario(false);nav("perfil");}} />
                    {!esVendedor && <DropdownItem icon="bi-eye" label="Ver como cliente" onClick={()=>setMenuUsuario(false)} muted />}
                    <DropdownItem icon="bi-palette" label="Personalizar" onClick={()=>{setMenuUsuario(false);setShowPersonalizar(true);}} />
                  </div>
                  <div style={{borderTop:"1px solid var(--border)",padding:"0.3rem 0 0.15rem"}}>
                    <div style={{fontSize:"0.6rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--muted)",padding:"0.3rem 0.85rem 0.15rem"}}>Documentos</div>
                    <DropdownItem icon="bi-file-earmark-text" label="Rubro Service" onClick={()=>{setMenuUsuario(false);setShowRubroService(true);}} />
                    <DropdownItem icon="bi-grid-1x2" label="Módulo Social Media" onClick={()=>{setMenuUsuario(false);setShowSocialMedia(true);}} />
                  </div>
                  <div style={{borderTop:"1px solid var(--border)",padding:"0.3rem 0"}}>
                    <DropdownItem icon="bi-box-arrow-right" label="Cerrar sesión" onClick={()=>signOut({callbackUrl:"/"})} danger />
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* MAIN */}
        <div id="main">
          <div id="topbar">
            <div>
              <span className="tb-title">{VIEWS[view]?.[0]}</span>
              <span className="tb-sub">{VIEWS[view]?.[1]}</span>
            </div>
            <div className="tb-sp" />
            <div className="tb-search">
              <i className="bi bi-search" style={{color:"var(--muted)",fontSize:"0.78rem"}} />
              <input placeholder="Buscar clientes, leads…" />
            </div>
            <button className="tb-btn"><i className="bi bi-bell" /><div className="dot" /></button>
            <button className="tb-btn"><i className="bi bi-question-circle" /></button>
          </div>

          <div id="content" style={{padding: isCrmView ? "0" : "1.3rem 1.4rem"}}>
            {view === "dashboard"       && <ViewDashboard />}
            {view === "clientes"        && <ViewClientes />}
            {view === "crm"             && <ViewCRM session={session} />}
            {view === "equipo"          && <ViewEquipo />}
            {view === "soporte"         && <ViewSoporte session={session} />}
            {view === "modulos"         && <ViewModulos />}
            {view === "planes"          && <ViewPlanes />}
            {view === "comunicaciones"  && <ViewComunicaciones />}
            {view === "seguimiento"     && <ViewSeguimiento />}
            {view === "alertas"         && <ViewAlertas />}
            {view === "integraciones"   && <ViewIntegraciones />}
            {view === "auditoria"       && <ViewAuditoria />}
            {view === "configuracion"   && <ViewConfiguracion />}
            {view === "sistema"         && <ViewSistema />}
            {view === "perfil"          && <ViewPerfil />}
            {/* ── Módulos Tenant ── */}
            {view === "m_ot"            && <ViewAdminOT />}
            {view === "m_catalogo"      && <ViewAdminCatalogo />}
            {view === "m_inventario"    && <ViewAdminInventario />}
            {view === "m_ventas"        && <ViewAdminVentas />}
            {view === "m_facturacion"   && <ViewAdminFacturacion />}
            {view === "m_caja"          && <ViewAdminCaja />}
            {view === "m_comunicaciones"&& <ViewAdminComunicaciones />}
            {view === "m_equipo"        && <ViewAdminEquipo />}
            {view === "m_proveedores"   && <ViewAdminProveedores />}
          </div>
        </div>
      </div>

      {/* ── MODAL RUBRO SERVICE ── */}
      {showRubroService && <ModalRubroService onClose={()=>setShowRubroService(false)} />}

      {/* ── MODAL SOCIAL MEDIA ── */}
      {showSocialMedia && <ModalSocialMedia onClose={()=>setShowSocialMedia(false)} />}

      {/* ── MODAL PERSONALIZAR ── */}
      {showPersonalizar && (
        <AdminModalPersonalizar
          theme={theme}
          onSelect={(key) => {
            applyTheme(key, setTheme);
            localStorage.setItem("g360ia_admin_theme", key);
          }}
          onClose={() => setShowPersonalizar(false)}
        />
      )}

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:#F2F4F6; --sb-bg:#506886; --sb-brd:#3E5270; --sb-active:#445A73; --sb-badge:#B08A55;
          --pr:#506886; --pr-d:#445A73; --pr-l:#6B86A0; --pr-pale:#EDF1F6; --pr-mid:#C2CFD9; --pr-bg:#F4F7FA;
          --accent:#B08A55; --accent-l:#C8A472; --accent-pale:#F7F0E6; --accent-bg:rgba(176,138,85,.15);
          --em:#3A9E70; --em-l:#4AB880; --em-d:#2A7A54; --em-pale:#E8F7F1; --em-mid:#B8E0D0; --em-bg:#F2FAF6;
          --white:#FFFFFF; --border:#E5E7EB; --border2:#D1D5DB;
          --text:#1F2937; --text2:#4B5563; --sub:#6B7280; --muted:#9CA3AF;
          --red:#D9534F; --red-bg:#FDF2F2; --amber:#B08A55; --amber-bg:#FBF6EE;
          --blue:#506886; --blue-bg:#EDF1F6;
          --moon:#B8C8D4; --moon-l:#E5E7EB; --moon-d:#7A96A8;
          --pine:#B08A55; --pine-l:#C8A472; --pine-d:#8A6A3A; --pine-bg:#F7F0E6; --pine-pale:#F0E6D4;
          --gold:#B08A55; --gold-bg:rgba(176,138,85,.09); --gold-l:#C8A472;
          --sh:0 1px 3px rgba(30,50,80,.06),0 4px 14px rgba(30,50,80,.05);
          --sh-md:0 4px 20px rgba(30,50,80,.10);
          --r:11px; --r-sm:7px; --sb-w:230px;
        }
        body { font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); font-size:13px; }
        .g360-wrap { display:flex; height:100vh; overflow:hidden; }
        #sb { width:230px; min-width:230px; background:var(--sb-bg); border-right:1px solid var(--sb-brd); display:flex; flex-direction:column; height:100vh; overflow:hidden; transition:width .2s,min-width .2s; }
        #sb.collapsed { width:52px; min-width:52px; }
        .sb-logo { display:flex; align-items:center; gap:0.6rem; padding:0.85rem 0.7rem; border-bottom:1px solid var(--sb-brd); flex-shrink:0; }
        .sb-logo-mark { width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .sb-logo-texts { overflow:hidden; transition:opacity .15s,width .2s; white-space:nowrap; }
        .collapsed .sb-logo-texts { opacity:0; width:0; }
        .sb-brand { font-size:0.82rem; font-weight:700; color:#fff; }
        .sb-brand-sub { font-size:0.6rem; color:rgba(255,255,255,.45); margin-top:1px; }
        .sb-scroll { flex:1; overflow-y:auto; overflow-x:hidden; padding:0.5rem 0; scrollbar-width:none; }
        .sb-scroll::-webkit-scrollbar { display:none; }
        .sb-sec { font-size:0.6rem; font-weight:700; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:0.1em; padding:0.5rem 0.85rem 0.2rem; white-space:nowrap; overflow:hidden; }
        .sb-divider { height:1px; background:var(--sb-brd); margin:0.3rem 0.6rem; }
        .ni { display:flex; align-items:center; gap:0.6rem; padding:0.38rem 0.7rem; margin:0 0.35rem; border-radius:var(--r-sm); cursor:pointer; transition:background .12s; position:relative; white-space:nowrap; overflow:hidden; }
        .ni:hover { background:rgba(255,255,255,.1); }
        .ni.on { background:var(--sb-active); }
        .ni-ic { font-size:0.9rem; color:rgba(255,255,255,.7); flex-shrink:0; width:16px; text-align:center; display:flex; align-items:center; justify-content:center; }
        .ni.on .ni-ic { color:#fff; }
        .ni-txt { font-size:0.79rem; font-weight:500; color:rgba(255,255,255,.75); overflow:hidden; transition:opacity .15s,width .15s; }
        .ni.on .ni-txt { color:#fff; font-weight:600; }
        .collapsed .ni-txt { opacity:0; width:0; }
        #sb.collapsed .ni { padding:0; margin:2px 0; gap:0; justify-content:center; border-radius:0; }
        #sb.collapsed .ni-ic { width:52px; margin:0; display:flex; align-items:center; justify-content:center; padding:0.46rem 0; }
        #sb.collapsed .ni-txt { display:none; }
        #sb.collapsed .ni-badge { display:none; }
        #sb.collapsed .ni-soon { display:none; }
        #sb.collapsed .sb-sec { opacity:0; height:0; padding:0; overflow:hidden; }
        #sb.collapsed .sb-divider { margin:0.5rem 10px; }
        #sb.collapsed .sb-logo { justify-content:center; padding:0; }
        #sb.collapsed .sb-logo-texts { opacity:0; width:0; }
        .ni-badge { font-size:0.58rem; font-weight:700; padding:1px 5px; border-radius:9px; background:var(--sb-badge); color:#fff; flex-shrink:0; }
        .ni-badge.amber { background:#B08A55; }
        .ni-badge.red   { background:#D9534F; }
        .sb-foot { border-top:1px solid var(--sb-brd); padding:0.5rem 0.3rem; flex-shrink:0; }
        #main { flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden; }
        #topbar { height:52px; background:#fff; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:0.7rem; padding:0 1.2rem; flex-shrink:0; }
        .tb-title { font-size:0.9rem; font-weight:700; color:var(--text); }
        .tb-sub { font-size:0.72rem; color:var(--muted); margin-left:0.5rem; }
        .tb-sp { flex:1; }
        .tb-search { display:flex; align-items:center; gap:0.4rem; background:var(--bg); border:1px solid var(--border); border-radius:var(--r-sm); padding:0.3rem 0.7rem; }
        .tb-search input { border:none; background:none; outline:none; font-size:0.78rem; color:var(--text); font-family:'Inter',sans-serif; width:160px; }
        .tb-btn { width:32px; height:32px; border:1px solid var(--border); border-radius:var(--r-sm); background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative; font-size:0.88rem; color:var(--sub); }
        .dot { position:absolute; top:5px; right:5px; width:6px; height:6px; background:var(--red); border-radius:50%; border:1.5px solid #fff; }
        #content { flex:1; overflow-y:auto; overflow-x:hidden; }
        .card { background:var(--white); border:1px solid var(--border); border-radius:var(--r); padding:0.9rem 1rem; box-shadow:var(--sh); }
        .g2  { display:grid; grid-template-columns:1fr 1fr; gap:0.8rem; }
        .g3  { display:grid; grid-template-columns:repeat(3,1fr); gap:0.8rem; }
        .g4  { display:grid; grid-template-columns:repeat(4,1fr); gap:0.8rem; margin-bottom:0.9rem; }
        .g32 { display:grid; grid-template-columns:2fr 1fr; gap:0.8rem; }
        .ch  { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.6rem; }
        .ch-title { font-weight:600; font-size:0.82rem; }
        .ch-sub   { font-size:0.7rem; color:var(--muted); margin-left:auto; }
        .kpi { background:var(--white); border:1px solid var(--border); border-radius:var(--r); padding:0.9rem 1rem; box-shadow:var(--sh); }
        .kpi-ico { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:0.6rem; font-size:0.9rem; }
        .kpi-val { font-size:1.5rem; font-weight:700; line-height:1; color:var(--text); }
        .kpi-lbl { font-size:0.7rem; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em; margin-top:0.3rem; }
        .kpi-d   { font-size:0.68rem; color:var(--muted); margin-top:0.25rem; display:flex; align-items:center; gap:3px; }
        .kpi-d.nu { color:var(--border2); }
        .btn { display:inline-flex; align-items:center; gap:0.35rem; padding:0.42rem 0.85rem; border-radius:var(--r-sm); font-size:0.78rem; font-weight:600; cursor:pointer; border:none; font-family:'Inter',sans-serif; transition:opacity .15s; }
        .btn:hover { opacity:.85; }
        .btn-em  { background:var(--em);  color:#fff; }
        .btn-pr  { background:var(--pr);  color:#fff; }
        .btn-out { background:#fff; color:var(--text); border:1px solid var(--border2); }
        .btn-red { background:var(--red); color:#fff; }
        .btn-sm  { padding:0.3rem 0.65rem; font-size:0.72rem; }
        .btn-xs  { padding:0.18rem 0.45rem; font-size:0.65rem; }
        .bdg { display:inline-block; font-size:0.65rem; font-weight:700; padding:2px 8px; border-radius:999px; }
        .bdg-em   { background:var(--em-pale);  color:var(--em-d); }
        .bdg-red  { background:var(--red-bg);   color:var(--red); }
        .bdg-moon { background:var(--moon-l);   color:var(--moon-d); }
        .bdg-amber{ background:var(--amber-bg); color:#92680A; }
        .bdg-gold { background:var(--gold-bg);  color:var(--pine-d); }
        .bdg-blue { background:var(--blue-bg);  color:var(--pr-d); }
        .bdg-pro  { background:var(--pr-pale);  color:var(--pr-d); }
        .bdg-pine { background:var(--pine-pale);color:var(--pine-d); }
        .bdg-urgente { background:#FEE2E2; color:#991B1B; }
        .bdg-alta    { background:#FFEDD5; color:#9A3412; }
        .bdg-media   { background:var(--amber-bg); color:#92680A; }
        .bdg-baja    { background:var(--moon-l);   color:var(--moon-d); }
        .tbl { width:100%; border-collapse:collapse; font-size:0.78rem; }
        .tbl th { text-align:left; padding:0.5rem 0.7rem; font-size:0.65rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--border); }
        .tbl td { padding:0.55rem 0.7rem; border-bottom:1px solid var(--border); vertical-align:middle; }
        .tbl tr:last-child td { border-bottom:none; }
        .tbl tr:hover td { background:var(--bg); }
        .modal-over { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:500; display:flex; align-items:center; justify-content:center; padding:1rem; }
        .modal-box  { background:#fff; border-radius:var(--r); width:100%; max-width:480px; box-shadow:var(--sh-md); max-height:90vh; overflow-y:auto; }
        .modal-hdr  { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.2rem; border-bottom:1px solid var(--border); }
        .modal-title{ font-size:0.92rem; font-weight:700; }
        .modal-body { padding:1.1rem 1.2rem; display:flex; flex-direction:column; gap:0.7rem; }
        .modal-foot { display:flex; align-items:center; justify-content:flex-end; gap:0.5rem; padding:0.8rem 1.2rem; border-top:1px solid var(--border); }
        .fg  { display:flex; flex-direction:column; gap:0.3rem; }
        .fl  { font-size:0.72rem; font-weight:600; color:var(--sub); }
        .fi  { padding:0.4rem 0.65rem; border:1px solid var(--border2); border-radius:var(--r-sm); font-family:'Inter',sans-serif; font-size:0.8rem; color:var(--text); background:var(--white); outline:none; }
        .fi:focus { border-color:var(--pr); }
        .fi-row { display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; }
        .tog { width:32px; height:18px; border-radius:9px; background:var(--border2); position:relative; cursor:pointer; transition:background .18s; flex-shrink:0; }
        .tog.on { background:var(--em); }
        .tog-k { position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:#fff; transition:transform .18s; }
        .tog.on .tog-k { transform:translateX(14px); }
        .plan-card { background:var(--white); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; box-shadow:var(--sh); }
        .plan-hdr { padding:1rem 1.1rem 0.8rem; border-bottom:1px solid var(--border); }
        .plan-name { font-size:1.1rem; font-weight:700; }
        .plan-price { font-size:1.9rem; line-height:1; margin:0.5rem 0 0.2rem; font-weight:700; }
        .plan-price span { font-size:0.8rem; font-weight:400; color:var(--muted); }
        .plan-feature { display:flex; align-items:center; gap:0.5rem; padding:0.38rem 1.1rem; font-size:0.77rem; color:var(--text2); border-bottom:1px solid var(--border); }
        .plan-feature:last-of-type { border-bottom:none; }
        .plan-feature.off { color:var(--muted); }
        .plan-foot { padding:0.8rem 1.1rem; }
        .alert-row { display:flex; align-items:flex-start; gap:0.65rem; padding:0.62rem 0.8rem; border-left:3px solid var(--border); border-radius:0 var(--r-sm) var(--r-sm) 0; background:var(--white); margin-bottom:0.4rem; }
        .alert-row.em   { border-left-color:var(--em);    background:var(--em-bg); }
        .alert-row.warn { border-left-color:var(--amber); background:var(--amber-bg); }
        .alert-row.red  { border-left-color:var(--red);   background:var(--red-bg); }
        .comm-wrap { display:flex; height:100%; overflow:hidden; }
        .conv-list { width:280px; min-width:280px; border-right:1px solid var(--border); display:flex; flex-direction:column; background:#fff; }
        .conv-hdr  { padding:0.75rem 0.85rem 0.5rem; border-bottom:1px solid var(--border); flex-shrink:0; }
        .conv-hdr-title { font-size:0.88rem; font-weight:700; }
        .conv-search { display:flex; align-items:center; gap:0.4rem; padding:0.5rem 0.85rem; border-bottom:1px solid var(--border); flex-shrink:0; }
        .conv-search input { border:none; outline:none; font-size:0.78rem; font-family:'Inter',sans-serif; flex:1; }
        .conv-items { flex:1; overflow-y:auto; }
        .conv-item { padding:0.65rem 0.85rem; border-bottom:1px solid var(--border); cursor:pointer; }
        .conv-item:hover { background:var(--bg); }
        .conv-item.active { background:var(--pr-pale); border-left:2px solid var(--pr); }
        .conv-av { width:34px; height:34px; border-radius:50%; background:var(--pr); color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700; flex-shrink:0; }
        .chat-panel { flex:1; display:flex; flex-direction:column; overflow:hidden; }
        .chat-hdr { padding:0.65rem 1rem; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:0.6rem; background:#fff; flex-shrink:0; flex-wrap:wrap; }
        .chat-msgs { flex:1; overflow-y:auto; padding:1rem; display:flex; flex-direction:column; gap:0.5rem; background:var(--bg); }
        .chat-input { padding:0.65rem 1rem; border-top:1px solid var(--border); display:flex; gap:0.5rem; background:#fff; flex-shrink:0; }
        .msg { max-width:70%; padding:0.5rem 0.75rem; border-radius:10px; font-size:0.8rem; line-height:1.45; }
        .msg.in  { background:#fff; color:var(--text); align-self:flex-start; border-bottom-left-radius:2px; border:1px solid var(--border); }
        .msg.out { background:var(--pr); color:#fff; align-self:flex-end; border-bottom-right-radius:2px; }
        .msg.act { background:var(--amber-bg); border:1px solid #E8D5B0; align-self:stretch; text-align:center; font-size:0.65rem; color:#92680A; max-width:100%; border-radius:var(--r-sm); }
        .mod-ico  { width:28px; height:28px; border-radius:7px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:0.82rem; }
        .mod-name { font-size:0.8rem; font-weight:600; color:var(--text); }
        .mod-desc { font-size:0.67rem; color:var(--muted); }
        .vh { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.9rem; }
        .vh-title { font-size:1.1rem; font-weight:700; color:var(--text); }
        .vh-sub   { font-size:0.72rem; color:var(--muted); margin-top:2px; }
        .cfg-section { background:var(--white); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; margin-bottom:0.8rem; box-shadow:var(--sh); }
        .cfg-hdr  { display:flex; align-items:center; gap:0.5rem; padding:0.7rem 1rem; border-bottom:1px solid var(--border); background:var(--bg); }
        .cfg-title{ font-size:0.82rem; font-weight:700; }
        .cfg-body { padding:0.9rem 1rem; display:flex; flex-direction:column; gap:0.6rem; }
        .int-card { display:flex; align-items:center; gap:0.75rem; background:#fff; border:1px solid var(--border); border-radius:var(--r); padding:0.75rem 0.9rem; margin-bottom:0.4rem; }
        .int-ico  { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1rem; }
        /* CRM específico */
        .crm-wrap { display:flex; flex-direction:column; height:100%; overflow:hidden; }
        .crm-tabs { display:flex; background:#fff; border-bottom:1px solid var(--border); padding:0 1.1rem; flex-shrink:0; }
        .crm-tab  { padding:0.6rem 1rem; font-size:0.75rem; font-weight:600; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; display:flex; align-items:center; gap:5px; }
        .crm-tab.on { color:var(--pr); border-bottom-color:var(--pr); }
        .crm-ct { display:inline-flex; align-items:center; justify-content:center; min-width:17px; height:15px; padding:0 4px; font-size:0.55rem; font-weight:700; border-radius:999px; }
        .crm-ct.a { background:var(--amber-bg); color:#92680A; }
        .crm-ct.b { background:var(--em-pale);  color:var(--em-d); }
        .crm-ct.c { background:var(--pr-pale);  color:var(--pr-d); }
        /* Tabla leads */
        .leads-table { width:100%; border-collapse:collapse; background:#fff; border:1px solid var(--border); }
        .leads-table thead { background:var(--bg); }
        .leads-table th { text-align:left; padding:0.5rem 0.75rem; font-size:0.6rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; white-space:nowrap; border-bottom:1px solid var(--border); border-right:1px solid #F3F4F6; }
        .leads-table th:last-child { border-right:none; }
        .leads-table td { padding:0.6rem 0.75rem; border-bottom:1px solid #F3F4F6; vertical-align:middle; border-right:1px solid #F3F4F6; }
        .leads-table td:last-child { border-right:none; }
        .leads-table tr:last-child td { border-bottom:none; }
        .leads-table tr:hover td { background:#FAFBFC; }
        /* Funnel */
        .funnel-col { background:var(--bg); border-radius:var(--r); padding:0.6rem; flex:0 0 210px; display:flex; flex-direction:column; gap:0.5rem; }
        .funnel-col-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.3rem; }
        .f-card { background:#fff; border:1px solid var(--border); border-radius:var(--r-sm); padding:0.65rem 0.75rem; cursor:pointer; }
        .f-card:hover { border-color:var(--pr); }
        /* Ficha lateral */
        .ficha-lateral { width:200px; border-left:1px solid var(--border); background:#fff; display:flex; flex-direction:column; flex-shrink:0; overflow-y:auto; }
        .ficha-sec { padding:0.75rem 0.9rem; border-bottom:1px solid #F3F4F6; }
        .ficha-sec-title { font-size:0.58rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.07em; margin-bottom:0.5rem; }
        .ficha-row .fl { font-size:0.58rem; }
        .ficha-row .fv { font-size:0.7rem; color:var(--text); font-weight:500; }
        .ficha-row .fv.m { color:var(--muted); font-style:italic; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
        .view-anim { animation:fadeIn .18s ease; }

        /* ── Champagne sidebar overrides ── */
        #sb[data-theme="champagne"] .sb-brand        { color:rgba(60,30,0,.95) !important; }
        #sb[data-theme="champagne"] .sb-brand-sub    { color:rgba(60,30,0,.55) !important; }
        #sb[data-theme="champagne"] .sb-sec          { color:rgba(60,30,0,.45) !important; }
        #sb[data-theme="champagne"] .sb-divider      { background:rgba(0,0,0,.12) !important; }
        #sb[data-theme="champagne"] .ni-ic           { color:rgba(60,30,0,.65) !important; }
        #sb[data-theme="champagne"] .ni-txt          { color:rgba(60,30,0,.8) !important; }
        #sb[data-theme="champagne"] .ni:hover        { background:rgba(0,0,0,.08) !important; }
        #sb[data-theme="champagne"] .ni.on           { background:rgba(0,0,0,.12) !important; }
        #sb[data-theme="champagne"] .ni.on .ni-ic    { color:rgba(40,15,0,.9) !important; }
        #sb[data-theme="champagne"] .ni.on .ni-txt   { color:rgba(40,15,0,1) !important; }
        #sb[data-theme="champagne"] .sb-logo         { border-bottom-color:rgba(0,0,0,.12) !important; }
        #sb[data-theme="champagne"] .sb-logo-mark    { background:rgba(0,0,0,.1) !important; }
        #sb[data-theme="champagne"] .sb-foot         { border-top-color:rgba(0,0,0,.12) !important; }

        /* ── Admin modal personalizar ── */
        .adm-modal-over {
          position:fixed; inset:0; background:rgba(0,0,0,.35);
          z-index:600; display:flex; align-items:center; justify-content:center; padding:1rem;
        }
        .adm-modal-box {
          background:#fff; border-radius:var(--r); width:100%; max-width:400px;
          box-shadow:var(--sh-md);
        }
        .adm-modal-hdr {
          display:flex; align-items:center; justify-content:space-between;
          padding:1rem 1.2rem; border-bottom:1px solid var(--border);
        }
        .adm-modal-title { font-size:0.92rem; font-weight:700; color:var(--text); }
        .adm-modal-close {
          width:28px; height:28px; border-radius:6px;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:var(--muted); font-size:0.9rem; transition:background .12s;
        }
        .adm-modal-close:hover { background:var(--bg); color:var(--text); }
        .adm-modal-body { padding:1.2rem; }
        .adm-modal-sub  { font-size:0.75rem; color:var(--muted); margin-bottom:1rem; }
        .adm-themes-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .adm-theme-card {
          border:2px solid var(--border); border-radius:var(--r);
          overflow:hidden; cursor:pointer; transition:border-color .15s, box-shadow .15s;
        }
        .adm-theme-card:hover    { border-color:#9CA3AF; }
        .adm-theme-card.selected { border-color:var(--pr); box-shadow:0 0 0 3px rgba(80,104,134,.12); }
        .adm-theme-swatch { height:64px; position:relative; }
        .adm-theme-check {
          position:absolute; top:7px; right:7px; width:20px; height:20px; border-radius:50%;
          background:var(--pr); color:#fff; display:flex; align-items:center; justify-content:center;
          font-size:0.65rem;
        }
        .adm-theme-info  { padding:7px 10px 8px; border-top:1px solid var(--border); background:#fff; }
        .adm-theme-label { font-size:0.75rem; font-weight:700; color:var(--text); }
        .adm-theme-sub   { font-size:0.62rem; color:var(--muted); margin-top:1px; }
        .adm-modal-foot  { padding:0.75rem 1.2rem; border-top:1px solid var(--border); display:flex; justify-content:flex-end; }
        .adm-modal-btn   { padding:7px 18px; border-radius:var(--r-sm); background:var(--pr); color:#fff; font-size:0.8rem; font-weight:600; border:none; cursor:pointer; font-family:'Inter',sans-serif; transition:opacity .15s; }
        .adm-modal-btn:hover { opacity:.85; }
      `}</style>
    </>
  );
}

/* ══ COMPONENTES COMPARTIDOS ══ */

// ── Helper: aplica un tema al CSS y actualiza el estado ───────────
function applyTheme(key, setTheme) {
  const t = THEMES[key];
  if (!t) return;
  const root = document.documentElement;
  root.style.setProperty("--sb-bg",  t.sbBg);
  root.style.setProperty("--sb-brd", t.sbBrd);
  root.style.setProperty("--sb-active", t.sbActive);
  setTheme(key);
}

// ── Modal Personalizar (admin) ────────────────────────────────────
function AdminModalPersonalizar({ theme, onSelect, onClose }) {
  const [selected, setSelected] = useState(theme);

  const apply = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <div className="adm-modal-over" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal-box view-anim">
        <div className="adm-modal-hdr">
          <span className="adm-modal-title">Personalizar panel</span>
          <div className="adm-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </div>
        </div>
        <div className="adm-modal-body">
          <div className="adm-modal-sub">Elegí un color para el sidebar de tu panel.</div>
          <div className="adm-themes-grid">
            {Object.entries(THEMES).map(([key, t]) => {
              const gradient = t.preview.length === 1
                ? t.preview[0]
                : `linear-gradient(135deg, ${t.preview.join(", ")})`;
              return (
                <div
                  key={key}
                  className={`adm-theme-card${selected === key ? " selected" : ""}`}
                  onClick={() => setSelected(key)}
                >
                  <div className="adm-theme-swatch" style={{ background: gradient }}>
                    {selected === key && (
                      <div className="adm-theme-check">
                        <i className="bi bi-check" />
                      </div>
                    )}
                  </div>
                  <div className="adm-theme-info">
                    <div className="adm-theme-label">{t.label}</div>
                    <div className="adm-theme-sub">{t.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="adm-modal-foot">
          <button className="adm-modal-btn" onClick={apply}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

function NavItem({ id, icon, iconSvg, label, active, onClick, badge, badgeClass, incoming }) {
  return (
    <div className={`ni${active?" on":""}`} onClick={()=>onClick(id)}>
      <span className="ni-ic">
        {iconSvg ? iconSvg : <i className={`bi ${icon}`} />}
      </span>
      <span className="ni-txt">{label}</span>
      {incoming && !badge && (
        <span className="ni-soon" style={{background:"rgba(176,138,85,.18)",color:"#C8A472",fontSize:"0.52rem",fontWeight:700,padding:"1px 6px",borderRadius:9,flexShrink:0,letterSpacing:"0.04em",textTransform:"uppercase",border:"1px solid rgba(176,138,85,.3)"}}>soon</span>
      )}
      {badge && <span className={`ni-badge${badgeClass?" "+badgeClass:""}`}>{badge}</span>}
    </div>
  );
}

function DropdownItem({ icon, label, onClick, danger, muted }) {
  return (
    <div onClick={onClick}
      style={{display:"flex",alignItems:"center",gap:"0.55rem",padding:"0.45rem 0.85rem",cursor:"pointer",fontSize:"0.8rem",fontWeight:500,color:danger?"var(--red)":muted?"var(--muted)":"var(--text)",transition:"background .12s"}}
      onMouseEnter={e=>e.currentTarget.style.background=danger?"var(--red-bg)":"var(--bg)"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <i className={`bi ${icon}`} style={{fontSize:"0.88rem",width:16,textAlign:"center"}} />
      {label}
    </div>
  );
}

// ── Modal Rubro Service (tarifario servicio técnico) ─────────────
const RUBRO_SERVICE_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gestión 360 iA — Planes Servicio Técnico</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,300;0,600;1,300&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --green: #1A7A4A; --green-light: #E8F5EE; --green-dark: #0f5233;
    --gold: #B08A55; --gold-light: #F7F0E6; --purple: #534AB7; --purple-light: #EDE9FE;
    --amber: #854F0B; --amber-light: #FEF3C7;
    --bg: #F0F4F0; --surface: #FFFFFF; --text: #1a1a1a; --text-muted: #6b7280;
    --text-subtle: #9ca3af; --border: rgba(0,0,0,0.08); --border-strong: rgba(0,0,0,0.15);
    --radius: 16px; --radius-sm: 8px;
    --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.10);
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding: 40px 24px 60px; -webkit-font-smoothing: antialiased; }
  .page { max-width: 1060px; margin: 0 auto; }
  .header { margin-bottom: 44px; }
  .brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
  .brand-mark { width: 32px; height: 32px; background: var(--green); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .brand-mark svg { width: 18px; height: 18px; color: white; }
  .brand-name { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 600; color: var(--green); letter-spacing: -0.01em; }
  .header-rubro { display: inline-flex; align-items: center; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 500; color: var(--text-muted); margin-bottom: 14px; }
  .header-rubro-dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; }
  .header h1 { font-family: 'Fraunces', serif; font-size: clamp(28px, 4vw, 44px); font-weight: 300; line-height: 1.1; letter-spacing: -0.03em; color: var(--text); margin-bottom: 10px; }
  .header h1 em { font-style: italic; color: var(--green); }
  .header-sub { font-size: 15px; color: var(--text-muted); font-weight: 400; max-width: 480px; line-height: 1.6; }
  .billing-row { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
  .billing-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
  .billing-label.active { color: var(--text); }
  .toggle-track { width: 44px; height: 24px; background: var(--green); border-radius: 12px; cursor: pointer; position: relative; border: none; transition: background .2s; }
  .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform .2s; pointer-events: none; }
  .toggle-track.off { background: #d1d5db; }
  .toggle-track.off .toggle-thumb { transform: translateX(0); }
  .toggle-track.on .toggle-thumb { transform: translateX(20px); }
  .billing-save { background: var(--green-light); color: var(--green); font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.02em; }
  .plans-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 44px; }
  .plan-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px 20px; display: flex; flex-direction: column; position: relative; transition: transform .2s, box-shadow .2s; }
  .plan-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
  .plan-card.featured { border: 2px solid var(--green); background: #FAFCFB; }
  .featured-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--green); color: white; font-size: 10px; font-weight: 600; padding: 4px 14px; border-radius: 20px; white-space: nowrap; letter-spacing: 0.04em; text-transform: uppercase; }
  .plan-tier { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .12em; margin-bottom: 6px; }
  .tier-free { color: #6b7280; } .tier-pro { color: var(--green); } .tier-biz { color: var(--purple); } .tier-ia { color: var(--amber); }
  .plan-price { font-family: 'Fraunces', serif; font-size: 42px; font-weight: 300; line-height: 1; color: var(--text); letter-spacing: -0.03em; }
  .plan-price .currency { font-size: 18px; vertical-align: top; margin-top: 8px; display: inline-block; font-weight: 400; color: var(--text-muted); }
  .plan-price .period { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--text-muted); font-weight: 400; margin-left: 2px; }
  .plan-price-annual { font-size: 11px; color: var(--green); font-weight: 500; min-height: 16px; margin-bottom: 2px; }
  .plan-tagline { font-size: 11.5px; color: var(--text-muted); line-height: 1.5; margin-bottom: 18px; min-height: 34px; }
  .plan-cta { display: block; width: 100%; padding: 9px 0; border-radius: var(--radius-sm); font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; text-align: center; cursor: pointer; border: 1.5px solid; transition: all .15s; margin-bottom: 20px; text-decoration: none; }
  .cta-free { border-color: var(--border-strong); color: var(--text-muted); background: transparent; }
  .cta-free:hover { background: var(--bg); }
  .cta-pro { border-color: var(--green); background: var(--green); color: white; }
  .cta-pro:hover { background: var(--green-dark); border-color: var(--green-dark); }
  .cta-biz { border-color: var(--purple); background: var(--purple); color: white; }
  .cta-biz:hover { background: #3d379a; border-color: #3d379a; }
  .cta-ia { border-color: #1C3D2E; background: #1C3D2E; color: white; }
  .cta-ia:hover { background: #0f2a1f; border-color: #0f2a1f; }
  .plan-divider { border: none; border-top: 1px solid var(--border); margin-bottom: 16px; }
  .mod-block { margin-bottom: 13px; }
  .mod-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .mod-icon { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .mod-icon svg { width: 12px; height: 12px; }
  .mi-free { background: #f3f4f6; } .mi-free svg { color: #6b7280; }
  .mi-pro { background: var(--green-light); } .mi-pro svg { color: var(--green); }
  .mi-biz { background: var(--purple-light); } .mi-biz svg { color: var(--purple); }
  .mi-ia { background: var(--amber-light); } .mi-ia svg { color: var(--amber); }
  .mod-name { font-size: 11.5px; font-weight: 600; color: var(--text); letter-spacing: -0.01em; }
  .mod-items { padding-left: 32px; display: flex; flex-direction: column; gap: 4px; }
  .feat-item { display: flex; align-items: flex-start; gap: 7px; font-size: 11px; color: var(--text); line-height: 1.4; }
  .feat-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .dot-free { background: #9ca3af; } .dot-pro { background: var(--green); } .dot-biz { background: var(--purple); } .dot-ia { background: var(--amber); }
  .not-section { margin-top: 4px; }
  .not-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--text-subtle); margin-bottom: 4px; padding-left: 32px; }
  .feat-item.muted { color: var(--text-subtle); }
  .feat-item.muted .feat-dot { background: #e5e7eb; }
  .credit-note { margin-top: 10px; background: var(--amber-light); border-radius: 8px; padding: 8px 10px; font-size: 11px; color: var(--amber); line-height: 1.5; font-weight: 500; }
  .infra-section { margin-bottom: 36px; }
  .infra-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: var(--text-subtle); margin-bottom: 10px; }
  .infra-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .infra-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
  .infra-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--text-subtle); margin-bottom: 5px; }
  .infra-cost { font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 500; color: var(--text); margin-bottom: 3px; }
  .infra-detail { font-size: 10.5px; color: var(--text-muted); line-height: 1.4; margin-bottom: 7px; }
  .infra-margin { display: flex; justify-content: space-between; align-items: center; padding-top: 7px; border-top: 1px solid var(--border); }
  .infra-margin-label { font-size: 10px; color: var(--text-subtle); }
  .infra-margin-val { font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; color: var(--green); }
  .footer { display: flex; align-items: center; justify-content: space-between; padding-top: 20px; border-top: 1px solid var(--border); }
  .footer-note { font-size: 11.5px; color: var(--text-subtle); }
  .footer-tag { font-family: 'DM Mono', monospace; font-size: 10.5px; color: var(--text-subtle); }
  @media (max-width: 860px) { .plans-grid, .infra-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 520px) { .plans-grid, .infra-grid { grid-template-columns: 1fr; } body { padding: 24px 14px 40px; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand-row">
      <div class="brand-mark"><svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="white" stroke-width="1.5"/><path d="M6 9l2 2 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <span class="brand-name">Gestión 360 iA</span>
    </div>
    <div class="header-rubro"><span class="header-rubro-dot"></span>Rubro — Servicio técnico</div>
    <h1>Planes para <em>talleres</em><br>que quieren escalar.</h1>
    <p class="header-sub">Desde el técnico unipersonal hasta la cadena de talleres. Cada plan incluye los módulos que realmente necesitás.</p>
  </div>
  <div class="billing-row">
    <span class="billing-label active" id="lbl-monthly">Mensual</span>
    <button class="toggle-track on" id="billing-toggle" onclick="toggleBilling()"><span class="toggle-thumb"></span></button>
    <span class="billing-label" id="lbl-annual">Anual</span>
    <span class="billing-save">2 meses gratis</span>
  </div>
  <div class="plans-grid">
    <!-- FREE -->
    <div class="plan-card">
      <div class="plan-tier tier-free">Free</div>
      <div class="plan-price">$0</div>
      <div class="plan-price-annual"></div>
      <div class="plan-tagline">Para arrancar sin compromiso. Sin vencimiento.</div>
      <a href="#" class="plan-cta cta-free">Empezar gratis</a>
      <hr class="plan-divider">
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-free"><svg viewBox="0 0 13 13" fill="none"><rect x="1" y="2" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 5.5h5M4 7.5h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="mod-name">OT Manager</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-free"></span>OTs ilimitadas con QR</div>
          <div class="feat-item"><span class="feat-dot dot-free"></span>7 estados de seguimiento</div>
          <div class="feat-item"><span class="feat-dot dot-free"></span>Presupuestos y remitos PDF</div>
        </div>
      </div>
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-free"><svg viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="4.5" r="2.2" stroke="currentColor" stroke-width="1.2"/><path d="M2 11c0-2.5 2-4.5 4.5-4.5S11 8.5 11 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="mod-name">Clientes</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-free"></span>Ficha de cliente</div>
          <div class="feat-item"><span class="feat-dot dot-free"></span>Historial de equipos</div>
        </div>
      </div>
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-free"><svg viewBox="0 0 13 13" fill="none"><rect x="1.5" y="3" width="10" height="7" rx="1.2" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 6h10" stroke="currentColor" stroke-width="1.2"/></svg></div><span class="mod-name">Cobros y Facturación</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-free"></span>Cobro online MercadoPago</div>
          <div class="feat-item"><span class="feat-dot dot-free"></span>Factura PDF genérica</div>
          <div class="feat-item"><span class="feat-dot dot-free"></span>Inventario de repuestos</div>
        </div>
      </div>
      <div class="not-section">
        <div class="not-label">No incluye</div>
        <div class="mod-items">
          <div class="feat-item muted"><span class="feat-dot"></span>WhatsApp</div>
          <div class="feat-item muted"><span class="feat-dot"></span>ARCA / factura electrónica</div>
          <div class="feat-item muted"><span class="feat-dot"></span>Más de 1 usuario</div>
        </div>
      </div>
    </div>
    <!-- PRO -->
    <div class="plan-card featured">
      <span class="featured-badge">Más elegido</span>
      <div class="plan-tier tier-pro">Pro</div>
      <div class="plan-price" id="price-pro"><span class="currency">$</span><span class="amount" data-monthly="39" data-annual="33">39</span><span class="period">/mes</span></div>
      <div class="plan-price-annual" id="annual-pro"></div>
      <div class="plan-tagline">El taller completo. WhatsApp activo y seguimiento en tu web.</div>
      <a href="#" class="plan-cta cta-pro">Empezar con Pro</a>
      <hr class="plan-divider">
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-pro"><svg viewBox="0 0 13 13" fill="none"><path d="M10 3C9 1.5 7 1.5 6 2.5L2.5 6c-1 1-.5 3 1 3.5l1 .5 4.5-4.5.5 1C10 8 11 6 10 3z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg></div><span class="mod-name">WhatsApp Center</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-pro"></span>1 número activo</div>
          <div class="feat-item"><span class="feat-dot dot-pro"></span>Notif. automáticas de estado</div>
          <div class="feat-item"><span class="feat-dot dot-pro"></span>Bot FAQ (planilla simple)</div>
        </div>
      </div>
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-pro"><svg viewBox="0 0 13 13" fill="none"><circle cx="3" cy="6.5" r="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="10" cy="6.5" r="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 6.5h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M6.5 2.5v1.5M6.5 9.5V11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="mod-name">Track &amp; Follow</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-pro"></span>Widget en tu web (1 línea de código)</div>
          <div class="feat-item"><span class="feat-dot dot-pro"></span>Consulta por número de OT</div>
        </div>
      </div>
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-pro"><svg viewBox="0 0 13 13" fill="none"><path d="M2.5 4h8M2.5 7h5M2.5 10h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="mod-name">Equipo Técnico</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-pro"></span>Asignación de técnicos a OTs</div>
          <div class="feat-item"><span class="feat-dot dot-pro"></span>Hasta 5 usuarios</div>
        </div>
      </div>
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-pro"><svg viewBox="0 0 13 13" fill="none"><path d="M2 10.5L3.5 4 6.5 8 8.5 5l2 5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="mod-name">CRM Pro</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-pro"></span>Funnel visual de clientes</div>
          <div class="feat-item"><span class="feat-dot dot-pro"></span>Conversaciones multi-canal</div>
        </div>
      </div>
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-pro"><svg viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M4 4l2.5-2.5L9 4M4 9l2.5 2.5L9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="mod-name">Facturación ARCA</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-pro"></span>Factura electrónica Argentina</div>
          <div class="feat-item"><span class="feat-dot dot-pro"></span>CAE automático</div>
        </div>
      </div>
      <div class="not-section">
        <div class="not-label">No incluye</div>
        <div class="mod-items">
          <div class="feat-item muted"><span class="feat-dot"></span>Multi-sucursal</div>
          <div class="feat-item muted"><span class="feat-dot"></span>Proveedores</div>
          <div class="feat-item muted"><span class="feat-dot"></span>IA avanzada</div>
        </div>
      </div>
    </div>
    <!-- BUSINESS -->
    <div class="plan-card">
      <div class="plan-tier tier-biz">Business</div>
      <div class="plan-price" id="price-biz"><span class="currency">$</span><span class="amount" data-monthly="79" data-annual="66">79</span><span class="period">/mes</span></div>
      <div class="plan-price-annual" id="annual-biz"></div>
      <div class="plan-tagline">Para el taller que crece. Multi-sucursal y finanzas completas.</div>
      <a href="#" class="plan-cta cta-biz">Activar Business</a>
      <hr class="plan-divider">
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-biz"><svg viewBox="0 0 13 13" fill="none"><rect x="1" y="5.5" width="4.5" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="7.5" y="5.5" width="4.5" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M3.2 5.5V4C3.2 2.7 4.5 1.5 6.5 1.5S9.8 2.7 9.8 4v1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="mod-name">Multi-sede</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-biz"></span>Varias sucursales, un solo panel</div>
          <div class="feat-item"><span class="feat-dot dot-biz"></span>Usuarios ilimitados</div>
        </div>
      </div>
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-biz"><svg viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5C4.5 1.5 2 3 2 5.5c0 3.5 4.5 6 4.5 6s4.5-2.5 4.5-6C11 3 8.5 1.5 6.5 1.5z" stroke="currentColor" stroke-width="1.2"/><circle cx="6.5" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1.1"/></svg></div><span class="mod-name">Proveedores</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-biz"></span>Gestión de proveedores</div>
          <div class="feat-item"><span class="feat-dot dot-biz"></span>Catálogo de repuestos por proveedor</div>
          <div class="feat-item"><span class="feat-dot dot-biz"></span>Órdenes de compra</div>
        </div>
      </div>
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-biz"><svg viewBox="0 0 13 13" fill="none"><path d="M2 10.5L3.5 4 6.5 8 8.5 5l2 5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 10.5h11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="mod-name">Finanzas</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-biz"></span>Reportes financieros</div>
          <div class="feat-item"><span class="feat-dot dot-biz"></span>Caja y márgenes por OT</div>
        </div>
      </div>
      <div class="not-section">
        <div class="not-label">No incluye</div>
        <div class="mod-items">
          <div class="feat-item muted"><span class="feat-dot"></span>Bot Agente IA</div>
          <div class="feat-item muted"><span class="feat-dot"></span>Predicción de stock</div>
          <div class="feat-item muted"><span class="feat-dot"></span>Tracking GPS</div>
          <div class="feat-item muted"><span class="feat-dot"></span>Skills IA reactivas</div>
        </div>
      </div>
    </div>
    <!-- PLAN IA -->
    <div class="plan-card">
      <div class="plan-tier tier-ia">Plan IA</div>
      <div class="plan-price" id="price-ia"><span class="currency">$</span><span class="amount" data-monthly="149" data-annual="124">149</span><span class="period">/mes</span></div>
      <div class="plan-price-annual" id="annual-ia"></div>
      <div class="plan-tagline">La IA trabaja por vos antes de que lo hagas.</div>
      <a href="#" class="plan-cta cta-ia">Activar Plan IA</a>
      <hr class="plan-divider">
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-ia"><svg viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 6.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><circle cx="6.5" cy="6.5" r=".8" fill="currentColor"/></svg></div><span class="mod-name">Agente IA</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-ia"></span>Bot que conoce el negocio</div>
          <div class="feat-item"><span class="feat-dot dot-ia"></span>Carga de PDFs, docs, catálogos</div>
          <div class="feat-item"><span class="feat-dot dot-ia"></span>Responde consultas complejas</div>
          <div class="feat-item"><span class="feat-dot dot-ia"></span>Dashboard de consumo de tokens</div>
        </div>
      </div>
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-ia"><svg viewBox="0 0 13 13" fill="none"><path d="M2 10.5L5 3.5l2 4 1.5-2 2.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="mod-name">Predictor de Stock</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-ia"></span>Predice repuestos por tipo de OT</div>
          <div class="feat-item"><span class="feat-dot dot-ia"></span>Alerta de bajo stock</div>
          <div class="feat-item"><span class="feat-dot dot-ia"></span>Sugiere proveedor automáticamente</div>
        </div>
      </div>
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-ia"><svg viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="5" r="3.2" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 8.2v3M4.5 11h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="mod-name">Maia Skills</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-ia"></span>Asignación automática de OTs</div>
          <div class="feat-item"><span class="feat-dot dot-ia"></span>Sugerencias reactivas en tiempo real</div>
        </div>
      </div>
      <div class="mod-block">
        <div class="mod-header"><div class="mod-icon mi-ia"><svg viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5C4 1.5 2 3.2 2 5.5c0 3.5 4.5 6.5 4.5 6.5s4.5-3 4.5-6.5C11 3.2 9 1.5 6.5 1.5z" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 5.5l1.5 1.5 2.5-2.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="mod-name">GPS Domicilio</span></div>
        <div class="mod-items">
          <div class="feat-item"><span class="feat-dot dot-ia"></span>Tracking en tiempo real</div>
          <div class="feat-item"><span class="feat-dot dot-ia"></span>Aviso "técnico en camino" por WhatsApp</div>
        </div>
      </div>
      <div class="credit-note">+ Créditos de tokens prepagos para el Agente IA — recargás cuando querés, como crédito de celular.</div>
    </div>
  </div>
  <div class="infra-section">
    <div class="infra-title">Estructura de costos de infraestructura</div>
    <div class="infra-grid">
      <div class="infra-card"><div class="infra-label">Infra / tenant Pro</div><div class="infra-cost">~$1.90</div><div class="infra-detail">Evolution API $1.30 · Claude $0.45 · DB + Redis $0.15</div><div class="infra-margin"><span class="infra-margin-label">Margen bruto</span><span class="infra-margin-val">95%</span></div></div>
      <div class="infra-card"><div class="infra-label">ARCA / AfipSDK</div><div class="infra-cost">~$0.25</div><div class="infra-detail">Plan Growth $80/mes ÷ 100 CUITs a escala</div><div class="infra-margin"><span class="infra-margin-label">Arranque (10 tenants)</span><span class="infra-margin-val">$2.50</span></div></div>
      <div class="infra-card"><div class="infra-label">GPS Google Maps</div><div class="infra-cost">$3–8</div><div class="infra-detail">Depende del volumen de rutas en Plan IA</div><div class="infra-margin"><span class="infra-margin-label">Margen Plan IA</span><span class="infra-margin-val">~93%</span></div></div>
      <div class="infra-card"><div class="infra-label">Créditos IA (extra)</div><div class="infra-cost">Prepago</div><div class="infra-detail">Tokens del Agente IA — margen ~60–70% sobre costo Claude</div><div class="infra-margin"><span class="infra-margin-label">Línea adicional</span><span class="infra-margin-val">activa</span></div></div>
    </div>
  </div>
  <div class="footer">
    <span class="footer-note">Todos los planes incluyen onboarding guiado · Sin permanencia</span>
    <span class="footer-tag">v1.0 · Servicio Técnico · marzo 2026</span>
  </div>
</div>
<script>
  let isAnnual = false;
  const plans = [{id:'pro',monthly:39,annual:33},{id:'biz',monthly:79,annual:66},{id:'ia',monthly:149,annual:124}];
  function toggleBilling() {
    isAnnual = !isAnnual;
    const track = document.getElementById('billing-toggle');
    const lblMonthly = document.getElementById('lbl-monthly');
    const lblAnnual = document.getElementById('lbl-annual');
    track.className = 'toggle-track ' + (isAnnual ? 'on' : 'off');
    lblMonthly.classList.toggle('active', !isAnnual);
    lblAnnual.classList.toggle('active', isAnnual);
    plans.forEach(p => {
      const priceEl = document.querySelector('#price-' + p.id + ' .amount');
      const annualEl = document.getElementById('annual-' + p.id);
      const val = isAnnual ? p.annual : p.monthly;
      priceEl.textContent = val;
      annualEl.textContent = isAnnual ? 'USD ' + (p.annual * 12) + ' facturado anualmente' : '';
    });
  }
<\/script>
</body>
</html>`;

function ModalRubroService({ onClose }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}
    >
      <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:1120,height:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,0.22)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1.1rem",borderBottom:"1px solid #E5E7EB",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
            <i className="bi bi-file-earmark-text" style={{fontSize:"0.9rem",color:"#506886"}} />
            <span style={{fontSize:"0.85rem",fontWeight:700,color:"#1F2937"}}>Documentos</span>
            <i className="bi bi-chevron-right" style={{fontSize:"0.65rem",color:"#9CA3AF"}} />
            <span style={{fontSize:"0.85rem",fontWeight:600,color:"#506886"}}>Rubro Service</span>
          </div>
          <div
            onClick={onClose}
            style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#9CA3AF",fontSize:"0.9rem",transition:"background .12s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#F2F4F6"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <i className="bi bi-x-lg" />
          </div>
        </div>
        <iframe
          srcDoc={RUBRO_SERVICE_HTML}
          style={{flex:1,border:"none",width:"100%"}}
          title="Rubro Service — Tarifario Servicio Técnico"
        />
      </div>
    </div>
  );
}

// ── Modal Módulo Social Media ────────────────────────────────────────────────
const SOCIAL_MEDIA_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Social Studio — Gestión 360 iA</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,600;1,300&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<style>
  :root {
    --bg:#F2F4F6; --white:#FFFFFF;
    --pr:#506886; --pr-d:#3E5270; --pr-l:#6B86A0; --pr-pale:#EDF1F6; --pr-mid:#C2CFD9;
    --em:#3A9E70; --em-d:#2A7A54; --em-pale:#E8F7F1; --em-mid:#B8E0D0;
    --accent:#B08A55; --accent-pale:#F7F0E6;
    --text:#1F2937; --text2:#4B5563; --muted:#9CA3AF; --sub:#6B7280;
    --border:#E5E7EB; --border2:#D1D5DB;
    --red:#D9534F; --red-bg:#FDF2F2;
    --amber:#B08A55; --amber-bg:#FBF6EE;
    --r:11px; --r-sm:7px;
    --sh:0 1px 3px rgba(30,50,80,.06),0 4px 14px rgba(30,50,80,.05);
    --sh-md:0 4px 20px rgba(30,50,80,.10);
    --plan-free:#6B7280; --plan-pro:#506886; --plan-biz:#3A9E70; --plan-ia:#B08A55;
  }
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Inter','Segoe UI',sans-serif; background:var(--bg); color:var(--text); font-size:13px; -webkit-font-smoothing:antialiased; height:100vh; overflow:hidden; display:flex; flex-direction:column; }

  /* ── TOPBAR ── */
  .topbar {
    display:flex; align-items:center; justify-content:space-between;
    padding:0 16px; height:48px; background:var(--white);
    border-bottom:1px solid var(--border); flex-shrink:0;
  }
  .t-brand { display:flex; align-items:center; gap:8px; }
  .t-mark { width:28px; height:28px; border-radius:7px; background:var(--pr); display:flex; align-items:center; justify-content:center; }
  .t-mark i { color:#fff; font-size:13px; }
  .t-name { font-family:'Fraunces',serif; font-size:0.9rem; font-weight:600; color:var(--pr); letter-spacing:-0.01em; }
  .t-sep { font-size:0.7rem; color:var(--muted); }
  .t-module { font-size:0.78rem; font-weight:600; color:var(--text2); }
  .plan-switcher { display:flex; gap:4px; background:var(--bg); border:1px solid var(--border); border-radius:var(--r-sm); padding:3px; }
  .plan-btn {
    padding:4px 12px; border-radius:5px; border:none; cursor:pointer;
    font-family:'Inter',sans-serif; font-size:11px; font-weight:700;
    letter-spacing:0.2px; transition:all .18s; background:transparent; color:var(--muted);
  }
  .plan-btn:hover:not(.active) { color:var(--text); background:var(--border); }
  .plan-btn.free.active   { background:var(--plan-free);  color:#fff; }
  .plan-btn.pro.active    { background:var(--plan-pro);   color:#fff; }
  .plan-btn.biz.active    { background:var(--plan-biz);   color:#fff; }
  .plan-btn.ia.active     { background:var(--plan-ia);    color:#fff; }
  .t-right { display:flex; align-items:center; gap:8px; }
  .t-avatar { width:28px; height:28px; border-radius:50%; background:var(--pr); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; }

  /* ── LAYOUT ── */
  .app-layout { display:grid; grid-template-columns:200px 1fr 280px; flex:1; overflow:hidden; }

  /* ── SIDEBAR ── */
  .sidebar { background:var(--white); border-right:1px solid var(--border); overflow-y:auto; padding:10px 8px; }
  .sb-sec-label {
    font-size:10px; font-weight:700; letter-spacing:.1em; color:var(--muted);
    text-transform:uppercase; padding:6px 8px 4px; margin-top:6px;
  }
  .ni {
    display:flex; align-items:center; gap:8px; padding:7px 9px; border-radius:var(--r-sm);
    cursor:pointer; font-size:12px; font-weight:500; color:var(--text2);
    transition:all .13s; border:1px solid transparent; margin-bottom:1px;
  }
  .ni:hover { background:var(--bg); color:var(--text); }
  .ni.on { background:var(--pr-pale); color:var(--pr); border-color:var(--pr-mid); font-weight:600; }
  .ni i { font-size:14px; width:18px; text-align:center; }
  .ni-badge {
    margin-left:auto; font-size:9px; font-weight:700; padding:2px 6px;
    border-radius:20px; background:var(--pr-pale); color:var(--pr);
  }
  .ni-lock { margin-left:auto; font-size:9px; font-weight:700; padding:2px 6px; border-radius:20px; background:var(--amber-bg); color:var(--amber); }
  .ni-ai { margin-left:auto; font-size:9px; font-weight:800; padding:2px 6px; border-radius:20px; background:var(--em-pale); color:var(--em-d); letter-spacing:.3px; }
  .sb-divider { height:1px; background:var(--border); margin:8px 0; }
  .plan-features { padding:0 4px; }
  .fi { display:flex; align-items:center; gap:6px; padding:4px 0; font-size:11px; color:var(--text2); border-bottom:1px solid rgba(0,0,0,.04); }
  .fi.ok { color:var(--text); }
  .fi.no { opacity:.45; text-decoration:line-through; }
  .fi-check { font-size:10px; }
  .fi.ok .fi-check { color:var(--em); }
  .fi.no .fi-check { color:var(--muted); }

  /* ── MAIN ── */
  .main { overflow-y:auto; background:var(--bg); }
  .view { display:none; padding:20px; animation:fadeIn .25s ease; }
  .view.on { display:block; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
  .vh { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
  .vh-title { font-family:'Fraunces',serif; font-size:1.3rem; font-weight:600; color:var(--text); letter-spacing:-0.02em; }
  .vh-title span { color:var(--pr); font-style:italic; }
  .vh-sub { font-size:11.5px; color:var(--muted); margin-top:2px; }

  /* ── BUTTONS ── */
  .btn { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:var(--r-sm); font-family:'Inter',sans-serif; font-size:12px; font-weight:600; cursor:pointer; border:none; transition:all .14s; }
  .btn-pr { background:var(--pr); color:#fff; box-shadow:0 2px 6px rgba(80,104,134,.22); }
  .btn-pr:hover { background:var(--pr-d); }
  .btn-out { background:none; border:1px solid var(--border2); color:var(--text2); }
  .btn-out:hover { border-color:var(--pr); color:var(--pr); background:var(--pr-pale); }
  .btn-em { background:var(--em); color:#fff; box-shadow:0 2px 6px rgba(58,158,112,.2); }
  .btn-em:hover { background:var(--em-d); }
  .btn-sm { padding:5px 11px; font-size:11.5px; }
  .btn-row { display:flex; gap:6px; }

  /* ── CARDS ── */
  .card { background:var(--white); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--sh); overflow:hidden; }
  .ch { padding:10px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
  .ch-title { font-size:12.5px; font-weight:700; color:var(--text); flex:1; }
  .cb { padding:14px; }

  /* ── GRIDS ── */
  .g2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
  .g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:14px; }

  /* ── LOCKED OVERLAY ── */
  .locked-wrap { position:relative; border-radius:var(--r); overflow:hidden; }
  .locked-wrap::after { content:''; position:absolute; inset:0; background:rgba(242,244,246,.82); backdrop-filter:blur(2px); border-radius:var(--r); }
  .lock-over { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:10; gap:8px; }
  .lock-badge { font-size:11px; font-weight:700; color:var(--amber); background:var(--amber-bg); border:1px solid rgba(176,138,85,.3); padding:4px 14px; border-radius:20px; }

  /* ── DESIGNER ── */
  .designer { display:grid; grid-template-columns:1fr 260px; gap:14px; }
  .canvas-toolbar { display:flex; align-items:center; gap:6px; padding:9px 12px; border-bottom:1px solid var(--border); background:var(--bg); flex-wrap:wrap; }
  .tool-btn { padding:4px 10px; background:var(--white); border:1px solid var(--border2); border-radius:5px; color:var(--text2); font-size:11.5px; font-weight:600; cursor:pointer; transition:all .13s; font-family:'Inter',sans-serif; }
  .tool-btn:hover, .tool-btn.on { background:var(--pr-pale); border-color:var(--pr-mid); color:var(--pr); }
  .tool-sep { width:1px; height:18px; background:var(--border2); margin:0 2px; }
  .canvas-area {
    display:flex; align-items:center; justify-content:center; padding:24px; min-height:340px;
    background: repeating-linear-gradient(0deg,transparent,transparent 23px,var(--border) 23px,var(--border) 24px),
                repeating-linear-gradient(90deg,transparent,transparent 23px,var(--border) 23px,var(--border) 24px);
  }
  .post-canvas {
    width:240px; height:240px; border-radius:14px; box-shadow:var(--sh-md);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    position:relative; overflow:hidden; cursor:pointer; transition:all .25s;
    background:var(--pr);
  }
  .post-canvas:hover { transform:scale(1.02); box-shadow:0 8px 32px rgba(80,104,134,.22); }
  .canvas-bg { position:absolute; inset:0; background:var(--canvas-bg,linear-gradient(135deg,#506886,#3E5270)); transition:background .4s; }
  .canvas-content { position:relative; z-index:2; text-align:center; padding:18px; }
  .canvas-headline { font-family:'Fraunces',serif; font-size:17px; font-weight:600; color:#fff; text-shadow:0 2px 8px rgba(0,0,0,.3); line-height:1.25; margin-bottom:7px; outline:none; }
  .canvas-sub { font-size:10.5px; color:rgba(255,255,255,.7); font-weight:500; }
  .canvas-logo { position:absolute; bottom:12px; right:12px; font-family:'Fraunces',serif; font-size:9px; font-weight:600; color:rgba(255,255,255,.45); }
  .panel-title { font-size:10px; font-weight:700; letter-spacing:.08em; color:var(--muted); text-transform:uppercase; margin-bottom:10px; }
  .tpl-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:14px; }
  .tpl-thumb { aspect-ratio:1; border-radius:7px; cursor:pointer; border:2px solid transparent; transition:all .18s; overflow:hidden; position:relative; }
  .tpl-thumb:hover, .tpl-thumb.on { border-color:var(--pr); }
  .tpl-name { position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,.5); font-size:8.5px; font-weight:700; color:#fff; padding:3px 5px; text-align:center; }
  .color-row { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:12px; }
  .swatch { width:20px; height:20px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:all .15s; flex-shrink:0; }
  .swatch:hover, .swatch.on { border-color:var(--pr); transform:scale(1.18); }
  .fg { margin-bottom:10px; }
  .fl { display:block; font-size:10.5px; font-weight:600; color:var(--muted); margin-bottom:4px; text-transform:uppercase; letter-spacing:.04em; }
  .fi-input { width:100%; padding:7px 9px; background:var(--bg); border:1px solid var(--border2); border-radius:var(--r-sm); color:var(--text); font-family:'Inter',sans-serif; font-size:12px; transition:border .14s; }
  .fi-input:focus { outline:none; border-color:var(--pr); box-shadow:0 0 0 3px rgba(80,104,134,.1); }
  select.fi-input { cursor:pointer; }

  /* ── MEDIA ── */
  .drop-zone { border:2px dashed var(--border2); border-radius:var(--r); padding:28px 18px; text-align:center; cursor:pointer; transition:all .18s; background:var(--white); }
  .drop-zone:hover { border-color:var(--pr); background:var(--pr-pale); }
  .drop-icon { font-size:28px; opacity:.45; margin-bottom:8px; color:var(--pr); }
  .drop-title { font-size:13px; font-weight:700; color:var(--text2); margin-bottom:3px; }
  .drop-sub { font-size:10.5px; color:var(--muted); }
  .media-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:7px; }
  .media-thumb { aspect-ratio:1; border-radius:7px; overflow:hidden; cursor:pointer; position:relative; border:2px solid transparent; transition:all .18s; }
  .media-thumb:hover { border-color:var(--pr); transform:scale(1.04); }
  .media-ph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:18px; border-radius:5px; }
  .media-over { position:absolute; inset:0; background:rgba(80,104,134,.55); opacity:0; display:flex; align-items:center; justify-content:center; font-size:16px; color:#fff; transition:opacity .18s; }
  .media-thumb:hover .media-over { opacity:1; }

  /* ── COPY / TEXT ── */
  .net-tabs { display:flex; gap:5px; margin-bottom:12px; flex-wrap:wrap; }
  .net-tab { padding:4px 11px; border-radius:20px; border:1px solid var(--border2); background:transparent; color:var(--muted); font-size:11px; font-weight:700; cursor:pointer; transition:all .14s; font-family:'Inter',sans-serif; }
  .net-tab.on { background:var(--pr); border-color:var(--pr); color:#fff; }
  .net-tab.ig.on { background:linear-gradient(135deg,#f09433,#dc2743,#bc1888); border-color:transparent; }
  .net-tab.fb.on { background:#1877f2; border-color:#1877f2; }
  .net-tab.tw.on { background:#1F2937; border-color:#1F2937; }
  .net-tab.li.on { background:#0a66c2; border-color:#0a66c2; }
  .copy-area { background:var(--bg); border:1px solid var(--border2); border-radius:var(--r-sm); padding:12px; min-height:110px; font-size:12.5px; line-height:1.65; color:var(--text); outline:none; cursor:text; font-family:'Inter',sans-serif; transition:border .14s; }
  .copy-area:focus { border-color:var(--pr); }
  .hashtag-row { display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; }
  .hashtag { font-size:11px; font-weight:600; padding:2px 9px; border-radius:20px; background:var(--pr-pale); color:var(--pr); border:1px solid var(--pr-mid); cursor:pointer; transition:all .13s; }
  .hashtag:hover { background:var(--pr-mid); }
  .topic-row { display:flex; gap:6px; margin-bottom:12px; }
  .topic-input { flex:1; padding:7px 10px; background:var(--bg); border:1px solid var(--border2); border-radius:var(--r-sm); color:var(--text); font-family:'Inter',sans-serif; font-size:12px; }
  .topic-input:focus { outline:none; border-color:var(--pr); }
  .ai-badge { font-size:9px; font-weight:800; letter-spacing:.06em; padding:2px 7px; border-radius:20px; background:var(--em-pale); color:var(--em-d); border:1px solid var(--em-mid); }
  .besttime-row { display:flex; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--border); }
  .besttime-row:last-child { border-bottom:none; }
  .bt-label { font-size:12px; color:var(--text2); display:flex; align-items:center; gap:5px; }
  .bt-val { font-size:13px; font-weight:700; color:var(--text); }
  .plan-notice { display:flex; align-items:center; gap:7px; padding:8px 11px; border-radius:var(--r-sm); font-size:11px; font-weight:600; margin-bottom:8px; }
  .notice-lock { background:var(--amber-bg); border:1px solid rgba(176,138,85,.25); color:var(--amber); }
  .notice-ok   { background:var(--em-pale);  border:1px solid var(--em-mid); color:var(--em-d); }
  .post-preview { background:var(--bg); border:1px solid var(--border); border-radius:9px; overflow:hidden; margin-top:10px; }
  .pp-hdr { display:flex; align-items:center; gap:8px; padding:9px 11px; }
  .pp-av { width:28px; height:28px; border-radius:50%; background:var(--pr); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:#fff; }
  .pp-name { font-size:11.5px; font-weight:700; color:var(--text); }
  .pp-time { font-size:10px; color:var(--muted); }
  .pp-img { width:100%; height:100px; background:linear-gradient(135deg,var(--pr),var(--pr-d)); display:flex; align-items:center; justify-content:center; font-size:32px; color:rgba(255,255,255,.25); }
  .pp-text { padding:9px 11px; font-size:11px; color:var(--text2); line-height:1.55; }
  .pp-acts { display:flex; gap:12px; padding:7px 11px; border-top:1px solid var(--border); }
  .pp-act { font-size:11px; color:var(--muted); font-weight:600; cursor:pointer; transition:color .13s; }
  .pp-act:hover { color:var(--pr); }

  /* ── CALENDAR ── */
  .cal-layout { display:grid; grid-template-columns:1fr 260px; gap:14px; }
  .cal-hdr { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-bottom:1px solid var(--border); }
  .cal-month { font-family:'Fraunces',serif; font-size:1rem; font-weight:600; color:var(--text); }
  .cal-nav { display:flex; gap:4px; }
  .cal-nav-btn { width:28px; height:28px; border-radius:5px; border:1px solid var(--border2); background:var(--bg); color:var(--text2); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; transition:all .13s; }
  .cal-nav-btn:hover { background:var(--pr-pale); border-color:var(--pr-mid); color:var(--pr); }
  .cal-grid-wrap { padding:10px; }
  .cal-days { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-bottom:4px; }
  .cal-dn { text-align:center; font-size:10px; font-weight:700; letter-spacing:.04em; color:var(--muted); text-transform:uppercase; padding:3px 0; }
  .cal-cells { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
  .cal-cell { min-height:58px; border-radius:7px; padding:5px; background:var(--white); border:1px solid var(--border); cursor:pointer; transition:all .13s; overflow:hidden; }
  .cal-cell:hover { border-color:var(--pr-mid); background:var(--pr-pale); }
  .cal-cell.today { border-color:var(--pr); background:var(--pr-pale); }
  .cal-cell.dim { opacity:.35; }
  .cal-num { font-size:10.5px; font-weight:700; color:var(--muted); margin-bottom:3px; }
  .cal-cell.today .cal-num { color:var(--pr); }
  .cal-post { font-size:8.5px; font-weight:600; padding:2px 4px; border-radius:3px; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cal-post.ig { background:#FEF0F5; color:#9B1C4E; }
  .cal-post.fb { background:#EBF3FE; color:#1455B5; }
  .cal-post.tw { background:#F3F4F6; color:#374151; }
  .queue-item { background:var(--bg); border:1px solid var(--border); border-radius:var(--r-sm); padding:10px; margin-bottom:6px; cursor:pointer; transition:all .13s; }
  .queue-item:hover { border-color:var(--pr-mid); }
  .q-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; }
  .q-net { font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; }
  .q-net.ig { background:#FEF0F5; color:#9B1C4E; }
  .q-net.fb { background:#EBF3FE; color:#1455B5; }
  .q-net.tw { background:#F3F4F6; color:#374151; }
  .q-time { font-size:10px; color:var(--muted); font-weight:600; }
  .q-text { font-size:11px; color:var(--text2); line-height:1.5; margin-bottom:5px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .q-status { font-size:10px; font-weight:700; display:flex; align-items:center; gap:4px; }
  .q-status.sched { color:var(--amber); }
  .q-status.pub { color:var(--em); }

  /* ── METRICS ── */
  .kpi { background:var(--white); border:1px solid var(--border); border-radius:var(--r); padding:14px 16px; box-shadow:var(--sh); }
  .kpi-label { font-size:10px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; margin-bottom:5px; }
  .kpi-val { font-family:'Fraunces',serif; font-size:1.9rem; font-weight:600; color:var(--text); line-height:1; margin-bottom:3px; }
  .kpi-chg { font-size:11px; font-weight:600; }
  .kpi-chg.up { color:var(--em); }
  .kpi-chg.dn { color:var(--red); }
  .bar-chart { display:flex; align-items:flex-end; gap:4px; height:70px; }
  .bar { flex:1; background:linear-gradient(180deg,var(--pr),var(--pr-pale)); border-radius:3px 3px 0 0; min-width:8px; transition:all .25s; cursor:pointer; }
  .bar:hover { background:linear-gradient(180deg,var(--em),var(--em-pale)); }
  .bar-labels { display:flex; gap:4px; }
  .bl { flex:1; text-align:center; font-size:8.5px; color:var(--muted); font-weight:600; margin-top:3px; }

  /* ── AUTOMATIONS ── */
  .auto-item { background:var(--bg); border:1px solid var(--border); border-radius:var(--r-sm); padding:12px; margin-bottom:8px; }
  .auto-row { display:flex; align-items:center; justify-content:space-between; }
  .auto-name { font-size:12.5px; font-weight:700; color:var(--text); }
  .auto-desc { font-size:11px; color:var(--muted); margin-top:3px; }
  .tog { width:34px; height:18px; border-radius:20px; cursor:pointer; position:relative; transition:background .2s; background:var(--border2); flex-shrink:0; }
  .tog.on { background:var(--pr); }
  .tog-k { width:14px; height:14px; background:#fff; border-radius:50%; position:absolute; top:2px; left:2px; transition:transform .2s; box-shadow:0 1px 3px rgba(0,0,0,.2); }
  .tog.on .tog-k { transform:translateX(16px); }
  .ai-card { border-radius:var(--r-sm); padding:11px 13px; margin-bottom:8px; }
  .ai-card.teal { background:var(--em-pale); border:1px solid var(--em-mid); }
  .ai-card.blue { background:var(--pr-pale); border:1px solid var(--pr-mid); }
  .ai-card.amber { background:var(--amber-bg); border:1px solid rgba(176,138,85,.25); }
  .ai-card-title { font-size:11.5px; font-weight:700; margin-bottom:3px; }
  .ai-card.teal .ai-card-title { color:var(--em-d); }
  .ai-card.blue .ai-card-title { color:var(--pr); }
  .ai-card.amber .ai-card-title { color:var(--amber); }
  .ai-card p { font-size:11px; color:var(--text2); line-height:1.55; }

  /* ── RIGHT PANEL ── */
  .rp { background:var(--white); border-left:1px solid var(--border); overflow-y:auto; display:flex; flex-direction:column; }
  .rp-sec { padding:14px; border-bottom:1px solid var(--border); }
  .rp-title { font-size:10px; font-weight:700; letter-spacing:.08em; color:var(--muted); text-transform:uppercase; margin-bottom:10px; }
  .acc-chip { display:flex; align-items:center; gap:8px; padding:8px 10px; background:var(--bg); border:1px solid var(--border); border-radius:var(--r-sm); margin-bottom:5px; cursor:pointer; transition:all .13s; }
  .acc-chip:hover { border-color:var(--pr-mid); }
  .acc-chip.sel { border-color:var(--pr); background:var(--pr-pale); }
  .acc-icon { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
  .acc-icon.ig { background:linear-gradient(135deg,#f09433,#dc2743,#bc1888); color:#fff; }
  .acc-icon.fb { background:#1877f2; color:#fff; }
  .acc-icon.tw { background:#1F2937; color:#fff; }
  .acc-name { font-size:12px; font-weight:700; color:var(--text); }
  .acc-handle { font-size:10px; color:var(--muted); }
  .acc-check { width:14px; height:14px; border-radius:50%; border:1.5px solid var(--border2); background:transparent; margin-left:auto; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:8px; transition:all .14s; }
  .acc-chip.sel .acc-check { background:var(--pr); border-color:var(--pr); color:#fff; }
  .sched-row { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px; }
  .sched-row input { width:100%; padding:7px 8px; background:var(--bg); border:1px solid var(--border2); border-radius:var(--r-sm); color:var(--text); font-family:'Inter',sans-serif; font-size:11.5px; color-scheme:light; }
  .sched-row input:focus { outline:none; border-color:var(--pr); }
  .mini-stat { display:flex; align-items:center; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); }
  .mini-stat:last-child { border-bottom:none; }
  .ms-label { font-size:12px; color:var(--text2); }
  .ms-val { font-size:13px; font-weight:700; color:var(--text); }
  .ms-val.em { color:var(--em); }
  .ms-val.amber { color:var(--amber); }
  .stor-bar-wrap { height:5px; background:var(--bg); border-radius:3px; overflow:hidden; margin:4px 0 4px; }
  .stor-bar { height:100%; border-radius:3px; transition:.5s; }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
</style>
</head>
<body>

<!-- TOPBAR -->
<div class="topbar">
  <div class="t-brand">
    <div class="t-mark"><i class="bi bi-grid-1x2-fill"></i></div>
    <span class="t-name">Gestión 360 iA</span>
    <span class="t-sep">/</span>
    <span class="t-module">Social Studio</span>
  </div>
  <div class="plan-switcher">
    <button class="plan-btn free" onclick="setPlan('free')">FREE</button>
    <button class="plan-btn pro active" onclick="setPlan('pro')">PRO</button>
    <button class="plan-btn biz" onclick="setPlan('biz')">BUSINESS</button>
    <button class="plan-btn ia" onclick="setPlan('ia')">PLAN IA</button>
  </div>
  <div class="t-right">
    <div class="t-avatar">PA</div>
  </div>
</div>

<div class="app-layout">

  <!-- SIDEBAR -->
  <nav class="sidebar">
    <div class="sb-sec-label">Contenido</div>
    <div class="ni on" onclick="setView('composer')"><i class="bi bi-palette"></i> Diseñar pieza</div>
    <div class="ni" onclick="setView('media')"><i class="bi bi-images"></i> Biblioteca <span class="ni-badge" id="badge-media">24</span></div>
    <div class="ni" onclick="setView('copy')"><i class="bi bi-pencil-square"></i> Texto sugerido <span class="ni-ai" id="badge-ai">IA</span></div>
    <div class="sb-divider"></div>
    <div class="sb-sec-label">Publicación</div>
    <div class="ni" onclick="setView('calendar')"><i class="bi bi-calendar3"></i> Calendario</div>
    <div class="ni" onclick="setView('metrics')"><i class="bi bi-bar-chart-line"></i> Métricas <span id="lock-metrics" class="ni-lock" style="display:none">PRO+</span></div>
    <div class="ni" onclick="setView('automations')"><i class="bi bi-lightning-charge"></i> Automatizaciones <span id="lock-auto" class="ni-lock" style="display:none">IA</span></div>
    <div class="sb-divider"></div>
    <div class="sb-sec-label">Plan actual</div>
    <div class="plan-features" id="plan-features"></div>
  </nav>

  <!-- MAIN -->
  <main class="main">

    <!-- COMPOSER -->
    <div class="view on" id="view-composer">
      <div class="vh">
        <div><div class="vh-title">Diseñar <span>Pieza Gráfica</span></div><div class="vh-sub">Creá tu contenido visual para redes sociales</div></div>
        <div class="btn-row">
          <button class="btn btn-out btn-sm" onclick="alert('👁️ Preview generado')"><i class="bi bi-eye"></i> Preview</button>
          <button class="btn btn-pr btn-sm" onclick="alert('✅ Pieza guardada en biblioteca!')"><i class="bi bi-floppy"></i> Guardar pieza</button>
        </div>
      </div>
      <div class="designer">
        <div class="card">
          <div class="canvas-toolbar">
            <button class="tool-btn on" onclick="setFormat('square',this)">1:1 Post</button>
            <button class="tool-btn" onclick="setFormat('story',this)">9:16 Story</button>
            <button class="tool-btn" onclick="setFormat('banner',this)">16:9 Banner</button>
            <span class="tool-sep"></span>
            <button class="tool-btn" onclick="toggleGrid(this)"><i class="bi bi-grid-3x3"></i> Grid</button>
            <button class="tool-btn" onclick="document.getElementById('canvas-headline').focus()"><i class="bi bi-type"></i> Texto</button>
          </div>
          <div class="canvas-area" id="canvas-area">
            <div class="post-canvas" id="post-canvas">
              <div class="canvas-bg" id="canvas-bg"></div>
              <div class="canvas-content">
                <div class="canvas-headline" id="canvas-headline" contenteditable="true" onclick="event.stopPropagation()">Automatizá tu negocio con IA</div>
                <div class="canvas-sub" id="canvas-sub">Gestión 360 iA · gestion360ia.com.ar</div>
              </div>
              <div class="canvas-logo">G360 iA</div>
            </div>
          </div>
        </div>
        <div class="card cb" style="overflow-y:auto;max-height:440px">
          <div class="panel-title"><i class="bi bi-palette2"></i> Plantillas</div>
          <div class="tpl-grid" id="tpl-grid">
            <div class="tpl-thumb on" onclick="applyTpl(0)" style="background:linear-gradient(135deg,#506886,#3E5270)"><span class="tpl-name">Pizarra</span></div>
            <div class="tpl-thumb" onclick="applyTpl(1)" style="background:linear-gradient(135deg,#1A7A4A,#0f5233)"><span class="tpl-name">Verde G360</span></div>
            <div class="tpl-thumb" onclick="applyTpl(2)" style="background:linear-gradient(135deg,#B08A55,#7A5800)"><span class="tpl-name">Dorado</span></div>
            <div class="tpl-thumb" onclick="applyTpl(3)" style="background:linear-gradient(135deg,#1F2937,#374151)"><span class="tpl-name">Oscuro</span></div>
            <div class="tpl-thumb locked-wrap" id="tpl-4" onclick="lockAlert('Pro')">
              <div class="lock-over"><i class="bi bi-lock-fill" style="font-size:16px;color:var(--amber)"></i><span class="lock-badge">PRO</span></div>
              <div style="height:100%;background:linear-gradient(135deg,#3A9E70,#2A7A54)"></div><span class="tpl-name">Esmeralda</span>
            </div>
            <div class="tpl-thumb locked-wrap" id="tpl-5" onclick="lockAlert('IA')">
              <div class="lock-over"><i class="bi bi-lock-fill" style="font-size:16px;color:var(--amber)"></i><span class="lock-badge">IA</span></div>
              <div style="height:100%;background:linear-gradient(135deg,#7C3AED,#5B21B6)"></div><span class="tpl-name">Violeta IA</span>
            </div>
          </div>
          <div class="panel-title"><i class="bi bi-droplet-half"></i> Color de fondo</div>
          <div class="color-row" id="color-row">
            <div class="swatch on" style="background:linear-gradient(135deg,#506886,#3E5270)" onclick="applyColor('linear-gradient(135deg,#506886,#3E5270)',this)"></div>
            <div class="swatch" style="background:linear-gradient(135deg,#1A7A4A,#0f5233)" onclick="applyColor('linear-gradient(135deg,#1A7A4A,#0f5233)',this)"></div>
            <div class="swatch" style="background:linear-gradient(135deg,#B08A55,#7A5800)" onclick="applyColor('linear-gradient(135deg,#B08A55,#7A5800)',this)"></div>
            <div class="swatch" style="background:linear-gradient(135deg,#1F2937,#374151)" onclick="applyColor('linear-gradient(135deg,#1F2937,#374151)',this)"></div>
            <div class="swatch" style="background:linear-gradient(135deg,#3A9E70,#2A7A54)" onclick="applyColor('linear-gradient(135deg,#3A9E70,#2A7A54)',this)"></div>
            <div class="swatch" style="background:linear-gradient(135deg,#7C3AED,#5B21B6)" onclick="applyColor('linear-gradient(135deg,#7C3AED,#5B21B6)',this)"></div>
            <div class="swatch" style="background:#F2F4F6;border:1.5px solid #D1D5DB" onclick="applyColor('#F2F4F6',this)"></div>
            <div class="swatch" style="background:linear-gradient(135deg,#E1306C,#833AB4)" onclick="applyColor('linear-gradient(135deg,#E1306C,#833AB4)',this)"></div>
          </div>
          <div class="fg"><label class="fl">Título principal</label>
            <input class="fi-input" type="text" id="inp-headline" value="Automatizá tu negocio con IA" oninput="document.getElementById('canvas-headline').innerText=this.value">
          </div>
          <div class="fg"><label class="fl">Subtítulo / marca</label>
            <input class="fi-input" type="text" id="inp-sub" value="Gestión 360 iA · gestion360ia.com.ar" oninput="document.getElementById('canvas-sub').innerText=this.value">
          </div>
          <div class="fg"><label class="fl">Tamaño de fuente</label>
            <select class="fi-input" onchange="document.getElementById('canvas-headline').style.fontSize=this.value+'px'">
              <option value="14">14px — Compacto</option>
              <option value="17" selected>17px — Normal</option>
              <option value="21">21px — Grande</option>
              <option value="25">25px — Display</option>
            </select>
          </div>
          <button class="btn btn-em" style="width:100%;justify-content:center;margin-top:4px" onclick="alert('✅ Pieza añadida a biblioteca!')"><i class="bi bi-plus-lg"></i> Agregar a biblioteca</button>
        </div>
      </div>
    </div>

    <!-- MEDIA -->
    <div class="view" id="view-media">
      <div class="vh">
        <div><div class="vh-title">Biblioteca de <span>Medios</span></div><div class="vh-sub">Fotos, videos y piezas gráficas disponibles</div></div>
        <button class="btn btn-pr btn-sm" onclick="alert('📂 Seleccioná archivos para subir')"><i class="bi bi-upload"></i> Subir medios</button>
      </div>
      <div class="g2" style="margin-bottom:16px">
        <div class="drop-zone" onclick="alert('📂 Seleccioná fotos o arrastrá acá')">
          <div class="drop-icon"><i class="bi bi-image"></i></div>
          <div class="drop-title">Subir fotos</div>
          <div class="drop-sub">PNG, JPG, WEBP · Máx. 10MB</div>
        </div>
        <div class="drop-zone" id="video-zone" onclick="handleVideoUpload()">
          <div class="drop-icon"><i class="bi bi-camera-video"></i></div>
          <div class="drop-title" id="vzone-title">Subir videos</div>
          <div class="drop-sub" id="vzone-sub">MP4, MOV · Máx. 200MB</div>
        </div>
      </div>
      <div class="card">
        <div class="ch">
          <span class="ch-title"><i class="bi bi-folder2-open"></i> Mis archivos (24)</span>
          <button class="btn btn-out btn-sm" onclick="alert('🔍 Buscar en biblioteca')"><i class="bi bi-search"></i> Buscar</button>
        </div>
        <div class="cb"><div class="media-grid" id="media-grid"></div></div>
      </div>
    </div>

    <!-- COPY -->
    <div class="view" id="view-copy">
      <div class="vh">
        <div><div class="vh-title">Texto <span>Sugerido</span></div><div class="vh-sub">Generá copies optimizados por red social</div></div>
        <div id="copy-notice"></div>
      </div>
      <div class="g2">
        <div class="card cb">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
            <span style="font-size:13px;font-weight:700;color:var(--text)"><i class="bi bi-stars" style="color:var(--em)"></i> Generador de Copy</span>
            <span class="ai-badge">IA</span>
          </div>
          <div class="net-tabs">
            <button class="net-tab ig on" onclick="setNet(this,'ig')"><i class="bi bi-instagram"></i> Instagram</button>
            <button class="net-tab fb" onclick="setNet(this,'fb')"><i class="bi bi-facebook"></i> Facebook</button>
            <button class="net-tab tw" onclick="setNet(this,'tw')">𝕏 Twitter</button>
            <button class="net-tab li" onclick="setNet(this,'li')"><i class="bi bi-linkedin"></i> LinkedIn</button>
          </div>
          <div class="topic-row">
            <input class="topic-input" type="text" id="topic-input" placeholder="Tema del post…" value="Automatización con IA para pymes argentinas">
            <button class="btn btn-pr btn-sm" onclick="generateCopy()"><i class="bi bi-lightning-charge-fill"></i> Generar</button>
          </div>
          <div class="copy-area" id="copy-area" contenteditable="true">🚀 ¿Seguís haciendo todo a mano en tu negocio?

La inteligencia artificial ya no es ciencia ficción. Con Gestión 360 iA, automatizás WhatsApp, turnos, facturación y atención al cliente — todo desde un solo lugar.

Las pymes que adoptan IA hoy tienen una ventaja real sobre las que esperan. ¿Tu negocio ya está listo?

📲 Escribinos y te contamos cómo empezar.</div>
          <div class="hashtag-row" id="hashtag-row">
            <span class="hashtag">#InteligenciaArtificial</span>
            <span class="hashtag">#PymesArgentinas</span>
            <span class="hashtag">#Automatización</span>
            <span class="hashtag">#NegociosDigitales</span>
            <span class="hashtag">#IA</span>
            <span class="hashtag">#Gestión360</span>
          </div>
          <div class="btn-row" style="margin-top:12px">
            <button class="btn btn-out btn-sm" style="flex:1;justify-content:center" onclick="generateCopy()"><i class="bi bi-arrow-repeat"></i> Regenerar</button>
            <button class="btn btn-pr btn-sm" style="flex:1;justify-content:center" onclick="alert('✅ Copy copiado al portapapeles!')"><i class="bi bi-clipboard"></i> Copiar</button>
          </div>
        </div>
        <div>
          <div class="card cb" style="margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
              <span style="font-size:12.5px;font-weight:700"><i class="bi bi-clock" style="color:var(--pr)"></i> Mejor horario</span>
              <span class="ai-badge" id="besttime-ai" style="display:none">IA</span>
            </div>
            <div id="besttime-wrap">
              <div class="besttime-row"><span class="bt-label"><i class="bi bi-instagram"></i> Instagram</span><span class="bt-val">18:00 – 21:00</span></div>
              <div class="besttime-row"><span class="bt-label"><i class="bi bi-facebook"></i> Facebook</span><span class="bt-val">12:00 – 14:00</span></div>
              <div class="besttime-row"><span class="bt-label">𝕏 Twitter</span><span class="bt-val">09:00 – 11:00</span></div>
              <div class="besttime-row"><span class="bt-label"><i class="bi bi-linkedin"></i> LinkedIn</span><span class="bt-val">08:00 – 10:00</span></div>
            </div>
            <div id="besttime-lock" style="display:none"><div class="plan-notice notice-lock"><i class="bi bi-lock-fill"></i> Horario IA disponible desde Plan Business</div></div>
          </div>
          <div class="card cb">
            <div style="font-size:12.5px;font-weight:700;margin-bottom:10px"><i class="bi bi-eye" style="color:var(--pr)"></i> Preview del post</div>
            <div class="post-preview">
              <div class="pp-hdr"><div class="pp-av">G3</div><div><div class="pp-name">Gestión 360 iA</div><div class="pp-time">Ahora · <i class="bi bi-instagram"></i></div></div></div>
              <div class="pp-img"><i class="bi bi-robot" style="font-size:32px;color:rgba(255,255,255,.3)"></i></div>
              <div class="pp-text" id="preview-text">🚀 ¿Seguís haciendo todo a mano en tu negocio? La inteligencia artificial ya no es ciencia ficción…</div>
              <div class="pp-acts"><span class="pp-act"><i class="bi bi-heart"></i> 0</span><span class="pp-act"><i class="bi bi-chat"></i> 0</span><span class="pp-act"><i class="bi bi-share"></i> Compartir</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CALENDAR -->
    <div class="view" id="view-calendar">
      <div class="vh">
        <div><div class="vh-title">Calendario <span>Editorial</span></div><div class="vh-sub">Programá y organizá tus publicaciones</div></div>
        <button class="btn btn-pr btn-sm" onclick="setView('composer')"><i class="bi bi-plus-lg"></i> Nueva pieza</button>
      </div>
      <div class="cal-layout">
        <div class="card">
          <div class="cal-hdr">
            <button class="cal-nav-btn" onclick="prevMonth()"><i class="bi bi-chevron-left"></i></button>
            <div class="cal-month" id="cal-month-lbl">Marzo 2026</div>
            <button class="cal-nav-btn" onclick="nextMonth()"><i class="bi bi-chevron-right"></i></button>
          </div>
          <div class="cal-grid-wrap">
            <div class="cal-days"><div class="cal-dn">Dom</div><div class="cal-dn">Lun</div><div class="cal-dn">Mar</div><div class="cal-dn">Mié</div><div class="cal-dn">Jue</div><div class="cal-dn">Vie</div><div class="cal-dn">Sáb</div></div>
            <div class="cal-cells" id="cal-cells"></div>
          </div>
        </div>
        <div class="card" style="overflow:hidden">
          <div class="ch"><span class="ch-title"><i class="bi bi-list-check"></i> Cola de publicación</span></div>
          <div class="cb" style="padding:10px">
            <div class="queue-item"><div class="q-hdr"><span class="q-net ig"><i class="bi bi-instagram"></i> Instagram</span><span class="q-time">Hoy 18:30</span></div><div class="q-text">🚀 ¿Seguís haciendo todo a mano en tu negocio? La IA ya llegó a las pymes argentinas...</div><div class="q-status sched"><i class="bi bi-clock"></i> Programado</div></div>
            <div class="queue-item"><div class="q-hdr"><span class="q-net fb"><i class="bi bi-facebook"></i> Facebook</span><span class="q-time">Mañana 12:00</span></div><div class="q-text">💡 5 procesos que podés automatizar HOY en tu negocio con inteligencia artificial...</div><div class="q-status sched"><i class="bi bi-clock"></i> Programado</div></div>
            <div class="queue-item"><div class="q-hdr"><span class="q-net tw">𝕏 Twitter</span><span class="q-time">28 Mar 09:00</span></div><div class="q-text">El 67% de las pymes que adoptaron IA vieron más productividad en 3 meses.</div><div class="q-status sched"><i class="bi bi-clock"></i> Programado</div></div>
            <div class="queue-item" style="opacity:.6"><div class="q-hdr"><span class="q-net ig"><i class="bi bi-instagram"></i> Instagram</span><span class="q-time">25 Mar 19:00</span></div><div class="q-text">Caso real: cómo un consultorio redujo un 40% su tiempo de gestión con IA...</div><div class="q-status pub"><i class="bi bi-check-circle-fill"></i> Publicado</div></div>
            <button class="btn btn-out btn-sm" style="width:100%;justify-content:center;margin-top:4px" onclick="setView('composer')"><i class="bi bi-plus-lg"></i> Agregar a cola</button>
          </div>
        </div>
      </div>
    </div>

    <!-- METRICS -->
    <div class="view" id="view-metrics">
      <div class="vh">
        <div><div class="vh-title">Métricas de <span>Rendimiento</span></div><div class="vh-sub">Analizá el impacto de tu contenido</div></div>
        <div id="metrics-notice"></div>
      </div>
      <div class="g3" style="margin-bottom:14px">
        <div class="kpi"><div class="kpi-label">Alcance total</div><div class="kpi-val">12.4K</div><div class="kpi-chg up"><i class="bi bi-arrow-up-short"></i> +18% vs mes anterior</div></div>
        <div class="kpi"><div class="kpi-label">Interacciones</div><div class="kpi-val">847</div><div class="kpi-chg up"><i class="bi bi-arrow-up-short"></i> +24%</div></div>
        <div class="kpi"><div class="kpi-label">Engagement rate</div><div class="kpi-val">6.8%</div><div class="kpi-chg up"><i class="bi bi-check-circle"></i> Muy bueno</div></div>
      </div>
      <div class="g2">
        <div class="card cb">
          <div class="ch-title" style="margin-bottom:12px"><i class="bi bi-bar-chart-fill" style="color:var(--pr)"></i> Alcance semanal</div>
          <div class="bar-chart" id="bar-chart"></div>
          <div class="bar-labels"><div class="bl">L</div><div class="bl">M</div><div class="bl">X</div><div class="bl">J</div><div class="bl">V</div><div class="bl">S</div><div class="bl">D</div></div>
        </div>
        <div class="card cb">
          <div class="ch-title" style="margin-bottom:12px"><i class="bi bi-globe" style="color:var(--pr)"></i> Por red social</div>
          <div class="mini-stat"><span class="ms-label"><i class="bi bi-instagram"></i> Instagram</span><span class="ms-val em">7.2K</span></div>
          <div class="mini-stat"><span class="ms-label"><i class="bi bi-facebook"></i> Facebook</span><span class="ms-val">3.8K</span></div>
          <div class="mini-stat"><span class="ms-label">𝕏 Twitter</span><span class="ms-val">1.4K</span></div>
          <div class="mini-stat"><span class="ms-label"><i class="bi bi-linkedin"></i> LinkedIn</span><span class="ms-val amber">—</span></div>
        </div>
      </div>
    </div>

    <!-- AUTOMATIONS -->
    <div class="view" id="view-automations">
      <div class="vh">
        <div><div class="vh-title">Automatizaciones <span>IA</span></div><div class="vh-sub">Publicación y optimización automática con inteligencia artificial</div></div>
      </div>
      <div class="g2">
        <div class="card cb">
          <div class="ch-title" style="margin-bottom:14px"><i class="bi bi-robot" style="color:var(--pr)"></i> Autopilot de contenido</div>
          <div class="auto-item"><div class="auto-row"><div><div class="auto-name"><i class="bi bi-calendar-check"></i> Publicación automática</div><div class="auto-desc">Publica según el mejor horario detectado por IA</div></div><div class="tog on" onclick="this.classList.toggle('on')"><div class="tog-k"></div></div></div></div>
          <div class="auto-item"><div class="auto-row"><div><div class="auto-name"><i class="bi bi-pencil-square"></i> Copy con IA</div><div class="auto-desc">Genera automáticamente el texto según la imagen subida</div></div><div class="tog" onclick="this.classList.toggle('on')"><div class="tog-k"></div></div></div></div>
          <div class="auto-item"><div class="auto-row"><div><div class="auto-name"><i class="bi bi-envelope"></i> Reporte semanal IA</div><div class="auto-desc">Recibí un análisis de rendimiento cada lunes por email</div></div><div class="tog on" onclick="this.classList.toggle('on')"><div class="tog-k"></div></div></div></div>
        </div>
        <div class="card cb">
          <div class="ch-title" style="margin-bottom:14px"><i class="bi bi-lightbulb-fill" style="color:var(--accent)"></i> Sugerencias IA esta semana</div>
          <div class="ai-card teal"><div class="ai-card-title"><i class="bi bi-calendar-event"></i> Mejor día para postear</div><p>Los jueves a las 18:30 tu audiencia tiene 2.3× más engagement. Programá tu próximo post ahí.</p></div>
          <div class="ai-card blue"><div class="ai-card-title"><i class="bi bi-grid"></i> Formato recomendado</div><p>Los carruseles tienen 3× más guardados que las fotos simples. Probá ese formato esta semana.</p></div>
          <div class="ai-card amber"><div class="ai-card-title"><i class="bi bi-lightning-charge-fill"></i> Acción sugerida</div><p>Llevas 5 días sin publicar en Instagram. Tu alcance orgánico puede bajar. Agendá un post hoy.</p></div>
        </div>
      </div>
    </div>

  </main>

  <!-- RIGHT PANEL -->
  <aside class="rp">
    <div class="rp-sec">
      <div class="rp-title"><i class="bi bi-phone"></i> Cuentas conectadas</div>
      <div class="acc-chip sel" onclick="this.classList.toggle('sel')"><div class="acc-icon ig"><i class="bi bi-instagram"></i></div><div><div class="acc-name">Instagram</div><div class="acc-handle">@gestion360ia</div></div><div class="acc-check">✓</div></div>
      <div class="acc-chip sel" onclick="this.classList.toggle('sel')"><div class="acc-icon fb"><i class="bi bi-facebook"></i></div><div><div class="acc-name">Facebook</div><div class="acc-handle">Gestión 360 iA</div></div><div class="acc-check">✓</div></div>
      <div class="acc-chip" id="acc-tw" onclick="handleTw(this)"><div class="acc-icon tw"><i class="bi bi-twitter-x"></i></div><div><div class="acc-name">Twitter / X</div><div class="acc-handle" id="tw-handle">No conectado</div></div><div class="acc-check" id="tw-check">+</div></div>
    </div>
    <div class="rp-sec">
      <div class="rp-title"><i class="bi bi-calendar-plus"></i> Programar publicación</div>
      <div class="sched-row">
        <input type="date" id="sched-date" value="2026-03-26">
        <input type="time" id="sched-time" value="18:30">
      </div>
      <button class="btn btn-pr" style="width:100%;justify-content:center" onclick="schedulePost()"><i class="bi bi-clock"></i> Programar ahora</button>
    </div>
    <div class="rp-sec">
      <div class="rp-title"><i class="bi bi-hdd"></i> Almacenamiento</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-size:12px;color:var(--text2)">Usado</span>
        <span id="stor-val" style="font-size:12px;font-weight:700;color:var(--text)">120MB / 200MB</span>
      </div>
      <div class="stor-bar-wrap"><div class="stor-bar" id="stor-bar" style="width:60%;background:linear-gradient(90deg,var(--pr),var(--pr-l))"></div></div>
      <div id="stor-cap" style="font-size:10px;color:var(--muted);margin-top:3px">Plan PRO · 200MB incluido</div>
    </div>
    <div class="rp-sec">
      <div class="rp-title"><i class="bi bi-graph-up-arrow"></i> Resumen rápido</div>
      <div class="mini-stat"><span class="ms-label">Posts este mes</span><span class="ms-val">14</span></div>
      <div class="mini-stat"><span class="ms-label">Programados</span><span class="ms-val amber" id="rp-sched">3</span></div>
      <div class="mini-stat"><span class="ms-label">Alcance prom.</span><span class="ms-val em" id="rp-reach">886</span></div>
      <div class="mini-stat" id="rp-ia-row" style="display:none"><span class="ms-label">Sugerencias IA</span><span class="ms-val" style="color:var(--accent)">3 nuevas</span></div>
    </div>
  </aside>

</div>

<script>
  let currentPlan = 'pro', currentNet = 'ig';
  let currentMonth = 2, currentYear = 2026;

  const plans = {
    free:{ storage:'50MB / 50MB', storW:'100%', storC:'Plan FREE · 50MB', storBg:'linear-gradient(90deg,#D9534F,#ef4444)',
           features:[{t:'4 posts semanales',ok:1},{t:'Plantillas predefinidas',ok:1},{t:'Instagram + Facebook',ok:1},{t:'Sin Stories',ok:0},{t:'Sin IA de copy',ok:0},{t:'Sin calendario',ok:0},{t:'Sin métricas',ok:0}],
           metricsLock:1, autoLock:1, video:0 },
    pro: { storage:'120MB / 200MB', storW:'60%', storC:'Plan PRO · 200MB', storBg:'linear-gradient(90deg,#506886,#6B86A0)',
           features:[{t:'Posts ilimitados',ok:1},{t:'Calendario editorial',ok:1},{t:'Instagram Stories',ok:1},{t:'Métricas de alcance',ok:1},{t:'Programación API Meta',ok:1},{t:'Sin métricas de interacción',ok:0},{t:'Sin sugerencias IA',ok:0}],
           metricsLock:0, autoLock:1, video:1 },
    biz: { storage:'320MB / 2GB', storW:'16%', storC:'Plan Business · 2GB', storBg:'linear-gradient(90deg,#3A9E70,#2A7A54)',
           features:[{t:'Todo lo de PRO',ok:1},{t:'Multi-sede',ok:1},{t:'Métricas completas',ok:1},{t:'Horario óptimo',ok:1},{t:'Sin sugerencias IA',ok:0},{t:'Sin automatizaciones',ok:0}],
           metricsLock:0, autoLock:1, video:1 },
    ia:  { storage:'800MB / 5GB', storW:'16%', storC:'Plan IA · 5GB', storBg:'linear-gradient(90deg,#B08A55,#C8A472)',
           features:[{t:'Todo lo de Business',ok:1},{t:'Sugerencias IA en tiempo real',ok:1},{t:'Publicación automática IA',ok:1},{t:'Calendario sugerido por IA',ok:1},{t:'Storage 5GB',ok:1},{t:'Automatizaciones completas',ok:1}],
           metricsLock:0, autoLock:0, video:1 },
  };

  function setPlan(p) {
    currentPlan = p;
    document.querySelectorAll('.plan-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.plan-btn.'+p).classList.add('active');
    const d = plans[p];
    document.getElementById('stor-val').textContent = d.storage;
    document.getElementById('stor-bar').style.width = d.storW;
    document.getElementById('stor-bar').style.background = d.storBg;
    document.getElementById('stor-cap').textContent = d.storC;
    document.getElementById('plan-features').innerHTML = d.features.map(f=>\`<div class="fi \${f.ok?'ok':'no'}"><span class="fi-check">\${f.ok?'✓':'✗'}</span>\${f.t}</div>\`).join('');
    document.getElementById('lock-metrics').style.display = d.metricsLock ? 'inline-block' : 'none';
    document.getElementById('lock-auto').style.display = d.autoLock ? 'inline-block' : 'none';
    document.getElementById('rp-ia-row').style.display = (!d.autoLock) ? 'flex' : 'none';
    document.getElementById('rp-reach').textContent = p==='ia' ? '2.1K' : '886';
    ['4','5'].forEach((i,idx) => {
      const t = document.getElementById('tpl-'+i);
      const unlock = (i==='4' && ['pro','biz','ia'].includes(p)) || (i==='5' && p==='ia');
      if (unlock) {
        t.classList.remove('locked-wrap');
        t.querySelector('.lock-over').style.display='none';
        t.onclick = () => applyTpl(parseInt(i)-4);
      } else {
        t.classList.add('locked-wrap');
        t.querySelector('.lock-over').style.display='flex';
        t.onclick = () => lockAlert(i==='4'?'Pro':'IA');
      }
    });
    if (d.video) { document.getElementById('vzone-title').textContent='Subir videos'; document.getElementById('vzone-sub').textContent='MP4, MOV · Máx. 200MB'; document.getElementById('video-zone').style.opacity='1'; }
    else { document.getElementById('vzone-title').textContent='Videos (no disponible)'; document.getElementById('vzone-sub').textContent='🔒 Disponible desde PRO'; document.getElementById('video-zone').style.opacity='.5'; }
    const mn = document.getElementById('metrics-notice');
    mn.innerHTML = d.metricsLock ? '<div class="plan-notice notice-lock"><i class="bi bi-lock-fill"></i> Disponible desde Plan PRO</div>' : '<div class="plan-notice notice-ok"><i class="bi bi-check-circle-fill"></i> Métricas activas en tu plan</div>';
  }

  function setView(v) {
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
    document.getElementById('view-'+v).classList.add('on');
    document.querySelectorAll('.ni').forEach(n=>n.classList.remove('on'));
    const map = {composer:0,media:1,copy:2,calendar:3,metrics:4,automations:5};
    const nis = document.querySelectorAll('.ni');
    if (nis[map[v]]) nis[map[v]].classList.add('on');
    const p = plans[currentPlan];
    if (v==='metrics' && p.metricsLock) { setTimeout(()=>alert('📊 Las métricas están disponibles desde el Plan PRO.'),100); }
    if (v==='automations' && p.autoLock) { setTimeout(()=>alert('⚡ Las automatizaciones están disponibles en el Plan IA.'),100); }
  }

  const templates = [
    'linear-gradient(135deg,#506886,#3E5270)',
    'linear-gradient(135deg,#1A7A4A,#0f5233)',
    'linear-gradient(135deg,#B08A55,#7A5800)',
    'linear-gradient(135deg,#1F2937,#374151)',
    'linear-gradient(135deg,#3A9E70,#2A7A54)',
    'linear-gradient(135deg,#7C3AED,#5B21B6)',
  ];

  function applyTpl(i) {
    document.getElementById('canvas-bg').style.background = templates[i];
    document.querySelectorAll('.tpl-thumb').forEach((t,j)=>t.classList.toggle('on',j===i));
  }
  function applyColor(g, el) {
    document.getElementById('canvas-bg').style.background = g;
    document.querySelectorAll('.swatch').forEach(s=>s.classList.remove('on'));
    el.classList.add('on');
  }
  function setFormat(f, btn) {
    document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    const c = document.getElementById('post-canvas');
    const fm = {square:{w:'240px',h:'240px'},story:{w:'140px',h:'248px'},banner:{w:'320px',h:'180px'}};
    c.style.width = fm[f].w; c.style.height = fm[f].h;
  }
  function toggleGrid(btn) {
    btn.classList.toggle('on');
    const ca = document.getElementById('canvas-area');
    const on = btn.classList.contains('on');
    ca.style.backgroundImage = on
      ? 'repeating-linear-gradient(0deg,transparent,transparent 23px,rgba(80,104,134,.2) 23px,rgba(80,104,134,.2) 24px),repeating-linear-gradient(90deg,transparent,transparent 23px,rgba(80,104,134,.2) 23px,rgba(80,104,134,.2) 24px)'
      : 'repeating-linear-gradient(0deg,transparent,transparent 23px,#E5E7EB 23px,#E5E7EB 24px),repeating-linear-gradient(90deg,transparent,transparent 23px,#E5E7EB 23px,#E5E7EB 24px)';
  }
  function lockAlert(plan) { alert('🔒 Esta función está disponible en el Plan '+plan+'. Cambiá tu plan desde la barra superior.'); }

  // MEDIA
  const mediaItems = [
    {e:'🧠',bg:'linear-gradient(135deg,#506886,#3E5270)'},{e:'📊',bg:'linear-gradient(135deg,#1A7A4A,#0f5233)'},
    {e:'🚀',bg:'linear-gradient(135deg,#B08A55,#7A5800)'},{e:'💼',bg:'linear-gradient(135deg,#1F2937,#374151)'},
    {e:'🤖',bg:'linear-gradient(135deg,#3A9E70,#2A7A54)'},{e:'📱',bg:'linear-gradient(135deg,#7C3AED,#5B21B6)'},
    {e:'✨',bg:'linear-gradient(135deg,#E1306C,#833AB4)'},{e:'🏆',bg:'linear-gradient(135deg,#506886,#3E5270)'},
    {e:'💡',bg:'linear-gradient(135deg,#1F2937,#374151)'},{e:'🔮',bg:'linear-gradient(135deg,#B08A55,#7A5800)'},
  ];
  function buildMedia() {
    document.getElementById('media-grid').innerHTML = mediaItems.map((m,i)=>\`
      <div class="media-thumb" onclick="alert('✅ Imagen seleccionada para tu próximo post.')" title="Imagen \${i+1}">
        <div class="media-ph" style="background:\${m.bg}">\${m.e}</div>
        <div class="media-over">✅</div>
      </div>\`).join('') +
      \`<div class="media-thumb" style="border:2px dashed #D1D5DB;background:transparent" onclick="alert('📂 Subí nuevas fotos')">
        <div class="media-ph" style="background:transparent;color:#9CA3AF;font-size:22px">+</div></div>\`;
  }

  // COPY
  const copies = {
    ig:['🚀 ¿Seguís haciendo todo a mano en tu negocio?\\n\\nLa inteligencia artificial ya no es ciencia ficción. Con Gestión 360 iA, automatizás WhatsApp, turnos, facturación y atención al cliente — todo desde un solo lugar.\\n\\n📲 Escribinos y te contamos cómo empezar.','💡 Dato: el 73% de las pymes que automatizan sus procesos ahorran más de 10 horas semanales.\\n\\nEso es tiempo real para enfocarte en lo que más importa: crecer.\\n\\n¿Querés saber qué podés automatizar? Comentá 👇'],
    fb:['💼 CASO REAL: Cómo un consultorio en Buenos Aires redujo un 40% su carga administrativa con IA.\\n\\nSin cambiar todo su sistema. Sin costos enormes. Solo con las herramientas correctas.','👋 Si tenés un negocio y todavía gestionás todo en papel o Excel, tenemos algo importante para contarte.'],
    tw:['El 67% de las pymes que adoptaron IA vieron resultados en menos de 90 días.\\n\\nNo es el futuro. Es ahora. 🤔','Automatizar no es caro. Es caro NO automatizar.\\n\\nCada hora en tareas repetitivas es una hora que no pasás con tus clientes.'],
    li:['La transformación digital de las pymes argentinas no requiere grandes presupuestos.\\n\\nRequiere las herramientas correctas y un enfoque claro.\\n\\n¿Líderes de pymes: cuál es el proceso que más tiempo les consume hoy?'],
  };
  const tags = {
    ig:['#InteligenciaArtificial','#PymesArgentinas','#Automatización','#NegociosDigitales','#IA','#Gestión360','#MarketingDigital'],
    fb:['#IA','#Automatización','#PymesArgentinas','#Gestión360iA'],
    tw:['#IA','#Pymes','#Automatización','#Argentina'],
    li:['#InteligenciaArtificial','#Pymes','#TransformaciónDigital','#AI','#Argentina'],
  };
  function generateCopy() {
    const arr = copies[currentNet];
    const c = arr[Math.floor(Math.random()*arr.length)];
    document.getElementById('copy-area').innerText = c;
    document.getElementById('preview-text').textContent = c.substring(0,110)+'…';
    document.getElementById('hashtag-row').innerHTML = tags[currentNet].map(t=>\`<span class="hashtag">\${t}</span>\`).join('');
  }
  function setNet(btn, net) {
    currentNet = net;
    document.querySelectorAll('.net-tab').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    generateCopy();
  }

  // CALENDAR
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const posts = {'2026-3-26':[{n:'ig',t:'Post IA'},{n:'fb',t:'Facebook'}],'2026-3-27':[{n:'fb',t:'Facebook'}],'2026-3-28':[{n:'tw',t:'Tweet'}],'2026-3-31':[{n:'ig',t:'Story'}],'2026-3-10':[{n:'ig',t:'Publicado'}],'2026-3-15':[{n:'fb',t:'Publicado'}]};
  function buildCal() {
    document.getElementById('cal-month-lbl').textContent = monthNames[currentMonth]+' '+currentYear;
    const cells = document.getElementById('cal-cells'); cells.innerHTML = '';
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
    const today = new Date(); const isCur = today.getMonth()===currentMonth && today.getFullYear()===currentYear;
    const prev = new Date(currentYear,currentMonth,0).getDate();
    for (let i=firstDay-1;i>=0;i--) { const c=document.createElement('div'); c.className='cal-cell dim'; c.innerHTML=\`<div class="cal-num">\${prev-i}</div>\`; cells.appendChild(c); }
    for (let d=1;d<=daysInMonth;d++) {
      const c=document.createElement('div'); const isT=isCur&&d===today.getDate();
      c.className='cal-cell'+(isT?' today':''); c.innerHTML=\`<div class="cal-num">\${d}</div>\`;
      const key=\`\${currentYear}-\${currentMonth+1}-\${d}\`;
      if (posts[key]) posts[key].forEach(p=>{const t=document.createElement('div');t.className=\`cal-post \${p.n}\`;t.textContent=p.t;c.appendChild(t);});
      c.onclick=()=>{ const ps=posts[key]; ps?alert(\`📅 \${d}/\${currentMonth+1}/\${currentYear}\\n\${ps.map(p=>'• '+p.n.toUpperCase()+': '+p.t).join('\\n')}\`):confirm(\`📅 \${d}/\${currentMonth+1}/\${currentYear}\\nSin posts.\\n¿Agregar uno?\`)&&setView('composer'); };
      cells.appendChild(c);
    }
    const total=firstDay+daysInMonth; const rem=total%7===0?0:7-(total%7);
    for (let d=1;d<=rem;d++) { const c=document.createElement('div'); c.className='cal-cell dim'; c.innerHTML=\`<div class="cal-num">\${d}</div>\`; cells.appendChild(c); }
  }
  function prevMonth() { currentMonth--; if(currentMonth<0){currentMonth=11;currentYear--;} buildCal(); }
  function nextMonth() { currentMonth++; if(currentMonth>11){currentMonth=0;currentYear++;} buildCal(); }

  // BAR CHART
  function buildChart() {
    const vals=[42,78,55,91,67,84,73];
    document.getElementById('bar-chart').innerHTML = vals.map(v=>\`<div class="bar" style="flex:1;height:\${v}%" title="\${v*100} personas"></div>\`).join('');
  }

  // HELPERS
  function handleVideoUpload() { if(currentPlan==='free'){alert('🔒 La carga de videos está disponible desde el Plan PRO.');}else{alert('📂 Seleccioná un video (MP4, MOV). Máx. 200MB.');} }
  function handleTw(chip) {
    if(currentPlan==='free'){alert('🔒 Conectar Twitter/X está disponible desde el Plan PRO.');return;}
    chip.classList.toggle('sel');
    const sel=chip.classList.contains('sel');
    document.getElementById('tw-handle').textContent=sel?'@g360ia_ar':'No conectado';
    document.getElementById('tw-check').textContent=sel?'✓':'+';
  }
  function schedulePost() {
    const dt=document.getElementById('sched-date').value, tm=document.getElementById('sched-time').value;
    const accs=[...document.querySelectorAll('.acc-chip.sel')].map(c=>c.querySelector('.acc-name').textContent);
    if(!accs.length){alert('⚠️ Seleccioná al menos una cuenta para publicar.');return;}
    alert(\`✅ Post programado para el \${dt} a las \${tm}\\nRedes: \${accs.join(', ')}\`);
    document.getElementById('rp-sched').textContent=parseInt(document.getElementById('rp-sched').textContent)+1;
  }

  // INIT
  buildMedia(); buildCal(); buildChart(); setPlan('pro');
</script>
</body>
</html>`;

function ModalSocialMedia({ onClose }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}
    >
      <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:1200,height:"92vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,0.22)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1.1rem",borderBottom:"1px solid #E5E7EB",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
            <i className="bi bi-grid-1x2" style={{fontSize:"0.9rem",color:"#506886"}} />
            <span style={{fontSize:"0.85rem",fontWeight:700,color:"#1F2937"}}>Documentos</span>
            <i className="bi bi-chevron-right" style={{fontSize:"0.65rem",color:"#9CA3AF"}} />
            <span style={{fontSize:"0.85rem",fontWeight:600,color:"#506886"}}>Módulo Social Media</span>
          </div>
          <div
            onClick={onClose}
            style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#9CA3AF",fontSize:"0.9rem",transition:"background .12s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#F2F4F6"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <i className="bi bi-x-lg" />
          </div>
        </div>
        <iframe
          srcDoc={SOCIAL_MEDIA_HTML}
          style={{flex:1,border:"none",width:"100%"}}
          title="Módulo Social Media — Gestión 360 iA"
        />
      </div>
    </div>
  );
}

function Av({ letra, size=32 }) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:"var(--pr)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.38,fontWeight:700,flexShrink:0}}>
      {letra||"?"}
    </div>
  );
}

function Cargando({ texto="Cargando..." }) {
  return <div style={{padding:"2rem",textAlign:"center",color:"var(--muted)",fontSize:"0.82rem"}}>{texto}</div>;
}

function Modal({ children, onClose, wide }) {
  return (
    <div className="modal-over" onClick={onClose}>
      <div className="modal-box" style={wide?{maxWidth:780,width:"100%"}:undefined} onClick={e=>e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, saving, labelConfirm="Guardar" }) {
  return (
    <div className="modal-foot">
      <button className="btn btn-out btn-sm" onClick={onCancel}>Cancelar</button>
      <button className="btn btn-em btn-sm" onClick={onConfirm} disabled={saving}>{saving?"Guardando…":labelConfirm}</button>
    </div>
  );
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

/* ── CANAL META ── */
const CANAL_META = {
  whatsapp:  { label:"WhatsApp",  color:"#25D366", bg:"#E8F7F1", textColor:"#166534",
    dot:()=><svg width="10" height="10" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.126 1.524 5.858L0 24l6.305-1.508A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg> },
  email:     { label:"Email",     color:"#506886", bg:"#EDF1F6", textColor:"#2A3F55", dot:()=><i className="bi bi-envelope"  style={{color:"#506886",fontSize:"0.7rem"}} /> },
  web:       { label:"Web",       color:"#1A7A4A", bg:"#E8F7F1", textColor:"#166534", dot:()=><i className="bi bi-globe"     style={{color:"#1A7A4A",fontSize:"0.7rem"}} /> },
  instagram: { label:"Instagram", color:"#E1306C", bg:"#FEF0F5", textColor:"#9B1C4E", dot:()=><i className="bi bi-instagram" style={{color:"#E1306C",fontSize:"0.7rem"}} /> },
  facebook:  { label:"Facebook",  color:"#1877F2", bg:"#EBF3FE", textColor:"#1455B5", dot:()=><i className="bi bi-facebook"  style={{color:"#1877F2",fontSize:"0.7rem"}} /> },
  formulario:{ label:"Formulario",color:"#7C3AED", bg:"#EDE9FE", textColor:"#5B21B6", dot:()=><i className="bi bi-ui-checks-grid" style={{color:"#7C3AED",fontSize:"0.7rem"}} /> },
};

const ORIGEN_META = {
  whatsapp:  { label:"WhatsApp",  bg:"#E8F7F1", color:"#166534", border:"#B8E0D0" },
  web:       { label:"Web",       bg:"#EDF1F6", color:"#445A73", border:"#C2CFD9" },
  formulario:{ label:"Formulario",bg:"#EDE9FE", color:"#5B21B6", border:"#C4B5FD" },
  scraping:  { label:"Scraping",  bg:"#FBF6EE", color:"#92680A", border:"#E8D5B0" },
  manual:    { label:"Manual",    bg:"#EDF1F6", color:"#445A73", border:"#C2CFD9" },
  referido:  { label:"Referido",  bg:"#E8F7F1", color:"#166534", border:"#B8E0D0" },
};

const ETAPAS_FUNNEL = {
  contactado:  { label:"Contactado",  color:"var(--pr)",     bg:"var(--pr-pale)" },
  interesado:  { label:"Interesado",  color:"var(--em-d)",   bg:"var(--em-pale)" },
  seguimiento: { label:"Seguimiento", color:"var(--accent)",  bg:"var(--accent-pale)" },
};


function OrigenPill({ fuente }) {
  const m = ORIGEN_META[fuente] || ORIGEN_META.manual;
  return (
    <span style={{display:"inline-flex",alignItems:"center",fontSize:"0.58rem",fontWeight:700,padding:"2px 6px",background:m.bg,color:m.color,border:`1px solid ${m.border}`,borderRadius:3,whiteSpace:"nowrap"}}>
      {m.label}
    </span>
  );
}

function EtapaPill({ estado }) {
  const MAP = {
    nuevo:       { bg:"#F3F4F6", color:"#374151", border:"#E5E7EB" },
    contactado:  { bg:"var(--pr-pale)",    color:"var(--pr-d)",  border:"var(--pr-mid)" },
    interesado:  { bg:"var(--em-pale)",    color:"var(--em-d)",  border:"var(--em-mid)" },
    seguimiento: { bg:"var(--accent-pale)",color:"var(--accent)",border:"#E8D5B0" },
    cerrado:     { bg:"var(--em-pale)",    color:"var(--em-d)",  border:"var(--em-mid)" },
    perdido:     { bg:"var(--red-bg)",     color:"var(--red)",   border:"#FCA5A5" },
  };
  const m = MAP[estado] || MAP.nuevo;
  const labels = { nuevo:"Nuevo",contactado:"Contactado",interesado:"Interesado",seguimiento:"Seguimiento",cerrado:"Cerrado",perdido:"Perdido" };
  return (
    <span style={{display:"inline-block",fontSize:"0.6rem",fontWeight:700,padding:"2px 7px",background:m.bg,color:m.color,border:`1px solid ${m.border}`,borderRadius:3,whiteSpace:"nowrap"}}>
      {labels[estado]||estado}
    </span>
  );
}

/* ══ MODAL CALIFICAR ══ */
function ModalCalificar({ lead, onClose, onGuardar }) {
  const [resultado, setResultado] = useState("");
  const [fecha, setFecha]         = useState("");
  const [motivo, setMotivo]       = useState("");
  const [saving, setSaving]       = useState(false);

  const guardar = async () => {
    if (!resultado) return;
    setSaving(true);
    const payload = { id:lead.id, estado:resultado };
    if (resultado==="seguimiento") payload.fecha_proximo_contacto = fecha||null;
    if (resultado==="perdido")     payload.motivo_perdida = motivo||null;
    await onGuardar(payload);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:11,width:"100%",maxWidth:400,boxShadow:"var(--sh-md)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"1rem 1.2rem",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:"0.9rem",fontWeight:700}}>Calificar contacto</div>
            <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:2}}>{lead.nombre}{lead.empresa?` · ${lead.empresa}`:""}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:"1rem",color:"var(--muted)",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.8rem"}}>
          <div style={{fontSize:"0.78rem",fontWeight:600,color:"var(--sub)"}}>¿Cómo resultó el contacto?</div>
          {[
            {val:"interesado",  label:"Está interesado",               desc:"Quiere avanzar, evaluando el plan",             color:"var(--em-d)",   bg:"var(--em-pale)"},
            {val:"seguimiento", label:"Interesado, pero más adelante", desc:"Le interesa pero no ahora — agendar seguimiento",color:"var(--accent)", bg:"var(--accent-pale)"},
            {val:"perdido",     label:"Sin interés",                   desc:"No quiere avanzar",                             color:"var(--red)",    bg:"var(--red-bg)"},
          ].map(op=>(
            <div key={op.val} onClick={()=>setResultado(op.val)}
              style={{padding:"0.7rem 0.9rem",borderRadius:"var(--r-sm)",border:`1px solid ${resultado===op.val?op.color:"var(--border)"}`,background:resultado===op.val?op.bg:"#fff",cursor:"pointer",transition:"all .15s"}}>
              <div style={{fontSize:"0.82rem",fontWeight:600,color:resultado===op.val?op.color:"var(--text)"}}>{op.label}</div>
              <div style={{fontSize:"0.7rem",color:"var(--muted)",marginTop:2}}>{op.desc}</div>
            </div>
          ))}
          {resultado==="seguimiento" && (
            <div className="fg">
              <label className="fl">¿Cuándo volver a contactar?</label>
              <input className="fi" type="date" value={fecha} onChange={e=>setFecha(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>Si no elegís fecha, Maia lo recordará en 30 días</div>
            </div>
          )}
          {resultado==="perdido" && (
            <div className="fg">
              <label className="fl">Motivo (opcional)</label>
              <input className="fi" value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej: Precio alto, no le interesa ahora..." />
            </div>
          )}
        </div>
        <div style={{padding:"0.8rem 1.2rem",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:"0.5rem"}}>
          <button className="btn btn-out btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-em btn-sm" onClick={guardar} disabled={!resultado||saving}>{saving?"Guardando…":"Confirmar"}</button>
        </div>
      </div>
    </div>
  );
}

/* ══ VIEW CRM ══ */
function ViewCRM({ session }) {
  const [tab, setTab]             = useState("leads");
  const [leads, setLeads]         = useState([]);
  const [funnel, setFunnel]       = useState({ contactado:[], interesado:[], seguimiento:[] });
  const [convs, setConvs]         = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [filtroFuente, setFiltroFuente] = useState("todos");
  const [filtroCanalConv, setFiltroCanalConv] = useState("todos");
  const [filtroEtapaConv, setFiltroEtapaConv] = useState("todas");
  const [activaConv, setActivaConv] = useState(null);
  const [mensajes, setMensajes]   = useState([]);
  const [texto, setTexto]         = useState("");
  const [enviando, setEnviando]   = useState(false);
  const [mostrarFicha, setMostrarFicha] = useState(true);
  const [modalNuevo, setModalNuevo]     = useState(false);
  const [modalCalif, setModalCalif]     = useState(false);
  const [leadCalif, setLeadCalif]       = useState(null);
  const [vendedores, setVendedores]     = useState([]);
  const [saving, setSaving]       = useState(false);
  const [formNuevo, setFormNuevo] = useState({ nombre:"",empresa:"",email:"",telefono:"",rubro_interes:"",plan_interes:"",fuente:"manual",ubicacion:"",sitio_web:"",instagram:"",notas:"" });
  const msgsEndRef = useRef(null);
  const rol     = session?.user?.rol || "superadmin";
  const esAdmin = ["superadmin","admin"].includes(rol);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/ventas/crm?vista=todo");
      const d = await r.json();
      if (d.ok) {
        setLeads(d.leads || []);
        setFunnel(d.funnel || { contactado:[], interesado:[], seguimiento:[] });
        setConvs(d.conversaciones || []);
        setStats(d.stats || null);
      }
    } catch(_){}
    setLoading(false);
  };

  const cargarVendedores = async () => {
    try { const r=await fetch("/api/usuarios"); const d=await r.json(); if(d.ok) setVendedores(d.usuarios.filter(u=>["vendedor","admin","superadmin"].includes(u.rol)&&u.activo)); } catch(_){}
  };

  const cargarMensajes = async (conv) => {
    setActivaConv(conv);
    try { const r=await fetch(`/api/ventas/mensajes?conversacion_id=${conv.id}`); const d=await r.json(); if(d.ok) setMensajes(d.mensajes); } catch(_){}
  };

  useEffect(() => { cargar(); cargarVendedores(); }, []);
  useEffect(() => { msgsEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [mensajes]);

  const tomarLead = async (lead) => {
    try {
      await fetch("/api/ventas/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:lead.id,tomar:true})});
      await cargar();
      setTab("funnel");
    } catch(_){}
  };

  const cambiarEstadoLead = async (id, estado, extra={}) => {
    try {
      await fetch("/api/ventas/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,estado,...extra})});
      await cargar();
    } catch(_){}
  };

  const cambiarEstadoConv = async (id, estado) => {
    try {
      await fetch("/api/ventas/conversaciones",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,estado})});
      await cargar();
      if(activaConv?.id===id) setActivaConv(p=>({...p,estado}));
    } catch(_){}
  };

  const enviarMensaje = async () => {
    if (!texto.trim()||!activaConv) return;
    setEnviando(true);
    const contenido = texto;
    setTexto("");
    try {
      await fetch("/api/ventas/mensajes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversacion_id:activaConv.id,direccion:"saliente",contenido})});
      setTimeout(()=>cargarMensajes(activaConv), 700);
    } catch(_){}
    setEnviando(false);
  };

  const guardarCalificacion = async (payload) => {
    try {
      await fetch("/api/ventas/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      await cargar();
    } catch(_){}
  };

  const crearLead = async () => {
    if (!formNuevo.nombre) return;
    setSaving(true);
    try {
      const r=await fetch("/api/ventas/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(formNuevo)});
      const d=await r.json();
      if(d.ok){ setModalNuevo(false); setFormNuevo({nombre:"",empresa:"",email:"",telefono:"",rubro_interes:"",plan_interes:"",fuente:"manual",ubicacion:"",sitio_web:"",instagram:"",notas:""}); await cargar(); }
    } catch(_){}
    setSaving(false);
  };

  const fn = (v) => setFormNuevo(p=>({...p,...v}));

  // Filtrar leads
  const leadsFiltrados = leads.filter(l => filtroFuente==="todos" || l.fuente===filtroFuente);

  // Filtrar conversaciones
  const convsFiltradas = convs.filter(c => {
    if (filtroCanalConv !== "todos" && c.canal !== filtroCanalConv) return false;
    if (filtroEtapaConv !== "todas" && c.lead_estado !== filtroEtapaConv) return false;
    return true;
  });

  const sinAsignarCount = leads.length;
  const funnelTotal = (funnel.contactado?.length||0) + (funnel.interesado?.length||0) + (funnel.seguimiento?.length||0);
  const convCount = convs.length;

  return (
    <div className="crm-wrap view-anim">
      {/* TABS */}
      <div className="crm-tabs">
        <div className={`crm-tab${tab==="leads"?" on":""}`} onClick={()=>setTab("leads")}>
          Leads <span className={`crm-ct a`}>{sinAsignarCount}</span>
        </div>
        <div className={`crm-tab${tab==="funnel"?" on":""}`} onClick={()=>setTab("funnel")}>
          Funnel <span className={`crm-ct b`}>{funnelTotal}</span>
        </div>
        <div className={`crm-tab${tab==="conversaciones"?" on":""}`} onClick={()=>setTab("conversaciones")}>
          Conversaciones <span className={`crm-ct c`}>{convCount}</span>
        </div>
        <div style={{flex:1}} />
        <button className="btn btn-em btn-sm" style={{alignSelf:"center",marginRight:"0.5rem"}} onClick={()=>setModalNuevo(true)}>
          <i className="bi bi-plus-lg" /> Nuevo lead
        </button>
      </div>

      {/* ── TAB LEADS ── */}
      {tab==="leads" && (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Filtros */}
          <div style={{display:"flex",alignItems:"center",gap:"5px",padding:"7px 1.1rem",background:"#fff",borderBottom:"1px solid var(--border)",flexShrink:0,flexWrap:"wrap"}}>
            {["todos","whatsapp","web","formulario","scraping","manual"].map(f=>(
              <button key={f} onClick={()=>setFiltroFuente(f)}
                style={{padding:"3px 9px",fontSize:"0.63rem",fontWeight:600,cursor:"pointer",border:`1px solid ${filtroFuente===f?"var(--pr)":"var(--border)"}`,background:filtroFuente===f?"var(--pr)":"#fff",color:filtroFuente===f?"#fff":"var(--sub)",fontFamily:"inherit",borderRadius:"var(--r-sm)"}}>
                {f==="todos"?"Todos":ORIGEN_META[f]?.label||f}
              </button>
            ))}
            <div style={{flex:1}} />
            <span style={{fontSize:"0.63rem",color:"var(--muted)"}}>{leadsFiltrados.length} leads sin tomar</span>
          </div>
          {/* Tabla */}
          <div style={{flex:1,overflow:"auto",padding:"12px 1.1rem"}}>
            {loading ? <Cargando /> : leadsFiltrados.length===0 ? (
              <div style={{textAlign:"center",padding:"3rem",color:"var(--muted)"}}>
                <i className="bi bi-inbox" style={{fontSize:"2rem",display:"block",marginBottom:"0.5rem"}} />
                <div style={{fontSize:"0.85rem"}}>Sin leads disponibles</div>
              </div>
            ) : (
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>Nombre / Empresa</th>
                    <th>Origen</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Rubro</th>
                    <th>Ubicación</th>
                    <th>Web / RRSS</th>
                    <th>Ingresó</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsFiltrados.map(l=>(
                    <tr key={l.id}>
                      <td>
                        <div style={{fontWeight:600,fontSize:"0.78rem",color:"var(--text)"}}>{l.nombre}</div>
                        {l.empresa && <div style={{fontSize:"0.63rem",color:"var(--muted)",marginTop:1}}>{l.empresa}</div>}
                      </td>
                      <td><OrigenPill fuente={l.fuente} /></td>
                      <td style={{fontSize:"0.7rem",fontFamily:"monospace",whiteSpace:"nowrap",color:"var(--text)"}}>{l.telefono||"—"}</td>
                      <td style={{fontSize:"0.68rem",color:"var(--pr)"}}>{l.email||<span style={{color:"var(--muted)"}}>—</span>}</td>
                      <td style={{fontSize:"0.7rem",color:"var(--text2)"}}>{l.rubro_interes||<span style={{color:"var(--muted)"}}>—</span>}</td>
                      <td style={{fontSize:"0.68rem",color:"var(--text2)"}}>{l.ubicacion||<span style={{color:"var(--muted)"}}>—</span>}</td>
                      <td style={{fontSize:"0.65rem"}}>
                        {l.sitio_web ? <div style={{color:"var(--pr)"}}>{l.sitio_web}</div> : null}
                        {l.instagram ? <div style={{color:"var(--muted)"}}>@{l.instagram}</div> : null}
                        {!l.sitio_web && !l.instagram && <span style={{color:"var(--muted)"}}>—</span>}
                      </td>
                      <td style={{fontSize:"0.65rem",color:"var(--muted)",whiteSpace:"nowrap"}}>{formatFecha(l.creado_en)}</td>
                      <td>
                        <div style={{display:"flex",gap:4}}>
                          <button className="btn btn-pr btn-xs" onClick={()=>tomarLead(l)}>Tomar</button>
                          {esAdmin && (
                            <select style={{fontSize:"0.62rem",padding:"2px 5px",border:"1px solid var(--border2)",borderRadius:"var(--r-sm)",background:"#fff",fontFamily:"inherit",color:"var(--sub)"}}
                              defaultValue="" onChange={e=>{if(e.target.value) { fetch("/api/ventas/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:l.id,tomar:true,asignado_a:parseInt(e.target.value)})}); setTimeout(cargar,300); }}}>
                              <option value="" disabled>Asignar…</option>
                              {vendedores.map(v=><option key={v.id} value={v.id}>{v.nombre}</option>)}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB FUNNEL ── */}
      {tab==="funnel" && (
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {loading ? <Cargando /> : (
            <div style={{flex:1,display:"flex",gap:"0.75rem",padding:"1rem 1.1rem",overflowX:"auto",overflowY:"hidden"}}>
              {Object.entries(ETAPAS_FUNNEL).map(([etapa,meta])=>{
                const items = funnel[etapa]||[];
                return (
                  <div key={etapa} className="funnel-col">
                    <div className="funnel-col-hdr">
                      <span style={{fontSize:"0.65rem",fontWeight:700,color:meta.color,textTransform:"uppercase",letterSpacing:"0.06em"}}>{meta.label}</span>
                      <span style={{fontSize:"0.6rem",fontWeight:700,background:meta.bg,color:meta.color,padding:"1px 7px",borderRadius:999}}>{items.length}</span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:"0.4rem",overflowY:"auto",flex:1}}>
                      {items.map(l=>(
                        <div key={l.id} className="f-card"
                          onClick={()=>{
                            if (l.conversacion_id) {
                              const conv = convs.find(c=>c.id===l.conversacion_id);
                              if (conv) { setActivaConv(conv); cargarMensajes(conv); setTab("conversaciones"); }
                            } else {
                              setTab("conversaciones");
                            }
                          }}>
                          <div style={{fontWeight:600,fontSize:"0.77rem",color:"var(--text)"}}>{l.nombre}</div>
                          {l.empresa && <div style={{fontSize:"0.62rem",color:"var(--muted)",marginTop:1}}>{l.empresa}</div>}
                          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:"0.4rem",flexWrap:"wrap"}}>
                            <OrigenPill fuente={l.lead_fuente||l.fuente} />
                            {l.rubro_interes && <span style={{fontSize:"0.6rem",color:"var(--muted)"}}>{l.rubro_interes}</span>}
                          </div>
                          {l.dias_sin_contacto > 7 && (
                            <div style={{fontSize:"0.6rem",color:"var(--red)",marginTop:3}}>⚠ {l.dias_sin_contacto}d sin contacto</div>
                          )}
                          {l.notas && (
                            <div style={{fontSize:"0.62rem",color:"var(--sub)",marginTop:4,borderLeft:"2px solid var(--border)",paddingLeft:5,lineHeight:1.35}}>{l.notas.substring(0,60)}{l.notas.length>60?"…":""}</div>
                          )}
                          {esAdmin && l.vendedor_nombre && (
                            <div style={{fontSize:"0.6rem",color:"var(--muted)",marginTop:4}}>👤 {l.vendedor_nombre.split(" ")[0]}</div>
                          )}
                          {/* Acciones rápidas */}
                          <div style={{display:"flex",gap:3,marginTop:"0.5rem"}} onClick={e=>e.stopPropagation()}>
                            {l.estado==="contactado" && (
                              <button className="btn btn-sm" style={{background:"var(--accent)",color:"#fff",border:"none",fontSize:"0.6rem",padding:"2px 7px"}}
                                onClick={()=>{setLeadCalif(l);setModalCalif(true);}}>Calificar</button>
                            )}
                            {esAdmin && l.estado==="interesado" && (
                              <button className="btn btn-em btn-xs" onClick={()=>cambiarEstadoLead(l.id,"cerrado")}>Cerrar</button>
                            )}
                            <button className="btn btn-out btn-xs" style={{color:"var(--red)",borderColor:"#FCA5A5",fontSize:"0.6rem",padding:"2px 7px"}}
                              onClick={()=>cambiarEstadoLead(l.id,"perdido")}>Perdido</button>
                          </div>
                        </div>
                      ))}
                      {items.length===0 && (
                        <div style={{padding:"1rem",textAlign:"center",color:"var(--muted)",fontSize:"0.72rem",border:"1px dashed var(--border2)",borderRadius:"var(--r-sm)"}}>Vacío</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Columna cerrados */}
              <div className="funnel-col">
                <div className="funnel-col-hdr">
                  <span style={{fontSize:"0.65rem",fontWeight:700,color:"var(--em-d)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Cerrados</span>
                  <span style={{fontSize:"0.6rem",fontWeight:700,background:"var(--em-pale)",color:"var(--em-d)",padding:"1px 7px",borderRadius:999}}>
                    {stats?.cerrados_mes||0}
                  </span>
                </div>
                <div style={{padding:"1rem",textAlign:"center",color:"var(--muted)",fontSize:"0.7rem",border:"1px dashed var(--border2)",borderRadius:"var(--r-sm)"}}>
                  {stats?.cerrados_mes||0} cierres este mes
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONVERSACIONES ── */}
      {tab==="conversaciones" && (
        <div className="comm-wrap">
          {/* Lista */}
          <div className="conv-list">
            {/* Filtro canal */}
            <div style={{padding:"6px 10px",borderBottom:"1px solid var(--border)",display:"flex",gap:4,flexWrap:"wrap"}}>
              <div onClick={()=>setFiltroCanalConv("todos")} title="Todos"
                style={{width:24,height:24,borderRadius:"var(--r-sm)",border:`0.5px solid ${filtroCanalConv==="todos"?"var(--pr)":"var(--border)"}`,background:filtroCanalConv==="todos"?"var(--pr-pale)":"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <i className="bi bi-grid" style={{fontSize:"0.6rem",color:filtroCanalConv==="todos"?"var(--pr)":"var(--muted)"}} />
              </div>
              {Object.entries(CANAL_META).map(([tipo,m])=>(
                <div key={tipo} onClick={()=>setFiltroCanalConv(tipo)} title={m.label}
                  style={{width:24,height:24,borderRadius:"var(--r-sm)",border:`0.5px solid ${filtroCanalConv===tipo?m.color:"var(--border)"}`,background:filtroCanalConv===tipo?m.bg:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  {m.dot()}
                </div>
              ))}
            </div>
            {/* Filtro etapa */}
            <div style={{display:"flex",gap:3,padding:"5px 10px",borderBottom:"1px solid var(--border)",overflowX:"auto"}}>
              {[["todas","Todas"],["contactado","Contactado"],["interesado","Interesado"],["seguimiento","Seguimiento"],["resuelta","Resuelta"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFiltroEtapaConv(v)}
                  style={{padding:"2px 7px",fontSize:"0.58rem",fontWeight:600,cursor:"pointer",border:`0.5px solid ${filtroEtapaConv===v?"var(--pr)":"var(--border)"}`,background:filtroEtapaConv===v?"var(--pr)":"transparent",color:filtroEtapaConv===v?"#fff":"var(--muted)",fontFamily:"inherit",whiteSpace:"nowrap",borderRadius:"var(--r-sm)"}}>
                  {l}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="conv-search">
              <i className="bi bi-search" style={{color:"var(--muted)",fontSize:"0.7rem"}} />
              <input placeholder="Buscar…" />
            </div>
            {/* Items */}
            <div className="conv-items">
              {loading ? <Cargando /> : convsFiltradas.length===0 ? (
                <div style={{padding:"1.5rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Sin conversaciones</div>
              ) : convsFiltradas.map(c=>{
                const m = CANAL_META[c.canal]||CANAL_META.web;
                return (
                  <div key={c.id} className={`conv-item${activaConv?.id===c.id?" active":""}`} onClick={()=>cargarMensajes(c)}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                      <div className="conv-av" style={{width:30,height:30,fontSize:"0.7rem"}}>{(c.contacto_nombre||"?")[0].toUpperCase()}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"space-between"}}>
                          <span style={{fontWeight:600,fontSize:"0.77rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.lead_nombre||c.contacto_nombre||"Sin nombre"}</span>
                          <span style={{fontSize:"0.58rem",color:"var(--muted)",flexShrink:0}}>{c.ultimo_mensaje_at?new Date(c.ultimo_mensaje_at).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}):""}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                          {m.dot()}
                          <span style={{fontSize:"0.65rem",color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{c.ultimo_mensaje||"Sin mensajes"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat */}
          <div className="chat-panel">
            {!activaConv ? (
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"0.5rem",color:"var(--muted)"}}>
                <i className="bi bi-chat-dots" style={{fontSize:"2rem"}} />
                <div style={{fontSize:"0.82rem"}}>Seleccioná una conversación</div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="chat-hdr">
                  <div className="conv-av" style={{width:30,height:30,fontSize:"0.7rem"}}>{(activaConv.lead_nombre||activaConv.contacto_nombre||"?")[0].toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:"0.82rem"}}>{activaConv.lead_nombre||activaConv.contacto_nombre||"Sin nombre"}</div>
                    <div style={{fontSize:"0.65rem",color:"var(--muted)"}}>{activaConv.contacto_telefono||activaConv.contacto_email||""}</div>
                  </div>
                  {CANAL_META[activaConv.canal] && (
                    <div style={{display:"flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:999,background:CANAL_META[activaConv.canal].bg,color:CANAL_META[activaConv.canal].textColor,fontSize:"0.65rem",fontWeight:600,flexShrink:0}}>
                      {CANAL_META[activaConv.canal].dot()}
                      <span style={{marginLeft:2}}>{CANAL_META[activaConv.canal].label}</span>
                    </div>
                  )}
                  {/* Selector etapa */}
                  <select value={activaConv.lead_estado||"nuevo"}
                    onChange={e=>{ if(activaConv.lead_id) cambiarEstadoLead(activaConv.lead_id,e.target.value); }}
                    style={{fontSize:"0.68rem",border:"0.5px solid var(--border2)",borderRadius:"var(--r-sm)",padding:"3px 6px",background:"var(--bg)",color:"var(--text)",cursor:"pointer",fontFamily:"inherit"}}>
                    <option value="contactado">Contactado</option>
                    <option value="interesado">Interesado</option>
                    <option value="seguimiento">Seguimiento</option>
                    {esAdmin && <option value="cerrado">Cerrado</option>}
                    <option value="perdido">Perdido</option>
                  </select>
                  {/* Calificar */}
                  {activaConv.lead_id && activaConv.lead_estado==="contactado" && (
                    <button className="btn btn-sm" style={{background:"var(--accent)",color:"#fff",border:"none"}}
                      onClick={()=>{
                        const lead = [...(funnel.contactado||[])].find(l=>l.id===activaConv.lead_id);
                        if(lead){setLeadCalif(lead);setModalCalif(true);}
                      }}>
                      Calificar
                    </button>
                  )}
                  <button className="btn btn-out btn-xs" onClick={()=>setMostrarFicha(v=>!v)}>
                    <i className={`bi bi-layout-sidebar-reverse${mostrarFicha?"":"-reverse"}`} />
                  </button>
                  <button className="btn btn-em btn-xs" onClick={()=>cambiarEstadoConv(activaConv.id,"resuelta")}>Resolver</button>
                </div>

                <div style={{flex:1,display:"flex",overflow:"hidden"}}>
                  {/* Mensajes */}
                  <div className="chat-msgs">
                    {mensajes.map(m=>(
                      <div key={m.id} className={`msg ${m.direccion==="entrante"?"in":"out"}`}>
                        {m.contenido}
                        <div style={{fontSize:"0.58rem",opacity:.6,marginTop:2,textAlign:"right"}}>{new Date(m.creado_en).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}</div>
                      </div>
                    ))}
                    <div ref={msgsEndRef} />
                  </div>

                  {/* Ficha lateral */}
                  {mostrarFicha && (
                    <div className="ficha-lateral">
                      <div className="ficha-sec">
                        <div className="ficha-sec-title">Datos del lead</div>
                        {[
                          ["Nombre",    activaConv.lead_nombre||activaConv.contacto_nombre],
                          ["Teléfono",  activaConv.contacto_telefono],
                          ["Email",     activaConv.contacto_email],
                          ["Empresa",   activaConv.lead_empresa],
                          ["Rubro",     activaConv.rubro_interes],
                          ["Ubicación", activaConv.ubicacion],
                          ["Web",       activaConv.sitio_web],
                          ["Instagram", activaConv.instagram],
                          ["Facebook",  activaConv.facebook],
                        ].map(([label,val])=>(
                          <div key={label} className="ficha-row" style={{marginBottom:"0.4rem"}}>
                            <div className="fl">{label}</div>
                            <div className={`fv${!val?" m":""}`} style={{fontSize:"0.7rem",color:!val?"var(--muted)":val?.startsWith("http")||val?.startsWith("www")?"var(--pr)":"var(--text)",fontStyle:!val?"italic":"normal"}}>{val||"Sin datos"}</div>
                          </div>
                        ))}
                      </div>
                      <div className="ficha-sec">
                        <div className="ficha-sec-title">Etapa</div>
                        <EtapaPill estado={activaConv.lead_estado||"nuevo"} />
                      </div>
                      <div className="ficha-sec">
                        <div className="ficha-sec-title">Plan interés</div>
                        <div style={{fontSize:"0.7rem",color:activaConv.plan_interes?"var(--text)":"var(--muted)",fontStyle:activaConv.plan_interes?"normal":"italic"}}>
                          {activaConv.plan_interes||"Sin definir"}
                        </div>
                      </div>
                      <div className="ficha-sec">
                        <div className="ficha-sec-title">Origen</div>
                        <OrigenPill fuente={activaConv.lead_fuente||"manual"} />
                      </div>
                      {activaConv.vendedor_nombre && (
                        <div className="ficha-sec">
                          <div className="ficha-sec-title">Responsable</div>
                          <div style={{fontSize:"0.7rem",color:"var(--text)"}}>{activaConv.vendedor_nombre}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="chat-input">
                  <input value={texto} onChange={e=>setTexto(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&enviarMensaje()} placeholder="Escribí un mensaje…" style={{flex:1,border:"1px solid var(--border)",borderRadius:"var(--r-sm)",padding:"0.4rem 0.7rem",fontSize:"0.8rem",fontFamily:"inherit",outline:"none"}} />
                  <button className="btn btn-pr btn-sm" onClick={enviarMensaje} disabled={enviando||!texto.trim()}><i className="bi bi-send" /></button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal nuevo lead */}
      {modalNuevo && (
        <Modal onClose={()=>setModalNuevo(false)}>
          <div className="modal-hdr"><span className="modal-title">Nuevo lead</span><button className="btn btn-out btn-xs" onClick={()=>setModalNuevo(false)}>✕</button></div>
          <div className="modal-body">
            <div className="fi-row">
              <div className="fg"><label className="fl">Nombre *</label><input className="fi" value={formNuevo.nombre} onChange={e=>fn({nombre:e.target.value})} /></div>
              <div className="fg"><label className="fl">Empresa</label><input className="fi" value={formNuevo.empresa} onChange={e=>fn({empresa:e.target.value})} /></div>
            </div>
            <div className="fi-row">
              <div className="fg"><label className="fl">Teléfono</label><input className="fi" value={formNuevo.telefono} onChange={e=>fn({telefono:e.target.value})} /></div>
              <div className="fg"><label className="fl">Email</label><input className="fi" value={formNuevo.email} onChange={e=>fn({email:e.target.value})} /></div>
            </div>
            <div className="fi-row">
              <div className="fg"><label className="fl">Rubro interés</label><select className="fi" value={formNuevo.rubro_interes} onChange={e=>fn({rubro_interes:e.target.value})}><option value="">—</option>{RUBROS.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
              <div className="fg"><label className="fl">Plan interés</label><select className="fi" value={formNuevo.plan_interes} onChange={e=>fn({plan_interes:e.target.value})}><option value="">—</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="plan_ia">Plan IA</option><option value="enterprise">Enterprise</option></select></div>
            </div>
            <div className="fi-row">
              <div className="fg"><label className="fl">Fuente</label><select className="fi" value={formNuevo.fuente} onChange={e=>fn({fuente:e.target.value})}><option value="manual">Manual</option><option value="referido">Referido</option><option value="web">Web</option><option value="ads">Ads</option><option value="evento">Evento</option></select></div>
              <div className="fg"><label className="fl">Ubicación</label><input className="fi" value={formNuevo.ubicacion} onChange={e=>fn({ubicacion:e.target.value})} /></div>
            </div>
            <div className="fi-row">
              <div className="fg"><label className="fl">Sitio web</label><input className="fi" value={formNuevo.sitio_web} onChange={e=>fn({sitio_web:e.target.value})} /></div>
              <div className="fg"><label className="fl">Instagram</label><input className="fi" value={formNuevo.instagram} onChange={e=>fn({instagram:e.target.value})} placeholder="@usuario" /></div>
            </div>
            <div className="fg"><label className="fl">Notas</label><textarea className="fi" rows={2} value={formNuevo.notas} onChange={e=>fn({notas:e.target.value})} style={{resize:"vertical"}} /></div>
          </div>
          <ModalFooter onCancel={()=>setModalNuevo(false)} onConfirm={crearLead} saving={saving} labelConfirm="Crear lead" />
        </Modal>
      )}

      {/* Modal calificar */}
      {modalCalif && leadCalif && (
        <ModalCalificar lead={leadCalif} onClose={()=>setModalCalif(false)} onGuardar={guardarCalificacion} />
      )}
    </div>
  );
}

/* ══ VIEW DASHBOARD ══ */
function ViewDashboard() {
  return (
    <div className="view-anim">
      <div className="g4">
        {[
          ["bi-people","var(--accent-pale)","var(--accent)","—","Clientes activos"],
          ["bi-cash-coin","var(--pine-bg)","var(--pine-d)","—","Ingresos mensuales"],
          ["bi-graph-up-arrow","var(--blue-bg)","var(--blue)","—","Leads activos"],
          ["bi-exclamation-triangle","var(--red-bg)","var(--red)","—","Riesgo de churn"],
        ].map(([ico,bg,color,val,lbl],i)=>(
          <div key={i} className="kpi">
            <div className="kpi-ico" style={{background:bg}}><i className={`bi ${ico}`} style={{color}} /></div>
            <div className="kpi-val">{val}</div>
            <div className="kpi-lbl">{lbl}</div>
            <div className="kpi-d nu"><i className="bi bi-dash" /> sin datos aún</div>
          </div>
        ))}
      </div>
      <div className="g32">
        <div className="card">
          <div className="ch"><i className="bi bi-activity" style={{color:"var(--accent)"}} /><span className="ch-title">Actividad reciente</span><span className="ch-sub">últimas 24 hs</span></div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",gap:"0.5rem",color:"var(--muted)"}}>
            <i className="bi bi-inbox" style={{fontSize:"1.8rem"}} />
            <div style={{fontSize:"0.82rem"}}>Sin actividad registrada todavía</div>
          </div>
        </div>
        <div className="card">
          <div className="ch"><i className="bi bi-exclamation-diamond" style={{color:"var(--red)"}} /><span className="ch-title">Clientes en riesgo</span></div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"1.5rem",gap:"0.4rem",color:"var(--muted)"}}>
            <i className="bi bi-shield-check" style={{fontSize:"1.5rem",color:"var(--em)"}} />
            <div style={{fontSize:"0.78rem"}}>Sin alertas por ahora</div>
          </div>
          <div style={{background:"linear-gradient(135deg,#1C3D2E,#2A5A44)",borderRadius:"var(--r-sm)",padding:"0.7rem 0.85rem",marginTop:"0.5rem"}}>
            <div style={{fontSize:"0.62rem",fontWeight:700,color:"rgba(255,255,255,.55)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.3rem"}}>✦ Asistente IA</div>
            <div style={{fontSize:"0.76rem",color:"rgba(255,255,255,.9)",lineHeight:1.5}}>El asistente comenzará a generar sugerencias a medida que se carguen datos.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ VIEW CLIENTES ══ */
const PLAN_META = { starter:{label:"Starter",cls:"bdg-moon"}, pro:{label:"Pro",cls:"bdg-pro"}, plan_ia:{label:"Plan IA",cls:"bdg-gold"}, enterprise:{label:"Enterprise",cls:"bdg-pine"} };
const RUBROS    = ["Servicio Técnico"];
const FORM_CLI  = { nombre:"", rubro:"", plan:"starter", subdominio:"", email:"", telefono:"", logo_url:"" };

function ViewClientes() {
  const [tenants, setTenants]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm]         = useState(FORM_CLI);
  const [error, setError]       = useState("");
  // ── Módulos ──
  const [modalMods, setModalMods]       = useState(false);
  const [tenantMods, setTenantMods]     = useState(null);
  const [loadingMods, setLoadingMods]   = useState(false);
  const [activando, setActivando]       = useState(null);
  const [msgMod, setMsgMod]             = useState("");

  const cargar = async () => { setLoading(true); try { const r=await fetch("/api/tenants"); const d=await r.json(); if(d.ok) setTenants(d.tenants); } catch(_){} setLoading(false); };
  useEffect(()=>{ cargar(); },[]);
  const abrirNuevo  = () => { setEditando(null); setForm(FORM_CLI); setError(""); setModal(true); };
  const abrirEditar = (t) => { setEditando(t); setForm({nombre:t.nombre||"",rubro:t.rubro||"",plan:t.plan||"starter",subdominio:t.subdominio||"",email:t.email||"",telefono:t.telefono||"",logo_url:t.logo_url||""}); setError(""); setModal(true); };
  const f = (v) => setForm(p=>({...p,...v}));

  const guardar = async () => {
    if(!form.nombre||!form.rubro){ setError("Nombre y rubro son obligatorios"); return; }
    setSaving(true); setError("");
    try {
      const m = editando?"PATCH":"POST";
      const b = editando?{...form,id:editando.id}:form;
      const r = await fetch("/api/tenants",{method:m,headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});
      const d = await r.json();
      if(d.ok){ setModal(false); cargar(); } else setError(d.error||"Error");
    } catch(_){ setError("Error de conexión"); }
    setSaving(false);
  };

  // ── Abrir modal de módulos ─────────────────────────────────────────
  const abrirModulos = async (t) => {
    setModalMods(true); setTenantMods(null); setMsgMod(""); setLoadingMods(true);
    try {
      const r = await fetch(`/api/admin/tenant-modulos?tenant_id=${t.id}`);
      const d = await r.json();
      if(d.ok) setTenantMods(d);
    } catch(_){}
    setLoadingMods(false);
  };

  const activar = async (modulo) => {
    if(!tenantMods) return;
    setActivando(modulo); setMsgMod("");
    try {
      const r = await fetch("/api/admin/tenant-modulos",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ tenant_id: tenantMods.tenant.id, modulo })
      });
      const d = await r.json();
      setMsgMod(d.ok ? d.mensaje : d.error);
      if(d.ok) {
        // Refrescar lista de módulos
        const r2 = await fetch(`/api/admin/tenant-modulos?tenant_id=${tenantMods.tenant.id}`);
        const d2 = await r2.json();
        if(d2.ok) setTenantMods(d2);
      }
    } catch(_){ setMsgMod("Error de conexión"); }
    setActivando(null);
  };

  const desactivar = async (modulo) => {
    if(!tenantMods) return;
    setActivando(modulo); setMsgMod("");
    try {
      const r = await fetch("/api/admin/tenant-modulos",{
        method:"DELETE",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ tenant_id: tenantMods.tenant.id, modulo })
      });
      const d = await r.json();
      setMsgMod(d.mensaje || d.error);
      if(d.ok) {
        const r2 = await fetch(`/api/admin/tenant-modulos?tenant_id=${tenantMods.tenant.id}`);
        const d2 = await r2.json();
        if(d2.ok) setTenantMods(d2);
      }
    } catch(_){ setMsgMod("Error de conexión"); }
    setActivando(null);
  };

  const GRUPOS = ["Operaciones","Comercial","Comunicación","Gestión"];

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Clientes</div><div className="vh-sub">{tenants.length} tenants registrados</div></div>
        <button className="btn btn-em btn-sm" onClick={abrirNuevo}><i className="bi bi-plus-lg" /> Nuevo cliente</button>
      </div>
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        {loading ? <Cargando /> : tenants.length===0 ? (
          <div style={{padding:"2.5rem",textAlign:"center",color:"var(--muted)"}}>
            <i className="bi bi-people" style={{fontSize:"2rem",display:"block",marginBottom:"0.5rem"}} />
            <div style={{fontSize:"0.85rem"}}>Sin clientes todavía</div>
            <button className="btn btn-em btn-sm" style={{marginTop:"0.8rem"}} onClick={abrirNuevo}>Agregar el primero</button>
          </div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Nombre</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Creado</th><th></th></tr></thead>
            <tbody>
              {tenants.map(t=>(
                <tr key={t.id}>
                  <td><div style={{fontWeight:600,fontSize:"0.82rem"}}>{t.nombre}</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{t.subdominio?`${t.subdominio}.gestion360ia.com.ar`:"Sin subdominio"}</div></td>
                  <td style={{fontSize:"0.78rem",color:"var(--sub)"}}>{t.rubro}</td>
                  <td><span className={`bdg ${PLAN_META[t.plan]?.cls||"bdg-moon"}`}>{PLAN_META[t.plan]?.label||t.plan}</span></td>
                  <td><span className={`bdg ${t.activo?"bdg-em":"bdg-moon"}`}>{t.activo?"Activo":"Inactivo"}</span></td>
                  <td style={{fontSize:"0.72rem",color:"var(--muted)"}}>{new Date(t.creado_en).toLocaleDateString("es-AR")}</td>
                  <td style={{display:"flex",gap:4}}>
                    <button className="btn btn-out btn-xs" onClick={()=>abrirEditar(t)}>Editar</button>
                    <button className="btn btn-xs" style={{background:"var(--pr-pale)",color:"var(--pr)",border:"none"}} onClick={()=>abrirModulos(t)}>
                      <i className="bi bi-puzzle" /> Módulos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal editar/crear tenant ── */}
      {modal && (
        <Modal onClose={()=>setModal(false)}>
          <div className="modal-hdr"><span className="modal-title">{editando?"Editar cliente":"Nuevo cliente"}</span><button className="btn btn-out btn-xs" onClick={()=>setModal(false)}>✕</button></div>
          <div className="modal-body">
            {error && <div style={{background:"var(--red-bg)",color:"var(--red)",padding:"0.5rem 0.7rem",borderRadius:"var(--r-sm)",fontSize:"0.78rem"}}>{error}</div>}
            <div className="fi-row"><div className="fg"><label className="fl">Nombre *</label><input className="fi" value={form.nombre} onChange={e=>f({nombre:e.target.value})} /></div><div className="fg"><label className="fl">Subdominio</label><input className="fi" value={form.subdominio} onChange={e=>f({subdominio:e.target.value})} /></div></div>
            <div className="fg"><label className="fl">Rubro *</label><select className="fi" value={form.rubro} onChange={e=>f({rubro:e.target.value})}><option value="">Seleccionar...</option>{RUBROS.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
            <div className="fi-row"><div className="fg"><label className="fl">Plan</label><select className="fi" value={form.plan} onChange={e=>f({plan:e.target.value})}><option value="starter">Starter</option><option value="pro">Pro</option><option value="plan_ia">Plan IA</option><option value="enterprise">Enterprise</option></select></div><div className="fg"><label className="fl">Teléfono</label><input className="fi" value={form.telefono} onChange={e=>f({telefono:e.target.value})} /></div></div>
            <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={form.email} onChange={e=>f({email:e.target.value})} /></div>
          </div>
          <ModalFooter onCancel={()=>setModal(false)} onConfirm={guardar} saving={saving} labelConfirm={editando?"Guardar cambios":"Crear cliente"} />
        </Modal>
      )}

      {/* ── Modal gestión de módulos ── */}
      {modalMods && (
        <Modal onClose={()=>setModalMods(false)} wide>
          <div className="modal-hdr">
            <span className="modal-title">
              <i className="bi bi-puzzle" style={{marginRight:6}} />
              Módulos — {tenantMods?.tenant?.nombre || "..."}
            </span>
            <button className="btn btn-out btn-xs" onClick={()=>setModalMods(false)}>✕</button>
          </div>
          <div className="modal-body">
            {loadingMods ? (
              <div style={{padding:"2rem",textAlign:"center",color:"var(--muted)"}}>Cargando módulos...</div>
            ) : !tenantMods ? (
              <div style={{color:"var(--red)",fontSize:"0.82rem"}}>Error al cargar módulos.</div>
            ) : (
              <>
                {msgMod && (
                  <div style={{
                    background: msgMod.startsWith("Módulo") ? "var(--em-pale)" : "var(--red-bg)",
                    color: msgMod.startsWith("Módulo") ? "var(--em-d)" : "var(--red)",
                    padding:"0.5rem 0.8rem", borderRadius:"var(--r-sm)", fontSize:"0.78rem", marginBottom:12
                  }}>{msgMod}</div>
                )}

                {/* Recomendados */}
                {tenantMods.recomendados?.length > 0 && (
                  <div style={{marginBottom:14,padding:"0.6rem 0.8rem",background:"var(--pr-pale)",borderRadius:"var(--r-sm)",fontSize:"0.75rem",color:"var(--pr)"}}>
                    <i className="bi bi-stars" style={{marginRight:5}} />
                    Recomendados para <strong>{tenantMods.tenant.rubro}</strong> con plan <strong>{tenantMods.tenant.plan}</strong>:&nbsp;
                    {tenantMods.recomendados.map(id => tenantMods.catalogo.find(m=>m.id===id)?.label).filter(Boolean).join(", ")}
                  </div>
                )}

                {/* Módulos por grupo */}
                {GRUPOS.map(grupo => {
                  const mods = tenantMods.catalogo.filter(m => m.grupo === grupo);
                  if (!mods.length) return null;
                  return (
                    <div key={grupo} style={{marginBottom:18}}>
                      <div style={{fontSize:"0.65rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>{grupo}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {mods.map(m => (
                          <div key={m.id} style={{
                            border:"1px solid var(--border)",borderRadius:"var(--r-sm)",
                            padding:"10px 12px",
                            background: m.activo ? "var(--em-pale)" : m.disponible ? "#fff" : "var(--bg)",
                            opacity: m.disponible ? 1 : 0.65,
                          }}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                              <i className={`bi ${m.icon}`} style={{color: m.activo?"var(--em-d)":m.disponible?"var(--pr)":"var(--muted)",fontSize:"0.9rem"}} />
                              <span style={{fontWeight:600,fontSize:"0.8rem",flex:1}}>{m.label}</span>
                              {m.activo && <span style={{fontSize:"0.6rem",fontWeight:700,color:"var(--em-d)",background:"var(--em-pale)",border:"1px solid var(--em-d)",borderRadius:20,padding:"1px 7px"}}>ACTIVO</span>}
                              {!m.disponible && <span style={{fontSize:"0.6rem",color:"var(--muted)",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:20,padding:"1px 7px"}}>Plan {m.plan_minimo}</span>}
                            </div>
                            <div style={{fontSize:"0.72rem",color:"var(--sub)",marginBottom:8,lineHeight:1.4}}>{m.descripcion}</div>
                            {m.activo ? (
                              <button
                                className="btn btn-xs"
                                style={{background:"var(--red-bg)",color:"var(--red)",border:"1px solid var(--red)",fontSize:"0.7rem"}}
                                disabled={activando===m.id}
                                onClick={()=>desactivar(m.id)}
                              >
                                {activando===m.id?"...":"Desactivar"}
                              </button>
                            ) : (
                              <button
                                className="btn btn-em btn-xs"
                                style={{fontSize:"0.7rem"}}
                                disabled={!m.disponible || activando===m.id}
                                onClick={()=>m.disponible && activar(m.id)}
                              >
                                {activando===m.id ? "Activando..." : <><i className="bi bi-lightning-charge" /> Activar</>}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══ RESTO DE VIEWS (sin cambios) ══ */

const AREA_META = {
  comercial:      {label:"Área Comercial", color:"var(--pr)",    bg:"var(--pr-pale)",     icon:"bi-graph-up-arrow"},
  contenido:      {label:"Área Marketing", color:"var(--accent)",bg:"var(--accent-pale)", icon:"bi-megaphone"},
  atencion:       {label:"Área Soporte",   color:"var(--em-d)",  bg:"var(--em-pale)",     icon:"bi-headset"},
  administracion: {label:"Administración", color:"var(--sub)",   bg:"var(--moon-l)",      icon:"bi-shield-lock"},
};
const ROL_META = { vendedor:{label:"Vendedor",color:"var(--pr)"}, cm:{label:"Community Manager",color:"var(--accent)"}, soporte:{label:"Soporte",color:"var(--em-d)"}, admin:{label:"Admin",color:"var(--sub)"}, superadmin:{label:"Superadmin",color:"var(--pr-d)"} };

function ViewEquipo() {
  const [tab,setTab]=useState("comercial"); const [data,setData]=useState({porArea:{}}); const [loading,setLoading]=useState(true); const [modalEditar,setModalEditar]=useState(false); const [editando,setEditando]=useState(null); const [formEdit,setFormEdit]=useState({rol:"",area:"",activo:1}); const [saving,setSaving]=useState(false); const [modalPerfil,setModalPerfil]=useState(false); const [perfilData,setPerfilData]=useState(null); const [loadingPerfil,setLoadingPerfil]=useState(false);
  const fe=(v)=>setFormEdit(p=>({...p,...v}));
  const cargar=async()=>{ setLoading(true); try{const r=await fetch("/api/equipos");const d=await r.json();if(d.ok)setData(d);}catch(_){} setLoading(false); };
  const abrirPerfil=async(u)=>{ setModalPerfil(true);setPerfilData(null);setLoadingPerfil(true); try{const r=await fetch(`/api/equipos/${u.id}`);const d=await r.json();if(d.ok)setPerfilData(d);}catch(_){} setLoadingPerfil(false); };
  useEffect(()=>{cargar();},[]);
  const abrirEditar=(u)=>{setEditando(u);setFormEdit({rol:u.rol||"",area:u.area||"",activo:u.activo??1});setModalEditar(true);};
  const guardarEditar=async()=>{ setSaving(true); try{await fetch("/api/equipos",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:editando.id,...formEdit})});setModalEditar(false);cargar();}catch(_){} setSaving(false); };
  const usuariosTab=data.porArea?.[tab]||[];
  return(
    <div className="view-anim">
      <div className="vh"><div><div className="vh-title">Equipo</div><div className="vh-sub">Áreas y personal</div></div></div>
      <div style={{display:"flex",gap:4,marginBottom:"0.9rem",background:"var(--bg)",borderRadius:"var(--r-sm)",padding:3,width:"fit-content"}}>
        {Object.entries(AREA_META).map(([k,v])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"0.28rem 0.8rem",borderRadius:"var(--r-sm)",border:"none",background:tab===k?"#fff":"transparent",color:tab===k?v.color:"var(--muted)",fontWeight:tab===k?700:500,fontSize:"0.75rem",cursor:"pointer",fontFamily:"inherit",boxShadow:tab===k?"var(--sh)":"none"}}>{v.label}</button>
        ))}
      </div>
      {loading?<Cargando/>:(
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <table className="tbl">
            <thead><tr><th>Miembro</th><th>Rol</th>{tab==="comercial"&&<><th>Leads activos</th><th>MRR generado</th><th>Tasa cierre</th></>}{tab==="atencion"&&<><th>Tickets abiertos</th><th>Resueltos</th><th>Satisfacción</th></>}{tab==="contenido"&&<th>Último acceso</th>}<th>Estado</th><th></th></tr></thead>
            <tbody>
              {usuariosTab.length===0?(<tr><td colSpan={8} style={{textAlign:"center",padding:"2rem",color:"var(--muted)"}}>Sin miembros en esta área</td></tr>):usuariosTab.map(u=>(
                <tr key={u.id}>
                  <td><div style={{display:"flex",alignItems:"center",gap:8}}><Av letra={u.nombre?.[0]} size={26}/><div><div style={{fontWeight:600,fontSize:"0.8rem"}}>{u.nombre||"—"}</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{u.email}</div></div></div></td>
                  <td><span className="bdg bdg-blue" style={{color:ROL_META[u.rol]?.color}}>{ROL_META[u.rol]?.label||u.rol}</span></td>
                  {tab==="comercial"&&<><td style={{fontSize:"0.78rem",fontWeight:600,color:"var(--blue)"}}>{u.leads_activos||0}</td><td style={{fontSize:"0.78rem",fontWeight:600}}>{u.mrr_generado?`$${Number(u.mrr_generado).toLocaleString("es-AR")}`:"—"}</td><td style={{fontSize:"0.78rem",fontWeight:600,color:"var(--em-d)"}}>{u.tasa_cierre||0}%</td></>}
                  {tab==="atencion"&&<><td style={{fontSize:"0.78rem",fontWeight:600,color:"var(--red)"}}>{u.tickets_abiertos||0}</td><td style={{fontSize:"0.78rem",fontWeight:600,color:"var(--em-d)"}}>{u.tickets_resueltos||0}</td><td style={{fontSize:"0.78rem",fontWeight:600,color:"var(--accent)"}}>{u.satisfaccion_avg||"—"}</td></>}
                  {tab==="contenido"&&<td style={{fontSize:"0.72rem",color:"var(--muted)"}}>{u.ultimo_acceso?new Date(u.ultimo_acceso).toLocaleDateString("es-AR"):"Nunca"}</td>}
                  <td><span className={`bdg ${u.activo?"bdg-em":"bdg-red"}`}>{u.activo?"Activo":"Inactivo"}</span></td>
                  <td style={{display:"flex",gap:4}}><button className="btn btn-out btn-xs" onClick={()=>abrirPerfil(u)}>Ver</button><button className="btn btn-out btn-xs" onClick={()=>abrirEditar(u)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalEditar&&editando&&(<Modal onClose={()=>setModalEditar(false)}><div className="modal-hdr"><span className="modal-title">Editar {editando.nombre}</span><button className="btn btn-out btn-xs" onClick={()=>setModalEditar(false)}>✕</button></div><div className="modal-body"><div className="fi-row"><div className="fg"><label className="fl">Rol</label><select className="fi" value={formEdit.rol} onChange={e=>fe({rol:e.target.value})}><option value="vendedor">Vendedor</option><option value="cm">Community Manager</option><option value="soporte">Soporte</option><option value="admin">Admin</option></select></div><div className="fg"><label className="fl">Área</label><select className="fi" value={formEdit.area} onChange={e=>fe({area:e.target.value})}><option value="">Sin área</option><option value="comercial">Comercial</option><option value="contenido">Marketing</option><option value="atencion">Soporte</option><option value="administracion">Administración</option></select></div></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.5rem 0",borderTop:"1px solid var(--border)"}}><div><div style={{fontSize:"0.8rem",fontWeight:600}}>Estado</div></div><div className={`tog${formEdit.activo?" on":""}`} onClick={()=>fe({activo:formEdit.activo?0:1})}><div className="tog-k"/></div></div></div><ModalFooter onCancel={()=>setModalEditar(false)} onConfirm={guardarEditar} saving={saving} labelConfirm="Guardar cambios"/></Modal>)}
      {modalPerfil&&(<Modal onClose={()=>setModalPerfil(false)}><div className="modal-hdr"><span className="modal-title">Perfil del miembro</span><button className="btn btn-out btn-xs" onClick={()=>setModalPerfil(false)}>✕</button></div><div className="modal-body">{loadingPerfil?<Cargando/>:perfilData?(<div><div style={{display:"flex",alignItems:"center",gap:"0.8rem",marginBottom:"1rem"}}><Av letra={perfilData.usuario?.nombre?.[0]} size={48}/><div><div style={{fontWeight:700,fontSize:"1rem"}}>{perfilData.usuario?.nombre}</div><div style={{fontSize:"0.75rem",color:"var(--muted)"}}>{perfilData.usuario?.email}</div></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.6rem"}}>{[["MRR generado",`$${Number(perfilData.usuario?.mrr_generado||0).toLocaleString("es-AR")}`],["Tasa de cierre",`${perfilData.usuario?.tasa_cierre||0}%`],["Tickets resueltos",perfilData.usuario?.tickets_resueltos||0],["Satisfacción",perfilData.usuario?.satisfaccion_avg||"—"]].map(([l,v])=>(<div key={l} className="card" style={{padding:"0.6rem 0.8rem"}}><div style={{fontSize:"0.65rem",color:"var(--muted)",fontWeight:600,textTransform:"uppercase"}}>{l}</div><div style={{fontSize:"1.1rem",fontWeight:700,marginTop:2}}>{v}</div></div>))}</div></div>):<div style={{textAlign:"center",color:"var(--muted)"}}>Sin datos</div>}</div></Modal>)}
    </div>
  );
}

const PRIORIDAD_META={urgente:{cls:"bdg-urgente",label:"Urgente"},alta:{cls:"bdg-alta",label:"Alta"},media:{cls:"bdg-media",label:"Media"},baja:{cls:"bdg-baja",label:"Baja"}};
const ESTADO_TICKET={nuevo:{label:"Nuevo",cls:"bdg-blue"},en_curso:{label:"En curso",cls:"bdg-amber"},esperando:{label:"Esperando",cls:"bdg-moon"},resuelto:{label:"Resuelto",cls:"bdg-em"},cerrado:{label:"Cerrado",cls:"bdg-moon"}};
function ViewSoporte({session}){
  const [tickets,setTickets]=useState([]);const [loading,setLoading]=useState(true);const [ticketActivo,setTicketActivo]=useState(null);const [mensajes,setMensajes]=useState([]);const [loadingMsg,setLoadingMsg]=useState(false);const [texto,setTexto]=useState("");const [enviando,setEnviando]=useState(false);const [modal,setModal]=useState(false);const [form,setForm]=useState({tenant_id:"",canal:"email",categoria:"otro",prioridad:"media",titulo:"",descripcion:"",asignado_a:""});const [saving,setSaving]=useState(false);const [agentes,setAgentes]=useState([]);
  const fs=(v)=>setForm(p=>({...p,...v}));
  const cargar=async()=>{setLoading(true);try{const r=await fetch("/api/soporte/tickets");const d=await r.json();if(d.ok)setTickets(d.tickets);}catch(_){}setLoading(false);};
  const cargarMensajes=async(t)=>{setTicketActivo(t);setLoadingMsg(true);try{const r=await fetch(`/api/soporte/mensajes?ticket_id=${t.id}`);const d=await r.json();if(d.ok)setMensajes(d.mensajes);}catch(_){}setLoadingMsg(false);};
  const cargarAgentes=async()=>{try{const r=await fetch("/api/usuarios");const d=await r.json();if(d.ok)setAgentes(d.usuarios.filter(u=>["soporte","admin","superadmin"].includes(u.rol)&&u.activo));}catch(_){}};
  useEffect(()=>{cargar();cargarAgentes();},[]);
  const enviarMsg=async()=>{if(!texto.trim()||!ticketActivo)return;setEnviando(true);try{await fetch("/api/soporte/mensajes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticket_id:ticketActivo.id,direccion:"saliente",contenido:texto,enviado_por:session?.user?.id})});setTexto("");await cargarMensajes(ticketActivo);}catch(_){}setEnviando(false);};
  const crearTicket=async()=>{if(!form.titulo)return;setSaving(true);try{const r=await fetch("/api/soporte/tickets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();if(d.ok){setModal(false);setForm({tenant_id:"",canal:"email",categoria:"otro",prioridad:"media",titulo:"",descripcion:"",asignado_a:""});cargar();}}catch(_){}setSaving(false);};
  return(<div className="view-anim"><div className="vh"><div><div className="vh-title">Soporte</div><div className="vh-sub">Tickets y atención</div></div><button className="btn btn-em btn-sm" onClick={()=>setModal(true)}><i className="bi bi-plus-lg"/> Nuevo ticket</button></div><div style={{display:"grid",gridTemplateColumns:ticketActivo?"1fr 1fr":"1fr",gap:"0.8rem"}}><div className="card" style={{padding:0,overflow:"hidden"}}>{loading?<Cargando/>:tickets.length===0?(<div style={{padding:"2rem",textAlign:"center",color:"var(--muted)",fontSize:"0.82rem"}}>Sin tickets</div>):(<table className="tbl"><thead><tr><th>Ticket</th><th>Prioridad</th><th>Estado</th><th>Canal</th><th>Creado</th></tr></thead><tbody>{tickets.map(t=>(<tr key={t.id} style={{cursor:"pointer",background:ticketActivo?.id===t.id?"var(--pr-pale)":""}} onClick={()=>cargarMensajes(t)}><td><div style={{fontWeight:600,fontSize:"0.82rem"}}>{t.titulo}</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{t.categoria}</div></td><td><span className={`bdg ${PRIORIDAD_META[t.prioridad]?.cls}`}>{PRIORIDAD_META[t.prioridad]?.label}</span></td><td><span className={`bdg ${ESTADO_TICKET[t.estado]?.cls}`}>{ESTADO_TICKET[t.estado]?.label}</span></td><td style={{fontSize:"0.72rem"}}>{t.canal}</td><td style={{fontSize:"0.72rem",color:"var(--muted)"}}>{new Date(t.creado_en).toLocaleDateString("es-AR")}</td></tr>))}</tbody></table>)}</div>{ticketActivo&&(<div className="card" style={{padding:0,overflow:"hidden",display:"flex",flexDirection:"column"}}><div style={{padding:"0.65rem 1rem",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"0.5rem"}}><div style={{flex:1}}><div style={{fontWeight:700,fontSize:"0.85rem"}}>{ticketActivo.titulo}</div></div><span className={`bdg ${PRIORIDAD_META[ticketActivo.prioridad]?.cls}`}>{PRIORIDAD_META[ticketActivo.prioridad]?.label}</span><button className="btn btn-out btn-xs" onClick={()=>setTicketActivo(null)}>✕</button></div><div className="chat-msgs" style={{flex:1,maxHeight:320}}>{loadingMsg?<Cargando/>:mensajes.map(m=>(<div key={m.id} className={`msg ${m.direccion==="entrante"?"in":"out"}`}>{m.contenido}</div>))}</div><div className="chat-input"><input value={texto} onChange={e=>setTexto(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enviarMsg()} placeholder="Responder…" style={{flex:1,border:"1px solid var(--border)",borderRadius:"var(--r-sm)",padding:"0.4rem 0.7rem",fontSize:"0.8rem",fontFamily:"inherit",outline:"none"}}/><button className="btn btn-em btn-sm" onClick={enviarMsg} disabled={enviando||!texto.trim()}><i className="bi bi-send"/></button></div></div>)}</div>{modal&&(<Modal onClose={()=>setModal(false)}><div className="modal-hdr"><span className="modal-title">Nuevo ticket</span><button className="btn btn-out btn-xs" onClick={()=>setModal(false)}>✕</button></div><div className="modal-body"><div className="fg"><label className="fl">Título *</label><input className="fi" value={form.titulo} onChange={e=>fs({titulo:e.target.value})}/></div><div className="fi-row"><div className="fg"><label className="fl">Prioridad</label><select className="fi" value={form.prioridad} onChange={e=>fs({prioridad:e.target.value})}><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></div><div className="fg"><label className="fl">Canal</label><select className="fi" value={form.canal} onChange={e=>fs({canal:e.target.value})}><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="web">Web</option></select></div></div><div className="fi-row"><div className="fg"><label className="fl">Categoría</label><select className="fi" value={form.categoria} onChange={e=>fs({categoria:e.target.value})}><option value="tecnico">Técnico</option><option value="facturacion">Facturación</option><option value="capacitacion">Capacitación</option><option value="otro">Otro</option></select></div><div className="fg"><label className="fl">Asignar a</label><select className="fi" value={form.asignado_a} onChange={e=>fs({asignado_a:e.target.value})}><option value="">Sin asignar</option>{agentes.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div></div><div className="fg"><label className="fl">Descripción</label><textarea className="fi" rows={3} value={form.descripcion} onChange={e=>fs({descripcion:e.target.value})} style={{resize:"vertical"}}/></div></div><ModalFooter onCancel={()=>setModal(false)} onConfirm={crearTicket} saving={saving} labelConfirm="Crear ticket"/></Modal>)}</div>);
}

function ViewModulos(){const modulos=[["bi-grid-1x2","Dashboard IA","Estadísticas e inteligencia analítica"],["bi-people","CRM / Clientes","Gestión de clientes y leads"],["bi-whatsapp","WhatsApp Bot","Bot con IA y memoria de contexto"],["bi-calendar-check","Agenda / Turnos","Turnos inteligentes con predicción"],["bi-receipt","Facturación","Facturas y presupuestos con IA"],["bi-bell","Notificaciones","Comunicaciones automatizadas"],["bi-bar-chart-line","Estadísticas","Análisis en lenguaje natural"],["bi-geo-alt","Mapas","Geolocalización y seguimiento"],["bi-building","Reservas / Hotel","Gestión de habitaciones y reservas"],["bi-heart-pulse","Historia Clínica","Pacientes y turnos médicos"],["bi-house","Propiedades","Gestión inmobiliaria con mapa"],["bi-truck","Distribución","Rutas y logística inteligente"]];return(<div className="view-anim"><div className="vh"><div><div className="vh-title">Módulos</div><div className="vh-sub">Catálogo del sistema</div></div></div><div className="g3">{modulos.map((m,i)=><div key={i} className="card"><div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}><div className="mod-ico" style={{background:"var(--pr-pale)"}}><i className={`bi ${m[0]}`} style={{color:"var(--pr)"}}/></div><div style={{flex:1}}><div className="mod-name">{m[1]}</div><div className="mod-desc">{m[2]}</div></div><div className="tog" onClick={e=>e.currentTarget.classList.toggle("on")}><div className="tog-k"/></div></div></div>)}</div></div>);}

function ViewPlanes(){const planes=[{name:"Starter",price:"Gratis",color:"var(--sub)",features:["Módulos básicos limitados","1 usuario","Sin WhatsApp","1 sugerencia IA/día"],off:[2,3]},{name:"Pro",price:"$XX.000",color:"var(--em)",features:["Módulos completos","5 usuarios","WhatsApp activo","Skills IA Nivel 2"],off:[]},{name:"Plan IA",price:"$XX.000",color:"var(--accent)",features:["Todo Pro incluido","Skills IA completas","Asistente IA avanzado","Sugerencias reactivas"],off:[]},{name:"Enterprise",price:"A consultar",color:"var(--pr)",features:["Multi-cuenta","White label","Módulos custom","Consultoría incluida"],off:[]}];return(<div className="view-anim"><div className="vh"><div><div className="vh-title">Planes</div><div className="vh-sub">Gestión de suscripciones</div></div><button className="btn btn-em btn-sm"><i className="bi bi-plus-lg"/> Nuevo plan</button></div><div className="g4">{planes.map((p,i)=><div key={i} className="plan-card"><div className="plan-hdr"><div className="plan-name" style={{color:p.color}}>{p.name}</div><div className="plan-price">{p.price}<span>/mes</span></div></div>{p.features.map((f,j)=><div key={j} className={`plan-feature${p.off.includes(j)?" off":""}`}><i className={`bi ${p.off.includes(j)?"bi-x":"bi-check2"}`} style={{color:p.off.includes(j)?"var(--border2)":p.color}}/>{f}</div>)}<div className="plan-foot"><button className="btn btn-em btn-sm" style={{width:"100%",background:p.color}}>Gestionar</button></div></div>)}</div></div>);}

function ViewComunicaciones(){return(<div className="comm-wrap view-anim"><div className="conv-list"><div className="conv-hdr"><div className="conv-hdr-title">Conversaciones</div></div><div className="conv-search"><i className="bi bi-search" style={{color:"var(--muted)",fontSize:"0.75rem"}}/><input placeholder="Buscar…"/></div><div className="conv-items">{[["HA","Hotel Alvear","¿Cuándo se activa el módulo?","10:24"],["SV","Salón Versailles","Necesito ajustar el bot","09:15"],["DR","Dra. López","Consulta sobre facturación","ayer"]].map(([av,name,prev,time],i)=>(<div key={i} className={`conv-item${i===0?" active":""}`}><div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><div className="conv-av" style={{width:30,height:30,fontSize:"0.72rem"}}>{av[0]}</div><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600,fontSize:"0.78rem"}}>{name}</span><span style={{fontSize:"0.62rem",color:"var(--muted)"}}>{time}</span></div><div style={{fontSize:"0.67rem",color:"var(--muted)",marginTop:1}}>{prev}</div></div></div></div>))}</div></div><div className="chat-panel"><div className="chat-hdr"><div className="conv-av" style={{width:30,height:30,fontSize:"0.72rem"}}>H</div><div style={{flex:1}}><div style={{fontWeight:600,fontSize:"0.82rem"}}>Hotel Alvear</div></div></div><div className="chat-msgs"><div className="msg in">¿Cuándo se activa el módulo de reservas?</div><div className="msg out">Hola! El módulo se activa automáticamente dentro de las próximas 24hs.</div></div><div className="chat-input"><input placeholder="Escribí un mensaje…" style={{flex:1,border:"1px solid var(--border)",borderRadius:"var(--r-sm)",padding:"0.4rem 0.7rem",fontSize:"0.8rem",fontFamily:"inherit",outline:"none"}}/><button className="btn btn-em btn-sm"><i className="bi bi-send"/></button></div></div></div>);}

function ViewSeguimiento(){return(<div className="view-anim"><div className="vh"><div><div className="vh-title">Seguimiento</div><div className="vh-sub">Tareas y recordatorios</div></div><button className="btn btn-em btn-sm"><i className="bi bi-plus-lg"/> Nueva tarea</button></div><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3rem",color:"var(--muted)",gap:"0.5rem"}}><i className="bi bi-check2-square" style={{fontSize:"2.5rem"}}/><div style={{fontSize:"0.85rem",fontWeight:600}}>Módulo en desarrollo</div></div></div>);}

function ViewAlertas(){return(<div className="view-anim"><div className="vh"><div><div className="vh-title">Alertas IA</div><div className="vh-sub">Detecciones automáticas</div></div></div><div className="alert-row warn"><i className="bi bi-exclamation-triangle" style={{color:"var(--amber)",fontSize:"0.85rem",flexShrink:0,marginTop:"0.1rem"}}/><div style={{fontSize:"0.77rem",color:"var(--text)",lineHeight:1.4,flex:1}}><strong>Salón Versailles</strong> — Sin actividad hace 7 días.</div><button className="btn btn-xs btn-out" style={{marginLeft:"auto",flexShrink:0}}>Acción</button></div><div className="alert-row em"><i className="bi bi-check-circle" style={{color:"var(--em)",fontSize:"0.85rem",flexShrink:0,marginTop:"0.1rem"}}/><div style={{fontSize:"0.77rem",color:"var(--text)",lineHeight:1.4,flex:1}}><strong>Hotel Alvear</strong> — Activó módulo Reservas.</div></div></div>);}

/* ══ INTEGRACIONES (completa, sin cambios respecto a versión anterior) ══ */
const INT_SECCIONES=[{id:"whatsapp",titulo:"WhatsApp",icono:"bi-whatsapp",desc:"Conectá una o más líneas de WhatsApp",tipo:"whatsapp_multi"},{id:"web",titulo:"Web / Chat",icono:"bi-chat-dots",desc:"Widget embebible para tu sitio",items:[{tipo:"web",label:"Web / Chat",icono:"bi-chat-dots",color:"#1A7A4A",bg:"#F0FAF4",desc:"Widget de chat",proximamente:false}]},{id:"google",titulo:"Google",icono:"bi-google",desc:"Gmail, Calendar y Maps",items:[{tipo:"gmail",label:"Gmail",icono:"bi-envelope",color:"#EA4335",bg:"#FEF2F1",desc:"Leé y gestioná tu correo",proximamente:false},{tipo:"google_calendar",label:"Google Calendar",icono:"bi-calendar-check",color:"#1A73E8",bg:"#EBF3FE",desc:"Sincronizá turnos y eventos",proximamente:false},{tipo:"google_maps",label:"Google Maps",icono:"bi-geo-alt",color:"#34A853",bg:"#F0FAF3",desc:"Mapas y geolocalización",proximamente:true}]},{id:"meta",titulo:"Meta",icono:"bi-meta",desc:"Instagram y Facebook",items:[{tipo:"instagram",label:"Instagram",icono:"bi-instagram",color:"#E1306C",bg:"#FEF0F5",desc:"Mensajes con IA",proximamente:true},{tipo:"facebook",label:"Facebook",icono:"bi-facebook",color:"#1877F2",bg:"#EBF3FE",desc:"Messenger conectado",proximamente:true}]},{id:"pagos",titulo:"Pagos",icono:"bi-credit-card",desc:"Procesadores de pago",items:[{tipo:"mercadopago",label:"MercadoPago",icono:"bi-credit-card",color:"#009EE3",bg:"#EBF8FE",desc:"Cobros en ARS",proximamente:true}]},{id:"afip",titulo:"ARCA / AFIP",icono:"bi-building-check",desc:"Facturación electrónica",items:[{tipo:"afip",label:"ARCA / AFIP",icono:"bi-building-check",color:"#506886",bg:"#EDF1F6",desc:"Facturación electrónica",proximamente:true}]}];
const IMPORT_TIPOS=[{id:"clientes",label:"Clientes / Contactos",icono:"bi-people",desc:"Nombre, email, teléfono"},{id:"productos",label:"Productos",icono:"bi-box-seam",desc:"Código, nombre, precio"},{id:"proveedores",label:"Proveedores",icono:"bi-truck",desc:"Nombre, CUIT, contacto"},{id:"precios",label:"Lista de precios",icono:"bi-tag",desc:"SKU, precio, descuento"}];

function IntBadge({estado,wspStatus}){const s=estado==="conectado"||wspStatus==="open";const c=estado==="conectando";const e=estado==="error";const p=estado==="proximamente";if(p)return<span style={{fontSize:"0.65rem",fontWeight:700,color:"#1E40AF",background:"#DBEAFE",border:"0.5px solid #93C5FD",borderRadius:999,padding:"2px 8px"}}>Próximamente</span>;if(s)return<span style={{fontSize:"0.65rem",fontWeight:700,color:"#166534",background:"#DCFCE7",border:"0.5px solid #86EFAC",borderRadius:999,padding:"2px 8px"}}>● Conectado</span>;if(c)return<span style={{fontSize:"0.65rem",fontWeight:700,color:"#92400E",background:"#FEF3C7",border:"0.5px solid #FCD34D",borderRadius:999,padding:"2px 8px"}}>◌ Conectando</span>;if(e)return<span style={{fontSize:"0.65rem",fontWeight:700,color:"#991B1B",background:"#FEE2E2",border:"0.5px solid #FCA5A5",borderRadius:999,padding:"2px 8px"}}>✕ Error</span>;return<span style={{fontSize:"0.65rem",fontWeight:600,color:"var(--muted)",background:"var(--bg)",border:"0.5px solid var(--border)",borderRadius:999,padding:"2px 8px"}}>Desconectado</span>;}

function IntTarjeta({item,tokenData,onConectar,onDesconectar,saving}){const esPrx=item.proximamente||tokenData?.estado==="proximamente";const esConec=tokenData?.estado==="conectado"||tokenData?.wsp_status==="open";const metadata=tokenData?.metadata?(typeof tokenData.metadata==="string"?JSON.parse(tokenData.metadata):tokenData.metadata):null;return(<div style={{background:"var(--white)",border:`0.5px solid ${esConec?"#BBF7D0":"var(--border)"}`,borderRadius:"var(--r)",padding:"0.9rem",display:"flex",flexDirection:"column",gap:"0.6rem",opacity:esPrx?0.7:1}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{width:36,height:36,borderRadius:9,background:item.bg||"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className={`bi ${item.icono}`} style={{color:item.color||"var(--muted)",fontSize:"1rem"}}/></div><IntBadge estado={tokenData?.estado||"desconectado"} wspStatus={tokenData?.wsp_status}/></div><div><div style={{fontSize:"0.82rem",fontWeight:700,color:"var(--text)"}}>{item.label}</div><div style={{fontSize:"0.7rem",color:"var(--muted)",marginTop:2}}>{item.desc}</div>{metadata?.email&&<div style={{fontSize:"0.67rem",color:"var(--sub)",marginTop:3}}><i className="bi bi-person-circle" style={{fontSize:"0.7rem",marginRight:3}}/>{metadata.email}</div>}</div>{!esPrx&&(esConec?(<button onClick={onDesconectar} disabled={saving} className="btn btn-out btn-sm" style={{width:"100%",justifyContent:"center"}}>{saving?"…":"Desconectar"}</button>):(<button onClick={onConectar} disabled={saving} className="btn btn-sm" style={{width:"100%",justifyContent:"center",background:"#1A7A4A",color:"#fff",border:"none"}}>{saving?"…":"Conectar"}</button>))}</div>);}

function ModalWhatsAppNuevo({onClose,tenantId,onConectado}){const [fase,setFase]=useState("form");const [nombre,setNombre]=useState("");const [qr,setQr]=useState(null);const [msg,setMsg]=useState("");const pollingRef=useRef(null);const iniciar=async()=>{if(!nombre.trim()){setMsg("Ingresá un nombre");return;}setFase("cargando");try{const r=await fetch("/api/integraciones/whatsapp/init",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tenant_id:tenantId,nombre:nombre.trim()})});const d=await r.json();if(d.ok&&d.qr){setQr(d.qr);setFase("qr");pollingRef.current=setInterval(async()=>{try{const r=await fetch(`/api/integraciones/whatsapp/status?instance_id=${d.instance_id}`);const dd=await r.json();if(dd.conectado){clearInterval(pollingRef.current);setFase("conectado");onConectado&&onConectado();}}catch{}},3000);}else{setMsg(d.error||"Error");setFase("error");}}catch{setMsg("Error de conexión");setFase("error");}};useEffect(()=>()=>clearInterval(pollingRef.current),[]);const bV={background:"#1A7A4A",color:"#fff",border:"none",borderRadius:"var(--r-sm)",padding:"0.55rem 1.2rem",fontSize:"0.82rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit"};const bG={background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:"var(--r-sm)",padding:"0.55rem 1.2rem",fontSize:"0.82rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit"};return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}><div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:420,boxShadow:"var(--sh-md)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.2rem",borderBottom:"1px solid var(--border)"}}><div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}><div style={{width:34,height:34,borderRadius:9,background:"#F0FBF4",display:"flex",alignItems:"center",justifyContent:"center"}}><i className="bi bi-whatsapp" style={{color:"#25D366",fontSize:"1rem"}}/></div><div><div style={{fontSize:"0.88rem",fontWeight:700}}>Nueva línea WhatsApp</div></div></div><button onClick={onClose} style={{background:"none",border:"none",fontSize:"1rem",color:"var(--muted)",cursor:"pointer"}}>✕</button></div><div style={{padding:"1.4rem",textAlign:"center"}}>{fase==="form"&&(<><div style={{textAlign:"left",marginBottom:"1rem"}}><label style={{fontSize:"0.75rem",fontWeight:600,color:"var(--sub)",display:"block",marginBottom:"0.3rem"}}>Nombre de esta línea</label><input className="fi" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Ventas, Soporte" style={{width:"100%"}} autoFocus/>{msg&&<div style={{fontSize:"0.72rem",color:"var(--red)",marginTop:"0.3rem"}}>{msg}</div>}</div><div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end"}}><button onClick={onClose} style={bG}>Cancelar</button><button onClick={iniciar} style={bV}>Generar QR →</button></div></>)}{fase==="cargando"&&(<><div style={{fontSize:"2rem",marginBottom:"1rem"}}>⏳</div><p style={{color:"var(--muted)",fontSize:"0.85rem"}}>Generando QR…</p></>)}{fase==="qr"&&qr&&(<><div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:12,display:"inline-block",padding:"1rem",marginBottom:"1rem"}}><img src={qr} alt="QR" style={{width:200,height:200}}/></div><p style={{color:"var(--text)",fontSize:"0.82rem",lineHeight:1.6,marginBottom:"0.5rem"}}>1. Abrí WhatsApp<br/>2. Dispositivos vinculados<br/>3. Escaneá el QR</p><div style={{fontSize:"0.75rem",color:"var(--muted)"}}>Esperando conexión…</div></>)}{fase==="conectado"&&(<><div style={{fontSize:"3rem",marginBottom:"0.8rem"}}>✅</div><div style={{fontSize:"1rem",fontWeight:700,color:"#166534",marginBottom:"0.4rem"}}>¡WhatsApp conectado!</div><p style={{color:"var(--muted)",fontSize:"0.82rem",marginBottom:"1rem"}}>La línea <strong>{nombre}</strong> está activa.</p><button onClick={onClose} style={bV}>Cerrar</button></>)}{fase==="error"&&(<><div style={{fontSize:"2.5rem",marginBottom:"0.8rem"}}>⚠️</div><p style={{color:"var(--red)",fontSize:"0.85rem",marginBottom:"1rem"}}>{msg}</p><button onClick={()=>{setFase("form");setMsg("");}} style={bG}>Reintentar</button></>)}</div></div></div>);}

function SeccionWhatsApp({tenantId,onToast}){const [instancias,setInstancias]=useState([]);const [loading,setLoading]=useState(true);const [modal,setModal]=useState(false);const [saving,setSaving]=useState(null);const cargar=async()=>{setLoading(true);try{const r=await fetch(`/api/integraciones/whatsapp/instancias${tenantId?`?tenant_id=${tenantId}`:""}`);const d=await r.json();if(d.ok)setInstancias(d.instancias);}catch{}setLoading(false);};useEffect(()=>{cargar();},[]);const desconectar=async(inst)=>{if(!confirm(`¿Desconectar "${inst.nombre}"?`))return;setSaving(inst.id);try{await fetch("/api/integraciones/whatsapp/disconnect",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({instance_id:inst.id,tenant_id:tenantId})});onToast("Línea desconectada");cargar();}catch{onToast("Error al desconectar","error");}setSaving(null);};return(<div style={{marginBottom:"1.5rem"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.6rem"}}><div><div style={{fontSize:"0.75rem",fontWeight:700,color:"var(--text)",display:"flex",alignItems:"center",gap:"0.4rem"}}><i className="bi bi-whatsapp" style={{color:"#25D366"}}/> WhatsApp</div><div style={{fontSize:"0.68rem",color:"var(--muted)",marginTop:1}}>Conectá una o más líneas</div></div><button className="btn btn-sm" style={{background:"#1A7A4A",color:"#fff",border:"none"}} onClick={()=>setModal(true)}><i className="bi bi-plus-lg"/> Nueva línea</button></div>{loading?<div style={{fontSize:"0.78rem",color:"var(--muted)",padding:"0.5rem 0"}}>Cargando…</div>:(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0.6rem"}}>{instancias.map(inst=>(<div key={inst.id} style={{background:"var(--white)",border:`0.5px solid ${inst.estado==="conectado"?"#BBF7D0":"var(--border)"}`,borderRadius:"var(--r)",padding:"0.9rem",display:"flex",flexDirection:"column",gap:"0.5rem"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{width:34,height:34,borderRadius:9,background:"#F0FBF4",display:"flex",alignItems:"center",justifyContent:"center"}}><i className="bi bi-whatsapp" style={{color:"#25D366",fontSize:"1rem"}}/></div><IntBadge estado={inst.estado} wspStatus={inst.wsp_status}/></div><div><div style={{fontSize:"0.82rem",fontWeight:700,color:"var(--text)"}}>{inst.nombre}</div>{inst.numero&&<div style={{fontSize:"0.7rem",color:"var(--muted)",marginTop:2}}>{inst.numero}</div>}</div><button onClick={()=>desconectar(inst)} disabled={saving===inst.id} className="btn btn-out btn-sm" style={{width:"100%",justifyContent:"center"}}>{saving===inst.id?"…":"Desconectar"}</button></div>))}{instancias.length===0&&<div style={{gridColumn:"1/-1",padding:"1rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem",background:"var(--bg)",borderRadius:"var(--r)",border:"0.5px dashed var(--border2)"}}>Sin líneas conectadas todavía</div>}</div>)}{modal&&<ModalWhatsAppNuevo tenantId={tenantId} onClose={()=>setModal(false)} onConectado={()=>{cargar();onToast("WhatsApp conectado");}}/>}</div>);}

function SeccionImportar({onToast}){const [tipoActivo,setTipoActivo]=useState(null);const [archivo,setArchivo]=useState(null);const [subiendo,setSubiendo]=useState(false);const inputRef=useRef(null);const handleArchivo=(e)=>{const f=e.target.files?.[0];if(!f)return;const ext=f.name.split(".").pop().toLowerCase();if(!["csv","xlsx","xls"].includes(ext)){onToast("Solo CSV o Excel","error");return;}setArchivo(f);};const subir=async()=>{if(!archivo||!tipoActivo)return;setSubiendo(true);try{const fd=new FormData();fd.append("archivo",archivo);fd.append("tipo",tipoActivo.id);const r=await fetch("/api/importar",{method:"POST",body:fd});const d=await r.json();if(d.ok){onToast(`${d.importados} registros importados`);setArchivo(null);setTipoActivo(null);}else onToast(d.error||"Error","error");}catch{onToast("Error de conexión","error");}setSubiendo(false);};return(<div style={{marginBottom:"1.5rem"}}><div style={{marginBottom:"0.6rem"}}><div style={{fontSize:"0.75rem",fontWeight:700,color:"var(--text)",display:"flex",alignItems:"center",gap:"0.4rem"}}><i className="bi bi-file-earmark-arrow-up" style={{color:"var(--accent)"}}/> Importar datos</div><div style={{fontSize:"0.68rem",color:"var(--muted)",marginTop:1}}>Cargá datos masivos desde CSV o Excel</div></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"0.5rem",marginBottom:"0.8rem"}}>{IMPORT_TIPOS.map(t=>(<div key={t.id} onClick={()=>setTipoActivo(t)} style={{background:tipoActivo?.id===t.id?"var(--em-pale)":"var(--white)",border:`0.5px solid ${tipoActivo?.id===t.id?"var(--em)":"var(--border)"}`,borderRadius:"var(--r)",padding:"0.75rem",cursor:"pointer"}}><i className={`bi ${t.icono}`} style={{color:tipoActivo?.id===t.id?"var(--em-d)":"var(--muted)",fontSize:"1.1rem",display:"block",marginBottom:"0.4rem"}}/><div style={{fontSize:"0.78rem",fontWeight:600,color:"var(--text)"}}>{t.label}</div><div style={{fontSize:"0.67rem",color:"var(--muted)",marginTop:2}}>{t.desc}</div></div>))}</div>{tipoActivo&&(<div style={{background:"var(--bg)",border:"0.5px solid var(--border)",borderRadius:"var(--r)",padding:"1rem"}}><div style={{fontSize:"0.8rem",fontWeight:600,color:"var(--text)",marginBottom:"0.5rem"}}>Importar: {tipoActivo.label}</div><div style={{display:"flex",alignItems:"center",gap:"0.6rem",flexWrap:"wrap"}}><input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleArchivo} style={{display:"none"}}/><button className="btn btn-out btn-sm" onClick={()=>inputRef.current?.click()}><i className="bi bi-upload"/> {archivo?archivo.name:"Seleccionar archivo"}</button>{archivo&&<button className="btn btn-em btn-sm" onClick={subir} disabled={subiendo}>{subiendo?"Importando…":"Importar"}</button>}</div><div style={{fontSize:"0.68rem",color:"var(--muted)",marginTop:"0.5rem"}}>Formatos: .csv, .xlsx, .xls — Máximo 5 MB</div></div>)}</div>);}

function ViewIntegraciones({tenantId=null}){const [tokens,setTokens]=useState([]);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(null);const [toast,setToast]=useState(null);const showToast=(msg,tipo="ok")=>{setToast({msg,tipo});setTimeout(()=>setToast(null),3500);};const cargarTokens=useCallback(async()=>{setLoading(true);try{const r=await fetch(`/api/integraciones${tenantId?`?tenant_id=${tenantId}`:""}`);const d=await r.json();if(d.ok)setTokens(d.integraciones);}catch{}setLoading(false);},[tenantId]);useEffect(()=>{cargarTokens();},[cargarTokens]);const getToken=(tipo)=>tokens.find(t=>t.tipo===tipo)||null;const gmailConectado=getToken("gmail")?.estado==="conectado";const conectarGoogle=async()=>{try{const r=await fetch(`/api/integraciones/google/auth${tenantId?`?tenant_id=${tenantId}`:""}`);const d=await r.json();if(d.ok&&d.url)window.location.href=d.url;}catch{showToast("Error al conectar con Google","error");};};const onConectar=(tipo)=>{if(["gmail","google_calendar","google_maps"].includes(tipo))return conectarGoogle();showToast("Esta integración estará disponible pronto","info");};const onDesconectar=async(tipo)=>{const token=getToken(tipo);if(!token)return;if(!confirm(`¿Desconectar ${tipo}?`))return;setSaving(tipo);try{let url="";if(["gmail","google_calendar","google_maps"].includes(tipo))url="/api/integraciones/google/disconnect";if(!url)return;await fetch(url,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({tenant_id:tenantId})});showToast("Integración desconectada");cargarTokens();}catch{showToast("Error al desconectar","error");}setSaving(null);};const totalConectadas=tokens.filter(t=>t.estado==="conectado"||t.wsp_status==="open").length;return(<div className="view-anim" style={{maxWidth:820}}><div className="vh"><div><div className="vh-title">Integraciones</div><div className="vh-sub">{totalConectadas>0?`${totalConectadas} conexión${totalConectadas>1?"es":""} activa${totalConectadas>1?"s":""}`:""}</div></div><button className="btn btn-out btn-sm" onClick={cargarTokens}><i className="bi bi-arrow-clockwise"/></button></div>{!loading&&totalConectadas===0&&(<div style={{background:"linear-gradient(135deg,#1C3D2E,#2A5A44)",borderRadius:"var(--r)",padding:"0.9rem 1.1rem",display:"flex",alignItems:"flex-start",gap:"0.75rem",marginBottom:"1.2rem"}}><i className="bi bi-plug" style={{color:"#4AB880",fontSize:"1.1rem",marginTop:2,flexShrink:0}}/><div><div style={{fontSize:"0.7rem",fontWeight:700,color:"rgba(255,255,255,.55)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.2rem"}}>Maia · Sin conexiones activas</div><div style={{fontSize:"0.8rem",color:"rgba(255,255,255,.9)",lineHeight:1.5}}>Conectá al menos un canal. Te recomendamos empezar por <strong>WhatsApp</strong>.</div></div></div>)}{loading?<div style={{padding:"2rem",textAlign:"center",color:"var(--muted)",fontSize:"0.82rem"}}>Cargando integraciones…</div>:(<><SeccionWhatsApp tenantId={tenantId} onToast={showToast}/>{INT_SECCIONES.filter(s=>s.items).map(sec=>{const items=sec.items.filter(item=>!(item.tipo==="email"&&gmailConectado));if(!items.length)return null;return(<div key={sec.id} style={{marginBottom:"1.5rem"}}><div style={{marginBottom:"0.6rem"}}><div style={{fontSize:"0.75rem",fontWeight:700,color:"var(--text)",display:"flex",alignItems:"center",gap:"0.4rem"}}><i className={`bi ${sec.icono}`} style={{color:"var(--pr)"}}/> {sec.titulo}</div><div style={{fontSize:"0.68rem",color:"var(--muted)",marginTop:1}}>{sec.desc}</div></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0.6rem"}}>{items.map(item=><IntTarjeta key={item.tipo} item={item} tokenData={getToken(item.tipo)} onConectar={()=>onConectar(item.tipo)} onDesconectar={()=>onDesconectar(item.tipo)} saving={saving===item.tipo}/>)}</div></div>);})}<SeccionImportar onToast={showToast}/></>)}{toast&&(<div style={{position:"fixed",bottom:"1.5rem",right:"1.5rem",background:toast.tipo==="error"?"#FEE2E2":toast.tipo==="info"?"#DBEAFE":"#DCFCE7",color:toast.tipo==="error"?"#991B1B":toast.tipo==="info"?"#1E40AF":"#166534",border:`1px solid ${toast.tipo==="error"?"#FCA5A5":toast.tipo==="info"?"#93C5FD":"#86EFAC"}`,borderRadius:10,padding:"0.7rem 1.1rem",fontSize:"0.82rem",fontWeight:600,zIndex:2000,boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}>{toast.msg}</div>)}</div>);}

function ViewAuditoria(){const [logs,setLogs]=useState([]);const [loading,setLoading]=useState(true);const [filtro,setFiltro]=useState("");useEffect(()=>{fetch("/api/auditoria").then(r=>r.json()).then(d=>{if(d.ok)setLogs(d.logs);}).catch(()=>{}).finally(()=>setLoading(false));},[]);const filtrados=filtro?logs.filter(l=>l.nombre?.toLowerCase().includes(filtro.toLowerCase())||l.email?.toLowerCase().includes(filtro.toLowerCase())):logs;return(<div className="view-anim"><div className="vh"><div><div className="vh-title">Auditoría</div><div className="vh-sub">Registro de accesos</div></div><input className="fi" placeholder="Buscar usuario…" value={filtro} onChange={e=>setFiltro(e.target.value)} style={{width:200}}/></div><div className="card" style={{padding:0,overflow:"hidden"}}>{loading?<Cargando/>:(<table className="tbl"><thead><tr><th>Usuario</th><th>Dispositivo</th><th>IP</th><th>Fecha</th></tr></thead><tbody>{filtrados.length===0?<tr><td colSpan={4} style={{textAlign:"center",padding:"2rem",color:"var(--muted)"}}>Sin registros</td></tr>:filtrados.map((l,i)=>(<tr key={i}><td><div style={{display:"flex",alignItems:"center",gap:8}}><Av letra={l.nombre?.[0]} size={26}/><div><div style={{fontWeight:600,fontSize:"0.8rem"}}>{l.nombre||"—"}</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{l.email}</div></div></div></td><td style={{fontSize:"0.78rem"}}>{l.dispositivo||"Desconocido"}</td><td style={{fontSize:"0.78rem",color:"var(--muted)",fontFamily:"monospace"}}>{l.ip||"—"}</td><td style={{fontSize:"0.75rem",color:"var(--muted)"}}>{formatFecha(l.creado_en)}</td></tr>))}</tbody></table>)}</div></div>);}

function ViewConfiguracion(){return(<div className="view-anim"><div className="vh"><div><div className="vh-title">Configuración</div><div className="vh-sub">Ajustes del sistema</div></div><button className="btn btn-em btn-sm"><i className="bi bi-floppy"/> Guardar</button></div><div className="g2"><div><div className="cfg-section"><div className="cfg-hdr"><i className="bi bi-building" style={{color:"var(--accent)"}}/><span className="cfg-title">Información de la empresa</span></div><div className="cfg-body"><div className="fg"><label className="fl">Nombre</label><input className="fi" defaultValue="Gestión 360 iA"/></div><div className="fg"><label className="fl">Dominio base</label><input className="fi" defaultValue="gestion360ia.com.ar"/></div></div></div><div className="cfg-section"><div className="cfg-hdr"><i className="bi bi-robot" style={{color:"var(--gold)"}}/><span className="cfg-title">Configuración IA</span></div><div className="cfg-body"><div className="fg"><label className="fl">Modelo principal</label><select className="fi"><option>Claude Sonnet 4</option><option>Claude Haiku</option><option>GPT-4o</option></select></div></div></div></div><div><div className="cfg-section"><div className="cfg-hdr"><i className="bi bi-shield-lock" style={{color:"var(--em)"}}/><span className="cfg-title">Seguridad</span></div><div className="cfg-body"><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.3rem 0"}}><div><div style={{fontSize:"0.8rem",fontWeight:600}}>HTTPS forzado</div></div><div className="tog on"><div className="tog-k"/></div></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.3rem 0"}}><div><div style={{fontSize:"0.8rem",fontWeight:600}}>Rate limiting</div></div><div className="tog on"><div className="tog-k"/></div></div></div></div></div></div></div>);}

function ViewSistema(){const [usuarios,setUsuarios]=useState([]);const [loading,setLoading]=useState(true);useEffect(()=>{fetch("/api/usuarios").then(r=>r.json()).then(d=>{if(d.ok)setUsuarios(d.usuarios);}).catch(()=>{}).finally(()=>setLoading(false));},[]);const aprobar=async(id)=>{try{await fetch("/api/usuarios",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status:"approved",activo:1})});setUsuarios(p=>p.map(u=>u.id===id?{...u,status:"approved",activo:1}:u));}catch(_){}};const rechazar=async(id)=>{try{await fetch("/api/usuarios",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status:"rejected",activo:0})});setUsuarios(p=>p.map(u=>u.id===id?{...u,status:"rejected",activo:0}:u));}catch(_){}};return(<div className="view-anim"><div className="vh"><div><div className="vh-title">Usuarios del sistema</div><div className="vh-sub">{usuarios.length} usuarios registrados</div></div></div><div className="card" style={{padding:0,overflow:"hidden"}}>{loading?<Cargando/>:usuarios.length===0?(<div style={{padding:"2rem",textAlign:"center",color:"var(--muted)"}}>Sin usuarios</div>):(<table className="tbl"><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th></th></tr></thead><tbody>{usuarios.map(u=>(<tr key={u.id}><td><div style={{display:"flex",alignItems:"center",gap:8}}><Av letra={u.nombre?.[0]} size={26}/><div><div style={{fontWeight:600,fontSize:"0.8rem"}}>{u.nombre||"—"}</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{u.email}</div></div></div></td><td><span className="bdg bdg-blue">{u.rol}</span></td><td><span className={`bdg ${u.status==="approved"?"bdg-em":u.status==="pending"?"bdg-amber":"bdg-red"}`}>{u.status==="approved"?"Aprobado":u.status==="pending"?"Pendiente":"Rechazado"}</span></td><td style={{fontSize:"0.72rem",color:"var(--muted)"}}>{u.ultimo_acceso?new Date(u.ultimo_acceso).toLocaleDateString("es-AR"):"Nunca"}</td><td style={{display:"flex",gap:4}}>{u.status==="pending"&&<><button className="btn btn-em btn-xs" onClick={()=>aprobar(u.id)}>Aprobar</button><button className="btn btn-red btn-xs" onClick={()=>rechazar(u.id)}>Rechazar</button></>}{u.status==="approved"&&<button className="btn btn-out btn-xs" onClick={()=>rechazar(u.id)}>Desactivar</button>}{u.status==="rejected"&&<button className="btn btn-out btn-xs" onClick={()=>aprobar(u.id)}>Reactivar</button>}</td></tr>))}</tbody></table>)}</div></div>);}

function ViewPerfil(){const{data:session}=useSession();return(<div className="view-anim" style={{maxWidth:520}}><div className="vh"><div><div className="vh-title">Mi perfil</div><div className="vh-sub">Configuración de tu cuenta</div></div></div><div className="card"><div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.2rem",paddingBottom:"1rem",borderBottom:"1px solid var(--border)"}}>{session?.user?.image?<img src={session.user.image} style={{width:52,height:52,borderRadius:"50%",objectFit:"cover"}} alt=""/>:<Av letra={session?.user?.name?.[0]} size={52}/>}<div><div style={{fontWeight:700,fontSize:"1rem"}}>{session?.user?.name||"—"}</div><div style={{fontSize:"0.75rem",color:"var(--muted)",marginTop:2}}>{session?.user?.email}</div><span className="bdg bdg-em" style={{marginTop:4,display:"inline-block"}}>Superadmin</span></div></div><div style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}><div className="fg"><label className="fl">Nombre completo</label><input className="fi" defaultValue={session?.user?.name||""}/></div><div className="fg"><label className="fl">Email</label><input className="fi" defaultValue={session?.user?.email||""} disabled style={{opacity:0.6}}/></div><div className="fg"><label className="fl">Cargo</label><input className="fi" placeholder="Ej: Director de Operaciones"/></div></div><div style={{marginTop:"1rem",paddingTop:"1rem",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end"}}><button className="btn btn-em btn-sm">Guardar cambios</button></div></div></div>);}
