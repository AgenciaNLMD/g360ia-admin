"use client";
// app/portal/dashboard/clientes/page.js

import { useState, useEffect } from "react";
import PortalShell, { UpgradeBanner } from "@/components/PortalShell";
import { useSession } from "next-auth/react";

const CF_LABELS = { RI: "Resp. Inscripto", MT: "Monotributista", CF: "Consumidor Final", EX: "Exento" };

export default function ClientesPage() {
  const { data: session } = useSession();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [buscar, setBuscar]     = useState("");
  const [estado, setEstado]     = useState("");
  const [modal, setModal]       = useState(null); // null | 'nuevo' | {id, ...}
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => { cargar(); }, [estado]);

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (estado) params.set("estado", estado);
      if (buscar) params.set("q", buscar);
      const res = await fetch(`/api/portal/clientes?${params}`);
      const d   = await res.json();
      if (d.ok) setClientes(d.clientes);
    } finally { setLoading(false); }
  }

  function abrirNuevo() {
    setForm({ nombre: "", razon_social: "", cuit: "", condicion_fiscal: "CF", telefono: "", email: "", direccion: "", rubro: "", notas: "" });
    setError("");
    setModal("nuevo");
  }

  function abrirEditar(c) {
    setForm({ ...c });
    setError("");
    setModal(c);
  }

  async function guardar() {
    if (!form.nombre) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError("");
    try {
      const esNuevo = modal === "nuevo";
      const res = await fetch("/api/portal/clientes", {
        method: esNuevo ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(esNuevo ? form : { id: modal.id, ...form }),
      });
      const d = await res.json();
      if (d.ok) { setModal(null); cargar(); }
      else setError(d.error || "Error al guardar");
    } finally { setSaving(false); }
  }

  const clientesFiltrados = clientes.filter(c =>
    !buscar ||
    c.nombre?.toLowerCase().includes(buscar.toLowerCase()) ||
    c.email?.toLowerCase().includes(buscar.toLowerCase()) ||
    c.cuit?.includes(buscar) ||
    c.telefono?.includes(buscar)
  );

  return (
    <PortalShell title="Clientes" subtitle="Ficha y gestión de clientes">
      <div className="ps-anim">
        {/* Toolbar */}
        <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
          <input
            className="ps-input" placeholder="Buscar por nombre, CUIT, email…"
            style={{ maxWidth:280 }} value={buscar}
            onChange={e => setBuscar(e.target.value)}
            onKeyDown={e => e.key === "Enter" && cargar()}
          />
          <select className="ps-input" style={{ maxWidth:160 }} value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          <div style={{ flex:1 }} />
          <button className="ps-btn ps-btn-primary" onClick={abrirNuevo}>
            <i className="bi bi-plus-lg" /> Nuevo cliente
          </button>
        </div>

        {/* Tabla */}
        <div className="ps-card" style={{ padding:0, overflow:"hidden" }}>
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Nombre / Razón social</th>
                  <th>CUIT</th>
                  <th>Condición fiscal</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} style={{ textAlign:"center", color:"var(--muted)", padding:24 }}>Cargando…</td></tr>
                )}
                {!loading && clientesFiltrados.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign:"center", color:"var(--muted)", padding:24 }}>Sin clientes</td></tr>
                )}
                {clientesFiltrados.map(c => (
                  <tr key={c.id} style={{ cursor:"pointer" }} onClick={() => abrirEditar(c)}>
                    <td>
                      <div style={{ fontWeight:600, color:"var(--text)" }}>{c.nombre}</div>
                      {c.razon_social && <div style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{c.razon_social}</div>}
                    </td>
                    <td style={{ fontFamily:"monospace" }}>{c.cuit || "—"}</td>
                    <td>{CF_LABELS[c.condicion_fiscal] || "—"}</td>
                    <td>{c.telefono || "—"}</td>
                    <td>{c.email || "—"}</td>
                    <td>
                      <span className={`ps-badge ps-badge-${c.estado === "activo" ? "green" : "gray"}`}>
                        {c.estado === "activo" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td><i className="bi bi-chevron-right" style={{ color:"var(--muted)" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal nuevo/editar */}
        {modal && (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div className="ps-card" style={{ width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"auto" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                <div style={{ fontWeight:700,fontSize:"0.92rem" }}>
                  {modal === "nuevo" ? "Nuevo cliente" : "Editar cliente"}
                </div>
                <button className="ps-btn ps-btn-secondary" style={{ padding:"4px 10px" }} onClick={() => setModal(null)}>✕</button>
              </div>

              {error && <div style={{ background:"var(--red-bg)",color:"var(--red)",padding:"8px 12px",borderRadius:"var(--r-sm)",marginBottom:12,fontSize:"0.78rem" }}>{error}</div>}

              <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
                <div>
                  <label className="ps-label">Nombre *</label>
                  <input className="ps-input" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} />
                </div>
                <div>
                  <label className="ps-label">Razón social</label>
                  <input className="ps-input" value={form.razon_social||""} onChange={e=>setForm({...form,razon_social:e.target.value})} />
                </div>
              </div>
              <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
                <div>
                  <label className="ps-label">CUIT (XX-XXXXXXXX-X)</label>
                  <input className="ps-input" value={form.cuit||""} onChange={e=>setForm({...form,cuit:e.target.value})} placeholder="20-12345678-9" />
                </div>
                <div>
                  <label className="ps-label">Condición fiscal</label>
                  <select className="ps-input" value={form.condicion_fiscal||"CF"} onChange={e=>setForm({...form,condicion_fiscal:e.target.value})}>
                    <option value="RI">Responsable Inscripto</option>
                    <option value="MT">Monotributista</option>
                    <option value="CF">Consumidor Final</option>
                    <option value="EX">Exento</option>
                  </select>
                </div>
              </div>
              <div className="ps-g2" style={{ gap:12,marginBottom:12 }}>
                <div>
                  <label className="ps-label">Teléfono</label>
                  <input className="ps-input" value={form.telefono||""} onChange={e=>setForm({...form,telefono:e.target.value})} />
                </div>
                <div>
                  <label className="ps-label">Email</label>
                  <input className="ps-input" type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Dirección</label>
                <input className="ps-input" value={form.direccion||""} onChange={e=>setForm({...form,direccion:e.target.value})} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label className="ps-label">Rubro</label>
                <input className="ps-input" value={form.rubro||""} onChange={e=>setForm({...form,rubro:e.target.value})} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label className="ps-label">Notas internas</label>
                <textarea className="ps-input" rows={3} value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})} style={{ resize:"vertical" }} />
              </div>
              {modal !== "nuevo" && (
                <div style={{ marginBottom:16 }}>
                  <label className="ps-label">Estado</label>
                  <select className="ps-input" value={form.estado||"activo"} onChange={e=>setForm({...form,estado:e.target.value})}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              )}

              <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                <button className="ps-btn ps-btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button className="ps-btn ps-btn-primary" onClick={guardar} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
