# Gestión 360 iA — Contexto del proyecto
> Fuente de verdad para Claude Code. Leer antes de tocar cualquier archivo.
> Versión: marzo 2026 — Agencia NLMD

---

## 1. Qué es esto

SaaS multi-tenant modular con IA transversal para pymes argentinas. El cliente descarga la app de su rubro, completa onboarding, y accede automáticamente según su plan. Sin aprobación manual. Escala a miles de tenants simultáneos.

**Diferenciador clave:** Skills IA — sugerencias proactivas y reactivas por rubro. No existe equivalente en Argentina ni LATAM.

**Org GitHub:** `AgenciaNLMD`

---

## 2. Repos del sistema

| Repo | URL desplegada | Estado |
|---|---|---|
| `g360ia-admin` | admin.gestion360ia.com.ar | ✅ En producción |
| `g360ia-portal` | app.gestion360ia.com.ar | 🔨 A construir |
| `backend` (Node.js/Express) | api.gestion360ia.com.ar | ⏸ Inactivo — fase futura |

---

## 3. Stack tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | Next.js 14.2.3 (React 18) |
| Auth | NextAuth v4 + Google OAuth |
| Base de datos | MySQL 9 — 1 DB core + 1 DB por tenant |
| Caché | Redis 7 |
| WhatsApp | Evolution API |
| IA principal | Claude API — `claude-sonnet-4-6` |
| IA fallback | OpenAI GPT-4o |
| Automatizaciones | n8n |
| Pagos | MercadoPago (integrado en Free) |
| Facturación AR | AfipSDK — API ARCA (ex-AFIP) |
| Redes sociales | Meta Graph API (Instagram + Facebook) |
| Mapas / GPS | Google Maps API + Mapbox |
| Storage | S3-compatible (plantillas Social Studio) |
| Deploy | Easypanel — VPS Hostinger (IP: 187.77.233.49) |
| CI/CD | GitHub (deploy manual por ahora) |

---

## 4. Infraestructura Easypanel

Todos los servicios están dentro del proyecto `g360ia` en Easypanel.

| Servicio | Tecnología | Puerto | Estado |
|---|---|---|---|
| admin | Next.js 14 | :3000 | ✅ Producción |
| g360ia-portal | Next.js 14 | :3001 | 🔨 A construir |
| mysql | MySQL 9 | :3306 interno | ✅ Activo |
| redis | Redis 7 | :6379 interno | ✅ Activo |
| g360ia-db | MariaDB 11 | — | ❌ Eliminar — vacía |
| g360ia (WP) | WordPress | — | ⚠ Revisar |

---

## 5. Arquitectura de carpetas

### Regla de capas — aplica a AMBOS repos, NO negociable

```
app/api/      → backend (rutas API)
app/(pages)/  → frontend (páginas)
lib/          → lógica compartida reutilizable
components/   → UI pura, SIN fetch ni lógica de negocio
```

### g360ia-admin (en producción)

```
app/
  api/
    auth/[...nextauth]/   ← NextAuth ADMIN (Google OAuth, secret propio)
    tenants/              ← CRUD de clientes/tenants
    usuarios/             ← gestión usuarios internos del equipo
    ventas/               ← leads, CRM, conversaciones, actividades
    soporte/              ← tickets y mensajes de soporte
    equipos/              ← áreas y personal interno
    integraciones/        ← WhatsApp, Google OAuth, Gmail, Calendar
    maia/                 ← alertas e IA interna (Maia)
    webhooks/             ← Evolution API — mensajes entrantes WhatsApp
    stats/                ← métricas dashboard y sidebar
    auditoria/            ← log de sesiones y accesos
    perfil/               ← sesiones del usuario logueado
    register/             ← registro nuevos usuarios del equipo
    aprobar/              ← aprobación de acceso usuarios internos
  dashboard/              ← página principal del panel admin
  bienvenido/             ← redirect post-login, registra sesión
  pendiente/              ← usuario pendiente de aprobación
  portal/                 ← ⚠ MOVER AL REPO g360ia-portal
lib/
  db.js                   ← pool MySQL core (base g360ia)
  auth.js                 ← config NextAuth ADMIN — secret exclusivo
  tenant-db.js            ← pool conexiones a DB por tenant (con caché)
  tenant-provisioner.js   ← crea DB del tenant en onboarding
  auth-portal.js          ← ⚠ MOVER AL REPO PORTAL
database/
  schema/                 ← tablas DB core (g360ia)
  tenant-migrations/      ← módulos nuevos — se propagan con migrar-tenants.js
  migrations/             ← migraciones DB core
```

### g360ia-portal (a construir)

```
app/
  api/
    auth/[...nextauth]/   ← NextAuth PORTAL (secret DIFERENTE al admin)
    portal/               ← endpoints del tenant autenticado
      onboarding/         ← POST — alta + provisioning de DB
      dashboard/          ← métricas del negocio del tenant
      clientes/           ← CRM básico del tenant
      whatsapp/           ← conversaciones + bot IA
      agenda/             ← turnos con predicción de demanda
      modulos/            ← módulos habilitados según rubro y plan
      social/             ← Social Studio — compositor + calendario + Meta API
      ots/                ← Órdenes de trabajo (rubro servicio técnico)
      repuestos/          ← Inventario de repuestos
      proveedores/        ← Gestión de proveedores y órdenes de compra
      facturacion/        ← Facturación PDF + ARCA
      finanzas/           ← Reportes financieros y caja
      gps/                ← Tracking domicilio (Plan IA)
  (dashboard)/            ← shell del portal — solo si onboarding completo
  onboarding/             ← pasos de alta: nombre, logo, rubro, plan
  login/                  ← login Google
  page.js                 ← redirect a login o dashboard
lib/
  db.js                   ← pool MySQL core
  auth-portal.js          ← config NextAuth PORTAL — secret propio
  tenant-db.js            ← conexión a DB del tenant (desde token)
components/
  ui/                     ← botones, inputs, badges, cards reutilizables
  layout/                 ← Sidebar, Topbar, Shell del dashboard
  modules/                ← un componente por módulo del sistema
  onboarding/             ← pasos del flujo de alta
  social-studio/          ← compositor canvas, calendario editorial
public/
  manifest.json           ← PWA
  sw.js                   ← Service Worker
```

---

## 6. Autenticación — reglas críticas

⛔ **Admin y portal usan NextAuth COMPLETAMENTE independiente. Nunca compartir NEXTAUTH_SECRET. Las cookies no comparten dominio.**

| App | Variable | Valor |
|---|---|---|
| Admin | `NEXTAUTH_URL` | `https://admin.gestion360ia.com.ar` |
| Admin | `NEXTAUTH_SECRET` | String largo aleatorio — exclusivo admin |
| Portal | `NEXTAUTH_URL` | `https://app.gestion360ia.com.ar` |
| Portal | `NEXTAUTH_SECRET` | String DIFERENTE al del admin — nunca el mismo |

### Roles RBAC

| Rol | App | Acceso |
|---|---|---|
| `superadmin` | Admin | Acceso total |
| `admin` | Admin | Todo excepto config del sistema |
| `vendedor` | Admin | Solo CRM: leads, funnel, conversaciones asignadas |
| `cm` | Admin | Solo bandeja RRSS y leads |
| `soporte` | Admin | Solo tickets y atención a tenants |
| `viewer` | Admin | Solo lectura — pendiente aprobación |
| `tenant` | Portal | Su propio portal — solo su DB, módulos según plan |

---

## 7. Base de datos

### Arquitectura multi-tenant

- **DB core:** `g360ia` — administración del sistema completo
- **DB por tenant:** `t001_nombre`, `t002_nombre`, etc. — una por cliente

### Regla de conexión — NO negociable

```
Toda API que necesite datos del tenant usa lib/tenant-db.js
con el dbName que viene del TOKEN DE SESIÓN.
NUNCA se acepta dbName del body o query string.
NUNCA se conecta a la DB de otro tenant.
```

### DB core `g360ia` — tablas principales

| Tabla | Descripción |
|---|---|
| `tenants` | Todos los clientes. id, nombre, rubro, plan, email, db_name, activo, trial_hasta |
| `usuarios` | Usuarios internos del equipo G360iA. roles, area, status |
| `sesiones_log` | Auditoría de accesos por usuario |
| `permisos_modulo` | RBAC: rol + area + modulo → permisos CRUD |
| `integraciones` | Catálogo de integraciones disponibles |
| `integraciones_tokens` | Tokens OAuth por integración y tenant |
| `whatsapp_instancias` | Instancias Evolution API por tenant |
| `contactos` | CRM — contactos del portal tenant |
| `conversaciones` | Conversaciones por canal (whatsapp, email, instagram) |
| `mensajes` | Mensajes dentro de cada conversación |
| `leads` | Pipeline comercial del portal tenant |
| `ventas_leads` | Leads CRM interno del admin |
| `ventas_actividades` | Actividades sobre leads internos |
| `ventas_conversaciones` | Conversaciones del equipo con leads internos |
| `ventas_mensajes` | Mensajes de conversaciones de ventas |
| `ventas_metas` | Metas mensuales por vendedor |
| `soporte_tickets` | Tickets de soporte de tenants |
| `soporte_mensajes` | Mensajes dentro de tickets |
| `maia_alertas` | Alertas generadas por Maia para el equipo |

### DB por tenant `t00X_nombre` — tablas base (todos los tenants)

| Tabla | Descripción |
|---|---|
| `tenant_migraciones` | Registro de migraciones aplicadas |
| `clientes` | Clientes del negocio del tenant |
| `conversaciones` | Conversaciones con clientes del tenant |
| `mensajes` | Mensajes dentro de cada conversación |
| `configuracion` | Config del negocio en clave/valor |
| `modulos_activos` | Módulos habilitados para este tenant |
| `ia_sugerencias` | Sugerencias Skills IA para este tenant |
| `notificaciones` | Notificaciones enviadas a clientes |
| `social_plantillas` | Plantillas gráficas del tenant (Social Studio) |
| `social_posts` | Posts programados y publicados |
| `social_calendario` | Calendario editorial |

### Tablas de módulos adicionales (según rubro y plan)

| Tabla | Módulo | Rubro | Plan mínimo |
|---|---|---|---|
| `turnos` | Agenda | Salud, profesionales | Free |
| `historia_clinica` | Historia clínica | Salud | Pro |
| `habitaciones` / `reservas` | Gestión hotel | Hotelería | Free |
| `propiedades` | Listado propiedades | Inmobiliaria | Free |
| `expedientes` | Gestión expedientes | Profesionales | Free |
| `tecnicos` | Equipo técnico | Servicio técnico | Pro |
| `ots` | Órdenes de trabajo | Servicio técnico | Free |
| `repuestos` | Inventario repuestos | Servicio técnico | Free |
| `proveedores` | Gestión proveedores | Servicio técnico | Business |
| `ordenes_compra` | Órdenes de compra | Servicio técnico | Business |
| `facturas` | Facturación PDF | Universal | Free |
| `facturas_arca` | Facturación electrónica ARCA | Universal (AR) | Pro |
| `productos_menu` / `pedidos` | Menú digital | Restaurante | Free |
| `reclamos` | Reclamos ciudadanos | GovTech | Free |

Cada módulo nuevo va en `database/tenant-migrations/` con anotaciones `-- @rubro:` y `-- @plan:`. El script `migrar-tenants.js` lo aplica solo a quien corresponde.

---

## 8. Planes — Estructura general

### Lógica de planes

- **Free:** permanente, sin vencimiento. Sin costo de infra para G360iA. CRM solo por web y email (sin WhatsApp). Sin IA activa. 1 usuario.
- **Pro:** WhatsApp activo (Evolution API — $1.30/mes por número). Bot FAQ. Módulos operativos completos del rubro. Hasta 5 usuarios.
- **Business:** Multi-sucursal. Usuarios ilimitados. Proveedores. Finanzas. Módulos de escala.
- **Plan IA:** Skills IA reactivas (Maia). Bot Agente IA con memoria del negocio. Créditos de tokens prepagos. El plan más caro — mayor consumo de Claude API.

### Escalera de precios — varía por rubro

El precio base de cada plan depende de la complejidad de módulos del rubro. Se define rubro por rubro. Ver sección 14.

### Reglas de WhatsApp

- Free: **sin WhatsApp**. CRM solo por web y email.
- Pro en adelante: WhatsApp activo. Costo fijo $1.30 USD/mes por número conectado (Evolution API). Este costo está absorbido en el precio del plan.

### Bots WhatsApp — dos niveles

| Nivel | Plan | Descripción |
|---|---|---|
| Bot FAQ | Pro | El tenant completa una planilla simple. El bot responde preguntas frecuentes con esa info. Bajo consumo de tokens. |
| Bot Agente IA | Plan IA | Conoce el negocio en profundidad. El tenant carga PDFs, docs, catálogos. Hace recomendaciones complejas. Alto consumo de tokens. Incluye dashboard de consumo y sistema de créditos prepagos. |

### Créditos de tokens (Bot Agente IA)

El Plan IA incluye un cupo mensual de tokens. Al agotarse, el tenant recarga créditos prepagos (modelo como crédito de celular). Margen sobre costo Claude API: ~60–70%.

---

## 9. Módulos universales — presentes en todos los rubros

Estos módulos están disponibles en todos los rubros. El plan determina sus límites y funcionalidades.

| Módulo | Nombre interno | Free | Pro | Business | Plan IA |
|---|---|---|---|---|---|
| CRM (web + email) | `Clientes` | ✅ básico | ✅ completo | ✅ | ✅ |
| CRM WhatsApp | `WhatsApp Center` | ❌ | ✅ | ✅ | ✅ |
| Funnel visual | `CRM Pro` | ❌ | ✅ | ✅ | ✅ |
| Cobro online MercadoPago | `Cobros` | ✅ | ✅ | ✅ | ✅ |
| Facturación PDF genérica | `Facturación` | ✅ | ✅ | ✅ | ✅ |
| Facturación electrónica ARCA (AR) | `Facturación ARCA` | ❌ | ✅ | ✅ | ✅ |
| Social Studio | `Social Studio` | ✅ (4 posts/mes) | ✅ ilimitado | ✅ + métricas | ✅ + IA |
| Bot FAQ WhatsApp | `WhatsApp Center` | ❌ | ✅ | ✅ | ✅ |
| Bot Agente IA | `Agente IA` | ❌ | ❌ | ❌ | ✅ |
| Skills IA reactivas (Maia) | `Maia Skills` | ❌ | ❌ | ❌ | ✅ |
| Reportes del negocio | `Finanzas` | ❌ | ✅ básico | ✅ completo | ✅ |
| Multi-sucursal | `Multi-sede` | ❌ | ❌ | ✅ | ✅ |

---

## 10. Social Studio — módulo universal

Compositor de piezas gráficas + calendario editorial + publicación automática vía API Meta.

### Flujo del tenant
1. Elige plantilla (predefinida por rubro o propia subida)
2. Sube su foto
3. Agrega texto sobre la pieza
4. (Plan IA) IA sugiere descripción del post y hashtags
5. Programa en el calendario editorial
6. API Meta publica automáticamente en Instagram / Facebook

### Formatos soportados (MVP)
- Instagram feed (cuadrado y vertical)
- Instagram Stories
- Facebook post

### Límites por plan

| Plan | Posts/mes | Plantillas propias | Stories | IA descripción | Métricas |
|---|---|---|---|---|---|
| Free | 4 (1/semana) | ❌ | ❌ | ❌ | ❌ |
| Pro | Ilimitados | ✅ 500MB | ✅ | ❌ | ❌ |
| Business | Ilimitados | ✅ 2GB | ✅ | ❌ | ✅ |
| Plan IA | Ilimitados | ✅ 5GB | ✅ | ✅ | ✅ |

### Stack técnico

| Componente | Tecnología | Costo |
|---|---|---|
| Compositor gráfico | Canvas API (browser-side) | $0 — no usa servidor |
| Publicación | Meta Graph API | Gratis hasta límites altos |
| IA descripción | Claude API (`claude-sonnet-4-6`) | ~$0.002 por sugerencia |
| Storage plantillas | S3-compatible | ~$0.023/GB/mes |

### ⚠ Requisito crítico
La publicación en nombre de terceros requiere **aprobación de Meta** como plataforma de publishing. El proceso tarda 2–4 semanas. Debe planificarse en el roadmap con anticipación.

---

## 11. Inteligencia artificial — Maia

Maia es la IA transversal del sistema — presente en admin y en el portal de cada tenant.

- Modelo principal: `claude-sonnet-4-6` (Claude API)
- Fallback: OpenAI GPT-4o
- Orquestación: n8n

### Skills IA por nivel

| Nivel | Plan | Descripción |
|---|---|---|
| Sin IA | Free | Sin sugerencias activas |
| Nivel 2 | Pro | Sugerencias basadas en histórico del negocio |
| Nivel 3 | Plan IA | Sugerencias reactivas en tiempo real + Agente IA completo |

---

## 12. Design system

### Panel admin y portal tenant

| Token | Valor | Uso |
|---|---|---|
| Background | `#F0F4F0` | Fondo general |
| Primario | `#1A7A4A` | Verde principal |
| Activo bg | `#E8F5EE` | Estado activo |
| Panel IA | `#1C3D2E` | Sidebar IA Maia |
| Cards / Topbar | `#FFFFFF` | Superficies elevadas |
| Gold / Accent | `#B08A55` | Acento dorado |
| Tipografía principal | DM Sans / Inter | Pesos 400 y 600 |
| Tipografía display | Fraunces (serif) | Títulos, marca |
| Tipografía mono | DM Mono | Código, badges, rutas |
| Border radius cards | 11px | Cards, modales |
| Border radius inputs | 7px | Inputs, botones |
| Modo | Light always | Sin dark mode |

### Sitio institucional (gestion360ia.com.ar)

| Token | Valor |
|---|---|
| Slate / Pizarra | `#506886` |
| Gold | `#B08A55` |
| Emerald | `#3A9E70` |

---

## 13. Estado actual (marzo 2026)

**✅ Existe y funciona:**
- Panel admin en producción — admin.gestion360ia.com.ar
- Auth Google + flujo de aprobación de usuarios
- CRM, leads, funnel, conversaciones WhatsApp, soporte, integraciones, equipo, auditoría
- MySQL con schema completo — 22 tablas en DB core g360ia
- Sistema de DB por tenant con provisioner y migrations funcionando
- Evolution API integrada — WhatsApp activo con instancias por tenant
- Redis activo
- Repo g360ia-portal creado en Easypanel — listo para construir

**🔴 Próximas acciones prioritarias:**
1. Construir g360ia-portal: Next.js + NextAuth independiente + PWA + onboarding + dashboard base del tenant
2. Eliminar servicio g360ia-db de Easypanel (MariaDB vacía)
3. Definir y limpiar el servicio g360ia (WordPress) en Easypanel
4. Mover app/portal/ del repo admin al repo portal y limpiar lib/auth-portal.js
5. Iniciar proceso de aprobación de Meta app para Social Studio
6. Reactivar backend Node.js migrando de PostgreSQL a MySQL (fase futura)

---

## 14. Planes por rubro

### Rubro: Servicio Técnico
> Aplica a: reparación de celulares/tablets, computadoras, electrodomésticos, aire acondicionado.
> Modelos de atención: mostrador y domicilio. Todos los tamaños (unipersonal a multi-sucursal).

#### Precios

| Plan | Precio | Descripción |
|---|---|---|
| Free | $0/mes | Operación básica del taller sin costo de infra |
| Pro | $39/mes | Taller completo con WhatsApp y seguimiento de OTs |
| Business | $79/mes | Escala: multi-sucursal, proveedores, finanzas |
| Plan IA | $149/mes | Automatización total con IA reactiva y GPS |

#### Módulos por plan

**Free — $0/mes**

| Módulo | Features |
|---|---|
| OT Manager | OTs ilimitadas con QR · 7 estados de seguimiento · Presupuestos y remitos PDF |
| Clientes | Ficha de cliente · Historial de equipos por cliente |
| Stock Básico | Inventario de repuestos |
| Cobros y Facturación | Cobro online MercadoPago · Factura PDF genérica |
| Social Studio | 4 posts/mes · Plantillas predefinidas · Instagram feed + Facebook |
| Límites | 1 usuario |

**Pro — $39/mes**

| Módulo | Features |
|---|---|
| WhatsApp Center | 1 número activo · Notificaciones automáticas de estado · Bot FAQ (planilla simple) |
| Track & Follow | Widget de seguimiento embebido en el sitio del cliente (1 línea de código) · Consulta por número de OT vía WhatsApp |
| Equipo Técnico | Asignación manual de técnicos a OTs · Hasta 5 usuarios/técnicos |
| CRM Pro | Funnel visual de clientes · Conversaciones multi-canal |
| Facturación ARCA | Factura electrónica Argentina · CAE automático vía AfipSDK |
| Social Studio | Posts ilimitados · Instagram Stories · Calendario editorial · Plantillas propias (500MB) · Programación automática API Meta |
| + todo lo de Free | — |

**Business — $79/mes**

| Módulo | Features |
|---|---|
| Multi-sede | Varias sucursales en un solo panel · Usuarios ilimitados |
| Proveedores | Gestión de proveedores · Catálogo de repuestos por proveedor · Órdenes de compra |
| Finanzas | Reportes financieros · Caja y márgenes por OT |
| Social Studio | Métricas de alcance e interacción · Storage plantillas 2GB · Redes por sucursal |
| + todo lo de Pro | — |

**Plan IA — $149/mes**

| Módulo | Features |
|---|---|
| Agente IA | Bot WhatsApp que conoce el negocio · Carga de PDFs, docs, catálogos · Responde consultas complejas · Dashboard de consumo de tokens · Créditos prepagos adicionales |
| Predictor de Stock | Predice repuestos necesarios por tipo de OT antes de tocar el equipo · Alerta de bajo stock · Sugiere proveedor automáticamente |
| Maia Skills | Asignación automática de OTs por disponibilidad y especialidad · Sugerencias reactivas en tiempo real |
| GPS Domicilio | Tracking en tiempo real del técnico · Aviso automático "técnico en camino" por WhatsApp al cliente |
| Social Studio | IA sugiere descripción del post · Hashtags por rubro · Mejor horario para publicar · Calendario sugerido por Maia · Storage 5GB |
| + todo lo de Business | — |

#### Costos de infraestructura (Servicio Técnico)

| Concepto | Costo/tenant/mes | Notas |
|---|---|---|
| Evolution API (WhatsApp) | $1.30 | Fijo por número. Solo desde plan Pro. |
| Claude API (Skills IA Nivel 2) | ~$0.45 | ~500 tokens/día promedio. Plan Pro. |
| Claude API (Agente IA) | Variable | Depende del uso. Cubierto por créditos prepagos. |
| MySQL DB tenant | ~$0.05 | ~50MB promedio |
| Redis / notificaciones | ~$0.10 | |
| AfipSDK (ARCA) | ~$0.25 | Plan Growth $80/mes ÷ 100 CUITs a escala |
| Google Maps (GPS) | $3–8 | Solo Plan IA. Depende del volumen de rutas. |
| Storage Social Studio | ~$0.01–0.12 | Según plan (500MB a 5GB) |
| **Total infra Pro** | **~$1.90/mes** | **Margen bruto ~95%** |
| **Total infra Plan IA** | **~$10–15/mes** | **Margen bruto ~90–93%** |

---

## 15. Principios de trabajo — NO negociables

1. Avanzamos paso a paso — un componente o módulo a la vez
2. Cada entrega debe ser funcional y desplegable
3. Velocidad de iteración sobre perfección inicial
4. Ante cada decisión técnica importante: opciones con pros y contras antes de implementar
5. Código limpio, comentado y escalable desde el día 1
6. Las API keys y credenciales SIEMPRE en variables de entorno del VPS — nunca en el repo
7. Auth independiente por app — nunca compartir NEXTAUTH_SECRET entre admin y portal
8. DB separada por tenant desde el día 1 — no hay marcha atrás en esto
9. El tenant siempre viene del token — nunca del body o query string
10. Despliegues manuales vía GitHub — Easypanel detecta el push y despliega
11. Cuando algo no esté claro, se documenta antes de implementar

---

## 16. Hoja de ruta

| Fase | Período | Objetivo |
|---|---|---|
| Fase 1 | Mes 1–3 | MVP portal tenant: onboarding + 2 rubros (prof + medical) + WhatsApp IA + agenda + PWA |
| Fase 2 | Mes 4–6 | 4 rubros más + mapas + facturación + estadísticas IA + MercadoPago |
| Fase 3 | Mes 7–12 | Todos los rubros + asistente IA por tenant + white label + API pública + GovTech |
| Fase 4 | Mes 12–24 | App nativa React Native + marketplace de módulos + expansión regional |

---

## 17. Rubros pendientes de definir

Los siguientes rubros tienen módulos y precios aún sin definir. Se irán completando en la sección 14.

- [ ] Profesionales (contadores, abogados)
- [ ] Salud (médicos, psicólogos, kinesiólogos)
- [ ] Restaurantes / gastronomía
- [ ] Inmobiliarias
- [ ] Salones de eventos
- [ ] Hotel / hotelería
- [ ] GovTech (municipios)