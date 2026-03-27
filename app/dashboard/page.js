"use client";

// Área de contenido central — lista para recibir módulos con dynamic import.
// Importá módulos desde components/modules/ usando:
//   const MiModulo = dynamic(() => import("@/components/modules/MiModulo"), { ssr: false });

export default function DashboardPage() {
  return (
    <div style={{
      flex: 1,
      padding: "32px 28px",
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    }}>
      {/* Montá módulos aquí */}
    </div>
  );
}
