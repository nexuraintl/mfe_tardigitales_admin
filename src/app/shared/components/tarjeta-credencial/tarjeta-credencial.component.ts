import { Component, Input, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CredencialDatos {
  no_tarjeta?: string;
  inscripcion?: string;
  matricula?: string;
  fecha_resolucion?: string;
  resolucion?: string;
  no_expd?: string | number;
  expediente?: string | number;
  nombre_completo?: string;
  razon_social?: string;
  solicitante?: string;
  no_documento?: string;
  nit?: string;
  documento?: string;
  universidad?: string;
  tipo_sociedad?: string;
  foto?: string;
  estado?: string;
}

export interface CredencialBranding {
  color_fondo?: string;
  color_letra?: string;
  color_letra_impresion?: string;
  logo_url?: string | null;
  logo_impresion_url?: string | null;
  patron_url?: string | null;
  patron_impresion_url?: string | null;
}

@Component({
  selector: 'app-tarjeta-credencial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarjeta-credencial.component.html',
  styleUrls: ['./tarjeta-credencial.component.css']
})
export class TarjetaCredencialComponent implements AfterViewInit, OnDestroy, OnChanges {
  /** 'contador' | 'sociedad' */
  @Input() tipo: 'contador' | 'sociedad' = 'contador';

  /** 'digital' | 'impresion' */
  @Input() modo: 'digital' | 'impresion' = 'digital';

  /** 'ambas' | 'frente' | 'reverso' */
  @Input() vista: 'ambas' | 'frente' | 'reverso' = 'ambas';

  /** 'auto' | 'stack' | 'side-by-side' */
  @Input() layout: 'auto' | 'stack' | 'side-by-side' = 'auto';

  /** Datos del titular a renderizar */
  @Input() datos: CredencialDatos = {};

  /** Configuración de branding visual (logo, patrón, color_fondo) */
  @Input() branding: CredencialBranding = {};

  /** Configuración de visibilidad de campos (ej. Validador QR) */
  @Input() camposVisibles?: any;

  @ViewChild('tarjetaRef') tarjetaRef?: ElementRef<HTMLElement>;
  @ViewChild('degradadoRef') degradadoRef?: ElementRef<HTMLElement>;

  copiadoExitoso: boolean = false;
  logoError: boolean = false;
  private resizeObserver?: ResizeObserver;

  // Grano oficial de la plantilla Flutter / Figma (textura_overlay.png en blend mode overlay)
  readonly texturaOverlay = 'assets/tarjeta/texturas/textura_overlay.png';

  ngAfterViewInit(): void {
    this.iniciarObservadorRedimension();
    setTimeout(() => this.actualizarDegradado(), 50);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tipo'] || changes['branding']) {
      setTimeout(() => this.actualizarDegradado(), 50);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private iniciarObservadorRedimension(): void {
    if (typeof ResizeObserver !== 'undefined' && this.tarjetaRef?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.actualizarDegradado();
      });
      this.resizeObserver.observe(this.tarjetaRef.nativeElement);
    }
  }

  actualizarDegradado(): void {
    const el = this.tarjetaRef?.nativeElement;
    const deg = this.degradadoRef?.nativeElement;
    if (!el || !deg) return;

    const m = this.tipo === 'sociedad'
      ? { lienzo: [358, 415.28], a: 0, b: 20.764, c: -17.9, d: 0, e: 179, f: 207.64 }
      : { lienzo: [358, 418], a: -2.9701, b: 34.49, c: -29.539, d: -10.078, e: 212.8, f: 209 };

    const w = el.clientWidth || 358;
    const h = el.clientHeight || m.lienzo[1];
    const sx = w / m.lienzo[0];
    const sy = h / m.lienzo[1];

    deg.style.transform = `matrix(${sx * m.a}, ${sy * m.b}, ${sx * m.c}, ${sy * m.d}, ${sx * m.e}, ${sy * m.f})`;
  }

  get patronFondoUrl(): string | null {
    if (this.branding?.patron_url) return this.branding.patron_url;
    return this.tipo === 'sociedad'
      ? 'assets/images/pattern_sociedades_opt.jpg'
      : 'assets/images/pattern_jcc_opt.jpg';
  }

  get isImpresion(): boolean {
    return this.modo === 'impresion';
  }

  get logoUrl(): string | null {
    if (this.logoError) return null;
    if (this.isImpresion) {
      return this.branding?.logo_impresion_url || this.branding?.logo_url || 'assets/tarjeta/logos/logo_jcc_horizontal.svg';
    }
    return this.branding?.logo_url || 'assets/tarjeta/logos/logo_jcc_horizontal.svg';
  }

  onLogoError(event: Event): void {
    this.logoError = true;
  }

  get fotoUrl(): string {
    if (this.datos?.foto) return this.datos.foto;
    return this.tipo === 'sociedad'
      ? 'assets/tarjeta/logos/sociedad_logo_ejemplo.png'
      : 'assets/tarjeta/logos/contador_foto_ejemplo.jpg';
  }

  get degradadoFondo(): string {
    return this.generarDegradadoConico(this.branding?.color_fondo);
  }

  /**
   * Convierte un código hexadecimal a componentes HSL
   */
  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    let clean = (hex || '').replace('#', '').trim();
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num) || clean.length !== 6) {
      return this.tipo === 'sociedad'
        ? { h: 38, s: 100, l: 4.5 }
        : { h: 226, s: 58, l: 9.4 };
    }
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  /**
   * Convierte HSL a código hexadecimal #RRGGBB
   */
  private hslToHex(h: number, s: number, l: number): string {
    h = (h % 360 + 360) % 360 / 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  /**
   * Genera el conic-gradient oficial con la curva matemática de luminosidad
   * de la plantilla Flutter / Figma modulada según el color_fondo configurado en branding.
   */
  generarDegradadoConico(hexColor?: string): string {
    if (this.isImpresion) return '#ffffff';

    const color = hexColor || (this.tipo === 'sociedad' ? '#170F00' : '#0A1026');
    const { h, s, l } = this.hexToHsl(color);

    if (this.tipo === 'contador') {
      const lBase = Math.max(6.0, Math.min(l, 25.0));
      const lPeak = Math.min(75.0, lBase + 38.4);
      const stops: [number, number][] = [
        [0.0, lBase],
        [2.0575, lBase * 0.7],
        [5.2764, Math.max(1.5, lBase * 0.21)],
        [11.593, lBase * 0.81],
        [17.91, lBase * 1.44],
        [30.543, lBase + (lPeak - lBase) * 0.40],
        [43.176, lBase + (lPeak - lBase) * 0.70],
        [55.809, lPeak],
        [74.105, lBase + (lPeak - lBase) * 0.64],
        [83.253, lBase + (lPeak - lBase) * 0.46],
        [92.401, lBase + (lPeak - lBase) * 0.29],
        [98.839, lBase * 1.19],
        [100.0, lBase]
      ];
      const cssStops = stops.map(([pct, lVal]) => `${this.hslToHex(h, s, lVal)} ${pct}%`).join(', ');
      return `conic-gradient(from 90deg at 50% 50%, ${cssStops})`;
    } else {
      const lBase = Math.max(4.0, Math.min(l, 20.0));
      const lPeak = Math.min(75.0, lBase + 58.6);
      const stops: [number, number][] = [
        [0.0, lBase],
        [3.6358, lBase + (lPeak - lBase) * 0.06],
        [7.2716, lBase + (lPeak - lBase) * 0.12],
        [14.543, lBase + (lPeak - lBase) * 0.25],
        [21.815, lBase + (lPeak - lBase) * 0.38],
        [29.087, lBase + (lPeak - lBase) * 0.50],
        [43.63, lBase + (lPeak - lBase) * 0.75],
        [58.173, lPeak],
        [68.63, lBase + (lPeak - lBase) * 0.75],
        [79.087, lBase + (lPeak - lBase) * 0.50],
        [84.315, lBase + (lPeak - lBase) * 0.38],
        [89.543, lBase + (lPeak - lBase) * 0.25],
        [94.772, lBase + (lPeak - lBase) * 0.12],
        [97.386, lBase + (lPeak - lBase) * 0.06],
        [100.0, lBase]
      ];
      const cssStops = stops.map(([pct, lVal]) => `${this.hslToHex(h, s, lVal)} ${pct}%`).join(', ');
      return `conic-gradient(from 90deg at 50% 50%, ${cssStops})`;
    }
  }

  get transformDegradado(): string {
    return this.tipo === 'sociedad'
      ? 'matrix(0, 20.764, -17.9, 0, 179, 207.64)'
      : 'matrix(-2.9701, 34.49, -29.539, -10.078, 212.8, 209)';
  }

  // ================= VISIBILIDAD DE CAMPOS (VALIDADOR QR) =================
  get isFotoVisible(): boolean {
    if (!this.camposVisibles) return true;
    if (this.camposVisibles.foto !== undefined) return Boolean(this.camposVisibles.foto);
    if (this.camposVisibles.val_foto !== undefined) return Boolean(this.camposVisibles.val_foto);
    return true;
  }

  get isRegistroVisible(): boolean {
    if (!this.camposVisibles) return true;
    if (this.tipo === 'sociedad') {
      if (this.camposVisibles.val_numero_registro !== undefined) return Boolean(this.camposVisibles.val_numero_registro);
      if (this.camposVisibles.val_matricula !== undefined) return Boolean(this.camposVisibles.val_matricula);
    } else {
      if (this.camposVisibles.val_tarjeta_profesional !== undefined) return Boolean(this.camposVisibles.val_tarjeta_profesional);
      if (this.camposVisibles.val_matricula !== undefined) return Boolean(this.camposVisibles.val_matricula);
    }
    return true;
  }

  get isFechaVisible(): boolean {
    if (!this.camposVisibles) return true;
    if (this.camposVisibles.fecha !== undefined) return Boolean(this.camposVisibles.fecha);
    if (this.camposVisibles.val_fecha_resolucion !== undefined) return Boolean(this.camposVisibles.val_fecha_resolucion);
    return true;
  }

  get isMedio3Visible(): boolean {
    if (!this.camposVisibles) return true;
    if (this.tipo === 'sociedad') {
      if (this.camposVisibles.resolucion !== undefined) return Boolean(this.camposVisibles.resolucion);
      if (this.camposVisibles.val_resolucion !== undefined) return Boolean(this.camposVisibles.val_resolucion);
    } else {
      if (this.camposVisibles.resolucion !== undefined) return Boolean(this.camposVisibles.resolucion);
      if (this.camposVisibles.val_resolucion !== undefined) return Boolean(this.camposVisibles.val_resolucion);
    }
    return true;
  }

  get isTitularVisible(): boolean {
    if (!this.camposVisibles) return true;
    if (this.tipo === 'sociedad') {
      if (this.camposVisibles.val_razon_social !== undefined) return Boolean(this.camposVisibles.val_razon_social);
      if (this.camposVisibles.val_nombre !== undefined) return Boolean(this.camposVisibles.val_nombre);
    } else {
      if (this.camposVisibles.val_nombre !== undefined) return Boolean(this.camposVisibles.val_nombre);
      if (this.camposVisibles.val_razon_social !== undefined) return Boolean(this.camposVisibles.val_razon_social);
    }
    return true;
  }

  get isDocumentoVisible(): boolean {
    if (!this.camposVisibles) return true;
    if (this.tipo === 'sociedad') {
      if (this.camposVisibles.val_nit !== undefined) return Boolean(this.camposVisibles.val_nit);
      if (this.camposVisibles.val_cedula !== undefined) return Boolean(this.camposVisibles.val_cedula);
    } else {
      if (this.camposVisibles.val_cedula !== undefined) return Boolean(this.camposVisibles.val_cedula);
      if (this.camposVisibles.val_nit !== undefined) return Boolean(this.camposVisibles.val_nit);
    }
    return true;
  }

  get isExtraVisible(): boolean {
    if (!this.camposVisibles) return true;
    if (this.tipo === 'sociedad') {
      if (this.camposVisibles.val_tipo_registro !== undefined) return Boolean(this.camposVisibles.val_tipo_registro);
    } else {
      if (this.camposVisibles.val_institucion !== undefined) return Boolean(this.camposVisibles.val_institucion);
    }
    return true;
  }

  get isPie2DerVisible(): boolean {
    if (!this.camposVisibles) return true;
    if (this.tipo === 'sociedad') {
      if (this.camposVisibles.expediente !== undefined) return Boolean(this.camposVisibles.expediente);
      if (this.camposVisibles.val_expediente !== undefined) return Boolean(this.camposVisibles.val_expediente);
    } else {
      if (this.camposVisibles.expediente !== undefined) return Boolean(this.camposVisibles.expediente);
      if (this.camposVisibles.val_expediente !== undefined) return Boolean(this.camposVisibles.val_expediente);
    }
    return true;
  }

  // ================= VALORES QUEMADOS OFICIALES (FLUTTER 1:1) =================
  get valorRegistro(): string {
    if (this.datos && ('no_tarjeta' in this.datos || 'inscripcion' in this.datos || 'matricula' in this.datos)) {
      const val = this.datos?.no_tarjeta || this.datos?.inscripcion || this.datos?.matricula;
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
    return this.tipo === 'sociedad' ? '5892' : '492031-T';
  }

  get valorFecha(): string {
    if (this.datos && 'fecha_resolucion' in this.datos) {
      const val = this.datos?.fecha_resolucion;
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
    return this.tipo === 'sociedad' ? '12 - Mar - 2025' : '06 - Feb - 2026';
  }

  get valorMedio3(): string | number {
    if (this.datos && 'resolucion' in this.datos) {
      const val = this.datos?.resolucion;
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
    return this.tipo === 'sociedad' ? '0142' : '289';
  }

  get valorTitular(): string {
    if (this.datos && ('nombre_completo' in this.datos || 'razon_social' in this.datos || 'solicitante' in this.datos)) {
      const val = this.datos?.nombre_completo || this.datos?.razon_social || this.datos?.solicitante;
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
    return this.tipo === 'sociedad' ? 'Innovación Financiera y Tributaria S.A.S.' : 'Andrés Felipe Torres Cárdenas';
  }

  get valorDocumento(): string {
    if (this.datos && ('no_documento' in this.datos || 'nit' in this.datos || 'documento' in this.datos)) {
      const raw = this.datos?.no_documento || this.datos?.nit || this.datos?.documento || '';
      if (raw && String(raw).trim() !== '') {
        return String(raw).replace(/^(CC|C\.C\.|NIT|CE|TI|PASAPORTE)\s*:?\s*/i, '').trim();
      }
    }
    return this.tipo === 'sociedad' ? '901482310-5' : '1.053.892.146';
  }

  get valorExtra(): string {
    if (this.datos && ('universidad' in this.datos || 'tipo_sociedad' in this.datos)) {
      let val = this.datos?.universidad || this.datos?.tipo_sociedad || '';
      if (val && String(val).trim() !== '') {
        val = String(val).replace(/Sociedad de Contadores Públicos/gi, 'Sociedad de Contadores').trim();
        return val;
      }
    }
    return this.tipo === 'sociedad' ? 'Sociedad de Contadores' : 'Universidad de La Salle';
  }

  get valorPie2Der(): string | number {
    if (this.datos && ('no_expd' in this.datos || 'expediente' in this.datos)) {
      const val = this.datos?.no_expd ?? this.datos?.expediente;
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val;
      }
    }
    return this.tipo === 'sociedad' ? '589201' : '621948';
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
