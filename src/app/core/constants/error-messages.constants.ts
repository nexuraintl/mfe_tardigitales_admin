export interface ErrorMessageDefinition {
  code: string;
  title: string;
  template: string;
  suggestion?: string;
}

/**
 * Catálogo sustituido por la arquitectura transparente de PipelineException.
 * El MFE renderiza fielmente lo que emita el Backend MS sin plantillas ni quemados.
 */
export const ERROR_MESSAGES: Record<string, ErrorMessageDefinition> = {};
export type ErrorMessageKey = string;
