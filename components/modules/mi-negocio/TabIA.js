"use client";
import { useState, useEffect, useRef } from 'react';

const TONOS = ['Amigable','Formal','Técnico','Entusiasta','Profesional'];

export default function TabIA({ ctx, saveTrigger, discardTrigger, onSaveResult, onDiscardResult }) {
  const [config, setConfig]         = useState({});
  const [origConfig, setOrigConfig] = useState({});
  const [servicios, setServicios]   = useState([]);
  const [keywords, setKeywords]     = useState([]);
  const [faq, setFaq]               = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tagInputS, setTagInputS]   = useState('');
  const [tagInputK, setTagInputK]   = useState('');
  const tagSRef = useRef(null);
  const tagKRef = useRef(null);

  useEffect(() => {
    fetch('/api/mi-negocio/ia')
      .then(r => r.json())
      .then(d => {
        setConfig(d.config || {});
        setOrigConfig(d.config || {});
        setServicios(d.servicios || []);
        setKeywords(d.keywords || []);
        setFaq(d.faq || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (saveTrigger > 0) doSave(); }, [saveTrigger]);
  useEffect(() => {
    if (discardTrigger > 0) {
      setConfig(origConfig);
      if (onDiscardResult) onDiscardResult();
    }
  }, [discardTrigger]);

  async function doSave() {
    try {
      const res = await fetch('/api/mi-negocio/ia', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (json.ok) { setOrigConfig(config); if (onSaveResult) onSaveResult(true); }
      else { if (onSaveResult) onSaveResult(false, json.error); }
    } catch { if (onSaveResult) onSaveResult(false, 'Error de conexión'); }
  }

  const setConf = (field, val) => setConfig(c => ({ ...c, [field]: val }));

  async function addTag(nombre, tipo, setList, setInput) {
    if (!nombre.trim()) return;
    try {
      const res  = await fetch('/api/mi-negocio/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), tipo }),
      });
      const json = await res.json();
      if (json.ok) {
        setList(l => [...l, { id: json.id, nombre: nombre.trim(), tipo }]);
        setInput('');
      }
    } catch {}
  }

  async function deleteTag(id, setList) {
    try {
      await fetch(`/api/mi-negocio/ia/servicios/${id}`, { method: 'DELETE' });
      setList(l => l.filter(t => t.id !== id));
    } catch {}
  }

  async function addFaq() {
    try {
      const res  = await fetch('/api/mi-negocio/ia/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: '', respuesta: '', orden: faq.length }),
      });
      const json = await res.json();
      if (json.ok) setFaq(f => [...f, { id: json.id, pregunta: '', respuesta: '' }]);
    } catch {}
  }

  async function deleteFaq(id) {
    try {
      await fetch(`/api/mi-negocio/ia/faq/${id}`, { method: 'DELETE' });
      setFaq(f => f.filter(q => q.id !== id));
    } catch {}
  }

  function updateFaq(id, field, val) {
    setFaq(f => f.map(q => q.id === id ? { ...q, [field]: val } : q));
  }

  async function saveFaqItem(id) {
    const item = faq.find(q => q.id === id);
    if (!item) return;
    try {
      await fetch(`/api/mi-negocio/ia/faq/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: item.pregunta, respuesta: item.respuesta }),
      });
    } catch {}
  }

  if (loading) return <div className="neg-loading"><i className="bi bi-arrow-clockwise" /> Cargando...</div>;

  return (
    <>
      {/* Banner */}
      <div className="ui-banner ui-banner--ok">
        <i className="bi bi-stars" />
        <div className="ui-banner__content">
          Esta información entrena al asistente IA. Cuanto más completa esté, más inteligentes y precisas serán las respuestas del bot y del asistente interno.
        </div>
      </div>

      {/* Descripción y tono */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-robot" /> Descripción del Negocio para la IA</span>
        </div>
        <div className="ui-card__body">
          <div className="form-section">

            <div className="ui-field span2">
              <div className="neg-label-row">
                <label className="ui-label">Descripción larga</label>
                <span className="badge b--slate">Usada como contexto principal del asistente</span>
              </div>
              <textarea
                className="ui-textarea"
                rows={6}
                value={config.descripcion_larga || ''}
                placeholder="Contá todo sobre tu negocio: historia, especialidades, qué te diferencia, a quién atendés, en qué zona operás, cuáles son tus valores..."
                onChange={e => setConf('descripcion_larga', e.target.value)}
              />
            </div>

            <div className="ui-field">
              <label className="ui-label">Tono de comunicación del bot</label>
              <div className="neg-tone-group">
                {TONOS.map(t => (
                  <button
                    key={t}
                    className={`neg-tone-chip${(config.tono || 'Amigable').toLowerCase() === t.toLowerCase() ? ' neg-tone-chip--active' : ''}`}
                    onClick={() => setConf('tono', t.toLowerCase())}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Servicios */}
            <div className="ui-field">
              <label className="ui-label">Servicios o productos principales</label>
              <div className="neg-tag-wrap">
                {servicios.map(s => (
                  <span key={s.id} className="neg-tag-chip">
                    {s.nombre}
                    <button className="neg-tag-chip__del" onClick={() => deleteTag(s.id, setServicios)}>×</button>
                  </span>
                ))}
                <input
                  ref={tagSRef}
                  className="neg-tag-input"
                  value={tagInputS}
                  placeholder="Escribí y presioná Enter..."
                  onChange={e => setTagInputS(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInputS, 'servicio', setServicios, setTagInputS);
                    }
                  }}
                />
              </div>
            </div>

            {/* Keywords */}
            <div className="ui-field">
              <label className="ui-label">Palabras clave del rubro</label>
              <div className="neg-tag-wrap">
                {keywords.map(k => (
                  <span key={k.id} className="neg-tag-chip">
                    {k.nombre}
                    <button className="neg-tag-chip__del" onClick={() => deleteTag(k.id, setKeywords)}>×</button>
                  </span>
                ))}
                <input
                  ref={tagKRef}
                  className="neg-tag-input"
                  value={tagInputK}
                  placeholder="Ej: salón, eventos, catering..."
                  onChange={e => setTagInputK(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInputK, 'keyword', setKeywords, setTagInputK);
                    }
                  }}
                />
              </div>
            </div>

            {/* Política de precios */}
            <div className="ui-field span2">
              <div className="neg-label-row">
                <label className="ui-label">Política de precios / presupuestos</label>
                <span className="badge b--muted">El bot la usa para responder consultas de precio</span>
              </div>
              <textarea
                className="ui-textarea"
                rows={3}
                value={config.politica_precios || ''}
                placeholder="Ej: Los presupuestos son personalizados según la cantidad de invitados y los servicios elegidos. Enviamos cotización en 24hs."
                onChange={e => setConf('politica_precios', e.target.value)}
              />
            </div>

          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-question-circle" /> Preguntas Frecuentes (FAQ del Bot)</span>
        </div>
        <div className="ui-card__body">
          <div className="neg-faq-list">
            {faq.map((q, i) => (
              <div key={q.id} className="neg-faq-item">
                <span className="neg-faq-item__num">{String(i + 1).padStart(2, '0')}</span>
                <div className="neg-faq-item__body">
                  <input
                    className="ui-input"
                    value={q.pregunta}
                    placeholder="¿Cuál es la pregunta?"
                    onChange={e => updateFaq(q.id, 'pregunta', e.target.value)}
                    onBlur={() => saveFaqItem(q.id)}
                  />
                  <textarea
                    className="ui-textarea"
                    rows={2}
                    value={q.respuesta}
                    placeholder="Respuesta del bot..."
                    onChange={e => updateFaq(q.id, 'respuesta', e.target.value)}
                    onBlur={() => saveFaqItem(q.id)}
                  />
                </div>
                <button className="neg-faq-item__del" onClick={() => deleteFaq(q.id)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            ))}
          </div>
          <div className="neg-faq-add">
            <button className="ui-btn ui-btn--secondary" onClick={addFaq}>
              <i className="bi bi-plus-lg" /> Agregar pregunta
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
