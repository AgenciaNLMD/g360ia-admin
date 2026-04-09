"use client";
import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

const TabIdentidad   = dynamic(() => import('./TabIdentidad'),   { ssr: false });
const TabUbicacion   = dynamic(() => import('./TabUbicacion'),   { ssr: false });
const TabHorarios    = dynamic(() => import('./TabHorarios'),    { ssr: false });
const TabRedes       = dynamic(() => import('./TabRedes'),       { ssr: false });
const TabIA          = dynamic(() => import('./TabIA'),          { ssr: false });
const TabGaleria     = dynamic(() => import('./TabGaleria'),     { ssr: false });
const TabFacturacion = dynamic(() => import('./TabFacturacion'), { ssr: false });

const TABS = [
  { id: 'identidad',   label: 'Identidad',           icon: 'bi-shop',    idx: 0 },
  { id: 'ubicacion',   label: 'Ubicación y Contacto', icon: 'bi-geo-alt', idx: 1 },
  { id: 'horarios',    label: 'Horarios',             icon: 'bi-clock',   idx: 2 },
  { id: 'redes',       label: 'Redes Sociales',       icon: 'bi-share',   idx: 3 },
  { id: 'ia',          label: 'Configuración IA',     icon: 'bi-stars',   idx: 4 },
  { id: 'galeria',     label: 'Galería',              icon: 'bi-images',  idx: 5 },
  { id: 'facturacion', label: 'Facturación',          icon: 'bi-receipt', idx: 6 },
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

const NOOP = () => {};

export default function MiNegocioModule({ ctx }) {
  const [activeIdx, setActiveIdx]           = useState(0);
  const [activeTab, setActiveTab]           = useState('identidad');
  const [saveTrigger, setSaveTrigger]       = useState(0);
  const [discardTrigger, setDiscardTrigger] = useState(0);
  const [toast, setToast]                   = useState(null);
  const [completitud, setCompletitud]       = useState(0);
  const [lastSaved, setLastSaved]           = useState(null);
  const [indicator, setIndicator]           = useState({ left: 0, width: 0 });
  const tabsRef = useRef(null);

  const updateIndicator = useCallback(() => {
    if (!tabsRef.current) return;
    const btn = tabsRef.current.querySelector('[data-active="true"]');
    if (!btn) return;
    setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, []);

  // Actualizar indicador al montar y al cambiar tab
  useEffect(() => {
    const frame = requestAnimationFrame(updateIndicator);
    return () => cancelAnimationFrame(frame);
  }, [activeTab, updateIndicator]);

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab.id);
    setActiveIdx(tab.idx);
    // Reset para que el tab recién activado no dispare save/discard
    // por heredar el trigger acumulado de tabs anteriores
    setSaveTrigger(0);
    setDiscardTrigger(0);
  }, []);

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

      {/* Barra de tabs con indicador deslizante */}
      <div
        ref={tabsRef}
        className="ui-tabs ui-tabs--sliding"
        style={{ "--tab-ind-left": `${indicator.left}px`, "--tab-ind-w": `${indicator.width}px` }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            data-active={activeTab === t.id ? "true" : "false"}
            className={`ui-tab${activeTab === t.id ? ' ui-tab--active' : ''}`}
            onClick={() => handleTabClick(t)}
          >
            <i className={`bi ${t.icon}`} /> {t.label}
          </button>
        ))}
        <div className="ui-tab-indicator" />
      </div>

      {/* Carrusel de tabs */}
      <div className="mod-tab-slider">
        <div
          className="mod-tab-track"
          style={{ "--mod-tab-offset": `${activeIdx * 100}%` }}
        >
          {TABS.map(t => {
            const Tab = TAB_COMPONENTS[t.id];
            const isActive = t.id === activeTab;
            return (
              <div key={t.id} className="mod-tab-panel">
                <Tab
                  ctx={ctx}
                  saveTrigger={isActive ? saveTrigger : 0}
                  discardTrigger={isActive ? discardTrigger : 0}
                  onSaveResult={isActive ? handleSaveResult : NOOP}
                  onDiscardResult={isActive ? handleDiscardResult : NOOP}
                  onCompletitudChange={t.id === 'identidad' ? setCompletitud : undefined}
                />
              </div>
            );
          })}
        </div>
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

      {/* Toast */}
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
