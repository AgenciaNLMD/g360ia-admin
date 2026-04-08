"use client";
import { useState, useEffect } from 'react';

const GALERIA_SLOTS = 10;

export default function TabGaleria({ ctx, saveTrigger, discardTrigger, onSaveResult, onDiscardResult }) {
  const [items, setItems]         = useState([]);
  const [videoUrl, setVideoUrl]   = useState('');
  const [origVideo, setOrigVideo] = useState('');
  const [loading, setLoading]     = useState(true);
  const [captionEdit, setCaptionEdit] = useState(null); // { id, value }

  useEffect(() => {
    Promise.all([
      fetch('/api/mi-negocio/galeria').then(r => r.json()),
      fetch('/api/mi-negocio/info').then(r => r.json()),
    ])
      .then(([galeria, info]) => {
        setItems(Array.isArray(galeria) ? galeria : []);
        setVideoUrl(info.video_url || '');
        setOrigVideo(info.video_url || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (saveTrigger > 0) doSave(); }, [saveTrigger]);
  useEffect(() => {
    if (discardTrigger > 0) {
      setVideoUrl(origVideo);
      if (onDiscardResult) onDiscardResult();
    }
  }, [discardTrigger]);

  async function doSave() {
    try {
      const res = await fetch('/api/mi-negocio/info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: videoUrl }),
      });
      const json = await res.json();
      if (json.ok) { setOrigVideo(videoUrl); if (onSaveResult) onSaveResult(true); }
      else { if (onSaveResult) onSaveResult(false, json.error); }
    } catch { if (onSaveResult) onSaveResult(false, 'Error de conexión'); }
  }

  function handleFileAdd(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async e => {
      const url = e.target.result; // base64 preview
      try {
        const res = await fetch('/api/mi-negocio/galeria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, tipo: 'galeria', orden: items.filter(i => i.tipo === 'galeria').length }),
        });
        const json = await res.json();
        if (json.ok) setItems(i => [...i, { id: json.id, url, caption: '', tipo: 'galeria' }]);
      } catch {}
    };
    reader.readAsDataURL(file);
  }

  function handlePortadaAdd(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async e => {
      const url = e.target.result;
      try {
        const res = await fetch('/api/mi-negocio/galeria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, tipo: 'portada', orden: 0 }),
        });
        const json = await res.json();
        if (json.ok) {
          setItems(i => [...i.filter(x => x.tipo !== 'portada'), { id: json.id, url, caption: '', tipo: 'portada' }]);
          await fetch('/api/mi-negocio/info', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portada_url: url }),
          });
        }
      } catch {}
    };
    reader.readAsDataURL(file);
  }

  async function deleteItem(id) {
    try {
      await fetch(`/api/mi-negocio/galeria/${id}`, { method: 'DELETE' });
      setItems(i => i.filter(x => x.id !== id));
    } catch {}
  }

  async function saveCaption(id, caption) {
    try {
      await fetch(`/api/mi-negocio/galeria/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      });
      setItems(i => i.map(x => x.id === id ? { ...x, caption } : x));
      setCaptionEdit(null);
    } catch {}
  }

  if (loading) return <div className="neg-loading"><i className="bi bi-arrow-clockwise" /> Cargando...</div>;

  const fotos    = items.filter(i => i.tipo === 'galeria');
  const portadas = items.filter(i => i.tipo === 'portada');
  const emptySlots = Math.max(0, GALERIA_SLOTS - fotos.length);

  return (
    <>
      {/* Banner */}
      <div className="ui-banner ui-banner--info">
        <i className="bi bi-images" />
        <div className="ui-banner__content">
          Las fotos se muestran en el perfil público del negocio. El asistente IA puede usarlas para generar contenido y descripciones automáticamente.
        </div>
      </div>

      {/* Galería de fotos */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-grid" /> Galería de Fotos</span>
        </div>
        <div className="ui-card__body">
          <div className="neg-gallery-grid">
            {fotos.map(foto => (
              <div key={foto.id} className="neg-gallery-cell">
                <img src={foto.url} alt={foto.caption || ''} className="neg-gallery-cell__img" />
                {foto.caption && (
                  <div className="neg-gallery-cell__caption">{foto.caption}</div>
                )}
                <div className="neg-gallery-cell__overlay">
                  <button
                    className="neg-gallery-cell__action"
                    title="Editar caption"
                    onClick={() => setCaptionEdit({ id: foto.id, value: foto.caption || '' })}
                  >
                    <i className="bi bi-pencil" />
                  </button>
                  <button
                    className="neg-gallery-cell__action"
                    title="Eliminar"
                    onClick={() => deleteItem(foto.id)}
                  >
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <label key={`empty-${i}`} className="neg-gallery-cell neg-gallery-cell--empty">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="neg-upload-zone__input"
                  onChange={e => handleFileAdd(e.target.files[0])}
                />
                <i className="bi bi-plus-lg neg-gallery-cell__add" />
                <span className="neg-gallery-cell__add-label">Subir foto</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Portada del perfil público */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-aspect-ratio" /> Foto de Portada del Perfil Público</span>
        </div>
        <div className="ui-card__body">
          {portadas[0] && (
            <img src={portadas[0].url} alt="Portada" className="neg-portada-preview" />
          )}
          <label className="neg-upload-zone">
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="neg-upload-zone__input"
              onChange={e => handlePortadaAdd(e.target.files[0])}
            />
            <i className="bi bi-cloud-arrow-up neg-upload-zone__icon" />
            <span className="neg-upload-zone__text">Subir foto de portada del perfil público</span>
            <span className="neg-upload-zone__sub">Proporción 3:1 · mínimo 1200×400px · JPG o PNG · máx. 5MB</span>
          </label>
        </div>
      </div>

      {/* Video institucional */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-play-circle" /> Video Institucional</span>
        </div>
        <div className="ui-card__body">
          <div className="ui-field">
            <label className="ui-label">URL del video (YouTube o Vimeo)</label>
            <div className="ui-input-wrap">
              <i className="bi bi-youtube ui-input-wrap__icon" />
              <input
                className="ui-input"
                type="url"
                value={videoUrl}
                placeholder="https://youtube.com/watch?v=..."
                onChange={e => setVideoUrl(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal caption editar */}
      {captionEdit && (
        <div className="pmodal-backdrop" onClick={() => setCaptionEdit(null)}>
          <div className="pmodal pmodal--sm" onClick={e => e.stopPropagation()}>
            <div className="pmodal__header">
              <span className="pmodal__title">Editar descripción de foto</span>
              <button className="pmodal__close" onClick={() => setCaptionEdit(null)}>×</button>
            </div>
            <div className="pmodal__body">
              <div className="ui-field">
                <label className="ui-label">Descripción</label>
                <input
                  className="ui-input"
                  value={captionEdit.value}
                  placeholder="Descripción de la foto..."
                  autoFocus
                  onChange={e => setCaptionEdit(c => ({ ...c, value: e.target.value }))}
                />
              </div>
            </div>
            <div className="pmodal__footer">
              <button className="ui-btn ui-btn--secondary" onClick={() => setCaptionEdit(null)}>Cancelar</button>
              <button className="ui-btn ui-btn--primary" onClick={() => saveCaption(captionEdit.id, captionEdit.value)}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
