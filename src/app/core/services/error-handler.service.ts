import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface AppError {
  code: string;
  codigo_error?: number;
  etapa?: string;
  title: string;
  message: string;
  mensaje_base?: string;
  detalle_tecnico?: string;
  tabla_afectada?: string;
  cliente_id?: number;
  httpStatus: number;
  suggestion?: string;
  timestamp: Date;
  endpoint?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  
  /**
   * Procesa un error HTTP y retorna de forma 100% transparente el error enviado por el Backend MS.
   * No inventa ni quema mensajes en el MFE.
   */
  public parseError(
    error: unknown,
    contextKey?: string,
    endpointHint?: string
  ): AppError {
    let status = 0;
    let endpoint = endpointHint || '';
    let rawError: any = null;

    if (error instanceof HttpErrorResponse) {
      status = error.status;
      if (!endpoint && error.url) {
        try {
          const urlObj = new URL(error.url, window.location.origin);
          endpoint = urlObj.pathname;
        } catch {
          endpoint = error.url;
        }
      }
      rawError = error.error;
    } else if (error && typeof error === 'object') {
      status = (error as any).status || 0;
      rawError = (error as any).error || error;
    }

    let codigoError: number | string = '';
    let etapa = '';
    let mensaje = '';
    let detalleTecnico = '';
    let tablaAfectada = '';
    let clienteId: number | undefined = undefined;

    // Extraer la estructura del PipelineException del Microservicio
    if (rawError && typeof rawError === 'object') {
      const errObj = rawError.error || rawError;
      if (errObj && typeof errObj === 'object') {
        codigoError = errObj.codigo_error || errObj.code || status;
        etapa = errObj.etapa || '';
        mensaje = errObj.mensaje || errObj.message || errObj.detail || '';
        detalleTecnico = errObj.detalle_tecnico || '';
        tablaAfectada = errObj.tabla_afectada || '';
        clienteId = errObj.cliente_id;
      } else if (typeof errObj === 'string') {
        mensaje = errObj;
      }
    }

    // Fallbacks solo cuando el servidor no responde o no envía JSON (ej. sin red)
    if (!mensaje) {
      if (status === 0) {
        mensaje = 'No fue posible conectar con el microservicio. Verifique la red o el Gateway de Docker.';
        codigoError = 3800;
        etapa = 'CONEXION_RED';
      } else if (status === 401 || status === 403) {
        mensaje = 'No cuenta con permisos de autorización para ejecutar esta acción.';
        codigoError = 3802;
        etapa = 'NO_AUTORIZADO';
      } else if (status === 404) {
        mensaje = 'El recurso o endpoint solicitado no fue localizado en el servidor.';
        codigoError = 3806;
        etapa = 'RECURSO_NO_ENCONTRADO';
      } else {
        mensaje = `Error en el servidor al procesar la solicitud (Código HTTP ${status}).`;
        codigoError = codigoError || status || 500;
        etapa = etapa || 'HTTP_ERROR';
      }
    }

    const titleParts: string[] = [];
    if (codigoError) {
      titleParts.push(`Error ${codigoError}`);
    }
    if (etapa) {
      titleParts.push(etapa);
    }
    const title = titleParts.join(' - ') || 'Error del Microservicio';

    let fullMessage = mensaje;
    if (tablaAfectada) {
      fullMessage += `\n\nTabla afectada: ${tablaAfectada}`;
    }
    if (detalleTecnico) {
      fullMessage += `\nDetalle técnico: ${detalleTecnico}`;
    }

    return {
      code: String(codigoError || status),
      codigo_error: typeof codigoError === 'number' ? codigoError : parseInt(String(codigoError), 10) || undefined,
      etapa: etapa,
      title: title,
      message: fullMessage,
      mensaje_base: mensaje,
      detalle_tecnico: detalleTecnico,
      tabla_afectada: tablaAfectada,
      cliente_id: clienteId,
      httpStatus: status,
      timestamp: new Date(),
      endpoint: endpoint
    };
  }

  /**
   * Genera el texto plano del error de forma transparente.
   */
  public formatErrorMessage(
    error: unknown,
    contextKey?: string,
    endpointHint?: string
  ): string {
    const err = this.parseError(error, contextKey, endpointHint);
    return `${err.title}\n${err.message}`;
  }
}
