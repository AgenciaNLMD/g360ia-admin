// lib/documentos.js
// Registro central de documentos del panel.
// Cuando un documento esté disponible, completar el campo `url` con la ruta al archivo.
// Ejemplo: url: "/docs/terminos.pdf"  o  url: "https://storage.ejemplo.com/terminos.pdf"

export const DOCUMENTOS = [
  {
    id: "terminos",
    icon: "bi-file-earmark-text",
    label: "Términos y condiciones",
    desc: "Condiciones de uso de la plataforma",
    version: "v1.0 — Enero 2025",
    url: null,
  },
  {
    id: "privacidad",
    icon: "bi-shield-check",
    label: "Política de privacidad",
    desc: "Cómo manejamos tus datos",
    version: "v1.0 — Enero 2025",
    url: null,
  },
  {
    id: "contrato",
    icon: "bi-file-earmark-pdf",
    label: "Contrato de servicio",
    desc: "Acuerdo vigente con tu cuenta",
    version: "Vigente desde Febrero 2025",
    url: null,
  },
  {
    id: "facturas",
    icon: "bi-receipt",
    label: "Facturas y comprobantes",
    desc: "Historial de pagos y documentos fiscales",
    version: null,
    url: null,
  },
];
