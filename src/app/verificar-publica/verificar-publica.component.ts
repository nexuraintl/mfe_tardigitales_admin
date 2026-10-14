import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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

            <!-- Estado: Cargando -->
            <div *ngIf="cargando" class="text-center py-5">
              <div class="spinner-border text-primary mb-3" role="status" style="width: 2.5rem; height: 2.5rem;">
                <span class="visually-hidden">Consultando credencial...</span>
              </div>
              <div class="text-muted fw-semibold" style="font-size: 14px;">Validando autenticidad de la credencial en línea...</div>
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
              
              <!-- Badge de Autenticidad en Cabecera (Controlado por val_estado) -->
              <div *ngIf="estadoVisible" class="text-center mb-4">
                <div *ngIf="isVigente" class="badge-autentica d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-success-subtle text-success border border-success-subtle shadow-sm">
                  <span class="fa fa-check-circle fs-6"></span>
                  <strong style="font-size: 13.5px;">CREDENCIAL VIGENTE Y VÁLIDA</strong>
                </div>
                <div *ngIf="!isVigente" class="badge-autentica d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-danger-subtle text-danger border border-danger-subtle shadow-sm">
                  <span class="fa fa-times-circle fs-6"></span>
                  <strong style="font-size: 13.5px;">CREDENCIAL {{ (tarjeta.estado_tarjeta || tarjeta.estado || 'INACTIVA') | uppercase }}</strong>
                </div>
              </div>

              <!-- Vista Previa de la Credencial Oficial (Branding Oficial con Filtros de Validador QR) -->
              <div class="branding-preview-container d-flex justify-content-center my-4 overflow-hidden">
                <div class="w-100" style="max-width: 820px;">
                  <app-tarjeta-credencial
                    [tipo]="isSociedad ? 'sociedad' : 'contador'"
                    modo="digital"
                    vista="ambas"
                    layout="auto"
                    [datos]="credencialDatos"
                    [branding]="credencialBranding"
                  ></app-tarjeta-credencial>
                </div>
              </div>

              <!-- Mensaje Informativo Oficial (UAE Junta Central de Contadores) -->
              <div class="mt-4 p-3 p-md-4 rounded-3 bg-white text-dark border d-flex align-items-center gap-3 shadow-sm">
                <span class="fa fa-info-circle text-dark fs-3 flex-shrink-0" style="font-size: 28px;"></span>
                <div style="font-size: 13.5px; line-height: 1.5; color: #1e293b;">
                  <div>Estos datos tienen carácter <strong>INFORMATIVO</strong>.</div>
                  <div>Recuerde que si usted desea saber si el {{ isSociedad ? 'la Sociedad de Contadores Públicos' : 'Contador Público' }} se encuentra <strong>habilitado</strong> para la prestación de servicios contables, se puede realizar a través del <strong>Certificado de Vigencia y Antecedentes Disciplinarios</strong>.</div>
                </div>
              </div>

            </div>

          </div>

          <!-- Footer de la Tarjeta -->
          <div class="card-footer bg-white border-top py-3 px-4 text-center">
            <span class="text-muted" style="font-size: 12px;">UAE Junta Central de Contadores — República de Colombia</span>
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
        const pathParts = window.location.pathname.split('/').filter(p => !!p);
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

    this.http.get<any>(`${API_BASE}/tarjetas/verificar?token=${encodeURIComponent(this.token)}&client_id=${CLIENT_ID}`).subscribe({
      next: (resp) => {
        this.cargando = false;
        this.tarjeta = resp?.data || resp;
        if (!this.tarjeta || (!this.tarjeta.id && !this.tarjeta.hash_sha256)) {
          this.errorMsg = 'No se encontró ninguna credencial registrada con el código de verificación suministrado.';
        } else {
          this.cargarConfigValidador();
          this.cargarBranding();
        }
        this.cdr.detectChanges();
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

  private cargarConfigValidador(): void {
    const tipo = this.isSociedad ? 'sociedades' : 'contadores';
    this.http.get<any>(`${API_BASE}/tarjetas/validador-qr/get-config?tipo_tarjeta=${tipo}&client_id=${CLIENT_ID}`).subscribe({
      next: (res) => {
        if (res) {
          const cfg = res.data || res;
          if (this.isSociedad) {
            this.configSociedad = {
              val_numero_registro: Boolean(cfg.val_numero_registro ?? cfg.val_matricula ?? true),
              val_fecha_resolucion: Boolean(cfg.val_fecha_resolucion ?? true),
              val_expediente: Boolean(cfg.val_expediente ?? true),
              val_razon_social: Boolean(cfg.val_razon_social ?? cfg.val_nombres ?? true),
              val_nit: Boolean(cfg.val_nit ?? cfg.val_numero_identificacion ?? true),
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
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.warn('[VerificarPublica] Error al consultar validador-qr config:', err);
      }
    });
  }

  private cargarBranding(): void {
    const tipoId = this.isSociedad ? 2 : 1;
    this.http.get<any>(`${API_BASE}/tarjetas/branding-credentials/info-published/${tipoId}?client_id=${CLIENT_ID}`).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res[0] : res;
        if (data && (data.color_fondo || data.logo || data.patron)) {
          if (data.color_fondo) this.brandingColorFondo = data.color_fondo;
          if (data.color_letra) this.brandingColorLetra = data.color_letra;
          if (data.logo) this.brandingLogoUrl = data.logo;
          if (data.patron) this.brandingPatronUrl = data.patron;
          this.cdr.detectChanges();
        } else {
          this.cargarBrandingGeneral(tipoId);
        }
      },
      error: () => {
        this.cargarBrandingGeneral(tipoId);
      }
    });
  }

  private cargarBrandingGeneral(tipoId: number): void {
    this.http.get<any>(`${API_BASE}/tarjetas/branding-credentials/info/${tipoId}?client_id=${CLIENT_ID}`).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res[0] : res;
        if (data) {
          if (data.color_fondo) this.brandingColorFondo = data.color_fondo;
          if (data.color_letra) this.brandingColorLetra = data.color_letra;
          if (data.logo) this.brandingLogoUrl = data.logo;
          if (data.patron) this.brandingPatronUrl = data.patron;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.warn('[VerificarPublica] Error al consultar branding fallback:', err);
      }
    });
  }

  get credencialDatos(): CredencialDatos {
    if (!this.tarjeta) return {};

    if (this.isSociedad) {
      const regMostrar = this.configSociedad.val_numero_registro ? (this.tarjeta.inscripcion || '-') : 'Protegido';
      const fechaMostrar = this.configSociedad.val_fecha_resolucion ? (this.tarjeta.fecha_resolucion || '-') : 'Protegido';
      const expMostrar = this.configSociedad.val_expediente ? (this.tarjeta.no_expd ?? '-') : 'Protegido';
      const rsMostrar = this.configSociedad.val_razon_social ? (this.tarjeta.razon_social || '-') : 'Información reservada';
      const nitMostrar = this.configSociedad.val_nit ? (this.tarjeta.nit ? String(this.tarjeta.nit) : '-') : 'Protegido';
      const tipoRegMostrar = this.configSociedad.val_tipo_registro ? (this.tarjeta.tipo_sociedad || this.tarjeta.tipo_asociado || 'Sociedad de Contadores') : 'Protegido';
      const resMostrar = this.configSociedad.val_resolucion ? (this.tarjeta.resolucion || '-') : 'Protegido';

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
      const tpMostrar = this.configContador.val_tarjeta_profesional ? (this.tarjeta.no_tarjeta || '-') : 'Protegido';
      const fechaMostrar = this.configContador.val_fecha_resolucion ? (this.tarjeta.fecha_resolucion || '-') : 'Protegido';
      const resMostrar = this.configContador.val_resolucion ? (this.tarjeta.resolucion || '-') : 'Protegido';
      const nomMostrar = this.configContador.val_nombre ? (this.tarjeta.nombre_completo || '-') : 'Información reservada';
      const docMostrar = this.configContador.val_cedula ? (this.tarjeta.no_documento ? String(this.tarjeta.no_documento) : '-') : 'Protegido';
      const instMostrar = this.configContador.val_institucion ? (this.tarjeta.universidad || 'Universidad de La Salle') : 'Protegido';
      const expMostrar = this.configContador.val_expediente ? (this.tarjeta.no_expd ?? '-') : 'Protegido';

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
