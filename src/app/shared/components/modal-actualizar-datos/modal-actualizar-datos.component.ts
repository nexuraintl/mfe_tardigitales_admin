import { Component, Input, Output, EventEmitter, inject, OnChanges, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EstadoModalActualizarDatos = 'confirm' | 'loading' | 'success' | 'not_found' | 'error';

export interface AuditoriaActualizacionDatos {
  id?: number;
  tarjeta_id?: number;
  tipo_tarjeta?: string;
  usuario: string;
  ip: string;
  fecha: string;
}

@Component({
  selector: 'app-modal-actualizar-datos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop fade show" *ngIf="isOpen"></div>
    <div
      class="modal fade show d-block"
      tabindex="-1"
      *ngIf="isOpen && registro"
      role="dialog"
      aria-modal="true"
      (click)="onBackdropClick()"
    >
      <div class="modal-dialog modal-dialog-centered actualizar-datos-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content shadow border-0 rounded-3">
          <!-- Cabecera -->
          <div class="modal-header bg-white border-bottom py-3 px-4">
            <h5 class="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <ng-container [ngSwitch]="estado">
                <span *ngSwitchCase="'confirm'" class="fa fa-refresh text-primary"></span>
                <span *ngSwitchCase="'loading'" class="spinner-border spinner-border-sm text-primary" role="status"></span>
                <span *ngSwitchCase="'success'" class="fa fa-check-circle text-success"></span>
                <span *ngSwitchCase="'not_found'" class="fa fa-exclamation-triangle text-warning"></span>
                <span *ngSwitchCase="'error'" class="fa fa-times-circle text-danger"></span>
              </ng-container>
              <span>{{ tituloModal }}</span>
            </h5>
            <button
              type="button"
              class="btn-close"
              [disabled]="estado === 'loading'"
              (click)="cerrar.emit()"
              aria-label="Cerrar"
            ></button>
          </div>

          <!-- Cuerpo -->
          <div class="modal-body p-4 bg-white">
            <!-- 1. CONFIRMACIÓN PREVIA (Prototipo 3) -->
            <ng-container *ngIf="estado === 'confirm'">
              <p class="text-dark mb-3">
                Se consultará el servicio <strong>MYJCC</strong> y se actualizarán en la consola los datos personales del titular:
              </p>

              <div class="resumen-tabla rounded border mb-3">
                <div class="resumen-fila border-bottom">
                  <span class="resumen-etiqueta text-secondary">Tipo</span>
                  <span class="resumen-valor fw-semibold text-dark">{{ isSociedades ? 'Sociedad' : 'Contador público' }}</span>
                </div>
                <div class="resumen-fila border-bottom">
                  <span class="resumen-etiqueta text-secondary">{{ isSociedades ? 'Razón social' : 'Nombre' }}</span>
                  <span class="resumen-valor fw-semibold text-dark">{{ titularNombre }}</span>
                </div>
                <div class="resumen-fila border-bottom">
                  <span class="resumen-etiqueta text-secondary">{{ isSociedades ? 'NIT' : 'Cédula de ciudadanía' }}</span>
                  <span class="resumen-valor fw-semibold text-dark">{{ titularDocumento }}</span>
                </div>
                <div class="resumen-fila">
                  <span class="resumen-etiqueta text-secondary">{{ isSociedades ? 'Número de inscripción' : 'Tarjeta profesional' }}</span>
                  <span class="resumen-valor fw-semibold text-dark">{{ titularMatricula }}</span>
                </div>
              </div>

              <div class="text-secondary small d-flex align-items-start gap-2">
                <span class="fa fa-info-circle mt-1"></span>
                <span>Esta acción no modifica el estado de la tarjeta ni sus fechas de emisión y activación.</span>
              </div>
            </ng-container>

            <!-- 2. CONSULTA EN CURSO (Prototipo 4) -->
            <ng-container *ngIf="estado === 'loading'">
              <div class="text-center py-4">
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <div class="fw-semibold text-dark mb-1">Consultando información en MYJCC...</div>
                <div class="text-muted small">Por favor espere, no cierre esta ventana.</div>
              </div>
            </ng-container>

            <!-- 3. ACTUALIZACIÓN EXITOSA (Prototipo 5) -->
            <ng-container *ngIf="estado === 'success'">
              <p class="text-dark mb-2">
                Los datos personales de <strong>{{ titularNombre }}</strong> ({{ isSociedades ? 'NIT' : 'CC' }} {{ titularDocumento }}) fueron actualizados correctamente con la información de MYJCC.
              </p>
              <div class="text-muted small mt-2" *ngIf="auditoria">
                Fecha: {{ auditoria.fecha }} · Usuario: {{ auditoria.usuario }} · IP: {{ auditoria.ip }}
              </div>
            </ng-container>

            <!-- 4. DOCUMENTO SIN INFORMACIÓN EN MYJCC (Prototipo 6) -->
            <ng-container *ngIf="estado === 'not_found'">
              <p class="text-dark mb-0">
                No se encontró información en MYJCC para {{ isSociedades ? 'la' : 'el' }}
                <strong>{{ isSociedades ? 'Sociedad' : 'Contador público' }}</strong> con
                {{ isSociedades ? 'NIT' : 'cédula de ciudadanía' }} <strong>{{ titularDocumento }}</strong>.
                No se realizó ningún cambio en los datos del registro.
              </p>
            </ng-container>

            <!-- 5. SERVICIO NO DISPONIBLE O ERROR (Prototipo 7) -->
            <ng-container *ngIf="estado === 'error'">
              <p class="text-dark mb-2">
                {{ mensajeError || 'No fue posible consultar el servicio MYJCC en este momento. La información del registro se conserva sin cambios.' }}
              </p>
              <div class="text-muted small">
                Intente nuevamente más tarde. Si el problema persiste, contacte al administrador del sistema.
              </div>
            </ng-container>
          </div>

          <!-- Pie -->
          <div class="modal-footer bg-white border-top py-3 px-4 d-flex justify-content-end gap-2">
            <ng-container [ngSwitch]="estado">
              <ng-container *ngSwitchCase="'confirm'">
                <button type="button" class="btn btn-outline-secondary btn-sm px-3 fw-semibold" (click)="cerrar.emit()">
                  Cancelar
                </button>
                <button type="button" class="btn btn-primary btn-sm px-3 fw-semibold d-inline-flex align-items-center gap-1" (click)="confirmar.emit()">
                  <span class="fa fa-refresh"></span>
                  <span>Actualizar</span>
                </button>
              </ng-container>

              <ng-container *ngSwitchCase="'loading'">
                <button type="button" class="btn btn-outline-secondary btn-sm px-3 fw-semibold" [disabled]="true">
                  Cancelar
                </button>
                <button type="button" class="btn btn-primary btn-sm px-3 fw-semibold" [disabled]="true">
                  Actualizando...
                </button>
              </ng-container>

              <ng-container *ngSwitchCase="'success'">
                <button type="button" class="btn btn-primary btn-sm px-4 fw-semibold" (click)="cerrar.emit()">
                  Aceptar
                </button>
              </ng-container>

              <ng-container *ngSwitchCase="'not_found'">
                <button type="button" class="btn btn-primary btn-sm px-4 fw-semibold" (click)="cerrar.emit()">
                  Aceptar
                </button>
              </ng-container>

              <ng-container *ngSwitchCase="'error'">
                <button type="button" class="btn btn-outline-secondary btn-sm px-3 fw-semibold" (click)="cerrar.emit()">
                  Cerrar
                </button>
                <button type="button" class="btn btn-primary btn-sm px-3 fw-semibold d-inline-flex align-items-center gap-1" (click)="confirmar.emit()">
                  <span class="fa fa-refresh"></span>
                  <span>Reintentar</span>
                </button>
              </ng-container>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .actualizar-datos-dialog {
      max-width: 480px;
    }
    .resumen-tabla {
      background-color: #f8fafc;
      border-color: #e2e8f0 !important;
    }
    .resumen-fila {
      display: grid;
      grid-template-columns: 42% 1fr;
      gap: 12px;
      padding: 8px 14px;
      font-size: 13px;
      align-items: center;
    }
    .resumen-etiqueta {
      font-weight: 500;
    }
    .resumen-valor {
      word-break: break-word;
    }
  `]
})
export class ModalActualizarDatosComponent implements OnChanges, OnDestroy {
  private renderer = inject(Renderer2);

  @Input() isOpen: boolean = false;
  @Input() tipoTarjeta: 'contadores' | 'sociedades' = 'contadores';
  @Input() registro: any = null;
  @Input() estado: EstadoModalActualizarDatos = 'confirm';
  @Input() auditoria: AuditoriaActualizacionDatos | null = null;
  @Input() mensajeError: string = '';

  @Output() confirmar = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  ngOnChanges(): void {
    if (typeof document === 'undefined') return;
    if (this.isOpen) {
      this.renderer.addClass(document.body, 'modal-open');
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
    } else {
      this.releaseScrollLock();
    }
  }

  ngOnDestroy(): void {
    this.releaseScrollLock();
  }

  private releaseScrollLock(): void {
    if (typeof document === 'undefined') return;
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'overflow');
  }

  onBackdropClick(): void {
    if (this.estado === 'loading') return;
    this.cerrar.emit();
  }

  get isSociedades(): boolean {
    return this.tipoTarjeta === 'sociedades';
  }

  get tituloModal(): string {
    switch (this.estado) {
      case 'success':
        return 'Datos actualizados';
      case 'not_found':
        return 'Sin información en MYJCC';
      case 'error':
        return 'No fue posible actualizar';
      default:
        return 'Actualizar datos personales';
    }
  }

  get titularNombre(): string {
    if (!this.registro) return '-';
    if (this.isSociedades) {
      return this.registro.razon_social || '-';
    }
    return (
      this.registro.nombre_completo ||
      [this.registro.nombres, this.registro.primer_apellido, this.registro.segundo_apellido].filter(Boolean).join(' ').trim() ||
      '-'
    );
  }

  get titularDocumento(): string {
    if (!this.registro) return '-';
    return String((this.isSociedades ? this.registro.nit : this.registro.no_documento) || '-');
  }

  get titularMatricula(): string {
    if (!this.registro) return '-';
    return String((this.isSociedades ? this.registro.inscripcion : this.registro.no_tarjeta) || '-');
  }
}
