"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

// ── Sidebar items ─────────────────────────────────────────────────────────────
// Agregá aquí los ítems de navegación del sidebar.
const NAV_ITEMS = [
  { icon: "bi-grid", label: "Dashboard", href: "/dashboard" },
];

// ── Logo ──────────────────────────────────────────────────────────────────────
function SidebarLogo({ collapsed }) {
  return (
    <div style={{
      padding: collapsed ? "20px 0" : "20px 20px 16px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderBottom: "1px solid var(--sb-brd)",
      overflow: "hidden",
      minHeight: 72,
    }}>
      {/* Ícono cuadrado */}
      <div style={{
        width: 36, height: 36, background: "rgba(255,255,255,.12)",
        borderRadius: 9, display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0,
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="18" height="14">
          <rect x="0" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".35"/>
          <rect x="0" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
          <rect x="0" y="0"  width="6" height="6" rx="1.5" fill="white"/>
          <rect x="8" y="0"  width="6" height="6" rx="1.5" fill="white"/>
          <rect x="8" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
          <rect x="16" y="0" width="6" height="6" rx="1.5" fill="#B08A55"/>
        </svg>
      </div>

      {/* Textos — se ocultan al colapsar */}
      <div style={{
        opacity: collapsed ? 0 : 1,
        transform: collapsed ? "translateX(-8px)" : "translateX(0)",
        transition: "opacity .2s ease, transform .2s ease",
        pointerEvents: collapsed ? "none" : "auto",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
          Gestión 360 <span style={{ color: "#B08A55" }}>iA</span>
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase", marginTop: 2 }}>
          Panel Admin
        </div>
      </div>
    </div>
  );
}

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({ item, collapsed, active }) {
  return (
    <a
      href={item.href}
      title={collapsed ? item.label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: collapsed ? "10px 0" : "10px 14px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: 8,
        margin: "2px 8px",
        textDecoration: "none",
        color: active ? "#fff" : "rgba(255,255,255,.6)",
        background: active ? "var(--sb-active)" : "transparent",
        transition: "background .15s, color .15s",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,.07)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <i className={`bi ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
      <span style={{
        opacity: collapsed ? 0 : 1,
        maxWidth: collapsed ? 0 : 200,
        transition: "opacity .2s ease, max-width .2s ease",
        overflow: "hidden",
      }}>
        {item.label}
      </span>
    </a>
  );
}

// ── Profile button + dropdown ─────────────────────────────────────────────────
function ProfileButton({ collapsed, session }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const name  = session?.user?.name  ?? "Usuario";
  const email = session?.user?.email ?? "";
  const image = session?.user?.image ?? null;
  const initial = name[0]?.toUpperCase() ?? "U";

  return (
    <div ref={ref} style={{ position: "relative", padding: collapsed ? "12px 4px" : "12px 8px", borderTop: "1px solid var(--sb-brd)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={collapsed ? name : undefined}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: collapsed ? "center" : "flex-start",
          background: open ? "rgba(255,255,255,.1)" : "transparent",
          border: "none",
          borderRadius: 8,
          padding: collapsed ? "8px 0" : "8px 10px",
          cursor: "pointer",
          color: "rgba(255,255,255,.85)",
          transition: "background .15s",
          overflow: "hidden",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,.07)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Avatar */}
        {image ? (
          <img src={image} alt="" referrerPolicy="no-referrer" style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {initial}
          </div>
        )}

        {/* Info — oculto al colapsar */}
        <div style={{
          opacity: collapsed ? 0 : 1,
          maxWidth: collapsed ? 0 : 200,
          transition: "opacity .2s ease, max-width .2s ease",
          overflow: "hidden",
          textAlign: "left",
          flex: 1,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
        </div>

        {!collapsed && (
          <i className="bi bi-chevron-up" style={{ fontSize: 11, color: "rgba(255,255,255,.4)", flexShrink: 0, transform: open ? "rotate(0deg)" : "rotate(180deg)", transition: "transform .2s" }} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 4px)",
          left: collapsed ? "calc(100% + 8px)" : 8,
          right: collapsed ? "auto" : 8,
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(15,23,42,.12)",
          overflow: "hidden",
          zIndex: 100,
          minWidth: 180,
        }}>
          <a
            href="/perfil"
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", fontSize: 13, color: "var(--text)", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--pr-bg)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <i className="bi bi-person" style={{ fontSize: 15, color: "var(--sub)" }} />
            Mi perfil
          </a>
          <div style={{ height: 1, background: "var(--border)", margin: "0 10px" }} />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", fontSize: 13, color: "var(--red)", background: "transparent", border: "none", width: "100%", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--red-bg)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <i className="bi bi-box-arrow-right" style={{ fontSize: 15 }} />
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

  const sbWidth = collapsed ? 60 : 230;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside style={{
        width: sbWidth,
        minWidth: sbWidth,
        background: "var(--sb-bg)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        transition: "width .22s ease, min-width .22s ease",
        overflow: "hidden",
        zIndex: 20,
      }}>
        {/* Logo */}
        <SidebarLogo collapsed={collapsed} />

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          style={{
            margin: "8px auto 4px",
            width: 28,
            height: 28,
            borderRadius: 7,
            border: "none",
            background: "rgba(255,255,255,.1)",
            color: "rgba(255,255,255,.6)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.18)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}
        >
          <i className={`bi ${collapsed ? "bi-chevron-double-right" : "bi-chevron-double-left"}`} style={{ fontSize: 12 }} />
        </button>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingTop: 4 }}>
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
            />
          ))}
        </nav>

        {/* Profile */}
        <ProfileButton collapsed={collapsed} session={session} />
      </aside>

      {/* Content area */}
      <main style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}>
        {children}
      </main>
    </div>
  );
}
