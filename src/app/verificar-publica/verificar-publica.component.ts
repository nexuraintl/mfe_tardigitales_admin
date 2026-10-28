import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { TarjetaCredencialComponent, CredencialDatos, CredencialBranding } from '../shared/components/tarjeta-credencial/tarjeta-credencial.component';

export interface ConfigValidadorContador {
  val_tarjeta_profesional: boolean;
  val_fecha_resolucion: boolean;
  val_resolucion: boolean;
  val_nombre: boolean;
  val_cedula: boolean;
  val_institucion: boolean;
  val_expediente: boolean;
  val_estado: boolean;
  val_codigo_tarjeta?: boolean;
  val_foto?: boolean;
}

export interface ConfigValidadorSociedad {
  val_numero_registro: boolean;
  val_fecha_resolucion: boolean;
  val_expediente: boolean;
  val_razon_social: boolean;
  val_nit: boolean;
  val_tipo_registro: boolean;
  val_resolucion: boolean;
  val_estado: boolean;
  val_codigo_tarjeta?: boolean;
  val_foto?: boolean;
}

@Component({
  selector: 'app-verificar-publica',
  standalone: true,
  imports: [CommonModule, RouterModule, TarjetaCredencialComponent],
  template: `
    <div class="verificar-container py-5 px-3">
      <div class="container" style="max-width: 860px;">

        <!-- Tarjeta Principal de Validación -->
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          
          <!-- Cabecera Institucional -->
          <div class="card-header bg-white border-bottom py-4 px-4 text-center">
            <img src="assets/images/logo-jcc.png" alt="UAE Junta Central de Contadores" style="height: 48px; max-width: 220px; object-fit: contain;" class="mb-2" />
            <h5 class="fw-bold text-slate-800 mb-1" style="font-size: 16px;">Verificación Pública de Credencial Digital</h5>
            <p class="text-muted mb-0" style="font-size: 12.5px;">Sistema Oficial de Registro — UAE Junta Central de Contadores</p>
          </div>

          <div class="card-body p-4 p-md-5">

            <!-- Estado: Cargando (Loading Gris Latente / Skeleton Shimmer) -->
            <div *ngIf="cargando" class="skeleton-wrapper">
              <div class="branding-preview-container d-flex justify-content-center my-2 overflow-hidden">
                <div class="w-100 d-flex justify-content-center">
                  
                  <!-- Silueta 1:1 de la ÚNICA Tarjeta Oficial (max-width: 358px, radio 24px) -->
                  <div class="skeleton-card-single p-4 shadow-sm">
                    <!-- Logo JCC superior -->
                    <div class="d-flex justify-content-between align-items-center mb-4">
                      <div class="skeleton-box skeleton-logo"></div>
                    </div>

                    <!-- Fila de Foto y Número de Tarjeta -->
                    <div class="d-flex gap-3 mb-4 align-items-center">
                      <div class="skeleton-box skeleton-photo rounded-3"></div>
                      <div class="flex-grow-1 d-flex flex-column gap-2">
                        <div class="skeleton-box w-50" style="height: 10px;"></div>
                        <div class="skeleton-box w-85" style="height: 20px;"></div>
                        <div class="skeleton-box w-60" style="height: 10px; margin-top: 6px;"></div>
                        <div class="skeleton-box w-75" style="height: 14px;"></div>
                      </div>
                    </div>

                    <!-- Filas inferiores de datos -->
                    <div class="row g-3 pt-2">
                      <div class="col-6">
                        <div class="skeleton-box w-50 mb-2" style="height: 9px;"></div>
                        <div class="skeleton-box w-90" style="height: 14px;"></div>
                      </div>
                      <div class="col-6">
                        <div class="skeleton-box w-50 mb-2" style="height: 9px;"></div>
                        <div class="skeleton-box w-80" style="height: 14px;"></div>
                      </div>
                      <div class="col-6 mt-3">
                        <div class="skeleton-box w-60 mb-2" style="height: 9px;"></div>
                        <div class="skeleton-box w-85" style="height: 14px;"></div>
                      </div>
                      <div class="col-6 mt-3">
                        <div class="skeleton-box w-45 mb-2" style="height: 9px;"></div>
                        <div class="skeleton-box w-70" style="height: 14px;"></div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Esqueleto del bloque informativo inferior -->
              <div class="skeleton-box skeleton-info-card w-100 mt-4 rounded-3" style="height: 72px;"></div>
            </div>

            <!-- Estado: Error o No Encontrada -->
            <div *ngIf="!cargando && errorMsg" class="text-center py-4">
              <div class="mb-3">
                <span class="fa fa-exclamation-triangle text-danger" style="font-size: 48px;"></span>
              </div>
              <h5 class="fw-bold text-danger mb-2" style="font-size: 17px;">Credencial no verificable</h5>
              <p class="text-muted mb-4 px-3" style="font-size: 13.5px;">{{ errorMsg }}</p>
              <div class="p-3 bg-light rounded-3 text-start mb-3" style="font-size: 12px; color: #64748b;">
                <strong>Verifique que:</strong>
                <ul class="mb-0 mt-1 ps-3">
                  <li>El código QR o enlace provenga de una credencial oficial emitida.</li>
                  <li>El token o hash de autenticidad esté completo y sin alteraciones.</li>
                </ul>
              </div>
            </div>

            <!-- Estado: Tarjeta Encontrada -->
            <div *ngIf="!cargando && tarjeta" class="verificacion-resultado">

              <!-- Vista Previa de la Credencial Oficial (Branding Oficial con Filtros de Validador QR) -->
              <div class="branding-preview-container d-flex justify-content-center my-2 overflow-hidden">
                <div class="w-100" style="max-width: 820px;">
                  <app-tarjeta-credencial
                    [tipo]="isSociedad ? 'sociedad' : 'contador'"
                    modo="digital"
                    vista="ambas"
                    layout="auto"
                    [datos]="credencialDatos"
                    [branding]="credencialBranding"
                    [camposVisibles]="isSociedad ? configSociedad : configContador"
                  ></app-tarjeta-credencial>
                </div>
              </div>

              <!-- Mensaje Informativo Oficial (UAE Junta Central de Contadores) -->
              <div class="mt-4 p-3 p-md-4 rounded-3 bg-white text-dark border d-flex align-items-center gap-3 shadow-sm">
                <span class="fa fa-info-circle text-dark fs-3 flex-shrink-0" style="font-size: 28px;"></span>
                <div style="font-size: 13.5px; line-height: 1.5; color: #1e293b;">
                  <div>Estos datos tienen carácter <strong>INFORMATIVO</strong>.</div>
                  <div>Recuerde que si usted desea saber si {{ isSociedad ? 'la Sociedad de Contadores Públicos' : 'el Contador Público' }} se encuentra <strong>habilitado</strong> para la prestación de servicios contables, se puede realizar a través del <strong>Certificado de Vigencia y Antecedentes Disciplinarios</strong>.</div>
                </div>
              </div>

            </div>

          </div>

          <!-- Footer de la Tarjeta -->
          <div class="card-footer bg-white border-top py-3 px-4 text-center">
            <span class="text-muted" style="font-size: 12px;">UAE Junta Central de Contadores</span>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .verificar-container {
      min-height: 100vh;
      background-color: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .text-slate-800 {
      color: #1e293b;
    }
    .branding-preview-container {
      background: #f8fafc;
      padding: 1.5rem 1rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    /* ========================================================
       ESQUELETO GRIS LATENTE (SKELETON SHIMMER)
       ======================================================== */
    @keyframes skeleton-shimmer-pulse {
      0% {
        background-position: -200% 0;
        opacity: 0.85;
      }
      50% {
        opacity: 1;
      }
      100% {
        background-position: 200% 0;
        opacity: 0.85;
      }
    }

    .skeleton-box {
      background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 37%, #e2e8f0 63%);
      background-size: 400% 100%;
      animation: skeleton-shimmer-pulse 1.8s ease-in-out infinite;
      border-radius: 6px;
    }

    .skeleton-card-single {
      width: 100%;
      max-width: 358px;
      min-height: 440px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px !important;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
    }

    .skeleton-logo {
      width: 110px;
      height: 26px;
    }

    .skeleton-chip {
      width: 32px;
      height: 24px;
      border-radius: 4px;
    }

    .skeleton-photo {
      width: 82px;
      height: 104px;
      flex-shrink: 0;
    }

    .skeleton-qr {
      width: 100px;
      height: 100px;
    }

    .skeleton-info-card {
      border: 1px solid #e2e8f0;
    }
  `]
})
export class VerificarPublicaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  token: string = '';
  cargando: boolean = true;
  errorMsg: string | null = null;
  tarjeta: any = null;

  // Configuración de campos Contadores
  configContador: ConfigValidadorContador = {
    val_tarjeta_profesional: true,
    val_fecha_resolucion: true,
    val_resolucion: true,
    val_nombre: true,
    val_cedula: true,
    val_institucion: true,
    val_expediente: true,
    val_estado: true,
    val_codigo_tarjeta: true,
    val_foto: true
  };

  // Configuración de campos Sociedades
  configSociedad: ConfigValidadorSociedad = {
    val_numero_registro: true,
    val_fecha_resolucion: true,
    val_expediente: true,
    val_razon_social: true,
    val_nit: true,
    val_tipo_registro: true,
    val_resolucion: true,
    val_estado: true,
    val_codigo_tarjeta: true,
    val_foto: true
  };

  // Branding de la credencial
  brandingColorFondo: string = '#14275f';
  brandingColorLetra: string = '#ffffff';
  brandingLogoUrl: string | null = null;
  brandingPatronUrl: string | null = null;

  fechaConsultaActual: string = '';

  get isSociedad(): boolean {
    if (!this.tarjeta) return false;
    return this.tarjeta.tipo_tarjeta === 'sociedades' || !!this.tarjeta.razon_social || !!this.tarjeta.nit;
  }

  get estadoVisible(): boolean {
    return this.isSociedad ? this.configSociedad.val_estado : this.configContador.val_estado;
  }

  get codigoVisible(): boolean {
    return this.isSociedad ? Boolean(this.configSociedad.val_codigo_tarjeta) : Boolean(this.configContador.val_codigo_tarjeta);
  }

  get isVigente(): boolean {
    if (!this.tarjeta) return false;
    const est = String(this.tarjeta.estado_tarjeta || this.tarjeta.estado || '').toLowerCase();
    return est === 'activa' || est === 'emitida' || est === 'activo';
  }

  ngOnInit(): void {
    const now = new Date();
    this.fechaConsultaActual = now.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let tokenDetectado = '';
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      tokenDetectado = sp.get('token') || sp.get('hash') || '';
      if (!tokenDetectado) {
        const pathParts = window.location.pathname.split('/').filter(p => !p);
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart !== 'verificar') {
          tokenDetectado = lastPart;
        }
      }
    }

    if (tokenDetectado) {
      this.token = tokenDetectado;
      this.cargarDatos();
    } else {
      this.route.queryParams.subscribe(params => {
        const t = params['token'] || params['hash'] || this.route.snapshot.params['token'] || '';
        if (t && t !== this.token) {
          this.token = t;
          this.cargarDatos();
        } else if (!this.token) {
          this.cargando = false;
          this.errorMsg = 'No se proporcionó un token o código de verificación en la solicitud.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  private cargarDatos(): void {
    this.cargando = true;
    this.errorMsg = null;
    this.cdr.detectChanges();

    // 1. Consultar tarjeta digital sanitizada en backend
    this.http.get<any>(`${API_BASE}/tarjetas/verificar?token=${encodeURIComponent(this.token)}&client_id=${CLIENT_ID}&sanitizar=true`).subscribe({
      next: (resp) => {
        const tarjetaData = resp?.data || resp;
        if (!tarjetaData || (!tarjetaData.id && !tarjetaData.hash_sha256)) {
          this.cargando = false;
          this.errorMsg = 'No se encontró ninguna credencial registrada con el código de verificación suministrado.';
          this.cdr.detectChanges();
          return;
        }

        this.tarjeta = tarjetaData;
        const esSociedad = this.isSociedad;
        const tipoNombre = esSociedad ? 'sociedades' : 'contadores';
        const tipoId = esSociedad ? 2 : 1;

        // 2. Ejecutar en paralelo la configuración del validador y el branding publicado
        const configObs = this.http.get<any>(`${API_BASE}/tarjetas/validador-qr/get-config?tipo_tarjeta=${tipoNombre}&client_id=${CLIENT_ID}`).pipe(
          catchError((err) => {
            console.warn('[VerificarPublica] Advertencia consultando config validador:', err);
            return of(null);
          })
        );

        const brandingPublishedObs = this.http.get<any>(`${API_BASE}/tarjetas/branding-credentials/info-published/${tipoId}?client_id=${CLIENT_ID}`).pipe(
          catchError(() => {
            return this.http.get<any>(`${API_BASE}/tarjetas/branding-credentials/info/${tipoId}?client_id=${CLIENT_ID}`).pipe(
              catchError(() => of(null))
            );
          })
        );

        forkJoin({
          config: configObs,
          branding: brandingPublishedObs
        }).subscribe({
          next: ({ config, branding }) => {
            // Aplicar configuración de validador
            if (config) {
              const cfg = config.data || config;
              if (esSociedad) {
                this.configSociedad = {
                  val_numero_registro: Boolean(cfg.val_numero_registro ?? cfg.val_matricula ?? true),
                  val_fecha_resolucion: Boolean(cfg.val_fecha_resolucion ?? true),
                  val_expediente: Boolean(cfg.val_expediente ?? true),
                  val_razon_social: Boolean(cfg.val_razon_social ?? cfg.val_nombre ?? cfg.val_nombres ?? true),
                  val_nit: Boolean(cfg.val_nit ?? cfg.val_cedula ?? cfg.val_numero_identificacion ?? true),
                  val_tipo_registro: Boolean(cfg.val_tipo_registro ?? true),
                  val_resolucion: Boolean(cfg.val_resolucion ?? true),
                  val_estado: Boolean(cfg.val_estado ?? true),
                  val_codigo_tarjeta: Boolean(cfg.val_codigo_tarjeta ?? true),
                  val_foto: Boolean(cfg.val_foto ?? true)
                };
              } else {
                this.configContador = {
                  val_tarjeta_profesional: Boolean(cfg.val_tarjeta_profesional ?? cfg.val_matricula ?? true),
                  val_fecha_resolucion: Boolean(cfg.val_fecha_resolucion ?? true),
                  val_resolucion: Boolean(cfg.val_resolucion ?? true),
                  val_nombre: Boolean(cfg.val_nombre ?? cfg.val_nombres ?? true),
                  val_cedula: Boolean(cfg.val_cedula ?? cfg.val_numero_identificacion ?? true),
                  val_institucion: Boolean(cfg.val_institucion ?? true),
                  val_expediente: Boolean(cfg.val_expediente ?? true),
                  val_estado: Boolean(cfg.val_estado ?? true),
                  val_codigo_tarjeta: Boolean(cfg.val_codigo_tarjeta ?? true),
                  val_foto: Boolean(cfg.val_foto ?? true)
                };
              }
            }

            // Aplicar configuración de branding
            if (branding) {
              const bData = Array.isArray(branding) ? branding[0] : (branding.data || branding);
              if (bData) {
                if (bData.color_fondo) this.brandingColorFondo = bData.color_fondo;
                if (bData.color_letra) this.brandingColorLetra = bData.color_letra;
                if (bData.logo) this.brandingLogoUrl = bData.logo;
                if (bData.patron) this.brandingPatronUrl = bData.patron;
              }
            }

            // SOLO ahora que todo está listo y calculado, apagar el skeleton de carga
            this.cargando = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.cargando = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.cargando = false;
        if (err.status === 404) {
          this.errorMsg = 'La credencial consultada no existe en la base de datos oficial o el enlace ha caducado.';
        } else {
          this.errorMsg = 'Ocurrió un error al consultar el servicio oficial de verificación. Por favor intente nuevamente.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  get credencialDatos(): CredencialDatos {
    if (!this.tarjeta) return {};

    if (this.isSociedad) {
      const regMostrar = this.tarjeta.inscripcion || this.tarjeta.no_tarjeta || this.tarjeta.matricula || '';
      const fechaMostrar = this.tarjeta.fecha_resolucion || '';
      const expMostrar = this.tarjeta.no_expd ?? this.tarjeta.expediente ?? '';
      const rsMostrar = this.tarjeta.razon_social || this.tarjeta.nombre_completo || this.tarjeta.solicitante || '';
      const nitMostrar = this.tarjeta.nit ? String(this.tarjeta.nit) : (this.tarjeta.no_documento || '');
      const tipoRegMostrar = this.tarjeta.tipo_sociedad || this.tarjeta.tipo_asociado || 'Sociedad de Contadores';
      const resMostrar = this.tarjeta.resolucion || '';

      return {
        matricula: regMostrar,
        no_tarjeta: regMostrar,
        inscripcion: regMostrar,
        fecha_resolucion: fechaMostrar,
        expediente: expMostrar,
        no_expd: expMostrar,
        razon_social: rsMostrar,
        nombre_completo: rsMostrar,
        solicitante: rsMostrar,
        nit: nitMostrar,
        no_documento: nitMostrar,
        documento: nitMostrar,
        universidad: tipoRegMostrar,
        resolucion: resMostrar,
        foto: this.getFotoUrl(this.tarjeta.foto),
        estado: this.configSociedad.val_estado ? (this.tarjeta.estado_tarjeta || this.tarjeta.estado || 'Emitida') : undefined
      };
    } else {
      const tpMostrar = this.tarjeta.no_tarjeta || this.tarjeta.matricula || this.tarjeta.inscripcion || '';
      const fechaMostrar = this.tarjeta.fecha_resolucion || '';
      const resMostrar = this.tarjeta.resolucion || '';
      const nomMostrar = this.tarjeta.nombre_completo || this.tarjeta.solicitante || '';
      const docMostrar = this.tarjeta.no_documento ? String(this.tarjeta.no_documento) : (this.tarjeta.documento || '');
      const instMostrar = this.tarjeta.universidad || 'Universidad de La Salle';
      const expMostrar = this.tarjeta.no_expd ?? this.tarjeta.expediente ?? '';

      return {
        matricula: tpMostrar,
        no_tarjeta: tpMostrar,
        inscripcion: tpMostrar,
        fecha_resolucion: fechaMostrar,
        resolucion: resMostrar,
        nombre_completo: nomMostrar,
        razon_social: nomMostrar,
        solicitante: nomMostrar,
        no_documento: docMostrar,
        nit: docMostrar,
        documento: docMostrar,
        universidad: instMostrar,
        expediente: expMostrar,
        no_expd: expMostrar,
        foto: this.getFotoUrl(this.tarjeta.foto),
        estado: this.configContador.val_estado ? (this.tarjeta.estado_tarjeta || this.tarjeta.estado || 'Emitida') : undefined
      };
    }
  }

  get credencialBranding(): CredencialBranding {
    return {
      color_fondo: this.brandingColorFondo,
      color_letra: this.brandingColorLetra,
      logo_url: this.brandingLogoUrl,
      patron_url: this.brandingPatronUrl
    };
  }

  getFotoUrl(foto?: string | null): string {
    if (!foto) {
      return this.isSociedad ? 'assets/images/card-logo-sociedades.png' : 'assets/images/photo_card.jpg';
    }
    if (foto.startsWith('data:') || foto.startsWith('http://') || foto.startsWith('https://')) {
      return foto;
    }
    return `data:image/jpeg;base64,${foto}`;
  }
}
