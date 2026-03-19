"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

const VIEWS = {
  dashboard:      ["Dashboard",        "Resumen general del sistema"],
  clientes:       ["Clientes",         "24 clientes registrados"],
  modulos:        ["Módulos",          "Catálogo del sistema"],
  planes:         ["Planes",           "Gestión de suscripciones"],
  comunicaciones: ["Comunicaciones",   "Conversaciones con clientes"],
  seguimiento:    ["Seguimiento",      "Tareas y recordatorios"],
  alertas:        ["Alertas IA",       "Detecciones automáticas"],
  integraciones:  ["Integraciones",    "Conexiones externas"],
  auditoria:      ["Auditoría",        "Registro de actividad"],
  configuracion:  ["Configuración",    "Ajustes del sistema"],
  sistema:        ["Sistema",          "Usuarios, permisos y accesos"],
  perfil:         ["Mi perfil",        "Configuración de tu cuenta"],
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [view, setView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const menuRef = useRef(null);

  const nav = (id) => setView(id);
  const userName = session?.user?.name || "Admin";
  const userInitial = userName[0]?.toUpperCase() || "A";

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuUsuario(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <div className="g360-wrap">
        {/* ══ SIDEBAR ══ */}
        <nav id="sb" className={collapsed ? "collapsed" : ""}>
          <div className="sb-logo">
            <div className="sb-logo-mark" onClick={() => setCollapsed(!collapsed)} title="Mostrar / ocultar menú" style={{cursor:"pointer"}}>
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
              <div className="sb-brand-sub">Panel Admin</div>
            </div>
          </div>

          <div className="sb-scroll">
            <div className="sb-sec">Principal</div>
            <NavItem id="dashboard"      icon="bi-grid-1x2"      label="Dashboard"      active={view==="dashboard"}      onClick={nav} />
            <NavItem id="clientes"       icon="bi-people"         label="Clientes"       active={view==="clientes"}       onClick={nav} badge="24" />
            <NavItem id="modulos"        icon="bi-puzzle"         label="Módulos"        active={view==="modulos"}        onClick={nav} />
            <NavItem id="planes"         icon="bi-tag"            label="Planes"         active={view==="planes"}         onClick={nav} />

            <div className="sb-divider" />
            <div className="sb-sec">Comunicaciones</div>
            <NavItem id="comunicaciones" icon="bi-chat-dots"      label="Conversaciones" active={view==="comunicaciones"} onClick={nav} badge="3" badgeClass="amber" />
            <NavItem id="seguimiento"    icon="bi-check2-square"  label="Seguimiento"    active={view==="seguimiento"}    onClick={nav} />
            <NavItem id="alertas"        icon="bi-bell"           label="Alertas IA"     active={view==="alertas"}        onClick={nav} badge="5" badgeClass="red" />

            <div className="sb-divider" />
            <div className="sb-sec">Sistema</div>
            <NavItem id="sistema"        icon="bi-shield-lock"    label="Usuarios"       active={view==="sistema"}        onClick={nav} />
            <NavItem id="integraciones"  icon="bi-plug"           label="Integraciones"  active={view==="integraciones"}  onClick={nav} />
            <NavItem id="auditoria"      icon="bi-journal-text"   label="Auditoría"      active={view==="auditoria"}      onClick={nav} />
            <NavItem id="configuracion"  icon="bi-gear"           label="Configuración"  active={view==="configuracion"}  onClick={nav} />
          </div>

          {/* ══ FOOTER USUARIO ══ */}
          <div className="sb-foot">
            <div ref={menuRef} style={{position:"relative"}}>

              {/* Fila usuario */}
              <div style={{display:"flex",alignItems:"center",gap:"0.55rem",padding:"0.44rem 0.55rem",borderRadius:"var(--r-sm)"}}>

                {/* Avatar — único trigger del dropdown */}
                <div onClick={() => setMenuUsuario(m => !m)} style={{cursor:"pointer",flexShrink:0}}>
                  {session?.user?.image ? (
                    <img src={session.user.image} alt=""
                      style={{width:30,height:30,borderRadius:"50%",objectFit:"cover",display:"block",border:"2px solid rgba(255,255,255,.25)"}}
                      referrerPolicy="no-referrer" />
                  ) : (
                    <div style={{
                      width:30,height:30,borderRadius:"50%",
                      background:"linear-gradient(135deg,var(--pr-d),var(--pr-l))",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:"0.72rem",fontWeight:700,color:"#fff",
                      border:"2px solid rgba(255,255,255,.25)",
                    }}>
                      {userInitial}
                    </div>
                  )}
                </div>

                {/* Textos */}
                <div className="sb-user-texts" style={{flex:1,minWidth:0}}>
                  <div className="sb-uname">{userName}</div>
                  <div className="sb-urole">Superadmin · Pro</div>
                </div>
              </div>

              {/* Dropdown — position:fixed para escapar del overflow:hidden del sidebar */}
              {menuUsuario && (
                <div style={{
                  position:"fixed",
                  bottom:64,
                  left: collapsed ? 60 : 238,
                  width:240,
                  background:"#fff",
                  border:"1px solid var(--border)",
                  borderRadius:"var(--r)",
                  boxShadow:"0 8px 32px rgba(30,50,80,.18)",
                  zIndex:9999,
                  overflow:"hidden",
                }}>
                  {/* Encabezado */}
                  <div style={{padding:"0.9rem 1rem",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"0.65rem",background:"var(--bg)"}}>
                    {session?.user?.image ? (
                      <img src={session.user.image} alt=""
                        style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--border)",flexShrink:0}}
                        referrerPolicy="no-referrer" />
                    ) : (
                      <div style={{width:38,height:38,borderRadius:"50%",background:"var(--pr)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.9rem",fontWeight:700,color:"#fff",flexShrink:0}}>
                        {userInitial}
                      </div>
                    )}
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:"0.82rem",fontWeight:700,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{userName}</div>
                      <div style={{fontSize:"0.67rem",color:"var(--muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{session?.user?.email}</div>
                      <div style={{marginTop:3,display:"flex",gap:4}}>
                        <span style={{background:"var(--pr-pale)",color:"var(--pr)",fontSize:"0.6rem",fontWeight:700,padding:"1px 7px",borderRadius:9}}>Superadmin</span>
                        <span style={{background:"var(--em-pale)",color:"var(--em-d)",fontSize:"0.6rem",fontWeight:700,padding:"1px 7px",borderRadius:9}}>Pro</span>
                      </div>
                    </div>
                  </div>

                  {/* Opciones */}
                  <div style={{padding:"0.3rem 0"}}>
                    <DropdownItem
                      icon="bi-person"
                      label="Mi perfil"
                      onClick={() => { setMenuUsuario(false); nav("perfil"); }}
                    />
                    <DropdownItem
                      icon="bi-eye"
                      label="Ver como cliente"
                      onClick={() => setMenuUsuario(false)}
                      muted
                    />
                  </div>

                  {/* Cerrar sesión */}
                  <div style={{borderTop:"1px solid var(--border)",padding:"0.3rem 0"}}>
                    <DropdownItem
                      icon="bi-box-arrow-right"
                      label="Cerrar sesión"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      danger
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* ══ MAIN ══ */}
        <div id="main">
          <div id="topbar">
            <div>
              <span className="tb-title">{VIEWS[view]?.[0]}</span>
              <span className="tb-sub">{VIEWS[view]?.[1]}</span>
            </div>
            <div className="tb-sp" />
            <div className="tb-search">
              <i className="bi bi-search" style={{color:"var(--muted)",fontSize:"0.78rem"}} />
              <input placeholder="Buscar clientes, módulos…" />
            </div>
            <button className="tb-btn"><i className="bi bi-bell" /><div className="dot" /></button>
            <button className="tb-btn"><i className="bi bi-question-circle" /></button>
          </div>

          <div id="content" style={{padding: view==="comunicaciones" ? "0" : "1.3rem 1.4rem"}}>
            {view === "dashboard"      && <ViewDashboard />}
            {view === "clientes"       && <ViewClientes />}
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

        /* SIDEBAR */
        #sb {
          width:230px; min-width:230px; background:var(--sb-bg); border-right:1px solid var(--sb-brd);
          display:flex; flex-direction:column; height:100vh; overflow:hidden; flex-shrink:0;
          transition:width .22s cubic-bezier(.4,0,.2,1),min-width .22s cubic-bezier(.4,0,.2,1);
          position:relative; z-index:20;
        }
        #sb.collapsed { width:52px; min-width:52px; }
        .sb-logo { padding:0 0.9rem; height:50px; border-bottom:1px solid var(--sb-brd); display:flex; align-items:center; gap:0.7rem; flex-shrink:0; overflow:hidden; }
        .sb-logo-mark { width:30px; height:30px; flex-shrink:0; background:linear-gradient(135deg,var(--pr),var(--pr-l)); border-radius:8px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(80,104,134,.3); }
        .sb-logo-texts { overflow:hidden; white-space:nowrap; transition:opacity .18s,max-width .22s; max-width:180px; }
        #sb.collapsed .sb-logo-texts { opacity:0; max-width:0; }
        #sb.collapsed .sb-logo { justify-content:center; padding:0; height:56px; width:52px; }
        .sb-brand { font-family:'Fraunces',serif; font-size:1.05rem; font-weight:600; color:#fff; letter-spacing:-0.02em; line-height:1.2; }
        .sb-brand-sub { font-size:0.58rem; font-weight:500; color:rgba(255,255,255,.5); letter-spacing:0.08em; text-transform:uppercase; }
        .sb-scroll { flex:1; overflow-y:auto; overflow-x:hidden; padding:6px 0; }
        .sb-scroll::-webkit-scrollbar { width:3px; }
        .sb-scroll::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
        .sb-sec { padding:10px 1rem 3px; font-size:0.58rem; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:rgba(255,255,255,.45); white-space:nowrap; overflow:hidden; transition:opacity .15s,padding .22s; }
        #sb.collapsed .sb-sec { opacity:0; height:0; padding:0; overflow:hidden; }
        #sb.collapsed .sb-scroll { padding:4px 0; }
        .sb-divider { height:1px; background:var(--sb-brd); margin:0.5rem 0.8rem; transition:margin .22s; }
        #sb.collapsed .sb-divider { margin:0.5rem 10px; }
        .ni { display:flex; align-items:center; gap:0.55rem; padding:0.46rem 0.7rem; margin:1px 6px; border-radius:var(--r-sm); color:#fff; cursor:pointer; font-size:0.8rem; font-weight:500; transition:background .13s; user-select:none; white-space:nowrap; overflow:hidden; position:relative; }
        .ni:hover { background:rgba(255,255,255,.12); }
        .ni.on { background:var(--sb-active); font-weight:600; }
        .ni-ic { font-size:0.95rem; flex-shrink:0; width:22px; text-align:center; transition:margin .22s; }
        #sb.collapsed .ni { width:52px; margin:2px 0; padding:0; gap:0; justify-content:center; border-radius:0; }
        #sb.collapsed .ni-ic { margin:0; width:52px; font-size:1rem; display:flex; align-items:center; justify-content:center; padding:0.46rem 0; }
        .ni-txt { flex:1; overflow:hidden; transition:opacity .15s,max-width .22s; max-width:160px; }
        #sb.collapsed .ni-txt { opacity:0; max-width:0; }
        .ni-badge { background:var(--sb-badge); color:#fff; font-size:0.57rem; font-weight:700; padding:.1rem .42rem; border-radius:9px; flex-shrink:0; transition:opacity .15s; }
        .ni-badge.amber { background:var(--gold); }
        .ni-badge.red { background:#A04040; }
        #sb.collapsed .ni-badge { opacity:0; width:0; padding:0; overflow:hidden; }
        #sb.collapsed .ni[data-tip]:hover::after { content:attr(data-tip); position:absolute; left:calc(100% + 10px); top:50%; transform:translateY(-50%); background:var(--text); color:#fff; font-size:0.71rem; font-family:'Inter',sans-serif; padding:4px 9px; border-radius:6px; white-space:nowrap; pointer-events:none; z-index:300; box-shadow:0 3px 10px rgba(0,0,0,.18); }
        .sb-foot { margin-top:auto; border-top:1px solid var(--sb-brd); padding:8px 6px; flex-shrink:0; overflow:hidden; }
        .sb-user { display:flex; align-items:center; white-space:nowrap; }
        .sb-av { width:28px; height:28px; background:linear-gradient(135deg,var(--pr-d),var(--pr)); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.68rem; font-weight:700; color:#fff; flex-shrink:0; }
        .sb-uname { font-size:0.78rem; font-weight:600; color:#fff; }
        .sb-urole { font-size:0.6rem; color:var(--muted); }
        .sb-user-texts { overflow:hidden; white-space:nowrap; transition:opacity .15s,max-width .22s; max-width:180px; flex:1; }
        #sb.collapsed .sb-user-texts { opacity:0; max-width:0; }
        #sb.collapsed .sb-foot { padding:0.75rem 0; }
        #sb.collapsed .sb-user { justify-content:center; padding:0.5rem 0; }
        #sb.collapsed .sb-user-more { opacity:0; }

        /* MAIN */
        #main { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
        #topbar { background:var(--white); border-bottom:1px solid var(--border); padding:0 1rem; height:50px; display:flex; align-items:center; gap:0.8rem; flex-shrink:0; }
        .tb-title { font-family:'Fraunces',serif; font-size:1.1rem; font-weight:600; color:var(--text); letter-spacing:-0.02em; }
        .tb-sub { font-size:0.69rem; color:var(--muted); margin-left:0.25rem; }
        .tb-sp { flex:1; }
        .tb-search { display:flex; align-items:center; gap:0.4rem; background:var(--bg); border:1px solid var(--border); border-radius:var(--r-sm); padding:0.35rem 0.7rem; width:195px; }
        .tb-search input { border:none; background:none; font-family:'Inter',sans-serif; font-size:0.78rem; color:var(--text); width:100%; outline:none; }
        .tb-search input::placeholder { color:var(--muted); }
        .tb-btn { width:32px; height:32px; border:1px solid var(--border); background:none; border-radius:var(--r-sm); color:var(--sub); cursor:pointer; font-size:0.88rem; display:flex; align-items:center; justify-content:center; transition:all .14s; position:relative; }
        .tb-btn:hover { border-color:#506886; color:#506886; background:#EDF1F6; }
        .tb-btn .dot { position:absolute; top:5px; right:5px; width:6px; height:6px; background:var(--red); border-radius:50%; border:1.5px solid #fff; }
        #content { flex:1; overflow-y:auto; }
        #content::-webkit-scrollbar { width:4px; }
        #content::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }

        /* CARDS / GRIDS */
        .card { background:var(--white); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--sh); overflow:hidden; }
        .ch { padding:0.8rem 1rem; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:0.55rem; }
        .ch-title { font-weight:700; font-size:0.84rem; color:var(--text); }
        .ch-sub { font-size:0.68rem; color:var(--muted); margin-left:0.2rem; }
        .ch-act { margin-left:auto; display:flex; gap:0.35rem; }
        .cb { padding:1rem; }
        .g2 { display:grid; grid-template-columns:1fr 1fr; gap:0.9rem; margin-bottom:0.9rem; }
        .g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.9rem; margin-bottom:0.9rem; }
        .g4 { display:grid; grid-template-columns:repeat(4,1fr); gap:0.9rem; margin-bottom:0.9rem; }
        .g32 { display:grid; grid-template-columns:2fr 1fr; gap:0.9rem; margin-bottom:0.9rem; }

        /* KPI */
        .kpi { background:var(--white); border:1px solid var(--border); border-radius:var(--r); padding:0.9rem 1rem; box-shadow:var(--sh); }
        .kpi-ico { width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:0.95rem; margin-bottom:0.6rem; }
        .kpi-val { font-family:'Inter',sans-serif; font-size:1.85rem; line-height:1; color:#2C2C2C; letter-spacing:-0.02em; font-weight:700; }
        .kpi-lbl { font-size:0.66rem; font-weight:600; color:#6B7280; text-transform:uppercase; letter-spacing:0.06em; margin-top:0.2rem; }
        .kpi-d { font-size:0.67rem; font-weight:600; margin-top:0.18rem; display:flex; align-items:center; gap:0.2rem; }
        .up { color:#506886; } .dn { color:var(--red); } .nu { color:var(--muted); }

        /* BADGES */
        .bdg { display:inline-block; padding:0.15rem 0.55rem; border-radius:20px; font-size:0.65rem; font-weight:600; }
        .bdg-em { background:var(--em-pale); color:var(--em-d); }
        .bdg-pine { background:var(--pine-bg); color:var(--pine-d); border:1px solid var(--pine-pale); }
        .bdg-gold { background:var(--gold-bg); color:#7A5800; }
        .bdg-red { background:var(--red-bg); color:var(--red); }
        .bdg-amber { background:var(--amber-bg); color:var(--amber); }
        .bdg-moon { background:var(--moon-l); color:var(--sub); }
        .bdg-blue { background:var(--blue-bg); color:var(--blue); }
        .bdg-pro { background:var(--em-pale); color:var(--em-d); border:1px solid var(--em-mid); }
        .bdg-str { background:var(--pine-bg); color:var(--pine-d); border:1px solid var(--pine-l); }
        .sdot { display:inline-flex; align-items:center; gap:5px; font-size:0.78rem; }
        .sd { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .sd-on { background:var(--pr); } .sd-off { background:var(--muted); } .sd-warn { background:var(--amber); } .sd-red { background:var(--red); }

        /* TABLE */
        .tbl { width:100%; border-collapse:collapse; }
        .tbl th { text-align:left; font-size:0.63rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); padding:0.5rem 0.85rem; border-bottom:1px solid var(--border); background:var(--bg); }
        .tbl td { padding:0.65rem 0.85rem; border-bottom:1px solid var(--border); font-size:0.8rem; color:var(--text); vertical-align:middle; }
        .tbl tr:last-child td { border-bottom:none; }
        .tbl tbody tr { cursor:pointer; transition:background .12s; }
        .tbl tbody tr:hover td { background:#F4F7FA; }

        /* BUTTONS */
        .btn { display:inline-flex; align-items:center; gap:0.3rem; padding:0.42rem 0.85rem; border-radius:var(--r-sm); font-family:'Inter',sans-serif; font-size:0.78rem; font-weight:600; cursor:pointer; border:none; transition:all .14s; }
        .btn-em { background:#506886; color:#fff; box-shadow:0 2px 8px rgba(80,104,134,.25); }
        .btn-em:hover { background:#445A73; }
        .btn-out { background:none; border:1px solid var(--border2); color:var(--text2); }
        .btn-out:hover { border-color:var(--pr); color:var(--pr); background:var(--pr-pale); }
        .btn-sm { padding:0.3rem 0.65rem; font-size:0.73rem; }
        .btn-xs { padding:0.18rem 0.5rem; font-size:0.67rem; }
        .btn-ghost { background:none; color:var(--sub); border:none; }
        .btn-ghost:hover { color:var(--pr); background:var(--pr-pale); border-radius:var(--r-sm); }

        /* ACTIVITY */
        .act-row { display:flex; align-items:flex-start; gap:0.65rem; padding:0.55rem 0; border-bottom:1px solid var(--border); }
        .act-row:last-child { border-bottom:none; }
        .act-ico { width:28px; height:28px; border-radius:7px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:0.82rem; }
        .act-txt { font-size:0.78rem; color:var(--text); line-height:1.4; }
        .act-time { font-size:0.64rem; color:var(--muted); margin-top:0.1rem; display:flex; align-items:center; gap:3px; }

        /* RISK */
        .risk-row { display:flex; align-items:center; gap:0.5rem; padding:0.45rem 0; border-bottom:1px solid var(--border); }
        .risk-row:last-child { border-bottom:none; }
        .risk-name { font-size:0.78rem; font-weight:500; color:var(--text); flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .risk-track { flex:1; height:5px; background:var(--border); border-radius:3px; overflow:hidden; }
        .risk-fill { height:100%; border-radius:3px; background:var(--pr); }

        /* AI CARD */
        .ai-card { background:linear-gradient(135deg,#2A3F55,#3D5A78); border-radius:var(--r); padding:0.9rem 1rem; color:#fff; }
        .ai-hdr { display:flex; align-items:center; gap:0.4rem; font-size:0.75rem; font-weight:700; color:rgba(255,255,255,.7); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.5rem; }
        .ai-pulse { width:7px; height:7px; border-radius:50%; background:#4AB880; box-shadow:0 0 0 2px rgba(74,184,128,.3); }
        .ai-txt { font-size:0.8rem; line-height:1.55; color:rgba(255,255,255,.9); margin-bottom:0.65rem; }
        .ai-chips { display:flex; gap:0.4rem; flex-wrap:wrap; }
        .ai-chip { display:inline-flex; align-items:center; gap:0.25rem; padding:0.22rem 0.6rem; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2); border-radius:20px; font-size:0.67rem; color:rgba(255,255,255,.85); }

        /* BAR CHART */
        .bc { display:flex; align-items:flex-end; gap:6px; height:90px; }
        .bc-c { display:flex; flex-direction:column; align-items:center; gap:3px; flex:1; height:100%; justify-content:flex-end; }
        .bc-b { width:100%; background:var(--pr-mid); border-radius:3px 3px 0 0; transition:background .2s; }
        .bc-b.on { background:var(--pr); }
        .bc-l { font-size:0.6rem; color:var(--muted); }

        /* STAT ROW */
        .st-row { display:flex; align-items:center; gap:0.5rem; padding:0.3rem 0; }
        .st-lbl { font-size:0.72rem; color:var(--text2); width:90px; flex-shrink:0; }
        .st-track { flex:1; height:6px; background:var(--border); border-radius:3px; overflow:hidden; }
        .st-fill { height:100%; border-radius:3px; background:var(--pr); }
        .st-val { font-size:0.72rem; font-weight:600; color:var(--text); width:20px; text-align:right; flex-shrink:0; }

        /* VH (View Header) */
        .vh { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.9rem; }
        .vh-title { font-family:'Fraunces',serif; font-size:1.1rem; font-weight:600; color:var(--text); }
        .vh-sub { font-size:0.72rem; color:var(--muted); margin-top:2px; }

        /* MODULE ROW */
        .mod-row { display:flex; align-items:center; gap:0.65rem; padding:0.6rem 0; border-bottom:1px solid var(--border); }
        .mod-row:last-child { border-bottom:none; }
        .mod-ico { width:28px; height:28px; border-radius:7px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:0.82rem; background:var(--bg); }
        .mod-row.enabled .mod-ico { background:var(--pr-pale); }
        .mod-name { font-size:0.8rem; font-weight:600; color:var(--text); }
        .mod-desc { font-size:0.67rem; color:var(--muted); }

        /* TOGGLE */
        .tog { width:32px; height:18px; border-radius:9px; background:var(--border2); position:relative; cursor:pointer; transition:background .18s; flex-shrink:0; }
        .tog.on { background:var(--em); }
        .tog-k { position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:#fff; transition:transform .18s; }
        .tog.on .tog-k { transform:translateX(14px); }

        /* PLAN CARD */
        .plan-card { background:var(--white); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; box-shadow:var(--sh); }
        .plan-hdr { padding:1rem 1.1rem 0.8rem; border-bottom:1px solid var(--border); }
        .plan-name { font-family:'Fraunces',serif; font-size:1.1rem; font-weight:600; }
        .plan-price { font-family:'Fraunces',serif; font-size:1.9rem; line-height:1; margin:0.5rem 0 0.2rem; letter-spacing:-0.02em; }
        .plan-price span { font-size:0.8rem; font-weight:400; color:var(--muted); font-family:'Inter',sans-serif; }
        .plan-feature { display:flex; align-items:center; gap:0.5rem; padding:0.38rem 1.1rem; font-size:0.77rem; color:var(--text2); border-bottom:1px solid var(--border); }
        .plan-feature:last-of-type { border-bottom:none; }
        .plan-feature.off { color:var(--muted); }
        .plan-foot { padding:0.8rem 1.1rem; }

        /* ALERT ROW */
        .alert-row { display:flex; align-items:flex-start; gap:0.65rem; padding:0.62rem 0.8rem; border-left:3px solid var(--border); border-radius:0 var(--r-sm) var(--r-sm) 0; background:var(--white); margin-bottom:0.4rem; }
        .alert-row.em { border-left-color:var(--em); background:var(--em-bg); }
        .alert-row.warn { border-left-color:var(--amber); background:var(--amber-bg); }
        .alert-row.red { border-left-color:var(--red); background:var(--red-bg); }
        .alert-ico { font-size:0.85rem; flex-shrink:0; margin-top:0.1rem; }
        .alert-txt { font-size:0.77rem; color:var(--text); line-height:1.4; flex:1; }

        /* NOTA */
        .nota { display:flex; align-items:flex-start; gap:0.6rem; padding:0.6rem 0; border-bottom:1px solid var(--border); }
        .nota:last-child { border-bottom:none; }
        .nota-check { width:15px; height:15px; border-radius:4px; border:1.5px solid var(--border2); flex-shrink:0; cursor:pointer; margin-top:1px; }
        .nota-txt { font-size:0.78rem; color:var(--text); flex:1; line-height:1.4; }
        .nota-meta { font-size:0.65rem; color:var(--muted); }

        /* CFG */
        .cfg-section { background:var(--white); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; margin-bottom:0.9rem; box-shadow:var(--sh); }
        .cfg-hdr { padding:0.75rem 1rem; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:0.55rem; background:var(--bg); }
        .cfg-title { font-size:0.82rem; font-weight:700; color:var(--text); }
        .cfg-body { padding:0.9rem 1rem; }
        .fg { display:flex; flex-direction:column; gap:0.3rem; margin-bottom:0.6rem; }
        .fl { font-size:0.72rem; font-weight:600; color:var(--sub); }
        .fi { padding:0.4rem 0.65rem; border:1px solid var(--border2); border-radius:var(--r-sm); font-family:'Inter',sans-serif; font-size:0.8rem; color:var(--text); background:var(--white); outline:none; }
        .fi:focus { border-color:var(--pr); }
        .fi-row { display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; }

        /* INT CARD */
        .int-card { display:flex; align-items:center; gap:0.75rem; padding:0.7rem 0.9rem; background:var(--white); border:1px solid var(--border); border-radius:var(--r-sm); margin-bottom:0.4rem; }
        .int-ico { width:32px; height:32px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:0.95rem; }
        .int-name { font-size:0.8rem; font-weight:600; color:var(--text); }
        .int-desc { font-size:0.67rem; color:var(--muted); }

        /* COMUNICACIONES */
        .comm-wrap { display:flex; height:100%; overflow:hidden; }
        .conv-list { width:268px; min-width:268px; background:var(--white); border-right:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden; }
        .conv-hdr { padding:0.8rem 0.9rem; border-bottom:1px solid var(--border); flex-shrink:0; }
        .conv-hdr-title { font-family:'Fraunces',serif; font-size:1rem; font-weight:600; color:var(--text); }
        .conv-search { display:flex; align-items:center; gap:6px; background:var(--bg); border:1px solid var(--border); border-radius:var(--r-sm); padding:0.36rem 0.65rem; margin:0.55rem 0.9rem 0.4rem; }
        .conv-search input { border:none; background:none; font-family:inherit; font-size:0.77rem; color:var(--text); width:100%; outline:none; }
        .conv-items { overflow-y:auto; flex:1; }
        .conv-item { display:flex; align-items:flex-start; gap:0.55rem; padding:0.62rem 0.9rem; cursor:pointer; border-bottom:1px solid rgba(226,232,228,.5); transition:background .12s; }
        .conv-item:hover { background:var(--pr-bg); }
        .conv-item.on { background:#EDF1F6; border-left:2.5px solid #506886; }
        .conv-av { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,var(--moon-l),var(--pine-pale)); display:flex; align-items:center; justify-content:center; font-size:0.74rem; font-weight:700; color:var(--em-d); flex-shrink:0; }
        .conv-name { font-size:0.79rem; font-weight:600; color:var(--text); }
        .conv-prev { font-size:0.68rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .conv-time { font-size:0.62rem; color:var(--muted); flex-shrink:0; }
        .chat-panel { flex:1; display:flex; flex-direction:column; background:var(--bg); overflow:hidden; }
        .chat-hdr { background:var(--white); border-bottom:1px solid var(--border); padding:0.65rem 1rem; display:flex; align-items:center; gap:0.65rem; flex-shrink:0; }
        .chat-msgs { flex:1; overflow-y:auto; padding:1rem; display:flex; flex-direction:column; gap:0.45rem; }
        .msg { max-width:70%; padding:0.5rem 0.7rem; border-radius:9px; font-size:0.79rem; line-height:1.5; }
        .msg-in { background:var(--white); border:1px solid var(--border); align-self:flex-start; border-radius:3px 9px 9px 9px; }
        .msg-out { background:#EDF1F6; border:1px solid #C2CFD9; align-self:flex-end; border-radius:9px 3px 9px 9px; }
        .msg-t { font-size:0.6rem; color:var(--muted); margin-top:0.15rem; }
        .chat-input-bar { background:var(--white); border-top:1px solid var(--border); padding:0.65rem 1rem; display:flex; align-items:center; gap:0.55rem; flex-shrink:0; }
        .chat-inp { flex:1; padding:0.46rem 0.7rem; background:var(--bg); border:1px solid var(--border); border-radius:20px; font-family:inherit; font-size:0.79rem; color:var(--text); outline:none; }

        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
        .view-anim { animation:fadeIn .18s ease; }
      `}</style>
    </>
  );
}

/* ══ COMPONENTES REUTILIZABLES ══ */

function NavItem({ id, icon, label, active, onClick, badge, badgeClass }) {
  return (
    <div className={`ni${active ? " on" : ""}`} data-tip={label} onClick={() => onClick(id)}>
      <i className={`bi ${icon} ni-ic`} />
      <span className="ni-txt">{label}</span>
      {badge && <span className={`ni-badge${badgeClass ? " " + badgeClass : ""}`}>{badge}</span>}
    </div>
  );
}

function DropdownItem({ icon, label, onClick, danger, muted }) {
  return (
    <div
      onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:"0.55rem",
        padding:"0.45rem 0.85rem", cursor:"pointer",
        fontSize:"0.8rem", fontWeight:500,
        color: danger ? "var(--red)" : muted ? "var(--muted)" : "var(--text)",
        transition:"background .12s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? "var(--red-bg)" : "var(--bg)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <i className={`bi ${icon}`} style={{fontSize:"0.88rem",width:16,textAlign:"center"}} />
      {label}
    </div>
  );
}

/* ══════════════════════════════════════
   VIEWS
══════════════════════════════════════ */

function ViewDashboard() {
  return (
    <div className="view-anim">
      <div className="g4">
        <div className="kpi">
          <div className="kpi-ico" style={{background:"var(--accent-pale)"}}><i className="bi bi-people" style={{color:"var(--accent)"}} /></div>
          <div className="kpi-val">—</div>
          <div className="kpi-lbl">Clientes activos</div>
          <div className="kpi-d nu"><i className="bi bi-dash" /> sin datos aún</div>
        </div>
        <div className="kpi">
          <div className="kpi-ico" style={{background:"var(--pine-bg)"}}><i className="bi bi-cash-coin" style={{color:"var(--pine-d)"}} /></div>
          <div className="kpi-val">—</div>
          <div className="kpi-lbl">Ingresos mensuales</div>
          <div className="kpi-d nu"><i className="bi bi-dash" /> sin datos aún</div>
        </div>
        <div className="kpi">
          <div className="kpi-ico" style={{background:"var(--moon-l)"}}><i className="bi bi-puzzle" style={{color:"var(--sub)"}} /></div>
          <div className="kpi-val">—</div>
          <div className="kpi-lbl">Módulos activos</div>
          <div className="kpi-d nu"><i className="bi bi-dash" /> sin datos aún</div>
        </div>
        <div className="kpi">
          <div className="kpi-ico" style={{background:"var(--red-bg)"}}><i className="bi bi-exclamation-triangle" style={{color:"var(--red)"}} /></div>
          <div className="kpi-val">—</div>
          <div className="kpi-lbl">Riesgo de churn</div>
          <div className="kpi-d nu"><i className="bi bi-dash" /> sin datos aún</div>
        </div>
      </div>

      <div className="g32">
        <div className="card">
          <div className="ch">
            <i className="bi bi-activity" style={{color:"var(--accent)"}} />
            <span className="ch-title">Actividad reciente</span>
            <span className="ch-sub">últimas 24 hs</span>
          </div>
          <div className="cb" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",gap:"0.5rem",color:"var(--muted)"}}>
            <i className="bi bi-inbox" style={{fontSize:"1.5rem"}} />
            <div style={{fontSize:"0.8rem"}}>Sin actividad registrada todavía</div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:"0.9rem"}}>
          <div className="card">
            <div className="ch"><i className="bi bi-graph-down-arrow" style={{color:"var(--red)"}} /><span className="ch-title">Clientes en riesgo</span></div>
            <div className="cb" style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"1rem",gap:"0.4rem",color:"var(--muted)"}}>
              <i className="bi bi-shield-check" style={{fontSize:"1.2rem",color:"var(--em)"}} />
              <div style={{fontSize:"0.75rem"}}>Sin alertas por ahora</div>
            </div>
          </div>
          <div className="ai-card">
            <div className="ai-hdr"><div className="ai-pulse" /><i className="bi bi-stars" />Asistente IA</div>
            <div className="ai-txt">El asistente comenzará a generar sugerencias a medida que se carguen clientes y datos en el sistema.</div>
            <div className="ai-chips">
              <span className="ai-chip"><i className="bi bi-arrow-repeat" /> Retención</span>
              <span className="ai-chip"><i className="bi bi-person-check" /> Reactivar</span>
              <span className="ai-chip"><i className="bi bi-graph-up-arrow" /> Proyección</span>
            </div>
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="ch"><i className="bi bi-bar-chart" style={{color:"var(--accent)"}} /><span className="ch-title">Nuevos clientes por mes</span></div>
          <div className="cb" style={{display:"flex",alignItems:"center",justifyContent:"center",height:120,color:"var(--muted)"}}>
            <div style={{textAlign:"center",fontSize:"0.78rem"}}>
              <i className="bi bi-bar-chart" style={{fontSize:"1.5rem",display:"block",marginBottom:"0.4rem"}} />
              Sin datos aún
            </div>
          </div>
        </div>
        <div className="card">
          <div className="ch"><i className="bi bi-pie-chart" style={{color:"var(--pine-d)"}} /><span className="ch-title">Distribución por rubro</span></div>
          <div className="cb" style={{display:"flex",alignItems:"center",justifyContent:"center",height:120,color:"var(--muted)"}}>
            <div style={{textAlign:"center",fontSize:"0.78rem"}}>
              <i className="bi bi-pie-chart" style={{fontSize:"1.5rem",display:"block",marginBottom:"0.4rem"}} />
              Sin datos aún
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewClientes() {
  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Clientes</div><div className="vh-sub">Listado de tenants registrados</div></div>
        <button className="btn btn-em btn-sm"><i className="bi bi-plus-lg" /> Nuevo cliente</button>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Módulos</th><th>Creado</th><th></th></tr></thead>
          <tbody>
            <tr><td colSpan={7} style={{textAlign:"center",padding:"2rem",color:"var(--muted)"}}>
              <i className="bi bi-people" style={{fontSize:"1.5rem",display:"block",marginBottom:"0.5rem"}} />
              No hay clientes registrados todavía
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ViewModulos() {
  const modulos = [
    {icon:"bi-grid-1x2",name:"Dashboard IA",desc:"Estadísticas e inteligencia analítica"},
    {icon:"bi-people",name:"CRM / Clientes",desc:"Gestión de clientes y leads"},
    {icon:"bi-whatsapp",name:"WhatsApp Bot",desc:"Bot con IA y memoria de contexto"},
    {icon:"bi-calendar-check",name:"Agenda / Turnos",desc:"Turnos inteligentes con predicción"},
    {icon:"bi-receipt",name:"Facturación",desc:"Facturas y presupuestos con IA"},
    {icon:"bi-bell",name:"Notificaciones",desc:"Comunicaciones automatizadas"},
    {icon:"bi-bar-chart-line",name:"Estadísticas",desc:"Análisis en lenguaje natural"},
    {icon:"bi-geo-alt",name:"Mapas",desc:"Geolocalización y seguimiento"},
    {icon:"bi-building",name:"Reservas / Hotel",desc:"Gestión de habitaciones y reservas"},
    {icon:"bi-heart-pulse",name:"Historia Clínica",desc:"Pacientes y turnos médicos"},
    {icon:"bi-house",name:"Propiedades",desc:"Gestión inmobiliaria con mapa"},
    {icon:"bi-truck",name:"Distribución",desc:"Rutas y logística inteligente"},
  ];
  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Módulos</div><div className="vh-sub">Catálogo del sistema</div></div>
      </div>
      <div className="g3">
        {modulos.map((m,i) => (
          <div key={i} className="card">
            <div className="cb" style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
              <div className="mod-ico" style={{background:"var(--pr-pale)"}}><i className={`bi ${m.icon}`} style={{color:"var(--pr)"}} /></div>
              <div style={{flex:1}}>
                <div className="mod-name">{m.name}</div>
                <div className="mod-desc">{m.desc}</div>
              </div>
              <div className="tog" onClick={e => e.currentTarget.classList.toggle("on")}><div className="tog-k" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewPlanes() {
  const planes = [
    {name:"Starter",price:"Gratis",color:"var(--sub)",features:["Módulos básicos limitados","1 usuario","Sin WhatsApp","1 sugerencia IA/día"],off:[2,3]},
    {name:"Pro",price:"$XX.000",color:"var(--em)",features:["Módulos completos","5 usuarios","WhatsApp activo","Skills IA Nivel 2"],off:[]},
    {name:"Plan IA",price:"$XX.000",color:"var(--accent)",features:["Todo Pro incluido","Skills IA completas","Asistente IA avanzado","Sugerencias reactivas"],off:[]},
    {name:"Enterprise",price:"A consultar",color:"var(--pr)",features:["Multi-cuenta","White label","Módulos custom","Consultoría incluida"],off:[]},
  ];
  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Planes</div><div className="vh-sub">Gestión de suscripciones</div></div>
        <button className="btn btn-em btn-sm"><i className="bi bi-plus-lg" /> Nuevo plan</button>
      </div>
      <div className="g4">
        {planes.map((p,i) => (
          <div key={i} className="plan-card">
            <div className="plan-hdr">
              <div className="plan-name" style={{color:p.color}}>{p.name}</div>
              <div className="plan-price">{p.price}<span>/mes</span></div>
            </div>
            {p.features.map((f,j) => (
              <div key={j} className={`plan-feature${p.off.includes(j) ? " off" : ""}`}>
                <i className={`bi ${p.off.includes(j) ? "bi-x text-muted" : "bi-check2"}`} style={{color: p.off.includes(j) ? "var(--border2)" : p.color}} />
                {f}
              </div>
            ))}
            <div className="plan-foot">
              <button className="btn btn-em btn-sm" style={{width:"100%",background:p.color}}>Gestionar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewComunicaciones() {
  return (
    <div className="comm-wrap view-anim">
      <div className="conv-list">
        <div className="conv-hdr"><div className="conv-hdr-title">Conversaciones</div></div>
        <div className="conv-search"><i className="bi bi-search" style={{color:"var(--muted)",fontSize:"0.75rem"}} /><input placeholder="Buscar…" /></div>
        <div className="conv-items">
          {[["HA","Hotel Alvear","¿Cuándo se activa el módulo?","10:24"],["SV","Salón Versailles","Necesito ajustar el bot","09:15"],["DR","Dra. López","Consulta sobre facturación","ayer"]].map(([av,name,prev,time],i) => (
            <div key={i} className={`conv-item${i===0?" on":""}`}>
              <div className="conv-av">{av}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div className="conv-name">{name}</div>
                  <div className="conv-time">{time}</div>
                </div>
                <div className="conv-prev">{prev}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="chat-panel">
        <div className="chat-hdr">
          <div className="conv-av">HA</div>
          <div><div style={{fontWeight:600,fontSize:"0.82rem"}}>Hotel Alvear</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>hotel · Plan Pro</div></div>
        </div>
        <div className="chat-msgs">
          <div className="msg msg-in">Hola, quería saber cuándo se activa el módulo de reservas.<div className="msg-t">10:22</div></div>
          <div className="msg msg-out">¡Hola! El módulo ya está habilitado. Podés acceder desde tu portal en la sección Reservas.<div className="msg-t">10:24</div></div>
        </div>
        <div className="chat-input-bar">
          <input className="chat-inp" placeholder="Escribir mensaje…" />
          <button className="btn btn-em btn-sm"><i className="bi bi-send" /></button>
        </div>
      </div>
    </div>
  );
}

function ViewSeguimiento() {
  const tareas = [
    {txt:"Contactar a Inmobiliaria Palermo — sin actividad 12 días",meta:"Vence hoy · Alta prioridad"},
    {txt:"Revisar configuración WhatsApp — Salón Versailles",meta:"Vence mañana"},
    {txt:"Enviar propuesta Plan IA a Gestor Seguros BA",meta:"Esta semana"},
    {txt:"Onboarding Spa Zen Recoleta — cliente nuevo",meta:"Esta semana"},
  ];
  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Seguimiento</div><div className="vh-sub">Tareas y recordatorios</div></div>
        <button className="btn btn-em btn-sm"><i className="bi bi-plus-lg" /> Nueva tarea</button>
      </div>
      <div className="card"><div className="cb">
        {tareas.map((t,i) => (
          <div key={i} className="nota">
            <div className="nota-check" onClick={e => e.currentTarget.classList.toggle("done")} />
            <div style={{flex:1}}>
              <div className="nota-txt">{t.txt}</div>
              <div className="nota-meta">{t.meta}</div>
            </div>
          </div>
        ))}
      </div></div>
    </div>
  );
}

function ViewAlertas() {
  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Alertas IA</div><div className="vh-sub">Detecciones automáticas</div></div>
      </div>
      <div className="alert-row red"><i className="bi bi-exclamation-circle alert-ico" style={{color:"var(--red)"}} /><div className="alert-txt"><strong>Inmobiliaria Palermo</strong> — Sin actividad hace 12 días. Riesgo de churn alto.</div><button className="btn btn-xs btn-out" style={{marginLeft:"auto",flexShrink:0}}>Acción</button></div>
      <div className="alert-row warn"><i className="bi bi-exclamation-triangle alert-ico" style={{color:"var(--amber)"}} /><div className="alert-txt"><strong>Gestor Seguros BA</strong> — Baja frecuencia de uso. Considerar reactivación.</div><button className="btn btn-xs btn-out" style={{marginLeft:"auto",flexShrink:0}}>Acción</button></div>
      <div className="alert-row warn"><i className="bi bi-exclamation-triangle alert-ico" style={{color:"var(--amber)"}} /><div className="alert-txt"><strong>Estudio Contable Sur</strong> — Solo usa 2 de 8 módulos habilitados.</div><button className="btn btn-xs btn-out" style={{marginLeft:"auto",flexShrink:0}}>Acción</button></div>
      <div className="alert-row em"><i className="bi bi-check-circle alert-ico" style={{color:"var(--em)"}} /><div className="alert-txt"><strong>Hotel Alvear</strong> — Activó módulo Reservas. Engagement en aumento.</div></div>
    </div>
  );
}

function ViewIntegraciones() {
  const ints = [
    {ico:"bi-whatsapp",bg:"#E8F7EE",color:"#1A7A3A",name:"Evolution API",desc:"WhatsApp Bot",status:"Conectado"},
    {ico:"bi-robot",bg:"var(--accent-pale)",color:"var(--accent)",name:"Claude API",desc:"IA principal",status:"Conectado"},
    {ico:"bi-diagram-3",bg:"var(--blue-bg)",color:"var(--blue)",name:"n8n",desc:"Automatizaciones",status:"Conectado"},
    {ico:"bi-credit-card",bg:"var(--em-pale)",color:"var(--em-d)",name:"MercadoPago",desc:"Pagos ARS",status:"Pendiente"},
    {ico:"bi-geo-alt",bg:"var(--pine-bg)",color:"var(--pine-d)",name:"Google Maps",desc:"Mapas y rutas",status:"Pendiente"},
  ];
  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Integraciones</div><div className="vh-sub">Conexiones externas</div></div>
      </div>
      {ints.map((it,i) => (
        <div key={i} className="int-card">
          <div className="int-ico" style={{background:it.bg}}><i className={`bi ${it.ico}`} style={{color:it.color}} /></div>
          <div style={{flex:1}}>
            <div className="int-name">{it.name}</div>
            <div className="int-desc">{it.desc}</div>
          </div>
          <span className={`bdg ${it.status==="Conectado"?"bdg-em":"bdg-moon"}`}>{it.status}</span>
          <button className="btn btn-out btn-sm">{it.status==="Conectado"?"Configurar":"Conectar"}</button>
        </div>
      ))}
    </div>
  );
}

function ViewAuditoria() {
  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Auditoría</div><div className="vh-sub">Registro de actividad del sistema</div></div>
        <button className="btn btn-out btn-sm"><i className="bi bi-download" /> Exportar log</button>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Timestamp</th><th>Usuario</th><th>Acción</th><th>IP</th><th>Estado</th></tr></thead>
          <tbody>
            <tr><td colSpan={5} style={{textAlign:"center",padding:"2rem",color:"var(--muted)"}}>
              <i className="bi bi-journal-text" style={{fontSize:"1.5rem",display:"block",marginBottom:"0.5rem"}} />
              Sin registros de auditoría todavía
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ViewConfiguracion() {
  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Configuración</div><div className="vh-sub">Ajustes del sistema</div></div>
        <button className="btn btn-em btn-sm"><i className="bi bi-floppy" /> Guardar cambios</button>
      </div>
      <div className="g2">
        <div>
          <div className="cfg-section">
            <div className="cfg-hdr"><i className="bi bi-building" style={{color:"var(--accent)"}} /><span className="cfg-title">Información de la empresa</span></div>
            <div className="cfg-body">
              <div className="fg"><label className="fl">Nombre</label><input className="fi" defaultValue="Gestión 360 iA" /></div>
              <div className="fg"><label className="fl">Dominio base</label><input className="fi" defaultValue="gestion360ia.com.ar" /></div>
              <div className="fi-row">
                <div className="fg"><label className="fl">Email soporte</label><input className="fi" defaultValue="soporte@gestion360ia.com.ar" /></div>
                <div className="fg"><label className="fl">WhatsApp soporte</label><input className="fi" defaultValue="+54 11 5555-0000" /></div>
              </div>
            </div>
          </div>
          <div className="cfg-section">
            <div className="cfg-hdr"><i className="bi bi-robot" style={{color:"var(--gold)"}} /><span className="cfg-title">Configuración IA</span></div>
            <div className="cfg-body">
              <div className="fg"><label className="fl">Modelo principal</label>
                <select className="fi"><option>claude-sonnet-4-6 (Anthropic)</option><option>gpt-4o (OpenAI)</option></select>
              </div>
              <div className="fg"><label className="fl">Límite tokens/día</label><input className="fi" defaultValue="5.000.000" /></div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:"0.5rem",borderTop:"1px solid var(--border)"}}>
                <div><div style={{fontSize:"0.8rem",fontWeight:600}}>Asistente IA por cliente</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>Chatbot en portales</div></div>
                <div className="tog on" onClick={e => e.currentTarget.classList.toggle("on")}><div className="tog-k" /></div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="cfg-section">
            <div className="cfg-hdr"><i className="bi bi-shield-check" style={{color:"var(--accent)"}} /><span className="cfg-title">Seguridad</span></div>
            <div className="cfg-body">
              {[["JWT + Refresh tokens","Autenticación segura",true],["HTTPS forzado","Redirigir HTTP → HTTPS",true],["Rate limiting","100 req/min por IP",true],["Log de auditoría","Registrar todas las acciones",true]].map(([t,s,on],i) => (
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.45rem 0",borderBottom:"1px solid var(--border)"}}>
                  <div><div style={{fontSize:"0.8rem",fontWeight:600}}>{t}</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{s}</div></div>
                  <div className={`tog${on?" on":""}`} onClick={e => e.currentTarget.classList.toggle("on")}><div className="tog-k" /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewSistema() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [tab, setTab] = useState("todos");

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usuarios");
      const data = await res.json();
      if (data.ok) setUsuarios(data.usuarios);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const actualizar = async (id, cambios, email, nombre) => {
    setSaving(id);
    try {
      if (cambios.status === "approved") {
        await fetch("/api/usuarios/aprobar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, email, nombre }),
        });
      } else if (cambios.status === "rejected") {
        await fetch("/api/usuarios/rechazar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, email, nombre }),
        });
      } else {
        await fetch("/api/usuarios", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...cambios }),
        });
      }
      await cargar();
    } catch (_) {}
    setSaving(null);
  };

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar a ${nombre || "este usuario"}?`)) return;
    setSaving(id);
    try {
      await fetch("/api/usuarios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await cargar();
    } catch (_) {}
    setSaving(null);
  };

  const STATUS_BADGE = {
    approved: { cls: "bdg-em",    label: "Aprobado" },
    pending:  { cls: "bdg-amber", label: "Pendiente" },
    rejected: { cls: "bdg-red",   label: "Rechazado" },
  };

  const pendientes = usuarios.filter(u => u.status === "pending");
  const lista = tab === "pendientes" ? pendientes : usuarios;

  return (
    <div className="view-anim">
      <div className="vh">
        <div>
          <div className="vh-title">Usuarios y Permisos</div>
          <div className="vh-sub">{usuarios.length} usuarios · {pendientes.length} pendientes de aprobación</div>
        </div>
        <button className="btn btn-out btn-sm" onClick={cargar}>
          <i className="bi bi-arrow-clockwise" /> Actualizar
        </button>
      </div>

      <div style={{display:"flex",gap:4,marginBottom:"0.9rem",borderBottom:"1px solid var(--border)"}}>
        {[["todos","Todos","bi-people"],["pendientes","Pendientes","bi-hourglass-split"]].map(([id,label,icon]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:"0.45rem 0.9rem", border:"none", background:"none",
            fontFamily:"inherit", fontSize:"0.8rem",
            fontWeight: tab===id ? 700 : 500,
            color: tab===id ? "var(--pr)" : "var(--sub)",
            cursor:"pointer",
            borderBottom: tab===id ? "2px solid var(--pr)" : "2px solid transparent",
            display:"flex", alignItems:"center", gap:5, marginBottom:-1,
          }}>
            <i className={`bi ${icon}`} />{label}
            {id==="pendientes" && pendientes.length > 0 && (
              <span style={{background:"var(--red)",color:"#fff",fontSize:"0.57rem",fontWeight:700,padding:"0.1rem 0.4rem",borderRadius:9,marginLeft:2}}>{pendientes.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{padding:"2.5rem",textAlign:"center",color:"var(--muted)"}}>
            <i className="bi bi-hourglass-split" style={{fontSize:"1.4rem",display:"block",marginBottom:8}} />
            Cargando usuarios...
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Usuario</th><th>Rol</th><th>Estado</th><th>Activo</th>
                <th>Último acceso</th><th>Registrado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:"center",padding:"2rem",color:"var(--muted)"}}>
                  {tab === "pendientes" ? "No hay solicitudes pendientes" : "No hay usuarios registrados"}
                </td></tr>
              ) : lista.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:"var(--pr-pale)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:700,color:"var(--pr)",flexShrink:0}}>
                        {u.nombre?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <div style={{fontWeight:600,fontSize:"0.8rem"}}>{u.nombre || "—"}</div>
                        <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select value={u.rol} disabled={saving === u.id}
                      onChange={e => actualizar(u.id, { rol: e.target.value }, u.email, u.nombre)}
                      style={{padding:"0.25rem 0.5rem",borderRadius:"var(--r-sm)",border:"1px solid var(--border2)",fontSize:"0.75rem",fontFamily:"inherit",background:"var(--white)",cursor:"pointer"}}>
                      <option value="superadmin">Superadmin</option>
                      <option value="admin">Admin</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td><span className={`bdg ${STATUS_BADGE[u.status]?.cls ?? "bdg-moon"}`}>{STATUS_BADGE[u.status]?.label ?? u.status}</span></td>
                  <td>
                    <div className={`tog${u.activo ? " on" : ""}`}
                      onClick={() => saving !== u.id && actualizar(u.id, { activo: u.activo ? 0 : 1 }, u.email, u.nombre)}
                      style={{cursor: saving===u.id ? "not-allowed" : "pointer"}}>
                      <div className="tog-k" />
                    </div>
                  </td>
                  <td style={{fontSize:"0.72rem",color:"var(--muted)"}}>
                    {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString("es-AR") : "Nunca"}
                  </td>
                  <td style={{fontSize:"0.72rem",color:"var(--muted)"}}>
                    {new Date(u.creado_en).toLocaleDateString("es-AR")}
                  </td>
                  <td>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {u.status === "pending" && (
                        <>
                          <button className="btn btn-em btn-xs" disabled={saving===u.id}
                            onClick={() => actualizar(u.id, {status:"approved"}, u.email, u.nombre)}>
                            <i className="bi bi-check-lg" /> Aprobar
                          </button>
                          <button className="btn btn-xs btn-out" disabled={saving===u.id}
                            onClick={() => actualizar(u.id, {status:"rejected",activo:0}, u.email, u.nombre)}>
                            <i className="bi bi-x-lg" /> Rechazar
                          </button>
                        </>
                      )}
                      {u.status === "approved" && (
                        <button className="btn btn-xs btn-out" disabled={saving===u.id}
                          onClick={() => actualizar(u.id, {status:"rejected",activo:0}, u.email, u.nombre)}>
                          <i className="bi bi-slash-circle" /> Revocar
                        </button>
                      )}
                      {u.status === "rejected" && (
                        <button className="btn btn-xs btn-out" disabled={saving===u.id}
                          onClick={() => actualizar(u.id, {status:"approved",activo:1}, u.email, u.nombre)}>
                          <i className="bi bi-arrow-counterclockwise" /> Restaurar
                        </button>
                      )}
                      <button className="btn btn-xs" disabled={saving===u.id}
                        onClick={() => eliminar(u.id, u.nombre)}
                        style={{background:"var(--red-bg)",color:"var(--red)",border:"1px solid #f5c6c6"}}>
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ViewPerfil() {
  const { data: session } = useSession();
  const [sesiones, setSesiones] = useState([]);
  const [loadingSesiones, setLoadingSesiones] = useState(true);

  useEffect(() => {
    fetch("/api/perfil/sesiones")
      .then(r => r.json())
      .then(d => { if (d.ok) setSesiones(d.sesiones); })
      .catch(() => {})
      .finally(() => setLoadingSesiones(false));
  }, []);

  const formatFecha = (f) => {
    const d = new Date(f);
    return d.toLocaleDateString("es-AR", { day:"2-digit", month:"short", year:"numeric" })
      + " · " + d.toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" });
  };

  return (
    <div className="view-anim" style={{maxWidth:680}}>
      <div className="vh">
        <div><div className="vh-title">Mi perfil</div><div className="vh-sub">Información de tu cuenta</div></div>
      </div>

      {/* Cuenta */}
      <div className="cfg-section">
        <div className="cfg-hdr"><i className="bi bi-person-circle" style={{color:"var(--pr)"}} /><span className="cfg-title">Cuenta</span></div>
        <div className="cfg-body">
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            {session?.user?.image ? (
              <img src={session.user.image} alt="" style={{width:56,height:56,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--border)"}} referrerPolicy="no-referrer" />
            ) : (
              <div style={{width:56,height:56,borderRadius:"50%",background:"var(--pr)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",fontWeight:700,color:"#fff"}}>
                {session?.user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div style={{fontSize:"1rem",fontWeight:700,color:"var(--text)"}}>{session?.user?.name}</div>
              <div style={{fontSize:"0.78rem",color:"var(--muted)",marginTop:2}}>{session?.user?.email}</div>
              <div style={{marginTop:6,display:"flex",alignItems:"center",gap:5}}>
                <svg width="14" height="14" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.292C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                <span style={{fontSize:"0.7rem",color:"var(--muted)"}}>Cuenta Google · Solo lectura</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sesiones activas */}
      <div className="cfg-section">
        <div className="cfg-hdr"><i className="bi bi-shield-lock" style={{color:"var(--pr)"}} /><span className="cfg-title">Sesiones activas</span></div>
        <div style={{padding:0}}>
          {loadingSesiones ? (
            <div style={{padding:"1.5rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Cargando...</div>
          ) : sesiones.length === 0 ? (
            <div style={{padding:"1.5rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Sin registros todavía</div>
          ) : sesiones.slice(0,3).map((s,i) => (
            <div key={s.id} style={{
              display:"flex",alignItems:"center",gap:"0.75rem",
              padding:"0.7rem 1rem",
              borderBottom: i < Math.min(sesiones.length,3)-1 ? "1px solid var(--border)" : "none"
            }}>
              <div style={{width:32,height:32,borderRadius:8,background: i===0 ? "var(--em-pale)" : "var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <i className={`bi ${s.dispositivo?.includes("Android")||s.dispositivo?.includes("iOS") ? "bi-phone" : "bi-laptop"}`}
                  style={{fontSize:"0.88rem",color: i===0 ? "var(--em-d)" : "var(--sub)"}} />
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:"0.8rem",fontWeight:600,color:"var(--text)",display:"flex",alignItems:"center",gap:6}}>
                  {s.dispositivo || "Dispositivo desconocido"}
                  {i===0 && <span style={{background:"var(--em-pale)",color:"var(--em-d)",fontSize:"0.6rem",fontWeight:700,padding:"1px 7px",borderRadius:9}}>Actual</span>}
                </div>
                <div style={{fontSize:"0.67rem",color:"var(--muted)",marginTop:1}}>
                  {s.ip ? `IP: ${s.ip} · ` : ""}{formatFecha(s.creado_en)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de accesos */}
      <div className="cfg-section">
        <div className="cfg-hdr"><i className="bi bi-clock-history" style={{color:"var(--pr)"}} /><span className="cfg-title">Historial de accesos</span></div>
        <div style={{padding:0}}>
          {loadingSesiones ? (
            <div style={{padding:"1.5rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Cargando...</div>
          ) : sesiones.length === 0 ? (
            <div style={{padding:"1.5rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Sin historial todavía</div>
          ) : sesiones.map((s,i) => (
            <div key={s.id} style={{
              display:"flex",alignItems:"center",gap:"0.75rem",
              padding:"0.55rem 1rem",
              borderBottom: i < sesiones.length-1 ? "1px solid var(--border)" : "none"
            }}>
              <i className="bi bi-circle-fill" style={{fontSize:"0.4rem",color:"var(--muted)",flexShrink:0}} />
              <div style={{flex:1,fontSize:"0.77rem",color:"var(--text2)"}}>
                {s.dispositivo || "Dispositivo desconocido"}
                {s.ip && <span style={{color:"var(--muted)"}}> · {s.ip}</span>}
              </div>
              <div style={{fontSize:"0.67rem",color:"var(--muted)",flexShrink:0}}>{formatFecha(s.creado_en)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Soporte */}
      <div className="cfg-section">
        <div className="cfg-hdr"><i className="bi bi-headset" style={{color:"var(--pr)"}} /><span className="cfg-title">Soporte</span></div>
        <div style={{padding:0}}>
          <a href="mailto:soporte@gestion360ia.com.ar" style={{textDecoration:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.7rem 1rem",cursor:"pointer",borderBottom:"1px solid var(--border)",transition:"background .12s"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--bg)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <i className="bi bi-envelope" style={{color:"var(--pr)",fontSize:"0.88rem",width:16,textAlign:"center"}} />
              <div style={{flex:1}}>
                <div style={{fontSize:"0.8rem",fontWeight:600,color:"var(--text)"}}>Contactar soporte</div>
                <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>soporte@gestion360ia.com.ar</div>
              </div>
              <i className="bi bi-chevron-right" style={{color:"var(--muted)",fontSize:"0.7rem"}} />
            </div>
          </a>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.7rem 1rem",cursor:"pointer",transition:"background .12s"}}
            onMouseEnter={e=>e.currentTarget.style.background="var(--bg)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <i className="bi bi-whatsapp" style={{color:"#25D366",fontSize:"0.88rem",width:16,textAlign:"center"}} />
            <div style={{flex:1}}>
              <div style={{fontSize:"0.8rem",fontWeight:600,color:"var(--text)"}}>WhatsApp soporte</div>
              <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>Respuesta en horario comercial</div>
            </div>
            <i className="bi bi-chevron-right" style={{color:"var(--muted)",fontSize:"0.7rem"}} />
          </div>
        </div>
      </div>

      {/* Información */}
      <div className="cfg-section">
        <div className="cfg-hdr"><i className="bi bi-info-circle" style={{color:"var(--pr)"}} /><span className="cfg-title">Información</span></div>
        <div style={{padding:0}}>
          {[
            {icon:"bi-book",label:"Documentación",url:"https://gestion360ia.com.ar/docs"},
            {icon:"bi-shield-check",label:"Política de privacidad",url:"https://gestion360ia.com.ar/privacidad"},
            {icon:"bi-file-text",label:"Términos de uso",url:"https://gestion360ia.com.ar/terminos"},
          ].map((item,i,arr) => (
            <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.7rem 1rem",cursor:"pointer",borderBottom: i<arr.length-1 ? "1px solid var(--border)" : "none",transition:"background .12s"}}
                onMouseEnter={e=>e.currentTarget.style.background="var(--bg)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <i className={`bi ${item.icon}`} style={{color:"var(--pr)",fontSize:"0.88rem",width:16,textAlign:"center"}} />
                <div style={{flex:1,fontSize:"0.8rem",fontWeight:600,color:"var(--text)"}}>{item.label}</div>
                <i className="bi bi-box-arrow-up-right" style={{color:"var(--muted)",fontSize:"0.7rem"}} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Cerrar sesión */}
      <div className="cfg-section">
        <div className="cfg-body">
          <button
            className="btn"
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{width:"100%",justifyContent:"center",background:"var(--red-bg)",color:"var(--red)",border:"1px solid #f5c6c6",fontWeight:600}}>
            <i className="bi bi-box-arrow-right" /> Cerrar sesión
          </button>
        </div>
      </div>

    </div>
  );
}
