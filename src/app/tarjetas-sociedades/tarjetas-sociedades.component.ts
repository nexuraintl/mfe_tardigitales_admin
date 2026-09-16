import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { ErrorHandlerService, AppError } from '../core/services/error-handler.service';
import { NxAlertComponent } from '../shared/components/alert/alert.component';
import { DEFAULT_AVATAR_PATH, getFotoContadorOrDefault } from '../core/constants/assets.constants';

export interface TableColumn {
  key: string;
  label: string;
  visible: boolean;
}

interface TarjetaSociedad {
  id: number;
  client_id?: number;
  tipo_tarjeta: string;
  codigo: string;
  expediente: number;
  solicitante: string; // Razón Social
  documento: string; // NIT
  matricula: string; // N.° Registro
  tipo_sociedad?: string;
  correo: string;
  representante: string; // Representante Legal
  tarjeta: string;
  tipo_asociado?: string;
  estado_sociedad?: string;
  resolucion?: string;
  fecha_resolucion?: string;
  acta_jcc?: string;
  fecha_inscripcion?: string;
  fecha: string;
  foto?: string | null;
}

@Component({
  selector: 'app-tarjetas-sociedades',
  standalone: true,
  imports: [CommonModule, FormsModule, NxAlertComponent],
  templateUrl: './tarjetas-sociedades.component.html',
  styleUrl: './tarjetas-sociedades.component.css'
})
export class TarjetasSociedadesComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  clientId: number = CLIENT_ID;

  tarjetas: TarjetaSociedad[] = [];
  loading: boolean = false;
  currentError: AppError | null = null;

  // Catálogo ampliado de columnas correspondientes al Microservicio
  availableColumns: TableColumn[] = [
    { key: 'id', label: '# (ID)', visible: false },
    { key: 'expediente', label: 'Expediente', visible: true },
    { key: 'solicitante', label: 'Razón Social', visible: true },
    { key: 'documento', label: 'NIT', visible: true },
    { key: 'matricula', label: 'N.° Registro', visible: true },
    { key: 'tipo_sociedad', label: 'Tipo Sociedad', visible: false },
    { key: 'resolucion', label: 'Resolución', visible: true },
    { key: 'fecha_resolucion', label: 'Fecha resolución', visible: false },
    { key: 'acta_jcc', label: 'Acta JCC', visible: false },
    { key: 'fecha_inscripcion', label: 'Fecha inscripción', visible: false },
    { key: 'tipo_asociado', label: 'Tipo trámite', visible: true },
    { key: 'estado_sociedad', label: 'Estado sociedad', visible: true },
    { key: 'representante', label: 'Representante Legal', visible: true },
    { key: 'correo', label: 'Correo', visible: false },
    { key: 'tarjeta', label: 'Estado tarjeta', visible: true },
    { key: 'fecha', label: 'Fecha emisión', visible: true }
  ];
  isColumnsMenuOpen: boolean = false;
  columnMessageWarning: string = '';

  // Búsqueda, Filtros y Paginación Nativa en Angular
  searchQuery: string = '';
  filterColumn: string = '';
  filterValue: string = '';
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  currentPage: number = 1;
  sortColumn: keyof TarjetaSociedad | 'id' = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal Detalle y Tarjeta Digital
  selectedTarjeta: TarjetaSociedad | null = null;
  isDetailModalOpen: boolean = false;
  isCardModalOpen: boolean = false;

  // Semilla QR para simular matriz dinámica
  qrSeed: number = 0.8;

  // Control de vistas (listado, emision-individual, emision-masiva, historial)
  vistaActiva: 'listado' | 'emision-individual' | 'emision-masiva' | 'historial' = 'listado';
  selectedTarjetaHistorial: any = null;

  // Variables para la creación de tarjeta (Emisión individual)
  nuevaIdentificacion: string = '';
  tipoSolicitud: string = 'primeraVez';
  busquedaRealizada: boolean = false;
  cargandoBusqueda: boolean = false;
  datosConsulta: any = null;
  mensajeExito: string = '';
  mensajeError: string = '';

  // Branding de Credencial para Vista Previa (Sociedades - tipoId 2)
  brandingColorFondo: string = '#134567';
  brandingColorLetra: string = '#ffffff';
  brandingFuenteLetra: string = 'Arial, sans-serif';
  brandingLogoUrl: string | null = null;
  brandingPatronUrl: string | null = null;

  getFotoUrl(url?: string | null): string {
    return getFotoContadorOrDefault(url);
  }

  getFechaEmision(): string {
    if (this.selectedTarjeta?.fecha) {
      return this.selectedTarjeta.fecha;
    }
    if (this.selectedTarjetaHistorial && Array.isArray(this.selectedTarjetaHistorial.estados)) {
      const state = this.selectedTarjetaHistorial.estados.find((e: any) => 
        e.estado?.toLowerCase() === 'emitida' || e.estado?.toLowerCase() === 'activa'
      );
      if (state && state.fecha) {
        return state.fecha;
      }
    }
    return 'No especificada';
  }

  // Variables para Emisión Masiva
  bulkFile: File | null = null;
  bulkResultText: string = '';
  bulkResultClass: string = 'bulk-result';

  // Menú de acciones
  activeMenuId: number | null = null;
  totalRecordsCount: number = 0;
  totalPagesCount: number = 0;
  searchTimeout: any = null;
  private static brandingCache2: any = null;

  ngOnInit(): void {
    this.loadColumnsPreference();
    this.cargarBrandingPublicado();

    this.route.paramMap.subscribe(params => {
      this.evaluarRutaActual(params);
    });
  }

  evaluarRutaActual(paramsMap?: any): void {
    const url = this.router.url;
    let idStr = paramsMap ? paramsMap.get('id') : this.route.snapshot.paramMap.get('id');

    if (!idStr && url.includes('/historial/')) {
      const parts = url.split('/historial/');
      if (parts[1]) {
        idStr = parts[1].split('?')[0];
      }
    }

    if (idStr || url.includes('/historial/')) {
      const id = idStr ? Number(idStr) : 0;
      this.cargarHistorialPorId(id);
    } else if (url.includes('/nueva') || url.includes('/crear')) {
      this.vistaActiva = 'emision-individual';
    } else if (url.includes('/emision-masiva')) {
      this.vistaActiva = 'emision-masiva';
    } else {
      this.vistaActiva = 'listado';
      this.cargarTarjetas();
    }
  }

  cargarBrandingPublicado(): void {
    if (TarjetasSociedadesComponent.brandingCache2) {
      this.aplicarDatosBranding(TarjetasSociedadesComponent.brandingCache2);
      return;
    }

    this.http
      .get<any>(`${API_BASE}/tarjetas/branding-credentials/info-published/2?client_id=${this.clientId}`)
      .subscribe({
        next: (res) => {
          if (res) {
            TarjetasSociedadesComponent.brandingCache2 = res;
          }
          if (this.aplicarDatosBranding(res)) {
            return;
          }
          this.cargarBrandingGeneral(2);
        },
        error: () => {
          this.cargarBrandingGeneral(2);
        }
      });
  }

  private cargarBrandingGeneral(tipoId: number): void {
    this.http
      .get<any>(`${API_BASE}/tarjetas/branding-credentials/info/${tipoId}?client_id=${this.clientId}`)
      .subscribe({
        next: (res) => {
          this.aplicarDatosBranding(res);
        },
        error: (err) => {
          console.warn('No se encontró configuración de branding:', err);
        }
      });
  }

  private aplicarDatosBranding(res: any): boolean {
    if (!res) return false;
    const data = Array.isArray(res) ? res[0] : res;
    if (data) {
      let aplicado = false;
      if (data.color_fondo) { this.brandingColorFondo = data.color_fondo; aplicado = true; }
      if (data.color_letra) { this.brandingColorLetra = data.color_letra; aplicado = true; }
      if (data.fuente_letra) { this.brandingFuenteLetra = data.fuente_letra; aplicado = true; }
      if (data.logo) { this.brandingLogoUrl = data.logo; aplicado = true; }
      if (data.patron) { this.brandingPatronUrl = data.patron; aplicado = true; }
      this.cdr.detectChanges();
      return aplicado;
    }
    return false;
  }

  get visibleColumnsCount(): number {
    return this.availableColumns.filter(c => c.visible).length;
  }

  isColumnVisible(key: string): boolean {
    const col = this.availableColumns.find(c => c.key === key);
    return col ? col.visible : false;
  }

  toggleColumnsMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
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
    this.saveColumnsPreference();
  }

  resetColumns(): void {
    const defaultVisibleKeys = new Set(['expediente', 'solicitante', 'documento', 'matricula', 'correo', 'tarjeta', 'fecha']);
    this.availableColumns.forEach(c => {
      c.visible = defaultVisibleKeys.has(c.key);
    });
    this.columnMessageWarning = '';
    this.saveColumnsPreference();
  }

  private saveColumnsPreference(): void {
    try {
      const state = this.availableColumns.map(c => ({ key: c.key, visible: c.visible }));
      localStorage.setItem('jcc_cols_sociedades', JSON.stringify(state));
    } catch (e) {
      console.warn('No se pudo guardar la preferencia de columnas:', e);
    }
  }

  private loadColumnsPreference(): void {
    try {
      const saved = localStorage.getItem('jcc_cols_sociedades');
      if (saved) {
        const parsed: { key: string; visible: boolean }[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const map = new Map(parsed.map(p => [p.key, p.visible]));
          this.availableColumns.forEach(col => {
            if (map.has(col.key)) {
              col.visible = !!map.get(col.key);
            }
          });
          if (this.availableColumns.every(c => !c.visible)) {
            this.resetColumns();
          }
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar la preferencia de columnas:', e);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.activeMenuId = null;
    const target = event.target as HTMLElement;
    if (!target.closest('.columns-selector-host')) {
      this.isColumnsMenuOpen = false;
    }
  }

  cargarTarjetas(): void {
    this.loading = true;
    this.currentError = null;

    let url = `${API_BASE}/tarjetas/list?tipo_tarjeta=sociedades&client_id=${this.clientId}&page=${this.currentPage}&page_size=${this.pageSize}`;

    const q = this.searchQuery ? this.searchQuery.trim() : '';
    if (q) {
      url += `&filtro_nombre=${encodeURIComponent(q)}`;
    }

    if (this.filterColumn && this.filterValue) {
      const val = encodeURIComponent(this.filterValue.trim());
      if (this.filterColumn === 'documento') {
        url += `&filtro_documento=${val}`;
      } else if (this.filterColumn === 'matricula') {
        url += `&filtro_inscripcion=${val}`;
      } else if (this.filterColumn === 'solicitante') {
        url += `&filtro_nombre=${val}`;
      } else if (this.filterColumn === 'expediente') {
        url += `&filtro_expediente=${val}`;
      }
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

          this.tarjetas = rawList.map((item: any) => ({
            id: item.id,
            client_id: this.clientId,
            tipo_tarjeta: item.tipo_tarjeta || 'sociedades',
            codigo: item.codigo || `SOC-${item.id}`,
            expediente: item.expediente ?? item.no_expd ?? 0,
            solicitante: item.solicitante || item.razon_social || '',
            documento: item.documento ? String(item.documento) : (item.nit ? String(item.nit) : ''),
            matricula: item.matricula || item.inscripcion || item.resolucion || '',
            tipo_sociedad: item.tipo_sociedad || '',
            correo: item.correo || '',
            representante: item.representante || '',
            resolucion: item.resolucion || '',
            fecha_resolucion: item.fecha_resolucion || '',
            acta_jcc: item.acta_jcc || '',
            fecha_inscripcion: item.fecha_inscripcion || '',
            tipo_asociado: item.tipo_asociado || 'primeraVez',
            estado_sociedad: item.estado_sociedad || 'ACTIVO',
            tarjeta: item.tarjeta || item.estado_tarjeta || 'Activa',
            fecha: item.fecha || item.fecha_emision || '',
            foto: item.foto || null
          }));
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar tarjetas de sociedades:', err);
          this.currentError = this.errorHandler.parseError(err, 'MS_3830_TARJETAS_GET', `${API_BASE}/tarjetas/list`);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // Filtrado reactivo
  get filteredTarjetas(): TarjetaSociedad[] {
    return this.tarjetas;
  }

  get sortedTarjetas(): TarjetaSociedad[] {
    return this.tarjetas;
  }

  get paginatedTarjetas(): TarjetaSociedad[] {
    return this.tarjetas;
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

  ordenarPor(columna: keyof TarjetaSociedad | 'id'): void {
    if (this.sortColumn === columna) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columna;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.cargarTarjetas();
  }

  cambiarPagina(p: number): void {
    if (p >= 1 && p <= this.totalPages && p !== this.currentPage) {
      this.currentPage = p;
      this.cargarTarjetas();
    }
  }

  cambiarTamanoPagina(nuevoTamano: number): void {
    this.pageSize = Number(nuevoTamano);
    this.currentPage = 1;
    this.cargarTarjetas();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.cargarTarjetas();
    }, 300);
  }

  trackBySociedadId(index: number, item: TarjetaSociedad): number | string {
    return item.id || item.matricula || index;
  }

  abrirDetalle(t: TarjetaSociedad): void {
    this.selectedTarjeta = t;
    this.isDetailModalOpen = true;
  }

  cerrarDetalle(): void {
    this.isDetailModalOpen = false;
    this.selectedTarjeta = null;
  }

  abrirTarjeta(t: TarjetaSociedad): void {
    this.selectedTarjeta = t;
    this.qrSeed = Math.random();
    this.isCardModalOpen = true;
    this.cargarBrandingPublicado();
  }

  cerrarTarjeta(): void {
    this.isCardModalOpen = false;
    this.selectedTarjeta = null;
  }

  getQrDot(x: number, y: number): boolean {
    return ((x * 23 + this.qrSeed * 17 + x * y * 7) % 11) < 5;
  }

  volver(): void {
    if (this.vistaActiva !== 'listado') {
      this.router.navigate(['/sociedades']);
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  }

  abrirNuevaTarjeta(): void {
    this.nuevaIdentificacion = '';
    this.busquedaRealizada = false;
    this.datosConsulta = null;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.router.navigate(['/sociedades/nueva']);
  }

  cerrarNuevaTarjeta(): void {
    this.nuevaIdentificacion = '';
    this.busquedaRealizada = false;
    this.datosConsulta = null;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.router.navigate(['/sociedades']);
  }

  abrirEmisionMasiva(): void {
    this.bulkFile = null;
    this.bulkResultText = '';
    this.bulkResultClass = 'bulk-result';
    this.router.navigate(['/sociedades/emision-masiva']);
  }

  cerrarEmisionMasiva(): void {
    this.bulkFile = null;
    this.bulkResultText = '';
    this.bulkResultClass = 'bulk-result';
    this.router.navigate(['/sociedades']);
  }

  seleccionarArchivo(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.bulkFile = files[0];
    } else {
      this.bulkFile = null;
    }
  }

  descargarPlantillaCSV(): void {
    const header = "nit_sociedad\n";
    const example = "900123456-7\n";
    const blob = new Blob([header + example], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_emision_sociedades.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  procesarEmisionMasiva(): void {
    if (!this.bulkFile) {
      this.bulkResultText = "Seleccione un archivo CSV o TXT antes de procesar.";
      this.bulkResultClass = "bulk-result visible error";
      return;
    }

    if (!/\.(csv|txt)$/i.test(this.bulkFile.name)) {
      this.bulkResultText = "El archivo debe tener extensión .csv o .txt.";
      this.bulkResultClass = "bulk-result visible error";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const fileContent = reader.result as string;
      const rows = fileContent.split(/\r?\n/).filter(row => row.trim());
      const records = Math.max(0, rows.length - 1);

      if (!records) {
        this.bulkResultText = "La plantilla no contiene registros para procesar.";
        this.bulkResultClass = "bulk-result visible error";
        return;
      }

      this.bulkResultText = `Archivo validado: ${records} sociedades listas para emisión. La integración con el backend procesará duplicados, errores y notificaciones.`;
      this.bulkResultClass = "bulk-result visible";
      this.cdr.detectChanges();
    };
    reader.onerror = () => {
      this.bulkResultText = "No fue posible leer el archivo seleccionado.";
      this.bulkResultClass = "bulk-result visible error";
      this.cdr.detectChanges();
    };
    reader.readAsText(this.bulkFile);
  }

  consultarSociedad(): void {
    const identification = this.nuevaIdentificacion.trim();
    if (!identification) {
      this.mensajeError = "Ingrese el NIT de la sociedad.";
      return;
    }
    if (!this.tipoSolicitud) {
      this.mensajeError = "Seleccione el tipo de solicitud.";
      return;
    }
    this.mensajeError = '';
    this.mensajeExito = '';
    this.cargandoBusqueda = true;

    this.http.get<any>(`${API_BASE}/tarjetas/consult-registry?documento=${encodeURIComponent(identification)}&tipo_tarjeta=sociedades&tipo=${encodeURIComponent(this.tipoSolicitud)}&client_id=${this.clientId}`)
      .subscribe({
        next: (res) => {
          this.cargandoBusqueda = false;
          this.busquedaRealizada = true;

          const item = res && res.disponibles && res.disponibles.length > 0 ? res.disponibles[0] : null;

          if (item) {
            const razonSocial = item.RAZON_SOCIAL || item.NOMBRES || "Sociedad de Contadores Públicos";
            const docNum = item.NO_DOCUMENTO || item.NIT || identification;

            const localTarjeta = this.tarjetas.find(t =>
              t.documento.replace(/\D/g, '') === String(docNum).replace(/\D/g, '')
            );

            this.datosConsulta = {
              solicitante: razonSocial,
              documento: `NIT ${docNum}`,
              matricula: item.NO_TARJETA || `REG-${docNum}`,
              expediente: item.NO_EXPD || item.EXPEDIENTE || 0,
              correo: localTarjeta?.correo || `contacto@${razonSocial.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
              representante: item.REPRESENTANTE_LEGAL || "Representante Legal Autorizado",
              estado: item.ESTADO_SOCIEDAD || item.ESTADO_CONTADOR || "ACTIVO",
              seccional: item.SECCIONAL || "",
              resolucion: item.RESOLUCION || "",
              foto: item.FOTO || item.pdf || res.pdf || localTarjeta?.foto || null,
              existe: !!localTarjeta
            };
          } else {
            this.datosConsulta = null;
            this.mensajeError = "No se encontraron registros de sociedad oficial para el NIT e información ingresados.";
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al consultar registro de sociedad en la JCC:', err);
          this.cargandoBusqueda = false;
          this.busquedaRealizada = true;
          this.datosConsulta = null;
          const appErr = this.errorHandler.parseError(err, 'MS_3834_CONSULTA_MATRICULA', `${API_BASE}/tarjetas/consult-registry`);
          this.mensajeError = `${appErr.title}: ${appErr.message}`;
          this.cdr.detectChanges();
        }
      });
  }

  confirmarEmision(): void {
    if (!this.datosConsulta) return;

    this.loading = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const doc = (this.nuevaIdentificacion || (this.datosConsulta.documento ? this.datosConsulta.documento.replace(/[^\d-]/g, '') : '')).trim();
    const payload = {
      documento: doc,
      tipo: this.tipoSolicitud || "primeraVez"
    };

    this.http.post<any>(`${API_BASE}/tarjetas/sociedad/create?client_id=${this.clientId}`, payload)
      .subscribe({
        next: (res) => {
          this.mensajeExito = res?.message || "Tarjeta digital de sociedad emitida exitosamente.";
          this.loading = false;
          this.busquedaRealizada = false;
          this.datosConsulta = null;
          this.nuevaIdentificacion = '';
          this.router.navigate(['/sociedades']);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al emitir tarjeta de sociedad:', err);
          const appErr = this.errorHandler.parseError(err, 'MS_3831_TARJETAS_CREATE', `${API_BASE}/tarjetas/sociedad/create`);
          this.mensajeError = `${appErr.title}: ${appErr.message}`;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  toggleActionsMenu(event: Event, id: number): void {
    event.stopPropagation();
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  abrirHistorial(t: TarjetaSociedad): void {
    this.selectedTarjeta = t;
    this.router.navigate(['/sociedades/historial', t.id]);
  }

  regenerarTarjeta(t: TarjetaSociedad): void {
    // HU-JCC-010: Regeneración de credencial digital (sin funcionalidad por ahora)
  }

  cargarHistorialPorId(id: number): void {
    this.vistaActiva = 'historial';
    this.selectedTarjetaHistorial = null;
    if (id <= 0) return;

    this.http.get(`${API_BASE}/tarjetas/historial/${id}?client_id=${this.clientId}&tipo=sociedad`)
      .subscribe({
        next: (res: any) => {
          this.selectedTarjetaHistorial = res;
          if (res && res.tarjeta) {
            this.selectedTarjeta = res.tarjeta;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar historial de la tarjeta:', err);
          this.currentError = this.errorHandler.parseError(err, 'MS_3832_TARJETAS_HISTORIAL', `${API_BASE}/tarjetas/historial/${id}`);
          this.cdr.detectChanges();
        }
      });
  }

  cerrarHistorial(): void {
    this.selectedTarjeta = null;
    this.selectedTarjetaHistorial = null;
    this.router.navigate(['/sociedades']);
  }

  exportarCSV(): void {
    if (!this.filteredTarjetas || this.filteredTarjetas.length === 0) {
      alert('No hay registros para exportar');
      return;
    }
    const headers = ['Expediente', 'Razón Social', 'NIT', 'Registro Sociedad', 'Representante', 'Estado', 'Fecha'];
    const rows = this.filteredTarjetas.map(t => [
      `"${t.expediente}"`,
      `"${(t.solicitante || '').replace(/"/g, '""')}"`,
      `"${t.documento}"`,
      `"${t.matricula}"`,
      `"${(t.representante || '').replace(/"/g, '""')}"`,
      `"${t.tarjeta}"`,
      `"${t.fecha}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tarjetas_sociedades_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
