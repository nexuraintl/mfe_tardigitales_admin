import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CertificadoItem } from '../../../core/models/certificados.models';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-modal-detalle-certificado',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  templateUrl: './modal-detalle-certificado.component.html'
})
export class ModalDetalleCertificadoComponent {
  @Input() isOpen = false;
  @Input() certificado: CertificadoItem | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() descargar = new EventEmitter<CertificadoItem>();

  get isContador(): boolean {
    return this.certificado?.type === 'Contador';
  }

  get isSociedad(): boolean {
    return this.certificado?.type === 'Sociedad';
  }
}
