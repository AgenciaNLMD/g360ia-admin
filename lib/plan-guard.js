// lib/plan-guard.js
// Helper centralizado para control de acceso por plan del tenant.
//
// Uso en API route:
//   if (!canUse(session.user.tenantPlan, 'facturacion_arca')) {
//     return NextResponse.json({ ok: false, error: 'Requiere plan Pro' }, { status: 403 });
//   }
//
// Uso en componente React:
//   if (!canUse(tenant.plan, 'ot_etapas_completas')) return <UpgradeBanner feature="ot_etapas_completas" />;

const FEATURES = {
  // OT: plan Free solo ve etapas 1 y 7 (Recibido / Entregado)
  ot_etapas_completas:   ["pro", "business", "ia"],

  // Facturación electrónica ARCA
  facturacion_arca:      ["pro", "business", "ia"],

  // Cobros con MercadoPago
  mercadopago:           ["pro", "business", "ia"],

  // Comunicaciones automáticas por cambio de etapa
  comunicaciones_auto:   ["pro", "business", "ia"],

  // Multi-sucursal
  multi_sucursal:        ["business", "ia"],

  // Gestión de equipo técnico
  equipo:                ["pro", "business", "ia"],

  // Módulo de proveedores y órdenes de compra
  proveedores:           ["business", "ia"],

  // Finanzas y reportes avanzados
  finanzas:              ["business", "ia"],

  // Predictor de stock con IA
  inventario_predictor:  ["ia"],

  // Bot Agente IA (WhatsApp con memoria del negocio)
  agente_ia:             ["ia"],

  // Skills IA reactivas (Maia)
  maia_skills:           ["ia"],

  // Social Studio: posts ilimitados
  social_ilimitado:      ["pro", "business", "ia"],

  // Social Studio: métricas de alcance
  social_metricas:       ["business", "ia"],

  // Social Studio: descripción IA para posts
  social_ia:             ["ia"],
};

/**
 * Verifica si un plan tiene acceso a una feature.
 * @param {string} plan - Plan del tenant: 'free' | 'pro' | 'business' | 'ia'
 * @param {string} feature - Clave de la feature en FEATURES
 * @returns {boolean}
 */
export function canUse(plan, feature) {
  return FEATURES[feature]?.includes(plan) ?? false;
}

/**
 * Devuelve la lista de features disponibles para un plan.
 * @param {string} plan
 * @returns {string[]}
 */
export function featuresForPlan(plan) {
  return Object.entries(FEATURES)
    .filter(([, plans]) => plans.includes(plan))
    .map(([feature]) => feature);
}

/**
 * Plan mínimo requerido para una feature (para mostrar en UI).
 * @param {string} feature
 * @returns {string | null}
 */
export function planMinimo(feature) {
  const plans = FEATURES[feature];
  if (!plans || plans.length === 0) return null;
  const order = ["free", "pro", "business", "ia"];
  return plans.reduce((min, p) =>
    order.indexOf(p) < order.indexOf(min) ? p : min
  , plans[0]);
}

export const PLAN_LABELS = {
  free:     "Free",
  pro:      "Pro",
  business: "Business",
  ia:       "Plan IA",
};
