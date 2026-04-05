#!/bin/bash
set -e

BRANCHES=("feature/ordenes-de-trabajo" "feature/inventario" "feature/finanzas" "feature/sucursales" "feature/personal")

for BRANCH in "${BRANCHES[@]}"; do
  echo ""
  echo "── $BRANCH ──────────────────────────────"
  git checkout "$BRANCH"

  mkdir -p app/dashboard styles public

  # Copiar archivos sin cambios desde main
  git checkout main -- styles/panel-system.css
  git checkout main -- app/globals.css
  git checkout main -- tailwind.config.js
  git checkout main -- jsconfig.json
  git checkout main -- next.config.js
  git checkout main -- Postcss.config.js
  git checkout main -- public/gestion360ia.ico

  # .gitignore
  cat > .gitignore << 'EOF'
node_modules/
.next/
.env
.env.local
EOF

  # package.json — sin next-auth ni mysql2 ni nodemailer
  cat > package.json << 'EOF'
{
  "name": "g360ia-admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
EOF

  # app/layout.js — sin providers de auth
  cat > app/layout.js << 'EOF'
import "./globals.css";

export const metadata = {
  title: "G360 Admin — Módulo en desarrollo",
  description: "Entorno de desarrollo de módulo",
  icons: { icon: "/gestion360ia.ico" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
        <link rel="icon" href="/gestion360ia.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
EOF

  # app/page.js — redirect directo al dashboard
  cat > app/page.js << 'EOF'
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/dashboard");
}
EOF

  # app/dashboard/layout.js — sidebar simplificado: logo + toggle + content area
  cat > app/dashboard/layout.js << 'EOF'
"use client";
import { useState } from "react";
import "../../styles/panel-system.css";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="panel-wrap">
      <aside className={`sb${collapsed ? " sb--collapsed" : ""}`}>
        <div
          className="sb-logo sb-logo--clickable"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <div className="sb-logo__icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="18" height="14">
              <rect x="0"  y="10" width="6" height="6" rx="1.5" fill="white" opacity=".35"/>
              <rect x="0"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
              <rect x="0"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
              <rect x="8"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
              <rect x="8"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
              <rect x="16" y="0"  width="6" height="6" rx="1.5" fill="#B08A55"/>
            </svg>
          </div>
          <div className="sb-logo__text">
            <div className="sb-logo__title">Gestión 360 <span>iA</span></div>
            <div className="sb-logo__sub">Panel Admin</div>
          </div>
        </div>
        <nav className="sb-nav" />
      </aside>
      <main className="panel-content">
        {children}
      </main>
    </div>
  );
}
EOF

  # app/dashboard/page.js — área de trabajo vacía
  cat > app/dashboard/page.js << 'EOF'
export default function DashboardPage() {
  return (
    <div className="mod-wrap">
      {/* El módulo se desarrolla aquí */}
    </div>
  );
}
EOF

  git add .
  git commit -m "base: entorno de desarrollo (sidebar + panel-system)"
  git push origin "$BRANCH"
  echo "✓ $BRANCH listo y pusheado"
done

git checkout main
echo ""
echo "✓ Todas las ramas listas. De vuelta en main."
