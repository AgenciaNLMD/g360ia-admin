// lib/panel-themes.js
// Temas de color para el sidebar del panel admin.
// Importá THEMES y applyTheme desde acá — no pongas esta data en el layout.

export const THEMES = {
  verde: {
    label:   "Verde",
    sub:     "Predeterminado",
    sbBg:    "#1A7A4A",
    sbBrd:   "rgba(255,255,255,.2)",
    sbActive:"rgba(255,255,255,.2)",
    preview: ["#1A7A4A", "#2A9A60", "#1A7A4A"],
  },
  slate: {
    label:   "Tiza",
    sub:     "Slate",
    sbBg:    "linear-gradient(170deg,#7E8FA6 0%,#5C6E85 55%,#3A4A5C 100%)",
    sbBrd:   "rgba(255,255,255,.15)",
    sbActive:"rgba(255,255,255,.18)",
    preview: ["#7E8FA6", "#5C6E85", "#3A4A5C"],
  },
  champagne: {
    label:   "Champagne",
    sub:     "Dorado",
    sbBg:    "linear-gradient(170deg,#F7D87C 0%,#C8922E 60%,#A87020 100%)",
    sbBrd:   "rgba(0,0,0,.12)",
    sbActive:"rgba(0,0,0,.12)",
    preview: ["#F7D87C", "#C8922E", "#A87020"],
  },
  teal: {
    label:   "Teal",
    sub:     "Azul marino",
    sbBg:    "linear-gradient(170deg,#1FC8A0 0%,#17B0A7 50%,#1499C2 100%)",
    sbBrd:   "rgba(255,255,255,.18)",
    sbActive:"rgba(255,255,255,.18)",
    preview: ["#1FC8A0", "#17B0A7", "#1499C2"],
  },
};

export const THEME_STORAGE_KEY = "g360ia_admin_theme";

/** Aplica un tema al sidebar modificando las variables CSS en :root */
export function applyTheme(key) {
  const t = THEMES[key];
  if (!t) return;
  const root = document.documentElement;
  root.style.setProperty("--sb-bg",     t.sbBg);
  root.style.setProperty("--sb-brd",    t.sbBrd);
  root.style.setProperty("--sb-active", t.sbActive);
}
