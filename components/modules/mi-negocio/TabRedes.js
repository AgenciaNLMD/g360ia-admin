"use client";
import { useState, useEffect } from 'react';

const REDES = [
  { plataforma: 'instagram',      label: 'Instagram',     icon: 'bi-instagram',    iconColor: '#E1306C', placeholder: '@minegocio' },
  { plataforma: 'facebook',       label: 'Facebook',      icon: 'bi-facebook',     iconColor: '#1877F2', placeholder: 'facebook.com/minegocio' },
  { plataforma: 'tiktok',         label: 'TikTok',        icon: 'bi-tiktok',       iconColor: '#000000', placeholder: '@minegocio' },
  { plataforma: 'linkedin',       label: 'LinkedIn',      icon: 'bi-linkedin',     iconColor: '#0A66C2', placeholder: 'linkedin.com/company/...' },
  { plataforma: 'youtube',        label: 'YouTube',       icon: 'bi-youtube',      iconColor: '#FF0000', placeholder: 'Canal de YouTube' },
  { plataforma: 'x_twitter',      label: 'X (Twitter)',   icon: 'bi-twitter-x',    iconColor: '#000000', placeholder: '@minegocio' },
  { plataforma: 'pinterest',      label: 'Pinterest',     icon: 'bi-pinterest',    iconColor: '#E60023', placeholder: 'pinterest.com/minegocio' },
];

const PLATAFORMAS_EXTRA = [
  { plataforma: 'google_business', label: 'Google Business',  icon: 'bi-google',     iconColor: '#DB4437', placeholder: 'URL de tu perfil en Google' },
  { plataforma: 'mercado_libre',   label: 'Mercado Libre',    icon: 'bi-shop',       iconColor: '#FFE600', placeholder: 'URL de tu tienda en ML' },
  { plataforma: 'tripadvisor',     label: 'TripAdvisor',      icon: 'bi-star',       iconColor: '#34E0A1', placeholder: 'URL de tu perfil' },
  { plataforma: 'otra',            label: 'Otra plataforma',  icon: 'bi-link-45deg', iconColor: '#7A8898', placeholder: 'https://...' },
];

export default function TabRedes({ ctx, saveTrigger, discardTrigger, onSaveResult, onDiscardResult }) {
  const [data, setData]         = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/mi-negocio/redes')
      .then(r => r.json())
      .then(d => { setData(d); setOriginal(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (saveTrigger > 0) doSave(); }, [saveTrigger]);
  useEffect(() => {
    if (discardTrigger > 0) {
      setData(original);
      if (onDiscardResult) onDiscardResult();
    }
  }, [discardTrigger]);

  async function doSave() {
    try {
      const res = await fetch('/api/mi-negocio/redes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.ok) { setOriginal(data); if (onSaveResult) onSaveResult(true); }
      else { if (onSaveResult) onSaveResult(false, json.error); }
    } catch { if (onSaveResult) onSaveResult(false, 'Error de conexión'); }
  }

  const set = (plataforma, url) => setData(d => ({ ...d, [plataforma]: url }));

  if (loading) return <div className="neg-loading"><i className="bi bi-arrow-clockwise" /> Cargando...</div>;

  return (
    <>
      {/* Banner */}
      <div className="ui-banner ui-banner--warn">
        <i className="bi bi-exclamation-triangle" />
        <div className="ui-banner__content">
          Solo completá las redes que usás activamente. Los campos vacíos no se muestran en el perfil público ni los menciona la IA.
        </div>
      </div>

      {/* Redes sociales */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-share" /> Redes Sociales</span>
        </div>
        <div className="neg-social-list">
          {REDES.map(({ plataforma, label, icon, iconColor, placeholder }) => (
            <div key={plataforma} className="neg-social-row">
              <i className={`bi ${icon} neg-social-row__icon`} style={{"--neg-social-color": iconColor}} />
              <span className="neg-social-row__name">{label}</span>
              <div className="ui-input-wrap neg-social-row__input">
                <input
                  className="ui-input"
                  type="url"
                  value={data[plataforma] || ''}
                  placeholder={placeholder}
                  onChange={e => set(plataforma, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plataformas adicionales */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-grid" /> Plataformas Adicionales</span>
        </div>
        <div className="ui-card__body">
          <div className="form-grid">
            {PLATAFORMAS_EXTRA.map(({ plataforma, label, icon, placeholder }) => (
              <div key={plataforma} className="ui-field">
                <label className="ui-label">
                  <i className={`bi ${icon}`} /> {label}
                </label>
                <input
                  className="ui-input"
                  type="url"
                  value={data[plataforma] || ''}
                  placeholder={placeholder}
                  onChange={e => set(plataforma, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
