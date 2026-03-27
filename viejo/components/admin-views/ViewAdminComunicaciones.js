"use client";
import { useState } from "react";
import { useTenants, useModuloData, TenantSelector, ModuloLoading, ModuloError } from "./AdminModuloShell";

export default function ViewAdminComunicaciones() {
  const tenants = useTenants();
  const [tid, setTid] = useState("");
  const [tab, setTab]  = useState("log");
  const { data, loading, error } = useModuloData("comunicaciones", tid);

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Comunicaciones</div><div className="vh-sub">WhatsApp y plantillas del tenant</div></div>
      </div>
      <TenantSelector tenants={tenants} value={tid} onChange={setTid} />
      {tid && (
        <div style={{ display:"flex", gap:4, marginBottom:14, background:"var(--bg)", borderRadius:"var(--r-sm)", padding:3, width:"fit-content" }}>
          {[["log","Historial"],["plantillas","Plantillas"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding:"0.28rem 0.9rem", borderRadius:"var(--r-sm)", border:"none", cursor:"pointer", fontFamily:"inherit",
              background: tab===id ? "#fff" : "transparent", color: tab===id ? "var(--pr)" : "var(--muted)",
              fontWeight: tab===id ? 700 : 500, fontSize:"0.75rem", boxShadow: tab===id ? "var(--sh)" : "none",
            }}>{label}</button>
          ))}
        </div>
      )}
      {!tid ? null : error ? <ModuloError mensaje={error} /> : loading ? <ModuloLoading /> : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {tab === "log" ? (
            !data?.log?.length
              ? <div style={{ padding:"2rem", textAlign:"center", color:"var(--muted)", fontSize:"0.82rem" }}>Sin mensajes enviados</div>
              : <table className="tbl">
                  <thead><tr><th>Cliente</th><th>Canal</th><th>Mensaje</th><th>Estado</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {data.log.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontSize:"0.78rem" }}>{m.cliente_nombre || "—"}</td>
                        <td><span className="bdg bdg-em">{m.canal}</span></td>
                        <td style={{ fontSize:"0.75rem", maxWidth:280, color:"var(--sub)" }}>{m.mensaje?.slice(0,80)}{m.mensaje?.length > 80 ? "…" : ""}</td>
                        <td><span className={`bdg ${m.estado==="enviado"?"bdg-em":m.estado==="fallido"?"bdg-red":"bdg-amber"}`}>{m.estado}</span></td>
                        <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{new Date(m.creado_en).toLocaleDateString("es-AR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          ) : (
            !data?.plantillas?.length
              ? <div style={{ padding:"2rem", textAlign:"center", color:"var(--muted)", fontSize:"0.82rem" }}>Sin plantillas</div>
              : <table className="tbl">
                  <thead><tr><th>Nombre</th><th>Canal</th><th>Evento</th><th>Contenido</th><th>Estado</th></tr></thead>
                  <tbody>
                    {data.plantillas.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight:600, fontSize:"0.8rem" }}>{p.nombre}</td>
                        <td><span className="bdg bdg-em">{p.canal}</span></td>
                        <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{p.evento || "—"}</td>
                        <td style={{ fontSize:"0.75rem", color:"var(--sub)", maxWidth:300 }}>{p.contenido?.slice(0,100)}…</td>
                        <td><span className={`bdg ${p.activa ? "bdg-em" : "bdg-moon"}`}>{p.activa ? "Activa" : "Inactiva"}</span></td>
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
