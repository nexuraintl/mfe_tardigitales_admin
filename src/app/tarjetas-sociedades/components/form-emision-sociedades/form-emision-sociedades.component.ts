import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TarjetaCredencialComponent, CredencialDatos, CredencialBranding } from '../../../shared/components/tarjeta-credencial/tarjeta-credencial.component';

@Component({
  selector: 'app-form-emision-sociedades',
  standalone: true,
  imports: [CommonModule, FormsModule, TarjetaCredencialComponent],
  template: `
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
                Tipo de solicitud
              </label>
              <select id="societyIssueType" class="form-select" aria-label="Tipo de solicitud" [ngModel]="tipoSolicitud" (ngModelChange)="tipoSolicitudChange.emit($event)">
                <option value="">Seleccionar tipo</option>
                <option value="primeraVez">Primera vez</option>
                <option value="duplicado">Duplicado</option>
                <option value="sustitucion">Sustitución</option>
                <option value="modificacion">Modificación</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="societyIssueNit" class="form-label fw-semibold text-secondary small mb-1">
                NIT de la sociedad
              </label>
              <input type="text" id="societyIssueNit" inputmode="numeric" maxlength="20" class="form-control" placeholder="Ej. 900123456" [ngModel]="nuevaIdentificacion" (ngModelChange)="nuevaIdentificacionChange.emit($event)" (keyup.enter)="consultarSociedad.emit()">
            </div>
            <button type="button" class="btn btn-primary w-100 fw-semibold" id="societyIssueSearch" (click)="consultarSociedad.emit()" [disabled]="cargandoBusqueda">
              <span *ngIf="!cargandoBusqueda"><span class="fa fa-search me-1"></span> Consultar NIT</span>
              <span *ngIf="cargandoBusqueda"><span class="spinner-border spinner-border-sm me-1"></span> Buscando...</span>
            </button>
            <div *ngIf="mensajeError" class="alert alert-danger py-2 px-3 small mt-3 mb-0">{{ mensajeError }}</div>
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
            <!-- Estado Inicial sin consulta realizada -->
            <div *ngIf="!busquedaRealizada" class="text-center py-5 text-muted">
              <span class="fa fa-building-o fs-1 d-block mb-3 text-secondary opacity-50"></span>
              <p class="mb-1 fw-semibold text-dark">Sin vista previa cargada</p>
              <small class="text-muted">Ingrese un NIT a la izquierda y presione <strong>Consultar NIT</strong>.</small>
            </div>

            <!-- Previsualización al consultar -->
            <div *ngIf="busquedaRealizada && datosConsulta">
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
  @Input() tipoSolicitud: string = 'primeraVez';
  @Output() tipoSolicitudChange = new EventEmitter<string>();

  @Input() nuevaIdentificacion: string = '';
  @Output() nuevaIdentificacionChange = new EventEmitter<string>();

  @Input() cargandoBusqueda: boolean = false;
  @Input() busquedaRealizada: boolean = false;
  @Input() datosConsulta: any = null;
  @Input() mensajeError: string = '';
  @Input() mensajeExito: string = '';
  @Input() loading: boolean = false;

  @Input() brandingColorFondo: string = '#134567';
  @Input() brandingColorLetra: string = '#ffffff';
  @Input() brandingFuenteLetra: string = 'Arial, sans-serif';
  @Input() brandingLogoUrl: string | null = null;
  @Input() brandingPatronUrl: string | null = null;
  @Input() getFotoUrlFn!: (url?: string | null) => string;

  @Output() consultarSociedad = new EventEmitter<void>();
  @Output() confirmarEmision = new EventEmitter<void>();

  get credencialDatos(): CredencialDatos {
    if (!this.datosConsulta) return {};
    return {
      matricula: this.datosConsulta.inscripcion || 'Pendiente',
      fecha_resolucion: this.datosConsulta.fecha_resolucion || '15 - Sep - 2026',
      resolucion: this.datosConsulta.resolucion || '1042',
      expediente: this.datosConsulta.expediente || '884120',
      solicitante: this.datosConsulta.razon_social,
      documento: this.datosConsulta.nit,
      universidad: this.datosConsulta.tipo_sociedad || 'Sociedad de Contadores Públicos',
      foto: this.getFotoUrlFn ? this.getFotoUrlFn(this.datosConsulta.foto) : this.datosConsulta.foto,
      estado: 'Emitida'
    };
  }

  get credencialBranding(): CredencialBranding {
    return {
      color_fondo: this.brandingColorFondo,
      color_letra: this.brandingColorLetra,
      fuente_letra: this.brandingFuenteLetra,
      logo_url: this.brandingLogoUrl,
      patron_url: this.brandingPatronUrl
    };
  }
}
