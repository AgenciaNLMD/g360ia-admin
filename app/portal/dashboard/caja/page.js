"use client";
// app/portal/dashboard/caja/page.js

import { useState, useEffect } from "react";
import PortalShell from "@/components/PortalShell";

const MEDIO_LABELS = { efectivo:"Efectivo", transferencia:"Transferencia", mercadopago:"MercadoPago", otro:"Otro" };
const MEDIO_COLORS = { efectivo:"ps-badge-green", transferencia:"ps-badge-blue", mercadopago:"ps-badge-blue", otro:"ps-badge-gray" };

export default function CajaPage() {
  const hoy = new Date().toISOString().split("T")[0];
  const [fecha, setFecha]       = useState(hoy);
  const [cobros, setCobros]     = useState([]);
  const [resumen, setResumen]   = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => { cargar(); }, [fecha]);

  async function cargar() {
    setLoading(true);
    const res = await fetch(`/api/portal/caja?fecha=${fecha}`);
    const d   = await res.json();
    if (d.ok) { setCobros(d.cobros); setResumen(d.resumen); }
    setLoading(false);
  }

  const medios = ["efectivo","transferencia","mercadopago","otro"].filter(m => resumen[m] > 0);

  return (
    <PortalShell title="Caja" subtitle="Cobros y resumen del día">
      <div className="ps-anim">

        {/* Selector de fecha */}
        <div style={{ display:"flex",gap:10,marginBottom:16,alignItems:"center" }}>
          <label className="ps-label" style={{ marginBottom:0 }}>Fecha:</label>
          <input className="ps-input" type="date" style={{ maxWidth:180 }} value={fecha}
            onChange={e => setFecha(e.target.value)} />
          {fecha !== hoy && (
            <button className="ps-btn ps-btn-secondary" onClick={() => setFecha(hoy)}>Hoy</button>
          )}
        </div>

        {/* Resumen del día */}
        <div className="ps-g4" style={{ marginBottom:16 }}>
          <div className="ps-card" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase",color:"var(--muted)",marginBottom:6 }}>Total del día</div>
            <div style={{ fontSize:"1.4rem",fontWeight:800,color:"var(--green)" }}>${Number(resumen.total || 0).toFixed(2)}</div>
          </div>
          {medios.map(m => (
            <div key={m} className="ps-card" style={{ textAlign:"center" }}>
              <div style={{ fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase",color:"var(--muted)",marginBottom:6 }}>{MEDIO_LABELS[m]}</div>
              <div style={{ fontSize:"1.1rem",fontWeight:700 }}>${Number(resumen[m]).toFixed(2)}</div>
            </div>
          ))}
        </div>

        {/* Listado de cobros */}
        <div className="ps-card" style={{ padding:0,overflow:"hidden" }}>
          <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",fontWeight:700,fontSize:"0.82rem" }}>
            Cobros del {new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday:"long",day:"numeric",month:"long" })}
          </div>
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead>
                <tr><th>Hora</th><th>Cliente</th><th>Venta</th><th>Medio</th><th>Referencia</th><th>Monto</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Cargando…</td></tr>}
                {!loading && cobros.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>
                    No hay cobros registrados para esta fecha
                  </td></tr>
                )}
                {cobros.map(c => (
                  <tr key={c.id}>
                    <td style={{ color:"var(--muted)",fontSize:"0.75rem" }}>
                      {new Date(c.creado_en).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}
                    </td>
                    <td>{c.cliente_nombre || "—"}</td>
                    <td style={{ fontFamily:"monospace" }}>{c.numero_venta || "—"}</td>
                    <td><span className={`ps-badge ${MEDIO_COLORS[c.medio]}`}>{MEDIO_LABELS[c.medio]}</span></td>
                    <td style={{ fontSize:"0.72rem",color:"var(--muted)" }}>
                      {c.referencia || c.mp_payment_id || "—"}
                    </td>
                    <td style={{ fontWeight:700,color:"var(--green)" }}>${Number(c.monto).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && cobros.length > 0 && (
            <div style={{ padding:"10px 16px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:4,fontSize:"0.8rem",fontWeight:700 }}>
              <span style={{ color:"var(--muted)" }}>Total:</span>
              <span style={{ color:"var(--green)" }}>${Number(resumen.total || 0).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="ps-card" style={{ marginTop:16,background:"var(--green-l)",border:"1px solid var(--em-mid)" }}>
          <div style={{ fontSize:"0.75rem",color:"var(--em-d)",lineHeight:1.5 }}>
            <i className="bi bi-info-circle" style={{ marginRight:6 }} />
            Los cobros se registran desde el módulo <strong>Ventas</strong> al abrir una venta y hacer clic en &quot;Registrar cobro&quot;.
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
