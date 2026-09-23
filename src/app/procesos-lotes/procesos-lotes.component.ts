import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';

export interface MetricasColas {
  worker_activo: boolean;
  worker_estado: string;
  circuit_breaker: {
    estado: string;
    fallos_consecutivos: number;
    max_fallos: number;
    cooldown_segundos: number;
  };
  scheduler: {
    habilitado: boolean;
    ejecutando_ahora: boolean;
    intervalo_minutos: number;
    ultima_ejecucion?: string;
    ultimo_resultado?: {
      contadores_encolados: number;
      sociedades_encoladas: number;
      total_encolados: number;
      errores: number;
      ultimo_error?: string;
    };
    proxima_ejecucion?: string;
  };
  metricas_items: {
    total: number;
    pendientes: number;
    procesando: number;
    exitosos: number;
    fallidos: number;
  };
  metricas_lotes: {
    total_lotes: number;
    completados: number;
    en_proceso: number;
    pendientes: number;
  };
}

export interface ConfiguracionColas {
  id?: number;
  client_id: number;
  habilitado: boolean;
  tamano_lote: number;
  intervalo_sondeo_segundos: number;
  delay_por_item_segundos: number;
  circuit_breaker_max_fallos: number;
  circuit_breaker_cooldown_segundos: number;
  scheduler_intervalo_minutos: number;
  actualizado_en?: string;
}

export interface LoteItem {
  id: number;
  client_id?: number;
  archivo_nombre?: string;
  nombre_archivo?: string;
  tipo_tarjeta?: string;
  tipo_lote?: string;
  tipo_tramite?: string;
  total_registros: number;
  procesados: number;
  exitosos: number;
  duplicados?: number;
  fallidos: number;
  estado: string;
  fecha_creacion?: string;
  creado_en?: string;
  fecha_fin?: string;
  tiempo_proceso_segundos?: number;
}

export interface LoteDetalleItem {
  id: number;
  lote_id?: number;
  documento_o_nit: string;
  resultado: string;
  tarjeta_id?: number;
  mensaje_detalle?: string;
  fecha_proceso?: string;
  numero_documento?: string;
  estado?: string;
  mensaje_error?: string;
}

export interface SincronizacionLogItem {
  id: number;
  origen: string;
  fecha_inicio: string;
  fecha_fin?: string;
  duracion_ms: number;
  estado: 'EXITOSO' | 'FALLIDO' | 'SIN_NOVEDAD' | 'PARCIAL';
  total_encolados: number;
  contadores_encolados: number;
  sociedades_encoladas: number;
  errores_count: number;
  detalle?: string;
  creado_en?: string;
}

@Component({
  selector: 'app-procesos-lotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './procesos-lotes.component.html',
  styleUrls: ['./procesos-lotes.component.css']
})
export class ProcesosLotesComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'cola' | 'sincronizacion' | 'configuracion' = 'cola';

  // Métricas y estado del worker
  metricas: MetricasColas | null = null;
  loadingMetricas = false;
  autoRefresh = true;
  private refreshTimer: any = null;

  // Lotes
  lotes: LoteItem[] = [];
  totalLotes = 0;
  page = 1;
  pageSize = 10;
  loadingLotes = false;

  // Historial de Sincronización Automática
  historialSincronizacion: SincronizacionLogItem[] = [];
  loadingHistorialSincronizacion = false;

  get ultimaSincronizacion(): SincronizacionLogItem | null {
    return this.historialSincronizacion && this.historialSincronizacion.length > 0
      ? this.historialSincronizacion[0]
      : null;
  }

  // Detalle Modal
  mostrarModalDetalle = false;
  selectedLote: LoteItem | null = null;
  selectedLoteItems: LoteDetalleItem[] = [];
  loadingDetalle = false;

  // Configuración
  configuracion: ConfiguracionColas = {
    client_id: CLIENT_ID,
    habilitado: true,
    tamano_lote: 10,
    intervalo_sondeo_segundos: 3,
    delay_por_item_segundos: 0.5,
    circuit_breaker_max_fallos: 5,
    circuit_breaker_cooldown_segundos: 60,
    scheduler_intervalo_minutos: 60
  };
  loadingConfig = false;
  savingConfig = false;

  // Operaciones
  runningTask = false;
  mensajeExito = '';
  mensajeError = '';

  ngOnInit(): void {
    this.cargarMetricas();
    this.cargarLotes();
    this.cargarConfiguracion();
    this.cargarHistorialSincronizacion(true);
    this.iniciarAutoRefresh();
  }

  ngOnDestroy(): void {
    this.detenerAutoRefresh();
  }

  setTab(tab: 'cola' | 'sincronizacion' | 'configuracion'): void {
    this.activeTab = tab;
    this.limpiarMensajes();
    if (tab === 'cola') {
      this.cargarMetricas();
      this.cargarLotes();
    } else if (tab === 'sincronizacion') {
      this.cargarMetricas();
      this.cargarHistorialSincronizacion();
    } else {
      this.cargarConfiguracion();
    }
  }

  iniciarAutoRefresh(): void {
    this.detenerAutoRefresh();
    if (this.autoRefresh) {
      this.refreshTimer = setInterval(() => {
        if ((this.activeTab === 'cola' || this.activeTab === 'sincronizacion') && !this.loadingMetricas && !this.loadingLotes) {
          this.cargarMetricas(true);
          if (this.activeTab === 'cola') {
            this.cargarLotes(true);
          } else if (this.activeTab === 'sincronizacion') {
            this.cargarHistorialSincronizacion(true);
          }
        }
      }, 10000); // Cada 10 segundos
    }
  }

  detenerAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.iniciarAutoRefresh();
    } else {
      this.detenerAutoRefresh();
    }
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  cargarMetricas(silent = false): void {
    if (!silent) this.loadingMetricas = true;
    this.http.get<any>(`${API_BASE}/colas/metricas?client_id=${CLIENT_ID}`).subscribe({
      next: (resp) => {
        if (resp && resp.status === 'success') {
          this.metricas = resp.data;
        }
        this.loadingMetricas = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (!silent) {
          this.mensajeError = 'Error al consultar métricas del worker.';
        }
        this.loadingMetricas = false;
        this.cdr.markForCheck();
      }
    });
  }

  cargarLotes(silent = false): void {
    if (!silent) this.loadingLotes = true;
    const offset = (this.page - 1) * this.pageSize;
    this.http.get<any>(`${API_BASE}/colas/lotes?client_id=${CLIENT_ID}&page=${this.page}&page_size=${this.pageSize}&limit=${this.pageSize}&offset=${offset}`).subscribe({
      next: (resp) => {
        if (resp && resp.status === 'success' && resp.data) {
          this.lotes = resp.data.items || [];
          this.totalLotes = resp.data.total || 0;
        }
        this.loadingLotes = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (!silent) {
          this.mensajeError = 'Error al consultar la lista de lotes.';
        }
        this.loadingLotes = false;
        this.cdr.markForCheck();
      }
    });
  }

  cargarConfiguracion(): void {
    this.loadingConfig = true;
    this.http.get<any>(`${API_BASE}/colas/configuracion?client_id=${CLIENT_ID}`).subscribe({
      next: (resp) => {
        if (resp && resp.status === 'success' && resp.data) {
          const d = resp.data;
          this.configuracion = {
            id: d.id,
            client_id: d.client_id ?? CLIENT_ID,
            habilitado: d.worker_enabled !== undefined ? !!d.worker_enabled : (d.habilitado ?? true),
            tamano_lote: d.batch_size ?? d.tamano_lote ?? 10,
            intervalo_sondeo_segundos: d.poll_interval_seconds ?? d.intervalo_sondeo_segundos ?? 3,
            delay_por_item_segundos: d.item_delay_seconds ?? d.delay_por_item_segundos ?? 0.5,
            circuit_breaker_max_fallos: d.circuit_breaker_fail_threshold ?? d.circuit_breaker_max_fallos ?? 5,
            circuit_breaker_cooldown_segundos: d.circuit_breaker_cooldown_seconds ?? d.circuit_breaker_cooldown_segundos ?? 60,
            scheduler_intervalo_minutos: d.scheduler_interval_seconds ? Math.round(d.scheduler_interval_seconds / 60) : (d.scheduler_intervalo_minutos ?? 60),
            actualizado_en: d.actualizado_en
          };
        }
        this.loadingConfig = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.mensajeError = 'Error al cargar los parámetros de configuración.';
        this.loadingConfig = false;
        this.cdr.markForCheck();
      }
    });
  }

  guardarConfiguracion(): void {
    this.savingConfig = true;
    this.limpiarMensajes();

    const payload = {
      worker_enabled: this.configuracion.habilitado,
      batch_size: Number(this.configuracion.tamano_lote),
      poll_interval_seconds: Number(this.configuracion.intervalo_sondeo_segundos),
      item_delay_seconds: Number(this.configuracion.delay_por_item_segundos),
      circuit_breaker_fail_threshold: Number(this.configuracion.circuit_breaker_max_fallos),
      circuit_breaker_cooldown_seconds: Number(this.configuracion.circuit_breaker_cooldown_segundos),
      scheduler_interval_seconds: Number(this.configuracion.scheduler_intervalo_minutos) * 60,
      habilitado: this.configuracion.habilitado,
      tamano_lote: Number(this.configuracion.tamano_lote),
      intervalo_sondeo_segundos: Number(this.configuracion.intervalo_sondeo_segundos),
      delay_por_item_segundos: Number(this.configuracion.delay_por_item_segundos),
      circuit_breaker_max_fallos: Number(this.configuracion.circuit_breaker_max_fallos),
      circuit_breaker_cooldown_segundos: Number(this.configuracion.circuit_breaker_cooldown_segundos),
      scheduler_intervalo_minutos: Number(this.configuracion.scheduler_intervalo_minutos)
    };

    this.http.put<any>(`${API_BASE}/colas/configuracion?client_id=${CLIENT_ID}`, payload).subscribe({
      next: (resp) => {
        this.savingConfig = false;
        if (resp && resp.status === 'success') {
          this.mensajeExito = 'Parámetros actualizados exitosamente en base de datos y memoria del microservicio.';
          if (resp.data) {
            this.configuracion = { ...this.configuracion, ...resp.data };
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.savingConfig = false;
        this.mensajeError = err?.error?.detail || 'Error al guardar la configuración de colas.';
        this.cdr.markForCheck();
      }
    });
  }

  ejecutarTareaManual(): void {
    if (this.runningTask) return;
    this.runningTask = true;
    this.limpiarMensajes();

    this.http.post<any>(`${API_BASE}/colas/ejecutar-tarea?client_id=${CLIENT_ID}`, {}).subscribe({
      next: (resp) => {
        this.runningTask = false;
        if (resp?.status === 'error' || (resp?.data?.errores > 0 && (resp?.data?.procesados_contadores + resp?.data?.procesados_sociedades) === 0)) {
          this.mensajeError = resp?.message || resp?.data?.ultimo_error || 'Error durante la sincronización con los servicios de JCC.';
        } else if (resp?.status === 'warning') {
          this.mensajeExito = resp?.message || 'Sincronización completada con advertencias.';
        } else {
          this.mensajeExito = resp?.message || 'Proceso de sincronización/emisión en lote disparado exitosamente.';
        }
        setTimeout(() => {
          this.cargarMetricas();
          this.cargarLotes();
          this.cargarHistorialSincronizacion();
        }, 1500);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.runningTask = false;
        const detail = err?.error?.detail || err?.error?.message || err?.message || 'Error al solicitar ejecución de la tarea de sincronización.';
        this.mensajeError = typeof detail === 'string' ? detail : JSON.stringify(detail);
        setTimeout(() => {
          this.cargarMetricas();
          this.cargarHistorialSincronizacion();
        }, 1000);
        this.cdr.markForCheck();
      }
    });
  }

  cargarHistorialSincronizacion(silent = false): void {
    if (!silent) this.loadingHistorialSincronizacion = true;
    this.http.get<any>(`${API_BASE}/colas/sincronizacion/historial?client_id=${CLIENT_ID}&limit=15`).subscribe({
      next: (resp) => {
        if (resp && resp.status === 'success' && resp.data) {
          this.historialSincronizacion = resp.data;
        }
        this.loadingHistorialSincronizacion = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingHistorialSincronizacion = false;
        this.cdr.detectChanges();
      }
    });
  }

  verDetalleLote(lote: LoteItem): void {
    this.selectedLote = lote;
    this.selectedLoteItems = [];
    this.mostrarModalDetalle = true;
    this.loadingDetalle = true;
    this.cdr.detectChanges();

    this.http.get<any>(`${API_BASE}/colas/lote/${lote.id}?client_id=${CLIENT_ID}`).subscribe({
      next: (resp) => {
        const rawItems = resp?.data?.items || resp?.items || [];
        this.selectedLoteItems = rawItems.map((it: any) => ({
          id: it.id,
          lote_id: it.lote_id,
          documento_o_nit: it.documento_o_nit || it.numero_documento,
          resultado: it.resultado || it.estado,
          tarjeta_id: it.tarjeta_id,
          mensaje_detalle: it.mensaje_detalle || it.mensaje_error,
          fecha_proceso: it.fecha_proceso
        }));

        const loteInfo = resp?.data?.lote || resp?.lote;
        if (loteInfo) {
          this.selectedLote = { ...this.selectedLote, ...loteInfo };
        }
        this.loadingDetalle = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingDetalle = false;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.selectedLote = null;
    this.selectedLoteItems = [];
    this.cdr.detectChanges();
  }

  // Paginación estándar Nexura
  get totalPaginas(): number {
    return Math.ceil(this.totalLotes / this.pageSize) || 1;
  }

  get startRecord(): number {
    if (this.totalLotes === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.page * this.pageSize, this.totalLotes);
  }

  get pagesArray(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.page - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPaginas, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas && nuevaPagina !== this.page) {
      this.page = nuevaPagina;
      this.cargarLotes();
    }
  }

  getTipoTarjetaLabel(tipo?: string): string {
    const t = tipo?.toLowerCase() || '';
    if (t === 'sociedades' || t === 'sociedad') return 'Sociedades';
    if (t === 'contadores' || t === 'contador') return 'Contadores';
    return tipo ? (tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase()) : 'General';
  }

  // Utilidades de formato
  getEstadoLoteBadge(estado?: string): string {
    switch (estado?.toUpperCase()) {
      case 'FINALIZADO':
      case 'COMPLETADO': return 'badge bg-success-subtle text-success border border-success-subtle';
      case 'PROCESANDO': return 'badge bg-primary-subtle text-primary border border-primary-subtle';
      case 'EN_COLA':
      case 'PENDIENTE': return 'badge bg-warning-subtle text-warning border border-warning-subtle';
      case 'ERROR':
      case 'FALLIDO': return 'badge bg-danger-subtle text-danger border border-danger-subtle';
      default: return 'badge bg-secondary-subtle text-secondary';
    }
  }

  getEstadoItemBadge(resultado?: string): string {
    switch (resultado?.toLowerCase()) {
      case 'emitido_exitosamente':
      case 'exitoso': return 'badge bg-success-subtle text-success border border-success-subtle';
      case 'no_apto': return 'badge bg-warning-subtle text-warning border border-warning-subtle';
      case 'fallido':
      case 'error':
      case 'error_conexion': return 'badge bg-danger-subtle text-danger border border-danger-subtle';
      case 'procesando': return 'badge bg-primary-subtle text-primary border border-primary-subtle';
      case 'en_cola':
      case 'pendiente': return 'badge bg-secondary-subtle text-secondary border';
      default: return 'badge bg-secondary-subtle text-secondary';
    }
  }

  getResultadoItemTexto(resultado?: string): string {
    switch (resultado?.toLowerCase()) {
      case 'emitido_exitosamente': return 'EXITOSO';
      case 'no_apto': return 'NO ENCONTRADO';
      case 'error_conexion': return 'ERROR CONEXIÓN';
      case 'fallido': return 'FALLIDO';
      case 'procesando': return 'PROCESANDO';
      case 'pendiente': return 'PENDIENTE';
      default: return (resultado || 'DESCONOCIDO').toUpperCase();
    }
  }
}
