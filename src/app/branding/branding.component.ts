import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { ErrorHandlerService, AppError } from '../core/services/error-handler.service';
import { NxAlertComponent } from '../shared/components/alert/alert.component';
import { PHOTO_CARD_PATH, DEFAULT_AVATAR_PATH, getFotoContadorOrDefault } from '../core/constants/assets.constants';

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
  samplePhotoUrl: string = PHOTO_CARD_PATH;

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
