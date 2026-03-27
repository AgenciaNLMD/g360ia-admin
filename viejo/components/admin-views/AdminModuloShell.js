"use client";
// components/admin-views/AdminModuloShell.js
// Shell compartido para todas las vistas de módulos en el panel admin.
// Incluye selector de tenant y fetcher de datos.

import { useState, useEffect, useCallback } from "react";

export function useTenants() {
  const [tenants, setTenants] = useState([]);
  useEffect(() => {
    fetch("/api/tenants").then(r => r.json()).then(d => {
      if (d.ok) setTenants(d.tenants.filter(t => t.activo && t.db_name));
    }).catch(() => {});
  }, []);
  return tenants;
}

export function useModuloData(modulo, tenantId, extra = "") {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const cargar = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/modulos/${modulo}?tenant_id=${tenantId}${extra}`);
      const d = await res.json();
      if (d.ok) setData(d);
      else setError(d.error || "Error al cargar");
    } catch (e) { setError("Error de conexión"); }
    setLoading(false);
  }, [modulo, tenantId, extra]);

  useEffect(() => { cargar(); }, [cargar]);

  return { data, loading, error, recargar: cargar };
}

export function TenantSelector({ tenants, value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18,
      background:"var(--bg)", borderRadius:"var(--r-sm)", padding:"10px 14px",
      border:"1px solid var(--border)" }}>
      <i className="bi bi-building" style={{ color:"var(--pr)", fontSize:"0.9rem" }} />
      <span style={{ fontSize:"0.78rem", color:"var(--sub)", fontWeight:600 }}>Tenant:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"4px 10px",
          fontSize:"0.8rem", color:"var(--text)", background:"#fff", cursor:"pointer", flex:1, maxWidth:280 }}
      >
        <option value="">— Seleccionar tenant —</option>
        {tenants.map(t => (
          <option key={t.id} value={t.id}>{t.nombre} · {t.rubro}</option>
        ))}
      </select>
      {!value && (
        <span style={{ fontSize:"0.72rem", color:"var(--muted)" }}>Seleccioná un tenant para ver sus datos</span>
      )}
    </div>
  );
}

export function ModuloLoading() {
  return (
    <div style={{ padding:"2.5rem", textAlign:"center", color:"var(--muted)", fontSize:"0.82rem" }}>
      <i className="bi bi-arrow-repeat" style={{ fontSize:"1.4rem", display:"block", marginBottom:8, opacity:.4 }} />
      Cargando...
    </div>
  );
}

export function ModuloVacio({ texto = "Sin datos", icono = "bi-inbox" }) {
  return (
    <div style={{ padding:"2.5rem", textAlign:"center", color:"var(--muted)", fontSize:"0.82rem" }}>
      <i className={`bi ${icono}`} style={{ fontSize:"2rem", display:"block", marginBottom:8, opacity:.3 }} />
      {texto}
    </div>
  );
}

export function ModuloError({ mensaje }) {
  return (
    <div style={{ padding:"1rem", background:"var(--red-bg)", color:"var(--red)",
      borderRadius:"var(--r-sm)", fontSize:"0.8rem", marginBottom:12 }}>
      <i className="bi bi-exclamation-triangle" style={{ marginRight:6 }} />
      {mensaje}
    </div>
  );
}

export async function postModulo(modulo, tenant_id, body) {
  const res = await fetch(`/api/admin/modulos/${modulo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenant_id, ...body }),
  });
  return res.json();
}
