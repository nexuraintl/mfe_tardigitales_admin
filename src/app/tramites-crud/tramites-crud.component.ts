import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { ErrorHandlerService, AppError } from '../core/services/error-handler.service';
import { NxAlertComponent } from '../shared/components/alert/alert.component';

export interface Tramite {
  id?: number;
  nombre: string;
  tipo: string;
  costo: number;
  estado: string;
  descripcion?: string;
}

@Component({
  selector: 'app-tramites-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, NxAlertComponent],
  templateUrl: './tramites-crud.component.html',
  styleUrl: './tramites-crud.component.css'
})
export class TramitesCrudComponent implements OnInit {
  tramites: Tramite[] = [];
  loading = false;
  currentError: AppError | null = null;
  successMsg: string = '';
  clientId: number = CLIENT_ID;

  // Búsqueda y Paginación Nativa en Angular
  searchQuery = '';
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  sortColumn: keyof Tramite | 'id' = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Modal Crear/Editar
  modalOpen = false;
  modalStatic = false; // true = obligatorio (no se cierra con ESC ni backdrop)
  isEditing = false;
  formTramite: Tramite = this.getEmptyTramite();
  formError: string = '';

  // Modal Confirmar Eliminar
  deleteModalOpen = false;
  deleteModalStatic = false; // true = obligatorio
  tramiteToDeleteId: number | null = null;

  // Efecto visual de rebote (shake) al intentar cerrar un modal obligatorio
  modalShakeActive = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService
  ) {}

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownEscape(event?: any): void {
    if (this.modalOpen) {
      if (!this.modalStatic) {
        this.cerrarModal();
      } else {
        this.triggerModalShake();
      }
    } else if (this.deleteModalOpen) {
      if (!this.deleteModalStatic) {
        this.cerrarConfirmarEliminar();
      } else {
        this.triggerModalShake();
      }
    }
  }

  onBackdropClick(modalType: 'form' | 'delete'): void {
    if (modalType === 'form') {
      if (!this.modalStatic) {
        this.cerrarModal();
      } else {
        this.triggerModalShake();
      }
    } else if (modalType === 'delete') {
      if (!this.deleteModalStatic) {
        this.cerrarConfirmarEliminar();
      } else {
        this.triggerModalShake();
      }
    }
  }

  triggerModalShake(): void {
    this.modalShakeActive = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.modalShakeActive = false;
      this.cdr.detectChanges();
    }, 280);
  }

  ngOnInit(): void {
    this.obtenerTramites();
  }

  // Lógica Reactiva de Filtrado, Ordenamiento y Paginación
  get filteredTramites(): Tramite[] {
    if (!this.searchQuery) return this.tramites;
    const q = this.searchQuery.toLowerCase().trim();
    return this.tramites.filter(t =>
      (t.id && t.id.toString().includes(q)) ||
      (t.nombre && t.nombre.toLowerCase().includes(q)) ||
      (t.tipo && t.tipo.toLowerCase().includes(q)) ||
      (t.estado && t.estado.toLowerCase().includes(q)) ||
      (t.descripcion && t.descripcion.toLowerCase().includes(q)) ||
      (t.costo !== undefined && t.costo.toString().includes(q))
    );
  }

  get sortedTramites(): Tramite[] {
    const list = [...this.filteredTramites];
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

  get pagedTramites(): Tramite[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedTramites.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTramites.length / this.pageSize) || 1;
  }

  get totalRecords(): number {
    return this.filteredTramites.length;
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

  ordenarPor(columna: keyof Tramite | 'id'): void {
    if (this.sortColumn === columna) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columna;
      this.sortDirection = 'desc';
    }
    this.currentPage = 1;
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.currentPage = pagina;
    }
  }

  cambiarTamanoPagina(nuevoTamano: number): void {
    this.pageSize = Number(nuevoTamano);
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  getEmptyTramite(): Tramite {
    return {
      nombre: '',
      tipo: 'Contador Público',
      costo: 0,
      estado: 'Activo',
      descripcion: ''
    };
  }

  trackByTramiteId(index: number, item: Tramite): number | undefined {
    return item.id || index;
  }

  obtenerTramites(): void {
    this.loading = true;
    this.currentError = null;
    const ts = new Date().getTime();
    this.http.get<Tramite[]>(`${API_BASE}/tramites/list?client_id=${this.clientId}&_t=${ts}`)
      .subscribe({
        next: (data) => {
          this.tramites = data || [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.currentError = this.errorHandler.parseError(err, 'MS_3810_TRAMITES_GET', `${API_BASE}/tramites/list`);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  abrirCrear(): void {
    this.isEditing = false;
    this.formError = '';
    this.formTramite = this.getEmptyTramite();
    this.modalOpen = true;
    this.cdr.detectChanges();
  }

  abrirEditar(tramite: Tramite): void {
    if (!tramite.id) return;
    this.isEditing = true;
    this.formError = '';
    this.formTramite = { ...tramite };
    this.modalOpen = true;
    this.cdr.detectChanges();

    this.http.get<Tramite>(`${API_BASE}/tramites/get/${tramite.id}?client_id=${this.clientId}`)
      .subscribe({
        next: (freshData) => {
          if (freshData) {
            this.formTramite = { ...freshData };
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Error al consultar datos actualizados del trámite:', err);
          const appErr = this.errorHandler.parseError(err, 'MS_3811_TRAMITES_NOT_FOUND', `${API_BASE}/tramites/get/${tramite.id}`);
          this.formError = `${appErr.title}: ${appErr.message}`;
          this.cdr.detectChanges();
        }
      });
  }

  cerrarModal(): void {
    this.modalOpen = false;
    this.formError = '';
    this.formTramite = this.getEmptyTramite();
    this.cdr.detectChanges();
  }

  guardarTramite(): void {
    if (!this.formTramite.nombre || this.formTramite.costo < 0) {
      this.formError = 'Por favor complete todos los campos obligatorios del trámite.';
      this.cdr.detectChanges();
      return;
    }

    this.formError = '';

    if (this.isEditing && this.formTramite.id) {
      this.http.put<Tramite>(`${API_BASE}/tramites/update/${this.formTramite.id}?client_id=${this.clientId}`, this.formTramite)
        .subscribe({
          next: () => {
            this.successMsg = 'El trámite ha sido actualizado correctamente.';
            setTimeout(() => {
              this.successMsg = '';
              this.cdr.detectChanges();
            }, 5000);
            this.cerrarModal();
            this.obtenerTramites();
          },
          error: (err) => {
            const appErr = this.errorHandler.parseError(err, 'MS_3813_TRAMITES_UPDATE', `${API_BASE}/tramites/update/${this.formTramite.id}`);
            this.formError = `${appErr.title}: ${appErr.message}`;
            this.cdr.detectChanges();
          }
        });
    } else {
      this.http.post<Tramite>(`${API_BASE}/tramites/create?client_id=${this.clientId}`, this.formTramite)
        .subscribe({
          next: () => {
            this.successMsg = 'El trámite ha sido registrado exitosamente.';
            setTimeout(() => {
              this.successMsg = '';
              this.cdr.detectChanges();
            }, 5000);
            this.cerrarModal();
            this.obtenerTramites();
          },
          error: (err) => {
            const appErr = this.errorHandler.parseError(err, 'MS_3812_TRAMITES_CREATE', `${API_BASE}/tramites/create`);
            this.formError = `${appErr.title}: ${appErr.message}`;
            this.cdr.detectChanges();
          }
        });
    }
  }

  eliminarTramite(id: number): void {
    this.tramiteToDeleteId = id;
    this.deleteModalOpen = true;
    this.cdr.detectChanges();
  }

  cerrarConfirmarEliminar(): void {
    this.deleteModalOpen = false;
    this.tramiteToDeleteId = null;
    this.cdr.detectChanges();
  }

  confirmarEliminar(): void {
    if (this.tramiteToDeleteId !== null) {
      const id = this.tramiteToDeleteId;
      this.http.delete(`${API_BASE}/tramites/delete/${id}?client_id=${this.clientId}`)
        .subscribe({
          next: () => {
            this.successMsg = 'El trámite ha sido eliminado correctamente.';
            setTimeout(() => {
              this.successMsg = '';
              this.cdr.detectChanges();
            }, 5000);
            this.cerrarConfirmarEliminar();
            this.obtenerTramites();
          },
          error: (err) => {
            this.currentError = this.errorHandler.parseError(err, 'MS_3814_TRAMITES_DELETE', `${API_BASE}/tramites/delete/${id}`);
            this.cerrarConfirmarEliminar();
            this.cdr.detectChanges();
          }
        });
    }
  }
}
