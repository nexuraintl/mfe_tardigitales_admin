import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-emision-masiva-contadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="row g-4">
      <!-- Columna Izquierda: Guía de Uso y Descarga de Plantilla -->
      <div class="col-lg-5 col-xl-5">
        <section class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white py-3 border-bottom">
            <h5 class="card-title fw-bold mb-0 text-dark">
              1. Formato y plantilla CSV
            </h5>
          </div>
          <div class="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <p class="text-muted small mb-3">
                Siga estos pasos para preparar el archivo con los números de identificación de los contadores a emitir:
              </p>

              <div class="d-flex flex-column gap-3 mb-4">
                <div class="d-flex align-items-start gap-3">
                  <span class="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-1 fw-bold">1</span>
                  <div class="small text-secondary">
                    Descargue la plantilla oficial en formato CSV haciendo clic en el botón inferior.
                  </div>
                </div>
                <div class="d-flex align-items-start gap-3">
                  <span class="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-1 fw-bold">2</span>
                  <div class="small text-secondary">
                    Abra el archivo y complete la columna <strong class="text-dark">numero_documento</strong> agregando la identificación por fila sin puntos ni comas (ej. <code>1012345678</code>).
                  </div>
                </div>
                <div class="d-flex align-items-start gap-3">
                  <span class="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-1 fw-bold">3</span>
                  <div class="small text-secondary">
                    Guarde el archivo con codificación UTF-8 (extensión <code>.csv</code> o <code>.txt</code>) y súbalo en la sección de procesamiento.
                  </div>
                </div>
              </div>

              <div class="info-block-box mb-4">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span class="fa fa-info-circle text-primary"></span>
                  <span class="fw-semibold text-dark small">Especificaciones de la plantilla</span>
                </div>
                <ul class="text-muted small mb-0 ps-3">
                  <li>Encabezado obligatorio: <code>numero_documento</code></li>
                  <li>Formato admitido: Archivo plano delimitado por comas</li>
                  <li>Codificación requerida: UTF-8</li>
                </ul>
              </div>
            </div>

            <div>
              <button type="button" class="btn btn-outline-secondary w-100 fw-semibold py-2" (click)="descargarPlantillaCSV.emit()">
                <span class="fa fa-download me-2"></span> Descargar plantilla CSV
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- Columna Derecha: Carga de Archivo y Procesamiento -->
      <div class="col-lg-7 col-xl-7">
        <section class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white py-3 border-bottom">
            <h5 class="card-title fw-bold mb-0 text-dark">
              2. Carga y emisión masiva
            </h5>
          </div>
          <div class="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <p class="text-muted small mb-3">
                Seleccione el archivo preparado para validar las matrículas y emitir automáticamente las credenciales digitales.
              </p>

              <div class="mb-3">
                <label for="bulkCounterTramite" class="form-label fw-semibold text-secondary small mb-1">
                  Tipo de trámite del lote
                </label>
                <select
                  id="bulkCounterTramite"
                  class="form-select"
                  [ngModel]="tipoTramite"
                  (ngModelChange)="tipoTramiteChange.emit($event)"
                >
                  <option value="primeraVez">Primera vez</option>
                  <option value="duplicado">Duplicado</option>
                  <option value="sustitucion">Sustitución</option>
                </select>
                <small class="text-muted" style="font-size: 11px;">
                  Define el trámite con el que se consultará cada documento en los servicios de la JCC.
                </small>
              </div>

              <div class="mb-3">
                <label for="bulkIssueFile" class="form-label fw-semibold text-secondary small mb-1">
                  Seleccionar archivo (.csv, .txt)
                </label>
                <input
                  type="file"
                  id="bulkIssueFile"
                  accept=".csv,.txt,text/csv,text/plain"
                  class="form-control"
                  (change)="seleccionarArchivo.emit($event)"
                />
              </div>

              <!-- Resumen del archivo seleccionado -->
              <div *ngIf="archivoSeleccionado" class="info-block-box d-flex align-items-center justify-content-between mb-3">
                <div class="d-flex align-items-center gap-3 min-w-0">
                  <div class="p-2 bg-primary-subtle text-primary rounded-2 flex-shrink-0">
                    <span class="fa fa-file-text-o fs-5"></span>
                  </div>
                  <div class="min-w-0">
                    <div class="fw-semibold text-dark small text-truncate">{{ archivoSeleccionado.name }}</div>
                    <span class="text-muted small">{{ formatFileSize(archivoSeleccionado.size) }}</span>
                  </div>
                </div>
                <span class="badge bg-success-subtle flex-shrink-0">Listo para procesar</span>
              </div>

              <!-- Alerta de resultado del procesamiento -->
              <div *ngIf="bulkResultText" class="mt-3">
                <div *ngIf="isError" class="alert alert-danger d-flex align-items-start gap-2 mb-0 py-2.5 px-3 small" role="alert">
                  <span class="fa fa-exclamation-circle text-danger mt-1"></span>
                  <div class="text-break">{{ bulkResultText }}</div>
                </div>
                <div *ngIf="!isError" class="alert alert-success d-flex align-items-start gap-2 mb-0 py-2.5 px-3 small" role="alert">
                  <span class="fa fa-check-circle text-success mt-1"></span>
                  <div class="text-break">{{ bulkResultText }}</div>
                </div>
              </div>
            </div>

            <div class="pt-4">
              <button
                type="button"
                class="btn btn-primary w-100 fw-semibold py-2"
                (click)="procesarEmisionMasiva.emit()"
                [disabled]="!archivoSeleccionado"
              >
                <span class="fa fa-upload me-2"></span> Procesar emisión masiva
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `
})
export class EmisionMasivaContadoresComponent {
  @Input() bulkResultText: string = '';
  @Input() bulkResultClass: string = 'bulk-result';
  @Input() archivoSeleccionado: File | null = null;
  @Input() tipoTramite: string = 'primeraVez';
  @Output() tipoTramiteChange = new EventEmitter<string>();
  @Output() descargarPlantillaCSV = new EventEmitter<void>();
  @Output() seleccionarArchivo = new EventEmitter<Event>();
  @Output() procesarEmisionMasiva = new EventEmitter<void>();

  get isError(): boolean {
    return this.bulkResultClass?.includes('error') || false;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
