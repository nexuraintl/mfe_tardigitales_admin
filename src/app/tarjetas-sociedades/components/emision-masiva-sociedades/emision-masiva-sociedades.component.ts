import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-emision-masiva-sociedades',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card shadow-sm border-0 mb-4 col-lg-8 mx-auto">
      <div class="card-header bg-white py-3 border-bottom">
        <h5 class="card-title fw-bold mb-0 text-dark">
          Carga masiva de sociedades por archivo CSV
        </h5>
      </div>
      <div class="card-body p-4">
        <ol class="text-muted small mb-4">
          <li class="mb-2">Descargue la plantilla y complete la columna <code>nit</code> por fila.</li>
          <li>Suba el archivo: el sistema consultará los registros de sociedades y emitirá las credenciales automáticamente.</li>
        </ol>

        <div class="mb-4">
          <button type="button" class="btn btn-outline-secondary btn-sm" (click)="descargarPlantillaCSV.emit()">
            <span class="fa fa-download me-1"></span> Descargar plantilla CSV
          </button>
        </div>

        <div class="mb-3">
          <label for="bulkSocietyFile" class="form-label fw-semibold">Seleccionar archivo CSV</label>
          <div class="input-group">
            <input type="file" id="bulkSocietyFile" accept=".csv,.txt,text/csv,text/plain" class="form-control" (change)="seleccionarArchivo.emit($event)">
            <button type="button" class="btn btn-primary" (click)="procesarEmisionMasiva.emit()">
              <span class="fa fa-upload me-1"></span> Procesar
            </button>
          </div>
        </div>

        <div *ngIf="bulkResultText" class="alert alert-info mt-3 mb-0">
          {{ bulkResultText }}
        </div>
      </div>
    </div>
  `
})
export class EmisionMasivaSociedadesComponent {
  @Input() bulkResultText: string = '';
  @Output() descargarPlantillaCSV = new EventEmitter<void>();
  @Output() seleccionarArchivo = new EventEmitter<Event>();
  @Output() procesarEmisionMasiva = new EventEmitter<void>();
}
