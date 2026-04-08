"use client";

// Staging: ctx hardcodeado para testear el módulo sin autenticación real.
// En producción el ctx lo inyecta el sistema de permisos del panel.

import dynamic from 'next/dynamic';

const MiNegocioModule = dynamic(
  () => import('@/components/modules/mi-negocio/index'),
  { ssr: false }
);

const __testCtx = {
  tenant_id:  1,
  usuario_id: 1,
  rol:        'admin',
  rubro:      'g360ia',
  plan:       'enterprise',
};

export default function DashboardPage() {
  return <MiNegocioModule ctx={__testCtx} />;
}
