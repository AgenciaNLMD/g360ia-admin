"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

const VIEWS = {
  dashboard:      ["Dashboard",        "Resumen general del sistema"],
  clientes:       ["Clientes",         "Tenants registrados"],
  ventas:         ["Ventas",           "Pipeline comercial"],
  conversaciones: ["Conversaciones",   "Mensajes entrantes y seguimiento"],
  equipo:         ["Equipo",           "Áreas y personal del equipo"],
  soporte:        ["Soporte",          "Tickets y atención a clientes"],
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
  const [stats, setStats] = useState({
    clientes_activos: null,
    trials_vencidos: null,
    conv_sin_asignar: null,
    tickets_urgentes: null,
    usuarios_pendientes: null,
  });
  const menuRef = useRef(null);

  const nav = (id) => setView(id);
  const userName = session?.user?.name || "Admin";
  const userInitial = userName[0]?.toUpperCase() || "A";
  const rol = session?.user?.rol || "superadmin";
  const esVendedor = rol === "vendedor";

  useEffect(() => {
    fetch("/api/stats/sidebar")
      .then(r => r.json())
      .then(d => {
        setStats({
          clientes_activos: d.clientes_activos ?? null,
          trials_vencidos: d.trials_vencidos ?? null,
          conv_sin_asignar: d.conv_sin_asignar ?? null,
          tickets_urgentes: d.tickets_urgentes ?? null,
          usuarios_pendientes: d.usuarios_pendientes ?? null,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuUsuario(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const noSidebar = ["comunicaciones"].includes(view);

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

            {/* PRINCIPAL */}
            <div className="sb-sec">Principal</div>
            <NavItem id="dashboard" icon="bi-grid-1x2" label="Dashboard" active={view==="dashboard"} onClick={nav} />
            {!esVendedor && (
              <NavItem id="clientes" icon="bi-people" label="Clientes" active={view==="clientes"} onClick={nav}
                badge={stats.clientes_activos > 0 ? String(stats.clientes_activos) : null} />
            )}

            {/* VENTAS */}
            <div className="sb-divider" />
            <div className="sb-sec">Ventas</div>
            <NavItem id="conversaciones" icon="bi-chat-dots" label="Conversaciones" active={view==="conversaciones"} onClick={nav}
              badge={stats.conv_sin_asignar > 0 ? String(stats.conv_sin_asignar) : null} badgeClass="amber" />

            {/* EQUIPO */}
            {!esVendedor && (
              <>
                <div className="sb-divider" />
                <div className="sb-sec">Equipo</div>
                <NavItem id="equipo" icon="bi-people-fill" label="Áreas y personal" active={view==="equipo"} onClick={nav} />
              </>
            )}

            {/* SISTEMA */}
            {!esVendedor && (
              <>
                <div className="sb-divider" />
                <div className="sb-sec">Sistema</div>
                <NavItem id="sistema"   icon="bi-shield-lock"  label="Usuarios"  active={view==="sistema"}   onClick={nav}
                  badge={stats.usuarios_pendientes > 0 ? String(stats.usuarios_pendientes) : null} badgeClass="red" />
                <NavItem id="auditoria" icon="bi-journal-text" label="Auditoría" active={view==="auditoria"} onClick={nav} />
              </>
            )}

            {/* COMING SOON */}
            {!esVendedor && (
              <>
                <div className="sb-divider" />
                <div className="sb-sec" style={{opacity:.4}}>Próximamente</div>
                <NavItem id="ventas"        icon="bi-graph-up-arrow" label="Pipeline / Leads" active={view==="ventas"}        onClick={nav} incoming />
                <NavItem id="soporte"       icon="bi-headset"        label="Tickets"          active={view==="soporte"}       onClick={nav} incoming />
                <NavItem id="comunicaciones" icon="bi-envelope"      label="Mensajes"         active={view==="comunicaciones"} onClick={nav} incoming />
                <NavItem id="alertas"       icon="bi-bell"           label="Alertas IA"       active={view==="alertas"}       onClick={nav} incoming />
                <NavItem id="integraciones" icon="bi-plug"           label="Integraciones"    active={view==="integraciones"} onClick={nav} incoming />
                <NavItem id="seguimiento"   icon="bi-check2-square"  label="Seguimiento"      active={view==="seguimiento"}   onClick={nav} incoming />
                <NavItem id="modulos"       icon="bi-puzzle"         label="Módulos"          active={view==="modulos"}       onClick={nav} incoming />
                <NavItem id="planes"        icon="bi-tag"            label="Planes"           active={view==="planes"}        onClick={nav} incoming />
                <NavItem id="configuracion" icon="bi-gear"           label="Configuración"    active={view==="configuracion"} onClick={nav} incoming />
              </>
            )}
          </div>

          {/* FOOTER USUARIO */}
          <div className="sb-foot">
            <div ref={menuRef} style={{position:"relative"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.55rem",padding:"0.44rem 0.55rem",borderRadius:"var(--r-sm)"}}>
                <div onClick={() => setMenuUsuario(m => !m)} style={{cursor:"pointer",flexShrink:0}}>
                  {session?.user?.image ? (
                    <img src={session.user.image} alt=""
                      style={{width:30,height:30,borderRadius:"50%",objectFit:"cover",display:"block",border:"2px solid rgba(255,255,255,.25)"}}
                      referrerPolicy="no-referrer" />
                  ) : (
                    <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,var(--pr-d),var(--pr-l))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem",fontWeight:700,color:"#fff",border:"2px solid rgba(255,255,255,.25)"}}>
                      {userInitial}
                    </div>
                  )}
                </div>
                <div className="sb-user-texts" style={{flex:1,minWidth:0}}>
                  <div className="sb-uname">{userName}</div>
                  <div className="sb-urole">{rol === "superadmin" ? "Superadmin · Pro" : rol === "vendedor" ? "Vendedor" : "Admin"}</div>
                </div>
              </div>

              {menuUsuario && (
                <div style={{position:"fixed",bottom:64,left: collapsed ? 60 : 238,width:240,background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--r)",boxShadow:"0 8px 32px rgba(30,50,80,.18)",zIndex:9999,overflow:"hidden"}}>
                  <div style={{padding:"0.9rem 1rem",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"0.65rem",background:"var(--bg)"}}>
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="" style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--border)",flexShrink:0}} referrerPolicy="no-referrer" />
                    ) : (
                      <div style={{width:38,height:38,borderRadius:"50%",background:"var(--pr)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.9rem",fontWeight:700,color:"#fff",flexShrink:0}}>{userInitial}</div>
                    )}
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:"0.82rem",fontWeight:700,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{userName}</div>
                      <div style={{fontSize:"0.67rem",color:"var(--muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{session?.user?.email}</div>
                      <div style={{marginTop:3,display:"flex",gap:4}}>
                        <span style={{background:"var(--pr-pale)",color:"var(--pr)",fontSize:"0.6rem",fontWeight:700,padding:"1px 7px",borderRadius:9}}>{rol === "vendedor" ? "Vendedor" : "Superadmin"}</span>
                        <span style={{background:"var(--em-pale)",color:"var(--em-d)",fontSize:"0.6rem",fontWeight:700,padding:"1px 7px",borderRadius:9}}>Pro</span>
                      </div>
                    </div>
                  </div>
                  <div style={{padding:"0.3rem 0"}}>
                    <DropdownItem icon="bi-person" label="Mi perfil" onClick={() => { setMenuUsuario(false); nav("perfil"); }} />
                    {!esVendedor && <DropdownItem icon="bi-eye" label="Ver como cliente" onClick={() => setMenuUsuario(false)} muted />}
                  </div>
                  <div style={{borderTop:"1px solid var(--border)",padding:"0.3rem 0"}}>
                    <DropdownItem icon="bi-box-arrow-right" label="Cerrar sesión" onClick={() => signOut({ callbackUrl: "/" })} danger />
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
              <input placeholder="Buscar clientes, leads…" />
            </div>
            <button className="tb-btn"><i className="bi bi-bell" /><div className="dot" /></button>
            <button className="tb-btn"><i className="bi bi-question-circle" /></button>
          </div>

          <div id="content" style={{padding: ["comunicaciones","conversaciones"].includes(view) ? "0" : "1.3rem 1.4rem"}}>
            {view === "dashboard"      && <ViewDashboard />}
            {view === "clientes"       && <ViewClientes />}
            {view === "ventas"         && <ViewVentas session={session} />}
            {view === "conversaciones" && <ViewConversaciones session={session} onNavegar={nav} />}
            {view === "equipo"         && <ViewEquipo />}
            {view === "soporte"        && <ViewSoporte session={session} />}
            {view === "modulos"        && <ViewModulos />}
            {view === "planes"         && <ViewPlanes />}
            {view === "comunicaciones" && <ViewComunicaciones />}
            {view === "seguimiento"    && <ViewSeguimiento />}
            {view === "alertas"        && <ViewAlertas />}
            {view === "integraciones"  && <ViewIntegraciones onNavegar={nav} />}
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
        #sb { width:230px; min-width:230px; background:var(--sb-bg); border-right:1px solid var(--sb-brd); display:flex; flex-direction:column; height:100vh; overflow:hidden; flex-shrink:0; transition:width .22s cubic-bezier(.4,0,.2,1),min-width .22s cubic-bezier(.4,0,.2,1); position:relative; z-index:20; }
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
        .sb-uname { font-size:0.78rem; font-weight:600; color:#fff; }
        .sb-urole { font-size:0.6rem; color:var(--muted); }
        .sb-user-texts { overflow:hidden; white-space:nowrap; transition:opacity .15s,max-width .22s; max-width:180px; flex:1; }
        #sb.collapsed .sb-user-texts { opacity:0; max-width:0; }
        #sb.collapsed .sb-foot { padding:0.75rem 0; }

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

        /* CARDS */
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
        .bdg-urgente { background:#FDF2F2; color:#D9534F; border:1px solid #f5c6c6; }
        .bdg-alta    { background:#FBF6EE; color:#B08A55; }
        .bdg-media   { background:#EDF1F6; color:#506886; }
        .bdg-baja    { background:var(--moon-l); color:var(--sub); }

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

        /* CHAT */
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

        /* MISC */
        .ai-card { background:linear-gradient(135deg,#2A3F55,#3D5A78); border-radius:var(--r); padding:0.9rem 1rem; color:#fff; }
        .ai-hdr { display:flex; align-items:center; gap:0.4rem; font-size:0.75rem; font-weight:700; color:rgba(255,255,255,.7); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.5rem; }
        .ai-pulse { width:7px; height:7px; border-radius:50%; background:#4AB880; box-shadow:0 0 0 2px rgba(74,184,128,.3); }
        .ai-txt { font-size:0.8rem; line-height:1.55; color:rgba(255,255,255,.9); margin-bottom:0.65rem; }
        .ai-chips { display:flex; gap:0.4rem; flex-wrap:wrap; }
        .ai-chip { display:inline-flex; align-items:center; gap:0.25rem; padding:0.22rem 0.6rem; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2); border-radius:20px; font-size:0.67rem; color:rgba(255,255,255,.85); }
        .alert-row { display:flex; align-items:flex-start; gap:0.65rem; padding:0.62rem 0.8rem; border-left:3px solid var(--border); border-radius:0 var(--r-sm) var(--r-sm) 0; background:var(--white); margin-bottom:0.4rem; }
        .alert-row.em { border-left-color:var(--em); background:var(--em-bg); }
        .alert-row.warn { border-left-color:var(--amber); background:var(--amber-bg); }
        .alert-row.red { border-left-color:var(--red); background:var(--red-bg); }
        .nota { display:flex; align-items:flex-start; gap:0.6rem; padding:0.6rem 0; border-bottom:1px solid var(--border); }
        .nota:last-child { border-bottom:none; }
        .nota-txt { font-size:0.78rem; color:var(--text); flex:1; line-height:1.4; }
        .nota-meta { font-size:0.65rem; color:var(--muted); }
        .int-card { display:flex; align-items:center; gap:0.75rem; padding:0.7rem 0.9rem; background:var(--white); border:1px solid var(--border); border-radius:var(--r-sm); margin-bottom:0.4rem; }
        .int-ico { width:32px; height:32px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:0.95rem; }
        .cfg-section { background:var(--white); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; margin-bottom:0.9rem; box-shadow:var(--sh); }
        .cfg-hdr { padding:0.75rem 1rem; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:0.55rem; background:var(--bg); }
        .cfg-title { font-size:0.82rem; font-weight:700; color:var(--text); }
        .cfg-body { padding:0.9rem 1rem; }
        .fg { display:flex; flex-direction:column; gap:0.3rem; margin-bottom:0.6rem; }
        .fl { font-size:0.72rem; font-weight:600; color:var(--sub); }
        .fi { padding:0.4rem 0.65rem; border:1px solid var(--border2); border-radius:var(--r-sm); font-family:'Inter',sans-serif; font-size:0.8rem; color:var(--text); background:var(--white); outline:none; }
        .fi:focus { border-color:var(--pr); }
        .fi-row { display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; }
        .mod-ico { width:28px; height:28px; border-radius:7px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:0.82rem; background:var(--bg); }
        .mod-name { font-size:0.8rem; font-weight:600; color:var(--text); }
        .mod-desc { font-size:0.67rem; color:var(--muted); }
        .tog { width:32px; height:18px; border-radius:9px; background:var(--border2); position:relative; cursor:pointer; transition:background .18s; flex-shrink:0; }
        .tog.on { background:var(--em); }
        .tog-k { position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:#fff; transition:transform .18s; }
        .tog.on .tog-k { transform:translateX(14px); }
        .plan-card { background:var(--white); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; box-shadow:var(--sh); }
        .plan-hdr { padding:1rem 1.1rem 0.8rem; border-bottom:1px solid var(--border); }
        .plan-name { font-family:'Fraunces',serif; font-size:1.1rem; font-weight:600; }
        .plan-price { font-family:'Fraunces',serif; font-size:1.9rem; line-height:1; margin:0.5rem 0 0.2rem; letter-spacing:-0.02em; }
        .plan-price span { font-size:0.8rem; font-weight:400; color:var(--muted); font-family:'Inter',sans-serif; }
        .plan-feature { display:flex; align-items:center; gap:0.5rem; padding:0.38rem 1.1rem; font-size:0.77rem; color:var(--text2); border-bottom:1px solid var(--border); }
        .plan-feature:last-of-type { border-bottom:none; }
        .plan-foot { padding:0.8rem 1.1rem; }
        .vh { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.9rem; }
        .vh-title { font-family:'Fraunces',serif; font-size:1.1rem; font-weight:600; color:var(--text); }
        .vh-sub { font-size:0.72rem; color:var(--muted); margin-top:2px; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
        .view-anim { animation:fadeIn .18s ease; }
      `}</style>
    </>
  );
}

/* ══ COMPONENTES ══ */

function NavItem({ id, icon, label, active, onClick, badge, badgeClass, incoming }) {
  return (
    <div className={`ni${active ? " on" : ""}`} data-tip={label} onClick={() => onClick(id)}>
      <i className={`bi ${icon} ni-ic`} />
      <span className="ni-txt">{label}</span>
      {incoming && !badge && (
        <span style={{background:"rgba(176,138,85,.18)",color:"#C8A472",fontSize:"0.52rem",fontWeight:700,padding:"1px 6px",borderRadius:9,flexShrink:0,letterSpacing:"0.04em",textTransform:"uppercase",border:"1px solid rgba(176,138,85,.3)"}}>soon</span>
      )}
      {badge && <span className={`ni-badge${badgeClass ? " " + badgeClass : ""}`}>{badge}</span>}
    </div>
  );
}

function DropdownItem({ icon, label, onClick, danger, muted }) {
  return (
    <div onClick={onClick}
      style={{display:"flex",alignItems:"center",gap:"0.55rem",padding:"0.45rem 0.85rem",cursor:"pointer",fontSize:"0.8rem",fontWeight:500,color: danger ? "var(--red)" : muted ? "var(--muted)" : "var(--text)",transition:"background .12s"}}
      onMouseEnter={e => e.currentTarget.style.background = danger ? "var(--red-bg)" : "var(--bg)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <i className={`bi ${icon}`} style={{fontSize:"0.88rem",width:16,textAlign:"center"}} />
      {label}
    </div>
  );
}

/* ══════════════ VIEWS ══════════════ */

function ViewDashboard() {
  return (
    <div className="view-anim">
      <div className="g4">
        {[
          ["bi-people","var(--accent-pale)","var(--accent)","—","Clientes activos"],
          ["bi-cash-coin","var(--pine-bg)","var(--pine-d)","—","Ingresos mensuales"],
          ["bi-graph-up-arrow","var(--blue-bg)","var(--blue)","—","Leads activos"],
          ["bi-exclamation-triangle","var(--red-bg)","var(--red)","—","Riesgo de churn"],
        ].map(([ico,bg,color,val,lbl],i) => (
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
            <div className="ai-txt">El asistente comenzará a generar sugerencias a medida que se carguen datos en el sistema.</div>
            <div className="ai-chips">
              <span className="ai-chip"><i className="bi bi-arrow-repeat" /> Retención</span>
              <span className="ai-chip"><i className="bi bi-person-check" /> Reactivar</span>
              <span className="ai-chip"><i className="bi bi-graph-up-arrow" /> Proyección</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ CLIENTES ══ */
const RUBROS = ["Hotel","Salón de eventos","Consultorio / Clínica","Spa / Centro de bienestar","Inmobiliaria","Restaurante / Local de comida","Contador / Estudio contable","Abogado / Estudio jurídico","Gestor de seguros","Logística / Distribución","GovTech","Otro"];
const PLAN_META = { starter:{label:"Starter",cls:"bdg-moon"}, pro:{label:"Pro",cls:"bdg-pro"}, plan_ia:{label:"Plan IA",cls:"bdg-gold"}, enterprise:{label:"Enterprise",cls:"bdg-pine"} };
const FORM_VACIO = { nombre:"", rubro:"", plan:"starter", subdominio:"", email:"", telefono:"", logo_url:"" };

function ViewClientes() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");

  const cargar = async () => { setLoading(true); try { const r = await fetch("/api/tenants"); const d = await r.json(); if(d.ok) setTenants(d.tenants); } catch(_){} setLoading(false); };
  useEffect(() => { cargar(); }, []);
  const abrirNuevo = () => { setEditando(null); setForm(FORM_VACIO); setError(""); setModal(true); };
  const abrirEditar = (t) => { setEditando(t); setForm({nombre:t.nombre||"",rubro:t.rubro||"",plan:t.plan||"starter",subdominio:t.subdominio||"",email:t.email||"",telefono:t.telefono||"",logo_url:t.logo_url||""}); setError(""); setModal(true); };
  const guardar = async () => {
    if(!form.nombre||!form.rubro){ setError("Nombre y rubro son obligatorios"); return; }
    setSaving(true); setError("");
    try { const m=editando?"PATCH":"POST"; const b=editando?{id:editando.id,...form}:form; const r=await fetch("/api/tenants",{method:m,headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}); const d=await r.json(); if(!d.ok){setError(d.error||"Error al guardar");setSaving(false);return;} setModal(false); await cargar(); } catch(_){setError("Error de conexión");}
    setSaving(false);
  };
  const toggleActivo = async (t) => { try { await fetch("/api/tenants",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:t.id,activo:t.activo?0:1})}); await cargar(); } catch(_){} };
  const eliminar = async (t) => { if(!confirm(`¿Eliminar a ${t.nombre}?`)) return; try { await fetch("/api/tenants",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:t.id})}); await cargar(); } catch(_){} };
  const f = (v) => setForm(p=>({...p,...v}));

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Clientes</div><div className="vh-sub">{tenants.length} tenants registrados</div></div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <button className="btn btn-out btn-sm" onClick={cargar}><i className="bi bi-arrow-clockwise" /></button>
          <button className="btn btn-em btn-sm" onClick={abrirNuevo}><i className="bi bi-plus-lg" /> Nuevo cliente</button>
        </div>
      </div>
      <div className="card">
        {loading ? <Cargando texto="Cargando clientes..." /> : (
          <table className="tbl">
            <thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Subdominio</th><th>Activo</th><th>Creado</th><th></th></tr></thead>
            <tbody>
              {tenants.length===0 ? <tr><td colSpan={7} style={{textAlign:"center",padding:"2.5rem",color:"var(--muted)"}}><i className="bi bi-people" style={{fontSize:"1.5rem",display:"block",marginBottom:"0.5rem"}} />No hay clientes registrados</td></tr>
              : tenants.map(t => (
                <tr key={t.id}>
                  <td><div style={{display:"flex",alignItems:"center",gap:8}}>
                    {t.logo_url ? <img src={t.logo_url} alt="" style={{width:28,height:28,borderRadius:7,objectFit:"cover",border:"1px solid var(--border)",flexShrink:0}} /> : <Av letra={t.nombre?.[0]} size={28} r={7} />}
                    <div><div style={{fontWeight:600,fontSize:"0.8rem"}}>{t.nombre}</div>{t.email&&<div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{t.email}</div>}</div>
                  </div></td>
                  <td><span className="bdg bdg-blue">{t.rubro}</span></td>
                  <td><span className={`bdg ${PLAN_META[t.plan]?.cls??"bdg-moon"}`}>{PLAN_META[t.plan]?.label??t.plan}</span></td>
                  <td style={{fontSize:"0.75rem",color:"var(--muted)"}}>{t.subdominio?`${t.subdominio}.gestion360ia.com.ar`:<span style={{color:"var(--border2)"}}>—</span>}</td>
                  <td><div className={`tog${t.activo?" on":""}`} onClick={()=>toggleActivo(t)}><div className="tog-k" /></div></td>
                  <td style={{fontSize:"0.72rem",color:"var(--muted)"}}>{new Date(t.creado_en).toLocaleDateString("es-AR")}</td>
                  <td><div style={{display:"flex",gap:4}}>
                    <button className="btn btn-xs btn-out" onClick={()=>abrirEditar(t)}><i className="bi bi-pencil" /></button>
                    <button className="btn btn-xs" onClick={()=>eliminar(t)} style={{background:"var(--red-bg)",color:"var(--red)",border:"1px solid #f5c6c6"}}><i className="bi bi-trash3" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title={editando?"Editar cliente":"Nuevo cliente"} onClose={()=>setModal(false)}>
          <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.7rem"}}>
            <div className="fg"><label className="fl">Nombre del negocio *</label><input className="fi" value={form.nombre} onChange={e=>f({nombre:e.target.value})} placeholder="Ej: Hotel Aurora" /></div>
            <div className="fi-row">
              <div className="fg"><label className="fl">Rubro *</label><select className="fi" value={form.rubro} onChange={e=>f({rubro:e.target.value})}><option value="">Seleccionar…</option>{RUBROS.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
              <div className="fg"><label className="fl">Plan</label><select className="fi" value={form.plan} onChange={e=>f({plan:e.target.value})}><option value="starter">Starter</option><option value="pro">Pro</option><option value="plan_ia">Plan IA</option><option value="enterprise">Enterprise</option></select></div>
            </div>
            <div className="fi-row">
              <div className="fg"><label className="fl">Email</label><input className="fi" value={form.email} onChange={e=>f({email:e.target.value})} placeholder="contacto@empresa.com" /></div>
              <div className="fg"><label className="fl">Teléfono</label><input className="fi" value={form.telefono} onChange={e=>f({telefono:e.target.value})} placeholder="+54 11 0000-0000" /></div>
            </div>
            <div className="fg"><label className="fl">Subdominio</label>
              <div style={{display:"flex",alignItems:"center"}}>
                <input className="fi" value={form.subdominio} onChange={e=>f({subdominio:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"")})} placeholder="mi-empresa" style={{borderRadius:"var(--r-sm) 0 0 var(--r-sm)",borderRight:"none"}} />
                <div style={{padding:"0.4rem 0.65rem",background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:"0 var(--r-sm) var(--r-sm) 0",fontSize:"0.75rem",color:"var(--muted)",whiteSpace:"nowrap"}}>.gestion360ia.com.ar</div>
              </div>
            </div>
            <div className="fg"><label className="fl">URL del logo</label><input className="fi" value={form.logo_url} onChange={e=>f({logo_url:e.target.value})} placeholder="https://…" /></div>
            {error && <ErrorMsg msg={error} />}
          </div>
          <ModalFooter onCancel={()=>setModal(false)} onConfirm={guardar} saving={saving} labelConfirm={editando?"Guardar cambios":"Crear cliente"} />
        </Modal>
      )}
    </div>
  );
}

/* ══ VENTAS ══ */
const RUBROS_VENTA = RUBROS;
const ESTADO_LEAD = {
  nuevo:{label:"Nuevo",cls:"bdg-blue"},
  contactado:{label:"Contactado",cls:"bdg-amber"},
  demo:{label:"Demo",cls:"bdg-pine"},
  propuesta:{label:"Propuesta",cls:"bdg-gold"},
  cerrado:{label:"Cerrado",cls:"bdg-em"},
  perdido:{label:"Perdido",cls:"bdg-red"},
};
const TIPO_ACTIVIDAD = {
  llamada:{icon:"bi-telephone",color:"var(--pr)"},
  email:{icon:"bi-envelope",color:"var(--accent)"},
  whatsapp:{icon:"bi-whatsapp",color:"#25D366"},
  reunion:{icon:"bi-calendar-check",color:"var(--em-d)"},
  nota:{icon:"bi-sticky",color:"var(--muted)"},
};
const LEAD_VACIO = { nombre:"",empresa:"",email:"",telefono:"",rubro_interes:"",plan_interes:"",fuente:"web",valor_mrr_estimado:"",notas:"" };
const ACT_VACIO = { tipo:"nota",descripcion:"",proxima_accion:"",fecha_proxima_accion:"" };

function ViewVentas({ session }) {
  const [tab, setTab] = useState("leads");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(LEAD_VACIO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [leadActivo, setLeadActivo] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [loadingAct, setLoadingAct] = useState(false);
  const [modalAct, setModalAct] = useState(false);
  const [formAct, setFormAct] = useState(ACT_VACIO);
  const [filtroEstado, setFiltroEstado] = useState("");

  const cargar = async () => {
    setLoading(true);
    try {
      const rol = session?.user?.rol || "superadmin";
      const uid = session?.user?.id || "";
      const params = new URLSearchParams({ rol, usuario_id: uid });
      if (filtroEstado) params.append("estado", filtroEstado);
      const r = await fetch(`/api/ventas/leads?${params}`);
      const d = await r.json();
      if (d.ok) setLeads(d.leads);
    } catch(_){}
    setLoading(false);
  };

  const cargarActividades = async (lead_id) => {
    setLoadingAct(true);
    try { const r=await fetch(`/api/ventas/actividades?lead_id=${lead_id}`); const d=await r.json(); if(d.ok) setActividades(d.actividades); } catch(_){}
    setLoadingAct(false);
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

  const abrirNuevo = () => { setEditando(null); setForm(LEAD_VACIO); setError(""); setModal(true); };
  const abrirEditar = (l) => { setEditando(l); setForm({nombre:l.nombre||"",empresa:l.empresa||"",email:l.email||"",telefono:l.telefono||"",rubro_interes:l.rubro_interes||"",plan_interes:l.plan_interes||"",fuente:l.fuente||"web",valor_mrr_estimado:l.valor_mrr_estimado||"",notas:l.notas||""}); setError(""); setModal(true); };

  const guardar = async () => {
    if(!form.nombre){ setError("Nombre es obligatorio"); return; }
    setSaving(true); setError("");
    try { const m=editando?"PATCH":"POST"; const b=editando?{id:editando.id,...form}:form; const r=await fetch("/api/ventas/leads",{method:m,headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}); const d=await r.json(); if(!d.ok){setError(d.error||"Error al guardar");setSaving(false);return;} setModal(false); await cargar(); } catch(_){setError("Error de conexión");}
    setSaving(false);
  };

  const cambiarEstado = async (id, estado) => { try { await fetch("/api/ventas/leads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,estado})}); await cargar(); } catch(_){} };
  const eliminar = async (l) => { if(!confirm(`¿Eliminar lead ${l.nombre}?`)) return; try { await fetch("/api/ventas/leads",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:l.id})}); if(leadActivo?.id===l.id) setLeadActivo(null); await cargar(); } catch(_){} };
  const abrirLead = async (l) => { setLeadActivo(l); setTab("detalle"); await cargarActividades(l.id); };
  const guardarActividad = async () => {
    if(!formAct.tipo) return;
    setSaving(true);
    try { await fetch("/api/ventas/actividades",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lead_id:leadActivo.id,usuario_id:session?.user?.id||1,...formAct})}); setModalAct(false); setFormAct(ACT_VACIO); await cargarActividades(leadActivo.id); } catch(_){}
    setSaving(false);
  };

  const f = (v) => setForm(p=>({...p,...v}));
  const fa = (v) => setFormAct(p=>({...p,...v}));
  const nuevos    = leads.filter(l=>l.estado==="nuevo").length;
  const enProceso = leads.filter(l=>["contactado","demo","propuesta"].includes(l.estado)).length;
  const cerrados  = leads.filter(l=>l.estado==="cerrado").length;
  const mrrTotal  = leads.filter(l=>l.estado!=="perdido").reduce((s,l)=>s+(Number(l.valor_mrr_estimado)||0),0);

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Ventas</div><div className="vh-sub">Pipeline comercial · {leads.length} leads</div></div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <button className="btn btn-out btn-sm" onClick={cargar}><i className="bi bi-arrow-clockwise" /></button>
          <button className="btn btn-em btn-sm" onClick={abrirNuevo}><i className="bi bi-plus-lg" /> Nuevo lead</button>
        </div>
      </div>

      <div className="g4" style={{marginBottom:"0.9rem"}}>
        {[["bi-person-plus","var(--blue-bg)","var(--blue)",nuevos,"Leads nuevos"],["bi-hourglass-split","var(--amber-bg)","var(--amber)",enProceso,"En proceso"],["bi-check-circle","var(--em-pale)","var(--em-d)",cerrados,"Cerrados"],["bi-cash-coin","var(--accent-pale)","var(--accent)",mrrTotal>0?`$${mrrTotal.toLocaleString("es-AR")}`:"—","MRR estimado"]].map(([ico,bg,color,val,lbl],i)=>(
          <div key={i} className="kpi"><div className="kpi-ico" style={{background:bg}}><i className={`bi ${ico}`} style={{color}} /></div><div className="kpi-val" style={{fontSize:i===3?"1.2rem":"1.85rem"}}>{val}</div><div className="kpi-lbl">{lbl}</div></div>
        ))}
      </div>

      <Tabs tabs={[["leads","Leads","bi-people"],["detalle","Detalle","bi-journal-text"]]} active={tab} onChange={setTab} />

      {tab==="leads" && (
        <>
          <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.7rem",flexWrap:"wrap"}}>
            {["","nuevo","contactado","demo","propuesta","cerrado","perdido"].map(e=>(
              <button key={e} onClick={()=>setFiltroEstado(e)} className="btn btn-xs"
                style={{background:filtroEstado===e?"var(--pr)":"var(--bg)",color:filtroEstado===e?"#fff":"var(--sub)",border:`1px solid ${filtroEstado===e?"var(--pr)":"var(--border)"}`}}>
                {e===""?"Todos":ESTADO_LEAD[e]?.label}
              </button>
            ))}
          </div>
          <div className="card">
            {loading ? <Cargando texto="Cargando leads..." /> : (
              <table className="tbl">
                <thead><tr><th>Contacto</th><th>Rubro</th><th>Plan</th><th>Fuente</th><th>Estado</th><th>MRR Est.</th><th>Vendedor</th><th></th></tr></thead>
                <tbody>
                  {leads.length===0 ? <tr><td colSpan={8} style={{textAlign:"center",padding:"2.5rem",color:"var(--muted)"}}><i className="bi bi-graph-up-arrow" style={{fontSize:"1.5rem",display:"block",marginBottom:"0.5rem"}} />No hay leads todavía</td></tr>
                  : leads.map(l=>(
                    <tr key={l.id} onClick={()=>abrirLead(l)}>
                      <td><div style={{display:"flex",alignItems:"center",gap:8}}><Av letra={l.nombre?.[0]} size={26} /><div><div style={{fontWeight:600,fontSize:"0.8rem"}}>{l.nombre}</div>{l.empresa&&<div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{l.empresa}</div>}</div></div></td>
                      <td style={{fontSize:"0.75rem",color:"var(--text2)"}}>{l.rubro_interes||"—"}</td>
                      <td>{l.plan_interes?<span className="bdg bdg-blue">{l.plan_interes}</span>:<span style={{color:"var(--muted)"}}>—</span>}</td>
                      <td style={{fontSize:"0.75rem",color:"var(--muted)"}}>{l.fuente}</td>
                      <td><select value={l.estado} onClick={e=>e.stopPropagation()} onChange={e=>cambiarEstado(l.id,e.target.value)} style={{padding:"0.22rem 0.5rem",borderRadius:"var(--r-sm)",border:"1px solid var(--border2)",fontSize:"0.72rem",fontFamily:"inherit",background:"var(--white)",cursor:"pointer"}}>{Object.entries(ESTADO_LEAD).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></td>
                      <td style={{fontSize:"0.78rem",fontWeight:600}}>{l.valor_mrr_estimado?`$${Number(l.valor_mrr_estimado).toLocaleString("es-AR")}`:"—"}</td>
                      <td style={{fontSize:"0.72rem",color:"var(--muted)"}}>{l.vendedor_nombre||<span style={{color:"var(--border2)"}}>Sin asignar</span>}</td>
                      <td onClick={e=>e.stopPropagation()}><div style={{display:"flex",gap:4}}>
                        <button className="btn btn-xs btn-out" onClick={()=>abrirEditar(l)}><i className="bi bi-pencil" /></button>
                        <button className="btn btn-xs" onClick={()=>eliminar(l)} style={{background:"var(--red-bg)",color:"var(--red)",border:"1px solid #f5c6c6"}}><i className="bi bi-trash3" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab==="detalle" && (
        !leadActivo ? (
          <div className="card" style={{padding:"2.5rem",textAlign:"center",color:"var(--muted)"}}>
            <i className="bi bi-hand-index" style={{fontSize:"1.5rem",display:"block",marginBottom:"0.5rem"}} />
            Seleccioná un lead de la pestaña Leads para ver su detalle
          </div>
        ) : (
          <div className="g2">
            <div className="card">
              <div className="ch"><i className="bi bi-person-circle" style={{color:"var(--pr)"}} /><span className="ch-title">{leadActivo.nombre}</span><div className="ch-act"><span className={`bdg ${ESTADO_LEAD[leadActivo.estado]?.cls}`}>{ESTADO_LEAD[leadActivo.estado]?.label}</span></div></div>
              <div className="cb" style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                {[["Empresa",leadActivo.empresa],["Email",leadActivo.email],["Teléfono",leadActivo.telefono],["Rubro",leadActivo.rubro_interes],["Plan interés",leadActivo.plan_interes],["Fuente",leadActivo.fuente],["MRR estimado",leadActivo.valor_mrr_estimado?`$${Number(leadActivo.valor_mrr_estimado).toLocaleString("es-AR")}`:null],["Vendedor",leadActivo.vendedor_nombre]].map(([k,v])=>v?(
                  <div key={k} style={{display:"flex",gap:"0.5rem",fontSize:"0.8rem"}}><span style={{color:"var(--muted)",width:90,flexShrink:0}}>{k}</span><span style={{color:"var(--text)",fontWeight:500}}>{v}</span></div>
                ):null)}
                {leadActivo.notas&&<div style={{marginTop:"0.5rem",padding:"0.6rem",background:"var(--bg)",borderRadius:"var(--r-sm)",fontSize:"0.78rem",color:"var(--text2)"}}>{leadActivo.notas}</div>}
              </div>
            </div>
            <div className="card">
              <div className="ch"><i className="bi bi-journal-text" style={{color:"var(--accent)"}} /><span className="ch-title">Actividades</span><div className="ch-act"><button className="btn btn-em btn-xs" onClick={()=>setModalAct(true)}><i className="bi bi-plus-lg" /> Registrar</button></div></div>
              <div className="cb" style={{padding:0}}>
                {loadingAct ? <div style={{padding:"1.5rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Cargando...</div>
                : actividades.length===0 ? <div style={{padding:"1.5rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Sin actividades registradas</div>
                : actividades.map((a,i)=>(
                  <div key={a.id} style={{display:"flex",gap:"0.65rem",padding:"0.7rem 1rem",borderBottom:i<actividades.length-1?"1px solid var(--border)":"none"}}>
                    <div style={{width:28,height:28,borderRadius:7,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <i className={`bi ${TIPO_ACTIVIDAD[a.tipo]?.icon||"bi-dot"}`} style={{color:TIPO_ACTIVIDAD[a.tipo]?.color,fontSize:"0.82rem"}} />
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"0.78rem",color:"var(--text)",lineHeight:1.4}}>{a.descripcion||"—"}</div>
                      {a.proxima_accion&&<div style={{fontSize:"0.67rem",color:"var(--accent)",marginTop:2}}>→ {a.proxima_accion} {a.fecha_proxima_accion?`(${new Date(a.fecha_proxima_accion).toLocaleDateString("es-AR")})`:""}</div>}
                      <div style={{fontSize:"0.65rem",color:"var(--muted)",marginTop:2}}>{a.usuario_nombre} · {new Date(a.fecha_actividad).toLocaleDateString("es-AR")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {modal && (
        <Modal title={editando?"Editar lead":"Nuevo lead"} onClose={()=>setModal(false)}>
          <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.7rem",maxHeight:"70vh",overflowY:"auto"}}>
            <div className="fi-row"><div className="fg"><label className="fl">Nombre *</label><input className="fi" value={form.nombre} onChange={e=>f({nombre:e.target.value})} placeholder="Juan García" /></div><div className="fg"><label className="fl">Empresa</label><input className="fi" value={form.empresa} onChange={e=>f({empresa:e.target.value})} placeholder="Hotel Aurora" /></div></div>
            <div className="fi-row"><div className="fg"><label className="fl">Email</label><input className="fi" value={form.email} onChange={e=>f({email:e.target.value})} /></div><div className="fg"><label className="fl">Teléfono</label><input className="fi" value={form.telefono} onChange={e=>f({telefono:e.target.value})} /></div></div>
            <div className="fi-row"><div className="fg"><label className="fl">Rubro de interés</label><select className="fi" value={form.rubro_interes} onChange={e=>f({rubro_interes:e.target.value})}><option value="">Seleccionar…</option>{RUBROS_VENTA.map(r=><option key={r} value={r}>{r}</option>)}</select></div><div className="fg"><label className="fl">Plan de interés</label><select className="fi" value={form.plan_interes} onChange={e=>f({plan_interes:e.target.value})}><option value="">Sin definir</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="plan_ia">Plan IA</option><option value="enterprise">Enterprise</option></select></div></div>
            <div className="fi-row"><div className="fg"><label className="fl">Fuente</label><select className="fi" value={form.fuente} onChange={e=>f({fuente:e.target.value})}><option value="web">Web</option><option value="referido">Referido</option><option value="ads">Ads</option><option value="evento">Evento</option><option value="cold">Cold outreach</option></select></div><div className="fg"><label className="fl">MRR estimado (ARS)</label><input className="fi" type="number" value={form.valor_mrr_estimado} onChange={e=>f({valor_mrr_estimado:e.target.value})} placeholder="0" /></div></div>
            <div className="fg"><label className="fl">Notas</label><textarea className="fi" rows={3} value={form.notas} onChange={e=>f({notas:e.target.value})} style={{resize:"vertical"}} /></div>
            {error && <ErrorMsg msg={error} />}
          </div>
          <ModalFooter onCancel={()=>setModal(false)} onConfirm={guardar} saving={saving} labelConfirm={editando?"Guardar cambios":"Crear lead"} />
        </Modal>
      )}

      {modalAct && (
        <Modal title="Registrar actividad" onClose={()=>setModalAct(false)}>
          <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.7rem"}}>
            <div className="fg"><label className="fl">Tipo</label><select className="fi" value={formAct.tipo} onChange={e=>fa({tipo:e.target.value})}><option value="nota">Nota</option><option value="llamada">Llamada</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="reunion">Reunión</option></select></div>
            <div className="fg"><label className="fl">Descripción</label><textarea className="fi" rows={3} value={formAct.descripcion} onChange={e=>fa({descripcion:e.target.value})} style={{resize:"vertical"}} /></div>
            <div className="fg"><label className="fl">Próxima acción</label><input className="fi" value={formAct.proxima_accion} onChange={e=>fa({proxima_accion:e.target.value})} /></div>
            <div className="fg"><label className="fl">Fecha próxima acción</label><input className="fi" type="date" value={formAct.fecha_proxima_accion} onChange={e=>fa({fecha_proxima_accion:e.target.value})} /></div>
          </div>
          <ModalFooter onCancel={()=>setModalAct(false)} onConfirm={guardarActividad} saving={saving} labelConfirm="Registrar" />
        </Modal>
      )}
    </div>
  );
}

/* ══ CANAL META ══ */
const CANAL_META = {
  whatsapp: { label:"WhatsApp",  color:"#25D366", bg:"#E8F7EE", textColor:"#1A6A35",
    dot: () => <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:"#25D366",flexShrink:0}} /> },
  instagram: { label:"Instagram", color:"#E1306C", bg:"#FDE8F5", textColor:"#8B2563",
    dot: () => <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:"#E1306C",flexShrink:0}} /> },
  facebook: { label:"Facebook",  color:"#1877F2", bg:"#E8EEF7", textColor:"#1A3A7A",
    dot: () => <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:"#1877F2",flexShrink:0}} /> },
  email: { label:"Email",     color:"#B08A55", bg:"#FBF6EE", textColor:"#7A5800",
    dot: () => <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:"#B08A55",flexShrink:0}} /> },
  web: { label:"Web / Chat", color:"#506886", bg:"#EDF1F6", textColor:"#3E5270",
    dot: () => <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:"#506886",flexShrink:0}} /> },
  tiktok: { label:"TikTok",    color:"#010101", bg:"#F0F0F0", textColor:"#333",
    dot: () => <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:"#010101",flexShrink:0}} /> },
};

/* ══ CONVERSACIONES ══ */
function ViewConversaciones({ session, onNavegar }) {
  const [convs, setConvs] = useState([]);
  const [activa, setActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("nueva");
  const [filtroCanal, setFiltroCanal] = useState("todos");
  const [vendedores, setVendedores] = useState([]);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [asignandoId, setAsignandoId] = useState(null);
  const [integraciones, setIntegraciones] = useState([]);
  const msgsRef = useRef(null);

  const cargarIntegraciones = async () => {
    try {
      const r = await fetch("/api/integraciones");
      const d = await r.json();
      if (d.ok) setIntegraciones(d.integraciones);
    } catch(_){}
  };

  const cargar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado && filtroEstado !== "todas") params.append("estado", filtroEstado);
      if (filtroCanal && filtroCanal !== "todos") params.append("canal", filtroCanal);
      const r = await fetch(`/api/ventas/conversaciones?${params}`);
      const d = await r.json();
      if (Array.isArray(d)) setConvs(d);
    } catch(_){}
    setLoading(false);
  };

  const cargarMensajes = async (conv) => {
    setActiva(conv);
    setLoadingMsg(true);
    try {
      const r = await fetch(`/api/ventas/mensajes?conversacion_id=${conv.id}`);
      const d = await r.json();
      if (Array.isArray(d)) setMensajes(d);
    } catch(_){}
    setLoadingMsg(false);
    setTimeout(() => msgsRef.current?.scrollTo(0, 99999), 100);
  };

  const cargarVendedores = async () => {
    try {
      const r = await fetch("/api/usuarios");
      const d = await r.json();
      if (d.ok) setVendedores(d.usuarios.filter(u => ["vendedor","admin","superadmin"].includes(u.rol) && u.activo));
    } catch(_){}
  };

  useEffect(() => { cargar(); cargarIntegraciones(); cargarVendedores(); }, [filtroEstado, filtroCanal]);

  const enviar = async () => {
    if (!texto.trim() || !activa) return;
    setEnviando(true);
    try {
      await fetch("/api/ventas/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversacion_id: activa.id, direccion: "saliente", contenido: texto }),
      });
      setTexto("");
      await cargarMensajes(activa);
    } catch(_){}
    setEnviando(false);
  };

  const asignar = async (conv_id, usuario_id) => {
    try {
      await fetch("/api/ventas/conversaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: conv_id, asignado_a: usuario_id }),
      });
      setModalAsignar(false);
      await cargar();
      if (activa?.id === conv_id) setActiva(p => ({ ...p, asignado_a: usuario_id, vendedor_nombre: vendedores.find(v=>v.id===usuario_id)?.nombre }));
    } catch(_){}
  };

  const dismissSugerencia = async (id) => {
    try {
      await fetch("/api/integraciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, sugerencia_dismisseada: 1 }),
      });
      setIntegraciones(prev => prev.map(i => i.id === id ? {...i, sugerencia_dismisseada:1} : i));
    } catch(_){}
  };

  const hayAlgoConectado = integraciones.some(i => i.activo);
  const canalesNoConectados = integraciones.filter(i => !i.activo && !i.sugerencia_dismisseada);
  const sinAsignar = convs.filter(c => !c.asignado_a).length;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>

      {/* ── BANNER MAIA ── */}
      {!hayAlgoConectado ? (
        <div style={{margin:"1rem 1rem 0",background:"linear-gradient(135deg,#1C3D2E,#2A5A44)",borderRadius:"var(--r)",padding:"0.85rem 1rem",display:"flex",alignItems:"flex-start",gap:"0.75rem"}}>
          <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <i className="bi bi-plug" style={{color:"#4AB880",fontSize:"0.95rem"}} />
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:"0.7rem",fontWeight:700,color:"rgba(255,255,255,.6)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.2rem"}}>
              Maia · Sin canales conectados
            </div>
            <div style={{fontSize:"0.79rem",color:"rgba(255,255,255,.9)",lineHeight:1.5}}>
              Todavía no hay canales configurados. Conectá <strong>WhatsApp, Instagram, Facebook o Email</strong> desde Integraciones para ver tus conversaciones acá.
            </div>
          </div>
          <button onClick={() => onNavegar && onNavegar("integraciones")}
            style={{flexShrink:0,padding:"0.35rem 0.8rem",borderRadius:"var(--r-sm)",border:"1px solid rgba(255,255,255,.3)",background:"rgba(255,255,255,.12)",color:"#fff",fontSize:"0.75rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
            Ir a Integraciones →
          </button>
        </div>
      ) : canalesNoConectados.length > 0 && (
        <div style={{margin:"1rem 1rem 0",background:"linear-gradient(135deg,#2A3F55,#3D5A78)",borderRadius:"var(--r)",padding:"0.8rem 1rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.45rem"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#4AB880",boxShadow:"0 0 0 2px rgba(74,184,128,.3)"}} />
            <div style={{fontSize:"0.7rem",fontWeight:700,color:"rgba(255,255,255,.6)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Maia sugiere</div>
          </div>
          <div style={{fontSize:"0.77rem",color:"rgba(255,255,255,.85)",marginBottom:"0.5rem"}}>
            Podés recibir más conversaciones conectando estos canales:
          </div>
          <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
            {canalesNoConectados.map(c => {
              const m = CANAL_META[c.tipo];
              if (!m) return null;
              return (
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:"0.4rem",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:20,padding:"0.2rem 0.6rem"}}>
                  {m.dot()}
                  <span style={{fontSize:"0.7rem",color:"rgba(255,255,255,.9)"}}>{m.label}</span>
                  <button onClick={() => onNavegar && onNavegar("integraciones")}
                    style={{background:"none",border:"none",color:"rgba(255,255,255,.7)",fontSize:"0.65rem",cursor:"pointer",fontFamily:"inherit",padding:0,marginLeft:2,fontWeight:600}}>
                    Conectar
                  </button>
                  <button onClick={() => dismissSugerencia(c.id)} title="No mostrar más"
                    style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:"0.75rem",cursor:"pointer",fontFamily:"inherit",padding:0,lineHeight:1}}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BANDEJA ── */}
      <div className="comm-wrap view-anim" style={{flex:1,marginTop:"0.75rem"}}>

        {/* Lista */}
        <div className="conv-list">
          <div className="conv-hdr">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.45rem"}}>
              <div className="conv-hdr-title">Conversaciones</div>
              {sinAsignar > 0 && <span className="bdg bdg-amber">{sinAsignar} sin asignar</span>}
            </div>

            {/* Filtro canal */}
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:"0.35rem"}}>
              <button onClick={()=>setFiltroCanal("todos")}
                style={{padding:"2px 7px",borderRadius:20,border:"0.5px solid var(--border)",fontSize:"0.62rem",fontWeight:filtroCanal==="todos"?700:400,background:filtroCanal==="todos"?"var(--pr)":"var(--bg)",color:filtroCanal==="todos"?"#fff":"var(--muted)",cursor:"pointer",fontFamily:"inherit"}}>
                Todos
              </button>
              {Object.entries(CANAL_META).map(([tipo,m])=>(
                <button key={tipo} onClick={()=>setFiltroCanal(tipo)}
                  style={{display:"flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:20,border:`0.5px solid ${filtroCanal===tipo?m.color:"var(--border)"}`,fontSize:"0.62rem",fontWeight:filtroCanal===tipo?700:400,background:filtroCanal===tipo?m.bg:"var(--bg)",color:filtroCanal===tipo?m.textColor:"var(--muted)",cursor:"pointer",fontFamily:"inherit"}}>
                  {m.dot()}{m.label}
                </button>
              ))}
            </div>

            {/* Filtro estado */}
            <div style={{display:"flex",gap:3}}>
              {[["nueva","Nuevas"],["en_curso","En curso"],["cerrada","Cerradas"],["todas","Todas"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFiltroEstado(v)}
                  style={{flex:1,padding:"2px 0",border:"none",borderRadius:"var(--r-sm)",fontSize:"0.62rem",fontWeight:filtroEstado===v?700:500,background:filtroEstado===v?"var(--pr)":"var(--bg)",color:filtroEstado===v?"#fff":"var(--muted)",cursor:"pointer",fontFamily:"inherit"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="conv-search">
            <i className="bi bi-search" style={{color:"var(--muted)",fontSize:"0.75rem"}} />
            <input placeholder="Buscar nombre, teléfono…" />
          </div>

          <div className="conv-items">
            {loading ? <div style={{padding:"1.5rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Cargando...</div>
            : convs.length === 0 ? (
              <div style={{padding:"2rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>
                <i className="bi bi-chat-dots" style={{fontSize:"1.5rem",display:"block",marginBottom:"0.5rem"}} />
                {hayAlgoConectado ? "Sin conversaciones" : "Conectá un canal para empezar"}
              </div>
            ) : convs.map(c => {
              const m = CANAL_META[c.canal];
              return (
                <div key={c.id} className={`conv-item${activa?.id===c.id?" on":""}`} onClick={()=>cargarMensajes(c)}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <div className="conv-av">{(c.contacto_nombre||"?")[0].toUpperCase()}</div>
                    {m && (
                      <div style={{position:"absolute",bottom:-2,right:-2,width:13,height:13,borderRadius:"50%",background:m.color,border:"1.5px solid var(--white)",display:"flex",alignItems:"center",justifyContent:"center"}} />
                    )}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div className="conv-name">{c.contacto_nombre||"Sin nombre"}</div>
                      <div className="conv-time">{c.ultimo_mensaje_at ? new Date(c.ultimo_mensaje_at).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}) : ""}</div>
                    </div>
                    <div className="conv-prev">{c.ultimo_mensaje||"Sin mensajes"}</div>
                    <div style={{marginTop:2,display:"flex",gap:4,alignItems:"center"}}>
                      {m && <span style={{fontSize:"0.6rem",color:m.textColor,background:m.bg,padding:"0 5px",borderRadius:4,fontWeight:600}}>{m.label}</span>}
                      {!c.asignado_a
                        ? <span style={{fontSize:"0.6rem",background:"var(--amber-bg)",color:"var(--amber)",padding:"0 5px",borderRadius:4,fontWeight:600}}>Sin asignar</span>
                        : <span style={{fontSize:"0.6rem",color:"var(--muted)"}}>→ {c.vendedor_nombre}</span>
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat */}
        <div className="chat-panel">
          {!activa ? (
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"0.5rem",color:"var(--muted)"}}>
              <i className="bi bi-chat-dots" style={{fontSize:"2rem"}} />
              <div style={{fontSize:"0.82rem"}}>Seleccioná una conversación</div>
            </div>
          ) : (
            <>
              <div className="chat-hdr">
                <div className="conv-av" style={{width:32,height:32,fontSize:"0.75rem"}}>
                  {(activa.contacto_nombre||"?")[0].toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:"0.82rem"}}>{activa.contacto_nombre||"Sin nombre"}</div>
                  <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{activa.contacto_telefono||activa.contacto_email||""}</div>
                </div>
                {/* Canal pill */}
                {CANAL_META[activa.canal] && (
                  <div style={{display:"flex",alignItems:"center",gap:5,padding:"2px 9px",borderRadius:20,background:CANAL_META[activa.canal].bg,color:CANAL_META[activa.canal].textColor,fontSize:"0.7rem",fontWeight:600,flexShrink:0}}>
                    {CANAL_META[activa.canal].dot()}
                    {CANAL_META[activa.canal].label}
                  </div>
                )}
                {/* Estado */}
                <span className={`bdg ${activa.estado==="nueva"?"bdg-blue":activa.estado==="en_curso"?"bdg-amber":"bdg-moon"}`}>
                  {activa.estado==="nueva"?"Nueva":activa.estado==="en_curso"?"En curso":"Cerrada"}
                </span>
                {/* Asignación */}
                <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                  {activa.asignado_a
                    ? <span style={{fontSize:"0.7rem",color:"var(--muted)",display:"flex",alignItems:"center",gap:4}}><Av letra={activa.vendedor_nombre?.[0]} size={20} />{activa.vendedor_nombre}</span>
                    : <span className="bdg bdg-amber">Sin asignar</span>
                  }
                  <button className="btn btn-xs btn-out" onClick={()=>{ setAsignandoId(activa.id); setModalAsignar(true); }}>
                    {activa.asignado_a ? "Reasignar" : "Asignar"}
                  </button>
                </div>
                <button className="btn btn-xs btn-out"><i className="bi bi-person-plus" /> Crear lead</button>
              </div>

              <div className="chat-msgs" ref={msgsRef}>
                {loadingMsg ? <div style={{textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Cargando mensajes...</div>
                : mensajes.length === 0 ? <div style={{textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Sin mensajes todavía</div>
                : mensajes.map(m => (
                  <div key={m.id}>
                    <div className={`msg ${m.direccion==="saliente"?"msg-out":"msg-in"}`}>
                      {m.contenido}
                      <div className="msg-t">
                        {new Date(m.creado_en).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}
                        {m.direccion==="saliente" && <span style={{marginLeft:4}}>{m.enviado_por_nombre||"Vos"}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-input-bar">
                <input className="chat-inp" placeholder="Escribir mensaje…" value={texto}
                  onChange={e=>setTexto(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); enviar(); } }} />
                <button className="btn btn-em btn-sm" onClick={enviar} disabled={enviando||!texto.trim()}>
                  <i className="bi bi-send" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal asignar */}
      {modalAsignar && (
        <Modal title="Asignar vendedor" onClose={()=>setModalAsignar(false)} maxWidth={360}>
          <div style={{padding:"1rem"}}>
            {vendedores.length===0
              ? <div style={{textAlign:"center",color:"var(--muted)",fontSize:"0.8rem"}}>No hay vendedores disponibles</div>
              : vendedores.map(v=>(
                <div key={v.id} onClick={()=>asignar(asignandoId,v.id)}
                  style={{display:"flex",alignItems:"center",gap:"0.65rem",padding:"0.55rem 0.7rem",borderRadius:"var(--r-sm)",cursor:"pointer",transition:"background .12s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--bg)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Av letra={v.nombre?.[0]} size={30} />
                  <div>
                    <div style={{fontSize:"0.82rem",fontWeight:600,color:"var(--text)"}}>{v.nombre}</div>
                    <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{v.rol} · {v.email}</div>
                  </div>
                  {activa?.asignado_a===v.id && <i className="bi bi-check2" style={{marginLeft:"auto",color:"var(--em)"}} />}
                </div>
              ))
            }
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══ VENDEDORES ══ */
function ViewVendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/usuarios");
        const d = await r.json();
        if (d.ok) setVendedores(d.usuarios.filter(u => u.rol === "vendedor" && u.activo));
      } catch(_){}
      setLoading(false);
    };
    cargar();
  }, []);

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Vendedores</div><div className="vh-sub">Equipo comercial y rendimiento</div></div>
      </div>

      {loading ? <Cargando texto="Cargando vendedores..." /> : vendedores.length === 0 ? (
        <div className="card" style={{padding:"2.5rem",textAlign:"center",color:"var(--muted)"}}>
          <i className="bi bi-person-badge" style={{fontSize:"1.5rem",display:"block",marginBottom:"0.5rem"}} />
          No hay vendedores activos. Creá usuarios con rol "Vendedor" en Sistema.
        </div>
      ) : (
        <div className="g3">
          {vendedores.map(v => (
            <div key={v.id} className="card">
              <div className="cb">
                <div style={{display:"flex",alignItems:"center",gap:"0.7rem",marginBottom:"0.8rem"}}>
                  <Av letra={v.nombre?.[0]} size={40} fontSize="1rem" />
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.88rem",color:"var(--text)"}}>{v.nombre}</div>
                    <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{v.email}</div>
                  </div>
                </div>

                {/* Especialidades */}
                {v.rubros_especialidad && (
                  <div style={{marginBottom:"0.5rem"}}>
                    <div style={{fontSize:"0.65rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Rubros</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                      {(typeof v.rubros_especialidad === "string" ? JSON.parse(v.rubros_especialidad) : v.rubros_especialidad).map((r,i) => (
                        <span key={i} className="bdg bdg-blue" style={{fontSize:"0.62rem"}}>{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginTop:"0.5rem",paddingTop:"0.5rem",borderTop:"1px solid var(--border)"}}>
                  {[["Tasa de cierre",`${v.tasa_cierre||0}%`,"var(--em-d)"],["MRR generado",v.mrr_generado?`$${Number(v.mrr_generado).toLocaleString("es-AR")}`:"—","var(--accent)"]].map(([l,val,color],i)=>(
                    <div key={i}>
                      <div style={{fontSize:"0.6rem",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div>
                      <div style={{fontSize:"0.95rem",fontWeight:700,color}}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Último acceso */}
                <div style={{marginTop:"0.5rem",fontSize:"0.67rem",color:"var(--muted)"}}>
                  Último acceso: {v.ultimo_acceso ? new Date(v.ultimo_acceso).toLocaleDateString("es-AR") : "Nunca"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══ EQUIPO ══ */
const AREA_META = {
  comercial:      { label:"Área Comercial",  color:"var(--pr)",      bg:"var(--pr-pale)",     icon:"bi-graph-up-arrow", roles:["vendedor"] },
  contenido:      { label:"Área Marketing",  color:"var(--accent)",  bg:"var(--accent-pale)", icon:"bi-megaphone",      roles:["cm"] },
  atencion:       { label:"Área Soporte",    color:"var(--em-d)",    bg:"var(--em-pale)",     icon:"bi-headset",        roles:["soporte"] },
  administracion: { label:"Administración",  color:"var(--sub)",     bg:"var(--moon-l)",      icon:"bi-shield-lock",    roles:["admin"] },
};

const ROL_META = {
  vendedor: { label:"Vendedor",           color:"var(--pr)" },
  cm:       { label:"Community Manager",  color:"var(--accent)" },
  soporte:  { label:"Soporte",            color:"var(--em-d)" },
  admin:    { label:"Admin",              color:"var(--sub)" },
};

function ViewEquipo() {
  const [tab, setTab] = useState("comercial");
  const [data, setData] = useState({ equipos:[], usuarios:[], porArea:{} });
  const [loading, setLoading] = useState(true);
  const [modalEditar, setModalEditar] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ rol:"", area:"", activo:1 });
  const [saving, setSaving] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [perfilData, setPerfilData] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [perfilTab, setPerfilTab] = useState("resumen");

  const abrirPerfil = async (u) => {
    setModalPerfil(true);
    setPerfilData(null);
    setPerfilTab("resumen");
    setLoadingPerfil(true);
    try {
      const r = await fetch(`/api/equipos/${u.id}`);
      const d = await r.json();
      if (d.ok) setPerfilData(d);
    } catch(_){}
    setLoadingPerfil(false);
  };

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/equipos");
      const d = await r.json();
      if (d.ok) setData(d);
    } catch(_){}
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const abrirEditar = (u) => {
    setEditando(u);
    setFormEdit({ rol: u.rol||"", area: u.area||"", activo: u.activo });
    setModalEditar(true);
  };

  const guardarEditar = async () => {
    setSaving(true);
    try {
      await fetch("/api/equipos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: editando.id, ...formEdit }),
      });
      setModalEditar(false);
      await cargar();
    } catch(_){}
    setSaving(false);
  };

  const fe = (v) => setFormEdit(p => ({...p,...v}));

  const TABS = [
    ["comercial",  "Comercial",  "bi-graph-up-arrow"],
    ["contenido",  "Marketing",  "bi-megaphone"],
    ["atencion",   "Soporte",    "bi-headset"],
  ];

  const miembros = data.porArea[tab] || [];
  const meta = AREA_META[tab];

  // KPIs del área
  const totalActivos = miembros.filter(u => u.activo).length;
  const mrrTotal = miembros.reduce((s,u) => s + (Number(u.mrr_generado)||0), 0);
  const tasaPromedio = miembros.length > 0
    ? (miembros.reduce((s,u) => s + (Number(u.tasa_cierre)||0), 0) / miembros.length).toFixed(0)
    : 0;
  const leadsActivos = miembros.reduce((s,u) => s + (Number(u.leads_activos)||0), 0);

  return (
    <div className="view-anim">
      <div className="vh">
        <div>
          <div className="vh-title">Equipo</div>
          <div className="vh-sub">Áreas y personal · {data.usuarios?.length || 0} personas en total</div>
        </div>
      </div>

      {/* Tabs de área */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {loading ? <Cargando texto="Cargando equipo..." /> : (
        <>
          {/* KPIs del área */}
          <div className="g4" style={{marginBottom:"0.9rem"}}>
            <div className="kpi">
              <div className="kpi-ico" style={{background:meta?.bg}}>
                <i className={`bi ${meta?.icon}`} style={{color:meta?.color}} />
              </div>
              <div className="kpi-val">{totalActivos}</div>
              <div className="kpi-lbl">Activos</div>
            </div>
            {tab === "comercial" && <>
              <div className="kpi">
                <div className="kpi-ico" style={{background:"var(--em-pale)"}}><i className="bi bi-graph-up" style={{color:"var(--em-d)"}} /></div>
                <div className="kpi-val" style={{fontSize:"1.3rem"}}>{mrrTotal > 0 ? `$${mrrTotal.toLocaleString("es-AR")}` : "—"}</div>
                <div className="kpi-lbl">MRR generado</div>
              </div>
              <div className="kpi">
                <div className="kpi-ico" style={{background:"var(--accent-pale)"}}><i className="bi bi-percent" style={{color:"var(--accent)"}} /></div>
                <div className="kpi-val">{tasaPromedio}%</div>
                <div className="kpi-lbl">Tasa cierre prom.</div>
              </div>
              <div className="kpi">
                <div className="kpi-ico" style={{background:"var(--blue-bg)"}}><i className="bi bi-person-plus" style={{color:"var(--blue)"}} /></div>
                <div className="kpi-val">{leadsActivos}</div>
                <div className="kpi-lbl">Leads activos</div>
              </div>
            </>}
            {tab === "atencion" && <>
              <div className="kpi">
                <div className="kpi-ico" style={{background:"var(--red-bg)"}}><i className="bi bi-ticket" style={{color:"var(--red)"}} /></div>
                <div className="kpi-val">{miembros.reduce((s,u)=>s+(Number(u.tickets_abiertos)||0),0)}</div>
                <div className="kpi-lbl">Tickets abiertos</div>
              </div>
              <div className="kpi">
                <div className="kpi-ico" style={{background:"var(--em-pale)"}}><i className="bi bi-check-circle" style={{color:"var(--em-d)"}} /></div>
                <div className="kpi-val">{miembros.reduce((s,u)=>s+(Number(u.tickets_resueltos)||0),0)}</div>
                <div className="kpi-lbl">Resueltos total</div>
              </div>
              <div className="kpi">
                <div className="kpi-ico" style={{background:"var(--accent-pale)"}}><i className="bi bi-star" style={{color:"var(--accent)"}} /></div>
                <div className="kpi-val">{miembros.length > 0 ? (miembros.reduce((s,u)=>s+(Number(u.satisfaccion_avg)||0),0)/miembros.length).toFixed(1) : "—"}</div>
                <div className="kpi-lbl">Satisfacción prom.</div>
              </div>
            </>}
          </div>

          {/* Lista de miembros */}
          {miembros.length === 0 ? (
            <div className="card" style={{padding:"2.5rem",textAlign:"center",color:"var(--muted)"}}>
              <i className={`bi ${meta?.icon}`} style={{fontSize:"1.5rem",display:"block",marginBottom:"0.5rem",color:meta?.color}} />
              No hay personal en esta área todavía.
              <div style={{fontSize:"0.75rem",marginTop:"0.4rem"}}>
                Creá usuarios en Sistema y asignales el área correspondiente.
              </div>
            </div>
          ) : (
            <div className="card">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Rol</th>
                    {tab === "comercial" && <><th>Leads activos</th><th>MRR generado</th><th>Tasa cierre</th></>}
                    {tab === "atencion" && <><th>Tickets abiertos</th><th>Resueltos</th><th>Satisfacción</th></>}
                    {tab === "contenido" && <><th>Último acceso</th></>}
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {miembros.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <Av letra={u.nombre?.[0]} size={30} />
                          <div>
                            <div style={{fontWeight:600,fontSize:"0.8rem"}}>{u.nombre||"—"}</div>
                            <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="bdg bdg-blue" style={{color:ROL_META[u.rol]?.color,background:"var(--bg)"}}>
                          {ROL_META[u.rol]?.label || u.rol}
                        </span>
                      </td>

                      {tab === "comercial" && <>
                        <td style={{fontSize:"0.78rem",fontWeight:600,color:"var(--blue)"}}>{u.leads_activos||0}</td>
                        <td style={{fontSize:"0.78rem",fontWeight:600}}>{u.mrr_generado?`$${Number(u.mrr_generado).toLocaleString("es-AR")}`:"—"}</td>
                        <td style={{fontSize:"0.78rem",fontWeight:600,color:"var(--em-d)"}}>{u.tasa_cierre||0}%</td>
                      </>}
                      {tab === "atencion" && <>
                        <td style={{fontSize:"0.78rem",fontWeight:600,color:"var(--red)"}}>{u.tickets_abiertos||0}</td>
                        <td style={{fontSize:"0.78rem",fontWeight:600,color:"var(--em-d)"}}>{u.tickets_resueltos||0}</td>
                        <td style={{fontSize:"0.78rem",fontWeight:600,color:"var(--accent)"}}>{u.satisfaccion_avg||"—"}</td>
                      </>}
                      {tab === "contenido" && <>
                        <td style={{fontSize:"0.72rem",color:"var(--muted)"}}>{u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString("es-AR") : "Nunca"}</td>
                      </>}

                      <td>
                        <span className={`bdg ${u.activo ? "bdg-em" : "bdg-red"}`}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div style={{display:"flex",gap:4}}>
                          <button className="btn btn-xs btn-em" onClick={() => abrirPerfil(u)}>
                            <i className="bi bi-person-lines-fill" /> Ver perfil
                          </button>
                          <button className="btn btn-xs btn-out" onClick={() => abrirEditar(u)}>
                            <i className="bi bi-pencil" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══ MODAL PERFIL EMPLEADO ══ */}
      {modalPerfil && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:"1rem"}}
          onClick={e=>e.target===e.currentTarget&&setModalPerfil(false)}>
          <div style={{background:"var(--white)",borderRadius:"var(--r)",width:"100%",maxWidth:860,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 80px rgba(15,23,42,.25)"}}>

            {/* Header del perfil */}
            {loadingPerfil ? (
              <div style={{padding:"3rem",textAlign:"center",color:"var(--muted)"}}>
                <i className="bi bi-hourglass-split" style={{fontSize:"1.5rem",display:"block",marginBottom:8}} />
                Cargando perfil…
              </div>
            ) : perfilData ? (() => {
              const { usuario, leads, actividades, conversaciones, kpiMes, actividadPorTipo, metas } = perfilData;
              const TIPO_ACT = { llamada:{icon:"bi-telephone",color:"var(--pr)",label:"Llamada"}, email:{icon:"bi-envelope",color:"var(--accent)",label:"Email"}, whatsapp:{icon:"bi-whatsapp",color:"#25D366",label:"WhatsApp"}, reunion:{icon:"bi-calendar-check",color:"var(--em-d)",label:"Reunión"}, nota:{icon:"bi-sticky",color:"var(--muted)",label:"Nota"} };
              const CANAL_COLOR = { whatsapp:"#25D366", instagram:"#E1306C", facebook:"#1877F2", email:"var(--accent)", web:"var(--pr)" };
              const ESTADO_LEAD_CLS = { nuevo:"bdg-blue", contactado:"bdg-amber", demo:"bdg-pine", propuesta:"bdg-gold", cerrado:"bdg-em", perdido:"bdg-red" };

              return (
                <>
                  {/* Cabecera */}
                  <div style={{padding:"1.2rem 1.4rem",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"1rem",background:"var(--bg)",flexShrink:0}}>
                    <Av letra={usuario.nombre?.[0]} size={48} fontSize="1.2rem" />
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.15rem",fontWeight:600,color:"var(--text)"}}>{usuario.nombre}</div>
                      <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:1}}>{usuario.email}</div>
                      <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                        <span className="bdg bdg-blue" style={{fontSize:"0.62rem"}}>{ROL_META[usuario.rol]?.label || usuario.rol}</span>
                        <span className={`bdg ${usuario.activo?"bdg-em":"bdg-red"}`} style={{fontSize:"0.62rem"}}>{usuario.activo?"Activo":"Inactivo"}</span>
                        {usuario.ultimo_acceso && <span className="bdg bdg-moon" style={{fontSize:"0.62rem"}}>Último acceso: {new Date(usuario.ultimo_acceso).toLocaleDateString("es-AR")}</span>}
                      </div>
                    </div>
                    <button onClick={()=>setModalPerfil(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:"1.1rem",padding:"0.3rem"}}><i className="bi bi-x-lg" /></button>
                  </div>

                  {/* KPIs rápidos */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,borderBottom:"1px solid var(--border)",flexShrink:0}}>
                    {[
                      ["bi-person-plus","var(--blue-bg)","var(--blue)",kpiMes?.leads_activos||0,"Leads activos"],
                      ["bi-check-circle","var(--em-pale)","var(--em-d)",kpiMes?.leads_cerrados||0,"Cerrados este mes"],
                      ["bi-chat-dots","var(--accent-pale)","var(--accent)",conversaciones?.length||0,"Conversaciones"],
                      ["bi-lightning-charge","var(--pr-pale)","var(--pr)",actividades?.length||0,"Actividades"],
                    ].map(([ico,bg,color,val,lbl],i)=>(
                      <div key={i} style={{padding:"0.8rem 1rem",borderRight:i<3?"1px solid var(--border)":"none",textAlign:"center"}}>
                        <div style={{width:28,height:28,borderRadius:7,background:bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 0.4rem"}}>
                          <i className={`bi ${ico}`} style={{color,fontSize:"0.82rem"}} />
                        </div>
                        <div style={{fontSize:"1.4rem",fontWeight:700,color:"var(--text)",lineHeight:1}}>{val}</div>
                        <div style={{fontSize:"0.62rem",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>{lbl}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tabs */}
                  <div style={{display:"flex",gap:0,borderBottom:"1px solid var(--border)",flexShrink:0,background:"var(--white)"}}>
                    {[["resumen","Resumen","bi-grid-1x2"],["leads","Leads","bi-people"],["conversaciones","Conversaciones","bi-chat-dots"],["actividad","Actividad","bi-journal-text"]].map(([id,label,icon])=>(
                      <button key={id} onClick={()=>setPerfilTab(id)}
                        style={{padding:"0.6rem 1rem",border:"none",background:"none",fontFamily:"inherit",fontSize:"0.78rem",fontWeight:perfilTab===id?700:500,color:perfilTab===id?"var(--pr)":"var(--sub)",cursor:"pointer",borderBottom:perfilTab===id?"2px solid var(--pr)":"2px solid transparent",display:"flex",alignItems:"center",gap:5,marginBottom:-1}}>
                        <i className={`bi ${icon}`} />{label}
                      </button>
                    ))}
                  </div>

                  {/* Contenido tabs */}
                  <div style={{flex:1,overflowY:"auto",padding:"1rem 1.4rem"}}>

                    {/* TAB RESUMEN */}
                    {perfilTab==="resumen" && (
                      <div>
                        {/* Actividad por tipo */}
                        <div style={{marginBottom:"1rem"}}>
                          <div style={{fontSize:"0.65rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.6rem"}}>Actividad últimos 30 días</div>
                          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                            {actividadPorTipo?.length===0 && <div style={{fontSize:"0.78rem",color:"var(--muted)"}}>Sin actividad registrada</div>}
                            {actividadPorTipo?.map((a,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"0.4rem 0.7rem",background:"var(--bg)",borderRadius:"var(--r-sm)",border:"1px solid var(--border)"}}>
                                <i className={`bi ${TIPO_ACT[a.tipo]?.icon||"bi-dot"}`} style={{color:TIPO_ACT[a.tipo]?.color,fontSize:"0.85rem"}} />
                                <span style={{fontSize:"0.75rem",fontWeight:600}}>{a.total}</span>
                                <span style={{fontSize:"0.72rem",color:"var(--muted)"}}>{TIPO_ACT[a.tipo]?.label||a.tipo}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Metas del mes */}
                        {metas && (
                          <div style={{marginBottom:"1rem"}}>
                            <div style={{fontSize:"0.65rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.6rem"}}>Metas del mes</div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.6rem"}}>
                              {[
                                ["Leads",kpiMes?.leads_activos||0,metas.meta_leads],
                                ["Cierres",kpiMes?.leads_cerrados||0,metas.meta_cierres],
                                ["MRR $",kpiMes?.mrr_cerrado_mes||0,metas.meta_mrr],
                              ].map(([lbl,real,meta],i)=>{
                                const pct = meta>0 ? Math.min(100,Math.round((real/meta)*100)) : 0;
                                return (
                                  <div key={i} style={{background:"var(--bg)",borderRadius:"var(--r-sm)",border:"1px solid var(--border)",padding:"0.65rem 0.8rem"}}>
                                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.4rem"}}>
                                      <span style={{fontSize:"0.72rem",color:"var(--muted)"}}>{lbl}</span>
                                      <span style={{fontSize:"0.72rem",fontWeight:700,color:pct>=100?"var(--em-d)":"var(--text)"}}>{pct}%</span>
                                    </div>
                                    <div style={{height:5,background:"var(--border2)",borderRadius:3,overflow:"hidden"}}>
                                      <div style={{height:"100%",width:`${pct}%`,background:pct>=100?"var(--em)":"var(--pr)",borderRadius:3,transition:"width .3s"}} />
                                    </div>
                                    <div style={{fontSize:"0.67rem",color:"var(--muted)",marginTop:"0.3rem"}}>{real} / {meta}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Últimas 5 actividades */}
                        <div>
                          <div style={{fontSize:"0.65rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.6rem"}}>Actividad reciente</div>
                          {actividades?.slice(0,5).length===0 ? <div style={{fontSize:"0.78rem",color:"var(--muted)"}}>Sin actividades</div>
                          : actividades?.slice(0,5).map((a,i)=>(
                            <div key={i} style={{display:"flex",gap:"0.6rem",padding:"0.55rem 0",borderBottom:"1px solid var(--border)"}}>
                              <div style={{width:26,height:26,borderRadius:6,background:"var(--bg)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                <i className={`bi ${TIPO_ACT[a.tipo]?.icon||"bi-dot"}`} style={{color:TIPO_ACT[a.tipo]?.color,fontSize:"0.78rem"}} />
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:"0.78rem",color:"var(--text)"}}>{a.descripcion||TIPO_ACT[a.tipo]?.label||a.tipo}</div>
                                {a.lead_nombre && <div style={{fontSize:"0.67rem",color:"var(--accent)",fontWeight:600}}>→ {a.lead_nombre}{a.lead_empresa?` · ${a.lead_empresa}`:""}</div>}
                                <div style={{fontSize:"0.65rem",color:"var(--muted)"}}>{new Date(a.fecha_actividad).toLocaleDateString("es-AR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB LEADS */}
                    {perfilTab==="leads" && (
                      <div>
                        <div style={{fontSize:"0.65rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.6rem"}}>Leads asignados ({leads?.length||0})</div>
                        {leads?.length===0 ? <div style={{padding:"2rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}><i className="bi bi-people" style={{fontSize:"1.5rem",display:"block",marginBottom:6}} />Sin leads asignados</div>
                        : (
                          <table className="tbl">
                            <thead><tr><th>Contacto</th><th>Empresa</th><th>Estado</th><th>MRR Est.</th><th>Última act.</th></tr></thead>
                            <tbody>
                              {leads.map(l=>(
                                <tr key={l.id}>
                                  <td style={{fontWeight:600,fontSize:"0.79rem"}}>{l.nombre}</td>
                                  <td style={{fontSize:"0.75rem",color:"var(--muted)"}}>{l.empresa||"—"}</td>
                                  <td><span className={`bdg ${ESTADO_LEAD_CLS[l.estado]||"bdg-moon"}`} style={{fontSize:"0.62rem"}}>{l.estado}</span></td>
                                  <td style={{fontSize:"0.78rem",fontWeight:600}}>{l.valor_mrr_estimado?`$${Number(l.valor_mrr_estimado).toLocaleString("es-AR")}`:"—"}</td>
                                  <td style={{fontSize:"0.7rem",color:"var(--muted)"}}>{new Date(l.actualizado_en).toLocaleDateString("es-AR")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    {/* TAB CONVERSACIONES */}
                    {perfilTab==="conversaciones" && (
                      <div>
                        <div style={{fontSize:"0.65rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.6rem"}}>Conversaciones asignadas ({conversaciones?.length||0})</div>
                        {conversaciones?.length===0 ? <div style={{padding:"2rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}><i className="bi bi-chat-dots" style={{fontSize:"1.5rem",display:"block",marginBottom:6}} />Sin conversaciones asignadas</div>
                        : conversaciones.map((c,i)=>(
                          <div key={c.id} style={{display:"flex",alignItems:"center",gap:"0.7rem",padding:"0.6rem 0",borderBottom:"1px solid var(--border)"}}>
                            <Av letra={c.contacto_nombre?.[0]||"?"} size={32} />
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:600,fontSize:"0.8rem"}}>{c.contacto_nombre||"Sin nombre"}</div>
                              <div style={{fontSize:"0.67rem",color:"var(--muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.ultimo_mensaje||"Sin mensajes"}</div>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}>
                              <span style={{fontSize:"0.62rem",fontWeight:700,padding:"1px 7px",borderRadius:9,background:CANAL_COLOR[c.canal]?`${CANAL_COLOR[c.canal]}22`:"var(--bg)",color:CANAL_COLOR[c.canal]||"var(--muted)",border:`1px solid ${CANAL_COLOR[c.canal]||"var(--border)"}40`}}>{c.canal}</span>
                              <span style={{fontSize:"0.62rem",color:"var(--muted)"}}>{c.ultimo_mensaje_at?new Date(c.ultimo_mensaje_at).toLocaleDateString("es-AR"):"—"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TAB ACTIVIDAD */}
                    {perfilTab==="actividad" && (
                      <div>
                        <div style={{fontSize:"0.65rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.6rem"}}>Historial completo ({actividades?.length||0} registros)</div>
                        {actividades?.length===0 ? <div style={{padding:"2rem",textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}><i className="bi bi-journal-text" style={{fontSize:"1.5rem",display:"block",marginBottom:6}} />Sin actividades registradas</div>
                        : actividades.map((a,i)=>(
                          <div key={a.id} style={{display:"flex",gap:"0.65rem",padding:"0.6rem 0",borderBottom:"1px solid var(--border)"}}>
                            <div style={{width:28,height:28,borderRadius:7,background:"var(--bg)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <i className={`bi ${TIPO_ACT[a.tipo]?.icon||"bi-dot"}`} style={{color:TIPO_ACT[a.tipo]?.color,fontSize:"0.82rem"}} />
                            </div>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                                <span style={{fontSize:"0.7rem",fontWeight:700,color:TIPO_ACT[a.tipo]?.color}}>{TIPO_ACT[a.tipo]?.label||a.tipo}</span>
                                {a.lead_nombre && <span style={{fontSize:"0.67rem",color:"var(--accent)"}}>→ {a.lead_nombre}</span>}
                              </div>
                              {a.descripcion && <div style={{fontSize:"0.78rem",color:"var(--text)",lineHeight:1.4}}>{a.descripcion}</div>}
                              {a.proxima_accion && <div style={{fontSize:"0.67rem",color:"var(--em-d)",marginTop:2}}>Próxima acción: {a.proxima_accion}</div>}
                              <div style={{fontSize:"0.65rem",color:"var(--muted)",marginTop:2}}>{new Date(a.fecha_actividad).toLocaleDateString("es-AR",{weekday:"short",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </>
              );
            })() : (
              <div style={{padding:"3rem",textAlign:"center",color:"var(--muted)"}}>
                <i className="bi bi-exclamation-circle" style={{fontSize:"1.5rem",display:"block",marginBottom:8}} />
                No se pudo cargar el perfil
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal editar miembro */}
      {modalEditar && editando && (
        <Modal title={`Editar — ${editando.nombre}`} onClose={() => setModalEditar(false)}>
          <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.7rem"}}>
            <div className="fi-row">
              <div className="fg">
                <label className="fl">Rol</label>
                <select className="fi" value={formEdit.rol} onChange={e=>fe({rol:e.target.value})}>
                  <option value="vendedor">Vendedor</option>
                  <option value="cm">Community Manager</option>
                  <option value="soporte">Soporte</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="fg">
                <label className="fl">Área</label>
                <select className="fi" value={formEdit.area} onChange={e=>fe({area:e.target.value})}>
                  <option value="">Sin área</option>
                  <option value="comercial">Comercial</option>
                  <option value="contenido">Marketing</option>
                  <option value="atencion">Soporte</option>
                  <option value="administracion">Administración</option>
                </select>
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.5rem 0",borderTop:"1px solid var(--border)"}}>
              <div>
                <div style={{fontSize:"0.8rem",fontWeight:600}}>Estado</div>
                <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>Activo / Inactivo en el sistema</div>
              </div>
              <div className={`tog${formEdit.activo?" on":""}`} onClick={()=>fe({activo:formEdit.activo?0:1})}>
                <div className="tog-k" />
              </div>
            </div>
          </div>
          <ModalFooter onCancel={()=>setModalEditar(false)} onConfirm={guardarEditar} saving={saving} labelConfirm="Guardar cambios" />
        </Modal>
      )}
    </div>
  );
}

/* ══ SOPORTE ══ */
const PRIORIDAD_META = {
  urgente: { cls:"bdg-urgente", label:"Urgente" },
  alta:    { cls:"bdg-alta",    label:"Alta" },
  media:   { cls:"bdg-media",   label:"Media" },
  baja:    { cls:"bdg-baja",    label:"Baja" },
};
const ESTADO_TICKET = {
  nuevo:     { label:"Nuevo",     cls:"bdg-blue" },
  en_curso:  { label:"En curso",  cls:"bdg-amber" },
  esperando: { label:"Esperando", cls:"bdg-moon" },
  resuelto:  { label:"Resuelto",  cls:"bdg-em" },
  cerrado:   { label:"Cerrado",   cls:"bdg-moon" },
};
const TICKET_VACIO = { tenant_id:"", canal:"email", categoria:"otro", prioridad:"media", titulo:"", descripcion:"", asignado_a:"" };

function ViewSoporte({ session }) {
  const [tab, setTab] = useState("tickets");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketActivo, setTicketActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(TICKET_VACIO);
  const [saving, setSaving] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [tenants, setTenants] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const msgsRef = useRef(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.append("estado", filtroEstado);
      if (filtroPrioridad) params.append("prioridad", filtroPrioridad);
      const r = await fetch(`/api/soporte/tickets?${params}`);
      const d = await r.json();
      if (Array.isArray(d)) setTickets(d);
    } catch(_){}
    setLoading(false);
  };

  const cargarMensajes = async (ticket) => {
    setTicketActivo(ticket);
    setTab("detalle");
    setLoadingMsg(true);
    try {
      const r = await fetch(`/api/soporte/mensajes?ticket_id=${ticket.id}`);
      const d = await r.json();
      if (Array.isArray(d)) setMensajes(d);
    } catch(_){}
    setLoadingMsg(false);
    setTimeout(() => msgsRef.current?.scrollTo(0, 99999), 100);
  };

  useEffect(() => {
    cargar();
    // cargar tenants y agentes para el modal
    fetch("/api/tenants").then(r=>r.json()).then(d=>{ if(d.ok) setTenants(d.tenants); }).catch(()=>{});
    fetch("/api/usuarios").then(r=>r.json()).then(d=>{ if(d.ok) setAgentes(d.usuarios.filter(u=>u.activo&&["superadmin","admin"].includes(u.rol))); }).catch(()=>{});
  }, [filtroEstado, filtroPrioridad]);

  const crearTicket = async () => {
    if (!form.titulo) return;
    setSaving(true);
    try {
      const r = await fetch("/api/soporte/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tenant_id: form.tenant_id || null, asignado_a: form.asignado_a || null }),
      });
      const d = await r.json();
      if (d.ok) { setModal(false); setForm(TICKET_VACIO); await cargar(); }
    } catch(_){}
    setSaving(false);
  };

  const cambiarEstado = async (id, estado) => {
    try { await fetch("/api/soporte/tickets",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,estado})}); await cargar(); } catch(_){}
  };

  const cambiarAsignado = async (id, asignado_a) => {
    try { await fetch("/api/soporte/tickets",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,asignado_a})}); await cargar(); if(ticketActivo?.id===id) setTicketActivo(p=>({...p,asignado_a})); } catch(_){}
  };

  const enviarMensaje = async () => {
    if (!texto.trim() || !ticketActivo) return;
    setEnviando(true);
    try {
      await fetch("/api/soporte/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketActivo.id, direccion: "saliente", contenido: texto }),
      });
      setTexto("");
      await cargarMensajes(ticketActivo);
    } catch(_){}
    setEnviando(false);
  };

  const f = (v) => setForm(p=>({...p,...v}));

  // KPIs
  const urgentes  = tickets.filter(t=>t.prioridad==="urgente"&&!["resuelto","cerrado"].includes(t.estado)).length;
  const nuevos    = tickets.filter(t=>t.estado==="nuevo").length;
  const enCurso   = tickets.filter(t=>t.estado==="en_curso").length;
  const resueltos = tickets.filter(t=>t.estado==="resuelto").length;

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Soporte</div><div className="vh-sub">Tickets de atención a clientes</div></div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <button className="btn btn-out btn-sm" onClick={cargar}><i className="bi bi-arrow-clockwise" /></button>
          <button className="btn btn-em btn-sm" onClick={()=>setModal(true)}><i className="bi bi-plus-lg" /> Nuevo ticket</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="g4" style={{marginBottom:"0.9rem"}}>
        {[["bi-exclamation-circle","var(--red-bg)","var(--red)",urgentes,"Urgentes"],["bi-inbox","var(--blue-bg)","var(--blue)",nuevos,"Nuevos"],["bi-hourglass-split","var(--amber-bg)","var(--amber)",enCurso,"En curso"],["bi-check-circle","var(--em-pale)","var(--em-d)",resueltos,"Resueltos"]].map(([ico,bg,color,val,lbl],i)=>(
          <div key={i} className="kpi"><div className="kpi-ico" style={{background:bg}}><i className={`bi ${ico}`} style={{color}} /></div><div className="kpi-val">{val}</div><div className="kpi-lbl">{lbl}</div></div>
        ))}
      </div>

      <Tabs tabs={[["tickets","Tickets","bi-headset"],["detalle","Conversación","bi-chat-dots"]]} active={tab} onChange={setTab} />

      {tab==="tickets" && (
        <>
          {/* Filtros */}
          <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.7rem",flexWrap:"wrap",alignItems:"center"}}>
            <div style={{display:"flex",gap:3}}>
              {["","nuevo","en_curso","esperando","resuelto","cerrado"].map(e=>(
                <button key={e} onClick={()=>setFiltroEstado(e)} className="btn btn-xs"
                  style={{background:filtroEstado===e?"var(--pr)":"var(--bg)",color:filtroEstado===e?"#fff":"var(--sub)",border:`1px solid ${filtroEstado===e?"var(--pr)":"var(--border)"}`}}>
                  {e===""?"Todos":ESTADO_TICKET[e]?.label}
                </button>
              ))}
            </div>
            <div style={{marginLeft:"auto",display:"flex",gap:3}}>
              {["","urgente","alta","media","baja"].map(p=>(
                <button key={p} onClick={()=>setFiltroPrioridad(p)} className="btn btn-xs"
                  style={{background:filtroPrioridad===p?"var(--pr)":"var(--bg)",color:filtroPrioridad===p?"#fff":"var(--sub)",border:`1px solid ${filtroPrioridad===p?"var(--pr)":"var(--border)"}`}}>
                  {p===""?"Prioridad":PRIORIDAD_META[p]?.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            {loading ? <Cargando texto="Cargando tickets..." /> : (
              <table className="tbl">
                <thead><tr><th>Cliente</th><th>Título</th><th>Canal</th><th>Categoría</th><th>Prioridad</th><th>Estado</th><th>Asignado a</th><th>Creado</th><th></th></tr></thead>
                <tbody>
                  {tickets.length===0 ? <tr><td colSpan={9} style={{textAlign:"center",padding:"2.5rem",color:"var(--muted)"}}><i className="bi bi-headset" style={{fontSize:"1.5rem",display:"block",marginBottom:"0.5rem"}} />No hay tickets</td></tr>
                  : tickets.map(t=>(
                    <tr key={t.id} onClick={()=>cargarMensajes(t)}>
                      <td style={{fontSize:"0.75rem",fontWeight:600}}>{t.tenant_nombre||<span style={{color:"var(--muted)"}}>—</span>}</td>
                      <td style={{fontSize:"0.78rem",maxWidth:220}}>
                        <div style={{fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.titulo}</div>
                      </td>
                      <td><span style={{display:"flex",alignItems:"center",gap:4,fontSize:"0.72rem"}}><i className={`bi ${CANAL_ICON[t.canal]||"bi-chat"}`} style={{color:CANAL_COLOR[t.canal]}} />{t.canal}</span></td>
                      <td style={{fontSize:"0.72rem",color:"var(--text2)"}}>{t.categoria}</td>
                      <td><span className={`bdg ${PRIORIDAD_META[t.prioridad]?.cls}`}>{PRIORIDAD_META[t.prioridad]?.label}</span></td>
                      <td onClick={e=>e.stopPropagation()}>
                        <select value={t.estado} onChange={e=>cambiarEstado(t.id,e.target.value)}
                          style={{padding:"0.22rem 0.5rem",borderRadius:"var(--r-sm)",border:"1px solid var(--border2)",fontSize:"0.72rem",fontFamily:"inherit",background:"var(--white)",cursor:"pointer"}}>
                          {Object.entries(ESTADO_TICKET).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                      <td onClick={e=>e.stopPropagation()}>
                        <select value={t.asignado_a||""} onChange={e=>cambiarAsignado(t.id,e.target.value||null)}
                          style={{padding:"0.22rem 0.5rem",borderRadius:"var(--r-sm)",border:"1px solid var(--border2)",fontSize:"0.72rem",fontFamily:"inherit",background:"var(--white)",cursor:"pointer",maxWidth:120}}>
                          <option value="">Sin asignar</option>
                          {agentes.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                      </td>
                      <td style={{fontSize:"0.72rem",color:"var(--muted)"}}>{new Date(t.creado_en).toLocaleDateString("es-AR")}</td>
                      <td onClick={e=>e.stopPropagation()}>
                        <button className="btn btn-xs btn-out" onClick={()=>cargarMensajes(t)}><i className="bi bi-chat-dots" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab==="detalle" && (
        !ticketActivo ? (
          <div className="card" style={{padding:"2.5rem",textAlign:"center",color:"var(--muted)"}}>
            <i className="bi bi-chat-dots" style={{fontSize:"1.5rem",display:"block",marginBottom:"0.5rem"}} />
            Seleccioná un ticket de la pestaña Tickets para ver la conversación
          </div>
        ) : (
          <div style={{display:"flex",gap:"0.9rem",height:"calc(100vh - 280px)"}}>
            {/* Info ticket */}
            <div className="card" style={{width:260,flexShrink:0,overflow:"auto"}}>
              <div className="ch"><i className="bi bi-ticket-detailed" style={{color:"var(--pr)"}} /><span className="ch-title">#{ticketActivo.id}</span></div>
              <div className="cb" style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
                <div><div style={{fontSize:"0.65rem",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Título</div><div style={{fontSize:"0.8rem",fontWeight:600}}>{ticketActivo.titulo}</div></div>
                {[["Cliente",ticketActivo.tenant_nombre],["Canal",ticketActivo.canal],["Categoría",ticketActivo.categoria]].map(([l,v])=>(
                  <div key={l}><div style={{fontSize:"0.65rem",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{l}</div><div style={{fontSize:"0.78rem"}}>{v||"—"}</div></div>
                ))}
                <div><div style={{fontSize:"0.65rem",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Prioridad</div><span className={`bdg ${PRIORIDAD_META[ticketActivo.prioridad]?.cls}`}>{PRIORIDAD_META[ticketActivo.prioridad]?.label}</span></div>
                <div><div style={{fontSize:"0.65rem",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Estado</div>
                  <select value={ticketActivo.estado} onChange={e=>{cambiarEstado(ticketActivo.id,e.target.value);setTicketActivo(p=>({...p,estado:e.target.value}));}}
                    style={{width:"100%",padding:"0.35rem 0.5rem",borderRadius:"var(--r-sm)",border:"1px solid var(--border2)",fontSize:"0.78rem",fontFamily:"inherit",background:"var(--white)"}}>
                    {Object.entries(ESTADO_TICKET).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div><div style={{fontSize:"0.65rem",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Agente</div>
                  <select value={ticketActivo.asignado_a||""} onChange={e=>cambiarAsignado(ticketActivo.id,e.target.value||null)}
                    style={{width:"100%",padding:"0.35rem 0.5rem",borderRadius:"var(--r-sm)",border:"1px solid var(--border2)",fontSize:"0.78rem",fontFamily:"inherit",background:"var(--white)"}}>
                    <option value="">Sin asignar</option>
                    {agentes.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                {ticketActivo.descripcion && <div style={{padding:"0.5rem",background:"var(--bg)",borderRadius:"var(--r-sm)",fontSize:"0.75rem",color:"var(--text2)"}}>{ticketActivo.descripcion}</div>}
              </div>
            </div>

            {/* Chat del ticket */}
            <div className="card" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div className="ch"><i className="bi bi-chat-dots" style={{color:"var(--pr)"}} /><span className="ch-title">Conversación</span><div className="ch-act"><button className="btn btn-xs btn-out" onClick={()=>setTab("tickets")}><i className="bi bi-arrow-left" /> Volver</button></div></div>
              <div className="chat-msgs" ref={msgsRef} style={{flex:1}}>
                {loadingMsg ? <div style={{textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Cargando...</div>
                : mensajes.length===0 ? <div style={{textAlign:"center",color:"var(--muted)",fontSize:"0.78rem"}}>Sin mensajes todavía</div>
                : mensajes.map(m=>(
                  <div key={m.id}>
                    <div className={`msg ${m.direccion==="saliente"?"msg-out":"msg-in"}`}>
                      {m.contenido}
                      <div className="msg-t">
                        {new Date(m.creado_en).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}
                        {m.direccion==="saliente" && <span style={{marginLeft:4}}>{m.enviado_por_nombre||"Vos"}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-input-bar">
                <input className="chat-inp" placeholder="Escribir respuesta…" value={texto} onChange={e=>setTexto(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); enviarMensaje(); } }} />
                <button className="btn btn-em btn-sm" onClick={enviarMensaje} disabled={enviando||!texto.trim()}><i className="bi bi-send" /></button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Modal nuevo ticket */}
      {modal && (
        <Modal title="Nuevo ticket" onClose={()=>setModal(false)}>
          <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.7rem",maxHeight:"70vh",overflowY:"auto"}}>
            <div className="fg"><label className="fl">Título *</label><input className="fi" value={form.titulo} onChange={e=>f({titulo:e.target.value})} placeholder="Descripción breve del problema" /></div>
            <div className="fi-row">
              <div className="fg"><label className="fl">Cliente (tenant)</label>
                <select className="fi" value={form.tenant_id} onChange={e=>f({tenant_id:e.target.value})}>
                  <option value="">Sin asignar</option>
                  {tenants.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div className="fg"><label className="fl">Canal</label>
                <select className="fi" value={form.canal} onChange={e=>f({canal:e.target.value})}>
                  <option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="web">Web</option><option value="chat">Chat</option>
                </select>
              </div>
            </div>
            <div className="fi-row">
              <div className="fg"><label className="fl">Categoría</label>
                <select className="fi" value={form.categoria} onChange={e=>f({categoria:e.target.value})}>
                  <option value="tecnico">Técnico</option><option value="facturacion">Facturación</option><option value="capacitacion">Capacitación</option><option value="otro">Otro</option>
                </select>
              </div>
              <div className="fg"><label className="fl">Prioridad</label>
                <select className="fi" value={form.prioridad} onChange={e=>f({prioridad:e.target.value})}>
                  <option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
            <div className="fg"><label className="fl">Agente asignado</label>
              <select className="fi" value={form.asignado_a} onChange={e=>f({asignado_a:e.target.value})}>
                <option value="">Sin asignar</option>
                {agentes.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Descripción</label><textarea className="fi" rows={3} value={form.descripcion} onChange={e=>f({descripcion:e.target.value})} style={{resize:"vertical"}} /></div>
          </div>
          <ModalFooter onCancel={()=>setModal(false)} onConfirm={crearTicket} saving={saving} labelConfirm="Crear ticket" />
        </Modal>
      )}
    </div>
  );
}

/* ══ VISTAS PLACEHOLDER ══ */

function ViewModulos() {
  const modulos = [["bi-grid-1x2","Dashboard IA","Estadísticas e inteligencia analítica"],["bi-people","CRM / Clientes","Gestión de clientes y leads"],["bi-whatsapp","WhatsApp Bot","Bot con IA y memoria de contexto"],["bi-calendar-check","Agenda / Turnos","Turnos inteligentes con predicción"],["bi-receipt","Facturación","Facturas y presupuestos con IA"],["bi-bell","Notificaciones","Comunicaciones automatizadas"],["bi-bar-chart-line","Estadísticas","Análisis en lenguaje natural"],["bi-geo-alt","Mapas","Geolocalización y seguimiento"],["bi-building","Reservas / Hotel","Gestión de habitaciones y reservas"],["bi-heart-pulse","Historia Clínica","Pacientes y turnos médicos"],["bi-house","Propiedades","Gestión inmobiliaria con mapa"],["bi-truck","Distribución","Rutas y logística inteligente"]];
  return (
    <div className="view-anim">
      <div className="vh"><div><div className="vh-title">Módulos</div><div className="vh-sub">Catálogo del sistema</div></div></div>
      <div className="g3">{modulos.map((m,i)=><div key={i} className="card"><div className="cb" style={{display:"flex",alignItems:"center",gap:"0.75rem"}}><div className="mod-ico" style={{background:"var(--pr-pale)"}}><i className={`bi ${m[0]}`} style={{color:"var(--pr)"}} /></div><div style={{flex:1}}><div className="mod-name">{m[1]}</div><div className="mod-desc">{m[2]}</div></div><div className="tog" onClick={e=>e.currentTarget.classList.toggle("on")}><div className="tog-k" /></div></div></div>)}</div>
    </div>
  );
}

function ViewPlanes() {
  const planes = [{name:"Starter",price:"Gratis",color:"var(--sub)",features:["Módulos básicos limitados","1 usuario","Sin WhatsApp","1 sugerencia IA/día"],off:[2,3]},{name:"Pro",price:"$XX.000",color:"var(--em)",features:["Módulos completos","5 usuarios","WhatsApp activo","Skills IA Nivel 2"],off:[]},{name:"Plan IA",price:"$XX.000",color:"var(--accent)",features:["Todo Pro incluido","Skills IA completas","Asistente IA avanzado","Sugerencias reactivas"],off:[]},{name:"Enterprise",price:"A consultar",color:"var(--pr)",features:["Multi-cuenta","White label","Módulos custom","Consultoría incluida"],off:[]}];
  return (
    <div className="view-anim">
      <div className="vh"><div><div className="vh-title">Planes</div><div className="vh-sub">Gestión de suscripciones</div></div><button className="btn btn-em btn-sm"><i className="bi bi-plus-lg" /> Nuevo plan</button></div>
      <div className="g4">{planes.map((p,i)=><div key={i} className="plan-card"><div className="plan-hdr"><div className="plan-name" style={{color:p.color}}>{p.name}</div><div className="plan-price">{p.price}<span>/mes</span></div></div>{p.features.map((f,j)=><div key={j} className={`plan-feature${p.off.includes(j)?" off":""}`}><i className={`bi ${p.off.includes(j)?"bi-x":"bi-check2"}`} style={{color:p.off.includes(j)?"var(--border2)":p.color}} />{f}</div>)}<div className="plan-foot"><button className="btn btn-em btn-sm" style={{width:"100%",background:p.color}}>Gestionar</button></div></div>)}</div>
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
          {[["HA","Hotel Alvear","¿Cuándo se activa el módulo?","10:24"],["SV","Salón Versailles","Necesito ajustar el bot","09:15"],["DR","Dra. López","Consulta sobre facturación","ayer"]].map(([av,name,prev,time],i)=>(
            <div key={i} className={`conv-item${i===0?" on":""}`}><div className="conv-av">{av}</div><div style={{flex:1,minWidth:0}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div className="conv-name">{name}</div><div className="conv-time">{time}</div></div><div className="conv-prev">{prev}</div></div></div>
          ))}
        </div>
      </div>
      <div className="chat-panel">
        <div className="chat-hdr"><div className="conv-av">HA</div><div><div style={{fontWeight:600,fontSize:"0.82rem"}}>Hotel Alvear</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>hotel · Plan Pro</div></div></div>
        <div className="chat-msgs"><div className="msg msg-in">Hola, quería saber cuándo se activa el módulo de reservas.<div className="msg-t">10:22</div></div><div className="msg msg-out">¡Hola! El módulo ya está habilitado. Podés acceder desde tu portal en la sección Reservas.<div className="msg-t">10:24</div></div></div>
        <div className="chat-input-bar"><input className="chat-inp" placeholder="Escribir mensaje…" /><button className="btn btn-em btn-sm"><i className="bi bi-send" /></button></div>
      </div>
    </div>
  );
}

function ViewSeguimiento() {
  const tareas = [["Contactar a Inmobiliaria Palermo — sin actividad 12 días","Vence hoy · Alta prioridad"],["Revisar configuración WhatsApp — Salón Versailles","Vence mañana"],["Enviar propuesta Plan IA a Gestor Seguros BA","Esta semana"],["Onboarding Spa Zen Recoleta — cliente nuevo","Esta semana"]];
  return (
    <div className="view-anim">
      <div className="vh"><div><div className="vh-title">Seguimiento</div><div className="vh-sub">Tareas y recordatorios</div></div><button className="btn btn-em btn-sm"><i className="bi bi-plus-lg" /> Nueva tarea</button></div>
      <div className="card"><div className="cb">{tareas.map((t,i)=><div key={i} className="nota"><div style={{width:15,height:15,borderRadius:4,border:"1.5px solid var(--border2)",flexShrink:0,cursor:"pointer",marginTop:1}} /><div style={{flex:1}}><div className="nota-txt">{t[0]}</div><div className="nota-meta">{t[1]}</div></div></div>)}</div></div>
    </div>
  );
}

function ViewAlertas() {
  return (
    <div className="view-anim">
      <div className="vh"><div><div className="vh-title">Alertas IA</div><div className="vh-sub">Detecciones automáticas</div></div></div>
      <div className="alert-row red"><i className="bi bi-exclamation-circle" style={{color:"var(--red)",fontSize:"0.85rem",flexShrink:0,marginTop:"0.1rem"}} /><div style={{fontSize:"0.77rem",color:"var(--text)",lineHeight:1.4,flex:1}}><strong>Inmobiliaria Palermo</strong> — Sin actividad hace 12 días. Riesgo de churn alto.</div><button className="btn btn-xs btn-out" style={{marginLeft:"auto",flexShrink:0}}>Acción</button></div>
      <div className="alert-row warn"><i className="bi bi-exclamation-triangle" style={{color:"var(--amber)",fontSize:"0.85rem",flexShrink:0,marginTop:"0.1rem"}} /><div style={{fontSize:"0.77rem",color:"var(--text)",lineHeight:1.4,flex:1}}><strong>Gestor Seguros BA</strong> — Baja frecuencia de uso. Considerar reactivación.</div><button className="btn btn-xs btn-out" style={{marginLeft:"auto",flexShrink:0}}>Acción</button></div>
      <div className="alert-row em"><i className="bi bi-check-circle" style={{color:"var(--em)",fontSize:"0.85rem",flexShrink:0,marginTop:"0.1rem"}} /><div style={{fontSize:"0.77rem",color:"var(--text)",lineHeight:1.4,flex:1}}><strong>Hotel Alvear</strong> — Activó módulo Reservas. Engagement en aumento.</div></div>
    </div>
  );
}

function ViewIntegraciones({ onNavegar }) {
  const [integraciones, setIntegraciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try { const r=await fetch("/api/integraciones"); const d=await r.json(); if(d.ok) setIntegraciones(d.integraciones); } catch(_){}
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const toggleActivo = async (int) => {
    setSaving(int.id);
    try { await fetch("/api/integraciones",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:int.id,activo:int.activo?0:1})}); await cargar(); } catch(_){}
    setSaving(null);
  };

  const EXTRA = [
    {nombre:"Claude API",  icono:"bi-robot",      color:"var(--accent)", bg:"var(--accent-pale)",desc:"IA principal · Anthropic",   activo:true},
    {nombre:"n8n",         icono:"bi-diagram-3",  color:"var(--blue)",   bg:"var(--blue-bg)",   desc:"Automatizaciones de flujos", activo:true},
    {nombre:"MercadoPago", icono:"bi-credit-card",color:"var(--em-d)",   bg:"var(--em-pale)",   desc:"Pagos y suscripciones ARS",  activo:false},
    {nombre:"Google Maps", icono:"bi-geo-alt",    color:"var(--pine-d)", bg:"var(--pine-bg)",   desc:"Mapas y geolocalización",    activo:false},
  ];

  const conectadas = integraciones.filter(i=>i.activo).length;

  return (
    <div className="view-anim">
      {conectadas===0 && (
        <div style={{background:"linear-gradient(135deg,#1C3D2E,#2A5A44)",borderRadius:"var(--r)",padding:"0.85rem 1rem",marginBottom:"0.9rem",display:"flex",alignItems:"flex-start",gap:"0.75rem"}}>
          <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <i className="bi bi-plug" style={{color:"#4AB880",fontSize:"0.95rem"}} />
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:"0.7rem",fontWeight:700,color:"rgba(255,255,255,.6)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.2rem"}}>Maia · Acción sugerida</div>
            <div style={{fontSize:"0.79rem",color:"rgba(255,255,255,.9)",lineHeight:1.5}}>Conectá al menos un canal de comunicación para empezar a recibir conversaciones. Te recomendamos empezar por <strong>WhatsApp</strong>.</div>
          </div>
        </div>
      )}
      <div className="vh">
        <div><div className="vh-title">Integraciones</div><div className="vh-sub">{conectadas} canales de comunicación conectados</div></div>
        <button className="btn btn-out btn-sm" onClick={cargar}><i className="bi bi-arrow-clockwise" /></button>
      </div>
      <div style={{fontSize:"0.65rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.5rem"}}>Canales de comunicación</div>
      {loading ? <Cargando texto="Cargando integraciones..." /> : integraciones.map(int=>{
        const m=CANAL_META[int.tipo];
        return (
          <div key={int.id} className="int-card">
            <div className="int-ico" style={{background:m?.bg||"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {m?m.dot():<i className="bi bi-plug" style={{color:"var(--muted)"}} />}
            </div>
            <div style={{flex:1}}><div style={{fontSize:"0.8rem",fontWeight:600,color:"var(--text)"}}>{int.nombre}</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{int.activo?"Conectado · recibiendo mensajes":"No conectado"}</div></div>
            <span className={`bdg ${int.activo?"bdg-em":"bdg-moon"}`}>{int.activo?"Conectado":"Desconectado"}</span>
            <div className={`tog${int.activo?" on":""}`} onClick={()=>saving!==int.id&&toggleActivo(int)} style={{cursor:saving===int.id?"not-allowed":"pointer"}}><div className="tog-k" /></div>
            <button className="btn btn-out btn-sm" disabled={saving===int.id}>{int.activo?"Configurar":"Conectar"}</button>
          </div>
        );
      })}
      <div style={{fontSize:"0.65rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.5rem",marginTop:"1rem"}}>Plataformas y servicios</div>
      {EXTRA.map((it,i)=>(
        <div key={i} className="int-card">
          <div className="int-ico" style={{background:it.bg}}><i className={`bi ${it.icono}`} style={{color:it.color}} /></div>
          <div style={{flex:1}}><div style={{fontSize:"0.8rem",fontWeight:600,color:"var(--text)"}}>{it.nombre}</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{it.desc}</div></div>
          <span className={`bdg ${it.activo?"bdg-em":"bdg-moon"}`}>{it.activo?"Conectado":"Pendiente"}</span>
          <button className="btn btn-out btn-sm">{it.activo?"Configurar":"Conectar"}</button>
        </div>
      ))}
    </div>
  );
}

function ViewAuditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const cargar = async () => { setLoading(true); try { const r=await fetch("/api/auditoria"); const d=await r.json(); if(d.ok) setLogs(d.logs); } catch(_){} setLoading(false); };
  useEffect(() => { cargar(); }, []);
  const formatFecha = (f) => { const d=new Date(f); return d.toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"})+" · "+d.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}); };
  const hoy=new Date(); hoy.setHours(0,0,0,0);
  const sesionesHoy=logs.filter(l=>new Date(l.creado_en)>=hoy).length;
  const usuariosUnicos=[...new Set(logs.filter(l=>new Date(l.creado_en)>=hoy).map(l=>l.email))].length;
  const filtrados=logs.filter(l=>!filtro||l.nombre?.toLowerCase().includes(filtro.toLowerCase())||l.email?.toLowerCase().includes(filtro.toLowerCase())||l.ip?.includes(filtro));
  return (
    <div className="view-anim">
      <div className="vh"><div><div className="vh-title">Auditoría</div><div className="vh-sub">Registro de accesos al sistema</div></div><button className="btn btn-out btn-sm" onClick={cargar}><i className="bi bi-arrow-clockwise" /></button></div>
      <div className="g3" style={{marginBottom:"0.9rem"}}>
        {[["bi-box-arrow-in-right","var(--pr-pale)","var(--pr)",sesionesHoy,"Accesos hoy"],["bi-people","var(--em-pale)","var(--em-d)",usuariosUnicos,"Usuarios únicos hoy"],["bi-clock-history","var(--accent-pale)","var(--accent)",logs[0]?.nombre||"—","Último acceso"]].map(([ico,bg,color,val,lbl],i)=>(
          <div key={i} className="kpi"><div className="kpi-ico" style={{background:bg}}><i className={`bi ${ico}`} style={{color}} /></div><div className="kpi-val" style={{fontSize:i===2?"0.9rem":"1.85rem",marginTop:i===2?4:0}}>{val}</div><div className="kpi-lbl">{lbl}</div></div>
        ))}
      </div>
      <div style={{display:"flex",gap:"0.6rem",marginBottom:"0.7rem"}}>
        <div className="tb-search" style={{width:"100%",maxWidth:280}}>
          <i className="bi bi-search" style={{color:"var(--muted)",fontSize:"0.78rem"}} />
          <input placeholder="Buscar usuario, IP…" value={filtro} onChange={e=>setFiltro(e.target.value)} />
        </div>
      </div>
      <div className="card">
        {loading ? <Cargando texto="Cargando registros..." /> : (
          <table className="tbl">
            <thead><tr><th>Usuario</th><th>Dispositivo</th><th>IP</th><th>Fecha y hora</th></tr></thead>
            <tbody>
              {filtrados.length===0 ? <tr><td colSpan={4} style={{textAlign:"center",padding:"2rem",color:"var(--muted)"}}>Sin registros</td></tr>
              : filtrados.map((l,i)=>(
                <tr key={i}>
                  <td><div style={{display:"flex",alignItems:"center",gap:8}}><Av letra={l.nombre?.[0]} size={26} /><div><div style={{fontWeight:600,fontSize:"0.8rem"}}>{l.nombre||"—"}</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{l.email}</div></div></div></td>
                  <td><div style={{display:"flex",alignItems:"center",gap:6}}><i className={`bi ${l.dispositivo?.includes("Android")||l.dispositivo?.includes("iOS")?"bi-phone":"bi-laptop"}`} style={{color:"var(--muted)",fontSize:"0.82rem"}} /><span style={{fontSize:"0.78rem"}}>{l.dispositivo||"Desconocido"}</span></div></td>
                  <td style={{fontSize:"0.78rem",color:"var(--muted)",fontFamily:"monospace"}}>{l.ip||"—"}</td>
                  <td style={{fontSize:"0.75rem",color:"var(--muted)"}}>{formatFecha(l.creado_en)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ViewConfiguracion() {
  return (
    <div className="view-anim">
      <div className="vh"><div><div className="vh-title">Configuración</div><div className="vh-sub">Ajustes del sistema</div></div><button className="btn btn-em btn-sm"><i className="bi bi-floppy" /> Guardar cambios</button></div>
      <div className="g2">
        <div>
          <div className="cfg-section"><div className="cfg-hdr"><i className="bi bi-building" style={{color:"var(--accent)"}} /><span className="cfg-title">Información de la empresa</span></div><div className="cfg-body"><div className="fg"><label className="fl">Nombre</label><input className="fi" defaultValue="Gestión 360 iA" /></div><div className="fg"><label className="fl">Dominio base</label><input className="fi" defaultValue="gestion360ia.com.ar" /></div></div></div>
          <div className="cfg-section"><div className="cfg-hdr"><i className="bi bi-robot" style={{color:"var(--gold)"}} /><span className="cfg-title">Configuración IA</span></div><div className="cfg-body"><div className="fg"><label className="fl">Modelo principal</label><select className="fi"><option>claude-sonnet-4-6 (Anthropic)</option><option>gpt-4o (OpenAI)</option></select></div><div className="fg"><label className="fl">Límite tokens/día</label><input className="fi" defaultValue="5.000.000" /></div></div></div>
        </div>
        <div>
          <div className="cfg-section"><div className="cfg-hdr"><i className="bi bi-shield-check" style={{color:"var(--accent)"}} /><span className="cfg-title">Seguridad</span></div><div className="cfg-body">{[["JWT + Refresh tokens","Autenticación segura"],["HTTPS forzado","Redirigir HTTP → HTTPS"],["Rate limiting","100 req/min por IP"],["Log de auditoría","Registrar todas las acciones"]].map(([t,s],i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.45rem 0",borderBottom:"1px solid var(--border)"}}><div><div style={{fontSize:"0.8rem",fontWeight:600}}>{t}</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{s}</div></div><div className="tog on" onClick={e=>e.currentTarget.classList.toggle("on")}><div className="tog-k" /></div></div>)}</div></div>
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
    try { const r=await fetch("/api/usuarios"); const d=await r.json(); if(d.ok) setUsuarios(d.usuarios); } catch(_){}
    setLoading(false);
  };
  useEffect(() => { cargar(); }, []);

  const actualizar = async (id, cambios, email, nombre) => {
    setSaving(id);
    try {
      if(cambios.status==="approved") await fetch("/api/usuarios/aprobar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,email,nombre})});
      else if(cambios.status==="rejected") await fetch("/api/usuarios/rechazar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,email,nombre})});
      else await fetch("/api/usuarios",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,...cambios})});
      await cargar();
    } catch(_){}
    setSaving(null);
  };

  const eliminar = async (id, nombre) => {
    if(!confirm(`¿Eliminar a ${nombre||"este usuario"}?`)) return;
    setSaving(id);
    try { await fetch("/api/usuarios",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); await cargar(); } catch(_){}
    setSaving(null);
  };

  const STATUS_BADGE = {
    approved: { cls:"bdg-em",    label:"Aprobado" },
    pending:  { cls:"bdg-amber", label:"Pendiente" },
    rejected: { cls:"bdg-red",   label:"Rechazado" },
  };

  const AREA_LABELS = {
    comercial:      "Comercial",
    contenido:      "Marketing",
    atencion:       "Soporte",
    administracion: "Administración",
    operaciones:    "Operaciones",
  };

  const pendientes = usuarios.filter(u => u.status==="pending");
  const lista = tab==="pendientes" ? pendientes : usuarios;

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Usuarios y Permisos</div><div className="vh-sub">{usuarios.length} usuarios · {pendientes.length} pendientes</div></div>
        <button className="btn btn-out btn-sm" onClick={cargar}><i className="bi bi-arrow-clockwise" /></button>
      </div>

      <Tabs tabs={[["todos","Todos","bi-people"],["pendientes","Pendientes","bi-hourglass-split"]]} active={tab} onChange={setTab}
        extraBadge={tab==="todos"&&pendientes.length>0?{tab:"pendientes",count:pendientes.length}:null} />

      <div className="card">
        {loading ? <Cargando texto="Cargando usuarios..." /> : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Activo</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.length===0
                ? <tr><td colSpan={7} style={{textAlign:"center",padding:"2rem",color:"var(--muted)"}}>
                    {tab==="pendientes"?"No hay solicitudes pendientes":"No hay usuarios"}
                  </td></tr>
                : lista.map(u => (
                <tr key={u.id}>
                  {/* Usuario */}
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Av letra={u.nombre?.[0]} size={28} />
                      <div>
                        <div style={{fontWeight:600,fontSize:"0.8rem"}}>{u.nombre||"—"}</div>
                        <div style={{fontSize:"0.67rem",color:"var(--muted)"}}>{u.email}</div>
                        </div>
                    </div>
                  </td>

                  {/* Rol */}
                  <td>
                    <select value={u.rol} disabled={saving===u.id}
                      onChange={e => actualizar(u.id, {rol:e.target.value}, u.email, u.nombre)}
                      style={{padding:"0.25rem 0.5rem",borderRadius:"var(--r-sm)",border:"1px solid var(--border2)",fontSize:"0.75rem",fontFamily:"inherit",background:"var(--white)",cursor:"pointer"}}>
                      <option value="superadmin">Superadmin</option>
                      <option value="admin">Admin</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="cm">Community Manager</option>
                      <option value="soporte">Soporte</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>

                  {/* Área */}
                  <td>
                    <select value={u.area||""} disabled={saving===u.id}
                      onChange={e => actualizar(u.id, {area:e.target.value||null}, u.email, u.nombre)}
                      style={{padding:"0.25rem 0.5rem",borderRadius:"var(--r-sm)",border:"1px solid var(--border2)",fontSize:"0.75rem",fontFamily:"inherit",background:"var(--white)",cursor:"pointer",color:u.area?"var(--text)":"var(--muted)"}}>
                      <option value="">Sin área</option>
                      <option value="comercial">Comercial</option>
                      <option value="contenido">Marketing</option>
                      <option value="atencion">Soporte</option>
                      <option value="administracion">Administración</option>
                      <option value="operaciones">Operaciones</option>
                    </select>
                  </td>

                  {/* Estado */}
                  <td><span className={`bdg ${STATUS_BADGE[u.status]?.cls??"bdg-moon"}`}>{STATUS_BADGE[u.status]?.label??u.status}</span></td>

                  {/* Activo */}
                  <td>
                    <div className={`tog${u.activo?" on":""}`}
                      onClick={()=>saving!==u.id&&actualizar(u.id,{activo:u.activo?0:1},u.email,u.nombre)}
                      style={{cursor:saving===u.id?"not-allowed":"pointer"}}>
                      <div className="tog-k" />
                    </div>
                  </td>

                  {/* Último acceso */}
                  <td style={{fontSize:"0.72rem",color:"var(--muted)"}}>
                    {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString("es-AR") : "Nunca"}
                  </td>

                  {/* Acciones */}
                  <td>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {u.status==="pending" && <>
                        <button className="btn btn-em btn-xs" disabled={saving===u.id} onClick={()=>actualizar(u.id,{status:"approved"},u.email,u.nombre)}>
                          <i className="bi bi-check-lg" /> Aprobar
                        </button>
                        <button className="btn btn-xs btn-out" disabled={saving===u.id} onClick={()=>actualizar(u.id,{status:"rejected",activo:0},u.email,u.nombre)}>
                          <i className="bi bi-x-lg" /> Rechazar
                        </button>
                      </>}
                      {u.status==="approved" && <button className="btn btn-xs btn-out" disabled={saving===u.id} onClick={()=>actualizar(u.id,{status:"rejected",activo:0},u.email,u.nombre)}><i className="bi bi-slash-circle" /> Revocar</button>}
                      {u.status==="rejected" && <button className="btn btn-xs btn-out" disabled={saving===u.id} onClick={()=>actualizar(u.id,{status:"approved",activo:1},u.email,u.nombre)}><i className="bi bi-arrow-counterclockwise" /> Restaurar</button>}
                      <button className="btn btn-xs" disabled={saving===u.id} onClick={()=>eliminar(u.id,u.nombre)}
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
  const userName = session?.user?.name;
  const userInitial = userName?.[0]?.toUpperCase();
  return (
    <div className="view-anim" style={{maxWidth:680}}>
      <div className="vh"><div><div className="vh-title">Mi perfil</div><div className="vh-sub">Información de tu cuenta</div></div></div>
      <div className="cfg-section">
        <div className="cfg-hdr"><i className="bi bi-person-circle" style={{color:"var(--pr)"}} /><span className="cfg-title">Cuenta</span></div>
        <div className="cfg-body">
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            {session?.user?.image ? <img src={session.user.image} alt="" style={{width:56,height:56,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--border)"}} referrerPolicy="no-referrer" /> : <div style={{width:56,height:56,borderRadius:"50%",background:"var(--pr)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",fontWeight:700,color:"#fff"}}>{userInitial}</div>}
            <div><div style={{fontSize:"1rem",fontWeight:700,color:"var(--text)"}}>{userName}</div><div style={{fontSize:"0.78rem",color:"var(--muted)",marginTop:2}}>{session?.user?.email}</div><div style={{marginTop:6,display:"flex",alignItems:"center",gap:5}}><svg width="14" height="14" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.292C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg><span style={{fontSize:"0.7rem",color:"var(--muted)"}}>Cuenta Google · Solo lectura</span></div></div>
          </div>
        </div>
      </div>
      <div className="cfg-section">
        <div className="cfg-hdr"><i className="bi bi-headset" style={{color:"var(--pr)"}} /><span className="cfg-title">Soporte</span></div>
        <div style={{padding:0}}>
          <a href="mailto:soporte@gestion360ia.com.ar" style={{textDecoration:"none"}}><div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.7rem 1rem",cursor:"pointer",borderBottom:"1px solid var(--border)",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><i className="bi bi-envelope" style={{color:"var(--pr)",fontSize:"0.88rem",width:16,textAlign:"center"}} /><div style={{flex:1}}><div style={{fontSize:"0.8rem",fontWeight:600,color:"var(--text)"}}>Contactar soporte</div><div style={{fontSize:"0.67rem",color:"var(--muted)"}}>soporte@gestion360ia.com.ar</div></div><i className="bi bi-chevron-right" style={{color:"var(--muted)",fontSize:"0.7rem"}} /></div></a>
        </div>
      </div>
      <div className="cfg-section"><div className="cfg-body"><button className="btn" onClick={()=>signOut({callbackUrl:"/"})} style={{width:"100%",justifyContent:"center",background:"var(--red-bg)",color:"var(--red)",border:"1px solid #f5c6c6",fontWeight:600}}><i className="bi bi-box-arrow-right" /> Cerrar sesión</button></div></div>
    </div>
  );
}

/* ══ COMPONENTES UTILITARIOS ══ */

function Av({ letra, size=28, r, fontSize="0.7rem" }) {
  return (
    <div style={{width:size,height:size,borderRadius:r||"50%",background:"var(--pr-pale)",display:"flex",alignItems:"center",justifyContent:"center",fontSize,fontWeight:700,color:"var(--pr)",flexShrink:0}}>
      {letra?.toUpperCase()||"?"}
    </div>
  );
}

function Cargando({ texto }) {
  return (
    <div style={{padding:"2.5rem",textAlign:"center",color:"var(--muted)"}}>
      <i className="bi bi-hourglass-split" style={{fontSize:"1.4rem",display:"block",marginBottom:8}} />
      {texto}
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div style={{background:"var(--red-bg)",border:"1px solid #f5c6c6",borderRadius:"var(--r-sm)",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"var(--red)"}}>
      <i className="bi bi-exclamation-circle" /> {msg}
    </div>
  );
}

function Modal({ title, onClose, children, maxWidth=480 }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:"1rem"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:"var(--r)",width:"100%",maxWidth,boxShadow:"0 20px 60px rgba(15,23,42,.2)",overflow:"hidden"}}>
        <div style={{padding:"1rem 1.2rem",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--bg)"}}>
          <div style={{fontWeight:700,fontSize:"0.9rem",color:"var(--text)"}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:"1rem"}}><i className="bi bi-x-lg" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, saving, labelConfirm }) {
  return (
    <div style={{padding:"0.9rem 1.2rem",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:"0.5rem",background:"var(--bg)"}}>
      <button className="btn btn-out btn-sm" onClick={onCancel}>Cancelar</button>
      <button className="btn btn-em btn-sm" onClick={onConfirm} disabled={saving}>
        {saving ? <><i className="bi bi-hourglass-split" /> Guardando…</> : <><i className="bi bi-check-lg" /> {labelConfirm}</>}
      </button>
    </div>
  );
}

function Tabs({ tabs, active, onChange, extraBadge }) {
  return (
    <div style={{display:"flex",gap:4,marginBottom:"0.9rem",borderBottom:"1px solid var(--border)"}}>
      {tabs.map(([id,label,icon])=>(
        <button key={id} onClick={()=>onChange(id)} style={{padding:"0.45rem 0.9rem",border:"none",background:"none",fontFamily:"inherit",fontSize:"0.8rem",fontWeight:active===id?700:500,color:active===id?"var(--pr)":"var(--sub)",cursor:"pointer",borderBottom:active===id?"2px solid var(--pr)":"2px solid transparent",display:"flex",alignItems:"center",gap:5,marginBottom:-1}}>
          <i className={`bi ${icon}`} />{label}
          {extraBadge?.tab===id&&extraBadge.count>0&&<span style={{background:"var(--red)",color:"#fff",fontSize:"0.57rem",fontWeight:700,padding:"0.1rem 0.4rem",borderRadius:9,marginLeft:2}}>{extraBadge.count}</span>}
        </button>
      ))}
    </div>
  );
}
