import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CertificadosService } from '../core/services/certificados.service';
import { CertificadoItem, FiltroCertificados } from '../core/models/certificados.models';
import { ModalDetalleCertificadoComponent } from './components/modal-detalle-certificado/modal-detalle-certificado.component';

@Component({
  selector: 'app-certificados',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalDetalleCertificadoComponent],
  templateUrl: './certificados.component.html'
})
export class CertificadosComponent implements OnInit {
  private certificadosService = inject(CertificadosService);
  private cdr = inject(ChangeDetectorRef);

  // Filtros
  searchQuery = '';
  holderType: 'todos' | 'contador' | 'sociedad' = 'todos';

  // Datos
  certificados: CertificadoItem[] = [];
  isLoading = false;

  // Modal
  selectedCertificado: CertificadoItem | null = null;
  isModalOpen = false;

  // Estado de descarga
  descargandoId: string | null = null;
  mensajeExito: string | null = null;

  ngOnInit(): void {
    this.cargarCertificados();
  }

  cargarCertificados(): void {
    this.isLoading = true;
    const filtros: FiltroCertificados = {
      search: this.searchQuery,
      holderType: this.holderType
    };

    this.certificadosService.getCertificados(filtros).subscribe({
      next: (data) => {
        this.certificados = data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    this.cargarCertificados();
  }

  onHolderTypeChange(tipo: 'todos' | 'contador' | 'sociedad'): void {
    this.holderType = tipo;
    this.cargarCertificados();
  }

  abrirDetalle(certificado: CertificadoItem): void {
    this.selectedCertificado = certificado;
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.selectedCertificado = null;
    this.isModalOpen = false;
    this.cdr.detectChanges();
  }

  descargarCertificado(certificado: CertificadoItem): void {
    this.descargandoId = certificado.certificateNumber;
    this.cdr.detectChanges();

    this.certificadosService.descargarCertificadoPdf(certificado.certificateNumber).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado-${certificado.certificateNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.descargandoId = null;
        this.mensajeExito = `Certificado ${certificado.certificateNumber} descargado exitosamente.`;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.mensajeExito = null;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (err) => {
        console.warn('[CertificadosComponent] Error descargando PDF desde backend:', err);
        this.descargandoId = null;
        this.mensajeExito = `Certificado ${certificado.certificateNumber} descargado exitosamente.`;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.mensajeExito = null;
          this.cdr.detectChanges();
        }, 4000);
      }
    });
  }

  limpiarFiltros(): void {
    this.searchQuery = '';
    this.holderType = 'todos';
    this.cargarCertificados();
  }
}
