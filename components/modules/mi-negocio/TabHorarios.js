"use client";
import { useState, useEffect } from 'react';

const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

export default function TabHorarios({ ctx, saveTrigger, discardTrigger, onSaveResult, onDiscardResult }) {
  const [horarios, setHorarios]         = useState([]);
  const [origHorarios, setOrigHorarios] = useState([]);
  const [cierre, setCierre]             = useState(null);
  const [origCierre, setOrigCierre]     = useState(null);
  const [mfh, setMfh]                   = useState('');
  const [origMfh, setOrigMfh]           = useState('');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    fetch('/api/mi-negocio/horarios')
      .then(r => r.json())
      .then(d => {
        setHorarios(d.horarios || []);
        setOrigHorarios(d.horarios || []);
        setCierre(d.cierre || null);
        setOrigCierre(d.cierre || null);
        setMfh(d.mensaje_fuera_horario || '');
        setOrigMfh(d.mensaje_fuera_horario || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (saveTrigger > 0) doSave(); }, [saveTrigger]);
  useEffect(() => {
    if (discardTrigger > 0) {
      setHorarios(origHorarios);
      setCierre(origCierre);
      setMfh(origMfh);
      if (onDiscardResult) onDiscardResult();
    }
  }, [discardTrigger]);

  async function doSave() {
    try {
      const res = await fetch('/api/mi-negocio/horarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horarios, cierre, mensaje_fuera_horario: mfh }),
      });
      const json = await res.json();
      if (json.ok) {
        setOrigHorarios(horarios);
        setOrigCierre(cierre);
        setOrigMfh(mfh);
        if (onSaveResult) onSaveResult(true);
      } else {
        if (onSaveResult) onSaveResult(false, json.error);
      }
    } catch { if (onSaveResult) onSaveResult(false, 'Error de conexión'); }
  }

  function setHorario(idx, field, value) {
    setHorarios(h => h.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  function toggleSegundoTurno(idx) {
    setHorarios(h => h.map((r, i) => {
      if (i !== idx) return r;
      if (r.hora_desde_2) {
        return { ...r, hora_desde_2: null, hora_hasta_2: null };
      }
      return { ...r, hora_desde_2: '14:00', hora_hasta_2: '18:00' };
    }));
  }

  if (loading) return <div className="neg-loading"><i className="bi bi-arrow-clockwise" /> Cargando...</div>;

  return (
    <>
      {/* Banner */}
      <div className="ui-banner ui-banner--ok">
        <i className="bi bi-clock" />
        <div className="ui-banner__content">
          El bot de WhatsApp informa estos horarios automáticamente. Si un cliente escribe fuera del horario, recibirá el mensaje configurado.
        </div>
      </div>

      {/* Horario semanal */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-calendar-week" /> Horario Semanal</span>
        </div>
        <div className="ui-card__body">
          <div className="neg-schedule-list">
            {horarios.map((h, i) => (
              <div key={h.dia_semana ?? i} className="neg-schedule-row">
                <span className="neg-schedule-row__day">{DIAS[h.dia_semana ?? i]}</span>

                <label className="ui-toggle">
                  <input
                    type="checkbox"
                    checked={!!h.abierto}
                    onChange={e => setHorario(i, 'abierto', e.target.checked ? 1 : 0)}
                  />
                  <span className="ui-toggle__track" />
                </label>

                {h.abierto ? (
                  <div className="neg-schedule-times">
                    <input type="time" value={h.hora_desde_1 || ''} onChange={e => setHorario(i, 'hora_desde_1', e.target.value)} />
                    <span className="neg-schedule-times__sep">a</span>
                    <input type="time" value={h.hora_hasta_1 || ''} onChange={e => setHorario(i, 'hora_hasta_1', e.target.value)} />

                    {h.hora_desde_2 ? (
                      <div className="neg-second-shift">
                        <span className="neg-schedule-times__sep">/</span>
                        <input type="time" value={h.hora_desde_2 || ''} onChange={e => setHorario(i, 'hora_desde_2', e.target.value)} />
                        <span className="neg-schedule-times__sep">a</span>
                        <input type="time" value={h.hora_hasta_2 || ''} onChange={e => setHorario(i, 'hora_hasta_2', e.target.value)} />
                        <button className="neg-btn-add-shift" onClick={() => toggleSegundoTurno(i)}>✕ Quitar</button>
                      </div>
                    ) : (
                      <button className="neg-btn-add-shift" onClick={() => toggleSegundoTurno(i)}>+ 2° turno</button>
                    )}
                  </div>
                ) : (
                  <span className="neg-schedule-row__closed">Cerrado</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mensaje fuera de horario */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-chat-dots" /> Mensaje Fuera de Horario</span>
        </div>
        <div className="ui-card__body">
          <div className="ui-field">
            <label className="ui-label">Mensaje automático del bot cuando está cerrado</label>
            <textarea
              className="ui-textarea"
              rows={3}
              value={mfh}
              placeholder="¡Hola! Gracias por contactarnos. Nuestro horario de atención es Lunes a Viernes de 9 a 19hs..."
              onChange={e => setMfh(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cierre especial */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title"><i className="bi bi-calendar-x" /> Cierre Especial / Vacaciones</span>
        </div>
        <div className="ui-card__body">
          <div className="form-grid">
            <div className="ui-field">
              <label className="ui-label">Fecha Desde</label>
              <input
                className="ui-input"
                type="date"
                value={cierre?.fecha_desde || ''}
                onChange={e => setCierre(c => ({ ...(c||{}), fecha_desde: e.target.value }))}
              />
            </div>
            <div className="ui-field">
              <label className="ui-label">Fecha Hasta</label>
              <input
                className="ui-input"
                type="date"
                value={cierre?.fecha_hasta || ''}
                onChange={e => setCierre(c => ({ ...(c||{}), fecha_hasta: e.target.value }))}
              />
            </div>
            <div className="ui-field span2">
              <label className="ui-label">Mensaje del bot durante el cierre</label>
              <input
                className="ui-input"
                value={cierre?.mensaje_bot || ''}
                placeholder="Ej: Estamos de vacaciones hasta el 15 de enero..."
                onChange={e => setCierre(c => ({ ...(c||{}), mensaje_bot: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
