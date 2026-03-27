"use client";
import { useState } from "react";
import { useTenants, useModuloData, TenantSelector, ModuloLoading, ModuloVacio, ModuloError } from "./AdminModuloShell";

export default function ViewAdminFacturacion() {
  const tenants = useTenants();
  const [tid, setTid] = useState("");
  const { data, loading, error } = useModuloData("facturacion", tid);

  const config = data?.config;

  return (
    <div className="view-anim">
      <div className="vh">
        <div><div className="vh-title">Facturación ARCA</div><div className="vh-sub">Facturas electrónicas del tenant</div></div>
      </div>
      <TenantSelector tenants={tenants} value={tid} onChange={setTid} />

      {tid && config && (
        <div className="card" style={{ marginBottom:14, display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:"0.65rem", color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>CUIT</div>
            <div style={{ fontWeight:600, fontSize:"0.85rem" }}>{config.cuit || "No configurado"}</div>
          </div>
          <div>
            <div style={{ fontSize:"0.65rem", color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Razón social</div>
            <div style={{ fontWeight:600, fontSize:"0.85rem" }}>{config.razon_social || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize:"0.65rem", color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Modo</div>
            <span className={`bdg ${config.modo === "prod" ? "bdg-em" : "bdg-amber"}`}>{config.modo === "prod" ? "Producción" : "Homologación"}</span>
          </div>
        </div>
      )}

      {!tid ? null : error ? <ModuloError mensaje={error} /> : loading ? <ModuloLoading /> : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {!data?.facturas?.length ? <ModuloVacio texto="Sin facturas emitidas" icono="bi-receipt" /> : (
            <table className="tbl">
              <thead><tr><th>N° Factura</th><th>Venta</th><th>Tipo</th><th>Monto</th><th>CAE</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody>
                {data.facturas.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight:700, fontFamily:"monospace", fontSize:"0.78rem" }}>{f.numero || "—"}</td>
                    <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{f.numero_venta || "—"}</td>
                    <td><span className="bdg bdg-blue">Factura {f.tipo}</span></td>
                    <td style={{ fontWeight:600 }}>${Number(f.monto).toFixed(2)}</td>
                    <td style={{ fontSize:"0.7rem", fontFamily:"monospace", color:"var(--muted)" }}>{f.cae || "—"}</td>
                    <td><span className={`bdg ${f.estado === "emitida" ? "bdg-em" : f.estado === "anulada" ? "bdg-red" : "bdg-amber"}`}>{f.estado}</span></td>
                    <td style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{new Date(f.creado_en).toLocaleDateString("es-AR")}</td>
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
