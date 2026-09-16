export interface ErrorMessageDefinition {
  code: string;
  title: string;
  template: string;
  suggestion?: string;
}

export const ERROR_MESSAGES = {
  // Conectividad y Gateway
  MS_3800_NO_CONNECTION: {
    code: 'MS-3800',
    title: 'Error de Conexión',
    template: 'No se pudo conectar con el microservicio {endpoint} ({status})',
    suggestion: 'Verifique su conexión a la red o contacte al administrador del sistema.'
  },
  MS_3801_GATEWAY_TIMEOUT: {
    code: 'MS-3801',
    title: 'Error de Disponibilidad',
    template: 'El microservicio {endpoint} no se encuentra disponible temporalmente ({status})',
    suggestion: 'El servicio está tardando en responder. Intente nuevamente en unos minutos.'
  },
  MS_3802_UNAUTHORIZED: {
    code: 'MS-3802',
    title: 'Error de Autorización',
    template: 'No cuenta con permisos suficientes para acceder a {endpoint} ({status})',
    suggestion: 'Verifique sus credenciales de acceso o consulte con el administrador.'
  },
  MS_3803_INVALID_CLIENT: {
    code: 'MS-3803',
    title: 'Error de Parámetro',
    template: 'Identificador de entidad no especificado o inválido en {endpoint} ({status})',
    suggestion: 'El parámetro de cliente es obligatorio para procesar la solicitud.'
  },
  MS_3804_DATABASE_ERROR: {
    code: 'MS-3804',
    title: 'Error de Repositorio de Datos',
    template: 'No fue posible establecer comunicación con la base de datos ({status})',
    suggestion: 'Fallo temporal en la conexión al repositorio de datos del cliente.'
  },
  MS_3805_CONFIG_ERROR: {
    code: 'MS-3805',
    title: 'Error de Configuración',
    template: 'Configuración de entidad no localizada en el repositorio central ({status})',
    suggestion: 'Verifique que la entidad se encuentre registrada correctamente.'
  },
  MS_3806_NOT_FOUND: {
    code: 'MS-3806',
    title: 'Recurso No Encontrado',
    template: 'El recurso solicitado no fue encontrado en el servidor ({status})'
  },

  // Trámites
  MS_3810_TRAMITES_GET: {
    code: 'MS-3810',
    title: 'Error de Consulta',
    template: 'No fue posible consultar el catálogo de trámites ({status})',
    suggestion: 'Intente recargar la página o verifique los filtros aplicados.'
  },
  MS_3811_TRAMITES_NOT_FOUND: {
    code: 'MS-3811',
    title: 'Trámite No Encontrado',
    template: 'El trámite solicitado no existe en el sistema ({status})'
  },
  MS_3812_TRAMITES_CREATE: {
    code: 'MS-3812',
    title: 'Error de Registro',
    template: 'No fue posible registrar el nuevo trámite ({status})',
    suggestion: 'Verifique los campos obligatorios e intente nuevamente.'
  },
  MS_3813_TRAMITES_UPDATE: {
    code: 'MS-3813',
    title: 'Error de Actualización',
    template: 'No fue posible actualizar la información del trámite ({status})',
    suggestion: 'Verifique la información modificada e intente nuevamente.'
  },
  MS_3814_TRAMITES_DELETE: {
    code: 'MS-3814',
    title: 'Error de Eliminación',
    template: 'No fue posible eliminar el trámite seleccionado ({status})'
  },

  // Notificaciones
  MS_3820_NOTIFICACIONES_GET: {
    code: 'MS-3820',
    title: 'Error de Consulta',
    template: 'No fue posible consultar el historial de notificaciones ({status})'
  },
  MS_3821_NOTIFICACIONES_CREATE: {
    code: 'MS-3821',
    title: 'Error de Emisión',
    template: 'No fue posible registrar la notificación ({status})'
  },

  // Tarjetas y Emisión
  MS_3830_TARJETAS_GET: {
    code: 'MS-3830',
    title: 'Error de Consulta',
    template: 'No fue posible cargar el listado de tarjetas ({status})'
  },
  MS_3831_TARJETAS_CREATE: {
    code: 'MS-3831',
    title: 'Error de Emisión',
    template: 'No fue posible completar la emisión de la tarjeta ({status})'
  },
  MS_3832_TARJETAS_HISTORIAL: {
    code: 'MS-3832',
    title: 'Error de Trazabilidad',
    template: 'No fue posible obtener el historial de la tarjeta ({status})'
  },
  MS_3834_CONSULTA_MATRICULA: {
    code: 'MS-3834',
    title: 'Error de Consulta Oficial',
    template: 'No fue posible consultar el registro institucional en la API de la JCC ({status})',
    suggestion: 'Verifique el número ingresado o intente nuevamente más tarde.'
  },


  // Validador QR y Certificados
  MS_3850_VALIDADOR_CONFIG: {
    code: 'MS-3850',
    title: 'Error de Configuración',
    template: 'No fue posible cargar la configuración del validador ({status})'
  },
  MS_3851_VALIDADOR_SAVE: {
    code: 'MS-3851',
    title: 'Error de Persistencia',
    template: 'No fue posible guardar la configuración del validador ({status})'
  },
  MS_3852_AUDITORIA_GET: {
    code: 'MS-3852',
    title: 'Error de Auditoría',
    template: 'No fue posible consultar el registro de auditoría de la API ({status})',
    suggestion: 'Verifique los parámetros o intente nuevamente más tarde.'
  },
  MS_3860_CERTIFICADOS_GET: {
    code: 'MS-3860',
    title: 'Error de Consulta',
    template: 'No fue posible consultar los certificados ({status})'
  }
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
