import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-emision-contadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
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
                Tipo de solicitud
              </label>
              <select id="individualIssueType" class="form-select" aria-label="Tipo de solicitud" [ngModel]="tipoSolicitud" (ngModelChange)="tipoSolicitudChange.emit($event)">
                <option value="">Seleccionar tipo</option>
                <option value="primeraVez">Primera vez</option>
                <option value="duplicado">Duplicado</option>
                <option value="sustitucion">Sustitución</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="individualIssueIdentification" class="form-label fw-semibold text-secondary small mb-1">
                Número de identificación
              </label>
              <input type="text" id="individualIssueIdentification" inputmode="numeric" maxlength="20" class="form-control" placeholder="Ej. 1152226268" [ngModel]="nuevaIdentificacion" (ngModelChange)="nuevaIdentificacionChange.emit($event)" (keyup.enter)="consultarMatricula.emit()">
            </div>
            <button type="button" class="btn btn-primary w-100 fw-semibold" id="individualIssueSearch" (click)="consultarMatricula.emit()" [disabled]="cargandoBusqueda">
              <span *ngIf="!cargandoBusqueda"><span class="fa fa-search me-1"></span> Consultar matrícula</span>
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
              <span class="fa fa-id-card-o fs-1 d-block mb-3 text-secondary opacity-50"></span>
              <p class="mb-1 fw-semibold text-dark">Sin vista previa cargada</p>
              <small class="text-muted">Ingrese una identificación a la izquierda y presione <strong>Consultar matrícula</strong>.</small>
            </div>

            <!-- Previsualización de Branding al consultar -->
            <div *ngIf="busquedaRealizada && datosConsulta">
              <div
                class="branding-preview-card mb-4"
                [style.--branding-card-background]="brandingColorFondo"
                [style.--branding-card-text]="brandingColorLetra"
                [style.--branding-card-font]="brandingFuenteLetra"
                [style.--branding-card-pattern]="brandingPatronUrl ? 'url(' + brandingPatronUrl + ')' : null"
              >
                <div class="branding-preview-stack">
                  <!-- TARJETA FRENTE -->
                  <article class="branding-id-card" aria-label="Vista previa del frente de la tarjeta">
                    <div class="branding-card-head">
                      <div class="branding-logo-badge" *ngIf="brandingLogoUrl">
                        <img [src]="brandingLogoUrl" class="branding-preview-logo branding-card-logo" alt="Logo de la credencial" />
                      </div>
                      <div class="branding-logo-placeholder" *ngIf="!brandingLogoUrl">
                        <span class="fa fa-shield me-1"></span> JUNTA CENTRAL DE CONTADORES
                      </div>
                      <span class="branding-card-status">Emitida</span>
                    </div>

                    <div class="branding-card-front-body">
                      <img class="branding-card-photo" [src]="getFotoUrlFn(datosConsulta.foto)" alt="Fotografía del contador" />
                      <div class="branding-card-number">
                        <span class="branding-card-label">Tarjeta profesional</span>
                        <strong class="branding-card-value">{{ datosConsulta.matricula }}</strong>
                      </div>
                    </div>

                    <div class="branding-card-front-footer">
                      <div>
                        <span class="branding-card-label">Fecha Res. Inscripción</span>
                        <strong class="branding-card-value">{{ datosConsulta.fecha_resolucion || '15 - Sep - 2026' }}</strong>
                      </div>
                      <div>
                        <span class="branding-card-label">N. Expediente</span>
                        <strong class="branding-card-value">{{ datosConsulta.expediente || 'Pendiente' }}</strong>
                      </div>
                    </div>
                  </article>

                  <!-- TARJETA REVERSO -->
                  <article class="branding-id-card" aria-label="Vista previa del reverso de la tarjeta">
                    <div class="branding-card-head back">
                      <div class="branding-logo-badge" *ngIf="brandingLogoUrl">
                        <img [src]="brandingLogoUrl" class="branding-preview-logo branding-card-logo" alt="Logo de la credencial" />
                      </div>
                      <div class="branding-logo-placeholder" *ngIf="!brandingLogoUrl">
                        <span class="fa fa-shield me-1"></span> JUNTA CENTRAL DE CONTADORES
                      </div>
                    </div>

                    <div class="branding-card-back-details">
                      <div>
                        <span class="branding-card-label">Nombre y apellido</span>
                        <strong class="branding-card-value">{{ datosConsulta.solicitante }}</strong>
                      </div>
                      <div>
                        <span class="branding-card-label">Cédula de ciudadanía</span>
                        <strong class="branding-card-value">{{ datosConsulta.documento }}</strong>
                      </div>
                      <div>
                        <span class="branding-card-label">Institución de Educación Superior</span>
                        <strong class="branding-card-value">{{ datosConsulta.universidad || 'Universidad Nacional de Colombia' }}</strong>
                      </div>
                      <div>
                        <span class="branding-card-label">Res. Inscripción</span>
                        <strong class="branding-card-value">{{ datosConsulta.resolucion || '0001' }}</strong>
                      </div>
                    </div>
                  </article>
                </div>
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

  @Input() brandingColorFondo: string = '#14275f';
  @Input() brandingColorLetra: string = '#ffffff';
  @Input() brandingFuenteLetra: string = 'Arial, sans-serif';
  @Input() brandingLogoUrl: string | null = null;
  @Input() brandingPatronUrl: string | null = null;
  @Input() getFotoUrlFn!: (url?: string | null) => string;

  @Output() consultarMatricula = new EventEmitter<void>();
  @Output() confirmarEmision = new EventEmitter<void>();
}
