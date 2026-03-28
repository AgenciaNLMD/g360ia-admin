"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import "../../styles/panel.css";

// ── Sidebar items ─────────────────────────────────────────────────────────────
// Agregá aquí los ítems de navegación del sidebar.
const NAV_ITEMS = [
  { icon: "bi-grid", label: "Dashboard", href: "/dashboard" },
];

// ── Logo ──────────────────────────────────────────────────────────────────────
function SidebarLogo() {
  return (
    <div className="sb-logo">
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

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({ item, active }) {
  return (
    <a
      href={item.href}
      title={item.label}
      className={`sb-nav__item${active ? " sb-nav__item--active" : ""}`}
    >
      <i className={`bi ${item.icon} sb-nav__icon`} />
      <span className="sb-nav__label">{item.label}</span>
    </a>
  );
}

// ── Profile button + dropdown ─────────────────────────────────────────────────
function ProfileButton({ session }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const name    = session?.user?.name  ?? "Usuario";
  const email   = session?.user?.email ?? "";
  const image   = session?.user?.image ?? null;
  const initial = name[0]?.toUpperCase() ?? "U";

  return (
    <div ref={ref} className="sb-profile">
      <button
        onClick={() => setOpen(o => !o)}
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

      {open && (
        <div className="sb-dropdown">
          <a href="/perfil" className="sb-dropdown__item">
            <i className="bi bi-person" />
            Mi perfil
          </a>
          <div className="sb-dropdown__sep" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="sb-dropdown__item sb-dropdown__item--danger"
          >
            <i className="bi bi-box-arrow-right" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/dashboard";

  return (
    <div className="panel-wrap">
      <aside className={`sb${collapsed ? " sb--collapsed" : ""}`}>
        <SidebarLogo />

        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className="sb-toggle"
        >
          <i className={`bi ${collapsed ? "bi-chevron-double-right" : "bi-chevron-double-left"}`} />
        </button>

        <nav className="sb-nav">
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.href}
              item={item}
              active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
            />
          ))}
        </nav>

        <ProfileButton session={session} />
      </aside>

      <main className="panel-content">
        {children}
      </main>
    </div>
  );
}
