import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente unificado para desplegar mensajes de error y validación
 * directamente debajo de los campos de formulario en todo el MFE.
 */
@Component({
  selector: 'nx-field-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="error" 
      class="nx-field-error d-flex align-items-center gap-1 text-danger small mt-1 animate-fade-in" 
      role="alert"
    >
      <span *ngIf="showIcon" class="fa fa-exclamation-circle flex-shrink-0" style="font-size: 11px;"></span>
      <span>{{ error }}</span>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .nx-field-error {
      font-size: 12px;
      line-height: 1.35;
      font-weight: 500;
    }
    @keyframes fadeIn {
      from { 
        opacity: 0; 
        transform: translateY(-3px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
    .animate-fade-in {
      animation: fadeIn 0.15s ease-out;
    }
  `]
})
export class NxFieldErrorComponent {
  @Input() error: string | null | undefined = '';
  @Input() showIcon: boolean = true;
}
