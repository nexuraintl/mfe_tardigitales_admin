import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TarjetaCredencialComponent, CredencialDatos, CredencialBranding } from '../../../shared/components/tarjeta-credencial/tarjeta-credencial.component';
import { NxAlertComponent } from '../../../shared/components/alert/alert.component';
import { NxFieldErrorComponent } from '../../../shared/components/field-error/field-error.component';

@Component({
  selector: 'app-form-emision-sociedades',
  standalone: true,
  imports: [CommonModule, FormsModule, TarjetaCredencialComponent, NxAlertComponent, NxFieldErrorComponent],
  template: `
    <!-- Alertas del Sistema Superiores con Auto-Scroll -->
    <nx-alert 
      *ngIf="mensajeError" 
      [type]="tipoAlerta || 'warning'" 
      [message]="mensajeError" 
      [duration]="0"
      [autoScroll]="true"
      (onClose)="cerrarError()"
    ></nx-alert>
    <nx-alert 
      *ngIf="mensajeExito" 
      type="success" 
      [message]="mensajeExito" 
      [duration]="5000"
      [autoScroll]="true"
      (onClose)="cerrarExito()"
    ></nx-alert>

    <div class="branding-layout">
      <!-- Columna Izquierda: Consulta de NIT -->
      <div>
        <section class="card shadow-sm border-0">
          <div class="card-header bg-white py-3 border-bottom">
            <h5 class="card-title fw-bold mb-0 text-dark">
              Consulta de NIT de sociedad
            </h5>
          </div>
          <div class="card-body p-4">
            <p class="text-muted small mb-3">Ingrese el NIT de la sociedad para consultar el registro oficial y generar la vista previa de la tarjeta.</p>
            <div class="mb-3">
              <label for="societyIssueType" class="form-label fw-semibold text-secondary small mb-1">
                Tipo de solicitud <span class="text-secondary">*</span>
              </label>
              <select id="societyIssueType" class="form-select" [class.is-invalid]="!!errorTipoSolicitud" aria-label="Tipo de solicitud" [ngModel]="tipoSolicitud" (ngModelChange)="onTipoChange($event)">
                <option value="">Seleccionar tipo</option>
                <option value="primeraVez">Primera vez</option>
                <option value="duplicado">Duplicado</option>
                <option value="modificacion">Modificación</option>
              </select>
              <nx-field-error [error]="errorTipoSolicitud"></nx-field-error>
            </div>
            <div class="mb-3">
              <label for="societyIssueNit" class="form-label fw-semibold text-secondary small mb-1">
                NIT <span class="text-secondary">*</span>
              </label>
              <input type="text" id="societyIssueNit" maxlength="20" class="form-control" [class.is-invalid]="!!errorIdentificacion" placeholder="Ej. 900540865-5" [ngModel]="nuevaIdentificacion" (keypress)="permitirNit($event)" (ngModelChange)="onIdentificacionChange($event)" (keyup.enter)="onBuscarClick()">
              <nx-field-error [error]="errorIdentificacion"></nx-field-error>
            </div>
            <button type="button" class="btn btn-primary w-100 fw-semibold" id="societyIssueSearch" (click)="onBuscarClick()" [disabled]="cargandoBusqueda || (nuevaIdentificacion.length > 0 && getDigitosNit(nuevaIdentificacion).length < 3)">
              <span *ngIf="!cargandoBusqueda"><span class="fa fa-search me-1"></span> Consultar NIT</span>
              <span *ngIf="cargandoBusqueda"><span class="spinner-border spinner-border-sm me-1"></span> Buscando...</span>
            </button>
          </div>
        </section>
      </div>

      <!-- Columna Derecha: Vista Previa de la Tarjeta -->
      <div>
        <section class="card shadow-sm border-0">
          <div class="card-header bg-white py-3 border-bottom">
            <h5 class="card-title fw-bold mb-0 text-dark">
              Vista previa de la tarjeta
            </h5>
          </div>
          <div class="card-body p-4">
            <!-- Estado sin vista previa cargada (inicial o sin datos encontrados) -->
            <div *ngIf="!datosConsulta" class="text-center py-5 text-muted">
              <span class="fa fa-building-o fs-1 d-block mb-3 text-secondary opacity-50"></span>
              <p class="mb-1 fw-semibold text-dark">Sin vista previa cargada</p>
              <small class="text-muted">Ingrese un NIT a la izquierda y presione <strong>Consultar NIT</strong>.</small>
            </div>

            <!-- Previsualización al consultar -->
            <div *ngIf="datosConsulta">
              <div class="branding-preview-card mb-4">
                <app-tarjeta-credencial
                  tipo="sociedad"
                  vista="ambas"
                  layout="stack"
                  [datos]="credencialDatos"
                  [branding]="credencialBranding"
                ></app-tarjeta-credencial>
              </div>

              <!-- BOTÓN DE CONFIRMACIÓN -->
              <div *ngIf="!mensajeExito" class="d-flex justify-content-end">
                <button type="button" id="societyIssueConfirm" class="btn btn-success px-4 py-2.5 fw-bold shadow-sm" (click)="confirmarEmision.emit()" [disabled]="loading">
                  <span *ngIf="!loading"><span class="fa fa-check me-1"></span> Confirmar emisión</span>
                  <span *ngIf="loading"><span class="spinner-border spinner-border-sm me-1"></span> Procesando...</span>
                </button>
              </div>
              
              <div *ngIf="mensajeExito" class="alert alert-success mt-3 mb-0">
                <span class="fa fa-check-circle me-1"></span> {{ mensajeExito }}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `
})
export class FormEmisionSociedadesComponent {
  @Input() tipoSolicitud: string = '';
  @Output() tipoSolicitudChange = new EventEmitter<string>();

  @Input() nuevaIdentificacion: string = '';
  @Output() nuevaIdentificacionChange = new EventEmitter<string>();

  @Input() errorTipoSolicitud: string = '';
  @Input() errorIdentificacion: string = '';

  onTipoChange(val: string): void {
    this.tipoSolicitud = val;
    this.tipoSolicitudChange.emit(val);
    if (val) {
      this.errorTipoSolicitud = '';
    }
  }

  getDigitosNit(val: string): string {
    return (val || '').replace(/\D/g, '');
  }

  permitirNit(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
      return;
    }
    // Permitir dígitos del 0 al 9 y un único guion
    if (!/^[0-9-]$/.test(event.key)) {
      event.preventDefault();
      return;
    }
    if (event.key === '-' && (this.nuevaIdentificacion || '').includes('-')) {
      event.preventDefault();
    }
  }

  onIdentificacionChange(val: string): void {
    let clean = (val || '').replace(/[^\d-]/g, '');
    const parts = clean.split('-');
    if (parts.length > 2) {
      clean = parts[0] + '-' + parts.slice(1).join('');
    }
    this.nuevaIdentificacion = clean;
    this.nuevaIdentificacionChange.emit(clean);
    const digitsOnly = this.getDigitosNit(clean);
    if (clean.length > 0 && digitsOnly.length < 3) {
      this.errorIdentificacion = 'El NIT debe contener al menos 3 dígitos.';
    } else {
      this.errorIdentificacion = '';
    }
    if (this.mensajeError) {
      this.mensajeError = '';
      this.mensajeErrorChange.emit('');
    }
  }

  onBuscarClick(): void {
    const clean = (this.nuevaIdentificacion || '').replace(/[^\d-]/g, '').trim();
    const digitsOnly = this.getDigitosNit(clean);
    if (!digitsOnly) {
      this.errorIdentificacion = 'Ingrese el NIT.';
      return;
    }
    if (digitsOnly.length < 3) {
      this.errorIdentificacion = 'El NIT debe contener al menos 3 dígitos.';
      return;
    }
    this.errorIdentificacion = '';
    this.consultarSociedad.emit();
  }

  @Input() tipoAlerta: 'warning' | 'danger' | 'error' | 'success' | 'info' = 'warning';
  @Input() cargandoBusqueda: boolean = false;
  @Input() busquedaRealizada: boolean = false;
  @Input() datosConsulta: any = null;
  @Input() mensajeError: string = '';
  @Output() mensajeErrorChange = new EventEmitter<string>();
  @Input() mensajeExito: string = '';
  @Output() mensajeExitoChange = new EventEmitter<string>();
  @Input() loading: boolean = false;

  cerrarError(): void {
    this.mensajeError = '';
    this.mensajeErrorChange.emit('');
  }

  cerrarExito(): void {
    this.mensajeExito = '';
    this.mensajeExitoChange.emit('');
  }

  @Input() brandingColorFondo: string = '#134567';
  @Input() brandingColorLetra: string = '#ffffff';
  @Input() brandingLogoUrl: string | null = null;
  @Input() brandingPatronUrl: string | null = null;
  @Input() getFotoUrlFn!: (url?: string | null) => string;

  @Output() consultarSociedad = new EventEmitter<void>();
  @Output() confirmarEmision = new EventEmitter<void>();

  get credencialDatos(): CredencialDatos {
    if (!this.datosConsulta) return {};
    const d = this.datosConsulta;
    const razonSocial = d.razon_social || d.solicitante || '';
    const nit = d.nit || d.documento || '';
    const matricula = d.inscripcion || d.matricula || (d.no_tarjeta ? String(d.no_tarjeta) : 'Pendiente');
    const expediente = (d.expediente !== undefined && d.expediente !== null && d.expediente !== 0) ? d.expediente : (d.no_expd ?? '');
    const resolucion = d.resolucion || '';
    const fechaRes = d.fecha_resolucion || '';
    let tipoSoc = d.tipo_sociedad || d.universidad || 'Sociedad de Contadores';
    if (typeof tipoSoc === 'string') {
      tipoSoc = tipoSoc.replace(/Sociedad de Contadores Públicos/gi, 'Sociedad de Contadores');
    }

    return {
      matricula: matricula,
      fecha_resolucion: fechaRes,
      resolucion: resolucion,
      expediente: expediente,
      solicitante: razonSocial,
      documento: nit,
      universidad: tipoSoc,
      foto: this.getFotoUrlFn ? this.getFotoUrlFn(d.foto) : d.foto,
      estado: d.estado || 'Emitida'
    };
  }

  get credencialBranding(): CredencialBranding {
    return {
      color_fondo: this.brandingColorFondo,
      color_letra: this.brandingColorLetra,
      logo_url: this.brandingLogoUrl,
      patron_url: this.brandingPatronUrl
    };
  }
}
