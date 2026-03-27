"use client";
import { useState } from "react";
import { useTenants, useModuloData, TenantSelector, ModuloLoading, ModuloVacio, ModuloError } from "./AdminModuloShell";

const PAGO_META   = { pendiente:{label:"Pendiente",cls:"bdg-amber"}, parcial:{label:"Parcial",cls:"bdg-blue"}, pagado:{label:"Pagado",cls:"bdg-em"} };
const ORIGEN_META = { ot:{label:"OT",cls:"bdg-blue"}, crm:{label:"CRM",cls:"bdg-amber"}, mostrador:{label:"Mostrador",cls:"bdg-moon"} };

export default function ViewAdminVentas() {
  const tenants = useTenants();
  const [tid, setTid] = useState("");
  const { data, loading, error } = useModuloData("ventas", tid);

  const totalVentas = data?.ventas?.reduce((s,v) => s + Number(v.total || 0), 0) || 0;
  const sinCobrar   = data?.ventas?.filter(v => v.estado_pago !== "pagado").reduce((s,v) => s + Number(v.total || 0), 0) || 0;

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Ventas</div><div className="vh-sub">{data ? `${data.ventas?.length || 0} ventas · $${totalVentas.toLocaleString("es-AR")} total` : "Comprobantes del tenant"}</div></div>
      </div>
      <TenantSelector tenants={tenants} value={tid} onChange={setTid} />

      {tid && data && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
          {[
            { label:"Total facturado",  valor:`$${totalVentas.toLocaleString("es-AR")}`,      icon:"bi-cart3",       color:"var(--pr)" },
            { label:"Sin cobrar",       valor:`$${sinCobrar.toLocaleString("es-AR")}`,         icon:"bi-clock-history",color:"var(--amber)" },
            { label:"Cant. ventas",     valor:data.ventas?.length || 0,                        icon:"bi-receipt",     color:"var(--em-d)" },
          ].map(k => (
            <div key={k.label} className="card" style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px" }}>
              <i className={`bi ${k.icon}`} style={{ fontSize:"1.3rem", color:k.color }} />
              <div>
                <div style={{ fontSize:"0.65rem", color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>{k.label}</div>
                <div style={{ fontWeight:700, fontSize:"1rem", color:k.color }}>{k.valor}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!tid ? null : error ? <ModuloError mensaje={error} /> : loading ? <ModuloLoading /> : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {!data?.ventas?.length ? <ModuloVacio texto="Sin ventas" icono="bi-cart3" /> : (
            <table className="tbl">
              <thead><tr><th>N° Venta</th><th>Cliente</th><th>Origen</th><th>Total</th><th>Pago</th><th>Facturación</th><th>Fecha</th></tr></thead>
              <tbody>
                {data.ventas.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight:700, fontFamily:"monospace", fontSize:"0.78rem" }}>{v.numero_venta}</td>
                    <td style={{ fontSize:"0.78rem" }}>{v.cliente_nombre || "—"}</td>
                    <td><span className={`bdg ${ORIGEN_META[v.origen]?.cls}`}>{ORIGEN_META[v.origen]?.label || v.origen}</span></td>
                    <td style={{ fontWeight:700 }}>${Number(v.total).toFixed(2)}</td>
                    <td><span className={`bdg ${PAGO_META[v.estado_pago]?.cls}`}>{PAGO_META[v.estado_pago]?.label}</span></td>
                    <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{v.estado_facturacion === "facturado" ? <span className="bdg bdg-em">Facturado</span> : "Sin factura"}</td>
                    <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{new Date(v.creado_en).toLocaleDateString("es-AR")}</td>
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
