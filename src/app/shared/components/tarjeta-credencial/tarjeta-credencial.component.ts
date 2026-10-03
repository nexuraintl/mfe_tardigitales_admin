import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PHOTO_CARD_PATH } from '../../../core/constants/assets.constants';

export interface CredencialDatos {
  matricula?: string;
  fecha_resolucion?: string;
  resolucion?: string;
  expediente?: string | number;
  solicitante?: string;
  documento?: string;
  universidad?: string;
  foto?: string;
  estado?: string;
}

export interface CredencialBranding {
  color_fondo?: string;
  color_letra?: string;
  logo_url?: string | null;
  patron_url?: string | null;
}

@Component({
  selector: 'app-tarjeta-credencial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarjeta-credencial.component.html',
  styleUrls: ['./tarjeta-credencial.component.css']
})
export class TarjetaCredencialComponent {
  /** 'contador' | 'sociedad' */
  @Input() tipo: 'contador' | 'sociedad' = 'contador';

  /** 'ambas' | 'frente' | 'reverso' */
  @Input() vista: 'ambas' | 'frente' | 'reverso' = 'ambas';

  /** 'auto' | 'stack' | 'side-by-side' */
  @Input() layout: 'auto' | 'stack' | 'side-by-side' = 'auto';

  /** Datos del titular a renderizar */
  @Input() datos: CredencialDatos = {};

  /** Configuración de branding visual */
  @Input() branding: CredencialBranding = {};

  /** Foto por defecto si no viene en datos */
  defaultPhoto: string = PHOTO_CARD_PATH;

  copiadoExitoso: boolean = false;
  logoError: boolean = false;

  get fondoTarjeta(): string {
    return this.branding.color_fondo || (this.tipo === 'sociedad' ? '#170e00' : '#14275f');
  }

  get fondoTarjetaOscuro(): string {
    return this.oscurecerColor(this.fondoTarjeta, 14);
  }

  get fondoTarjetaProfundo(): string {
    return this.oscurecerColor(this.fondoTarjeta, 25);
  }

  private oscurecerColor(color: string, porcentaje: number): string {
    if (!color) return '#000000';
    let hex = color.trim();
    if (!hex.startsWith('#')) return '#000000';
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6) return '#000000';
    const num = parseInt(hex, 16);
    if (isNaN(num)) return '#000000';

    const factor = Math.max(0, Math.min(1, (100 - porcentaje) / 100));
    const r = Math.round((num >> 16) * factor);
    const g = Math.round(((num >> 8) & 0x00ff) * factor);
    const b = Math.round((num & 0x0000ff) * factor);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  get colorLetra(): string {
    return this.branding.color_letra || '#ffffff';
  }

  get fuenteTarjeta(): string {
    return "'Satoshi', system-ui, -apple-system, sans-serif";
  }

  get patronFondo(): string | null {
    return this.branding.patron_url ? `url(${this.branding.patron_url})` : null;
  }

  get logoUrl(): string | null {
    if (this.logoError) return null;
    return this.branding.logo_url || null;
  }

  onLogoError(event: Event): void {
    this.logoError = true;
  }

  get fotoUrl(): string {
    return this.datos.foto || this.defaultPhoto;
  }

  // ===== BLOQUE MEDIO DERECHA (Item 1: Registro / Tarjeta) =====
  get labelRegistro(): string {
    return this.tipo === 'sociedad' ? 'Número de Registro' : 'Tarjeta profesional';
  }

  get valorRegistro(): string {
    return this.datos.matricula || (this.tipo === 'sociedad' ? '5892' : '492031-T');
  }

  // ===== BLOQUE MEDIO DERECHA (Item 2: Fecha de Inscripción) =====
  get labelFecha(): string {
    return this.tipo === 'sociedad' ? 'Fecha Res. Inscripción' : 'Fecha Resolución Ins.';
  }

  get valorFecha(): string {
    return this.datos.fecha_resolucion || (this.tipo === 'sociedad' ? '12 - Mar - 2025' : '06 - Feb - 2026');
  }

  // ===== BLOQUE MEDIO DERECHA (Item 3: Resolución en Contador / Expediente en Sociedad) =====
  get labelMedio3(): string {
    return this.tipo === 'sociedad' ? 'Número de Expediente' : 'Resolucion Inscripción';
  }

  get valorMedio3(): string | number {
    return this.tipo === 'sociedad'
      ? (this.datos.expediente || '621948')
      : (this.datos.resolucion || '289');
  }

  // ===== PIE INFERIOR (Fila 1 Izq: Nombre / Razón Social) =====
  get labelTitular(): string {
    return this.tipo === 'sociedad' ? 'Razón social' : 'Nombre';
  }

  get valorTitular(): string {
    return this.datos.solicitante || (this.tipo === 'sociedad' ? 'Innovación Financiera y Tributaria S.A.S.' : 'Andrés Felipe Torres Cárdenas');
  }

  // ===== PIE INFERIOR (Fila 1 Der: Documento / NIT) =====
  get labelDocumento(): string {
    return this.tipo === 'sociedad' ? 'NIT' : 'Cédula de ciudadanía';
  }

  get valorDocumento(): string {
    const raw = this.datos.documento || (this.tipo === 'sociedad' ? '901482310-5' : '1.053.892.146');
    if (!raw) return '';
    return String(raw).replace(/^(CC|C\.C\.|NIT|CE|TI|PASAPORTE)\s*:?\s*/i, '').trim();
  }

  // ===== PIE INFERIOR (Fila 2 Izq: Institución / Tipo de Registro) =====
  get labelExtra(): string {
    return this.tipo === 'sociedad' ? 'Tipo de registro' : 'Institución de Educación Superior';
  }

  get valorExtra(): string {
    return this.datos.universidad || (this.tipo === 'sociedad' ? 'Sociedad de contadores' : 'Universidad de La Salle');
  }

  // ===== PIE INFERIOR (Fila 2 Der: Expediente en Contador / Res. Inscripción en Sociedad) =====
  get labelPie2Der(): string {
    return this.tipo === 'sociedad' ? 'Res. Inscripción' : 'N. Expediente';
  }

  get valorPie2Der(): string | number {
    return this.tipo === 'sociedad'
      ? (this.datos.resolucion || '0142')
      : (this.datos.expediente || '621948');
  }

  // Getters auxiliares para retrocompatibilidad
  get labelResolucion(): string {
    return 'Res. Inscripción';
  }

  get valorResolucion(): string {
    return this.datos.resolucion || (this.tipo === 'sociedad' ? '0142' : '289');
  }

  get labelExpediente(): string {
    return 'N. Expediente';
  }

  get valorExpediente(): string | number {
    return this.datos.expediente || (this.tipo === 'sociedad' ? '621948' : '621948');
  }

  copiarMatricula(event: MouseEvent): void {
    event.stopPropagation();
    const texto = this.valorRegistro;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(() => {
        this.notificarCopiado();
      }).catch(() => {
        this.fallbackCopiar(texto);
      });
    } else {
      this.fallbackCopiar(texto);
    }
  }

  private fallbackCopiar(texto: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.notificarCopiado();
    } catch {
      // Ignorar fallback
    }
    document.body.removeChild(textarea);
  }

  private notificarCopiado(): void {
    this.copiadoExitoso = true;
    setTimeout(() => {
      this.copiadoExitoso = false;
    }, 2000);
  }
}
