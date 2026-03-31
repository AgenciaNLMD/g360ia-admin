"use client";

import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";
import { useSession, signOut } from "next-auth/react";
import "../../styles/panel-system.css";

// Theme loader — data lives in lib/panel-themes, not here
import { applyTheme, THEME_STORAGE_KEY } from "../../lib/panel-themes";

// Profile content components (external files — no content lives in this layout)
import PerfilContent       from "../../components/profile/PerfilContent";
import PersonalizarContent from "../../components/profile/PersonalizarContent";
import MasInfoContent      from "../../components/profile/MasInfoContent";
import IdiomaContent       from "../../components/profile/IdiomaContent";
import AyudaContent        from "../../components/profile/AyudaContent";
import { DOCUMENTOS }      from "../../lib/documentos";

// ── Módulo context ─────────────────────────────────────────────────────────────
export const ModuloContext = createContext({ moduloActivo: null, setModuloActivo: () => {} });

// ── MAIA Topbar ────────────────────────────────────────────────────────────────
function MaiaTopbar() {
  return (
    <div className="mod-topbar">
      <div className="ia-pill">
        <i className="bi bi-stars ia-pill__icon" />
        <span className="ia-pill__label">MAIA</span>
        <span className="ia-pill__text">Sin mensajes por ahora.</span>
      </div>
    </div>
  );
}


// ── Modal registry — each profile option maps to a title + component ───────────
const PROFILE_MODALS = {
  perfil:       { title: "Mi perfil",       Component: PerfilContent },
  personalizar: { title: "Personalizar",    Component: PersonalizarContent },
  masinfo:      { title: "Más información", Component: MasInfoContent },
  idioma:       { title: "Idioma",          Component: IdiomaContent },
  ayuda:        { title: "Obtener ayuda",   Component: AyudaContent },
};

// ── Logo ───────────────────────────────────────────────────────────────────────
function SidebarLogo({ collapsed, onToggle }) {
  return (
    <div
      className="sb-logo sb-logo--clickable"
      onClick={onToggle}
      title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
    >
      <div className="sb-logo__icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="18" height="14">
          <rect x="0"  y="10" width="6" height="6" rx="1.5" fill="white" opacity=".35"/>
          <rect x="0"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
          <rect x="0"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
          <rect x="8"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
          <rect x="8"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
          <rect x="16" y="0"  width="6" height="6" rx="1.5" fill="#B08A55"/>
        </svg>
      </div>
      <div className="sb-logo__text">
        <div className="sb-logo__title">
          Gestión 360 <span>iA</span>
        </div>
        <div className="sb-logo__sub">Panel Admin</div>
      </div>
    </div>
  );
}

// ── Nav item ───────────────────────────────────────────────────────────────────
function NavItem({ item }) {
  const { moduloActivo, setModuloActivo } = useContext(ModuloContext);
  const active = moduloActivo === item.slug;

  return (
    <button
      type="button"
      title={item.label}
      className={`sb-nav__item${active ? " sb-nav__item--active" : ""}`}
      onClick={() => setModuloActivo(item.slug)}
    >
      <i className={`bi ${item.icon} sb-nav__icon`} />
      <span className="sb-nav__label">{item.label}</span>
    </button>
  );
}

// ── Profile modal wrapper ──────────────────────────────────────────────────────
function ProfileModal({ modalKey, onClose }) {
  const modal = PROFILE_MODALS[modalKey];
  if (!modal) return null;
  const { title, Component } = modal;

  return (
    <div className="pmodal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pmodal">
        <div className="pmodal__header">
          <span className="pmodal__title">{title}</span>
          <button className="pmodal__close" onClick={onClose} title="Cerrar">
            <i className="bi bi-x" />
          </button>
        </div>
        <div className="pmodal__body">
          <Component />
        </div>
      </div>
    </div>
  );
}

// ── Profile button + dropdown ──────────────────────────────────────────────────
function ProfileButton({ session, collapsed, onOpenModal }) {
  const [open, setOpen]           = useState(false);
  const [dropPos, setDropPos]     = useState(null);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [openDoc, setOpenDoc]     = useState(null);
  const btnRef  = useRef(null);
  const dropRef = useRef(null);

  const name    = session?.user?.name  ?? "Usuario";
  const email   = session?.user?.email ?? "";
  const image   = session?.user?.image ?? null;
  const initial = name[0]?.toUpperCase() ?? "U";

  // Calculate fixed position for dropdown so it never gets clipped by sidebar overflow:hidden
  const calcPosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    if (collapsed) {
      // Show to the right of the sidebar
      setDropPos({ left: rect.right + 8, bottom: window.innerHeight - rect.bottom });
    } else {
      // Show above the button, aligned to the sidebar width
      setDropPos({ left: rect.left, right: window.innerWidth - rect.right, bottom: window.innerHeight - rect.top + 4 });
    }
  }, [collapsed]);

  const handleToggle = useCallback(() => {
    if (!open) calcPosition();
    setOpen(o => !o);
  }, [open, calcPosition]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        btnRef.current  && !btnRef.current.contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function handleResize() { calcPosition(); }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("resize", handleResize);
    };
  }, [open, calcPosition]);

  const openModal = (key) => {
    setOpen(false);
    setDocsExpanded(false);
    onOpenModal(key);
  };

  const dropStyle = dropPos ? {
    position: "fixed",
    bottom:   dropPos.bottom,
    ...(dropPos.left  !== undefined ? { left:  dropPos.left  } : {}),
    ...(dropPos.right !== undefined ? { right: dropPos.right } : {}),
  } : {};

  return (
    <>
      <div className="sb-profile">
        <button
          ref={btnRef}
          onClick={handleToggle}
          title={name}
          className={`sb-profile__btn${open ? " sb-profile__btn--open" : ""}`}
        >
          {image ? (
            <img src={image} alt="" referrerPolicy="no-referrer" className="sb-profile__avatar" />
          ) : (
            <div className="sb-profile__avatar">{initial}</div>
          )}

          <div className="sb-profile__info">
            <div className="sb-profile__name">{name}</div>
            <div className="sb-profile__email">{email}</div>
          </div>

          <i className={`bi bi-chevron-up sb-profile__chevron ${open ? "sb-profile__chevron--open" : "sb-profile__chevron--closed"}`} />
        </button>
      </div>

      {openDoc && (
        <div
          className="pmodal-backdrop"
          style={{ zIndex: 1100 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpenDoc(null); }}
        >
          <div className="pmodal">
            <div className="pmodal__header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <i className={`bi ${openDoc.icon}`} style={{ fontSize: "16px", color: "var(--pr)" }} />
                <span className="pmodal__title">{openDoc.label}</span>
              </div>
              <button className="pmodal__close" onClick={() => setOpenDoc(null)} title="Cerrar">
                <i className="bi bi-x" />
              </button>
            </div>
            <div className="pmodal__body">
              {openDoc.url ? (
                <iframe
                  src={openDoc.url}
                  style={{ width: "100%", height: "60vh", border: "none" }}
                  title={openDoc.label}
                />
              ) : (
                <div className="ui-empty">
                  <i className="bi bi-file-earmark-x ui-empty__icon" />
                  <div className="ui-empty__text">Documento no disponible aún</div>
                  <div className="ui-empty__sub">
                    {openDoc.version ? `${openDoc.version} · Será cargado próximamente` : "Será cargado próximamente"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {open && (
        <div ref={dropRef} className="sb-dropdown sb-dropdown--fixed" style={dropStyle}>
          <button className="sb-dropdown__item" onClick={() => openModal("perfil")}>
            <i className="bi bi-person" /> Mi perfil
          </button>
          <button className="sb-dropdown__item" onClick={() => openModal("personalizar")}>
            <i className="bi bi-sliders" /> Personalizar
          </button>
          <button
            className={`sb-dropdown__item sb-dropdown__item--has-sub${docsExpanded ? " sb-dropdown__item--sub-open" : ""}`}
            onClick={() => setDocsExpanded(d => !d)}
          >
            <i className="bi bi-file-earmark-text" /> Documentos
            <i className={`bi bi-chevron-right sb-dropdown__sub-chevron${docsExpanded ? " sb-dropdown__sub-chevron--open" : ""}`} />
          </button>
          {docsExpanded && (
            <div className="sb-dropdown__sub">
              {DOCUMENTOS.map(doc => (
                <button
                  key={doc.id}
                  className="sb-dropdown__item sb-dropdown__item--sub"
                  onClick={() => { setOpen(false); setDocsExpanded(false); setOpenDoc(doc); }}
                >
                  <i className={`bi ${doc.icon}`} />
                  <span>{doc.label}</span>
                  <i className="bi bi-arrow-up-right sb-dropdown__sub-open-icon" />
                </button>
              ))}
            </div>
          )}
          <div className="sb-dropdown__sep" />
          <button className="sb-dropdown__item" onClick={() => openModal("masinfo")}>
            <i className="bi bi-info-circle" /> Más información
          </button>
          <button className="sb-dropdown__item" onClick={() => openModal("idioma")}>
            <i className="bi bi-translate" /> Idioma
          </button>
          <button className="sb-dropdown__item" onClick={() => openModal("ayuda")}>
            <i className="bi bi-question-circle" /> Obtener ayuda
          </button>
          <div className="sb-dropdown__sep" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="sb-dropdown__item sb-dropdown__item--danger"
          >
            <i className="bi bi-box-arrow-right" /> Cerrar sesión
          </button>
        </div>
      )}
    </>
  );
}

// ── Main layout ────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
  const { data: session } = useSession();
  const [collapsed,    setCollapsed]    = useState(false);
  const [activeModal,  setActiveModal]  = useState(null);
  const [moduloActivo, setModuloActivo] = useState(null);
  const [navItems,     setNavItems]     = useState([]);

  // Cargar tema guardado al montar
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) applyTheme(saved);
  }, []);

  // Cargar módulos permitidos desde la API
  useEffect(() => {
    fetch("/api/modulos/permitidos")
      .then(r => r.ok ? r.json() : [])
      .then(data => setNavItems(Array.isArray(data) ? data : []))
      .catch(() => setNavItems([]));
  }, []);

  return (
    <ModuloContext.Provider value={{ moduloActivo, setModuloActivo }}>
      <div className="panel-wrap">
        <aside className={`sb${collapsed ? " sb--collapsed" : ""}`}>
          <SidebarLogo collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

          <nav className="sb-nav">
            {navItems.map(item => (
              <NavItem
                key={item.slug}
                item={item}
              />
            ))}
          </nav>

          <ProfileButton
            session={session}
            collapsed={collapsed}
            onOpenModal={setActiveModal}
          />
        </aside>

        <main className="panel-content">
          <MaiaTopbar />
          {children}
        </main>

        {activeModal && (
          <ProfileModal
            modalKey={activeModal}
            onClose={() => setActiveModal(null)}
          />
        )}
      </div>
    </ModuloContext.Provider>
  );
}
