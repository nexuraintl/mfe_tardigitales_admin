import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { ErrorHandlerService, AppError } from '../core/services/error-handler.service';
import { NxAlertComponent } from '../shared/components/alert/alert.component';

interface NotificationItem {
  id: number;
  client_id?: number;
  titulo: string;
  canal: string;
  audiencia: string;
  destinatarios: number;
  fecha: string;
  estado: 'Entregada' | 'Programada' | 'Fallida' | 'En proceso';
  creadoPor: string;
  mensaje?: string;
}

@Component({
  selector: 'app-notifications-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NxAlertComponent],
  templateUrl: './notifications-history.component.html',
  styleUrl: './notifications-history.component.css'
})
export class NotificationsHistoryComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  clientId: number = CLIENT_ID;

  notificaciones: NotificationItem[] = [];
  currentError: AppError | null = null;
  loading: boolean = false;

  // Filtros y Búsqueda
  searchQuery: string = '';
  selectedChannel: string = '';
  selectedStatus: string = '';
  dateFrom: string = '';
  dateTo: string = '';

  // Paginación y Ordenamiento Nativo en Angular
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  sortColumn: keyof NotificationItem | 'id' = 'fecha';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Detalle de Notificación (Modal)
  selectedNotification: NotificationItem | null = null;
  isModalOpen: boolean = false;

  irACrearNotificacion(): void {
    this.router.navigate(['/crear-notificacion']);
  }

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.loading = true;
    this.currentError = null;

    const ts = new Date().getTime();
    this.http.get<NotificationItem[]>(`${API_BASE}/notificaciones/list?client_id=${this.clientId}&_t=${ts}`)
      .subscribe({
        next: (data: any) => {
          this.notificaciones = Array.isArray(data) ? data : (data?.data || []);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar notificaciones de la API:', err);
          this.currentError = this.errorHandler.parseError(err, 'MS_3820_NOTIFICACIONES_GET', `${API_BASE}/notificaciones/list`);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // Filtrado reactivo puro
  get filteredNotifications(): NotificationItem[] {
    return this.notificaciones.filter(n => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (n.titulo && n.titulo.toLowerCase().includes(q)) ||
        (n.creadoPor && n.creadoPor.toLowerCase().includes(q)) ||
        (n.audiencia && n.audiencia.toLowerCase().includes(q)) ||
        (n.id && n.id.toString().includes(q));

      const matchChannel = !this.selectedChannel || n.canal === this.selectedChannel;
      const matchStatus = !this.selectedStatus || n.estado === this.selectedStatus;

      let matchDate = true;
      if (this.dateFrom || this.dateTo) {
        const nDateStr = n.fecha ? n.fecha.substring(0, 10) : '';
        if (this.dateFrom && (!nDateStr || nDateStr < this.dateFrom)) matchDate = false;
        if (this.dateTo && (!nDateStr || nDateStr > this.dateTo)) matchDate = false;
      }

      return matchSearch && matchChannel && matchStatus && matchDate;
    });
  }

  get sortedNotifications(): NotificationItem[] {
    const list = [...this.filteredNotifications];
    const col = this.sortColumn;
    const dir = this.sortDirection === 'asc' ? 1 : -1;

    return list.sort((a, b) => {
      const valA = (a as any)[col];
      const valB = (b as any)[col];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1 * dir;
      if (valB === undefined || valB === null) return -1 * dir;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * dir;
      }
      return String(valA).localeCompare(String(valB), 'es', { numeric: true }) * dir;
    });
  }

  get pagedNotifications(): NotificationItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedNotifications.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredNotifications.length / this.pageSize));
  }

  get totalRecords(): number {
    return this.filteredNotifications.length;
  }

  get startRecord(): number {
    if (this.totalRecords === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
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

  ordenarPor(columna: keyof NotificationItem | 'id'): void {
    if (this.sortColumn === columna) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columna;
      this.sortDirection = 'desc';
    }
    this.currentPage = 1;
  }

  cambiarPagina(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
    }
  }

  cambiarTamanoPagina(nuevoTamano: number): void {
    this.pageSize = Number(nuevoTamano);
    this.currentPage = 1;
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  limpiarFiltros(): void {
    this.searchQuery = '';
    this.selectedChannel = '';
    this.selectedStatus = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  // Estadísticas calculadas de manera global
  get totalCount(): number {
    return this.notificaciones.length;
  }

  get deliveredCount(): number {
    return this.notificaciones.filter(n => n.estado === 'Entregada').length;
  }

  get scheduledCount(): number {
    return this.notificaciones.filter(n => n.estado === 'Programada').length;
  }

  get failedCount(): number {
    return this.notificaciones.filter(n => n.estado === 'Fallida').length;
  }

  trackByNotifId(index: number, item: NotificationItem): number | string {
    return item.id || index;
  }

  verDetalle(notificacion: NotificationItem): void {
    this.selectedNotification = notificacion;
    this.isModalOpen = true;
  }

  cerrarModal(): void {
    this.isModalOpen = false;
    this.selectedNotification = null;
  }

  exportarCSV(): void {
    if (!this.filteredNotifications || this.filteredNotifications.length === 0) {
      alert('No hay registros para exportar');
      return;
    }
    const headers = ['ID', 'Título', 'Canal', 'Audiencia', 'Destinatarios', 'Fecha', 'Estado', 'Creado Por'];
    const rows = this.filteredNotifications.map((n: NotificationItem) => [
      n.id,
      `"${(n.titulo || '').replace(/"/g, '""')}"`,
      `"${n.canal}"`,
      `"${n.audiencia}"`,
      n.destinatarios,
      `"${n.fecha}"`,
      `"${n.estado}"`,
      `"${n.creadoPor}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historial_notificaciones_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
