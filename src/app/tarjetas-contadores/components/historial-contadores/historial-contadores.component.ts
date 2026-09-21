import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TarjetaContador } from '../../tarjetas-contadores.component';

@Component({
  selector: 'app-historial-contadores',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="selectedTarjeta">
      <!-- TARJETA SUPERIOR RESUMEN DEL TITULAR -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-body p-4 d-flex align-items-center gap-3 flex-wrap">
          <div class="rounded-3 bg-light d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0" style="width: 70px; height: 70px; border: 1px solid #e2e8f0;">
            <img [src]="getFotoUrlFn(selectedTarjeta.foto)" alt="Fotografía" class="w-100 h-100 object-fit-cover" />
          </div>

          <div class="flex-grow-1 min-w-0">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
              <h5 class="fw-bold text-dark mb-0" style="font-size: 16px;">{{ selectedTarjeta.nombre_completo || selectedTarjeta.solicitante }}</h5>
              <div class="ms-auto d-flex align-items-center gap-2">
                <span class="text-secondary small me-1">Estado:</span>
                <span class="badge bg-success-subtle text-success border border-success border-opacity-25 px-3 py-1.5 fw-bold" style="font-size: 11px;">
                  {{ selectedTarjeta.estado_tarjeta || selectedTarjeta.tarjeta || 'Activa' }}
                </span>
              </div>
            </div>

            <div class="d-flex flex-wrap gap-3 text-secondary small" style="font-size: 12px;">
              <span>Identificación: <strong class="text-dark">{{ selectedTarjeta.documento }}</strong></span>
              <span>Matrícula: <strong class="text-dark">{{ selectedTarjeta.no_tarjeta || selectedTarjeta.matricula }}</strong></span>
              <span>Expediente: <strong class="text-dark">{{ selectedTarjeta.no_expd || selectedTarjeta.expediente }}</strong></span>
              <span *ngIf="selectedTarjeta.correo">Correo: <strong class="text-dark text-break">{{ selectedTarjeta.correo }}</strong></span>
              <span>Fecha emisión: <strong class="text-dark">{{ getFechaEmisionFn() }}</strong></span>
              <span *ngIf="selectedTarjeta.universidad">Universidad: <strong class="text-dark">{{ selectedTarjeta.universidad }}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- DOS COLUMNAS DE HISTORIAL -->
      <div class="row g-4 mb-4">
        <!-- Columna 1: Historial de estado -->
        <div class="col-md-6">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white py-3 border-bottom">
              <h5 class="card-title fw-bold mb-0 text-dark">Historial de estado</h5>
            </div>
            <div class="card-body p-4">
              <div *ngIf="selectedTarjetaHistorial && selectedTarjetaHistorial.estados && selectedTarjetaHistorial.estados.length > 0" class="d-flex flex-column gap-3">
                <div *ngFor="let estado of selectedTarjetaHistorial.estados" class="border-bottom pb-2.5 last-border-0">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="text-primary fw-bold" style="font-size: 14px;">• {{ estado.estado }}</span>
                  </div>
                  <div class="text-muted small ps-3">
                    {{ estado.fecha }} - {{ estado.descripcion }} <span *ngIf="estado.realizado_por" class="opacity-75">({{ estado.realizado_por }})</span>
                  </div>
                </div>
              </div>

              <div *ngIf="!selectedTarjetaHistorial" class="text-muted small py-3 text-center">
                <span class="spinner-border spinner-border-sm me-1"></span> Cargando historial de estado...
              </div>
              <div *ngIf="selectedTarjetaHistorial && (!selectedTarjetaHistorial.estados || selectedTarjetaHistorial.estados.length === 0)" class="text-muted small py-3 text-center">
                No hay registros de estado disponibles.
              </div>
            </div>
          </div>
        </div>

        <!-- Columna 2: Historial de lecturas del QR -->
        <div class="col-md-6">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white py-3 border-bottom">
              <h5 class="card-title fw-bold mb-0 text-dark">Historial de lecturas del QR</h5>
            </div>
            <div class="card-body p-4">
              <div *ngIf="selectedTarjetaHistorial && selectedTarjetaHistorial.lecturas && selectedTarjetaHistorial.lecturas.length > 0" class="d-flex flex-column gap-3">
                <div *ngFor="let lectura of selectedTarjetaHistorial.lecturas" class="border-bottom pb-2.5 last-border-0">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="text-dark fw-bold" style="font-size: 14px;">• Verificación pública exitosa</span>
                  </div>
                  <div class="text-muted small ps-3">
                    {{ lectura.fecha }} - {{ lectura.dispositivo || 'Navegador web' }} <span *ngIf="lectura.ip" class="opacity-75">({{ lectura.ip }})</span>
                  </div>
                </div>
              </div>

              <div *ngIf="!selectedTarjetaHistorial" class="text-muted small py-3 text-center">
                <span class="spinner-border spinner-border-sm me-1"></span> Cargando lecturas del QR...
              </div>
              <div *ngIf="selectedTarjetaHistorial && (!selectedTarjetaHistorial.lecturas || selectedTarjetaHistorial.lecturas.length === 0)" class="text-muted small py-3 text-center">
                No hay registros de lecturas del QR.
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `
})
export class HistorialContadoresComponent {
  @Input() selectedTarjeta: TarjetaContador | null = null;
  @Input() selectedTarjetaHistorial: any = null;
  @Input() getFotoUrlFn!: (url?: string | null) => string;
  @Input() getFechaEmisionFn!: () => string;
}
