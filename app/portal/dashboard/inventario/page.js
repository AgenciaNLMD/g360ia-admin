"use client";
// app/portal/dashboard/inventario/page.js

import { useState, useEffect } from "react";
import PortalShell from "@/components/PortalShell";

export default function InventarioPage() {
  const [inventario, setInventario] = useState([]);
  const [alertas, setAlertas]       = useState(0);
  const [loading, setLoading]       = useState(true);
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [buscar, setBuscar]           = useState("");
  const [modalAjuste, setModalAjuste] = useState(null);
  const [modalMin, setModalMin]       = useState(null);
  const [modalHistorial, setModalHistorial] = useState(null);
  const [movimientos, setMovimientos]       = useState([]);
  const [ajuste, setAjuste]                 = useState({ tipo: "entrada", cantidad: 1, nota: "" });
  const [stockMin, setStockMin]             = useState(0);
  const [saving, setSaving]                 = useState(false);

  useEffect(() => { cargar(); }, [soloAlertas]);

  async function cargar() {
    setLoading(true);
    const params = new URLSearchParams();
    if (soloAlertas) params.set("alerta", "1");
    const res = await fetch(`/api/portal/inventario?${params}`);
    const d   = await res.json();
    if (d.ok) { setInventario(d.inventario); setAlertas(d.alertas); }
    setLoading(false);
  }

  async function abrirHistorial(item) {
    setModalHistorial(item);
    const res = await fetch(`/api/portal/inventario?catalogo_id=${item.catalogo_id}`);
    const d   = await res.json();
    if (d.ok) setMovimientos(d.movimientos);
  }

  async function guardarAjuste() {
    if (!ajuste.cantidad || !modalAjuste) return;
    setSaving(true);
    const res = await fetch("/api/portal/inventario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogo_id: modalAjuste.catalogo_id, ...ajuste, origen: "ajuste_manual" }),
    });
    const d = await res.json();
    setSaving(false);
    if (d.ok) { setModalAjuste(null); cargar(); }
  }

  async function guardarStockMin() {
    if (!modalMin) return;
    setSaving(true);
    const res = await fetch("/api/portal/inventario", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogo_id: modalMin.catalogo_id, stock_minimo: stockMin }),
    });
    setSaving(false);
    if ((await res.json()).ok) { setModalMin(null); cargar(); }
  }

  const filtrado = inventario.filter(i =>
    !buscar || i.nombre?.toLowerCase().includes(buscar.toLowerCase()) || i.sku?.includes(buscar)
  );

  const badgeEstado = (s) => ({
    ok:         { label: "OK",        cls: "ps-badge-green" },
    bajo:       { label: "Bajo",      cls: "ps-badge-amber" },
    sin_stock:  { label: "Sin stock", cls: "ps-badge-red" },
  }[s] || { label: s, cls: "ps-badge-gray" });

  return (
    <PortalShell title="Inventario" subtitle="Stock de productos" badgeInventario={alertas}>
      <div className="ps-anim">
        {alertas > 0 && (
          <div style={{ background:"var(--red-bg)",border:"1px solid #F5C6C5",borderRadius:"var(--r)",padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10,fontSize:"0.8rem" }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color:"var(--red)" }} />
            <span style={{ fontWeight:600,color:"var(--red)" }}>{alertas} producto{alertas!==1?"s":""} con stock bajo o agotado</span>
          </div>
        )}

        <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" }}>
          <input className="ps-input" placeholder="Buscar producto…" style={{ maxWidth:260 }}
            value={buscar} onChange={e => setBuscar(e.target.value)} />
          <label style={{ display:"flex",alignItems:"center",gap:6,fontSize:"0.78rem",color:"var(--text2)",cursor:"pointer" }}>
            <input type="checkbox" checked={soloAlertas} onChange={e => setSoloAlertas(e.target.checked)} />
            Solo alertas
          </label>
        </div>

        <div className="ps-card" style={{ padding:0,overflow:"hidden" }}>
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Stock actual</th>
                  <th>Stock mínimo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Cargando…</td></tr>}
                {!loading && filtrado.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center",padding:24,color:"var(--muted)" }}>Sin productos en inventario</td></tr>}
                {filtrado.map(item => {
                  const b = badgeEstado(item.estado_stock);
                  return (
                    <tr key={item.catalogo_id}>
                      <td style={{ fontWeight:600 }}>{item.nombre}</td>
                      <td style={{ fontFamily:"monospace",fontSize:"0.75rem" }}>{item.sku || "—"}</td>
                      <td style={{ fontWeight:700,fontSize:"0.92rem" }}>{Number(item.stock_actual).toFixed(0)}</td>
                      <td style={{ color:"var(--muted)" }}>{Number(item.stock_minimo).toFixed(0)}</td>
                      <td><span className={`ps-badge ${b.cls}`}>{b.label}</span></td>
                      <td>
                        <div style={{ display:"flex",gap:6 }}>
                          <button className="ps-btn ps-btn-secondary" style={{ padding:"4px 8px",fontSize:"0.72rem" }}
                            onClick={() => { setModalAjuste(item); setAjuste({ tipo:"entrada",cantidad:1,nota:"" }); }}>
                            Ajuste
                          </button>
                          <button className="ps-btn ps-btn-secondary" style={{ padding:"4px 8px",fontSize:"0.72rem" }}
                            onClick={() => { setModalMin(item); setStockMin(Number(item.stock_minimo)); }}>
                            Mín.
                          </button>
                          <button className="ps-btn ps-btn-secondary" style={{ padding:"4px 8px",fontSize:"0.72rem" }}
                            onClick={() => abrirHistorial(item)}>
                            <i className="bi bi-clock-history" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal ajuste */}
        {modalAjuste && (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div className="ps-card" style={{ width:"100%",maxWidth:380 }}>
              <div style={{ fontWeight:700,marginBottom:16,fontSize:"0.92rem" }}>Ajuste de stock — {modalAjuste.nombre}</div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Tipo de movimiento</label>
                <select className="ps-input" value={ajuste.tipo} onChange={e=>setAjuste({...ajuste,tipo:e.target.value})}>
                  <option value="entrada">Entrada (compra / recepción)</option>
                  <option value="salida">Salida (uso / rotura)</option>
                  <option value="ajuste">Ajuste de inventario</option>
                </select>
              </div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Cantidad</label>
                <input className="ps-input" type="number" min={0.001} step={0.001}
                  value={ajuste.cantidad} onChange={e=>setAjuste({...ajuste,cantidad:e.target.value})} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label className="ps-label">Nota (opcional)</label>
                <input className="ps-input" value={ajuste.nota} onChange={e=>setAjuste({...ajuste,nota:e.target.value})} />
              </div>
              <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                <button className="ps-btn ps-btn-secondary" onClick={() => setModalAjuste(null)}>Cancelar</button>
                <button className="ps-btn ps-btn-primary" onClick={guardarAjuste} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal stock mínimo */}
        {modalMin && (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div className="ps-card" style={{ width:"100%",maxWidth:320 }}>
              <div style={{ fontWeight:700,marginBottom:16,fontSize:"0.92rem" }}>Stock mínimo — {modalMin.nombre}</div>
              <label className="ps-label">Stock mínimo de alerta</label>
              <input className="ps-input" type="number" min={0} value={stockMin} onChange={e=>setStockMin(e.target.value)} style={{ marginBottom:16 }} />
              <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                <button className="ps-btn ps-btn-secondary" onClick={() => setModalMin(null)}>Cancelar</button>
                <button className="ps-btn ps-btn-primary" onClick={guardarStockMin} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal historial */}
        {modalHistorial && (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div className="ps-card" style={{ width:"100%",maxWidth:520,maxHeight:"80vh",overflow:"auto" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                <div style={{ fontWeight:700,fontSize:"0.92rem" }}>Historial — {modalHistorial.nombre}</div>
                <button className="ps-btn ps-btn-secondary" style={{ padding:"4px 10px" }} onClick={() => setModalHistorial(null)}>✕</button>
              </div>
              <table className="ps-table">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Stock resultante</th><th>Origen</th></tr></thead>
                <tbody>
                  {movimientos.length === 0 && <tr><td colSpan={5} style={{ textAlign:"center",color:"var(--muted)",padding:16 }}>Sin movimientos</td></tr>}
                  {movimientos.map(m => (
                    <tr key={m.id}>
                      <td>{new Date(m.creado_en).toLocaleDateString("es-AR")}</td>
                      <td><span className={`ps-badge ${m.tipo==="entrada"?"ps-badge-green":m.tipo==="salida"?"ps-badge-red":"ps-badge-gray"}`}>{m.tipo}</span></td>
                      <td>{m.tipo==="salida"||m.tipo==="reserva" ? "-" : "+"}{Number(m.cantidad).toFixed(0)}</td>
                      <td style={{ fontWeight:600 }}>{Number(m.stock_resultante).toFixed(0)}</td>
                      <td style={{ fontSize:"0.72rem",color:"var(--muted)" }}>{m.origen} {m.origen_id ? `#${m.origen_id}` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
