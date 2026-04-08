"use client";
import { useState, useEffect } from 'react';

const CONDICIONES_IVA   = ['Responsable Inscripto','Monotributista','Exento','Consumidor Final','No Responsable'];
const CATEGORIAS_MONO   = ['No aplica','A','B','C','D','E','F','G','H'];
const ALICUOTAS_IVA     = ['21%','10.5%','0%','27%'];
const BANCOS            = ['Banco Nación','Provincia','Santander','Galicia','BBVA','HSBC','ICBC','Brubank','Mercado Pago','Ualá','Otro'];
const TIPOS_CUENTA      = ['Caja de Ahorro ARS','Cuenta Corriente ARS','Caja de Ahorro USD'];
const COND_PAGO         = ['Pago inmediato','A 15 días','A 30 días','A 60 días','50% adelanto + 50% entrega'];

const MEDIOS_DISPONIBLES = [
  { id: 'efectivo',      label: 'Efectivo',           icon: 'bi-cash' },
  { id: 'debito',        label: 'Débito',             icon: 'bi-credit-card' },
  { id: 'credito',       label: 'Crédito',            icon: 'bi-credit-card-2-front' },
  { id: 'mercadopago',   label: 'Mercado Pago',       icon: 'bi-phone' },
  { id: 'transferencia', label: 'Transferencia / CBU', icon: 'bi-bank' },
  { id: 'qr',            label: 'QR',                 icon: 'bi-qr-code' },
  { id: 'cheque',        label: 'Cheque',             icon: 'bi-file-text' },
  { id: 'crypto',        label: 'Crypto',             icon: 'bi-currency-bitcoin' },
  { id: 'cuotas',        label: 'Cuotas sin interés', icon: 'bi-calendar-check' },
];
const MEDIOS_DEFAULT = ['efectivo','debito','credito'];

export default function TabFacturacion({ ctx, saveTrigger, discardTrigger, onSaveResult, onDiscardResult }) {
  const [fiscal, setFiscal]           = useState({});
  const [origFiscal, setOrigFiscal]   = useState({});
  const [medios, setMedios]           = useState(MEDIOS_DEFAULT);
  const [origMedios, setOrigMedios]   = useState(MEDIOS_DEFAULT);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetch('/api/mi-negocio/fiscal')
      .then(r => r.json())
      .then(d => {
        setFiscal(d.fiscal || {});
        setOrigFiscal(d.fiscal || {});
        const activos = (d.medios || []).filter(m => m.activo).map(m => m.medio);
        const mediosActivos = activos.length > 0 ? activos : MEDIOS_DEFAULT;
        setMedios(mediosActivos);
        setOrigMedios(mediosActivos);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (saveTrigger > 0) doSave(); }, [saveTrigger]);
  useEffect(() => {
    if (discardTrigger > 0) {
      setFiscal(origFiscal);
      setMedios(origMedios);
      if (onDiscardResult) onDiscardResult();
    }
  }, [discardTrigger]);

  async function doSave() {
    try {
      const mediosPayload = MEDIOS_DISPONIBLES.map(m => ({
        medio: m.id,
        activo: medios.includes(m.id) ? 1 : 0,
      }));
      const res = await fetch('/api/mi-negocio/fiscal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscal, medios: mediosPayload }),
      });
      const json = await res.json();
      if (json.ok) {
        setOrigFiscal(fiscal);
        setOrigMedios(medios);
        if (onSaveResult) onSaveResult(true);
      } else {
        if (onSaveResult) onSaveResult(false, json.error);
      }
    } catch { if (onSaveResult) onSaveResult(false, 'Error de conexión'); }
  }

  const setF = (field, val) => setFiscal(f => ({ ...f, [field]: val }));

  function toggleMedio(id) {
    setMedios(m => m.includes(id) ? m.filter(x => x !== id) : [...m, id]);
  }

  if (loading) return <div className="neg-loading"><i className="bi bi-arrow-clockwise" /> Cargando...</div>;

  return (
    <>
      {/* Banner */}
      <div className="ui-banner ui-banner--info">
        <i className="bi bi-receipt" />
        <div className="ui-banner__content">
          Estos datos se usan para generar facturas, presupuestos y para el asistente IA cuando un cliente pregunta sobre formas de pago.
        </div>
      </div>

      {/* Datos fiscales */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-file-earmark-text" /> Datos Fiscales</span>
        </div>
        <div className="ui-card__body">
          <div className="form-grid form-grid--3">

            <div className="ui-field">
              <label className="ui-label">CUIT</label>
              <input
                className="ui-input t-mono"
                value={fiscal.cuit || ''}
                placeholder="20-12345678-9"
                onChange={e => setF('cuit', e.target.value)}
              />
            </div>

            <div className="ui-field">
              <label className="ui-label">Punto de venta</label>
              <input
                className="ui-input t-mono"
                value={fiscal.punto_venta || ''}
                placeholder="0001"
                onChange={e => setF('punto_venta', e.target.value)}
              />
            </div>

            <div className="ui-field">
              <label className="ui-label">Inicio de actividades</label>
              <input
                className="ui-input"
                type="date"
                value={fiscal.inicio_actividades || ''}
                onChange={e => setF('inicio_actividades', e.target.value)}
              />
            </div>

            <div className="ui-field span3">
              <label className="ui-label">Condición frente al IVA</label>
              <div className="neg-iva-group">
                {CONDICIONES_IVA.map(c => (
                  <button
                    key={c}
                    className={`neg-iva-chip${(fiscal.condicion_iva || 'Responsable Inscripto') === c ? ' neg-iva-chip--active' : ''}`}
                    onClick={() => setF('condicion_iva', c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-label">Categoría Monotributo</label>
              <select className="ui-select" value={fiscal.categoria_monotributo || 'No aplica'} onChange={e => setF('categoria_monotributo', e.target.value)}>
                {CATEGORIAS_MONO.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="ui-field">
              <label className="ui-label">Alícuota IVA por defecto</label>
              <select className="ui-select" value={fiscal.alicuota_iva || '21%'} onChange={e => setF('alicuota_iva', e.target.value)}>
                {ALICUOTAS_IVA.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="ui-field span3">
              <div className="neg-label-row">
                <label className="ui-label">Domicilio fiscal</label>
                <span className="badge b--muted">Si es distinto al comercial</span>
              </div>
              <input
                className="ui-input"
                value={fiscal.domicilio_fiscal || ''}
                placeholder="Igual al comercial o especificá uno diferente"
                onChange={e => setF('domicilio_fiscal', e.target.value)}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Medios de pago */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-wallet2" /> Medios de Pago Aceptados</span>
        </div>
        <div className="ui-card__body">
          <div className="neg-media-group">
            {MEDIOS_DISPONIBLES.map(m => (
              <button
                key={m.id}
                className={`neg-media-chip${medios.includes(m.id) ? ' neg-media-chip--active' : ''}`}
                onClick={() => toggleMedio(m.id)}
              >
                <i className={`bi ${m.icon}`} /> {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Datos bancarios */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-bank" /> Datos Bancarios</span>
        </div>
        <div className="ui-card__body">
          <div className="form-grid form-grid--3">

            <div className="ui-field span2">
              <label className="ui-label">CBU</label>
              <input
                className="ui-input t-mono"
                value={fiscal.cbu || ''}
                placeholder="22 dígitos"
                onChange={e => setF('cbu', e.target.value)}
              />
            </div>

            <div className="ui-field">
              <label className="ui-label">Alias</label>
              <input
                className="ui-input t-mono"
                value={fiscal.alias_cbu || ''}
                placeholder="MI.ALIAS.ARS"
                onChange={e => setF('alias_cbu', e.target.value)}
              />
            </div>

            <div className="ui-field">
              <label className="ui-label">Banco</label>
              <select className="ui-select" value={fiscal.banco || ''} onChange={e => setF('banco', e.target.value)}>
                <option value="">Seleccioná...</option>
                {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="ui-field">
              <label className="ui-label">Tipo de cuenta</label>
              <select className="ui-select" value={fiscal.tipo_cuenta || ''} onChange={e => setF('tipo_cuenta', e.target.value)}>
                <option value="">Seleccioná...</option>
                {TIPOS_CUENTA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="ui-field">
              <label className="ui-label">Titular de la cuenta</label>
              <input
                className="ui-input"
                value={fiscal.titular_cuenta || ''}
                placeholder="Nombre completo o razón social"
                onChange={e => setF('titular_cuenta', e.target.value)}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Configuración de facturas */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-file-earmark-ruled" /> Configuración de Facturas</span>
        </div>
        <div className="ui-card__body">
          <div className="form-grid">

            <div className="ui-field span2">
              <label className="ui-label">Texto de pie de factura</label>
              <textarea
                className="ui-textarea"
                rows={2}
                value={fiscal.texto_pie_factura || ''}
                placeholder="Ej: Gracias por su confianza. Para consultas: info@empresa.com"
                onChange={e => setF('texto_pie_factura', e.target.value)}
              />
            </div>

            <div className="ui-field span2">
              <label className="ui-label">Condiciones de pago por defecto</label>
              <select className="ui-select" value={fiscal.condicion_pago_default || ''} onChange={e => setF('condicion_pago_default', e.target.value)}>
                <option value="">Seleccioná...</option>
                {COND_PAGO.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
