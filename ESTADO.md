# ESTADO.md — g360ia-admin

## Estado Actual
- Entorno: Panel interno de G360iA
- Última actualización: 2024-04-16
- Status: Operativo

## Módulos en producción

| Módulo | Rol | Status | Notas |
|---|---|---|---|
| CRM | Gestión interna | ✅ | Leads, funnel, conversaciones |
| MCP | Integraciones | ✅ | WhatsApp, Google, Meta, MP |
| Dashboard | Admin | ✅ | Overview de tenants |

## Qué se resolvió

### Arquitectura & Decisiones
- Panel independiente (NO recibe módulos de dev)
- Gestión de tenants, prospectos, soporte, facturación
- CRM y MCP propios de la empresa

### Integraciones
- Google OAuth
- Evolution API (WhatsApp)
- Meta Graph API (en testing)
- MercadoPago

## Qué queda

### Pendientes críticos
- [ ] Dashboard de analytics (tenants activos, churn, MRR)
- [ ] Facturación automática (integración con MercadoPago)
- [ ] Soporte ticket system
- [ ] Reportes de uso (token costs, API usage)

### En roadmap
- Maia como sistema transversal (advisory)
- Integraciones B2B (resellers, partners)
- White-label customization

## Bloqueantes
- Ninguno

## Notas
- Admin sin dependencia de módulos de dev
- Ciclo independiente de deploy
- NextAuth requerido para acceso
