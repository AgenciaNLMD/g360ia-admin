"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const BADGE = {
  conectado:    "ui-badge--green",
  conectando:   "ui-badge--amber",
  desconectado: "ui-badge--gray",
  error:        "ui-badge--red",
};

const STEP = { FORM: "form", LOADING: "loading", QR: "qr", SUCCESS: "success" };

export default function TabWhatsapp({ tenant_id }) {
  const [instancias, setInstancias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [nombre,     setNombre]     = useState("");
  const [step,       setStep]       = useState(STEP.FORM);
  const [qr,         setQr]         = useState(null);
  const [instanceId, setInstanceId] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const pollRef = useRef(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/mcp/whatsapp/instancias?tenant_id=${tenant_id ?? "null"}`);
      const d = await r.json();
      if (d.ok) setInstancias(d.instancias);
    } finally {
      setLoading(false);
    }
  }, [tenant_id]);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirModal() {
    setModal(true);
    setStep(STEP.FORM);
    setNombre("");
    setQr(null);
    setInstanceId(null);
  }

  function cerrarModal() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setModal(false);
    if (step === STEP.SUCCESS) cargar();
  }

  async function generarQR() {
    setSaving(true);
    setStep(STEP.LOADING);
    try {
      const r = await fetch("/api/mcp/whatsapp/init", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tenant_id: tenant_id ?? null, nombre: nombre.trim() || "Principal" }),
      });
      const d = await r.json();
      if (!d.ok) { setStep(STEP.FORM); return; }

      setInstanceId(d.instance_id);
      setQr(d.qr || null);
      setStep(STEP.QR);
      iniciarPolling(d.instance_id);
    } finally {
      setSaving(false);
    }
  }

  function iniciarPolling(id) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/mcp/whatsapp/status?instance_id=${id}`);
        const d = await r.json();
        if (d.qr && d.qr !== qr) setQr(d.qr);
        if (d.conectado) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setStep(STEP.SUCCESS);
          cargar();
        }
      } catch {}
    }, 3000);
  }

  async function desconectar(inst) {
    if (!confirm(`¿Desconectar "${inst.nombre}"?`)) return;
    await fetch("/api/mcp/whatsapp/disconnect", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ instance_id: inst.id }),
    });
    cargar();
  }

  function fmtFecha(val) {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function qrSrc(raw) {
    if (!raw) return null;
    return raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
  }

  return (
    <>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div className="mod-sub">
          {instancias.length} instancia{instancias.length !== 1 ? "s" : ""} registrada{instancias.length !== 1 ? "s" : ""}
        </div>
        <button className="ui-btn ui-btn--primary ui-btn--sm" onClick={abrirModal}>
          <i className="bi bi-plus-lg" /> Nueva instancia
        </button>
      </div>

      {/* Table */}
      <div className="ui-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="ui-empty">
            <i className="bi bi-arrow-repeat ui-empty__icon" />
            <div className="ui-empty__text">Cargando...</div>
          </div>
        ) : instancias.length === 0 ? (
          <div className="ui-empty">
            <i className="bi bi-whatsapp ui-empty__icon" />
            <div className="ui-empty__text">Sin instancias</div>
            <div className="ui-empty__sub">Creá una nueva instancia para conectar WhatsApp.</div>
          </div>
        ) : (
          <table className="ui-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Número</th>
                <th>Estado</th>
                <th>Conectado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {instancias.map(inst => (
                <tr key={inst.id}>
                  <td style={{ fontWeight: 600 }}>{inst.nombre}</td>
                  <td>{inst.numero || "—"}</td>
                  <td>
                    <span className={`ui-badge ${BADGE[inst.estado] || "ui-badge--gray"}`}>
                      {inst.estado}
                    </span>
                  </td>
                  <td>{fmtFecha(inst.conectado_en)}</td>
                  <td>
                    <button
                      className="ui-btn ui-btn--danger ui-btn--sm"
                      onClick={() => desconectar(inst)}
                      disabled={inst.estado === "desconectado"}
                    >
                      <i className="bi bi-plug" /> Desconectar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="pmodal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) cerrarModal(); }}>
          <div className="pmodal pmodal--sm">

            <div className="pmodal__header">
              <span className="pmodal__title">
                <i className="bi bi-whatsapp" /> Nueva instancia
              </span>
              <button className="pmodal__close" onClick={cerrarModal}>
                <i className="bi bi-x" />
              </button>
            </div>

            <div className="pmodal__body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "24px 24px" }}>

              {step === STEP.FORM && (
                <>
                  <div className="ui-field" style={{ width: "100%" }}>
                    <label className="ui-label">Nombre de la instancia</label>
                    <input
                      className="ui-input"
                      placeholder="Principal"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && generarQR()}
                      autoFocus
                    />
                  </div>
                  <button className="ui-btn ui-btn--primary ui-btn--full" onClick={generarQR} disabled={saving}>
                    <i className="bi bi-qr-code" /> Generar QR
                  </button>
                </>
              )}

              {step === STEP.LOADING && (
                <>
                  <i className="bi bi-arrow-repeat" style={{ fontSize: 32, color: "var(--pr)" }} />
                  <div className="mod-sub">Iniciando instancia...</div>
                </>
              )}

              {step === STEP.QR && (
                <>
                  {qrSrc(qr) ? (
                    <img
                      src={qrSrc(qr)}
                      alt="QR WhatsApp"
                      style={{ width: 220, height: 220, borderRadius: 8 }}
                    />
                  ) : (
                    <div style={{ width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="bi bi-arrow-repeat" style={{ fontSize: 32, color: "var(--pr)" }} />
                    </div>
                  )}
                  <div className="mod-sub" style={{ textAlign: "center" }}>
                    Abrí WhatsApp → Dispositivos vinculados → Vincular dispositivo
                  </div>
                  <span className="ui-badge ui-badge--amber">
                    <i className="bi bi-hourglass-split" /> Esperando conexión...
                  </span>
                </>
              )}

              {step === STEP.SUCCESS && (
                <>
                  <i className="bi bi-check-circle-fill" style={{ fontSize: 40, color: "var(--em)" }} />
                  <span className="ui-badge ui-badge--green">¡Conectado!</span>
                  <button className="ui-btn ui-btn--secondary" onClick={cerrarModal}>
                    Cerrar
                  </button>
                </>
              )}

            </div>

          </div>
        </div>
      )}
    </>
  );
}
