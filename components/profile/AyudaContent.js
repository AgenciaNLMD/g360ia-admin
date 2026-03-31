"use client";
// components/profile/AyudaContent.js
// Contenido del popup "Obtener ayuda"

const OPCIONES = [
  { icon: "bi-chat-dots",        label: "Chat de soporte",       desc: "Hablá con nuestro equipo en tiempo real" },
  { icon: "bi-book",             label: "Documentación",          desc: "Guías y tutoriales del panel" },
  { icon: "bi-play-circle",      label: "Videos tutoriales",      desc: "Aprendé con videos paso a paso" },
  { icon: "bi-envelope-at",      label: "Enviar un mensaje",      desc: "soporte@gestion360ia.com" },
];

export default function AyudaContent() {
  return (
    <div className="prof-content">
      <div className="prof-section-title">¿En qué podemos ayudarte?</div>
      {OPCIONES.map((op) => (
        <div key={op.label} className="prof-doc-row">
          <div className="prof-doc-icon">
            <i className={`bi ${op.icon}`} />
          </div>
          <div className="prof-doc-info">
            <div className="prof-doc-label">{op.label}</div>
            <div className="prof-doc-sub">{op.desc}</div>
          </div>
          <i className="bi bi-chevron-right prof-doc-arrow" />
        </div>
      ))}
    </div>
  );
}
