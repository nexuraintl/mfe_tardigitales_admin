import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { ErrorHandlerService, AppError } from '../core/services/error-handler.service';
import { NxAlertComponent } from '../shared/components/alert/alert.component';
import { TarjetaCredencialComponent, CredencialDatos, CredencialBranding } from '../shared/components/tarjeta-credencial/tarjeta-credencial.component';

export interface ConfigContador {
  val_tarjeta_profesional: boolean;
  val_fecha_resolucion: boolean;
  val_resolucion: boolean;
  val_nombre: boolean;
  val_cedula: boolean;
  val_institucion: boolean;
  val_expediente: boolean;
  val_estado: boolean;
  val_codigo_tarjeta?: boolean;
  val_foto?: boolean;
}

export interface ConfigSociedad {
  val_numero_registro: boolean;
  val_fecha_resolucion: boolean;
  val_expediente: boolean;
  val_razon_social: boolean;
  val_nit: boolean;
  val_tipo_registro: boolean;
  val_resolucion: boolean;
  val_estado: boolean;
  val_codigo_tarjeta?: boolean;
  val_foto?: boolean;
}

@Component({
  selector: 'app-validador-qr',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NxAlertComponent, TarjetaCredencialComponent],
  templateUrl: './validador-qr.component.html'
})
export class ValidadorQrComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);

  clientId: number = CLIENT_ID;
  loading: boolean = false;
  mensajeExito: string = '';
  mensajeAdvertencia: string = '';
  currentError: AppError | null = null;

  tipoTarjeta: 'contadores' | 'sociedades' = 'contadores';

  // Branding de credencial
  brandingColorFondo: string = '#14275f';
  brandingColorLetra: string = '#ffffff';
  brandingLogoUrl: string | null = null;
  brandingPatronUrl: string | null = null;

  get credencialBranding(): CredencialBranding {
    return {
      color_fondo: this.isSociedades ? (this.brandingColorFondo || '#170e00') : this.brandingColorFondo,
      color_letra: this.brandingColorLetra,
      logo_url: this.brandingLogoUrl,
      patron_url: this.brandingPatronUrl
    };
  }

  get datosEjemplo(): CredencialDatos {
    if (this.isSociedades) {
      return {
        matricula: '5892',
        no_tarjeta: '5892',
        inscripcion: '5892',
        fecha_resolucion: '12 - Mar - 2025',
        expediente: '621948',
        no_expd: '621948',
        razon_social: 'Innovación Financiera y Tributaria S.A.S.',
        nombre_completo: 'Innovación Financiera y Tributaria S.A.S.',
        nit: '901482310-5',
        no_documento: '901482310-5',
        documento: '901482310-5',
        universidad: 'Sociedad de contadores',
        resolucion: '0142',
        estado: 'Emitida'
      };
    }
    return {
      matricula: '492031-T',
      no_tarjeta: '492031-T',
      inscripcion: '492031-T',
      fecha_resolucion: '06 - Feb - 2026',
      resolucion: '289',
      nombre_completo: 'Andrés Felipe Torres Cárdenas',
      razon_social: 'Andrés Felipe Torres Cárdenas',
      no_documento: '1.053.892.146',
      nit: '1.053.892.146',
      documento: '1.053.892.146',
      universidad: 'Universidad de La Salle',
      expediente: '621948',
      no_expd: '621948',
      estado: 'Emitida'
    };
  }

  // Configuración de campos Contadores
  configContador: ConfigContador = {
    val_tarjeta_profesional: true,
    val_fecha_resolucion: true,
    val_resolucion: true,
    val_nombre: true,
    val_cedula: true,
    val_institucion: true,
    val_expediente: true,
    val_estado: true,
    val_codigo_tarjeta: true,
    val_foto: true
  };

  // Configuración de campos Sociedades
  configSociedad: ConfigSociedad = {
    val_numero_registro: true,
    val_fecha_resolucion: true,
    val_expediente: true,
    val_razon_social: true,
    val_nit: true,
    val_tipo_registro: true,
    val_resolucion: true,
    val_estado: true,
    val_codigo_tarjeta: true,
    val_foto: true
  };

  get isSociedades(): boolean {
    return this.tipoTarjeta === 'sociedades';
  }

  get hasSelectedFields(): boolean {
    if (this.isSociedades) {
      return Boolean(
        this.configSociedad.val_numero_registro ||
        this.configSociedad.val_fecha_resolucion ||
        this.configSociedad.val_expediente ||
        this.configSociedad.val_razon_social ||
        this.configSociedad.val_nit ||
        this.configSociedad.val_tipo_registro ||
        this.configSociedad.val_resolucion ||
        this.configSociedad.val_estado
      );
    }
    return Boolean(
      this.configContador.val_tarjeta_profesional ||
      this.configContador.val_fecha_resolucion ||
      this.configContador.val_resolucion ||
      this.configContador.val_nombre ||
      this.configContador.val_cedula ||
      this.configContador.val_institucion ||
      this.configContador.val_expediente ||
      this.configContador.val_estado
    );
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data && data['tipo']) {
        this.tipoTarjeta = data['tipo'];
      } else {
        const url = this.router.url;
        this.tipoTarjeta = url.includes('sociedad') ? 'sociedades' : 'contadores';
      }
      this.cargarConfiguracion();
    });
  }

  cambiarTipo(tipo: 'contadores' | 'sociedades'): void {
    if (this.tipoTarjeta === tipo) return;
    this.tipoTarjeta = tipo;
    const ruta = tipo === 'sociedades' ? '/validador-qr-sociedades' : '/validador-qr-contadores';
    this.router.navigate([ruta]);
  }

  cargarConfiguracion(): void {
    this.loading = true;
    this.currentError = null;
    this.mensajeExito = '';
    this.mensajeAdvertencia = '';

    const url = `${API_BASE}/tarjetas/validador-qr/get-config?tipo_tarjeta=${this.tipoTarjeta}&client_id=${this.clientId}`;
    this.http.get<any>(url).subscribe({
      next: (data) => {
        if (data) {
          if (this.isSociedades) {
            this.configSociedad = {
              val_numero_registro: Boolean(data.val_numero_registro ?? data.val_matricula ?? true),
              val_fecha_resolucion: Boolean(data.val_fecha_resolucion ?? true),
              val_expediente: Boolean(data.val_expediente ?? true),
              val_razon_social: Boolean(data.val_razon_social ?? data.val_nombres ?? true),
              val_nit: Boolean(data.val_nit ?? data.val_numero_identificacion ?? true),
              val_tipo_registro: Boolean(data.val_tipo_registro ?? true),
              val_resolucion: Boolean(data.val_resolucion ?? true),
              val_estado: Boolean(data.val_estado ?? true),
              val_codigo_tarjeta: Boolean(data.val_codigo_tarjeta ?? true),
              val_foto: Boolean(data.val_foto ?? true)
            };
          } else {
            this.configContador = {
              val_tarjeta_profesional: Boolean(data.val_tarjeta_profesional ?? data.val_matricula ?? true),
              val_fecha_resolucion: Boolean(data.val_fecha_resolucion ?? true),
              val_resolucion: Boolean(data.val_resolucion ?? true),
              val_nombre: Boolean(data.val_nombre ?? data.val_nombres ?? true),
              val_cedula: Boolean(data.val_cedula ?? data.val_numero_identificacion ?? true),
              val_institucion: Boolean(data.val_institucion ?? true),
              val_expediente: Boolean(data.val_expediente ?? true),
              val_estado: Boolean(data.val_estado ?? true),
              val_codigo_tarjeta: Boolean(data.val_codigo_tarjeta ?? true),
              val_foto: Boolean(data.val_foto ?? true)
            };
          }
        }
        this.loading = false;
        this.cargarBranding();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar configuración del validador QR:', err);
        this.currentError = this.errorHandler.parseError(err, 'MS_3850_VALIDADOR_CONFIG', url);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private cargarBranding(): void {
    const tipoId = this.isSociedades ? 2 : 1;
    this.http.get<any>(`${API_BASE}/tarjetas/branding-credentials/info-published/${tipoId}?client_id=${this.clientId}`).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res[0] : res;
        if (data && (data.color_fondo || data.logo || data.patron)) {
          if (data.color_fondo) this.brandingColorFondo = data.color_fondo;
          if (data.color_letra) this.brandingColorLetra = data.color_letra;
          if (data.logo) this.brandingLogoUrl = data.logo;
          if (data.patron) this.brandingPatronUrl = data.patron;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  guardarConfiguracion(): void {
    this.mensajeExito = '';
    this.mensajeAdvertencia = '';
    this.currentError = null;

    if (!this.hasSelectedFields) {
      this.mensajeAdvertencia = 'Debe seleccionar al menos un campo visible para guardar la configuración del validador público.';
      return;
    }

    this.loading = true;

    const payload: any = {
      client_id: this.clientId,
      tipo_tarjeta: this.tipoTarjeta
    };

    if (this.isSociedades) {
      payload.val_numero_registro = this.configSociedad.val_numero_registro ? 1 : 0;
      payload.val_fecha_resolucion = this.configSociedad.val_fecha_resolucion ? 1 : 0;
      payload.val_expediente = this.configSociedad.val_expediente ? 1 : 0;
      payload.val_razon_social = this.configSociedad.val_razon_social ? 1 : 0;
      payload.val_nit = this.configSociedad.val_nit ? 1 : 0;
      payload.val_tipo_registro = this.configSociedad.val_tipo_registro ? 1 : 0;
      payload.val_resolucion = this.configSociedad.val_resolucion ? 1 : 0;
      payload.val_estado = this.configSociedad.val_estado ? 1 : 0;
      payload.val_codigo_tarjeta = this.configSociedad.val_codigo_tarjeta ? 1 : 0;
      payload.val_foto = this.configSociedad.val_foto ? 1 : 0;
    } else {
      payload.val_tarjeta_profesional = this.configContador.val_tarjeta_profesional ? 1 : 0;
      payload.val_fecha_resolucion = this.configContador.val_fecha_resolucion ? 1 : 0;
      payload.val_resolucion = this.configContador.val_resolucion ? 1 : 0;
      payload.val_nombre = this.configContador.val_nombre ? 1 : 0;
      payload.val_cedula = this.configContador.val_cedula ? 1 : 0;
      payload.val_institucion = this.configContador.val_institucion ? 1 : 0;
      payload.val_expediente = this.configContador.val_expediente ? 1 : 0;
      payload.val_estado = this.configContador.val_estado ? 1 : 0;
      payload.val_codigo_tarjeta = this.configContador.val_codigo_tarjeta ? 1 : 0;
      payload.val_foto = this.configContador.val_foto ? 1 : 0;
    }

    const url = `${API_BASE}/tarjetas/validador-qr/update-config?tipo_tarjeta=${this.tipoTarjeta}&client_id=${this.clientId}`;
    this.http.post(url, payload).subscribe({
      next: () => {
        const entidad = this.isSociedades ? 'Sociedades' : 'Contadores';
        this.mensajeExito = `Configuración del validador para ${entidad} guardada correctamente.`;
        this.loading = false;
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const contentArea = document.querySelector('.content-area');
        if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error('Error al guardar config de validador:', err);
        this.currentError = this.errorHandler.parseError(err, 'MS_3851_VALIDADOR_SAVE', url);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  volver(): void {
    this.router.navigate([this.isSociedades ? '/tarjetas-sociedades' : '/tarjetas-contadores']);
  }
}
