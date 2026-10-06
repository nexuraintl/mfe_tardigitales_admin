import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { ErrorHandlerService, AppError } from '../core/services/error-handler.service';
import { NxAlertComponent } from '../shared/components/alert/alert.component';

export interface InstitucionalHistoryItem {
  id: number;
  version: number;
  nombre_director: string;
  cargo_director: string;
  firma_director?: string;
  publicado: boolean;
  created_at_formatted?: string;
}

@Component({
  selector: 'app-branding-institucional',
  standalone: true,
  imports: [CommonModule, FormsModule, NxAlertComponent],
  templateUrl: './branding-institucional.component.html',
  styleUrls: ['./branding-institucional.component.css']
})
export class BrandingInstitucionalComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);

  clientId: number = CLIENT_ID;

  loading: boolean = false;
  saving: boolean = false;
  publishing: boolean = false;
  versionBeingPublished: number | null = null;
  currentError: AppError | null = null;
  mensajeExito: string = '';

  publishedVersion: number | null = null;
  selectedVersionNumber: number | null = null;

  // Form / Draft fields
  nombreDirector: string = 'SANDRA MILENA BARRIOS PULIDO';
  cargoDirector: string = 'DIRECTOR GENERAL';
  firmaFile: File | null = null;
  firmaPreviewUrl: string | null = null;
  firmaSourceText: string = '';

  selectedVersionBase: {
    nombre_director: string;
    cargo_director: string;
    firma_director: string | null;
  } | null = null;

  historyVersions: InstitucionalHistoryItem[] = [];

  get hasFormChanges(): boolean {
    if (this.firmaFile !== null) return true;
    if (!this.selectedVersionBase) return true;

    const nombreChanged = (this.nombreDirector || '').trim().toLowerCase() !== (this.selectedVersionBase.nombre_director || '').trim().toLowerCase();
    const cargoChanged = (this.cargoDirector || '').trim().toLowerCase() !== (this.selectedVersionBase.cargo_director || '').trim().toLowerCase();
    const firmaChanged = (this.firmaPreviewUrl || null) !== (this.selectedVersionBase.firma_director || null);

    return nombreChanged || cargoChanged || firmaChanged;
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.currentError = null;

    this.http
      .get<any>(`${API_BASE}/tarjetas/branding-credentials/institucional/info-published?client_id=${this.clientId}`)
      .subscribe({
        next: (res) => {
          if (res && res.data) {
            const data = res.data;
            this.publishedVersion = Number(data.version || 1);
            this.selectedVersionNumber = this.publishedVersion;

            this.nombreDirector = data.nombre_director || 'SANDRA MILENA BARRIOS PULIDO';
            this.cargoDirector = data.cargo_director || 'DIRECTOR GENERAL';
            this.firmaPreviewUrl = data.firma_director || null;
            this.firmaSourceText = this.firmaPreviewUrl ? `Versión v${this.publishedVersion}` : '';

            this.selectedVersionBase = {
              nombre_director: this.nombreDirector,
              cargo_director: this.cargoDirector,
              firma_director: this.firmaPreviewUrl
            };
          }
          this.cargarHistorial();
        },
        error: (err) => {
          console.warn('No se pudo cargar la configuración institucional vigente:', err);
          this.cargarHistorial();
        }
      });
  }

  cargarHistorial(preferredVersionNumber?: number): void {
    this.http
      .get<any>(`${API_BASE}/tarjetas/branding-credentials/institucional/list-history-versions?client_id=${this.clientId}`)
      .subscribe({
        next: (res) => {
          this.loading = false;
          const rawItems = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
          if (rawItems) {
            this.historyVersions = rawItems.map((item: any) => {
              const vNum = Number(item.version || 1);
              const isItemPublished = item.publicado === true || item.publicado === 1 || item.publicado === '1';
              if (isItemPublished) {
                this.publishedVersion = vNum;
              }

              return {
                id: item.id,
                version: vNum,
                nombre_director: item.nombre_director || '',
                cargo_director: item.cargo_director || 'DIRECTOR GENERAL',
                firma_director: item.firma_director,
                publicado: isItemPublished,
                created_at_formatted: item.created_at_formatted || 'Recientemente'
              };
            });

            // Re-evaluar concordancia con publishedVersion
            if (this.publishedVersion !== null) {
              const pVer = Number(this.publishedVersion);
              this.historyVersions.forEach(hv => {
                hv.publicado = (hv.version === pVer);
              });
            }

            // Seleccionar versión: preferencia explicita -> publicada -> primera disponible
            let targetItem: InstitucionalHistoryItem | undefined;
            if (preferredVersionNumber !== undefined && preferredVersionNumber !== null) {
              targetItem = this.historyVersions.find(v => v.version === Number(preferredVersionNumber));
            }
            if (!targetItem && this.publishedVersion !== null) {
              targetItem = this.historyVersions.find(v => v.version === Number(this.publishedVersion));
            }
            if (!targetItem && this.historyVersions.length > 0) {
              targetItem = this.historyVersions[0];
            }

            if (targetItem) {
              this.seleccionarVersionHistorial(targetItem);
            }
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar historial institucional:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onFirmaSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      event.target.value = '';
      this.currentError = {
        code: 'MS-3803',
        title: 'Error de Validación',
        message: 'El archivo de firma supera el tamaño máximo permitido de 500 KB.',
        httpStatus: 400,
        timestamp: new Date()
      };
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      event.target.value = '';
      this.currentError = {
        code: 'MS-3803',
        title: 'Error de Validación',
        message: 'Seleccione un formato de imagen válido para la firma (PNG con fondo transparente recomendado, JPG o SVG).',
        httpStatus: 400,
        timestamp: new Date()
      };
      return;
    }

    this.firmaFile = file;
    this.firmaSourceText = `Archivo: ${file.name}`;
    this.currentError = null;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.firmaPreviewUrl = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  quitarFirma(): void {
    this.firmaFile = null;
    this.firmaPreviewUrl = null;
    this.firmaSourceText = '';
    const input = document.getElementById('brandingFirmaDirector') as HTMLInputElement;
    if (input) input.value = '';
    this.cdr.detectChanges();
  }

  seleccionarVersionHistorial(v: InstitucionalHistoryItem): void {
    this.selectedVersionNumber = v.version;
    this.nombreDirector = v.nombre_director;
    this.cargoDirector = v.cargo_director || 'DIRECTOR GENERAL';

    this.firmaFile = null;
    this.firmaPreviewUrl = v.firma_director || null;
    this.firmaSourceText = v.firma_director ? `Versión v${v.version}` : '';

    this.selectedVersionBase = {
      nombre_director: this.nombreDirector,
      cargo_director: this.cargoDirector,
      firma_director: this.firmaPreviewUrl
    };

    this.cdr.detectChanges();
  }

  guardarNuevaVersion(): void {
    this.currentError = null;
    this.mensajeExito = '';

    if (!this.hasFormChanges) {
      this.currentError = {
        code: 'MS-3803',
        title: 'Sin Cambios Detectados',
        message: 'No se han detectado modificaciones en el nombre, cargo o firma del Director con respecto a la versión seleccionada.',
        httpStatus: 400,
        timestamp: new Date()
      };
      return;
    }

    if (!this.nombreDirector || !this.nombreDirector.trim()) {
      this.currentError = {
        code: 'MS-3803',
        title: 'Nombre del Director Obligatorio',
        message: 'El nombre completo del Director General es estrictamente obligatorio.',
        httpStatus: 400,
        timestamp: new Date()
      };
      return;
    }

    if (!this.cargoDirector || !this.cargoDirector.trim()) {
      this.currentError = {
        code: 'MS-3803',
        title: 'Cargo Institucional Obligatorio',
        message: 'El cargo oficial institucional es estrictamente obligatorio.',
        httpStatus: 400,
        timestamp: new Date()
      };
      return;
    }

    if (!this.firmaPreviewUrl) {
      this.currentError = {
        code: 'MS-3803',
        title: 'Firma Oficial Obligatoria',
        message: 'La imagen de la firma del Director General es obligatoria para la emisión de documentos.',
        httpStatus: 400,
        timestamp: new Date()
      };
      return;
    }

    this.saving = true;

    const nextVersion = this.historyVersions.length
      ? Math.max(...this.historyVersions.map((v) => v.version)) + 1
      : 1;

    const payload = {
      nombre_director: this.nombreDirector.trim(),
      cargo_director: this.cargoDirector.trim(),
      firma_director: this.firmaPreviewUrl,
      publicado: false,
      usuario_creacion_id: 141
    };

    this.http
      .post<any>(`${API_BASE}/tarjetas/branding-credentials/institucional/create?client_id=${this.clientId}`, payload)
      .subscribe({
        next: () => {
          this.saving = false;
          this.firmaFile = null;
          this.mensajeExito = `Versión v${nextVersion} guardada correctamente. Aún no está publicada.`;
          this.cargarHistorial(nextVersion);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al guardar versión institucional:', err);
          this.saving = false;
          this.currentError = this.errorHandler.parseError(
            err,
            'MS_3805_CONFIG_ERROR',
            `${API_BASE}/tarjetas/branding-credentials/institucional/create`
          );
          this.cdr.detectChanges();
        }
      });
  }

  publicarVersion(versionNumber?: number): void {
    const targetVersion = versionNumber || this.selectedVersionNumber;
    if (!targetVersion) return;

    this.publishing = true;
    this.versionBeingPublished = targetVersion;
    this.currentError = null;
    this.mensajeExito = '';

    this.http
      .put<any>(
        `${API_BASE}/tarjetas/branding-credentials/institucional/update/change-version/${targetVersion}?client_id=${this.clientId}`,
        {}
      )
      .subscribe({
        next: () => {
          this.publishing = false;
          this.versionBeingPublished = null;
          this.publishedVersion = targetVersion;
          this.mensajeExito = `Versión v${targetVersion} publicada correctamente como institucional vigente.`;
          this.cargarHistorial(targetVersion);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al publicar versión institucional:', err);
          this.publishing = false;
          this.versionBeingPublished = null;
          this.currentError = this.errorHandler.parseError(
            err,
            'MS_3805_CONFIG_ERROR',
            `${API_BASE}/tarjetas/branding-credentials/institucional/update/change-version/${targetVersion}`
          );
          this.cdr.detectChanges();
        }
      });
  }
}
