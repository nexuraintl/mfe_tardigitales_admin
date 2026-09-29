import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatTipoSolicitud, getEstadoTarjetaBadgeClass } from '../../../core/constants/tarjetas.constants';
import { TarjetaCredencialComponent, CredencialDatos, CredencialBranding } from '../tarjeta-credencial/tarjeta-credencial.component';
import { TarjetaPdfService } from '../../../core/services/tarjeta-pdf.service';

@Component({
  selector: 'app-modal-detalle-tarjeta',
  standalone: true,
  imports: [CommonModule, TarjetaCredencialComponent],
  template: `
    <!-- Modal de Detalle (Estructura Ejecutiva Limpia) -->
    <div class="modal-backdrop fade show" *ngIf="isOpen"></div>
    <div class="modal fade show d-block" tabindex="-1" *ngIf="isOpen && selectedTarjeta" role="dialog" aria-modal="true" (click)="cerrar.emit()">
      <div class="modal-dialog modal-dialog-centered modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-content shadow border-0 rounded-3 overflow-hidden">
          <!-- Cabecera del Modal -->
          <div class="modal-header bg-white border-bottom py-3 px-4">
            <h5 class="modal-title fw-bold text-dark mb-0 fs-6">Detalle de Registro</h5>
            <button type="button" class="btn-close" (click)="cerrar.emit()" aria-label="Cerrar"></button>
          </div>

          <!-- Cuerpo del Modal -->
          <div class="modal-body p-4 bg-white">

            <!-- CABECERA DE PERFIL: Foto / Logo + Titular + Estado -->
            <div class="p-3 bg-light rounded border d-flex align-items-center gap-3 mb-3">
              <img 
                [src]="getFoto(selectedTarjeta.foto)" 
                alt="Fotografía / Logo" 
                class="rounded border bg-white object-fit-cover shadow-sm flex-shrink-0"
                style="width: 72px; height: 72px;"
              />
              <div class="flex-grow-1 min-w-0">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                  <h6 class="fw-bold text-dark mb-0 text-truncate fs-6" style="letter-spacing: -0.2px;">
                    {{ isSociedades ? razonSocialVal : nombreCompletoVal }}
                  </h6>
                  <span class="badge" [ngClass]="getEstadoBadgeClass(estadoVal)">
                    {{ estadoVal }}
                  </span>
                </div>
                <div class="small text-secondary mb-1">
                  <span class="fw-semibold text-dark me-2">{{ isSociedades ? 'Nit:' : 'Documento:' }}</span>
                  <span>{{ isSociedades ? nitVal : documentoContadorVal }}</span>
                </div>
                <div class="small text-muted" style="font-size: 11px;">
                  <span class="me-3">Expediente: <strong>{{ expedienteVal }}</strong></span>
                  <span *ngIf="!isSociedades && selectedTarjeta.correo">Correo: {{ selectedTarjeta.correo }}</span>
                </div>
              </div>
            </div>

            <!-- PANEL UNIFICADO DE DATOS E INFORMACIÓN -->
            <div class="p-3 rounded border bg-white">
              <h6 class="fw-bold text-dark mb-3 pb-2 border-bottom fs-6" style="font-size: 13px !important;">
                Información General
              </h6>

              <!-- CAMPOS CONTADORES -->
              <ng-container *ngIf="!isSociedades">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Universidad</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ selectedTarjeta.universidad || '-' }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Expediente</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ expedienteVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Tipo</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ tipoVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Nombre completo</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ nombreCompletoVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Documento</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ documentoContadorVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Tarjeta profesional</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ tarjetaProfesionalVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Correo</label>
                    <div class="fw-semibold text-dark text-break" style="font-size: 13px;">{{ selectedTarjeta.correo || '-' }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Estado tarjeta</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ estadoVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Fecha emisión</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ fechaVal }}</div>
                  </div>
                </div>
              </ng-container>

              <!-- CAMPOS SOCIEDADES -->
              <ng-container *ngIf="isSociedades">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Expediente</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ expedienteVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Tipo</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ tipoVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Razón social</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ razonSocialVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Nit</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ nitVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Número de inscripción</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ numeroInscripcionVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Resolución</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ resolucionVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Estado tarjeta</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ estadoVal }}</div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Fecha emisión</label>
                    <div class="fw-semibold text-dark" style="font-size: 13px;">{{ fechaVal }}</div>
                  </div>
                </div>
              </ng-container>
            </div>

          </div>

          <!-- Pie del Modal -->
          <div class="modal-footer bg-light border-top py-2.5 px-4">
            <button type="button" class="btn btn-outline-secondary btn-sm px-4 fw-semibold" (click)="cerrar.emit()">Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Tarjeta Profesional Digital -->
    <div class="modal-backdrop fade show" *ngIf="isCardModalOpen"></div>
    <div class="modal fade show d-block" tabindex="-1" *ngIf="isCardModalOpen && selectedTarjeta" role="dialog" aria-modal="true" (click)="cerrarTarjeta.emit()">
      <div class="modal-dialog modal-dialog-centered modal-xl" (click)="$event.stopPropagation()">
        <div class="modal-content shadow border-0">
          <div class="modal-header bg-white border-bottom py-3 px-4">
            <div>
              <h5 class="modal-title fw-bold text-dark mb-0">Visualización de Tarjeta Profesional</h5>
              <small class="text-muted">Diseño activo de branding aplicado</small>
            </div>
            <button type="button" class="btn-close" (click)="cerrarTarjeta.emit()" aria-label="Cerrar"></button>
          </div>
          
          <div class="modal-body p-4 d-flex justify-content-center bg-light">
            <div class="branding-preview-card w-100" style="max-width: 900px;">
              <app-tarjeta-credencial
                [tipo]="isSociedades ? 'sociedad' : 'contador'"
                vista="ambas"
                layout="auto"
                [datos]="credencialDatos"
                [branding]="credencialBranding"
              ></app-tarjeta-credencial>
            </div>
          </div>
          
          <div class="modal-footer bg-light border-top py-2.5 px-4 d-flex justify-content-between align-items-center">
            <button type="button" class="btn btn-outline-secondary btn-sm px-4 fw-semibold" (click)="cerrarTarjeta.emit()">Cerrar</button>
            <button
              type="button"
              class="btn btn-primary btn-sm px-4 fw-semibold d-flex align-items-center gap-2"
              (click)="exportarTarjetaPdf()"
              [disabled]="exportandoPdf"
            >
              <span *ngIf="exportandoPdf" class="spinner-border spinner-border-sm"></span>
              <span *ngIf="!exportandoPdf" class="fa fa-file-pdf-o"></span>
              <span>{{ exportandoPdf ? 'Generando PDF...' : 'Exportar tarjeta' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ModalDetalleTarjetaComponent {
  @Input() isOpen: boolean = false;
  @Input() isCardModalOpen: boolean = false;
  @Input() selectedTarjeta: any = null;
  @Input() tipoTarjeta: 'contadores' | 'sociedades' = 'contadores';
  @Input() brandingColorFondo: string = '#14275f';
  @Input() brandingColorLetra: string = '#ffffff';
  @Input() brandingFuenteLetra: string = 'Arial, sans-serif';
  @Input() brandingLogoUrl: string | null = null;
  @Input() brandingPatronUrl: string | null = null;
  @Input() getFotoUrlFn?: (url?: string | null) => string;

  @Output() cerrar = new EventEmitter<void>();
  @Output() cerrarTarjeta = new EventEmitter<void>();

  private pdfService = inject(TarjetaPdfService);
  exportandoPdf: boolean = false;

  async exportarTarjetaPdf(): Promise<void> {
    if (!this.selectedTarjeta || this.exportandoPdf) return;

    this.exportandoPdf = true;
    try {
      await this.pdfService.generarPdfTarjeta({
        tipo: this.isSociedades ? 'sociedad' : 'contador',
        matricula: this.isSociedades ? this.numeroInscripcionVal : this.tarjetaProfesionalVal,
        fecha_resolucion: this.selectedTarjeta.fecha_resolucion || '06 - Feb - 2026',
        resolucion: this.selectedTarjeta.resolucion || '289',
        expediente: this.expedienteVal,
        solicitante: this.isSociedades ? this.razonSocialVal : this.nombreCompletoVal,
        documento: this.isSociedades ? this.nitVal : this.documentoContadorVal,
        universidad: this.selectedTarjeta.universidad || (this.isSociedades ? 'Sociedad de Contadores Públicos' : 'Universidad de La Salle'),
        foto: this.getFoto(this.selectedTarjeta.foto),
        hash_sha256: this.selectedTarjeta.hash_sha256,
        logo_url: this.brandingLogoUrl || 'assets/images/logo-jcc.png'
      });
    } catch (err) {
      console.error('Error al exportar PDF de tarjeta:', err);
    } finally {
      this.exportandoPdf = false;
    }
  }

  getFoto(url?: string | null): string {
    if (typeof this.getFotoUrlFn === 'function') {
      return this.getFotoUrlFn(url);
    }
    return url || 'assets/images/default-avatar.png';
  }

  get isSociedades(): boolean {
    if (this.tipoTarjeta === 'sociedades') return true;
    if (this.tipoTarjeta === 'contadores') return false;
    if (!this.selectedTarjeta) return false;
    return this.selectedTarjeta.tipo_tarjeta === 'sociedades' || !!this.selectedTarjeta.razon_social || !!this.selectedTarjeta.nit;
  }

  getEstadoBadgeClass(estado?: string | null): string {
    return getEstadoTarjetaBadgeClass(estado);
  }

  get tipoVal(): string {
    if (!this.selectedTarjeta) return 'Primera vez';
    const val = this.selectedTarjeta.tipo_asociado ?? this.selectedTarjeta.tipo_sociedad ?? this.selectedTarjeta.tipo;
    return formatTipoSolicitud(val);
  }

  get nombreCompletoVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.nombre_completo || this.selectedTarjeta.solicitante || '-';
  }

  get razonSocialVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.razon_social || this.selectedTarjeta.solicitante || '-';
  }

  get documentoContadorVal(): string {
    if (!this.selectedTarjeta) return '-';
    if (this.selectedTarjeta.tipo_documento && this.selectedTarjeta.no_documento) {
      return `${this.selectedTarjeta.tipo_documento} ${this.selectedTarjeta.no_documento}`;
    }
    return this.selectedTarjeta.no_documento || this.selectedTarjeta.documento || '-';
  }

  get nitVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.nit || this.selectedTarjeta.documento || '-';
  }

  get tarjetaProfesionalVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.matricula || this.selectedTarjeta.no_tarjeta || '-';
  }

  get numeroInscripcionVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.inscripcion || this.selectedTarjeta.matricula || '-';
  }

  get resolucionVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.resolucion || '-';
  }

  get solicitanteVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.razon_social || this.selectedTarjeta.nombre_completo || this.selectedTarjeta.solicitante || '-';
  }

  get documentoVal(): string {
    if (!this.selectedTarjeta) return '-';
    if (this.selectedTarjeta.nit) return `NIT ${this.selectedTarjeta.nit}`;
    if (this.selectedTarjeta.no_documento) return `${this.selectedTarjeta.tipo_documento || 'CC'} ${this.selectedTarjeta.no_documento}`;
    return this.selectedTarjeta.documento || '-';
  }

  get matriculaVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.inscripcion || this.selectedTarjeta.no_tarjeta || this.selectedTarjeta.matricula || '-';
  }

  get expedienteVal(): string | number {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.no_expd ?? this.selectedTarjeta.expediente ?? '-';
  }

  get fechaVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.fecha_emision || this.selectedTarjeta.fecha || '-';
  }

  get estadoVal(): string {
    if (!this.selectedTarjeta) return 'Emitida';
    return this.selectedTarjeta.estado_tarjeta || this.selectedTarjeta.tarjeta || 'Emitida';
  }

  get credencialDatos(): CredencialDatos {
    if (!this.selectedTarjeta) return {};
    return {
      matricula: String(this.matriculaVal),
      fecha_resolucion: this.selectedTarjeta.fecha_resolucion || '15 - Sep - 2026',
      resolucion: this.selectedTarjeta.resolucion || '0001',
      expediente: this.expedienteVal,
      solicitante: this.solicitanteVal,
      documento: this.documentoVal,
      universidad: this.selectedTarjeta.universidad || (this.isSociedades ? 'Sociedad de Contadores Públicos' : 'Universidad de La Salle'),
      foto: this.getFoto(this.selectedTarjeta.foto),
      estado: this.estadoVal
    };
  }

  get credencialBranding(): CredencialBranding {
    return {
      color_fondo: this.brandingColorFondo,
      color_letra: this.brandingColorLetra,
      fuente_letra: this.brandingFuenteLetra,
      logo_url: this.brandingLogoUrl,
      patron_url: this.brandingPatronUrl
    };
  }
}
