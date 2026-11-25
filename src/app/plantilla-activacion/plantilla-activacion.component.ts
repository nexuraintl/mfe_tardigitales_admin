import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { NxAlertComponent } from '../shared/components/alert/alert.component';
import { NxFieldErrorComponent } from '../shared/components/field-error/field-error.component';

export interface KeywordItem {
  key: string;
  placeholder: string;
  label: string;
}

export interface PlantillaHistorialItem {
  id: number;
  tipo_tarjeta: string;
  titulo: string;
  nombre_archivo: string;
  tamano_bytes: number;
  estado: 'Activa' | 'Inactiva' | string;
  usuario: string;
  fecha_modificacion: string;
}

const KEYWORDS_CONTADORES_COLS: KeywordItem[] = [
  { key: 'TARJETA_PROFESIONAL', placeholder: '{TARJETA_PROFESIONAL}', label: 'Tarjeta profesional' },
  { key: 'NOMBRE_COMPLETO', placeholder: '{NOMBRE_COMPLETO}', label: 'Nombre completo' },
  { key: 'EXPEDIENTE', placeholder: '{EXPEDIENTE}', label: 'Expediente' },
  { key: 'TIPO', placeholder: '{TIPO}', label: 'Tipo' },
  { key: 'FECHA_EMISION', placeholder: '{FECHA_EMISION}', label: 'Fecha emisión' },
  { key: 'CEDULA', placeholder: '{CEDULA}', label: 'Cédula de ciudadanía' },
  { key: 'CORREO', placeholder: '{CORREO}', label: 'Correo' },
  { key: 'UNIVERSIDAD', placeholder: '{UNIVERSIDAD}', label: 'Universidad' },
  { key: 'ESTADO_TARJETA', placeholder: '{ESTADO_TARJETA}', label: 'Estado tarjeta' },
  { key: 'ESTADO_REGISTRO', placeholder: '{ESTADO_REGISTRO}', label: 'Estado registro' },
  { key: 'RESOLUCION', placeholder: '{RESOLUCION}', label: 'Resolución' },
  { key: 'FECHA_ESTADO', placeholder: '{FECHA_ESTADO}', label: 'Fecha del estado' },
  { key: 'FECHA_RADICACION', placeholder: '{FECHA_RADICACION}', label: 'Fecha de radicación' },
  { key: 'FECHA_RESOLUCION', placeholder: '{FECHA_RESOLUCION}', label: 'Fecha de resolución' },
  { key: 'ACTA_JCC', placeholder: '{ACTA_JCC}', label: 'Acta JCC' },
  { key: 'FECHA_GRADO', placeholder: '{FECHA_GRADO}', label: 'Fecha de grado' },
  { key: 'SECCIONAL', placeholder: '{SECCIONAL}', label: 'Seccional' },
  { key: 'FECHA_ACTIVACION', placeholder: '{FECHA_ACTIVACION}', label: 'Fecha activación' },
];

const KEYWORDS_SOCIEDADES_COLS: KeywordItem[] = [
  { key: 'EXPEDIENTE', placeholder: '{EXPEDIENTE}', label: 'Expediente' },
  { key: 'RAZON_SOCIAL', placeholder: '{RAZON_SOCIAL}', label: 'Razón social' },
  { key: 'NIT', placeholder: '{NIT}', label: 'NIT' },
  { key: 'TIPO', placeholder: '{TIPO}', label: 'Tipo' },
  { key: 'CORREO', placeholder: '{CORREO}', label: 'Correo' },
  { key: 'FECHA_EMISION', placeholder: '{FECHA_EMISION}', label: 'Fecha emisión' },
  { key: 'TIPO_REGISTRO', placeholder: '{TIPO_REGISTRO}', label: 'Tipo de registro' },
  { key: 'INSCRIPCION', placeholder: '{INSCRIPCION}', label: 'Inscripción' },
  { key: 'FECHA_RADICACION', placeholder: '{FECHA_RADICACION}', label: 'Fecha de radicación' },
  { key: 'ESTADO_TARJETA', placeholder: '{ESTADO_TARJETA}', label: 'Estado de la tarjeta' },
  { key: 'ESTADO_SOCIEDAD', placeholder: '{ESTADO_SOCIEDAD}', label: 'Estado de la sociedad' },
  { key: 'RESOLUCION', placeholder: '{RESOLUCION}', label: 'Resolución' },
  { key: 'FECHA_RESOLUCION', placeholder: '{FECHA_RESOLUCION}', label: 'Fecha de resolución' },
  { key: 'ACTA_JCC', placeholder: '{ACTA_JCC}', label: 'Acta JCC' },
  { key: 'ESTADO_SOLICITUD', placeholder: '{ESTADO_SOLICITUD}', label: 'Estado de la solicitud' },
  { key: 'TIPO_SOLICITUD', placeholder: '{TIPO_SOLICITUD}', label: 'Tipo de solicitud' },
  { key: 'FECHA_ACTIVACION', placeholder: '{FECHA_ACTIVACION}', label: 'Fecha activación' },
];

const KEYWORDS_SOPORTE: KeywordItem[] = [
  { key: 'NUMERO_SOPORTE', placeholder: '{NUMERO_SOPORTE}', label: 'Número de soporte (consecutivo por fecha de activación)' },
  { key: 'FECHA_GENERACION', placeholder: '{FECHA_GENERACION}', label: 'Fecha y hora de generación del soporte' },
];

@Component({
  selector: 'app-plantilla-activacion',
  standalone: true,
  imports: [CommonModule, FormsModule, NxAlertComponent, NxFieldErrorComponent],
  template: `
    <div class="container-fluid py-3">
      <nx-alert
        *ngIf="alertMessage"
        [type]="alertType"
        [title]="alertTitle"
        [message]="alertMessage"
        (closed)="clearAlert()"
      ></nx-alert>

      <div class="row g-3 mb-3">
        <!-- Card 1: Cargar plantilla -->
        <div class="col-12 col-xl-6">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white">
              <h5 class="card-title mb-1">Cargar plantilla</h5>
              <p class="text-muted small mb-0">
                Plantilla Word del soporte de activación de la tarjeta digital de {{ tipoDescripcion }}.
              </p>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label" for="nombrePlantillaInput">
                  Nombre de la plantilla <span class="text-danger">*</span>
                </label>
                <input
                  id="nombrePlantillaInput"
                  type="text"
                  class="form-control"
                  [class.is-invalid]="!!nombreError"
                  [(ngModel)]="nombrePlantilla"
                  (ngModelChange)="onNombreChange()"
                  maxlength="120"
                  [placeholder]="placeholderNombre"
                  autocomplete="off"
                />
                <nx-field-error [error]="nombreError"></nx-field-error>
              </div>

              <div class="mb-3">
                <label class="form-label">
                  Archivo de la plantilla (.docx) <span class="text-danger">*</span>
                </label>

                <input
                  #fileInput
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  class="d-none"
                  (change)="onFileSelected($event)"
                />

                <!-- Dropzone cuando no hay archivo -->
                <div
                  *ngIf="!selectedFile"
                  class="pa-dropzone"
                  [class.pa-dropzone-over]="isDragging"
                  [class.pa-dropzone-error]="!!archivoError"
                  tabindex="0"
                  role="button"
                  (click)="fileInput.click()"
                  (keydown.enter)="fileInput.click()"
                  (keydown.space)="$event.preventDefault(); fileInput.click()"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)"
                >
                  <div class="pa-dropzone-icon">
                    <i class="fa fa-upload"></i>
                  </div>
                  <div class="fw-semibold text-dark">
                    Arrastre el archivo aquí o <span class="pa-link">haga clic para seleccionarlo</span>
                  </div>
                  <div class="text-muted small">
                    Solo archivos Word (.docx) · Tamaño máximo 5 MB
                  </div>
                </div>

                <!-- Archivo seleccionado -->
                <div *ngIf="selectedFile" class="pa-file-box">
                  <div class="pa-file-badge">W</div>
                  <div class="pa-file-info">
                    <div class="pa-file-name">{{ selectedFile.name }}</div>
                    <div class="text-muted small">{{ fileMetaText }}</div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-link text-secondary text-decoration-none"
                    title="Quitar archivo"
                    (click)="removeFile()"
                  >
                    <i class="fa fa-times"></i>
                  </button>
                </div>

                <nx-field-error [error]="archivoError"></nx-field-error>
              </div>

              <div class="pa-info-note mb-3">
                <i class="fa fa-info-circle me-1"></i>
                Al guardar, la plantilla cargada quedará <strong>Activa</strong> y la plantilla activa anterior pasará a <strong>Inactiva</strong>.
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  [disabled]="isSaving"
                  (click)="resetForm()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  [disabled]="isSaving"
                  (click)="guardarPlantilla()"
                >
                  <i class="fa" [ngClass]="isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-o'"></i>
                  <span class="ms-1">{{ isSaving ? 'Guardando...' : 'Guardar plantilla' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Palabras clave -->
        <div class="col-12 col-xl-6">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white">
              <h5 class="card-title mb-1">
                Palabras clave — {{ tipoTitulo }} ({{ totalPalabrasClave }})
              </h5>
              <p class="text-muted small mb-0">
                Use estas palabras clave dentro del archivo Word. Haga clic para copiarlas.
              </p>
            </div>
            <div class="card-body">
              <div class="pa-kw-group-title">
                Columnas del listado {{ listadoNombre }} ({{ columnasKeywords.length }})
              </div>
              <div class="pa-kw-grid mb-3">
                <button
                  *ngFor="let item of columnasKeywords"
                  type="button"
                  class="pa-kw-btn"
                  [class.pa-kw-copied]="copiedKey === item.key"
                  [title]="'Copiar ' + item.placeholder + ' — ' + item.label"
                  (click)="copiarPalabraClave(item)"
                >
                  <code class="pa-kw-code">{{ item.placeholder }}</code>
                  <span class="pa-kw-label">{{ item.label }}</span>
                  <span class="pa-kw-status">
                    <ng-container *ngIf="copiedKey === item.key; else copyIcon">
                      <i class="fa fa-check me-1"></i>Copiada
                    </ng-container>
                    <ng-template #copyIcon>
                      <i class="fa fa-clone"></i>
                    </ng-template>
                  </span>
                </button>
              </div>

              <div class="pa-kw-group-title">
                Soporte de activación ({{ soporteKeywords.length }})
              </div>
              <div class="pa-kw-grid">
                <button
                  *ngFor="let item of soporteKeywords"
                  type="button"
                  class="pa-kw-btn"
                  [class.pa-kw-copied]="copiedKey === item.key"
                  [title]="'Copiar ' + item.placeholder + ' — ' + item.label"
                  (click)="copiarPalabraClave(item)"
                >
                  <code class="pa-kw-code">{{ item.placeholder }}</code>
                  <span class="pa-kw-label">{{ item.label }}</span>
                  <span class="pa-kw-status">
                    <ng-container *ngIf="copiedKey === item.key; else copyIconSop">
                      <i class="fa fa-check me-1"></i>Copiada
                    </ng-container>
                    <ng-template #copyIconSop>
                      <i class="fa fa-clone"></i>
                    </ng-template>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Historial de plantillas -->
      <div class="card shadow-sm border-0">
        <div class="card-header bg-white">
          <h5 class="card-title mb-1">Historial de plantillas</h5>
          <p class="text-muted small mb-0">
            Plantillas cargadas para {{ tipoTituloMinuscula }}, de la más reciente a la más antigua.
          </p>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Título</th>
                  <th>Estado</th>
                  <th>Fecha y hora de modificación</th>
                  <th>Usuario</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="isLoadingHistorial">
                  <td colspan="5" class="text-center text-muted py-4">
                    <i class="fa fa-spinner fa-spin me-2"></i>Cargando historial de plantillas...
                  </td>
                </tr>
                <tr *ngIf="!isLoadingHistorial && historial.length === 0">
                  <td colspan="5" class="text-center text-muted py-4">
                    No hay plantillas registradas para {{ tipoTituloMinuscula }}.
                  </td>
                </tr>
                <tr
                  *ngFor="let row of historial"
                  [class.pa-row-highlight]="row.id === lastSavedId"
                >
                  <td class="fw-semibold text-dark">{{ row.titulo }}</td>
                  <td>
                    <span
                      class="badge"
                      [ngClass]="row.estado === 'Activa' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'"
                    >
                      {{ row.estado }}
                    </span>
                  </td>
                  <td>{{ row.fecha_modificacion }}</td>
                  <td>{{ row.usuario }}</td>
                  <td class="text-end">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      (click)="descargarPlantilla(row)"
                    >
                      <i class="fa fa-download me-1"></i>Descargar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="d-flex flex-wrap justify-content-between align-items-center mt-3 pt-2 border-top">
            <div class="text-muted small">
              Mostrando {{ rangoInicio }} a {{ rangoFin }} de {{ totalRegistros }} registros
            </div>
            <div class="btn-group btn-group-sm" role="group" aria-label="Paginación de historial">
              <button
                type="button"
                class="btn btn-outline-secondary"
                [disabled]="page <= 1 || isLoadingHistorial"
                (click)="cambiarPagina(page - 1)"
              >
                &laquo;
              </button>
              <button
                *ngFor="let p of paginas"
                type="button"
                class="btn"
                [ngClass]="p === page ? 'btn-primary' : 'btn-outline-secondary'"
                [disabled]="isLoadingHistorial"
                (click)="cambiarPagina(p)"
              >
                {{ p }}
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                [disabled]="page >= totalPages || isLoadingHistorial"
                (click)="cambiarPagina(page + 1)"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pa-dropzone {
      border: 2px dashed #cbd5e1;
      border-radius: 10px;
      background-color: #f8fafc;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .pa-dropzone:hover,
    .pa-dropzone-over {
      border-color: #1e3a8a;
      background-color: #eef2ff;
    }
    .pa-dropzone-error {
      border-color: #dc2626;
      background-color: #fef2f2;
    }
    .pa-dropzone-icon {
      font-size: 20px;
      color: #1e3a8a;
    }
    .pa-link {
      color: #1e3a8a;
      text-decoration: underline;
    }
    .pa-file-box {
      border: 1px solid #c7d2fe;
      background-color: #eef2ff;
      border-radius: 10px;
      min-height: 64px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
    }
    .pa-file-badge {
      width: 34px;
      height: 40px;
      border-radius: 4px;
      background-color: #2b579a;
      color: #ffffff;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .pa-file-info {
      min-width: 0;
      flex: 1;
    }
    .pa-file-name {
      font-weight: 600;
      color: #1e293b;
      word-break: break-all;
    }
    .pa-info-note {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12.5px;
    }
    .pa-kw-group-title {
      font-size: 11.5px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 8px;
    }
    .pa-kw-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 6px;
    }
    .pa-kw-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 11.5px;
      color: #64748b;
      background-color: #ffffff;
      min-width: 0;
      text-align: left;
      transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .pa-kw-btn:hover {
      border-color: #94a3b8;
      background-color: #f8fafc;
    }
    .pa-kw-code {
      font-family: Menlo, Consolas, monospace;
      font-size: 11px;
      color: #1e3a8a;
      background-color: #e8effc;
      border-radius: 4px;
      padding: 1px 5px;
      white-space: nowrap;
    }
    .pa-kw-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }
    .pa-kw-status {
      color: #94a3b8;
      flex-shrink: 0;
      font-size: 11px;
    }
    .pa-kw-copied {
      border-color: #16a34a;
      background-color: #f0fdf4;
    }
    .pa-kw-copied .pa-kw-status {
      color: #16a34a;
      font-weight: 600;
    }
    .pa-row-highlight td {
      background-color: #f0fdf4;
    }
  `]
})
export class PlantillaActivacionComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private routerSub?: Subscription;

  tipoTarjeta: 'contadores' | 'sociedades' = 'contadores';
  nombrePlantilla = '';
  selectedFile: File | null = null;
  selectedFileBase64 = '';
  detectedFileKeys: string[] | 'invalid' | null = null;
  fileMetaText = '';
  isDragging = false;
  isSaving = false;

  nombreError = '';
  archivoError = '';

  alertType: 'success' | 'danger' | 'warning' | 'info' = 'danger';
  alertTitle = '';
  alertMessage = '';

  copiedKey: string | null = null;
  private copyTimer: any = null;

  historial: PlantillaHistorialItem[] = [];
  isLoadingHistorial = false;
  page = 1;
  pageSize = 5;
  totalRegistros = 0;
  totalPages = 1;
  lastSavedId: number | null = null;

  private readonly maxBytes = 5 * 1024 * 1024;

  get isSociedades(): boolean {
    return this.tipoTarjeta === 'sociedades';
  }

  get tipoTitulo(): string {
    return this.isSociedades ? 'Sociedades' : 'Contadores';
  }

  get tipoTituloMinuscula(): string {
    return this.isSociedades ? 'sociedades' : 'contadores';
  }

  get tipoDescripcion(): string {
    return this.isSociedades ? 'sociedades (persona jurídica)' : 'contadores (persona natural)';
  }

  get listadoNombre(): string {
    return this.isSociedades ? 'Tarjetas sociedades' : 'Tarjetas contadores';
  }

  get placeholderNombre(): string {
    const nextVersion = Math.max(1, this.totalRegistros + 1);
    return `Ej.: Soporte de activación – ${this.tipoTitulo} v${nextVersion}`;
  }

  get columnasKeywords(): KeywordItem[] {
    return this.isSociedades ? KEYWORDS_SOCIEDADES_COLS : KEYWORDS_CONTADORES_COLS;
  }

  get soporteKeywords(): KeywordItem[] {
    return KEYWORDS_SOPORTE;
  }

  get totalPalabrasClave(): number {
    return this.columnasKeywords.length + this.soporteKeywords.length;
  }

  get rangoInicio(): number {
    return this.totalRegistros === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get rangoFin(): number {
    return Math.min(this.totalRegistros, (this.page - 1) * this.pageSize + this.historial.length);
  }

  get paginas(): number[] {
    const count = Math.max(1, this.totalPages);
    return Array.from({ length: count }, (_, idx) => idx + 1);
  }

  ngOnInit(): void {
    this.resolverTipoDesdeRuta();
    this.cargarHistorial();

    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        const prev = this.tipoTarjeta;
        this.resolverTipoDesdeRuta();
        if (prev !== this.tipoTarjeta) {
          this.page = 1;
          this.resetForm();
          this.cargarHistorial();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
    }
  }

  private resolverTipoDesdeRuta(): void {
    const dataTipo = this.route.snapshot.data?.['tipo'];
    const url = this.router.url || '';
    if (dataTipo === 'sociedades' || url.includes('sociedades')) {
      this.tipoTarjeta = 'sociedades';
    } else {
      this.tipoTarjeta = 'contadores';
    }
  }

  onNombreChange(): void {
    if (this.nombreError && this.nombrePlantilla.trim()) {
      this.nombreError = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      this.removeFile();
      this.archivoError = 'Solo se permite cargar un (1) archivo por plantilla.';
      return;
    }
    this.procesarArchivo(files[0]);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.procesarArchivo(file);
    }
    input.value = '';
  }

  removeFile(): void {
    this.selectedFile = null;
    this.selectedFileBase64 = '';
    this.detectedFileKeys = null;
    this.fileMetaText = '';
    this.archivoError = '';
  }

  resetForm(): void {
    this.nombrePlantilla = '';
    this.nombreError = '';
    this.removeFile();
    this.clearAlert();
  }

  clearAlert(): void {
    this.alertTitle = '';
    this.alertMessage = '';
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  private async procesarArchivo(file: File): Promise<void> {
    this.clearAlert();
    this.archivoError = '';

    if (!/\.docx$/i.test(file.name)) {
      this.removeFile();
      this.archivoError = 'Formato no permitido. Solo se permiten archivos Word (.docx).';
      return;
    }

    if (file.size > this.maxBytes) {
      this.removeFile();
      this.archivoError = `El archivo supera el tamaño máximo permitido de 5 MB (${this.formatBytes(file.size)}).`;
      return;
    }

    this.selectedFile = file;
    this.fileMetaText = `${this.formatBytes(file.size)} · Documento de Word (.docx)`;

    try {
      const arrayBuf = await file.arrayBuffer();
      this.selectedFileBase64 = this.arrayBufferToBase64(arrayBuf);
      const keys = await this.extraerPalabrasClaveDocx(arrayBuf);
      if (this.selectedFile !== file) return;
      this.detectedFileKeys = keys;
    } catch {
      if (this.selectedFile !== file) return;
      this.detectedFileKeys = 'invalid';
    }
    this.cdr.markForCheck();
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  private async extraerPalabrasClaveDocx(buf: ArrayBuffer): Promise<string[]> {
    const u = new Uint8Array(buf);
    const v = new DataView(buf);
    let eocd = -1;
    for (let i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) {
      if (v.getUint32(i, true) === 0x06054b50) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) throw new Error('zip');

    const n = v.getUint16(eocd + 10, true);
    let p = v.getUint32(eocd + 16, true);
    const dec = new TextDecoder();
    const parts: string[] = [];

    for (let i = 0; i < n; i++) {
      if (v.getUint32(p, true) !== 0x02014b50) throw new Error('zip');
      const method = v.getUint16(p + 10, true);
      const csize = v.getUint32(p + 20, true);
      const nl = v.getUint16(p + 28, true);
      const el = v.getUint16(p + 30, true);
      const cl = v.getUint16(p + 32, true);
      const off = v.getUint32(p + 42, true);
      const name = dec.decode(u.subarray(p + 46, p + 46 + nl));

      if (/^word\/(document|header\d*|footer\d*)\.xml$/.test(name)) {
        const ln = v.getUint16(off + 26, true);
        const le = v.getUint16(off + 28, true);
        const start = off + 30 + ln + le;
        const raw = u.subarray(start, start + csize);
        if (method === 8 && typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('deflate-raw');
          const stream = new Blob([raw]).stream().pipeThrough(ds);
          const inflated = new Uint8Array(await new Response(stream).arrayBuffer());
          parts.push(dec.decode(inflated));
        } else if (method === 0) {
          parts.push(dec.decode(raw));
        }
      }
      p += 46 + nl + el + cl;
    }

    if (!parts.length) throw new Error('docx');

    const found = new Set<string>();
    const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    for (const xml of parts) {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const ps = doc.getElementsByTagNameNS(ns, 'p');
      for (let i = 0; i < ps.length; i++) {
        const ts = ps[i].getElementsByTagNameNS(ns, 't');
        let text = '';
        for (let j = 0; j < ts.length; j++) {
          text += ts[j].textContent || '';
        }
        const matches = text.matchAll(/\{\s*([A-Za-z0-9_ÁÉÍÓÚÑáéíóúñ]+)\s*\}/g);
        for (const m of matches) {
          if (m[1]) found.add(m[1].trim());
        }
      }
    }
    return Array.from(found);
  }

  async copiarPalabraClave(item: KeywordItem): Promise<void> {
    const text = item.placeholder;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {}
      ta.remove();
    }
    this.copiedKey = item.key;
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => {
      this.copiedKey = null;
      this.cdr.markForCheck();
    }, 1500);
  }

  guardarPlantilla(): void {
    this.clearAlert();
    const cleanName = this.nombrePlantilla.trim();

    this.nombreError = cleanName ? '' : 'El nombre de la plantilla es obligatorio.';
    if (!this.selectedFile && !this.archivoError) {
      this.archivoError = 'Debe cargar el archivo de la plantilla (.docx).';
    }

    if (this.nombreError || this.archivoError || !this.selectedFile) {
      this.alertType = 'danger';
      this.alertTitle = '';
      this.alertMessage = 'No fue posible guardar la plantilla. Revise los campos marcados.';
      return;
    }

    if (this.detectedFileKeys === 'invalid') {
      this.alertType = 'danger';
      this.alertTitle = '';
      this.alertMessage = 'El archivo seleccionado no es un documento Word (.docx) válido. Cárguelo nuevamente.';
      return;
    }

    if (Array.isArray(this.detectedFileKeys)) {
      const validSet = new Set([
        ...this.columnasKeywords.map(k => k.key),
        ...this.soporteKeywords.map(k => k.key),
      ]);
      const invalidas = this.detectedFileKeys.filter(k => !validSet.has(k));
      if (invalidas.length > 0) {
        const lista = invalidas.map(k => `{${k}}`).join(', ');
        this.alertType = 'danger';
        this.alertTitle = '';
        this.alertMessage = `El archivo contiene palabras clave que no existen para ${this.tipoTitulo}: ${lista}. Corrija el documento y cárguelo nuevamente.`;
        return;
      }
    }

    this.isSaving = true;
    const payload = {
      titulo: cleanName,
      tipo_tarjeta: this.tipoTarjeta,
      nombre_archivo: this.selectedFile.name,
      archivo_base64: this.selectedFileBase64,
    };

    this.http
      .post<any>(`${API_BASE}/tarjetas/plantilla-activacion/guardar?client_id=${CLIENT_ID}`, payload)
      .subscribe({
        next: (res) => {
          this.isSaving = false;
          const savedTitle = res?.data?.titulo || cleanName;
          this.lastSavedId = res?.data?.id || null;
          this.resetForm();
          this.alertType = 'success';
          this.alertTitle = 'Plantilla guardada';
          this.alertMessage = `«${savedTitle}» quedó activa. La plantilla anterior pasó a Inactiva.`;
          this.page = 1;
          this.cargarHistorial();
          setTimeout(() => {
            this.lastSavedId = null;
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (err) => {
          this.isSaving = false;
          const msg =
            err?.error?.error?.mensaje ||
            err?.error?.detail ||
            err?.error?.message ||
            'No fue posible guardar la plantilla.';
          this.alertType = 'danger';
          this.alertTitle = '';
          this.alertMessage = msg;
          this.cdr.markForCheck();
        },
      });
  }

  cargarHistorial(): void {
    this.isLoadingHistorial = true;
    this.http
      .get<any>(
        `${API_BASE}/tarjetas/plantilla-activacion/historial?tipo_tarjeta=${this.tipoTarjeta}&page=${this.page}&page_size=${this.pageSize}&client_id=${CLIENT_ID}`
      )
      .subscribe({
        next: (res) => {
          this.isLoadingHistorial = false;
          this.historial = Array.isArray(res?.data) ? res.data : [];
          this.totalRegistros = Number(res?.total || 0);
          this.totalPages = Math.max(1, Number(res?.total_pages || 1));
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingHistorial = false;
          this.historial = [];
          this.totalRegistros = 0;
          this.totalPages = 1;
          this.cdr.markForCheck();
        },
      });
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages || nuevaPagina === this.page) return;
    this.page = nuevaPagina;
    this.cargarHistorial();
  }

  descargarFormatoEjemplo(): void {
    const filename = this.isSociedades
      ? 'Formato_ejemplo_Plantilla_Activacion_Sociedades.docx'
      : 'Formato_ejemplo_Plantilla_Activacion_Contadores.docx';
    this.http
      .get(`${API_BASE}/tarjetas/plantilla-activacion/formato-ejemplo?tipo_tarjeta=${this.tipoTarjeta}&client_id=${CLIENT_ID}`, {
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => this.dispararDescarga(blob, filename),
        error: () => {
          this.alertType = 'danger';
          this.alertTitle = '';
          this.alertMessage = 'No fue posible descargar el formato de ejemplo.';
          this.cdr.markForCheck();
        },
      });
  }

  descargarPlantilla(row: PlantillaHistorialItem): void {
    const fallbackName = `${(row.titulo || 'plantilla').replace(/[^\wÁÉÍÓÚáéíóúÑñ\- ]+/g, '').replace(/\s+/g, '_')}.docx`;
    const filename = row.nombre_archivo || fallbackName;
    this.http
      .get(
        `${API_BASE}/tarjetas/plantilla-activacion/${row.id}/descargar?tipo_tarjeta=${this.tipoTarjeta}&client_id=${CLIENT_ID}`,
        { responseType: 'blob' }
      )
      .subscribe({
        next: (blob) => this.dispararDescarga(blob, filename),
        error: () => {
          this.alertType = 'danger';
          this.alertTitle = '';
          this.alertMessage = 'No fue posible descargar el archivo de la plantilla seleccionada.';
          this.cdr.markForCheck();
        },
      });
  }

  private dispararDescarga(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}
