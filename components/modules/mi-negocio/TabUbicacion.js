"use client";
import { useState, useEffect } from 'react';

const PROVINCIAS = [
  'Buenos Aires','CABA','Córdoba','Santa Fe','Mendoza','Tucumán','Rosario','Otra',
];
const PAISES = ['Argentina','Uruguay','Chile','Paraguay'];

export default function TabUbicacion({ ctx, saveTrigger, discardTrigger, onSaveResult, onDiscardResult }) {
  const [data, setData]         = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/mi-negocio/info')
      .then(r => r.json())
      .then(d => { setData(d); setOriginal(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (saveTrigger > 0) doSave(); },    [saveTrigger]);
  useEffect(() => {
    if (discardTrigger > 0) {
      setData(original);
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
      if (json.ok) { setOriginal(data); if (onSaveResult) onSaveResult(true); }
      else { if (onSaveResult) onSaveResult(false, json.error); }
    } catch { if (onSaveResult) onSaveResult(false, 'Error de conexión'); }
  }

  const set = (field, value) => setData(d => ({ ...d, [field]: value }));

  if (loading) return <div className="neg-loading"><i className="bi bi-arrow-clockwise" /> Cargando...</div>;

  return (
    <>
      {/* Banner */}
      <div className="ui-banner ui-banner--info">
        <i className="bi bi-geo-alt" />
        <div className="ui-banner__content">
          La dirección se muestra en el perfil público y la usa el asistente IA cuando un cliente pregunta cómo llegar.
        </div>
      </div>

      {/* Dirección */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-map" /> Dirección</span>
        </div>
        <div className="ui-card__body">
          <div className="form-grid form-grid--3">

            <div className="ui-field span2">
              <div className="neg-label-row">
                <label className="ui-label">Calle y número</label>
                <span className="neg-req">*</span>
              </div>
              <div className="ui-input-wrap">
                <i className="bi bi-signpost ui-input-wrap__icon" />
                <input
                  className="ui-input"
                  value={data.calle || ''}
                  placeholder="Av. Corrientes 1234"
                  onChange={e => set('calle', e.target.value)}
                />
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-label">Piso / Dpto / Of.</label>
              <input className="ui-input" value={data.piso_dpto || ''} placeholder="2° B" onChange={e => set('piso_dpto', e.target.value)} />
            </div>

            <div className="ui-field">
              <label className="ui-label">Barrio / Zona</label>
              <input className="ui-input" value={data.barrio || ''} placeholder="Palermo" onChange={e => set('barrio', e.target.value)} />
            </div>

            <div className="ui-field">
              <div className="neg-label-row">
                <label className="ui-label">Localidad</label>
                <span className="neg-req">*</span>
              </div>
              <input className="ui-input" value={data.localidad || ''} placeholder="Buenos Aires" onChange={e => set('localidad', e.target.value)} />
            </div>

            <div className="ui-field">
              <div className="neg-label-row">
                <label className="ui-label">Provincia</label>
                <span className="neg-req">*</span>
              </div>
              <select className="ui-select" value={data.provincia || ''} onChange={e => set('provincia', e.target.value)}>
                <option value="">Seleccioná...</option>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="ui-field">
              <label className="ui-label">Código Postal</label>
              <input className="ui-input" value={data.codigo_postal || ''} placeholder="1043" onChange={e => set('codigo_postal', e.target.value)} />
            </div>

            <div className="ui-field">
              <label className="ui-label">País</label>
              <select className="ui-select" value={data.pais || 'Argentina'} onChange={e => set('pais', e.target.value)}>
                {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* Geolocalización */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-pin-map" /> Geolocalización</span>
        </div>
        <div className="ui-card__body">
          <div className="form-grid form-grid--3">

            <div className="ui-field span2">
              <label className="ui-label">URL Google Maps</label>
              <div className="ui-input-wrap">
                <i className="bi bi-google ui-input-wrap__icon" />
                <input
                  className="ui-input"
                  type="url"
                  value={data.maps_url || ''}
                  placeholder="https://maps.google.com/... o pegá el link compartido"
                  onChange={e => set('maps_url', e.target.value)}
                />
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-label">Latitud</label>
              <input
                className="ui-input t-mono"
                value={data.latitud || ''}
                placeholder="-34.603722"
                onChange={e => set('latitud', e.target.value)}
              />
            </div>

            <div className="ui-field">
              <label className="ui-label">Longitud</label>
              <input
                className="ui-input t-mono"
                value={data.longitud || ''}
                placeholder="-58.381592"
                onChange={e => set('longitud', e.target.value)}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-telephone" /> Datos de Contacto</span>
        </div>
        <div className="ui-card__body">
          <div className="form-grid form-grid--3">

            <div className="ui-field">
              <div className="neg-label-row">
                <label className="ui-label">Teléfono principal</label>
                <span className="neg-req">*</span>
              </div>
              <div className="ui-input-wrap">
                <i className="bi bi-telephone ui-input-wrap__icon" />
                <input
                  className="ui-input"
                  type="tel"
                  value={data.telefono_principal || ''}
                  placeholder="+54 11 4xxx-xxxx"
                  onChange={e => set('telefono_principal', e.target.value)}
                />
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-label">WhatsApp</label>
              <div className="ui-input-wrap">
                <i className="bi bi-whatsapp ui-input-wrap__icon" />
                <input
                  className="ui-input"
                  type="tel"
                  value={data.whatsapp || ''}
                  placeholder="+54 9 11 xxxx-xxxx"
                  onChange={e => set('whatsapp', e.target.value)}
                />
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-label">Teléfono secundario</label>
              <div className="ui-input-wrap">
                <i className="bi bi-telephone-plus ui-input-wrap__icon" />
                <input
                  className="ui-input"
                  type="tel"
                  value={data.telefono_secundario || ''}
                  placeholder="Opcional"
                  onChange={e => set('telefono_secundario', e.target.value)}
                />
              </div>
            </div>

            <div className="ui-field">
              <div className="neg-label-row">
                <label className="ui-label">Email de contacto</label>
                <span className="neg-req">*</span>
              </div>
              <div className="ui-input-wrap">
                <i className="bi bi-envelope ui-input-wrap__icon" />
                <input
                  className="ui-input"
                  type="email"
                  value={data.email_contacto || ''}
                  placeholder="info@minegocio.com"
                  onChange={e => set('email_contacto', e.target.value)}
                />
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-label">Email de administración</label>
              <div className="ui-input-wrap">
                <i className="bi bi-envelope-open ui-input-wrap__icon" />
                <input
                  className="ui-input"
                  type="email"
                  value={data.email_admin || ''}
                  placeholder="admin@minegocio.com"
                  onChange={e => set('email_admin', e.target.value)}
                />
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-label">Sitio web</label>
              <div className="ui-input-wrap">
                <i className="bi bi-globe ui-input-wrap__icon" />
                <input
                  className="ui-input"
                  type="url"
                  value={data.sitio_web || ''}
                  placeholder="https://www.minegocio.com.ar"
                  onChange={e => set('sitio_web', e.target.value)}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
