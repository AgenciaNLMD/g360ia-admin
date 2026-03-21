// lib/tenant-provisioner.js
// Crea la base de datos y tablas para un nuevo tenant según su rubro

import mysql from "mysql2/promise";

// ── Conexión sin base de datos específica (para poder crear DBs) ──
async function getRootConnection() {
  return mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // Sin database — necesitamos acceso root para crear DBs
  });
}

// ── Genera el nombre de la DB a partir del id y nombre del tenant ──
export function generarDbName(id, nombre) {
  const idPadded = String(id).padStart(3, "0");
  const slug = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca tildes
    .replace(/[^a-z0-9]/g, "")       // solo letras y números
    .slice(0, 20);                    // máx 20 chars
  return `t${idPadded}_${slug}`;     // ej: t007_reparatech
}

// ── Tablas universales (todos los rubros las tienen) ──
const TABLAS_UNIVERSALES = `
  -- Clientes del negocio
  CREATE TABLE IF NOT EXISTS clientes (
    id             INT NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(200) NOT NULL,
    email          VARCHAR(200) NULL,
    telefono       VARCHAR(50) NULL,
    whatsapp       VARCHAR(50) NULL,
    direccion      VARCHAR(300) NULL,
    notas          TEXT NULL,
    score_ia       TINYINT NOT NULL DEFAULT 0,
    activo         TINYINT(1) NOT NULL DEFAULT 1,
    creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_cli_email (email),
    INDEX idx_cli_telefono (telefono)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- Conversaciones WhatsApp
  CREATE TABLE IF NOT EXISTS conversaciones (
    id             INT NOT NULL AUTO_INCREMENT,
    cliente_id     INT NULL,
    canal          ENUM('whatsapp','email','web') NOT NULL DEFAULT 'whatsapp',
    estado         ENUM('abierta','cerrada','pendiente') NOT NULL DEFAULT 'abierta',
    ultimo_mensaje TEXT NULL,
    ultimo_msg_at  TIMESTAMP NULL,
    creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_conv_cliente (cliente_id),
    INDEX idx_conv_estado (estado)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- Mensajes de cada conversación
  CREATE TABLE IF NOT EXISTS mensajes (
    id               INT NOT NULL AUTO_INCREMENT,
    conversacion_id  INT NOT NULL,
    direccion        ENUM('entrante','saliente') NOT NULL,
    contenido        TEXT NOT NULL,
    sugerido_por_ia  TINYINT(1) NOT NULL DEFAULT 0,
    leido            TINYINT(1) NOT NULL DEFAULT 0,
    creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_msg_conv (conversacion_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- Facturación y presupuestos
  CREATE TABLE IF NOT EXISTS documentos (
    id             INT NOT NULL AUTO_INCREMENT,
    tipo           ENUM('presupuesto','factura','recibo') NOT NULL DEFAULT 'presupuesto',
    cliente_id     INT NULL,
    numero         VARCHAR(50) NULL,
    estado         ENUM('borrador','enviado','aprobado','rechazado','pagado') NOT NULL DEFAULT 'borrador',
    subtotal       DECIMAL(12,2) NOT NULL DEFAULT 0,
    descuento      DECIMAL(12,2) NOT NULL DEFAULT 0,
    total          DECIMAL(12,2) NOT NULL DEFAULT 0,
    items          JSON NULL,
    notas          TEXT NULL,
    vencimiento    DATE NULL,
    creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_doc_cliente (cliente_id),
    INDEX idx_doc_tipo (tipo),
    INDEX idx_doc_estado (estado)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- Notificaciones y recordatorios
  CREATE TABLE IF NOT EXISTS notificaciones (
    id          INT NOT NULL AUTO_INCREMENT,
    cliente_id  INT NULL,
    tipo        VARCHAR(50) NOT NULL,
    titulo      VARCHAR(300) NOT NULL,
    mensaje     TEXT NULL,
    canal       ENUM('whatsapp','email','sms','push') NOT NULL DEFAULT 'whatsapp',
    estado      ENUM('pendiente','enviada','fallida') NOT NULL DEFAULT 'pendiente',
    enviada_en  TIMESTAMP NULL,
    creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_noti_cliente (cliente_id),
    INDEX idx_noti_estado (estado)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- Sugerencias IA para el tenant
  CREATE TABLE IF NOT EXISTS ia_sugerencias (
    id          INT NOT NULL AUTO_INCREMENT,
    tipo        VARCHAR(100) NOT NULL,
    titulo      VARCHAR(300) NOT NULL,
    contenido   TEXT NOT NULL,
    accion      VARCHAR(100) NULL,
    estado      ENUM('pendiente','vista','aceptada','rechazada') NOT NULL DEFAULT 'pendiente',
    nivel       TINYINT NOT NULL DEFAULT 1,
    creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ia_estado (estado),
    INDEX idx_ia_nivel (nivel)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- Configuración del tenant
  CREATE TABLE IF NOT EXISTS configuracion (
    clave          VARCHAR(100) NOT NULL,
    valor          TEXT NULL,
    tipo           ENUM('string','number','boolean','json') NOT NULL DEFAULT 'string',
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (clave)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- Módulos activos del tenant
  CREATE TABLE IF NOT EXISTS modulos_activos (
    modulo         VARCHAR(100) NOT NULL,
    habilitado     TINYINT(1) NOT NULL DEFAULT 1,
    config         JSON NULL,
    activado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (modulo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// ── Tablas por rubro ──────────────────────────────────────────────────────

const TABLAS_POR_RUBRO = {

  // ── SERVICIO TÉCNICO ──────────────────────────────────────────
  serv_tecnico: `
    CREATE TABLE IF NOT EXISTS tecnicos (
      id              INT NOT NULL AUTO_INCREMENT,
      nombre          VARCHAR(200) NOT NULL,
      email           VARCHAR(200) NULL,
      telefono        VARCHAR(50) NULL,
      especialidades  JSON NULL,
      activo          TINYINT(1) NOT NULL DEFAULT 1,
      creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS ots (
      id                  INT NOT NULL AUTO_INCREMENT,
      codigo              VARCHAR(20) NOT NULL,
      cliente_id          INT NULL,
      tecnico_id          INT NULL,
      dispositivo         VARCHAR(200) NOT NULL,
      marca               VARCHAR(100) NULL,
      modelo              VARCHAR(100) NULL,
      problema_reportado  TEXT NOT NULL,
      diagnostico         TEXT NULL,
      diagnostico_ia      TEXT NULL,
      estado              ENUM('ingreso','diagnostico','presupuesto_enviado','aprobado','en_reparacion','listo','entregado','cancelado') NOT NULL DEFAULT 'ingreso',
      prioridad           ENUM('normal','urgente') NOT NULL DEFAULT 'normal',
      fecha_estimada      DATE NULL,
      foto_ingreso        VARCHAR(500) NULL,
      foto_cierre         VARCHAR(500) NULL,
      firma_ingreso       TEXT NULL,
      firma_retiro        TEXT NULL,
      garantia_dias       INT NOT NULL DEFAULT 90,
      calificacion        TINYINT NULL,
      creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_ot_codigo (codigo),
      INDEX idx_ot_cliente (cliente_id),
      INDEX idx_ot_tecnico (tecnico_id),
      INDEX idx_ot_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS ot_estados_log (
      id          INT NOT NULL AUTO_INCREMENT,
      ot_id       INT NOT NULL,
      estado      VARCHAR(50) NOT NULL,
      nota        TEXT NULL,
      creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_otel_ot (ot_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS proveedores (
      id         INT NOT NULL AUTO_INCREMENT,
      nombre     VARCHAR(200) NOT NULL,
      email      VARCHAR(200) NULL,
      telefono   VARCHAR(50) NULL,
      cuit       VARCHAR(20) NULL,
      scoring    TINYINT NOT NULL DEFAULT 5,
      activo     TINYINT(1) NOT NULL DEFAULT 1,
      creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS repuestos (
      id            INT NOT NULL AUTO_INCREMENT,
      nombre        VARCHAR(200) NOT NULL,
      codigo        VARCHAR(100) NULL,
      proveedor_id  INT NULL,
      precio_costo  DECIMAL(12,2) NOT NULL DEFAULT 0,
      precio_venta  DECIMAL(12,2) NOT NULL DEFAULT 0,
      stock         INT NOT NULL DEFAULT 0,
      stock_minimo  INT NOT NULL DEFAULT 2,
      creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_rep_proveedor (proveedor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS ordenes_compra (
      id            INT NOT NULL AUTO_INCREMENT,
      ot_id         INT NULL,
      proveedor_id  INT NULL,
      estado        ENUM('borrador','enviada','recibida','cancelada') NOT NULL DEFAULT 'borrador',
      total         DECIMAL(12,2) NOT NULL DEFAULT 0,
      items         JSON NULL,
      creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_oc_ot (ot_id),
      INDEX idx_oc_proveedor (proveedor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ── HOTEL / CABAÑAS ────────────────────────────────────────────
  hotel: `
    CREATE TABLE IF NOT EXISTS unidades (
      id          INT NOT NULL AUTO_INCREMENT,
      nombre      VARCHAR(100) NOT NULL,
      tipo        VARCHAR(100) NULL,
      capacidad   INT NOT NULL DEFAULT 2,
      precio_base DECIMAL(12,2) NOT NULL DEFAULT 0,
      estado      ENUM('libre','ocupada','limpieza','mantenimiento') NOT NULL DEFAULT 'libre',
      activa      TINYINT(1) NOT NULL DEFAULT 1,
      creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS reservas (
      id              INT NOT NULL AUTO_INCREMENT,
      cliente_id      INT NULL,
      unidad_id       INT NULL,
      checkin         DATE NOT NULL,
      checkout        DATE NOT NULL,
      estado          ENUM('pendiente','confirmada','checkin','checkout','cancelada') NOT NULL DEFAULT 'pendiente',
      adultos         INT NOT NULL DEFAULT 2,
      menores         INT NOT NULL DEFAULT 0,
      total           DECIMAL(12,2) NOT NULL DEFAULT 0,
      canal           VARCHAR(50) NOT NULL DEFAULT 'directo',
      notas           TEXT NULL,
      creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_res_cliente (cliente_id),
      INDEX idx_res_unidad (unidad_id),
      INDEX idx_res_checkin (checkin),
      INDEX idx_res_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS proveedores (
      id         INT NOT NULL AUTO_INCREMENT,
      nombre     VARCHAR(200) NOT NULL,
      email      VARCHAR(200) NULL,
      telefono   VARCHAR(50) NULL,
      rubro      VARCHAR(100) NULL,
      activo     TINYINT(1) NOT NULL DEFAULT 1,
      creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS reclamos (
      id            INT NOT NULL AUTO_INCREMENT,
      unidad_id     INT NULL,
      tipo          VARCHAR(100) NULL,
      descripcion   TEXT NOT NULL,
      prioridad     ENUM('baja','normal','urgente') NOT NULL DEFAULT 'normal',
      estado        ENUM('abierto','en_proceso','resuelto') NOT NULL DEFAULT 'abierto',
      foto          VARCHAR(500) NULL,
      creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_rec_unidad (unidad_id),
      INDEX idx_rec_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ── SALUD / CONSULTORIO ────────────────────────────────────────
  salud: `
    CREATE TABLE IF NOT EXISTS profesionales (
      id          INT NOT NULL AUTO_INCREMENT,
      nombre      VARCHAR(200) NOT NULL,
      especialidad VARCHAR(100) NULL,
      email       VARCHAR(200) NULL,
      telefono    VARCHAR(50) NULL,
      activo      TINYINT(1) NOT NULL DEFAULT 1,
      creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS turnos (
      id               INT NOT NULL AUTO_INCREMENT,
      cliente_id       INT NULL,
      profesional_id   INT NULL,
      fecha            DATE NOT NULL,
      hora             TIME NOT NULL,
      duracion_min     INT NOT NULL DEFAULT 30,
      estado           ENUM('pendiente','confirmado','presente','ausente','cancelado') NOT NULL DEFAULT 'pendiente',
      motivo           VARCHAR(300) NULL,
      notas            TEXT NULL,
      recordatorio_enviado TINYINT(1) NOT NULL DEFAULT 0,
      creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_tur_cliente (cliente_id),
      INDEX idx_tur_profesional (profesional_id),
      INDEX idx_tur_fecha (fecha),
      INDEX idx_tur_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS historia_clinica (
      id               INT NOT NULL AUTO_INCREMENT,
      cliente_id       INT NOT NULL,
      profesional_id   INT NULL,
      turno_id         INT NULL,
      fecha            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      evolucion        TEXT NULL,
      diagnostico      VARCHAR(300) NULL,
      tratamiento      TEXT NULL,
      adjuntos         JSON NULL,
      creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_hc_cliente (cliente_id),
      INDEX idx_hc_profesional (profesional_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ── SALÓN DE EVENTOS ───────────────────────────────────────────
  salon_eventos: `
    CREATE TABLE IF NOT EXISTS espacios (
      id          INT NOT NULL AUTO_INCREMENT,
      nombre      VARCHAR(100) NOT NULL,
      capacidad   INT NOT NULL DEFAULT 100,
      descripcion TEXT NULL,
      activo      TINYINT(1) NOT NULL DEFAULT 1,
      creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS eventos (
      id              INT NOT NULL AUTO_INCREMENT,
      cliente_id      INT NULL,
      espacio_id      INT NULL,
      tipo            VARCHAR(100) NULL,
      fecha           DATE NOT NULL,
      hora_inicio     TIME NULL,
      hora_fin        TIME NULL,
      invitados_est   INT NOT NULL DEFAULT 100,
      estado          ENUM('consulta','presupuestado','confirmado','realizado','cancelado') NOT NULL DEFAULT 'consulta',
      total           DECIMAL(12,2) NOT NULL DEFAULT 0,
      notas           TEXT NULL,
      creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_eve_cliente (cliente_id),
      INDEX idx_eve_espacio (espacio_id),
      INDEX idx_eve_fecha (fecha),
      INDEX idx_eve_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS proveedores (
      id        INT NOT NULL AUTO_INCREMENT,
      nombre    VARCHAR(200) NOT NULL,
      rubro     VARCHAR(100) NULL,
      email     VARCHAR(200) NULL,
      telefono  VARCHAR(50) NULL,
      scoring   TINYINT NOT NULL DEFAULT 5,
      activo    TINYINT(1) NOT NULL DEFAULT 1,
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ── INMOBILIARIA ───────────────────────────────────────────────
  inmobiliaria: `
    CREATE TABLE IF NOT EXISTS propiedades (
      id              INT NOT NULL AUTO_INCREMENT,
      titulo          VARCHAR(300) NOT NULL,
      tipo            ENUM('casa','departamento','local','oficina','terreno','otro') NOT NULL DEFAULT 'otro',
      operacion       ENUM('venta','alquiler','alquiler_temporal') NOT NULL DEFAULT 'venta',
      precio          DECIMAL(14,2) NOT NULL DEFAULT 0,
      moneda          ENUM('ARS','USD') NOT NULL DEFAULT 'USD',
      direccion       VARCHAR(300) NULL,
      ciudad          VARCHAR(100) NULL,
      barrio          VARCHAR(100) NULL,
      lat             DECIMAL(10,7) NULL,
      lng             DECIMAL(10,7) NULL,
      superficie_total DECIMAL(10,2) NULL,
      superficie_cubierta DECIMAL(10,2) NULL,
      ambientes       INT NULL,
      dormitorios     INT NULL,
      banios          INT NULL,
      descripcion     TEXT NULL,
      fotos           JSON NULL,
      estado          ENUM('disponible','reservada','vendida','alquilada','baja') NOT NULL DEFAULT 'disponible',
      creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_prop_tipo (tipo),
      INDEX idx_prop_operacion (operacion),
      INDEX idx_prop_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS visitas (
      id            INT NOT NULL AUTO_INCREMENT,
      propiedad_id  INT NULL,
      cliente_id    INT NULL,
      fecha         DATETIME NOT NULL,
      estado        ENUM('pendiente','confirmada','realizada','cancelada') NOT NULL DEFAULT 'pendiente',
      notas         TEXT NULL,
      creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_vis_propiedad (propiedad_id),
      INDEX idx_vis_cliente (cliente_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS pipeline (
      id            INT NOT NULL AUTO_INCREMENT,
      cliente_id    INT NULL,
      propiedad_id  INT NULL,
      etapa         ENUM('consulta','visita','oferta','negociacion','cierre','perdido') NOT NULL DEFAULT 'consulta',
      notas         TEXT NULL,
      creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_pip_cliente (cliente_id),
      INDEX idx_pip_propiedad (propiedad_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ── RESTAURANTE ────────────────────────────────────────────────
  restaurante: `
    CREATE TABLE IF NOT EXISTS menu_categorias (
      id        INT NOT NULL AUTO_INCREMENT,
      nombre    VARCHAR(100) NOT NULL,
      orden     INT NOT NULL DEFAULT 0,
      activa    TINYINT(1) NOT NULL DEFAULT 1,
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS menu_items (
      id           INT NOT NULL AUTO_INCREMENT,
      categoria_id INT NULL,
      nombre       VARCHAR(200) NOT NULL,
      descripcion  TEXT NULL,
      precio       DECIMAL(10,2) NOT NULL DEFAULT 0,
      foto         VARCHAR(500) NULL,
      disponible   TINYINT(1) NOT NULL DEFAULT 1,
      creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_mi_categoria (categoria_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS mesas (
      id        INT NOT NULL AUTO_INCREMENT,
      numero    INT NOT NULL,
      capacidad INT NOT NULL DEFAULT 4,
      sector    VARCHAR(100) NULL,
      estado    ENUM('libre','ocupada','reservada') NOT NULL DEFAULT 'libre',
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS pedidos (
      id         INT NOT NULL AUTO_INCREMENT,
      mesa_id    INT NULL,
      cliente_id INT NULL,
      tipo       ENUM('mesa','delivery','takeaway') NOT NULL DEFAULT 'mesa',
      estado     ENUM('nuevo','en_cocina','listo','entregado','cancelado') NOT NULL DEFAULT 'nuevo',
      items      JSON NULL,
      total      DECIMAL(12,2) NOT NULL DEFAULT 0,
      creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_ped_mesa (mesa_id),
      INDEX idx_ped_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS reservas_mesa (
      id         INT NOT NULL AUTO_INCREMENT,
      cliente_id INT NULL,
      mesa_id    INT NULL,
      fecha      DATE NOT NULL,
      hora       TIME NOT NULL,
      personas   INT NOT NULL DEFAULT 2,
      estado     ENUM('pendiente','confirmada','presente','cancelada') NOT NULL DEFAULT 'pendiente',
      notas      TEXT NULL,
      creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_rm_fecha (fecha),
      INDEX idx_rm_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ── CONTADOR / ABOGADO ────────────────────────────────────────
  profesional: `
    CREATE TABLE IF NOT EXISTS expedientes (
      id            INT NOT NULL AUTO_INCREMENT,
      cliente_id    INT NULL,
      titulo        VARCHAR(300) NOT NULL,
      tipo          VARCHAR(100) NULL,
      numero        VARCHAR(100) NULL,
      estado        ENUM('activo','suspendido','cerrado','archivado') NOT NULL DEFAULT 'activo',
      descripcion   TEXT NULL,
      fecha_inicio  DATE NULL,
      fecha_cierre  DATE NULL,
      creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_exp_cliente (cliente_id),
      INDEX idx_exp_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS vencimientos (
      id              INT NOT NULL AUTO_INCREMENT,
      cliente_id      INT NULL,
      expediente_id   INT NULL,
      titulo          VARCHAR(300) NOT NULL,
      fecha           DATE NOT NULL,
      tipo            VARCHAR(100) NULL,
      recordatorio_enviado TINYINT(1) NOT NULL DEFAULT 0,
      completado      TINYINT(1) NOT NULL DEFAULT 0,
      creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_ven_cliente (cliente_id),
      INDEX idx_ven_fecha (fecha)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ── GESTOR DE SEGUROS ──────────────────────────────────────────
  seguros: `
    CREATE TABLE IF NOT EXISTS polizas (
      id              INT NOT NULL AUTO_INCREMENT,
      cliente_id      INT NULL,
      numero          VARCHAR(100) NOT NULL,
      ramo            ENUM('auto','hogar','vida','art','accidentes','otro') NOT NULL DEFAULT 'otro',
      compania        VARCHAR(200) NULL,
      prima           DECIMAL(12,2) NOT NULL DEFAULT 0,
      fecha_inicio    DATE NOT NULL,
      fecha_vencimiento DATE NOT NULL,
      estado          ENUM('activa','vencida','cancelada','suspendida') NOT NULL DEFAULT 'activa',
      descripcion     TEXT NULL,
      creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_pol_cliente (cliente_id),
      INDEX idx_pol_vencimiento (fecha_vencimiento),
      INDEX idx_pol_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS siniestros (
      id           INT NOT NULL AUTO_INCREMENT,
      poliza_id    INT NULL,
      cliente_id   INT NULL,
      fecha        DATE NOT NULL,
      tipo         VARCHAR(200) NULL,
      descripcion  TEXT NULL,
      estado       ENUM('abierto','en_proceso','resuelto','rechazado') NOT NULL DEFAULT 'abierto',
      creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_sin_poliza (poliza_id),
      INDEX idx_sin_cliente (cliente_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ── DISTRIBUIDORA / LOGÍSTICA ─────────────────────────────────
  distribuidora: `
    CREATE TABLE IF NOT EXISTS repartidores (
      id        INT NOT NULL AUTO_INCREMENT,
      nombre    VARCHAR(200) NOT NULL,
      telefono  VARCHAR(50) NULL,
      vehiculo  VARCHAR(100) NULL,
      activo    TINYINT(1) NOT NULL DEFAULT 1,
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS productos (
      id       INT NOT NULL AUTO_INCREMENT,
      codigo   VARCHAR(100) NULL,
      nombre   VARCHAR(200) NOT NULL,
      unidad   VARCHAR(50) NOT NULL DEFAULT 'unidad',
      precio   DECIMAL(12,2) NOT NULL DEFAULT 0,
      stock    DECIMAL(12,2) NOT NULL DEFAULT 0,
      stock_minimo DECIMAL(12,2) NOT NULL DEFAULT 0,
      activo   TINYINT(1) NOT NULL DEFAULT 1,
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_prod_codigo (codigo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS pedidos (
      id              INT NOT NULL AUTO_INCREMENT,
      cliente_id      INT NULL,
      repartidor_id   INT NULL,
      estado          ENUM('nuevo','en_ruta','entregado','devuelto','cancelado') NOT NULL DEFAULT 'nuevo',
      items           JSON NULL,
      total           DECIMAL(12,2) NOT NULL DEFAULT 0,
      direccion_entrega VARCHAR(300) NULL,
      lat             DECIMAL(10,7) NULL,
      lng             DECIMAL(10,7) NULL,
      fecha_entrega   DATE NULL,
      creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_ped_cliente (cliente_id),
      INDEX idx_ped_repartidor (repartidor_id),
      INDEX idx_ped_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ── GOVTECH ────────────────────────────────────────────────────
  govtech: `
    CREATE TABLE IF NOT EXISTS reclamos_ciudadanos (
      id              INT NOT NULL AUTO_INCREMENT,
      ciudadano_nombre VARCHAR(200) NULL,
      ciudadano_email  VARCHAR(200) NULL,
      ciudadano_tel    VARCHAR(50) NULL,
      categoria       VARCHAR(100) NULL,
      descripcion     TEXT NOT NULL,
      direccion       VARCHAR(300) NULL,
      lat             DECIMAL(10,7) NULL,
      lng             DECIMAL(10,7) NULL,
      estado          ENUM('nuevo','en_proceso','resuelto','cerrado') NOT NULL DEFAULT 'nuevo',
      area_asignada   VARCHAR(100) NULL,
      prioridad       ENUM('baja','normal','alta','urgente') NOT NULL DEFAULT 'normal',
      creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_rc_estado (estado),
      INDEX idx_rc_categoria (categoria)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS turnos_ciudadanos (
      id              INT NOT NULL AUTO_INCREMENT,
      ciudadano_nombre VARCHAR(200) NULL,
      ciudadano_email  VARCHAR(200) NULL,
      ciudadano_tel    VARCHAR(50) NULL,
      dependencia     VARCHAR(200) NOT NULL,
      tramite         VARCHAR(200) NULL,
      fecha           DATE NOT NULL,
      hora            TIME NOT NULL,
      estado          ENUM('pendiente','confirmado','presente','ausente','cancelado') NOT NULL DEFAULT 'pendiente',
      creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_tc_fecha (fecha),
      INDEX idx_tc_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
};

// ── Función principal de provisionamiento ────────────────────────────────

export async function provisionarTenant(tenantId, nombre, rubro) {
  const dbName  = generarDbName(tenantId, nombre);
  const conn    = await getRootConnection();

  try {
    // 1. Crear la base de datos
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${dbName}\``);

    // 2. Crear tablas universales
    const tablasSql = TABLAS_UNIVERSALES.split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const sql of tablasSql) {
      await conn.query(sql);
    }

    // 3. Crear tablas del rubro
    // Normalize el rubro para matchear las keys del objeto
    const rubroKey = normalizarRubro(rubro);
    const tablasRubro = TABLAS_POR_RUBRO[rubroKey];

    if (tablasRubro) {
      const tablasRubroSql = tablasRubro.split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const sql of tablasRubroSql) {
        await conn.query(sql);
      }
    }

    // 4. Insertar módulos activos según el rubro
    const modulos = getModulosPorRubro(rubroKey);
    for (const modulo of modulos) {
      await conn.query(
        `INSERT IGNORE INTO modulos_activos (modulo, habilitado) VALUES (?, 1)`,
        [modulo]
      );
    }

    return { ok: true, dbName };

  } finally {
    await conn.end();
  }
}

// ── Normaliza el nombre del rubro a la key del objeto ────────────────────
function normalizarRubro(rubro) {
  const r = rubro.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  const mapa = {
    "servicio_tecnico":           "serv_tecnico",
    "serv_tecnico":               "serv_tecnico",
    "reparaciones":               "serv_tecnico",
    "hotel":                      "hotel",
    "hotel_cabanas":              "hotel",
    "hotel_/_cabanas":            "hotel",
    "cabanas":                    "hotel",
    "alojamiento":                "hotel",
    "salud":                      "salud",
    "consultorio":                "salud",
    "clinica":                    "salud",
    "spa":                        "salud",
    "consultorio_/_clinica_/_spa":"salud",
    "salon_eventos":              "salon_eventos",
    "salon_de_eventos":           "salon_eventos",
    "eventos":                    "salon_eventos",
    "inmobiliaria":               "inmobiliaria",
    "restaurante":                "restaurante",
    "gastronomia":                "restaurante",
    "restaurante_/_gastronomia":  "restaurante",
    "profesional":                "profesional",
    "contador":                   "profesional",
    "abogado":                    "profesional",
    "seguros":                    "seguros",
    "gestor_de_seguros":          "seguros",
    "distribuidora":              "distribuidora",
    "logistica":                  "distribuidora",
    "distribuidora_/_logistica":  "distribuidora",
    "govtech":                    "govtech",
    "municipio":                  "govtech",
  };

  return mapa[r] || r;
}

// ── Módulos que se activan por defecto según el rubro ────────────────────
function getModulosPorRubro(rubroKey) {
  const universales = [
    "dashboard", "clientes", "whatsapp", "facturacion",
    "notificaciones", "estadisticas", "ia_sugerencias"
  ];

  const porRubro = {
    serv_tecnico:  ["ots", "tecnicos", "tracking_publico", "repuestos", "proveedores", "ordenes_compra"],
    hotel:         ["reservas", "unidades", "checkin_checkout", "whatsapp_concierge", "reclamos"],
    salud:         ["turnos", "historia_clinica", "profesionales", "recordatorios"],
    salon_eventos: ["eventos", "espacios", "proveedores", "presupuestos_ia"],
    inmobiliaria:  ["propiedades", "visitas", "pipeline", "documentos_ia"],
    restaurante:   ["menu_digital", "pedidos", "mesas", "reservas_mesa"],
    profesional:   ["expedientes", "vencimientos", "documentos_ia"],
    seguros:       ["polizas", "siniestros", "renovaciones", "cross_selling_ia"],
    distribuidora: ["pedidos", "repartidores", "productos", "rutas_ia"],
    govtech:       ["reclamos_ciudadanos", "turnos_ciudadanos", "mapa_incidencias"],
  };

  return [...universales, ...(porRubro[rubroKey] || [])];
}
