import { TipoSolicitud } from '../../enums/tipos.enum';
import { EstadoTarjeta } from '../../enums/estados.enum';

export const MAPA_TIPOS_SOLICITUD: Record<string, string> = {
  primeraVez: TipoSolicitud.PRIMERA_VEZ,
  primera_vez: TipoSolicitud.PRIMERA_VEZ,
  duplicado: TipoSolicitud.DUPLICADO,
  sustitucion: TipoSolicitud.SUSTITUCION,
  modificacion: TipoSolicitud.MODIFICACION,
  renovacion: TipoSolicitud.RENOVACION
};

/**
 * Formatea de forma segura y centralizada el tipo de solicitud/asociado o sociedad.
 */
export function formatTipoSolicitud(val?: string | null): string {
  if (!val) return TipoSolicitud.PRIMERA_VEZ;
  const cleanKey = String(val).trim();
  if (MAPA_TIPOS_SOLICITUD[cleanKey]) {
    return MAPA_TIPOS_SOLICITUD[cleanKey];
  }
  const lower = cleanKey.toLowerCase();
  if (lower === 'sustitucion') return TipoSolicitud.SUSTITUCION;
  if (lower === 'modificacion') return TipoSolicitud.MODIFICACION;
  if (lower === 'renovacion') return TipoSolicitud.RENOVACION;
  if (lower === 'primera_vez' || lower === 'primeravez') return TipoSolicitud.PRIMERA_VEZ;
  if (lower === 'duplicado') return TipoSolicitud.DUPLICADO;

  return cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
}

/**
 * Devuelve la clase CSS de badge correspondiente según el Estado de la Tarjeta.
 */
export function getEstadoTarjetaBadgeClass(estado?: string | null): string {
  if (!estado) return 'bg-warning-subtle text-warning border border-warning-subtle';
  const val = String(estado).trim().toLowerCase();
  if (val === 'activa' || val === 'vigente') {
    return 'bg-success-subtle text-success border border-success-subtle';
  }
  if (val === 'emitida' || val === 'pendiente') {
    return 'bg-warning-subtle text-warning border border-warning-subtle';
  }
  if (val === 'cancelada') {
    return 'bg-danger-subtle text-danger border border-danger-subtle';
  }
  if (val === 'suspendida') {
    return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
  }
  return 'bg-warning-subtle text-warning border border-warning-subtle';
}
