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
  fuente_letra?: string;
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

  get fondoTarjeta(): string {
    return this.branding.color_fondo || (this.tipo === 'sociedad' ? '#134567' : '#14275f');
  }

  get colorLetra(): string {
    return this.branding.color_letra || '#ffffff';
  }

  get fuenteTarjeta(): string {
    return this.branding.fuente_letra || 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  }

  get patronFondo(): string | null {
    return this.branding.patron_url ? `url(${this.branding.patron_url})` : null;
  }

  get fotoUrl(): string {
    return this.datos.foto || this.defaultPhoto;
  }

  // Labels dinámicos según tipo
  get labelRegistro(): string {
    return this.tipo === 'sociedad' ? 'NIT / Registro Sociedad' : 'Tarjeta profesional';
  }

  get valorRegistro(): string {
    return this.datos.matricula || (this.tipo === 'sociedad' ? '900.123.456-7' : '492031-T');
  }

  get labelFecha(): string {
    return 'Fecha Res. Inscripción';
  }

  get valorFecha(): string {
    return this.datos.fecha_resolucion || '06 - Feb - 2026';
  }

  get labelResolucion(): string {
    return 'Res. Inscripción';
  }

  get valorResolucion(): string {
    return this.datos.resolucion || (this.tipo === 'sociedad' ? '1042' : '289');
  }

  get labelTitular(): string {
    return this.tipo === 'sociedad' ? 'Razón social' : 'Nombre y apellido';
  }

  get valorTitular(): string {
    return this.datos.solicitante || (this.tipo === 'sociedad' ? 'AUDITORES Y ASESORES S.A.S.' : 'Andrés Felipe Torres Cárdenas');
  }

  get labelDocumento(): string {
    return this.tipo === 'sociedad' ? 'NIT' : 'Cédula de ciudadanía';
  }

  get valorDocumento(): string {
    return this.datos.documento || (this.tipo === 'sociedad' ? '900.123.456-7' : '1.053.892.146');
  }

  get labelExtra(): string {
    return this.tipo === 'sociedad' ? 'Tipo de Sociedad' : 'Institución de Educación Superior';
  }

  get valorExtra(): string {
    return this.datos.universidad || (this.tipo === 'sociedad' ? 'Sociedad de Contadores Públicos' : 'Universidad de La Salle');
  }

  get labelExpediente(): string {
    return 'N. Expediente';
  }

  get valorExpediente(): string | number {
    return this.datos.expediente || (this.tipo === 'sociedad' ? '884120' : '621948');
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
