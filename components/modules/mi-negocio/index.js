"use client";
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const TabIdentidad   = dynamic(() => import('./TabIdentidad'),   { ssr: false });
const TabUbicacion   = dynamic(() => import('./TabUbicacion'),   { ssr: false });
const TabHorarios    = dynamic(() => import('./TabHorarios'),    { ssr: false });
const TabRedes       = dynamic(() => import('./TabRedes'),       { ssr: false });
const TabIA          = dynamic(() => import('./TabIA'),          { ssr: false });
const TabGaleria     = dynamic(() => import('./TabGaleria'),     { ssr: false });
const TabFacturacion = dynamic(() => import('./TabFacturacion'), { ssr: false });

const TABS = [
  { id: 'identidad',   label: 'Identidad',           icon: 'bi-shop' },
  { id: 'ubicacion',   label: 'Ubicación y Contacto', icon: 'bi-geo-alt' },
  { id: 'horarios',    label: 'Horarios',             icon: 'bi-clock' },
  { id: 'redes',       label: 'Redes Sociales',       icon: 'bi-share' },
  { id: 'ia',          label: 'Config. IA',           icon: 'bi-stars' },
  { id: 'galeria',     label: 'Galería',              icon: 'bi-images' },
  { id: 'facturacion', label: 'Facturación',          icon: 'bi-receipt' },
];

const TAB_COMPONENTS = {
  identidad:   TabIdentidad,
  ubicacion:   TabUbicacion,
  horarios:    TabHorarios,
  redes:       TabRedes,
  ia:          TabIA,
  galeria:     TabGaleria,
  facturacion: TabFacturacion,
};

export default function MiNegocioModule({ ctx }) {
  const [activeTab, setActiveTab]           = useState('identidad');
  const [saveTrigger, setSaveTrigger]       = useState(0);
  const [discardTrigger, setDiscardTrigger] = useState(0);
  const [toast, setToast]                   = useState(null);
  const [completitud, setCompletitud]       = useState(0);
  const [lastSaved, setLastSaved]           = useState(null);

  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleSave    = () => setSaveTrigger(t => t + 1);
  const handleDiscard = () => setDiscardTrigger(t => t + 1);

  const handleSaveResult = useCallback((ok, msg) => {
    if (ok) {
      setLastSaved(new Date());
      showToast(msg || 'Cambios guardados correctamente');
    } else {
      showToast(msg || 'Error al guardar', 'alert');
    }
  }, [showToast]);

  const handleDiscardResult = useCallback(() => {
    showToast('Cambios descartados', 'info');
  }, [showToast]);

  const minutosDesdeGuardado = lastSaved
    ? Math.round((Date.now() - lastSaved.getTime()) / 60000)
    : null;
  const lastSavedText = minutosDesdeGuardado === null
    ? 'Sin cambios guardados aún'
    : minutosDesdeGuardado < 1
    ? 'Último guardado: hace menos de 1 min'
    : `Último guardado: hace ${minutosDesdeGuardado} min`;

  const iaPillText = completitud < 50
    ? 'Completá el perfil para mejorar las respuestas del asistente y el bot de WhatsApp'
    : completitud < 80
    ? `Perfil al ${completitud}% — seguí completando para mejores respuestas de IA`
    : `Perfil completo al ${completitud}% — tu asistente IA está bien configurado`;

  const ActiveTab = TAB_COMPONENTS[activeTab];

  return (
    <div className="neg-module-wrap">

      {/* Topbar */}
      <div className="mod-topbar">
        <span className="mod-topbar__title">Mi Negocio</span>
        <span className="mod-topbar__sep">|</span>
        <span className="mod-topbar__sub">Información del negocio</span>
        <div className="ia-pill">
          <i className="bi bi-stars ia-pill__icon" />
          <span className="ia-pill__label">IA</span>
          <span className="ia-pill__text">{iaPillText}</span>
        </div>
        <button className="tb-btn tb-btn--primary" onClick={handleSave}>
          <i className="bi bi-floppy" /> Guardar cambios
        </button>
      </div>

      {/* Barra de tabs */}
      <div className="ui-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`ui-tab${activeTab === t.id ? ' ui-tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <i className={`bi ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {/* Cuerpo del tab activo */}
      <div className="neg-tabs-scroll">
        <ActiveTab
          ctx={ctx}
          saveTrigger={saveTrigger}
          discardTrigger={discardTrigger}
          onSaveResult={handleSaveResult}
          onDiscardResult={handleDiscardResult}
          onCompletitudChange={activeTab === 'identidad' ? setCompletitud : undefined}
        />
      </div>

      {/* Footer fijo */}
      <div className="neg-footer">
        <span className="neg-footer__meta">
          <i className="bi bi-clock-history" /> {lastSavedText}
        </span>
        <div className="neg-footer__actions">
          <button className="ui-btn ui-btn--secondary" onClick={handleDiscard}>
            Descartar
          </button>
          <button className="ui-btn ui-btn--primary" onClick={handleSave}>
            <i className="bi bi-floppy" /> Guardar cambios
          </button>
        </div>
      </div>

      {/* Toast de notificación */}
      {toast && (
        <div className={`neg-toast neg-toast--${toast.type}`}>
          <i className={`bi ${
            toast.type === 'ok'    ? 'bi-check-circle-fill' :
            toast.type === 'alert' ? 'bi-exclamation-circle-fill' :
            'bi-info-circle-fill'
          }`} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
