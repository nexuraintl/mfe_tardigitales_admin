/**
 * Configuración centralizada del Microservicio, Core Auth y Entidad Cliente.
 * - CLIENT_ID (20001): ID de entidad para operaciones de negocio de Tarjetas Digitales (JCC).
 * - AUTH_CLIENT_ID (20060): ID de cliente para consultas de sesión y permisos en Core Auth.
 */
export const API_BASE: string = '/apig/tardigitales/admin';
export const CLIENT_ID: number = 20001;
export const TOKEN_URL: string = '/api/Usuarios/getTokenForGatewayUrl';

export const AUTH_CLIENT_ID: number = 20060;
export const AUTH_MODULE: string = 'TarjetasDigitales';
export const AUTH_SESSION_URL: string = '/apig/core/auth/session';
export const AUTH_PERMISSIONS_URL: string = '/apig/core/auth/permissions';
export const AUTH_LOGIN_REDIRECT_URL: string = '/admin';
