"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";

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
  dashboard:     ["Dashboard",      "Resumen general del sistema"],
  clientes:      ["Clientes",       "Tenants registrados"],
  crm:           ["CRM",            "Leads, funnel y conversaciones"],
  equipo:        ["Equipo",         "Áreas y personal del equipo"],
  soporte:       ["Soporte",        "Tickets y atención a clientes"],
  modulos:       ["Módulos",        "Catálogo del sistema"],
  planes:        ["Planes",         "Gestión de suscripciones"],
  comunicaciones:["Comunicaciones", "Conversaciones con clientes"],
  seguimiento:   ["Seguimiento",    "Tareas y recordatorios"],
  alertas:       ["Alertas IA",     "Detecciones automáticas"],
  integraciones: ["Integraciones",  "Conexiones externas"],
  auditoria:     ["Auditoría",      "Registro de actividad"],
  configuracion: ["Configuración",  "Ajustes del sistema"],
  sistema:       ["Sistema",        "Usuarios, permisos y accesos"],
  perfil:        ["Mi perfil",      "Configuración de tu cuenta"],
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [view, setView]   = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [menuPos, setMenuPos] = useState({ bottom: 0, left: 0, width: 0 });
  const [theme, setTheme]             = useState("slate");
  const [showPersonalizar, setShowPersonalizar] = useState(false);
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
            {view === "dashboard"      && <ViewDashboard />}
            {view === "clientes"       && <ViewClientes />}
            {view === "crm"            && <ViewCRM session={session} />}
            {view === "equipo"         && <ViewEquipo />}
            {view === "soporte"        && <ViewSoporte session={session} />}
            {view === "modulos"        && <ViewModulos />}
            {view === "planes"         && <ViewPlanes />}
            {view === "comunicaciones" && <ViewComunicaciones />}
            {view === "seguimiento"    && <ViewSeguimiento />}
            {view === "alertas"        && <ViewAlertas />}
            {view === "integraciones"  && <ViewIntegraciones />}
            {view === "auditoria"      && <ViewAuditoria />}
            {view === "configuracion"  && <ViewConfiguracion />}
            {view === "sistema"        && <ViewSistema />}
            {view === "perfil"         && <ViewPerfil />}
          </div>
        </div>
      </div>

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

function Modal({ children, onClose }) {
  return (
    <div className="modal-over" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>{children}</div>
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
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [modal, setModal]     = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm]       = useState(FORM_CLI);
  const [error, setError]     = useState("");

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
                  <td><button className="btn btn-out btn-xs" onClick={()=>abrirEditar(t)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
