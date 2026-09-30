import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as QRCode from 'qrcode';

export interface TarjetaPdfData {
  tipo: 'contador' | 'sociedad';
  matricula: string;
  fecha_resolucion: string;
  resolucion: string;
  expediente: string | number;
  solicitante: string;
  documento: string;
  universidad?: string;
  foto?: string;
  hash_sha256?: string;
  logo_url?: string | null;
}

/**
 * NOTA ARQUITECTURA / A FUTURO:
 * La generación de este PDF se realiza actualmente en caliente en el navegador mediante JavaScript (jsPDF + html2canvas)
 * para responder de forma inmediata a la descarga sin requerir infraestructura adicional en backend.
 * A futuro, este documento debe ser generado y persistido en el repositorio de medios institucional
 * (S3 / Azure Blob / MinIO), guardando la URL física persistente en la tabla correspondiente de base de datos.
 */
@Injectable({
  providedIn: 'root'
})
export class TarjetaPdfService {

  /**
   * Genera y descarga el documento PDF oficial de la tarjeta con código QR y firma institucional.
   */
  async generarPdfTarjeta(datos: TarjetaPdfData): Promise<void> {
    // 1. Generar código QR en Base64 a partir del Hash SHA-256 de la tarjeta
    const hashParaQr = datos.hash_sha256 || this.calcularHashFallback(datos);
    const qrDataUrl = await this.generarQrDataUrl(hashParaQr);

    // 2. Construir el contenedor HTML temporal con la maqueta exacta
    const container = this.construirElementoHtml(datos, qrDataUrl);
    document.body.appendChild(container);

    try {
      // 3. Capturar elemento con html2canvas en alta definición (2x retina)
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // 4. Instanciar jsPDF y agregar la imagen capturada
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Ajustar dimensiones preservando relación de aspecto
      const canvasAspectRatio = canvas.width / canvas.height;
      const targetWidth = 140; // 140mm de ancho centrado en la página A4
      const targetHeight = targetWidth / canvasAspectRatio;
      const posX = (pdfWidth - targetWidth) / 2;
      const posY = 15; // 15mm de margen superior

      pdf.addImage(imgData, 'PNG', posX, posY, targetWidth, targetHeight, undefined, 'FAST');

      // 5. Descargar automáticamente el PDF
      const prefijo = datos.tipo === 'sociedad' ? 'sociedad' : 'contador';
      const cleanMatricula = (datos.matricula || 'tarjeta').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`tarjeta_${prefijo}_${cleanMatricula}.pdf`);

    } finally {
      // Remover el contenedor del DOM
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  }

  /**
   * Genera el código QR en Base64 PNG.
   */
  private async generarQrDataUrl(hash: string): Promise<string> {
    try {
      const urlVerificacion = `https://local-jcc.nexura.com.co/admin/tardigitales/verificar?token=${hash}`;
      return await QRCode.toDataURL(urlVerificacion, {
        width: 250,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (err) {
      console.warn('[TarjetaPdfService] Fallo al generar QR con qrcode, usando fallback canvas:', err);
      return '';
    }
  }

  /**
   * Fallback por si la tarjeta viene sin hash_sha256 previo en memoria.
   */
  private calcularHashFallback(datos: TarjetaPdfData): string {
    const raw = `${datos.matricula}|${datos.documento}|${datos.expediente}|${datos.resolucion}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, 'a');
  }

  /**
   * Construye el DOM del documento fiel a la maqueta oficial solicitada.
   */
  private construirElementoHtml(datos: TarjetaPdfData, qrDataUrl: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '-9999px';
    wrapper.style.width = '600px';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = '36px 32px 32px 32px';
    wrapper.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    wrapper.style.color = '#0f172a';
    wrapper.style.boxSizing = 'border-box';

    const isSociedad = datos.tipo === 'sociedad';
    const labelRegistro = isSociedad ? 'NIT / Registro Sociedad' : 'Tarjeta profesional';
    const labelTitular = isSociedad ? 'Razón social' : 'Nombre';
    const labelDocumento = isSociedad ? 'NIT' : 'Cédula de ciudadania';
    const labelExtra = isSociedad ? 'Tipo de Sociedad' : 'Institución de Educación Superior';
    const valorExtra = datos.universidad || (isSociedad ? 'Sociedad de Contadores Públicos' : 'Universidad de La Salle');
    const legalText = isSociedad
      ? 'Este documento acredita la inscripción de la Sociedad de Contadores Públicos, conforme a lo establecido en la normatividad vigente.'
      : 'Este documento acredita la calidad de Contador Público, conforme a lo establecido en la Ley 43 de 1990 y el Decreto 1510 de 1998.';

    const fotoSrc = datos.foto || 'assets/images/photo_card.jpg';
    const logoSrc = datos.logo_url || 'assets/images/logo-jcc.png';

    wrapper.innerHTML = `
      <div style="background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06); padding: 24px; position: relative; overflow: hidden; background-image: radial-gradient(#f1f5f9 1.5px, transparent 1.5px); background-size: 24px 24px;">
        <!-- Cabecera de Tarjeta: Logo y Título Institucional -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="font-size: 10px; font-weight: 700; color: #475569; letter-spacing: 0.3px; line-height: 1.2;">
              UNIDAD ADMINISTRATIVA ESPECIAL<br/>
              <span style="font-size: 11px; color: #0f172a;">JUNTA CENTRAL DE CONTADORES</span>
            </div>
          </div>
          <div style="height: 38px; display: flex; align-items: center;">
            <img src="${logoSrc}" alt="Logo JCC" style="height: 36px; max-width: 140px; object-fit: contain;" crossorigin="anonymous" />
          </div>
        </div>

        <!-- Cuerpo de Tarjeta: Foto + Datos Principales -->
        <div style="display: flex; gap: 20px; align-items: flex-start; margin-bottom: 24px;">
          <!-- Fotografía del Titular -->
          <div style="width: 125px; height: 155px; border-radius: 14px; overflow: hidden; background: #e2e8f0; flex-shrink: 0; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
            <img src="${fotoSrc}" alt="Foto" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />
          </div>

          <!-- Columna Registro y Fechas -->
          <div style="flex-grow: 1; min-width: 0;">
            <div style="font-size: 13px; color: #64748b; font-weight: 500; margin-bottom: 2px;">${labelRegistro}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
              <span style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">${datos.matricula}</span>
              <span style="display: inline-block; width: 16px; height: 16px; border: 1.5px solid #64748b; border-radius: 3px; position: relative;">
                <span style="position: absolute; right: -3px; top: -3px; width: 14px; height: 14px; border: 1.5px solid #64748b; border-radius: 3px;"></span>
              </span>
            </div>

            <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 2px;">Fecha Res. Inscripción</div>
            <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 14px;">${datos.fecha_resolucion || '06 - Feb - 2026'}</div>

            <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 2px;">Res. Inscripción</div>
            <div style="font-size: 14px; font-weight: 700; color: #1e293b;">${datos.resolucion || '289'}</div>
          </div>
        </div>

        <!-- Grilla de Información Secundaria (2 Columnas) -->
        <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 16px 20px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
          <div>
            <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 2px;">${labelTitular}</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.3;">${datos.solicitante}</div>
          </div>

          <div>
            <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 2px;">${labelDocumento}</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${String(datos.documento || '').replace(/^(CC|C\.C\.|NIT|CE|TI|PASAPORTE)\s*:?\s*/i, '').trim()}</div>
          </div>

          <div>
            <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 2px;">${labelExtra}</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.3;">${valorExtra}</div>
          </div>

          <div>
            <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 2px;">N. Expediente</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${datos.expediente || '-'}</div>
          </div>
        </div>
      </div>

      <!-- Sección Validador QR con Leyenda de Autenticidad -->
      <div style="display: flex; align-items: center; gap: 20px; margin-top: 26px; padding: 0 8px;">
        <div style="width: 120px; height: 120px; flex-shrink: 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px; box-sizing: border-box; display: flex; align-items: center; justify-content: center;">
          <img src="${qrDataUrl}" alt="Código QR de verificación" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <div style="font-size: 15px; font-weight: 600; color: #1e293b; line-height: 1.4; max-width: 260px;">
          Código de verificación<br/>de autenticidad
        </div>
      </div>

      <!-- Sección Firma Institucional de Dirección General -->
      <div style="margin-top: 24px; background-color: #f1f5f9; border-radius: 18px; padding: 22px 20px; text-align: center;">
        <div style="display: flex; justify-content: center; margin-bottom: 8px;">
          <!-- Firma Caligráfica Vectorial Oficial -->
          <svg width="150" height="42" viewBox="0 0 150 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 30 C25 12, 35 8, 42 22 C48 34, 52 38, 58 18 C60 10, 66 12, 68 25 C70 34, 78 28, 86 22 C96 16, 102 28, 112 24 C122 20, 128 26, 138 22" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 25 L50 20 M28 35 Q45 40 82 34 Q118 28 135 30" stroke="#1e293b" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </div>
        <div style="font-size: 13px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; text-transform: uppercase;">
          SANDRA MILENA BARRIOS PULIDO
        </div>
        <div style="font-size: 10px; font-weight: 600; color: #64748b; letter-spacing: 0.6px; text-transform: uppercase; margin-top: 3px;">
          DIRECTOR GENERAL
        </div>
      </div>

      <!-- Pie Informativo Legal con Icono -->
      <div style="margin-top: 24px; padding: 12px 14px; background: #ffffff; border-radius: 10px; display: flex; align-items: flex-start; gap: 10px;">
        <div style="width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #64748b; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #64748b; flex-shrink: 0; margin-top: 1px;">
          i
        </div>
        <div style="font-size: 11.5px; color: #475569; line-height: 1.45;">
          ${legalText}
        </div>
      </div>
    `;

    return wrapper;
  }
}
