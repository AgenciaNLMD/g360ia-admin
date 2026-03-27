"use client";
// app/portal/dashboard/ventas/page.js

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PortalShell from "@/components/PortalShell";

const PAGO_LABELS    = { pendiente:"Pendiente", parcial:"Parcial", pagado:"Pagado" };
const PAGO_CLASSES   = { pendiente:"ps-badge-amber", parcial:"ps-badge-blue", pagado:"ps-badge-green" };
const FACTU_LABELS   = { sin_facturar:"Sin facturar", facturado:"Facturado" };
const ORIGEN_LABELS  = { ot:"OT", crm:"CRM", mostrador:"Mostrador" };

export default function VentasPage() {
  const { data: session } = useSession();
  const [ventas, setVentas]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filtros, setFiltros]   = useState({ estado_pago:"", estado_facturacion:"" });
  const [detalle, setDetalle]   = useState(null);
  const [modalCobro, setModalCobro] = useState(null);
  const [cobro, setCobro]           = useState({ medio:"efectivo", monto:0, referencia:"" });
  const [saving, setSaving]         = useState(false);
  const [mpLink, setMpLink]         = useState(null);
  const [loadingMp, setLoadingMp]   = useState(false);

  useEffect(() => { cargar(); }, [filtros]);

  async function cargar() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtros.estado_pago)        params.set("estado_pago", filtros.estado_pago);
    if (filtros.estado_facturacion) params.set("estado_facturacion", filtros.estado_facturacion);
    const res = await fetch(`/api/portal/ventas?${params}`);
    const d   = await res.json();
    if (d.ok) setVentas(d.ventas);
    setLoading(false);
  }

  async function abrirDetalle(id) {
    const res = await fetch(`/api/portal/ventas?id=${id}`);
    const d   = await res.json();
    if (d.ok) setDetalle(d);
  }

  async function registrarCobro() {
    if (!cobro.monto) return;
    setSaving(true);
    const res = await fetch("/api/portal/caja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venta_id: detalle.venta.id, cliente_id: detalle.venta.cliente_id, ...cobro }),
    });
    setSaving(false);
    if ((await res.json()).ok) {
      setModalCobro(null);
      abrirDetalle(detalle.venta.id);
      cargar();
    }
  }

  async function generarLinkMP() {
    setLoadingMp(true);
    const res = await fetch("/api/portal/mp/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venta_id: detalle.venta.id }),
    });
    const d = await res.json();
    setLoadingMp(false);
    if (d.ok) setMpLink(d.link);
    else alert(d.error || "Error generando link");
  }

  if (detalle) {
    const v = detalle.venta;
    return (
      <PortalShell title={`Venta ${v.numero_venta}`} subtitle={v.cliente_nombre || "Sin cliente"}>
        <div className="ps-anim">
          <button className="ps-btn ps-btn-secondary" style={{ marginBottom:16 }} onClick={() => { setDetalle(null); setMpLink(null); }}>
            <i className="bi bi-arrow-left" /> Volver
          </button>

          <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
            <div className="ps-card">
              <div style={{ fontWeight:700,marginBottom:12,fontSize:"0.82rem" }}>Datos de la venta</div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.78rem",marginBottom:6 }}>
                <span style={{ color:"var(--muted)" }}>N° Venta</span><span style={{ fontWeight:700 }}>{v.numero_venta}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.78rem",marginBottom:6 }}>
                <span style={{ color:"var(--muted)" }}>Cliente</span><span>{v.cliente_nombre || "—"}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.78rem",marginBottom:6 }}>
                <span style={{ color:"var(--muted)" }}>Origen</span><span>{ORIGEN_LABELS[v.origen] || v.origen}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.78rem",marginBottom:6 }}>
                <span style={{ color:"var(--muted)" }}>Fecha</span><span>{new Date(v.creado_en).toLocaleDateString("es-AR")}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.78rem",marginBottom:6 }}>
                <span style={{ color:"var(--muted)" }}>Pago</span>
                <span className={`ps-badge ${PAGO_CLASSES[v.estado_pago]}`}>{PAGO_LABELS[v.estado_pago]}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.78rem" }}>
                <span style={{ color:"var(--muted)" }}>Facturación</span>
                <span className={`ps-badge ${v.estado_facturacion === "facturado" ? "ps-badge-green" : "ps-badge-gray"}`}>
                  {FACTU_LABELS[v.estado_facturacion]}
                </span>
              </div>
            </div>

            <div className="ps-card">
              <div style={{ fontWeight:700,marginBottom:12,fontSize:"0.82rem" }}>Totales</div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.78rem",marginBottom:6 }}>
                <span>Subtotal</span><span>${Number(v.subtotal).toFixed(2)}</span>
              </div>
              {Number(v.descuento) > 0 && (
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.78rem",marginBottom:6,color:"var(--red)" }}>
                  <span>Descuento</span><span>-${Number(v.descuento).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:"1rem",borderTop:"1px solid var(--border)",paddingTop:8,marginTop:8 }}>
                <span>Total</span><span style={{ color:"var(--green)" }}>${Number(v.total).toFixed(2)}</span>
              </div>

              <div style={{ marginTop:16,display:"flex",flexDirection:"column",gap:8 }}>
                {v.estado_pago !== "pagado" && (
                  <button className="ps-btn ps-btn-primary" style={{ justifyContent:"center" }}
                    onClick={() => { setCobro({ medio:"efectivo",monto:Number(v.total),referencia:"" }); setModalCobro(true); }}>
                    <i className="bi bi-cash" /> Registrar cobro
                  </button>
                )}
                {v.estado_pago !== "pagado" && (
                  <button className="ps-btn ps-btn-secondary" style={{ justifyContent:"center" }}
                    onClick={generarLinkMP} disabled={loadingMp}>
                    <i className="bi bi-credit-card" /> {loadingMp ? "Generando…" : "Link MercadoPago"}
                  </button>
                )}
                {mpLink && (
                  <a href={mpLink} target="_blank" rel="noreferrer"
                    style={{ background:"#009EE3",color:"#fff",padding:"8px 14px",borderRadius:"var(--r-sm)",textDecoration:"none",fontSize:"0.8rem",fontWeight:600,display:"flex",alignItems:"center",gap:6,justifyContent:"center" }}>
                    <i className="bi bi-box-arrow-up-right" /> Ir a pagar con MP
                  </a>
                )}
                {v.estado_facturacion !== "facturado" && (
                  <button className="ps-btn ps-btn-secondary" style={{ justifyContent:"center" }}
                    onClick={async () => {
                      const r = await fetch("/api/portal/facturacion", {
                        method:"POST",
                        headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({ venta_id: v.id }),
                      });
                      const d = await r.json();
                      if (d.ok) abrirDetalle(v.id);
                      else alert(d.error || "Error facturando");
                    }}>
                    <i className="bi bi-receipt" /> Generar factura ARCA
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Ítems */}
          <div className="ps-card" style={{ marginBottom:12 }}>
            <div style={{ fontWeight:700,marginBottom:12,fontSize:"0.82rem" }}>Ítems</div>
            <table className="ps-table">
              <thead><tr><th>Descripción</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
              <tbody>
                {detalle.items.map(i => (
                  <tr key={i.id}>
                    <td>{i.descripcion}</td>
                    <td>{Number(i.cantidad).toFixed(0)}</td>
                    <td>${Number(i.precio_unitario).toFixed(2)}</td>
                    <td style={{ fontWeight:600 }}>${Number(i.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cobros */}
          {detalle.cobros.length > 0 && (
            <div className="ps-card">
              <div style={{ fontWeight:700,marginBottom:12,fontSize:"0.82rem" }}>Cobros registrados</div>
              <table className="ps-table">
                <thead><tr><th>Fecha</th><th>Medio</th><th>Referencia</th><th>Monto</th></tr></thead>
                <tbody>
                  {detalle.cobros.map(c => (
                    <tr key={c.id}>
                      <td>{new Date(c.fecha).toLocaleDateString("es-AR")}</td>
                      <td style={{ textTransform:"capitalize" }}>{c.medio}</td>
                      <td>{c.referencia || c.mp_payment_id || "—"}</td>
                      <td style={{ fontWeight:600 }}>${Number(c.monto).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal cobro */}
          {modalCobro && (
            <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <div className="ps-card" style={{ width:"100%",maxWidth:380 }}>
                <div style={{ fontWeight:700,marginBottom:16,fontSize:"0.92rem" }}>Registrar cobro</div>
                <div style={{ marginBottom:12 }}>
                  <label className="ps-label">Medio de pago</label>
                  <select className="ps-input" value={cobro.medio} onChange={e=>setCobro({...cobro,medio:e.target.value})}>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="mercadopago">MercadoPago</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div style={{ marginBottom:12 }}>
                  <label className="ps-label">Monto</label>
                  <input className="ps-input" type="number" value={cobro.monto} onChange={e=>setCobro({...cobro,monto:e.target.value})} />
                </div>
                <div style={{ marginBottom:16 }}>
                  <label className="ps-label">Referencia / Comprobante</label>
                  <input className="ps-input" value={cobro.referencia} onChange={e=>setCobro({...cobro,referencia:e.target.value})} placeholder="N° transferencia, etc." />
                </div>
                <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                  <button className="ps-btn ps-btn-secondary" onClick={() => setModalCobro(null)}>Cancelar</button>
                  <button className="ps-btn ps-btn-primary" onClick={registrarCobro} disabled={saving}>
                    {saving ? "Guardando…" : "Confirmar cobro"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="Ventas" subtitle="Registro de transacciones comerciales">
      <div className="ps-anim">
        <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" }}>
          <select className="ps-input" style={{ maxWidth:180 }} value={filtros.estado_pago}
            onChange={e => setFiltros({...filtros,estado_pago:e.target.value})}>
            <option value="">Todos los pagos</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
            <option value="pagado">Pagado</option>
          </select>
          <select className="ps-input" style={{ maxWidth:200 }} value={filtros.estado_facturacion}
            onChange={e => setFiltros({...filtros,estado_facturacion:e.target.value})}>
            <option value="">Toda facturación</option>
            <option value="sin_facturar">Sin facturar</option>
            <option value="facturado">Facturado</option>
          </select>
        </div>

        <div className="ps-card" style={{ padding:0,overflow:"hidden" }}>
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead>
                <tr><th>N° Venta</th><th>Cliente</th><th>Origen</th><th>Total</th><th>Pago</th><th>Facturación</th><th>Fecha</th><th></th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Cargando…</td></tr>}
                {!loading && ventas.length === 0 && <tr><td colSpan={8} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Sin ventas registradas</td></tr>}
                {ventas.map(v => (
                  <tr key={v.id} style={{ cursor:"pointer" }} onClick={() => abrirDetalle(v.id)}>
                    <td style={{ fontWeight:700,fontFamily:"monospace" }}>{v.numero_venta}</td>
                    <td>{v.cliente_nombre || "—"}</td>
                    <td><span className="ps-badge ps-badge-gray">{ORIGEN_LABELS[v.origen]}</span></td>
                    <td style={{ fontWeight:700,color:"var(--green)" }}>${Number(v.total).toFixed(2)}</td>
                    <td><span className={`ps-badge ${PAGO_CLASSES[v.estado_pago]}`}>{PAGO_LABELS[v.estado_pago]}</span></td>
                    <td><span className={`ps-badge ${v.estado_facturacion==="facturado"?"ps-badge-green":"ps-badge-gray"}`}>{FACTU_LABELS[v.estado_facturacion]}</span></td>
                    <td>{new Date(v.creado_en).toLocaleDateString("es-AR")}</td>
                    <td><i className="bi bi-chevron-right" style={{ color:"var(--muted)" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
