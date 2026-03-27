"use client";
// app/portal/dashboard/facturacion/page.js

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PortalShell, { UpgradeBanner } from "@/components/PortalShell";
import { canUse } from "@/lib/plan-guard";

export default function FacturacionPage() {
  const { data: session } = useSession();
  const plan = session?.user?.tenantPlan || "free";

  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filtros, setFiltros]   = useState({ tipo:"", desde:"", hasta:"" });

  useEffect(() => { if (canUse(plan, "facturacion_arca")) cargar(); else setLoading(false); }, [filtros, plan]);

  async function cargar() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtros.tipo)  params.set("tipo",  filtros.tipo);
    if (filtros.desde) params.set("desde", filtros.desde);
    if (filtros.hasta) params.set("hasta", filtros.hasta);
    const res = await fetch(`/api/portal/facturacion?${params}`);
    const d   = await res.json();
    if (d.ok) setFacturas(d.facturas);
    setLoading(false);
  }

  if (!canUse(plan, "facturacion_arca")) {
    return (
      <PortalShell title="Facturación ARCA" subtitle="Comprobantes electrónicos">
        <div className="ps-anim">
          <UpgradeBanner feature="Facturación electrónica ARCA" planRequerido="Pro" />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="Facturación ARCA" subtitle="Comprobantes electrónicos">
      <div className="ps-anim">
        <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" }}>
          <select className="ps-input" style={{ maxWidth:140 }} value={filtros.tipo}
            onChange={e=>setFiltros({...filtros,tipo:e.target.value})}>
            <option value="">Todos los tipos</option>
            <option value="A">Factura A</option>
            <option value="B">Factura B</option>
            <option value="C">Factura C</option>
            <option value="NC_A">Nota de crédito A</option>
            <option value="NC_B">Nota de crédito B</option>
          </select>
          <input className="ps-input" type="date" style={{ maxWidth:160 }} value={filtros.desde}
            onChange={e=>setFiltros({...filtros,desde:e.target.value})} />
          <input className="ps-input" type="date" style={{ maxWidth:160 }} value={filtros.hasta}
            onChange={e=>setFiltros({...filtros,hasta:e.target.value})} />
        </div>

        <div className="ps-card" style={{ padding:0,overflow:"hidden" }}>
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Comprobante</th>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>CAE</th>
                  <th>Vencimiento CAE</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Cargando…</td></tr>}
                {!loading && facturas.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>
                    Sin facturas emitidas. Las facturas se generan desde el módulo Ventas.
                  </td></tr>
                )}
                {facturas.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontFamily:"monospace",fontWeight:700 }}>{f.numero_comprobante}</td>
                    <td>
                      <span className="ps-badge ps-badge-blue">
                        {f.tipo_comprobante.startsWith("NC") ? f.tipo_comprobante.replace("_"," ") : `Factura ${f.tipo_comprobante}`}
                      </span>
                    </td>
                    <td>{f.cliente_nombre || "—"}</td>
                    <td style={{ fontWeight:700 }}>${Number(f.total).toFixed(2)}</td>
                    <td style={{ fontFamily:"monospace",fontSize:"0.72rem" }}>{f.cae || "—"}</td>
                    <td style={{ fontSize:"0.75rem" }}>
                      {f.cae_vencimiento ? new Date(f.cae_vencimiento).toLocaleDateString("es-AR") : "—"}
                    </td>
                    <td>{new Date(f.creado_en).toLocaleDateString("es-AR")}</td>
                    <td>
                      <div style={{ display:"flex",gap:6 }}>
                        {f.pdf_path && (
                          <a href={f.pdf_path} target="_blank" rel="noreferrer" className="ps-btn ps-btn-secondary" style={{ padding:"4px 8px",fontSize:"0.72rem" }}>
                            <i className="bi bi-file-pdf" /> PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ps-card" style={{ marginTop:16,background:"var(--green-l)",border:"1px solid var(--em-mid)" }}>
          <div style={{ fontSize:"0.78rem",color:"var(--green)",fontWeight:600,marginBottom:4 }}>
            <i className="bi bi-info-circle" style={{ marginRight:6 }} />
            ¿Cómo emitir una factura?
          </div>
          <div style={{ fontSize:"0.75rem",color:"var(--em-d)",lineHeight:1.5 }}>
            Las facturas se generan desde el módulo <strong>Ventas</strong>. Abrí una venta y usá el botón &quot;Generar factura ARCA&quot;.
            Asegurate de tener configurado tu CUIT y certificado digital en <strong>Configuración → ARCA</strong>.
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
