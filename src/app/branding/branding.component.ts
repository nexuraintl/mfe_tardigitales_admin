import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { ErrorHandlerService, AppError } from '../core/services/error-handler.service';
import { NxAlertComponent } from '../shared/components/alert/alert.component';

export interface BrandingHistoryItem {
  id?: number;
  version: number;
  stamp?: string;
  created_at?: string;
  published: boolean;
  color_fondo: string;
  color_letra: string;
  fuente_letra: string;
  logo?: string;
  patron?: string;
}

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [CommonModule, FormsModule, NxAlertComponent],
  templateUrl: './branding.component.html',
  styleUrls: ['./branding.component.css']
})
export class BrandingComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);

  private routerSubscription?: Subscription;
  private currentUrl: string = '';

  clientId: number = CLIENT_ID;
  tipoId: number = 1; // 1: Contadores, 2: Sociedades
  moduleName: string = 'contadores';
  label: string = 'Contadores';

  loading: boolean = false;
  saving: boolean = false;
  publishing: boolean = false;
  currentError: AppError | null = null;
  mensajeExito: string = '';

  publishedVersion: number | null = null;
  selectedVersionNumber: number | null = null;

  // Form / Draft fields
  colorFondo: string = '#14275f';
  colorLetra: string = '#ffffff';
  fuenteLetra: string = 'Arial, sans-serif';
  logoFile: File | null = null;
  logoPreviewUrl: string | null = null;
  logoSourceText: string = '';

  patronFile: File | null = null;
  patronPreviewUrl: string | null = null;
  patronSourceText: string = '';

  selectedVersionBase: {
    color_fondo: string;
    color_letra: string;
    fuente_letra: string;
    logo: string | null;
    patron: string | null;
  } | null = null;

  get hasFormChanges(): boolean {
    if (this.logoFile !== null) return true;
    if (this.patronFile !== null) return true;
    if (!this.selectedVersionBase) return true;

    const bgChanged = (this.colorFondo || '').toLowerCase() !== (this.selectedVersionBase.color_fondo || '').toLowerCase();
    const textChanged = (this.colorLetra || '').toLowerCase() !== (this.selectedVersionBase.color_letra || '').toLowerCase();
    const fontChanged = this.fuenteLetra !== this.selectedVersionBase.fuente_letra;
    const logoChanged = (this.logoPreviewUrl || null) !== (this.selectedVersionBase.logo || null);
    const patronChanged = (this.patronPreviewUrl || null) !== (this.selectedVersionBase.patron || null);

    return bgChanged || textChanged || fontChanged || logoChanged || patronChanged;
  }

  // Sample data for preview depending on module
  samplePhotoUrl: string = 'data:image/jpeg;base64,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';

  registrationLabel: string = 'Tarjeta profesional';
  registrationValue: string = '356042-T';
  dateLabel: string = 'Fecha Res. Inscripción';
  dateValue: string = '06 - Feb - 2026';
  expedientValue: string = '426826';
  holderLabel: string = 'Nombre y apellido';
  holderValue: string = 'Sergio Andres Niño Ibañez';
  documentLabel: string = 'Cédula de ciudadanía';
  documentValue: string = '1.022.413.295';
  extraLabel: string = 'Institución de Educación Superior';
  extraValue: string = 'Politécnico Grancolombiano';
  resolutionValue: string = '378';

  historyVersions: BrandingHistoryItem[] = [];

  ngOnInit(): void {
    this.currentUrl = this.router.url;
    this.detectModule();
    this.cargarDatos();

    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (this.currentUrl !== event.urlAfterRedirects) {
          this.currentUrl = event.urlAfterRedirects;
          this.detectModule();
          this.cargarDatos();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  detectModule(): void {
    const url = this.router.url;
    this.logoFile = null;
    this.logoPreviewUrl = null;
    this.patronFile = null;
    this.patronPreviewUrl = null;
    this.selectedVersionNumber = null;

    if (url.includes('sociedades')) {
      this.tipoId = 2;
      this.moduleName = 'sociedades';
      this.label = 'Sociedades';

      // Custom card fields for Sociedades
      this.registrationLabel = 'NIT / Registro Sociedad';
      this.registrationValue = '900.123.456-7';
      this.holderLabel = 'Razón social';
      this.holderValue = 'AUDITORES Y ASESORES S.A.S.';
      this.documentLabel = 'NIT';
      this.documentValue = '900.123.456-7';
      this.extraLabel = 'Tipo de Sociedad';
      this.extraValue = 'Sociedad de Contadores Públicos';
      this.resolutionValue = '1042';
      this.colorFondo = '#134567';
      this.colorLetra = '#ffffff';
    } else {
      this.tipoId = 1;
      this.moduleName = 'contadores';
      this.label = 'Contadores';

      // Custom card fields for Contadores
      this.registrationLabel = 'Tarjeta profesional';
      this.registrationValue = '356042-T';
      this.holderLabel = 'Nombre y apellido';
      this.holderValue = 'Sergio Andres Niño Ibañez';
      this.documentLabel = 'Cédula de ciudadanía';
      this.documentValue = '1.022.413.295';
      this.extraLabel = 'Institución de Educación Superior';
      this.extraValue = 'Politécnico Grancolombiano';
      this.resolutionValue = '378';
      this.colorFondo = '#14275f';
      this.colorLetra = '#ffffff';
    }
  }

  cargarDatos(): void {
    this.loading = true;
    this.currentError = null;
    this.mensajeExito = '';

    // Fetch Published Info
    this.http
      .get<any>(`${API_BASE}/tarjetas/branding-credentials/info-published/${this.tipoId}?client_id=${this.clientId}`)
      .subscribe({
        next: (res) => {
          if (res) {
            const data = Array.isArray(res) ? res[0] : res;
            if (data && (data.color_fondo || data.logo || data.patron || data.version_publicada)) {
              const pubV = data.version_publicada !== undefined && data.version_publicada !== null 
                ? Number(data.version_publicada) 
                : (data.version ? Number(data.version) : null);
              this.publishedVersion = pubV;
              if (data.color_fondo) this.colorFondo = data.color_fondo;
              if (data.color_letra) this.colorLetra = data.color_letra;
              if (data.fuente_letra) this.fuenteLetra = data.fuente_letra;
              if (data.logo) this.logoPreviewUrl = data.logo;
              if (data.patron) this.patronPreviewUrl = data.patron;

              this.selectedVersionBase = {
                color_fondo: this.colorFondo,
                color_letra: this.colorLetra,
                fuente_letra: this.fuenteLetra,
                logo: this.logoPreviewUrl,
                patron: this.patronPreviewUrl
              };

              this.cargarHistorial();
              return;
            }
          }
          this.cargarConfiguracionBase();
        },
        error: () => {
          // Si info-published devuelve 404 o falla, cargar la configuración general de info/{tipoId}
          this.cargarConfiguracionBase();
        }
      });
  }

  private cargarConfiguracionBase(): void {
    this.http
      .get<any>(`${API_BASE}/tarjetas/branding-credentials/info/${this.tipoId}?client_id=${this.clientId}`)
      .subscribe({
        next: (res) => {
          if (res) {
            const data = Array.isArray(res) ? res[0] : res;
            if (data) {
              if (data.version_publicada) this.publishedVersion = Number(data.version_publicada);
              if (data.color_fondo) this.colorFondo = data.color_fondo;
              if (data.color_letra) this.colorLetra = data.color_letra;
              if (data.fuente_letra) this.fuenteLetra = data.fuente_letra;
              if (data.logo) this.logoPreviewUrl = data.logo;
              if (data.patron) this.patronPreviewUrl = data.patron;

              this.selectedVersionBase = {
                color_fondo: this.colorFondo,
                color_letra: this.colorLetra,
                fuente_letra: this.fuenteLetra,
                logo: this.logoPreviewUrl,
                patron: this.patronPreviewUrl
              };
            }
          }
          this.cargarHistorial();
        },
        error: () => {
          this.cargarHistorial();
        }
      });
  }

  private formatDate(rawDate?: string): string {
    if (!rawDate) return 'Fecha no disponible';
    try {
      const formattedInput = rawDate.includes('Z') || rawDate.includes('T') ? rawDate : rawDate.replace(' ', 'T');
      const date = new Date(formattedInput);
      if (isNaN(date.getTime())) return rawDate;

      const pad = (n: number) => (n < 10 ? '0' + n : n);
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());

      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return rawDate;
    }
  }

  cargarHistorial(preferredVersionNumber?: number): void {
    this.http
      .get<any>(`${API_BASE}/tarjetas/branding-credentials/list-history-versions/${this.tipoId}?client_id=${this.clientId}`)
      .subscribe({
        next: (res) => {
          this.loading = false;
          const rawItems = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
          if (rawItems) {
            this.historyVersions = rawItems.map((item: any) => {
              const vNum = Number(item.version || item.version_actual || 1);
              const isItemPublished = item.publicado === true || item.publicado === 1 || item.publicado === '1' || item.publicado === 'Publicada';
              if (isItemPublished) {
                this.publishedVersion = vNum;
              }

              const isPublished = isItemPublished || (this.publishedVersion !== null && vNum === Number(this.publishedVersion));

              return {
                id: item.id || item.configuracion_branding_id,
                version: vNum,
                stamp: this.formatDate(item.created_at || item.created_at_formatted || item.fecha_creacion),
                published: isPublished,
                color_fondo: item.color_fondo,
                color_letra: item.color_letra,
                fuente_letra: item.fuente_letra,
                logo: item.logo,
                patron: item.patron
              };
            });

            // Re-evaluar published para asegurar concordancia exacta con la versión publicada
            if (this.publishedVersion !== null) {
              const pVer = Number(this.publishedVersion);
              this.historyVersions.forEach(hv => {
                hv.published = (hv.version === pVer);
              });
            }

            // Seleccionar la versión deseada: preferencia explicita -> publicada -> primera disponible
            let targetItem: BrandingHistoryItem | undefined;
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
          console.error('Error al cargar historial de versiones:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onLogoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 300 * 1024) {
      event.target.value = '';
      this.currentError = {
        code: 'MS-3803',
        title: 'Error de Validación',
        message: 'El archivo de logo supera el tamaño máximo permitido de 300 KB.',
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
        message: 'Seleccione un formato de imagen válido para el logo (PNG, JPG o SVG).',
        httpStatus: 400,
        timestamp: new Date()
      };
      return;
    }

    this.logoFile = file;
    this.logoSourceText = `Archivo: ${file.name}`;
    this.currentError = null;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.logoPreviewUrl = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  quitarLogo(): void {
    this.logoFile = null;
    this.logoPreviewUrl = null;
    this.logoSourceText = '';
    const input = document.getElementById('brandingLogo') as HTMLInputElement;
    if (input) input.value = '';
    this.cdr.detectChanges();
  }

  onPatronSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      event.target.value = '';
      this.currentError = {
        code: 'MS-3803',
        title: 'Error de Validación',
        message: 'El archivo de patrón supera el tamaño máximo permitido de 3 MB.',
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
        message: 'Seleccione un formato de imagen válido para el patrón de fondo (PNG, JPG o SVG).',
        httpStatus: 400,
        timestamp: new Date()
      };
      return;
    }

    this.patronFile = file;
    this.patronSourceText = `Archivo: ${file.name}`;
    this.currentError = null;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.patronPreviewUrl = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  quitarPatron(): void {
    this.patronFile = null;
    this.patronPreviewUrl = null;
    this.patronSourceText = '';
    const input = document.getElementById('brandingPatron') as HTMLInputElement;
    if (input) input.value = '';
    this.cdr.detectChanges();
  }

  private dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  guardarNuevaVersion(): void {
    this.currentError = null;
    this.mensajeExito = '';

    if (!this.hasFormChanges) {
      this.currentError = {
        code: 'MS-3803',
        title: 'Sin Cambios Detectados',
        message: 'No se han modificado los parámetros (colores, fuente, logo o patrón) con respecto a la versión seleccionada.',
        httpStatus: 400,
        timestamp: new Date()
      };
      return;
    }

    if (!this.logoFile && !this.logoPreviewUrl) {
      this.currentError = {
        code: 'MS-3803',
        title: 'Logo Obligatorio',
        message: 'El logo institucional es obligatorio. Debe seleccionar un archivo de imagen o elegir una versión del historial que contenga logo.',
        httpStatus: 400,
        timestamp: new Date()
      };
      return;
    }

    this.saving = true;

    const nextVersion = this.historyVersions.length
      ? Math.max(...this.historyVersions.map((v) => v.version)) + 1
      : 1;

    const formData = new FormData();
    formData.append('idCliente', this.clientId.toString());
    formData.append('version_actual', nextVersion.toString());
    formData.append('color_fondo', this.colorFondo);
    formData.append('color_letra', this.colorLetra);
    formData.append('fuente_letra', this.fuenteLetra);
    formData.append('usuario_creacion_id', '141');
    formData.append('tipo_id', this.tipoId.toString());

    if (this.logoFile) {
      formData.append('logo', this.logoFile);
    } else if (this.logoPreviewUrl && this.logoPreviewUrl.startsWith('data:')) {
      try {
        const fileFromPreview = this.dataURLtoFile(this.logoPreviewUrl, `logo_v${nextVersion}.png`);
        formData.append('logo', fileFromPreview);
      } catch (err) {
        console.warn('No se pudo convertir logoPreviewUrl a File:', err);
      }
    }

    if (this.patronFile) {
      formData.append('patron', this.patronFile);
    } else if (this.patronPreviewUrl && this.patronPreviewUrl.startsWith('data:')) {
      try {
        const fileFromPreview = this.dataURLtoFile(this.patronPreviewUrl, `patron_v${nextVersion}.png`);
        formData.append('patron', fileFromPreview);
      } catch (err) {
        console.warn('No se pudo convertir patronPreviewUrl a File:', err);
      }
    }

    this.http
      .post(`${API_BASE}/tarjetas/branding-credentials/create?client_id=${this.clientId}`, formData)
      .subscribe({
        next: (res: any) => {
          this.saving = false;
          this.logoFile = null;
          this.patronFile = null;
          this.mensajeExito = `Versión v${nextVersion} guardada correctamente para ${this.label}. Aún no está publicada.`;
          this.cargarHistorial(nextVersion);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al guardar versión de branding:', err);
          this.saving = false;
          this.currentError = this.errorHandler.parseError(
            err,
            'MS_3805_CONFIG_ERROR',
            `${API_BASE}/tarjetas/branding-credentials/create`
          );
          this.cdr.detectChanges();
        }
      });
  }

  seleccionarVersionHistorial(v: BrandingHistoryItem): void {
    this.selectedVersionNumber = v.version;
    if (v.color_fondo) this.colorFondo = v.color_fondo;
    if (v.color_letra) this.colorLetra = v.color_letra;
    if (v.fuente_letra) this.fuenteLetra = v.fuente_letra;
    
    if (v.logo !== undefined) {
      this.logoFile = null;
      this.logoPreviewUrl = v.logo ? v.logo : null;
      this.logoSourceText = v.logo ? `Versión v${v.version}` : '';
    }

    if (v.patron !== undefined) {
      this.patronFile = null;
      this.patronPreviewUrl = v.patron ? v.patron : null;
      this.patronSourceText = v.patron ? `Versión v${v.version}` : '';
    }

    this.selectedVersionBase = {
      color_fondo: this.colorFondo,
      color_letra: this.colorLetra,
      fuente_letra: this.fuenteLetra,
      logo: this.logoPreviewUrl,
      patron: this.patronPreviewUrl
    };

    this.cdr.detectChanges();
  }

  publicarVersion(): void {
    if (!this.selectedVersionNumber) return;

    this.publishing = true;
    this.currentError = null;
    this.mensajeExito = '';

    const payload = {
      version_publicada: this.selectedVersionNumber
    };

    this.http
      .put(
        `${API_BASE}/tarjetas/branding-credentials/update/change-version/${this.tipoId}?client_id=${this.clientId}`,
        payload
      )
      .subscribe({
        next: (res: any) => {
          this.publishing = false;
          this.publishedVersion = this.selectedVersionNumber;
          this.mensajeExito = `Versión v${this.selectedVersionNumber} publicada correctamente para ${this.label}.`;
          this.cargarHistorial(this.selectedVersionNumber || undefined);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al publicar versión:', err);
          this.publishing = false;
          this.currentError = this.errorHandler.parseError(
            err,
            'MS_3805_CONFIG_ERROR',
            `${API_BASE}/tarjetas/branding-credentials/update/change-version/${this.tipoId}`
          );
          this.cdr.detectChanges();
        }
      });
  }
}
