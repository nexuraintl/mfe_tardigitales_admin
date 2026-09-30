import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE, CLIENT_ID } from '../core/config/api.config';
import { ErrorHandlerService, AppError } from '../core/services/error-handler.service';
import { NxAlertComponent } from '../shared/components/alert/alert.component';

@Component({
  selector: 'app-validador-qr',
  standalone: true,
  imports: [CommonModule, FormsModule, NxAlertComponent],
  templateUrl: './validador-qr.component.html'
})
export class ValidadorQrComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);

  clientId: number = CLIENT_ID;
  loading: boolean = false;
  mensajeExito: string = '';
  mensajeAdvertencia: string = '';
  currentError: AppError | null = null;

  // Configuración de campos
  config = {
    val_foto: true,
    val_nombres: true,
    val_matricula: true,
    val_numero_identificacion: false,
    val_codigo_tarjeta: true,
    val_estado: true
  };

  get hasSelectedFields(): boolean {
    return Boolean(
      this.config.val_foto ||
      this.config.val_nombres ||
      this.config.val_matricula ||
      this.config.val_numero_identificacion ||
      this.config.val_codigo_tarjeta ||
      this.config.val_estado
    );
  }

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  cargarConfiguracion(): void {
    this.loading = true;
    this.currentError = null;
    this.mensajeExito = '';
    this.mensajeAdvertencia = '';

    this.http.get<any>(`${API_BASE}/tarjetas/validador-qr/get-config?client_id=${this.clientId}`)
      .subscribe({
        next: (data) => {
          if (data) {
            this.config = { ...this.config, ...data };
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar configuración del validador QR:', err);
          this.currentError = this.errorHandler.parseError(err, 'MS_3850_VALIDADOR_CONFIG', `${API_BASE}/tarjetas/validador-qr/get-config`);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  guardarConfiguracion(): void {
    this.mensajeExito = '';
    this.mensajeAdvertencia = '';
    this.currentError = null;

    if (!this.hasSelectedFields) {
      this.mensajeAdvertencia = 'Debe seleccionar al menos un campo visible para guardar la configuración del validador público.';
      return;
    }

    this.loading = true;

    const payload = {
      client_id: this.clientId,
      val_foto: this.config.val_foto ? 1 : 0,
      val_nombres: this.config.val_nombres ? 1 : 0,
      val_matricula: this.config.val_matricula ? 1 : 0,
      val_numero_identificacion: this.config.val_numero_identificacion ? 1 : 0,
      val_codigo_tarjeta: this.config.val_codigo_tarjeta ? 1 : 0,
      val_estado: this.config.val_estado ? 1 : 0
    };

    this.http.post(`${API_BASE}/tarjetas/validador-qr/update-config?client_id=${this.clientId}`, payload)
      .subscribe({
        next: (res: any) => {
          this.mensajeExito = 'Configuración del validador guardada correctamente.';
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al guardar config de validador:', err);
          this.currentError = this.errorHandler.parseError(err, 'MS_3851_VALIDADOR_SAVE', `${API_BASE}/tarjetas/validador-qr/update-config`);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  volver(): void {
    this.router.navigate(['/contadores']);
  }
}
