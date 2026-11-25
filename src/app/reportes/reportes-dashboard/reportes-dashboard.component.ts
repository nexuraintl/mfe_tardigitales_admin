import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE, CLIENT_ID } from '../../core/config/api.config';
import { NxAlertComponent } from '../../shared/components/alert/alert.component';

export interface ConsolidadoFila {
  scope: string;
  modulo: string;
  segmento: string;
  total: number;
  activos: number;
  emitidos: number;
  ultima_actualizacion: string;
}

export interface ReportesData {
  cards: {
    total: number;
    activa: number;
    emitida: number;
    cancelada: number;
    fallecido: number;
    registro_activo?: number;
    registro_cancelada?: number;
    registro_fallecido?: number;
    tarjeta_activa?: number;
    tarjeta_cancelada?: number;
    tarjeta_emitida?: number;
    contadores_total: number;
    contadores_pct: number;
    sociedades_total: number;
    sociedades_pct: number;
  };
  notifications: {
    total: number;
    push: number;
    estandar: number;
    interna: number;
    entregada: number;
    no_entregada: number;
  };
  consolidado: ConsolidadoFila[];
}

@Component({
  selector: 'app-reportes-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NxAlertComponent],
  templateUrl: './reportes-dashboard.component.html',
  styleUrls: ['./reportes-dashboard.component.css']
})
export class ReportesDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  // Estados de control
  cargando = false;
  errorMensaje: string | null = null;
  mensajeExito: string | null = null;

  // Filtros anidados / condicionales del reporte
  tipoReporte: 'general' | 'cards' | 'notifications' = 'general';
  fechaDesde: string = '';
  fechaHasta: string = '';
  segmento: 'all' | 'accountants' | 'companies' = 'all';
  estado: string = 'all';

  // Opciones dinámicas según tipo de reporte
  estadosDisponibles: { value: string; label: string }[] = [];

  // Búsqueda en tabla consolidada
  searchQuery = '';

  // Datos del backend
  data: ReportesData = {
    cards: {
      total: 0,
      activa: 0,
      emitida: 0,
      cancelada: 0,
      fallecido: 0,
      contadores_total: 0,
      contadores_pct: 0,
      sociedades_total: 0,
      sociedades_pct: 0
    },
    notifications: {
      total: 0,
      push: 0,
      estandar: 0,
      interna: 0,
      entregada: 0,
      no_entregada: 0
    },
    consolidado: []
  };

  ngOnInit(): void {
    this.inicializarFechasPorDefecto();
    this.actualizarOpcionesEstado();
    this.cargarDatos();
  }

  private inicializarFechasPorDefecto(): void {
    const hoy = new Date();
    // Primer día del mes actual
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaDesde = this.formatearFechaInput(primerDia);
    this.fechaHasta = this.formatearFechaInput(hoy);
  }

  private formatearFechaInput(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Manejador de cambio en el selector padre "Tipo de reporte".
   * Gestiona el anidamiento y visibilidad de los filtros hijos (Segmento y Estado).
   */
  onTipoReporteChange(): void {
    this.estado = 'all';
    if (this.tipoReporte === 'notifications') {
      this.segmento = 'all';
    }
    this.actualizarOpcionesEstado();
    this.cargarDatos();
  }

  onSegmentoChange(): void {
    this.cargarDatos();
  }

  onEstadoChange(): void {
    this.cargarDatos();
  }

  actualizarOpcionesEstado(): void {
    if (this.tipoReporte === 'cards') {
      this.estadosDisponibles = [
        { value: 'all', label: 'Todos los estados' },
        { value: 'activa', label: 'Activa' },
        { value: 'cancelada', label: 'Cancelada' },
        { value: 'fallecido', label: 'Fallecido' },
        { value: 'emitida', label: 'Emitida' }
      ];
    } else if (this.tipoReporte === 'notifications') {
      this.estadosDisponibles = [
        { value: 'all', label: 'Todos los estados' },
        { value: 'entregada', label: 'Entregada' },
        { value: 'programada', label: 'Programada' },
        { value: 'fallida', label: 'Fallida' }
      ];
    } else {
      this.estadosDisponibles = [];
    }
  }

  cargarDatos(): void {
    this.cargando = true;
    this.errorMensaje = null;

    let params: any = {
      client_id: CLIENT_ID,
      tipo_reporte: this.tipoReporte,
      segmento: this.segmento
    };

    if (this.fechaDesde) params.fecha_desde = this.fechaDesde;
    if (this.fechaHasta) params.fecha_hasta = this.fechaHasta;
    if (this.estado && this.estado !== 'all') params.estado = this.estado;

    this.http.get<ReportesData>(`${API_BASE}/tarjetas/reportes/dashboard`, { params }).subscribe({
      next: (res) => {
        this.data = res;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ReportesDashboard] Error al consultar métricas:', err);
        this.errorMensaje = 'No fue posible cargar la información del reporte. Intente nuevamente.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Métodos de cálculo de anchos y estilos para gráficos CSS nativos
  get periodoTextoBadge(): string {
    if (!this.fechaDesde) return 'Consolidado';
    const d = new Date(this.fechaDesde + 'T00:00:00');
    if (isNaN(d.getTime())) return 'Consolidado';
    const m = d.toLocaleDateString('es-ES', { month: 'long' });
    return `${m.charAt(0).toUpperCase() + m.slice(1)} ${d.getFullYear()}`;
  }

  getRegistroTotal(): number {
    const c = this.data.cards;
    const act = c.registro_activo ?? (c.contadores_total + c.sociedades_total);
    const can = c.registro_cancelada ?? c.cancelada ?? 0;
    const fal = c.registro_fallecido ?? c.fallecido ?? 0;
    return act + can + fal;
  }

  getRegistroWidth(value: number): string {
    const total = this.getRegistroTotal();
    if (!total || total <= 0) return '0%';
    const pct = (value / total) * 100;
    return `${Math.min(100, Math.max(0, pct))}%`;
  }

  getTarjetaTotal(): number {
    const c = this.data.cards;
    const act = c.tarjeta_activa ?? c.activa ?? 0;
    const can = c.tarjeta_cancelada ?? c.cancelada ?? 0;
    const emi = c.tarjeta_emitida ?? c.emitida ?? 0;
    return act + can + emi;
  }

  getTarjetaWidth(value: number): string {
    const total = this.getTarjetaTotal();
    if (!total || total <= 0) return '0%';
    const pct = (value / total) * 100;
    return `${Math.min(100, Math.max(0, pct))}%`;
  }

  getCardWidth(value: number): string {
    const total = this.data.cards.total;
    if (!total || total <= 0) return '0%';
    const pct = (value / total) * 100;
    return `${Math.min(100, Math.max(0, pct))}%`;
  }

  getNotifHeight(value: number): string {
    const max = Math.max(this.data.notifications.push, this.data.notifications.estandar, this.data.notifications.interna, 1);
    const pct = (value / max) * 100;
    return `${Math.min(100, Math.max(5, pct))}%`;
  }

  getDonutGradient(): string {
    const pctCont = this.data.cards.contadores_pct || 0;
    return `conic-gradient(#0d6efd 0% ${pctCont}%, #198754 ${pctCont}% 100%)`;
  }

  // Filtrado de la tabla consolidada
  get filasConsolidadoFiltradas(): ConsolidadoFila[] {
    if (!this.data.consolidado) return [];
    let filas = this.data.consolidado;
    
    // Filtrar según el tipo de reporte seleccionado
    if (this.tipoReporte === 'cards') {
      filas = filas.filter(f => f.scope === 'cards');
    } else if (this.tipoReporte === 'notifications') {
      filas = filas.filter(f => f.scope === 'notifications');
    }

    if (!this.searchQuery.trim()) {
      return filas;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return filas.filter(f =>
      f.modulo.toLowerCase().includes(q) ||
      f.segmento.toLowerCase().includes(q) ||
      String(f.total).includes(q) ||
      f.ultima_actualizacion.toLowerCase().includes(q)
    );
  }

  // Títulos dinámicos de tabla
  get tablaTitulo(): string {
    if (this.tipoReporte === 'cards') return 'Consolidado de tarjetas digitales';
    if (this.tipoReporte === 'notifications') return 'Consolidado de notificaciones';
    return 'Consolidado por módulo';
  }

  get tablaSubtitulo(): string {
    if (this.tipoReporte === 'cards') return 'Resultados de tarjetas para el periodo seleccionado.';
    if (this.tipoReporte === 'notifications') return 'Resultados de notificaciones para el periodo seleccionado.';
    return 'Resumen de resultados para el periodo seleccionado.';
  }

  get periodoTexto(): string {
    if (!this.fechaDesde || !this.fechaHasta) return 'Todos los periodos';
    return `Periodo consultado: ${this.formatearFechaHumana(this.fechaDesde)} al ${this.formatearFechaHumana(this.fechaHasta)}`;
  }

  private formatearFechaHumana(fechaStr: string): string {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return fechaStr;
    const anio = partes[0];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const mes = meses[parseInt(partes[1], 10) - 1] || partes[1];
    const dia = parseInt(partes[2], 10);
    return `${dia} de ${mes} de ${anio}`;
  }

  // Acciones invocadas desde el Shell Header
  imprimirReporte(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  exportarCSV(): void {
    const filas = this.filasConsolidadoFiltradas;
    if (!filas.length) {
      alert('No hay registros en el consolidado para exportar.');
      return;
    }

    const separador = ';';
    const csvValue = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    let cabeceras = ['Módulo', 'Segmento', 'Total', 'Activos / Entregados', 'Tarjetas emitidas / Pendientes', 'Última actualización'];
    if (this.tipoReporte === 'cards') {
      cabeceras = ['Módulo', 'Segmento', 'Total', 'Tarjetas activas', 'Tarjetas emitidas', 'Última actualización'];
    } else if (this.tipoReporte === 'notifications') {
      cabeceras = ['Módulo', 'Canal', 'Total', 'Notificaciones entregadas', 'Notificaciones pendientes', 'Última actualización'];
    }

    const lineas = [
      cabeceras.map(csvValue).join(separador),
      ...filas.map(f => [
        csvValue(f.modulo),
        csvValue(f.segmento),
        csvValue(f.total),
        csvValue(f.activos),
        csvValue(f.emitidos),
        csvValue(f.ultima_actualizacion)
      ].join(separador))
    ];

    const csvContent = '\uFEFF' + lineas.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `reporte_consolidado_${this.tipoReporte}_${fecha}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
