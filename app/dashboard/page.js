"use client";

import { useContext } from "react";
import dynamic from "next/dynamic";
import { ModuloContext } from "./layout";

// Mapa de módulos conocidos — agregar entradas acá al crear nuevos módulos
const MODULOS = {
  crm: dynamic(() => import("@/components/modules/crm"), { ssr: false }),
  mcp: dynamic(() => import("@/components/modules/mcp"), { ssr: false }),
};

export default function DashboardPage() {
  const { moduloActivo } = useContext(ModuloContext);

  if (!moduloActivo) {
    return (
      <div className="mod-wrap mod-wrap--empty">
        <div className="ui-empty">
          <i className="bi bi-grid ui-empty__icon" />
          <div className="ui-empty__text">Seleccioná un módulo</div>
          <div className="ui-empty__sub">Elegí una opción del menú lateral para comenzar.</div>
        </div>
      </div>
    );
  }

  const ModuloComponent = MODULOS[moduloActivo];

  if (!ModuloComponent) {
    return (
      <div className="mod-wrap mod-wrap--empty">
        <div className="ui-empty">
          <i className="bi bi-exclamation-circle ui-empty__icon" />
          <div className="ui-empty__text">Módulo no encontrado</div>
          <div className="ui-empty__sub">El módulo <strong>{moduloActivo}</strong> no está disponible.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mod-wrap">
      <ModuloComponent />
    </div>
  );
}
