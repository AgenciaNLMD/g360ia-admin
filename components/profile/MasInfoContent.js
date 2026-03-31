"use client";
// components/profile/MasInfoContent.js
// Contenido del popup "Más información"

const ITEMS = [
  { icon: "bi-info-circle",    label: "Versión del panel",   value: "v1.0.0" },
  { icon: "bi-server",         label: "Entorno",             value: "Producción" },
  { icon: "bi-calendar3",      label: "Última actualización",value: "Marzo 2026" },
  { icon: "bi-envelope",       label: "Soporte",             value: "soporte@gestion360ia.com" },
];

export default function MasInfoContent() {
  return (
    <div className="prof-content">
      <div className="prof-section-title">Acerca del panel</div>
      {ITEMS.map((item) => (
        <div key={item.label} className="prof-info-row">
          <i className={`bi ${item.icon} prof-info-icon`} />
          <div className="prof-info-body">
            <div className="prof-info-label">{item.label}</div>
            <div className="prof-info-value">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
