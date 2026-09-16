import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { ErrorHandlerService, AppError } from '../core/services/error-handler.service';
import { NxAlertComponent } from '../shared/components/alert/alert.component';

export interface AuditoriaLog {
  id?: number;
  fecha_hora: string;
  endpoint: string;
  metodo: string;
  tipo: string;
  duracion_ms: number;
  url: string;
  parametros_peticion: any;
  cuerpo_respuesta_peticion: any;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule, NxAlertComponent],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.css'
})
export class AuditoriaComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  clientId: number = CLIENT_ID;

  logs: AuditoriaLog[] = [];
  loading: boolean = false;
  currentError: AppError | null = null;

  // Filtros Avanzados (conforme a index.html#auditoria)
  filterFrom: string = '';
  filterTo: string = '';
  filterText: string = '';
  filterEndpoint: string = '';
  filterType: string = '';
  filterChangeState: string = '';

  // Búsqueda rápida sobre la tabla
  searchQuery: string = '';

  // Ordenamiento
  sortColumn: string = 'fecha_hora';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Paginación servidor MFE
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 20, 50, 100];
  currentPage: number = 1;
  totalRecordsCount: number = 0;
  totalPagesCount: number = 0;
  filterTimeout: any = null;

  // Acordeón de detalle (filas expandidas por ID)
  expandedIds: Set<number> = new Set<number>();

  ngOnInit(): void {
    this.cargarAuditoria();
  }

  cargarAuditoria(): void {
    this.loading = true;
    this.currentError = null;

    let url = `${API_BASE}/tarjetas/auditoria-api/list?client_id=${this.clientId}&page=${this.currentPage}&page_size=${this.pageSize}`;

    if (this.filterFrom) {
      url += `&fecha_desde=${encodeURIComponent(this.filterFrom.replace('T', ' '))}`;
    }
    if (this.filterTo) {
      url += `&fecha_hasta=${encodeURIComponent(this.filterTo.replace('T', ' '))}`;
    }
    if (this.filterEndpoint) {
      url += `&endpoint=${encodeURIComponent(this.filterEndpoint)}`;
    }
    if (this.filterType) {
      url += `&tipo=${encodeURIComponent(this.filterType)}`;
    }
    if (this.filterText && this.filterText.trim()) {
      url += `&texto=${encodeURIComponent(this.filterText.trim())}`;
    }
    if (this.filterChangeState !== '') {
      url += `&cambiar_estado=${encodeURIComponent(this.filterChangeState)}`;
    }

    const ts = new Date().getTime();
    url += `&_t=${ts}`;

    this.http.get<any>(url)
      .subscribe({
        next: (res) => {
          const rawList = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
          this.totalRecordsCount = Array.isArray(res) ? rawList.length : (res?.total ?? rawList.length);
          this.totalPagesCount = Array.isArray(res) 
            ? Math.ceil(this.totalRecordsCount / this.pageSize) 
            : (res?.total_pages ?? Math.ceil(this.totalRecordsCount / this.pageSize));

          this.logs = rawList.map((item: any, index: number) => ({
            id: item.id || ((this.currentPage - 1) * this.pageSize + index + 1),
            fecha_hora: item.fecha_hora || '',
            endpoint: item.endpoint || '',
            metodo: item.metodo || 'POST',
            tipo: item.tipo || 'General',
            duracion_ms: item.duracion_ms || 0,
            url: item.url || '',
            parametros_peticion: item.parametros_peticion || null,
            cuerpo_respuesta_peticion: item.cuerpo_respuesta_peticion || null
          }));
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar auditoría API:', err);
          this.currentError = this.errorHandler.parseError(err, 'MS_3852_AUDITORIA_GET', `${API_BASE}/tarjetas/auditoria-api/list`);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  get availableTypes(): { value: string; label: string }[] {
    if (this.filterEndpoint === 'contadores' || this.filterEndpoint === '/contadores/') {
      return [
        { value: 'primeraVez', label: 'Primera vez' },
        { value: 'duplicado', label: 'Duplicado' },
        { value: 'sustitucion', label: 'Sustitución' }
      ];
    } else if (this.filterEndpoint === 'sociedades' || this.filterEndpoint === '/sociedades/') {
      return [
        { value: 'primeraVez', label: 'Primera vez' },
        { value: 'duplicado', label: 'Duplicado' },
        { value: 'modificacion', label: 'Modificación' }
      ];
    }
    return [
      { value: 'primeraVez', label: 'Primera vez' },
      { value: 'duplicado', label: 'Duplicado' },
      { value: 'sustitucion', label: 'Sustitución' },
      { value: 'modificacion', label: 'Modificación' }
    ];
  }

  onEndpointChange(): void {
    if (this.filterType && !this.availableTypes.some(t => t.value === this.filterType)) {
      this.filterType = '';
    }
    this.currentPage = 1;
    this.cargarAuditoria();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    this.filterTimeout = setTimeout(() => {
      this.cargarAuditoria();
    }, 300);
  }

  limpiarFiltros(): void {
    this.filterFrom = '';
    this.filterTo = '';
    this.filterText = '';
    this.filterEndpoint = '';
    this.filterType = '';
    this.filterChangeState = '';
    this.searchQuery = '';
    this.currentPage = 1;
    this.cargarAuditoria();
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.filterFrom ||
      this.filterTo ||
      this.filterText ||
      this.filterEndpoint ||
      this.filterType ||
      this.filterChangeState ||
      this.searchQuery
    );
  }

  get filteredLogs(): AuditoriaLog[] {
    let result = this.logs.filter(log => {
      // Filtro Texto avanzado (busca en payload de petición o cuerpo de respuesta)
      if (this.filterText && this.filterText.trim()) {
        const t = this.filterText.trim().toLowerCase();
        const payloadHaystack = `${JSON.stringify(log.parametros_peticion || '')} ${JSON.stringify(log.cuerpo_respuesta_peticion || '')}`.toLowerCase();
        if (!payloadHaystack.includes(t)) return false;
      }

      // Filtro Cambiar Estado
      if (this.filterChangeState !== '') {
        const cs = this.hasChangeState(log);
        if (String(cs) !== this.filterChangeState) return false;
      }

      // Búsqueda rápida sobre la tabla
      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.trim().toLowerCase();
        const rowText = `${log.id} ${log.fecha_hora} ${log.endpoint} ${log.metodo} ${log.tipo} ${log.url} ${log.duracion_ms}`.toLowerCase();
        if (!rowText.includes(q)) return false;
      }

      return true;
    });

    // Ordenamiento dinámico
    result = [...result].sort((a, b) => {
      let valA: any = (a as any)[this.sortColumn];
      let valB: any = (b as any)[this.sortColumn];

      if (valA == null) valA = '';
      if (valB == null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return this.sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return result;
  }

  get paginatedLogs(): AuditoriaLog[] {
    return this.filteredLogs;
  }

  get totalPages(): number {
    return Math.max(1, this.totalPagesCount || 1);
  }

  get totalRecords(): number {
    return this.totalRecordsCount;
  }

  get recordRangeStart(): number {
    return this.totalRecordsCount ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get recordRangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecordsCount);
  }

  get pagesArray(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  cambiarTamanoPagina(nuevoTamano: any): void {
    this.pageSize = Number(nuevoTamano);
    this.currentPage = 1;
    this.cargarAuditoria();
  }

  cambiarPagina(p: number): void {
    if (p >= 1 && p <= this.totalPages && p !== this.currentPage) {
      this.currentPage = p;
      this.cargarAuditoria();
    }
  }

  ordenarPor(col: string): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  toggleExpand(id?: number): void {
    if (id == null) return;
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  isExpanded(id?: number): boolean {
    return id != null && this.expandedIds.has(id);
  }

  hasChangeState(log: AuditoriaLog): boolean {
    return Boolean(
      log.parametros_peticion &&
      (log.parametros_peticion.cambiarEstado === true || log.parametros_peticion.cambiarEstado === 'true')
    );
  }

  getTipoLabel(tipo: string): string {
    switch (tipo) {
      case 'primeraVez': return 'Primera vez';
      case 'duplicado': return 'Duplicado';
      case 'sustitucion': return 'Sustitución';
      case 'modificacion': return 'Modificación';
      default: return tipo ? (tipo.charAt(0).toUpperCase() + tipo.slice(1)) : 'General';
    }
  }

  getHttpStatus(log: AuditoriaLog): { code: number; isError: boolean } {
    if (log.cuerpo_respuesta_peticion && log.cuerpo_respuesta_peticion.error) {
      return { code: 400, isError: true };
    }
    if (log.cuerpo_respuesta_peticion && log.cuerpo_respuesta_peticion.encontrado === false) {
      return { code: 404, isError: true };
    }
    return { code: 200, isError: false };
  }

  formatJson(obj: any): string {
    if (!obj) return 'Sin datos';
    if (typeof obj === 'string') {
      try {
        const parsed = JSON.parse(obj);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return obj;
      }
    }
    return JSON.stringify(obj, null, 2);
  }
}
