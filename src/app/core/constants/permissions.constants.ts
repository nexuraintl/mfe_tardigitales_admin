/**
 * Catálogo canónico de los 47 permisos granulares del módulo TarjetasDigitales (JCC)
 * y configuración de funciones/reglas para limitación manual futura.
 */

export const PERMISSIONS = {
  // 1. Tarjeta digital para contadores (Gestión)
  CONT_LISTADO: 'contListado',
  CONT_EMISION_MASIVA: 'contEmisionMasiva',
  CONT_NUEVA_TARJETA: 'contNuevaTarjeta',
  CONT_DETALLES: 'contDetalles',
  CONT_VER_TARJETA: 'contVerTarjeta',
  CONT_EXPORTAR_TARJETA: 'contExportarTarjeta',
  CONT_REGENERAR: 'contRegenerar',
  CONT_ACTUALIZAR_DATOS: 'contActualizarDatos',
  CONT_HISTORIAL: 'contHistorial',

  // 2. Tarjeta digital para sociedades (Gestión)
  SOC_LISTADO: 'socListado',
  SOC_EMISION_MASIVA: 'socEmisionMasiva',
  SOC_NUEVA_TARJETA: 'socNuevaTarjeta',
  SOC_DETALLES: 'socDetalles',
  SOC_VER_TARJETA: 'socVerTarjeta',
  SOC_EXPORTAR_TARJETA: 'socExportarTarjeta',
  SOC_REGENERAR: 'socRegenerar',
  SOC_ACTUALIZAR_DATOS: 'socActualizarDatos',
  SOC_HISTORIAL: 'socHistorial',

  // 3. Notificaciones
  NOTIF_NUEVA: 'notifNueva',
  NOTIF_HISTORIAL: 'notifHistorial',

  // 4. Reportes — Dashboard general
  REP_DASHBOARD_GEN: 'repDashboardGen',

  // 5. Reportes — Contadores
  REP_CONT_LISTADO_CSV: 'repContListadoCsv',
  REP_CONT_DETALLES: 'repContDetalles',
  REP_CONT_VER_TARJETA: 'repContVerTarjeta',
  REP_CONT_EXPORTAR: 'repContExportar',
  REP_CONT_REGENERAR: 'repContRegenerar',
  REP_CONT_ACTUALIZAR_DATOS: 'repContActualizar',
  REP_CONT_HISTORIAL: 'repContHistorial',

  // 6. Reportes — Sociedades
  REP_SOC_LISTADO_CSV: 'repSocListadoCsv',
  REP_SOC_DETALLES: 'repSocDetalles',
  REP_SOC_VER_TARJETA: 'repSocVerTarjeta',
  REP_SOC_EXPORTAR: 'repSocExportar',
  REP_SOC_REGENERAR: 'repSocRegenerar',
  REP_SOC_ACTUALIZAR_DATOS: 'repSocActualizar',
  REP_SOC_HISTORIAL: 'repSocHistorial',

  // 7. Reportes — Notificaciones
  REP_NOTIFICACIONES: 'repNotificaciones',

  // 8. Certificados
  CERT_LISTADO: 'certListado',
  CERT_DESCARGAR: 'certDescargar',
  CERT_DETALLE: 'certDetalle',

  // 9. Branding Contadores
  BRAND_CONT_VER: 'brandContVer',
  BRAND_CONT_GUARDAR: 'brandContGuardar',
  BRAND_CONT_PUBLICAR: 'brandContPublicar',

  // 10. Branding Sociedades
  BRAND_SOC_VER: 'brandSocVer',
  BRAND_SOC_GUARDAR: 'brandSocGuardar',
  BRAND_SOC_PUBLICAR: 'brandSocPublicar',

  // 11. Branding Firma Institucional
  BRAND_FIRMA_VER: 'brandFirmaVer',
  BRAND_FIRMA_GUARDAR: 'brandFirmaGuardar',
  BRAND_FIRMA_PUBLICAR: 'brandFirmaPublicar',

  // 12. Validador QR
  VAL_QR_CONTADORES: 'valQrContadores',
  VAL_QR_SOCIEDADES: 'valQrSociedades',

  // 13. Auditoría API
  AUDITORIA_API_REG: 'auditoriaApiReg',

  // 14. Plantilla de activación
  PLANT_ACT_CONTADORES: 'plantActContadores',
  PLANT_ACT_SOCIEDADES: 'plantActSociedades',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | string;

export const ALL_MODULE_PERMISSIONS: PermissionCode[] = Object.values(PERMISSIONS);

/**
 * Acciones granulares compartidas entre las vistas de Gestión y Reportes
 * para Contadores y Sociedades.
 */
export type TarjetaGranularAction =
  | 'listado'
  | 'detalles'
  | 'verTarjeta'
  | 'exportar'
  | 'regenerar'
  | 'actualizarDatos'
  | 'historial'
  | 'nueva'
  | 'emisionMasiva';

export type TarjetaPermissionScope = 'cont' | 'repCont' | 'soc' | 'repSoc';

export const TARJETA_CONTEXT_PERMISSIONS: Record<
  TarjetaPermissionScope,
  Partial<Record<TarjetaGranularAction, PermissionCode>>
> = {
  cont: {
    listado: PERMISSIONS.CONT_LISTADO,
    detalles: PERMISSIONS.CONT_DETALLES,
    verTarjeta: PERMISSIONS.CONT_VER_TARJETA,
    exportar: PERMISSIONS.CONT_EXPORTAR_TARJETA,
    regenerar: PERMISSIONS.CONT_REGENERAR,
    actualizarDatos: PERMISSIONS.CONT_ACTUALIZAR_DATOS,
    historial: PERMISSIONS.CONT_HISTORIAL,
    nueva: PERMISSIONS.CONT_NUEVA_TARJETA,
    emisionMasiva: PERMISSIONS.CONT_EMISION_MASIVA,
  },
  repCont: {
    listado: PERMISSIONS.REP_CONT_LISTADO_CSV,
    detalles: PERMISSIONS.REP_CONT_DETALLES,
    verTarjeta: PERMISSIONS.REP_CONT_VER_TARJETA,
    exportar: PERMISSIONS.REP_CONT_EXPORTAR,
    regenerar: PERMISSIONS.REP_CONT_REGENERAR,
    actualizarDatos: PERMISSIONS.REP_CONT_ACTUALIZAR_DATOS,
    historial: PERMISSIONS.REP_CONT_HISTORIAL,
  },
  soc: {
    listado: PERMISSIONS.SOC_LISTADO,
    detalles: PERMISSIONS.SOC_DETALLES,
    verTarjeta: PERMISSIONS.SOC_VER_TARJETA,
    exportar: PERMISSIONS.SOC_EXPORTAR_TARJETA,
    regenerar: PERMISSIONS.SOC_REGENERAR,
    actualizarDatos: PERMISSIONS.SOC_ACTUALIZAR_DATOS,
    historial: PERMISSIONS.SOC_HISTORIAL,
    nueva: PERMISSIONS.SOC_NUEVA_TARJETA,
    emisionMasiva: PERMISSIONS.SOC_EMISION_MASIVA,
  },
  repSoc: {
    listado: PERMISSIONS.REP_SOC_LISTADO_CSV,
    detalles: PERMISSIONS.REP_SOC_DETALLES,
    verTarjeta: PERMISSIONS.REP_SOC_VER_TARJETA,
    exportar: PERMISSIONS.REP_SOC_EXPORTAR,
    regenerar: PERMISSIONS.REP_SOC_REGENERAR,
    actualizarDatos: PERMISSIONS.REP_SOC_ACTUALIZAR_DATOS,
    historial: PERMISSIONS.REP_SOC_HISTORIAL,
  },
};

/**
 * Mapa ordenado de rutas principales y el permiso requerido para acceder a cada una.
 * Se utiliza tanto en el Guard como para redirigir automáticamente a la primera ruta permitida.
 */
export interface RoutePermissionRule {
  path: string;
  permission: PermissionCode;
}

export const ORDERED_ROUTE_PERMISSIONS: RoutePermissionRule[] = [
  { path: '/tarjetas-contadores', permission: PERMISSIONS.CONT_LISTADO },
  { path: '/tarjetas-sociedades', permission: PERMISSIONS.SOC_LISTADO },
  { path: '/historial', permission: PERMISSIONS.NOTIF_HISTORIAL },
  { path: '/crear-notificacion', permission: PERMISSIONS.NOTIF_NUEVA },
  { path: '/reportes/dashboard', permission: PERMISSIONS.REP_DASHBOARD_GEN },
  { path: '/reportes/contadores', permission: PERMISSIONS.REP_CONT_LISTADO_CSV },
  { path: '/reportes/sociedades', permission: PERMISSIONS.REP_SOC_LISTADO_CSV },
  { path: '/reportes/notificaciones', permission: PERMISSIONS.REP_NOTIFICACIONES },
  { path: '/certificados', permission: PERMISSIONS.CERT_LISTADO },
  { path: '/branding-contadores', permission: PERMISSIONS.BRAND_CONT_VER },
  { path: '/branding-sociedades', permission: PERMISSIONS.BRAND_SOC_VER },
  { path: '/branding-institucional', permission: PERMISSIONS.BRAND_FIRMA_VER },
  { path: '/validador-qr-contadores', permission: PERMISSIONS.VAL_QR_CONTADORES },
  { path: '/validador-qr-sociedades', permission: PERMISSIONS.VAL_QR_SOCIEDADES },
  { path: '/plantilla-activacion/contadores', permission: PERMISSIONS.PLANT_ACT_CONTADORES },
  { path: '/plantilla-activacion/sociedades', permission: PERMISSIONS.PLANT_ACT_SOCIEDADES },
  { path: '/auditoria', permission: PERMISSIONS.AUDITORIA_API_REG },
];

/**
 * ============================================================================
 * CONFIGURACIÓN MANUAL DE LIMITACIONES Y REGLAS PERSONALIZADAS (FUTURO)
 * ============================================================================
 * Permite limitar manualmente permisos o agregar funciones evaluadoras custom
 * en código sin depender exclusivamente del backend.
 */
export interface ManualPermissionConfig {
  /**
   * Lista de permisos que se fuerzan como revocados/bloqueados manualmente en el sistema,
   * aun si el endpoint /apig/core/auth/permissions los devuelve activos.
   */
  manuallyRevokedPermissions: PermissionCode[];

  /**
   * Lista de permisos forzados como concedidos manualmente (útil para pruebas puntuales).
   */
  manuallyGrantedPermissions: PermissionCode[];

  /**
   * Reglas funcionales personalizadas por código de permiso.
   * Si se define una función para un permiso, tanto el permiso base como esta función
   * deben retornar `true` para autorizar la acción.
   */
  customEvaluators: Partial<
    Record<
      PermissionCode,
      (context: { permissions: ReadonlySet<string>; uid: number | null; user: any }) => boolean
    >
  >;
}

export const MANUAL_PERMISSION_CONFIG: ManualPermissionConfig = {
  manuallyRevokedPermissions: [],
  manuallyGrantedPermissions: [],
  customEvaluators: {},
};
