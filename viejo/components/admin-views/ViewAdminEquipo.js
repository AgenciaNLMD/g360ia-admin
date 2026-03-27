"use client";
import { useState } from "react";
import { useTenants, useModuloData, TenantSelector, ModuloLoading, ModuloVacio, ModuloError } from "./AdminModuloShell";

export default function ViewAdminEquipo() {
  const tenants = useTenants();
  const [tid, setTid] = useState("");
  const { data, loading, error } = useModuloData("equipo", tid);

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Equipo / Técnicos</div><div className="vh-sub">{data ? `${data.equipo?.length || 0} técnicos` : "Personal del tenant"}</div></div>
      </div>
      <TenantSelector tenants={tenants} value={tid} onChange={setTid} />
      {!tid ? null : error ? <ModuloError mensaje={error} /> : loading ? <ModuloLoading /> : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {!data?.equipo?.length ? <ModuloVacio texto="Sin técnicos registrados" icono="bi-people-fill" /> : (
            <table className="tbl">
              <thead><tr><th>Técnico</th><th>Especialidad</th><th>Teléfono</th><th>OTs activas</th><th>Estado</th></tr></thead>
              <tbody>
                {data.equipo.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--pr-pale)", color:"var(--pr)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"0.75rem", flexShrink:0 }}>
                          {t.nombre?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:"0.8rem" }}>{t.nombre || "—"}</div>
                          <div style={{ fontSize:"0.68rem", color:"var(--muted)" }}>{t.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:"0.78rem", color:"var(--sub)" }}>{t.especialidad || "—"}</td>
                    <td style={{ fontSize:"0.78rem", color:"var(--muted)" }}>{t.telefono || "—"}</td>
                    <td style={{ fontWeight:700, color: t.ots_activas > 0 ? "var(--pr)" : "var(--muted)" }}>{t.ots_activas || 0}</td>
                    <td><span className={`bdg ${t.activo ? "bdg-em" : "bdg-red"}`}>{t.activo ? "Activo" : "Inactivo"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
