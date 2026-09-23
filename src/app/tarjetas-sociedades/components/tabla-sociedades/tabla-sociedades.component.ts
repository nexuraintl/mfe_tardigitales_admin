import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableColumn, TarjetaSociedad } from '../../tarjetas-sociedades.component';
import { NxAlertComponent } from '../../../shared/components/alert/alert.component';
import { AppError } from '../../../core/services/error-handler.service';
import { formatTipoSolicitud, getEstadoTarjetaBadgeClass } from '../../../core/constants/tarjetas.constants';

@Component({
  selector: 'app-tabla-sociedades',
  standalone: true,
  imports: [CommonModule, FormsModule, NxAlertComponent],
  template: `
    <!-- Alertas del Sistema -->
    <nx-alert [error]="currentError" (onClose)="currentErrorChange.emit(null)"></nx-alert>
    <nx-alert *ngIf="mensajeExito" type="success" [message]="mensajeExito" (onClose)="mensajeExitoChange.emit('')"></nx-alert>

    <!-- Tabla de Datos 100% Nativa Angular -->
    <div class="nx-table-card shadow-sm mb-4">
      <div class="card-header bg-white py-3 px-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 class="card-title fw-bold mb-0 text-dark">
            Solicitudes de tarjetas para sociedades
          </h5>
          <small class="text-muted">Resultados del módulo de persona jurídica.</small>
        </div>
      </div>

      <!-- Barra de Herramientas: Buscador y Selector de Registros -->
      <div class="nx-table-toolbar">
        <div class="nx-table-search-wrap">
          <input 
            type="text" 
            class="nx-table-search-input" 
            placeholder="Escriba para filtrar..." 
            [ngModel]="searchQuery" 
            (ngModelChange)="onSearchQueryChange($event)"
          >
          <button 
            *ngIf="searchQuery" 
            type="button" 
            class="btn btn-sm btn-link text-muted position-absolute end-0 me-2 p-0 text-decoration-none"
            (click)="clearSearch()"
            data-nx-tooltip="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <span class="fa fa-times"></span>
          </button>
        </div>

        <div class="d-flex align-items-center gap-2">
          <!-- Selector Dinámico de Columnas -->
          <div class="columns-selector-host">
            <button 
              type="button" 
              class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" 
              (click)="toggleColumnsMenu($event)"
              aria-haspopup="true"
              [attr.aria-expanded]="isColumnsMenuOpen"
              title="Mostrar u ocultar columnas"
            >
              <span class="fa fa-columns"></span>
              <span>Columnas</span>
              <span class="badge bg-secondary text-white">{{ visibleColumnsCount }}</span>
            </button>

            <div class="columns-selector-menu shadow" [class.open]="isColumnsMenuOpen" (click)="$event.stopPropagation()">
              <div class="columns-selector-header">
                <strong>Columnas visibles</strong>
                <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none small text-primary" (click)="resetColumns.emit()">
                  Restablecer
                </button>
              </div>

              <div *ngIf="columnMessageWarning" class="alert alert-warning py-1 px-2 mb-2 small text-center" style="font-size: 11px;">
                {{ columnMessageWarning }}
              </div>

              <div class="columns-selector-list">
                <label *ngFor="let col of availableColumns" class="columns-selector-option">
                  <input type="checkbox" [checked]="col.visible" (change)="toggleColumn(col)">
                  <span>{{ col.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="nx-table-length">
            <span>Mostrar</span>
            <select class="nx-table-length-select" [ngModel]="pageSize" (ngModelChange)="pageSizeChange.emit($event)">
              <option *ngFor="let opt of pageSizeOptions" [value]="opt">{{ opt }}</option>
            </select>
            <span>registros</span>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-hover align-middle text-nowrap mb-0 w-100">
          <thead class="table-light">
            <tr>
              <ng-container *ngFor="let col of availableColumns">
                <th *ngIf="col.visible" scope="col" class="nx-sortable" (click)="sort.emit(col.key)">
                  {{ col.label }}
                  <span class="fa nx-sort-icon" [ngClass]="{
                    'fa-sort': sortColumn !== col.key,
                    'fa-sort-asc': sortColumn === col.key && sortDirection === 'asc',
                    'fa-sort-desc': sortColumn === col.key && sortDirection === 'desc'
                  }"></span>
                </th>
              </ng-container>
              <th scope="col" class="text-end pe-3" style="width: 120px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of paginatedTarjetas; let i = index; trackBy: trackByFn">
              <ng-container *ngFor="let col of availableColumns">
                <td *ngIf="col.visible">
                  <ng-container [ngSwitch]="col.key">
                    <span *ngSwitchCase="'tarjeta'" class="badge" [ngClass]="getEstadoBadgeClass(row.estado_tarjeta || row.tarjeta)">
                      {{ row.estado_tarjeta || row.tarjeta || 'Emitida' }}
                    </span>
                    <span *ngSwitchCase="'estado_tarjeta'" class="badge" [ngClass]="getEstadoBadgeClass(row.estado_tarjeta || row.tarjeta)">
                      {{ row.estado_tarjeta || row.tarjeta || 'Emitida' }}
                    </span>

                    <span *ngSwitchCase="'estado_sociedad'" class="badge bg-success-subtle text-success border border-success-subtle">
                      {{ row.estado_sociedad || 'Activo' }}
                    </span>

                    <span *ngSwitchCase="'inscripcion'" class="fw-semibold text-dark">
                      {{ getCellValue(row, 'inscripcion') }}
                    </span>

                    <strong *ngSwitchCase="'razon_social'" class="text-dark">
                      {{ getCellValue(row, 'razon_social') }}
                    </strong>

                    <span *ngSwitchCase="'no_expd'" class="text-dark">
                      {{ getCellValue(row, 'no_expd') }}
                    </span>

                    <span *ngSwitchCase="'tipo_sociedad'" class="text-secondary">
                      {{ getCellValue(row, 'tipo_sociedad') }}
                    </span>

                    <span *ngSwitchDefault class="small text-muted">
                      {{ getCellValue(row, col.key) }}
                    </span>
                  </ng-container>
                </td>
              </ng-container>
              <td class="text-end pe-3 position-relative">
                <div class="btn-group btn-group-sm">
                  <button type="button" class="btn btn-outline-secondary d-inline-flex align-items-center gap-1" (click)="abrirDetalle.emit(row)">
                    <span class="fa fa-eye"></span>
                    <span>Detalles</span>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split" 
                    (click)="toggleRowDropdown($event, row.id)"
                    aria-expanded="false"
                    title="Más opciones"
                  >
                    <span class="visually-hidden">Más opciones</span>
                  </button>
                  <ul 
                    class="dropdown-menu dropdown-menu-end shadow-sm border" 
                    [class.show]="activeDropdownId === row.id"
                    [style.top]="isDropup(i, paginatedTarjetas.length) ? 'auto' : '100%'"
                    [style.bottom]="isDropup(i, paginatedTarjetas.length) ? '100%' : 'auto'"
                    [style.margin-bottom]="isDropup(i, paginatedTarjetas.length) ? '4px' : '0'"
                    [style.margin-top]="isDropup(i, paginatedTarjetas.length) ? '0' : '4px'"
                    style="position: absolute; right: 0; z-index: 1050; min-width: 175px;"
                  >
                    <li>
                      <button class="dropdown-item d-flex align-items-center gap-2 py-2 text-dark" type="button" (click)="abrirTarjeta.emit(row); activeDropdownId = null">
                        <span class="fa fa-id-card-o text-muted" style="width: 16px;"></span>
                        <span>Ver tarjeta</span>
                      </button>
                    </li>
                    <li *ngIf="row.tarjeta === 'Emitida' || row.estado_tarjeta === 'Emitida'">
                      <button class="dropdown-item d-flex align-items-center gap-2 py-2 text-dark" type="button" (click)="regenerarTarjeta.emit(row); activeDropdownId = null">
                        <span class="fa fa-refresh text-muted" style="width: 16px;"></span>
                        <span>Regenerar</span>
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item d-flex align-items-center gap-2 py-2 text-dark" type="button" (click)="abrirHistorial.emit(row); activeDropdownId = null">
                        <span class="fa fa-history text-muted" style="width: 16px;"></span>
                        <span>Historial</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
            <tr *ngIf="paginatedTarjetas.length === 0">
              <td [attr.colspan]="visibleColumnsCount + 1" class="text-center py-4 text-muted">
                <span class="fa fa-info-circle me-1"></span> No se encontraron solicitudes registradas.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pie de Tabla con Paginación Nativa -->
      <div class="nx-table-footer">
        <div class="nx-table-info">
          Mostrando {{ recordRangeStart }} a {{ recordRangeEnd }} de {{ totalRecords }} registros
          <span *ngIf="searchQuery" class="text-muted">(filtrado de {{ totalOriginal }} totales)</span>
        </div>

        <ul class="nx-table-pagination" *ngIf="totalRecords > 0">
          <li class="page-item" [class.disabled]="currentPage === 1">
            <button type="button" class="page-link" (click)="cambiarPagina.emit(1)" [disabled]="currentPage === 1" data-nx-tooltip="Primera página" aria-label="Primera página">
              ««
            </button>
          </li>
          <li class="page-item" [class.disabled]="currentPage === 1">
            <button type="button" class="page-link" (click)="cambiarPagina.emit(currentPage - 1)" [disabled]="currentPage === 1" data-nx-tooltip="Página anterior" aria-label="Página anterior">
              «
            </button>
          </li>

          <li 
            class="page-item" 
            *ngFor="let p of pagesArray" 
            [class.active]="p === currentPage"
          >
            <button type="button" class="page-link" (click)="cambiarPagina.emit(p)">
              {{ p }}
            </button>
          </li>

          <li class="page-item" [class.disabled]="currentPage === totalPages">
            <button type="button" class="page-link" (click)="cambiarPagina.emit(currentPage + 1)" [disabled]="currentPage === totalPages" data-nx-tooltip="Página siguiente" aria-label="Página siguiente">
              »
            </button>
          </li>
          <li class="page-item" [class.disabled]="currentPage === totalPages">
            <button type="button" class="page-link" (click)="cambiarPagina.emit(totalPages)" [disabled]="currentPage === totalPages" data-nx-tooltip="Última página" aria-label="Última página">
              »»
            </button>
          </li>
        </ul>
      </div>
    </div>
  `
})
export class TablaSociedadesComponent {
  @Input() currentError: AppError | null = null;
  @Output() currentErrorChange = new EventEmitter<AppError | null>();

  @Input() mensajeExito: string = '';
  @Output() mensajeExitoChange = new EventEmitter<string>();

  @Input() availableColumns: TableColumn[] = [];
  @Input() visibleColumnsCount: number = 0;
  @Input() columnMessageWarning: string = '';
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();

  @Input() pageSize: number = 10;
  @Output() pageSizeChange = new EventEmitter<number>();
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];

  @Input() paginatedTarjetas: TarjetaSociedad[] = [];
  @Input() totalOriginal: number = 0;
  @Input() totalRecords: number = 0;
  @Input() totalPages: number = 0;
  @Input() currentPage: number = 1;
  @Input() pagesArray: number[] = [];
  @Input() recordRangeStart: number = 0;
  @Input() recordRangeEnd: number = 0;

  @Input() sortColumn: string = 'fecha_emision';
  @Input() sortDirection: 'asc' | 'desc' = 'desc';
  @Output() sort = new EventEmitter<string>();

  @Output() cambiarPagina = new EventEmitter<number>();
  @Output() abrirDetalle = new EventEmitter<TarjetaSociedad>();
  @Output() abrirTarjeta = new EventEmitter<TarjetaSociedad>();
  @Output() regenerarTarjeta = new EventEmitter<TarjetaSociedad>();
  @Output() abrirHistorial = new EventEmitter<TarjetaSociedad>();
  @Output() resetColumns = new EventEmitter<void>();

  isColumnsMenuOpen: boolean = false;
  activeDropdownId: any = null;

  isDropup(index: number, total: number): boolean {
    return total > 2 && index >= total - 3;
  }

  toggleRowDropdown(event: MouseEvent, id: any): void {
    event.stopPropagation();
    this.activeDropdownId = this.activeDropdownId === id ? null : id;
  }

  toggleColumnsMenu(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isColumnsMenuOpen = !this.isColumnsMenuOpen;
  }

  toggleColumn(col: TableColumn): void {
    const visibleCount = this.availableColumns.filter(c => c.visible).length;
    if (col.visible && visibleCount <= 1) {
      this.columnMessageWarning = 'Debe mantener al menos una columna visible.';
      return;
    }
    this.columnMessageWarning = '';
    col.visible = !col.visible;
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery = query;
    this.searchQueryChange.emit(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchQueryChange.emit('');
  }

  getEstadoBadgeClass(estado?: string | null): string {
    return getEstadoTarjetaBadgeClass(estado);
  }

  getCellValue(row: any, key: string): any {
    if (!row || !key) return '-';
    const val = row[key];
    if (val === undefined || val === null || val === '') return '-';
    if (key === 'tipo_asociado' || key === 'tipo_sociedad') {
      return formatTipoSolicitud(val);
    }
    return val;
  }

  trackByFn(index: number, item: TarjetaSociedad): any {
    return item.id || index;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.activeDropdownId = null;
    const target = event.target as HTMLElement;
    if (!target.closest('.columns-selector-host')) {
      this.isColumnsMenuOpen = false;
    }
  }
}
