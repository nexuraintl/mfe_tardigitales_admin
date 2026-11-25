import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { formatCanonicalLabel } from '../../../core/constants/tarjetas.constants';

export interface FilterColumnConfig {
  key: string;
  label: string;
  tipo?: 'string' | 'number' | 'date' | 'select';
  options?: string[];
}

export interface ActiveFilter {
  id: number;
  column: string;
  columnLabel: string;
  value: string;
  displayValue: string;
  dateFrom?: string;
  dateTo?: string;
}

@Component({
  selector: 'app-filter-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card filters-card shadow-sm mb-4">
      <div class="cards-filters-list">
        <div class="cards-filter-row">
          <!-- 1. Columna -->
          <div class="field">
            <label class="form-label text-secondary small fw-bold mb-1">Columna</label>
            <select 
              class="form-select form-select-sm" 
              [ngModel]="selectedColumnKey" 
              (ngModelChange)="onColumnChange($event)"
            >
              <option value="">Seleccione una columna</option>
              <option *ngFor="let col of selectableColumns; trackBy: trackByColumnKey" [value]="col.key">
                {{ formatLabel(col.label) }}
              </option>
            </select>
          </div>

          <!-- 2. Valor -->
          <div class="field">
            <label class="form-label text-secondary small fw-bold mb-1">{{ valueLabel }}</label>

            <!-- Caso sin columna seleccionada -->
            <input 
              *ngIf="!selectedColumnKey" 
              class="form-control form-control-sm" 
              disabled 
              placeholder="Seleccione una columna"
            >

            <!-- Caso rango de fechas -->
            <div *ngIf="selectedColumnType === 'date'" class="cards-date-range">
              <div>
                <label class="text-muted small mb-0">Fecha inicio</label>
                <input type="date" class="form-control form-control-sm" [(ngModel)]="dateFrom">
              </div>
              <div>
                <label class="text-muted small mb-0">Fecha fin</label>
                <input type="date" class="form-control form-control-sm" [(ngModel)]="dateTo">
              </div>
            </div>

            <!-- Caso select con opciones fijas (estados, tipos) -->
            <select 
              *ngIf="selectedColumnType === 'select'" 
              class="form-select form-select-sm" 
              [(ngModel)]="selectedValue"
            >
              <option value="">Seleccione un valor</option>
              <option *ngFor="let opt of currentOptions; trackBy: trackByOption" [value]="opt">{{ opt }}</option>
            </select>

            <!-- Caso número (expediente, tarjeta, etc.) -->
            <input 
              *ngIf="selectedColumnType === 'number'" 
              type="number" 
              min="0" 
              step="1" 
              class="form-control form-control-sm" 
              [placeholder]="'Ingrese ' + valueLabel.toLowerCase()" 
              [(ngModel)]="textValue"
              (keyup.enter)="addFilter()"
            >

            <!-- Caso texto general -->
            <input 
              *ngIf="selectedColumnType === 'string' && selectedColumnKey" 
              type="text" 
              class="form-control form-control-sm" 
              [placeholder]="'Ingrese ' + valueLabel.toLowerCase()" 
              [(ngModel)]="textValue" 
              (keyup.enter)="addFilter()"
            >
          </div>

          <!-- 3. Botón Añadir filtro -->
          <button 
            type="button" 
            class="btn btn-outline-primary btn-sm px-3 add-filter-btn" 
            (click)="addFilter()" 
            [disabled]="!canAddFilter"
          >
            + Añadir filtro
          </button>
        </div>
      </div>

      <!-- Acciones: Filtrar y Limpiar -->
      <div class="cards-filter-actions mt-3 d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-primary btn-sm px-3" (click)="apply()">
          Filtrar
        </button>
        <button type="button" class="btn btn-light btn-sm px-3 border" (click)="clear()">
          &#8630; Limpiar
        </button>
      </div>

      <!-- Barra de Filtros Activos (Chips interactivos) -->
      <div class="certificate-active-filters mt-3 pt-3 border-top d-flex align-items-center flex-wrap gap-2">
        <strong class="text-dark small me-1">Filtros activos</strong>
        <span *ngIf="stagedFilters.length === 0" class="text-muted small">No hay filtros aplicados.</span>

        <button 
          *ngFor="let f of stagedFilters" 
          type="button" 
          class="certificate-filter-chip" 
          (click)="removeFilter(f.id)" 
          [title]="'Quitar filtro ' + formatLabel(f.columnLabel)"
        >
          <b>{{ formatLabel(f.columnLabel) }}:</b> {{ f.displayValue }} <i aria-hidden="true">&times;</i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .filters-card {
      padding: 16px;
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
    }

    .cards-filters-list {
      display: grid;
      gap: 10px;
    }

    .cards-filter-row {
      display: grid;
      grid-template-columns: minmax(180px, 0.8fr) minmax(260px, 1.4fr) auto;
      gap: 12px;
      align-items: end;
    }

    .add-filter-btn {
      white-space: nowrap;
      height: 31px;
    }

    .cards-date-range {
      display: grid;
      grid-template-columns: repeat(2, minmax(120px, 1fr));
      gap: 8px;
    }

    .cards-date-range label {
      display: block;
      margin: 0 0 2px;
      color: #64748b;
      font-size: 11px;
    }

    .cards-filter-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .certificate-active-filters {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      min-height: 40px;
      border-top: 1px solid #e2e8f0;
    }

    .certificate-filter-chip {
      min-height: 28px;
      padding: 3px 10px;
      border: 0;
      border-radius: 6px;
      display: inline-flex;
      gap: 6px;
      align-items: center;
      background: #eaf2ff;
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .certificate-filter-chip:hover {
      background: #dbeafe;
      color: #1e40af;
    }

    .certificate-filter-chip i {
      font-style: normal;
      font-weight: bold;
      font-size: 13px;
      line-height: 1;
    }

    @media (max-width: 768px) {
      .cards-filter-row {
        grid-template-columns: 1fr;
      }
      .add-filter-btn {
        width: 100%;
      }
    }
  `]
})
export class FilterBuilderComponent implements OnInit, OnChanges {
  @Input() columns: FilterColumnConfig[] = [];
  @Output() applyFilters = new EventEmitter<ActiveFilter[]>();
  @Output() clearFilters = new EventEmitter<void>();

  selectedColumnKey = '';
  textValue: any = '';
  selectedValue = '';
  dateFrom = '';
  dateTo = '';

  selectableColumns: FilterColumnConfig[] = [];
  stagedFilters: ActiveFilter[] = [];
  private sequence = 0;

  formatLabel(label?: string | null): string {
    return formatCanonicalLabel(label);
  }

  ngOnInit(): void {
    this.updateSelectableColumns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.updateSelectableColumns();
    }
  }

  trackByColumnKey(index: number, col: FilterColumnConfig): string {
    return col.key;
  }

  trackByOption(index: number, opt: string): string {
    return opt;
  }

  updateSelectableColumns(): void {
    const usedKeys = this.stagedFilters.map(f => f.column);
    this.selectableColumns = (this.columns || []).filter(
      c => !usedKeys.includes(c.key) || c.key === this.selectedColumnKey
    );
  }

  get selectedColumn(): FilterColumnConfig | undefined {
    return (this.columns || []).find(c => c.key === this.selectedColumnKey);
  }

  get selectedColumnType(): string {
    if (!this.selectedColumnKey) return 'none';
    if (this.selectedColumn?.tipo) return this.selectedColumn.tipo;
    const key = (this.selectedColumnKey || '').toLowerCase();
    if (key.includes('fecha')) return 'date';
    if (key.includes('estado')) return 'select';
    if (key === 'no_expd' || key === 'expediente') return 'number';
    return 'string';
  }

  get valueLabel(): string {
    if (!this.selectedColumn) return 'Valor';
    if (this.selectedColumnType === 'date') return `Rango de ${formatCanonicalLabel(this.selectedColumn.label)}`;
    return formatCanonicalLabel(this.selectedColumn.label);
  }

  get currentOptions(): string[] {
    if (this.selectedColumn?.options && this.selectedColumn.options.length > 0) {
      return this.selectedColumn.options;
    }
    const key = (this.selectedColumnKey || '').toLowerCase();
    if (key.includes('estado_tarjeta') || key.includes('estadotarjeta')) {
      return ['Activa', 'Cancelada', 'Fallecido', 'Emitida'];
    }
    if (key.includes('estado_contador') || key.includes('estado_sociedad') || key.includes('estadoresgistro')) {
      return ['Activo', 'Inactivo'];
    }
    if (key.includes('tipo')) {
      return ['Primera vez', 'Duplicado', 'Sustitución'];
    }
    return [];
  }

  get canAddFilter(): boolean {
    if (!this.selectedColumnKey) return false;
    if (this.selectedColumnType === 'date') {
      return Boolean(this.dateFrom && this.dateTo && this.dateFrom <= this.dateTo);
    }
    if (this.selectedColumnType === 'select') {
      return Boolean(this.selectedValue);
    }
    const val = String(this.textValue ?? '').trim();
    return val.length > 0;
  }

  onColumnChange(newKey?: string): void {
    if (newKey !== undefined) {
      if (this.selectedColumnKey === newKey) {
        return;
      }
      this.selectedColumnKey = newKey;
    }
    this.textValue = '';
    this.selectedValue = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.updateSelectableColumns();
  }

  addFilter(): void {
    if (!this.canAddFilter || !this.selectedColumn) return;

    let value = '';
    let displayValue = '';

    if (this.selectedColumnType === 'date') {
      value = `${this.dateFrom}__${this.dateTo}`;
      displayValue = `${this.dateFrom} — ${this.dateTo}`;
    } else if (this.selectedColumnType === 'select') {
      value = this.selectedValue;
      displayValue = this.selectedValue;
    } else {
      const val = String(this.textValue ?? '').trim();
      value = val;
      displayValue = val;
    }

    this.sequence++;
    this.stagedFilters.push({
      id: this.sequence,
      column: this.selectedColumn.key,
      columnLabel: formatCanonicalLabel(this.selectedColumn.label),
      value: value.toLowerCase(),
      displayValue: displayValue,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo
    });

    this.selectedColumnKey = '';
    this.onColumnChange('');
  }

  removeFilter(id: number): void {
    this.stagedFilters = this.stagedFilters.filter(f => f.id !== id);
    this.updateSelectableColumns();
    this.apply();
  }

  apply(): void {
    this.applyFilters.emit([...this.stagedFilters]);
  }

  clear(): void {
    this.selectedColumnKey = '';
    this.onColumnChange('');
    this.stagedFilters = [];
    this.updateSelectableColumns();
    this.clearFilters.emit();
  }
}
