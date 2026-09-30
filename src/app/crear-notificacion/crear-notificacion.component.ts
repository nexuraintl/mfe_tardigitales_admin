import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { ErrorHandlerService, AppError } from '../core/services/error-handler.service';
import { NxAlertComponent } from '../shared/components/alert/alert.component';

@Component({
  selector: 'app-crear-notificacion',
  standalone: true,
  imports: [CommonModule, FormsModule, NxAlertComponent],
  templateUrl: './crear-notificacion.component.html',
  styleUrl: './crear-notificacion.component.css'
})
export class CrearNotificacionComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  clientId: number = CLIENT_ID;
  currentError: AppError | null = null;
  warningMsg: string = '';

  // Form Fields
  startTime: string = '07:00';
  endTime: string = '17:00';
  maxDaily: number = 2;

  pushActive: boolean = false;
  standardActive: boolean = false;
  internalActive: boolean = false;

  notificationTitle: string = '';
  notificationMessage: string = '';
  notificationType: string = 'Informativa';
  audience: string = 'Todos';

  sendMode: 'now' | 'scheduled' = 'scheduled';
  sendDate: string = '';
  sendTime: string = '09:00';
  recurrence: string = 'No repetir';
  respectRange: boolean = true;

  loading: boolean = false;

  constructor() {
    // Establecer fecha por defecto a mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.sendDate = tomorrow.toISOString().substring(0, 10);
  }

  // Activa / desactiva tarjetas de canales
  toggleChannel(channel: 'push' | 'standard' | 'internal'): void {
    if (channel === 'push') this.pushActive = !this.pushActive;
    if (channel === 'standard') this.standardActive = !this.standardActive;
    if (channel === 'internal') this.internalActive = !this.internalActive;
  }

  // Helper para dar formato de fecha JCC (AAAA-MM-DD hh:mm a. m. / p. m.)
  formatDateTime(dateStr: string, timeStr: string): string {
    const today = new Date();
    let year = today.getFullYear();
    let month = String(today.getMonth() + 1).padStart(2, '0');
    let day = String(today.getDate()).padStart(2, '0');

    if (dateStr) {
      const parts = dateStr.split('-');
      year = parseInt(parts[0], 10);
      month = parts[1];
      day = parts[2];
    }

    let hour = 9;
    let min = 0;
    if (timeStr) {
      const parts = timeStr.split(':');
      hour = parseInt(parts[0], 10);
      min = parseInt(parts[1], 10);
    }

    const period = hour >= 12 ? 'p. m.' : 'a. m.';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const minStr = String(min).padStart(2, '0');

    return `${year}-${month}-${day} ${String(h12).padStart(2, '0')}:${minStr} ${period}`;
  }

  guardarConfiguracion(): void {
    this.warningMsg = '';
    this.currentError = null;

    if (!this.notificationTitle || !this.notificationMessage) {
      this.warningMsg = 'Por favor complete todos los campos marcados con asterisco (*).';
      return;
    }

    const canales = [];
    if (this.pushActive) canales.push('Push');
    if (this.standardActive) canales.push('Alerta estándar');
    if (this.internalActive) canales.push('Notificación interna');

    if (canales.length === 0) {
      this.warningMsg = 'Debe seleccionar al menos un canal de envío.';
      return;
    }

    this.loading = true;

    // Calcular destinatarios según la audiencia
    let destinatarios = 12458; // Todos
    if (this.audience === 'Contadores') destinatarios = 9820;
    if (this.audience === 'Sociedades') destinatarios = 640;

    // Generar la fecha de envío formateada
    let fechaEnvio = '';
    let estadoEnvio = 'Programada';

    if (this.sendMode === 'now') {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      fechaEnvio = this.formatDateTime('', timeStr);
      estadoEnvio = 'Entregada';
    } else {
      fechaEnvio = this.formatDateTime(this.sendDate, this.sendTime);
      estadoEnvio = 'Programada';
    }

    // Crear peticiones para cada canal seleccionado
    const requests = canales.map(canal => {
      const payload = {
        client_id: this.clientId,
        titulo: this.notificationTitle,
        canal: canal,
        audiencia: this.audience,
        destinatarios: destinatarios,
        fecha: fechaEnvio,
        estado: estadoEnvio,
        creadoPor: 'Administrador',
        mensaje: this.notificationMessage,
        tipo: this.notificationType,
        hora_inicio: this.startTime,
        hora_fin: this.endTime,
        max_diario: this.maxDaily,
        recurrencia: this.recurrence,
        respetar_rango: this.respectRange
      };

      return this.http.post(`${API_BASE}/notificaciones/create?client_id=${this.clientId}`, payload);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.loading = false;
        // Redirigir al historial de notificaciones
        this.router.navigate(['/historial']);
      },
      error: (err) => {
        console.error('Error al guardar notificaciones:', err);
        this.currentError = this.errorHandler.parseError(err, 'MS_3821_NOTIFICACIONES_CREATE', `${API_BASE}/notificaciones/create`);
        this.loading = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/historial']);
  }
}
