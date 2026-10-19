import { Component, Input, Output, EventEmitter, inject, OnChanges, OnDestroy, Renderer2 } from '@angular/core';
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
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-content shadow border-0 rounded-3 overflow-hidden">
          <!-- Cabecera del Modal -->
          <div class="modal-header bg-white border-bottom py-3 px-4">
            <h5 class="modal-title fw-bold text-dark mb-0 fs-6">Detalle de registro</h5>
            <button type="button" class="btn-close" (click)="cerrar.emit()" aria-label="Cerrar" data-nx-tooltip="Cerrar"></button>
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
                  <span class="fw-semibold text-dark me-2">{{ isSociedades ? 'NIT:' : 'Cédula de ciudadanía:' }}</span>
                  <span>{{ isSociedades ? nitVal : documentoContadorVal }}</span>
                </div>
                <div class="small text-muted" style="font-size: 11px;">
                  <span class="me-3">Expediente: <strong>{{ expedienteVal }}</strong></span>
                  <span *ngIf="selectedTarjeta.correo">Correo: {{ selectedTarjeta.correo }}</span>
                </div>
              </div>
            </div>

            <!-- PANEL UNIFICADO DE DATOS E INFORMACIÓN -->
            <div class="p-3 rounded border bg-white">
              <h6 class="fw-bold text-dark mb-3 pb-2 border-bottom fs-6" style="font-size: 13px !important;">
                Información general
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
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">Cédula de ciudadanía</label>
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
                    <label class="form-label text-muted small fw-semibold mb-0.5 d-block" style="font-size: 11px;">NIT</label>
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
            </div>

          </div>

          <!-- Pie del Modal -->
          <div class="modal-footer bg-light border-top py-2.5 px-4">
            <button type="button" class="btn btn-outline-secondary btn-sm px-4 fw-semibold" (click)="cerrar.emit()">Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Tarjeta Profesional Digital (Diseño Minimalista, Sobrio y Centrado) -->
    <div class="modal-backdrop fade show" *ngIf="isCardModalOpen"></div>
    <div class="modal fade show d-block" tabindex="-1" *ngIf="isCardModalOpen && selectedTarjeta" role="dialog" aria-modal="true" (click)="cerrarTarjeta.emit()">
      <div class="modal-dialog modal-dialog-centered card-modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content card-modal-content">
          <!-- Cabecera limpia y compacta -->
          <div class="card-modal-header">
            <h6 class="modal-title mb-0">{{ isSociedades ? 'Tarjeta digital de sociedad' : 'Tarjeta profesional digital' }}</h6>
            <button type="button" class="btn-close" (click)="cerrarTarjeta.emit()" aria-label="Cerrar" data-nx-tooltip="Cerrar"></button>
          </div>
          
          <!-- Cuerpo enfocado exclusivamente en la tarjeta, sin contenedores anidados ni bordes superfluos -->
          <div class="card-modal-body">
            <div class="card-modal-scale-wrapper">
              <app-tarjeta-credencial
                [tipo]="isSociedades ? 'sociedad' : 'contador'"
                modo="digital"
                vista="ambas"
                layout="auto"
                [datos]="credencialDatos"
                [branding]="credencialBranding"
              ></app-tarjeta-credencial>
            </div>
          </div>
          
          <!-- Pie sobrio y minimalista -->
          <div class="card-modal-footer">
            <button type="button" class="btn btn-light btn-sm px-3.5 py-1.5 fw-semibold border text-secondary" (click)="cerrarTarjeta.emit()">Cerrar</button>
            <button
              type="button"
              class="btn btn-primary btn-sm px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-2 shadow-sm"
              (click)="exportarTarjetaPdf()"
              [disabled]="exportandoPdf"
              aria-label="Exportar tarjeta"
            >
              <span *ngIf="exportandoPdf" class="spinner-border spinner-border-sm" role="status"></span>
              <span *ngIf="!exportandoPdf" class="fa fa-file-pdf-o"></span>
              <span>{{ exportandoPdf ? 'Generando PDF...' : 'Exportar tarjeta' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-modal-dialog {
      max-width: 420px;
      width: 92%;
      margin: 1.5rem auto;
    }
    .card-modal-content {
      border: 0;
      border-radius: 18px;
      box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.04);
      background: #ffffff;
      overflow: hidden;
    }
    .card-modal-header {
      background: #ffffff;
      border-bottom: 1px solid #f1f5f9;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-modal-header .modal-title {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      letter-spacing: -0.2px;
    }
    .card-modal-body {
      background: #f8fafc;
      padding: 24px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 0;
      overflow-y: auto;
      max-height: calc(88vh - 110px);
    }
    .card-modal-scale-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .card-modal-footer {
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
      padding: 12px 20px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
    }

    /* Adaptabilidad sobria ante pantallas con altura reducida */
    @media (max-height: 820px) {
      .card-modal-dialog {
        margin: 1rem auto;
      }
      .card-modal-body {
        padding: 18px 16px;
      }
    }
    @media (max-height: 720px) {
      .card-modal-dialog {
        margin: 0.5rem auto;
      }
      .card-modal-header {
        padding: 10px 16px;
      }
      .card-modal-body {
        padding: 12px 14px;
      }
      .card-modal-footer {
        padding: 10px 16px;
      }
      .card-modal-scale-wrapper {
        transform: scale(0.92);
        transform-origin: center center;
        margin-top: -16px;
        margin-bottom: -16px;
      }
    }
    @media (max-height: 640px) {
      .card-modal-dialog {
        margin: 0.25rem auto;
      }
      .card-modal-scale-wrapper {
        transform: scale(0.82);
        margin-top: -36px;
        margin-bottom: -36px;
      }
    }
    @media (max-height: 560px) {
      .card-modal-scale-wrapper {
        transform: scale(0.72);
        margin-top: -56px;
        margin-bottom: -56px;
      }
    }
  `]
})
export class ModalDetalleTarjetaComponent implements OnChanges, OnDestroy {
  private renderer = inject(Renderer2);

  @Input() isOpen: boolean = false;
  @Input() isCardModalOpen: boolean = false;

  ngOnChanges(): void {
    this.handleScrollLock();
  }

  ngOnDestroy(): void {
    this.releaseScrollLock();
  }

  private handleScrollLock(): void {
    if (typeof document === 'undefined') return;
    if (this.isOpen || this.isCardModalOpen) {
      this.renderer.addClass(document.body, 'modal-open');
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
      const content = document.querySelector('.content-area') as HTMLElement;
      if (content) this.renderer.setStyle(content, 'overflow', 'hidden');
    } else {
      this.releaseScrollLock();
    }
  }

  private releaseScrollLock(): void {
    if (typeof document === 'undefined') return;
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'overflow');
    const content = document.querySelector('.content-area') as HTMLElement;
    if (content) this.renderer.removeStyle(content, 'overflow');
  }
  @Input() selectedTarjeta: any = null;
  @Input() tipoTarjeta: 'contadores' | 'sociedades' = 'contadores';
  @Input() brandingColorFondo: string = '#14275f';
  @Input() brandingColorLetra: string = '#ffffff';
  @Input() brandingLogoUrl: string | null = null;
  @Input() brandingPatronUrl: string | null = null;
  @Input() brandingLogoImpresionUrl: string | null = null;
  @Input() brandingPatronImpresionUrl: string | null = null;
  @Input() brandingColorLetraImpresion: string = '#0f172a';
  @Input() brandingNombreDirector: string | null = null;
  @Input() brandingFirmaDirector: string | null = null;
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
        no_tarjeta: this.tarjetaProfesionalVal !== '-' ? this.tarjetaProfesionalVal : undefined,
        inscripcion: this.numeroInscripcionVal !== '-' ? this.numeroInscripcionVal : undefined,
        fecha_resolucion: this.selectedTarjeta.fecha_resolucion || '06 - Feb - 2026',
        resolucion: this.selectedTarjeta.resolucion || '289',
        no_expd: this.selectedTarjeta.no_expd,
        nombre_completo: this.nombreCompletoVal !== '-' ? this.nombreCompletoVal : undefined,
        razon_social: this.razonSocialVal !== '-' ? this.razonSocialVal : undefined,
        no_documento: this.documentoContadorVal !== '-' ? this.documentoContadorVal : undefined,
        nit: this.nitVal !== '-' ? this.nitVal : undefined,
        universidad: this.selectedTarjeta.universidad || (this.isSociedades ? 'Sociedad de Contadores Públicos' : 'Universidad de La Salle'),
        foto: this.getFoto(this.selectedTarjeta.foto),
        hash_sha256: this.selectedTarjeta.hash_sha256,
        logo_url: this.brandingLogoUrl || 'assets/images/logo-jcc.png',
        patron_url: this.brandingPatronUrl,
        logo_impresion_url: this.brandingLogoImpresionUrl,
        patron_impresion_url: this.brandingPatronImpresionUrl,
        color_letra_impresion: this.brandingColorLetraImpresion,
        nombre_director: this.brandingNombreDirector,
        firma_director: this.brandingFirmaDirector
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
    return this.selectedTarjeta.nombre_completo || '-';
  }

  get razonSocialVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.razon_social || '-';
  }

  get documentoContadorVal(): string {
    if (!this.selectedTarjeta) return '-';
    return String(this.selectedTarjeta.no_documento || '-');
  }

  get nitVal(): string {
    if (!this.selectedTarjeta) return '-';
    return String(this.selectedTarjeta.nit || '-');
  }

  get tarjetaProfesionalVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.no_tarjeta || '-';
  }

  get numeroInscripcionVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.inscripcion || '-';
  }

  get resolucionVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.resolucion || '-';
  }

  get solicitanteVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.razon_social || this.selectedTarjeta.nombre_completo || '-';
  }

  get documentoVal(): string {
    if (!this.selectedTarjeta) return '-';
    if (this.selectedTarjeta.nit) return String(this.selectedTarjeta.nit);
    if (this.selectedTarjeta.no_documento) return String(this.selectedTarjeta.no_documento);
    return '-';
  }

  get matriculaVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.inscripcion || this.selectedTarjeta.no_tarjeta || '-';
  }

  get expedienteVal(): string | number {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.no_expd ?? '-';
  }

  get fechaVal(): string {
    if (!this.selectedTarjeta) return '-';
    return this.selectedTarjeta.fecha_emision || '-';
  }

  get estadoVal(): string {
    if (!this.selectedTarjeta) return 'Emitida';
    return this.selectedTarjeta.estado_tarjeta || 'Emitida';
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
      logo_url: this.brandingLogoUrl,
      patron_url: this.brandingPatronUrl
    };
  }
}
