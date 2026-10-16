import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TarjetaCredencialComponent, CredencialDatos, CredencialBranding } from '../../../shared/components/tarjeta-credencial/tarjeta-credencial.component';
import { NxAlertComponent } from '../../../shared/components/alert/alert.component';
import { NxFieldErrorComponent } from '../../../shared/components/field-error/field-error.component';

@Component({
  selector: 'app-form-emision-contadores',
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
      <!-- Columna Izquierda: Consulta de Matrícula -->
      <div>
        <section class="card shadow-sm border-0">
          <div class="card-header bg-white py-3 border-bottom">
            <h5 class="card-title fw-bold mb-0 text-dark">
              Consulta de matrícula
            </h5>
          </div>
          <div class="card-body p-4">
            <p class="text-muted small mb-3">Ingrese el número de identificación del contador para consultar el registro oficial y generar la vista previa de la tarjeta.</p>
            <div class="mb-3">
              <label for="individualIssueType" class="form-label fw-semibold text-secondary small mb-1">
                Tipo de solicitud <span class="text-secondary">*</span>
              </label>
              <select id="individualIssueType" class="form-select" [class.is-invalid]="!!errorTipoSolicitud" aria-label="Tipo de solicitud" [ngModel]="tipoSolicitud" (ngModelChange)="onTipoChange($event)">
                <option value="">Seleccionar tipo</option>
                <option value="primeraVez">Primera vez</option>
                <option value="duplicado">Duplicado</option>
                <option value="sustitucion">Sustitución</option>
              </select>
              <nx-field-error [error]="errorTipoSolicitud"></nx-field-error>
            </div>
            <div class="mb-3">
              <label for="individualIssueIdentification" class="form-label fw-semibold text-secondary small mb-1">
                Número de identificación <span class="text-secondary">*</span>
              </label>
              <input type="text" id="individualIssueIdentification" inputmode="numeric" maxlength="20" class="form-control" [class.is-invalid]="!!errorIdentificacion" placeholder="Ej. 1152226268" [ngModel]="nuevaIdentificacion" (keypress)="permitirSoloNumeros($event)" (ngModelChange)="onIdentificacionChange($event)" (keyup.enter)="onBuscarClick()">
              <nx-field-error [error]="errorIdentificacion"></nx-field-error>
            </div>
            <button type="button" class="btn btn-primary w-100 fw-semibold" id="individualIssueSearch" (click)="onBuscarClick()" [disabled]="cargandoBusqueda || (nuevaIdentificacion.length > 0 && nuevaIdentificacion.length < 3)">
              <span *ngIf="!cargandoBusqueda"><span class="fa fa-search me-1"></span> Consultar matrícula</span>
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
              <span class="fa fa-id-card-o fs-1 d-block mb-3 text-secondary opacity-50"></span>
              <p class="mb-1 fw-semibold text-dark">Sin vista previa cargada</p>
              <small class="text-muted">Ingrese una identificación a la izquierda y presione <strong>Consultar matrícula</strong>.</small>
            </div>

            <!-- Previsualización de Branding al consultar -->
            <div *ngIf="datosConsulta">
              <div class="branding-preview-card mb-4">
                <app-tarjeta-credencial
                  tipo="contador"
                  vista="ambas"
                  layout="stack"
                  [datos]="credencialDatos"
                  [branding]="credencialBranding"
                ></app-tarjeta-credencial>
              </div>

              <!-- BOTÓN DE CONFIRMACIÓN -->
              <div *ngIf="!mensajeExito" class="d-flex justify-content-end">
                <button type="button" id="individualIssueConfirm" class="btn btn-success px-4 py-2.5 fw-bold shadow-sm" (click)="confirmarEmision.emit()" [disabled]="loading">
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
export class FormEmisionContadoresComponent {
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

  permitirSoloNumeros(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
      return;
    }
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onIdentificacionChange(val: string): void {
    const clean = (val || '').replace(/\D/g, '');
    this.nuevaIdentificacion = clean;
    this.nuevaIdentificacionChange.emit(clean);
    if (clean.length > 0 && clean.length < 3) {
      this.errorIdentificacion = 'El número de identificación debe contener al menos 3 dígitos.';
    } else {
      this.errorIdentificacion = '';
    }
    if (this.mensajeError) {
      this.mensajeError = '';
      this.mensajeErrorChange.emit('');
    }
  }

  onBuscarClick(): void {
    const clean = (this.nuevaIdentificacion || '').replace(/\D/g, '').trim();
    if (!clean) {
      this.errorIdentificacion = 'Ingrese el número de identificación.';
      return;
    }
    if (clean.length < 3) {
      this.errorIdentificacion = 'El número de identificación debe contener al menos 3 dígitos.';
      return;
    }
    this.errorIdentificacion = '';
    this.consultarMatricula.emit();
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

  @Input() brandingColorFondo: string = '#14275f';
  @Input() brandingColorLetra: string = '#ffffff';
  @Input() brandingLogoUrl: string | null = null;
  @Input() brandingPatronUrl: string | null = null;
  @Input() getFotoUrlFn!: (url?: string | null) => string;

  @Output() consultarMatricula = new EventEmitter<void>();
  @Output() confirmarEmision = new EventEmitter<void>();

  get credencialDatos(): CredencialDatos {
    if (!this.datosConsulta) return {};
    return {
      matricula: this.datosConsulta.matricula,
      fecha_resolucion: this.datosConsulta.fecha_resolucion || '15 - Sep - 2026',
      resolucion: this.datosConsulta.resolucion || '0001',
      expediente: this.datosConsulta.expediente || 'Pendiente',
      solicitante: this.datosConsulta.solicitante,
      documento: this.datosConsulta.documento,
      universidad: this.datosConsulta.universidad || 'Universidad Nacional de Colombia',
      foto: this.getFotoUrlFn ? this.getFotoUrlFn(this.datosConsulta.foto) : this.datosConsulta.foto,
      estado: 'Emitida'
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
