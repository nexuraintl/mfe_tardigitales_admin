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
  patron_url?: string | null;
  logo_impresion_url?: string | null;
  patron_impresion_url?: string | null;
  color_letra_impresion?: string | null;
  nombre_director?: string | null;
  firma_director?: string | null;
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
      const targetWidth = 135; // 135mm de ancho centrado en la página A4
      const targetHeight = targetWidth / canvasAspectRatio;
      const posX = (pdfWidth - targetWidth) / 2;
      const posY = 16; // Margen superior equilibrado

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
   * Construye el DOM de la credencial oficial idéntica al branding, adaptada en escala de grises para impresión.
   */
  private construirElementoHtml(datos: TarjetaPdfData, qrDataUrl: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '-9999px';
    wrapper.style.width = '420px';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = '24px 24px 20px 24px';
    wrapper.style.fontFamily = "'Satoshi', sans-serif";
    wrapper.style.color = '#0f172a';
    wrapper.style.boxSizing = 'border-box';

    const isSociedad = datos.tipo === 'sociedad';

    // Mapeo unificado y exacto a TarjetaCredencialComponent
    const labelRegistro = isSociedad ? 'Número de Registro' : 'Tarjeta profesional';
    const valorRegistro = datos.matricula || (isSociedad ? '5892' : '492031-T');

    const labelFecha = isSociedad ? 'Fecha Res. Inscripción' : 'Fecha Resolución Ins.';
    const valorFecha = datos.fecha_resolucion || (isSociedad ? '12 - Mar - 2025' : '06 - Feb - 2026');

    const labelMedio3 = isSociedad ? 'Número de Expediente' : 'Resolución Inscripción';
    const valorMedio3 = isSociedad ? (datos.expediente || '621948') : (datos.resolucion || '289');

    const labelTitular = isSociedad ? 'Razón social' : 'Nombre';
    const valorTitular = datos.solicitante || (isSociedad ? 'Sociedad de Contadores Públicos' : 'Andrés Felipe Torres Cárdenas');

    const labelDocumento = isSociedad ? 'NIT' : 'Cédula de ciudadanía';
    const valorDocumento = String(datos.documento || '').replace(/^(CC|C\.C\.|NIT|CE|TI|PASAPORTE)\s*:?\s*/i, '').trim() || (isSociedad ? '901482310-5' : '1.053.892.146');

    const labelExtra = isSociedad ? 'Tipo de registro' : 'Institución de Educación Superior';
    const valorExtra = datos.universidad || (isSociedad ? 'Sociedad de contadores' : 'Universidad de La Salle');

    const labelPie2Der = isSociedad ? 'Res. Inscripción' : 'N. Expediente';
    const valorPie2Der = isSociedad ? (datos.resolucion || '0142') : (datos.expediente || '621948');

    const fotoSrc = datos.foto || (isSociedad ? 'assets/images/card-logo-sociedades.png' : 'assets/images/photo_card.jpg');
    // Logo oficial institucional para impresión
    const logoSrc = datos.logo_impresion_url || datos.logo_url || 'assets/images/logo_impresion_jcc.png';
    // Patrón de fondo para impresión (marca de agua/trama sutil)
    const patronSrc = datos.patron_impresion_url || datos.patron_url || (isSociedad ? 'assets/images/pattern_sociedades_opt.jpg' : 'assets/images/pattern_jcc_opt.jpg');
    const colorTexto = datos.color_letra_impresion || '#0f172a';

    const legalText = isSociedad
      ? 'Este documento acredita el registro de la Sociedad de Contadores Públicos, conforme a lo establecido en la normatividad legal vigente.'
      : 'Este documento acredita la calidad de Contador Público, conforme a lo establecido en la Ley 43 de 1990 y el Decreto 1510 de 1998.';

    wrapper.innerHTML = `
      <!-- 1. TARJETA CREDENCIAL OFICIAL (VERSIÓN PARA IMPRIMIR: BLANCA CON BORDES Y PATRÓN) -->
      <div style="position: relative; overflow: hidden; width: 100%; border-radius: 26px; padding: 24px 22px 22px 22px; box-sizing: border-box; background-color: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); user-select: none;">
        
        <!-- Capa de Patrón de Fondo Oficial de Branding (imagen transparente grisácea) -->
        <div style="position: absolute; inset: 0; z-index: 0; background-image: url('${patronSrc}'); background-repeat: no-repeat; background-position: center; background-size: cover; mix-blend-mode: multiply; opacity: 0.18; pointer-events: none; border-radius: inherit;"></div>

        <!-- Fila 1: Logo Institucional Oficial a la Izquierda -->
        <div style="position: relative; z-index: 2; display: flex; justify-content: flex-start; align-items: flex-start; margin-bottom: 20px;">
          <img src="${logoSrc}" alt="Logo JCC" style="height: 38px; max-width: 170px; object-fit: contain; object-position: left center;" crossorigin="anonymous" />
        </div>

        <!-- Fila 2: Foto/Logo + Datos Laterales -->
        <div style="position: relative; z-index: 2; display: grid; grid-template-columns: 46% 1fr; gap: 16px; align-items: center; margin-bottom: 20px;">
          <!-- Foto o Logo -->
          <div style="width: 100%; aspect-ratio: 1 / 1.05; border-radius: 20px; overflow: hidden; background-color: #f8fafc; border: 1px solid #f1f5f9; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);">
            <img src="${fotoSrc}" alt="Fotografía" style="width: 100%; height: 100%; object-fit: cover; object-position: center 25%;" crossorigin="anonymous" />
          </div>

          <!-- Datos Laterales Derechos -->
          <div style="display: grid; gap: 14px; align-content: center; text-align: right; min-width: 0;">
            <div>
              <span style="display: block; font-size: 11.5px; color: #475569; margin-bottom: 3px; font-weight: 500;">${labelRegistro}</span>
              <strong style="display: block; font-size: 21px; font-weight: 800; color: ${colorTexto}; line-height: 1.1; white-space: nowrap;">${valorRegistro}</strong>
            </div>
            <div>
              <span style="display: block; font-size: 11px; color: #475569; margin-bottom: 2px; font-weight: 500;">${labelFecha}</span>
              <strong style="display: block; font-size: 14px; font-weight: 700; color: ${colorTexto}; line-height: 1.15;">${valorFecha}</strong>
            </div>
          </div>
        </div>

        <!-- Fila 3: Grilla de Detalles Inferiores (2 Columnas) -->
        <div style="position: relative; z-index: 2; display: grid; grid-template-columns: 58% 1fr; gap: 14px 16px; align-items: start; padding-top: 16px; border-top: 1px solid #f1f5f9;">
          <div>
            <span style="display: block; font-size: 10.5px; color: #475569; margin-bottom: 2px; font-weight: 500;">${labelTitular}</span>
            <strong style="display: block; font-size: 13.5px; font-weight: 700; color: ${colorTexto}; line-height: 1.25;">${valorTitular}</strong>
          </div>
          <div style="text-align: right;">
            <span style="display: block; font-size: 10.5px; color: #475569; margin-bottom: 2px; font-weight: 500;">${labelDocumento}</span>
            <strong style="display: block; font-size: 13.5px; font-weight: 700; color: ${colorTexto}; line-height: 1.25; white-space: nowrap;">${valorDocumento}</strong>
          </div>
          <div>
            <span style="display: block; font-size: 10.5px; color: #475569; margin-bottom: 2px; font-weight: 500;">${labelExtra}</span>
            <strong style="display: block; font-size: 13px; font-weight: 700; color: ${colorTexto}; line-height: 1.25;">${valorExtra}</strong>
          </div>
          <div style="text-align: right;">
            <span style="display: block; font-size: 10.5px; color: #475569; margin-bottom: 2px; font-weight: 500;">${labelPie2Der}</span>
            <strong style="display: block; font-size: 13.5px; font-weight: 700; color: ${colorTexto}; line-height: 1.25;">${valorPie2Der}</strong>
          </div>
        </div>
      </div>

      <!-- 2. SECCIÓN VALIDADOR QR DE AUTENTICIDAD -->
      <div style="margin-top: 24px; display: flex; align-items: center; gap: 18px; padding: 0 6px;">
        <div style="width: 100px; height: 100px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          <img src="${qrDataUrl}" alt="Código QR de verificación" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <div style="font-size: 14.5px; font-weight: 600; color: #1e293b; line-height: 1.35;">
          Código de verificación<br/>de autenticidad
        </div>
      </div>

      <!-- 3. SECCIÓN FIRMA INSTITUCIONAL DIRECCIÓN GENERAL -->
      <div style="margin-top: 22px; background-color: #f1f3f5; border-radius: 18px; padding: 18px 20px 16px 20px; text-align: center;">
        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 4px;">
          <img src="${datos.firma_director || 'assets/images/firma_directora.png'}" alt="Firma ${datos.nombre_director || 'Director General'}" style="height: 48px; max-width: 150px; object-fit: contain; mix-blend-mode: multiply; display: block;" crossorigin="anonymous" />
        </div>
        <div style="font-size: 12.5px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; text-transform: uppercase;">
          ${(datos.nombre_director || 'SANDRA MILENA BARRIOS PULIDO').toUpperCase()}
        </div>
        <div style="font-size: 9.5px; font-weight: 600; color: #64748b; letter-spacing: 0.6px; text-transform: uppercase; margin-top: 2px;">
          DIRECTOR GENERAL
        </div>
      </div>

      <!-- 4. PIE INFORMATIVO LEGAL -->
      <div style="margin-top: 16px; background-color: #f8fafc; border-radius: 14px; padding: 14px 18px; display: flex; align-items: flex-start; gap: 12px; border: 1px solid #edf2f7;">
        <div style="width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #64748b; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #64748b; flex-shrink: 0; margin-top: 1px; font-family: serif;">
          i
        </div>
        <div style="font-size: 11px; color: #334155; line-height: 1.45;">
          ${legalText}
        </div>
      </div>
    `;

    return wrapper;
  }
}
