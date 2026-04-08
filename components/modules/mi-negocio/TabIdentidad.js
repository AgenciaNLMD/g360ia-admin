"use client";
import { useState, useEffect } from 'react';

const REQUIRED = [
  'nombre_comercial','telefono_principal','email_contacto',
  'calle','localidad','provincia','logo_url','color_primario',
];

function calcPct(d) {
  const filled = REQUIRED.filter(f => d[f] && String(d[f]).trim() !== '').length;
  return Math.round((filled / REQUIRED.length) * 100);
}

const COLORS = [
  { field: 'color_primario',   label: 'Color primario',   def: '#5C6E85' },
  { field: 'color_secundario', label: 'Color secundario', def: '#B08A55' },
  { field: 'color_fondo',      label: 'Color de fondo',   def: '#F8FAFB' },
  { field: 'color_acento',     label: 'Color de acento',  def: '#2ECC71' },
];

export default function TabIdentidad({ ctx, saveTrigger, discardTrigger, onSaveResult, onDiscardResult, onCompletitudChange }) {
  const [data, setData]         = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/mi-negocio/info')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setOriginal(d);
        if (onCompletitudChange) onCompletitudChange(calcPct(d));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (saveTrigger > 0) doSave(); },    [saveTrigger]);
  useEffect(() => {
    if (discardTrigger > 0) {
      setData(original);
      if (onCompletitudChange) onCompletitudChange(calcPct(original));
      if (onDiscardResult) onDiscardResult();
    }
  }, [discardTrigger]);

  async function doSave() {
    try {
      const res  = await fetch('/api/mi-negocio/info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.ok) {
        setOriginal(data);
        if (onSaveResult) onSaveResult(true);
      } else {
        if (onSaveResult) onSaveResult(false, json.error || 'Error al guardar');
      }
    } catch {
      if (onSaveResult) onSaveResult(false, 'Error de conexión');
    }
  }

  function set(field, value) {
    const next = { ...data, [field]: value };
    setData(next);
    if (onCompletitudChange) onCompletitudChange(calcPct(next));
  }

  function handleFilePreview(file, tipo) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      if (tipo === 'logo')    set('logo_url',    e.target.result);
      if (tipo === 'portada') set('portada_url', e.target.result);
    };
    reader.readAsDataURL(file);
  }

  if (loading) return (
    <div className="neg-loading">
      <i className="bi bi-arrow-clockwise" /> Cargando información del negocio...
    </div>
  );

  const pct = calcPct(data);

  return (
    <>
      {/* Barra de completitud */}
      <div className="ui-card">
        <div className="ui-card__body">
          <div className="neg-profile-bar">
            <div className="neg-profile-bar__labels">
              <span className="ui-label">Perfil completo</span>
              <span className="neg-profile-bar__pct">{pct}%</span>
            </div>
            <div className="neg-profile-bar__track">
              <div className="neg-profile-bar__fill" style={{"--neg-fill-w": `${pct}%`}} />
            </div>
            <span className="neg-profile-bar__hint">
              Completá más datos para mejorar la IA
            </span>
          </div>
        </div>
      </div>

      {/* Banner informativo */}
      <div className="ui-banner ui-banner--ok">
        <i className="bi bi-info-circle" />
        <div className="ui-banner__content">
          Los datos de identidad se usan en facturas, el perfil público y el bot de WhatsApp.
          Mantenerlos actualizados mejora la experiencia de tus clientes.
        </div>
      </div>

      {/* Logo y portada */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-image" /> Logo y Portada</span>
        </div>
        <div className="ui-card__body">
          <div className="neg-upload-row">
            {/* Preview logo actual */}
            <div className="neg-logo-preview">
              {data.logo_url
                ? <img src={data.logo_url} alt="Logo" className="neg-logo-preview__img" />
                : <div className="neg-logo-preview__placeholder"><i className="bi bi-shop" /></div>
              }
              <span className="neg-logo-preview__label">Logo actual</span>
            </div>

            {/* Upload logo */}
            <div className="ui-field" style={{flex:1}}>
              <label className="ui-label">Logo del negocio</label>
              <label className="neg-upload-zone">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="neg-upload-zone__input"
                  onChange={e => handleFilePreview(e.target.files[0], 'logo')}
                />
                <i className="bi bi-cloud-arrow-up neg-upload-zone__icon" />
                <span className="neg-upload-zone__text">Arrastrá o hacé click para subir</span>
                <span className="neg-upload-zone__sub">PNG, JPG, SVG — máx. 2MB · 400×400px recomendado</span>
              </label>
            </div>

            {/* Upload portada */}
            <div className="ui-field" style={{flex:1}}>
              <label className="ui-label">Foto de portada</label>
              <label className="neg-upload-zone">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="neg-upload-zone__input"
                  onChange={e => handleFilePreview(e.target.files[0], 'portada')}
                />
                <i className="bi bi-aspect-ratio neg-upload-zone__icon" />
                <span className="neg-upload-zone__text">Arrastrá o hacé click para subir</span>
                <span className="neg-upload-zone__sub">PNG, JPG — máx. 5MB · 1200×400px recomendado</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Datos principales */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-building" /> Datos Principales</span>
        </div>
        <div className="ui-card__body">
          <div className="form-grid">

            <div className="ui-field">
              <div className="neg-label-row">
                <label className="ui-label">Nombre comercial</label>
                <span className="neg-req">*</span>
              </div>
              <div className="ui-input-wrap">
                <i className="bi bi-shop ui-input-wrap__icon" />
                <input
                  className="ui-input"
                  value={data.nombre_comercial || ''}
                  placeholder="Nombre de tu negocio"
                  onChange={e => set('nombre_comercial', e.target.value)}
                />
              </div>
            </div>

            <div className="ui-field">
              <div className="neg-label-row">
                <label className="ui-label">Nombre corto / Alias</label>
                <span className="badge b--muted">Para bot y notificaciones</span>
              </div>
              <div className="ui-input-wrap">
                <i className="bi bi-at ui-input-wrap__icon" />
                <input
                  className="ui-input"
                  value={data.nombre_corto || ''}
                  placeholder="Nombre corto"
                  onChange={e => set('nombre_corto', e.target.value)}
                />
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-label">Razón social</label>
              <input
                className="ui-input"
                value={data.razon_social || ''}
                placeholder="Razón social completa (opcional)"
                onChange={e => set('razon_social', e.target.value)}
              />
            </div>

            <div className="ui-field">
              <div className="neg-label-row">
                <label className="ui-label">Rubro</label>
                <span className="badge b--muted">Solo lectura</span>
              </div>
              <div className="ui-input-wrap">
                <i className="bi bi-tag ui-input-wrap__icon" />
                <input className="ui-input" value={ctx?.rubro || ''} readOnly />
              </div>
            </div>

            <div className="ui-field span2">
              <label className="ui-label">Slogan / Descripción corta</label>
              <input
                className="ui-input"
                value={data.slogan || ''}
                placeholder="Una frase que te represente"
                onChange={e => set('slogan', e.target.value)}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Identidad visual */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-palette" /> Identidad Visual</span>
        </div>
        <div className="ui-card__body">
          <div className="form-grid form-grid--4">
            {COLORS.map(({ field, label, def }) => {
              const color = data[field] || def;
              return (
                <div key={field} className="ui-field">
                  <label className="ui-label">{label}</label>
                  <div className="neg-color-field">
                    <div className="neg-color-dot" style={{"--neg-swatch": color}} />
                    <span className="neg-color-hex">{color}</span>
                    <label className="neg-color-change">
                      Cambiar
                      <input
                        type="color"
                        value={color}
                        className="neg-color-input"
                        onChange={e => set(field, e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
