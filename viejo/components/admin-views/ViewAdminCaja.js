"use client";
import { useState } from "react";
import { useTenants, useModuloData, TenantSelector, ModuloLoading, ModuloVacio, ModuloError } from "./AdminModuloShell";

const MEDIO_ICON = { efectivo:"bi-cash", transferencia:"bi-bank", debito:"bi-credit-card", credito:"bi-credit-card-2-front", mercadopago:"bi-phone", otro:"bi-three-dots" };

export default function ViewAdminCaja() {
  const tenants = useTenants();
  const [tid, setTid]   = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const { data, loading, error } = useModuloData("caja", tid, `&fecha=${fecha}`);

  const totalDia = data?.resumen?.reduce((s, r) => s + Number(r.total || 0), 0) || 0;

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Caja</div><div className="vh-sub">{data ? `$${totalDia.toLocaleString("es-AR")} recaudado` : "Cobros del tenant"}</div></div>
        <input type="date" className="fi" style={{ maxWidth:160 }} value={fecha} onChange={e => setFecha(e.target.value)} />
      </div>
      <TenantSelector tenants={tenants} value={tid} onChange={setTid} />

      {tid && data?.resumen?.length > 0 && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
          {data.resumen.map(r => (
            <div key={r.medio} className="card" style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", minWidth:150 }}>
              <i className={`bi ${MEDIO_ICON[r.medio] || "bi-cash"}`} style={{ color:"var(--pr)", fontSize:"1.1rem" }} />
              <div>
                <div style={{ fontSize:"0.65rem", color:"var(--muted)", textTransform:"uppercase", fontWeight:700 }}>{r.medio}</div>
                <div style={{ fontWeight:700, fontSize:"0.9rem" }}>${Number(r.total).toFixed(2)}</div>
                <div style={{ fontSize:"0.65rem", color:"var(--muted)" }}>{r.cant} cobro{r.cant > 1 ? "s" : ""}</div>
              </div>
            </div>
          ))}
          <div className="card" style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--em-pale)", border:"1px solid var(--em-d)" }}>
            <i className="bi bi-coin" style={{ color:"var(--em-d)", fontSize:"1.1rem" }} />
            <div>
              <div style={{ fontSize:"0.65rem", color:"var(--em-d)", textTransform:"uppercase", fontWeight:700 }}>Total día</div>
              <div style={{ fontWeight:700, fontSize:"1rem", color:"var(--em-d)" }}>${totalDia.toLocaleString("es-AR")}</div>
            </div>
          </div>
        </div>
      )}

      {!tid ? null : error ? <ModuloError mensaje={error} /> : loading ? <ModuloLoading /> : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {!data?.cobros?.length ? <ModuloVacio texto="Sin cobros para esta fecha" icono="bi-cash-stack" /> : (
            <table className="tbl">
              <thead><tr><th>Venta</th><th>Medio</th><th>Monto</th><th>Referencia</th><th>Hora</th></tr></thead>
              <tbody>
                {data.cobros.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontSize:"0.72rem", fontFamily:"monospace" }}>{c.numero_venta || "—"}</td>
                    <td><span className="bdg bdg-blue">{c.medio}</span></td>
                    <td style={{ fontWeight:700 }}>${Number(c.monto).toFixed(2)}</td>
                    <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{c.referencia || "—"}</td>
                    <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{new Date(c.creado_en).toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" })}</td>
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
