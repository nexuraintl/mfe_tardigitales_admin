import { Component, Input, Output, EventEmitter, ElementRef, OnChanges, SimpleChanges, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppError } from '../../../core/services/error-handler.service';

@Component({
  selector: 'nx-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      #alertContainer
      *ngIf="visible && (error || message)" 
      class="alert alert-dismissible fade show d-flex align-items-center gap-3 mb-4 shadow-sm" 
      [ngClass]="'alert-' + alertTypeClass"
      role="alert"
      tabindex="-1"
    >
      <div class="flex-shrink-0 d-flex align-items-center justify-content-center fs-5">
        <span *ngIf="alertTypeClass === 'danger'" class="fa fa-exclamation-triangle"></span>
        <span *ngIf="alertTypeClass === 'warning'" class="fa fa-exclamation-circle"></span>
        <span *ngIf="alertTypeClass === 'success'" class="fa fa-check-circle"></span>
        <span *ngIf="alertTypeClass === 'info'" class="fa fa-info-circle"></span>
      </div>

      <div class="flex-grow-1">
        <h6 *ngIf="displayTitle" class="alert-heading fw-bold mb-1">{{ displayTitle }}</h6>
        <div class="mb-0">{{ displayMessage }}</div>
        <div *ngIf="displaySuggestion" class="small mt-2 pt-1 border-top border-secondary border-opacity-25 opacity-75">
          {{ displaySuggestion }}
        </div>
      </div>

      <button *ngIf="dismissible" type="button" class="btn-close position-relative p-2 ms-auto me-0 my-0" (click)="close()" aria-label="Cerrar"></button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      scroll-margin-top: 180px;
    }
    .alert {
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      outline: none;
      scroll-margin-top: 180px;
    }
    .alert:focus {
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
    }
  `]
})
export class NxAlertComponent implements OnChanges, OnDestroy, AfterViewInit {
  private el = inject(ElementRef);

  @Input() type: 'danger' | 'error' | 'success' | 'warning' | 'info' = 'danger';
  @Input() title?: string;
  @Input() message?: string;
  @Input() suggestion?: string;
  @Input() error?: AppError | null = null;
  @Input() dismissible: boolean = true;
  @Input() duration: number = 0; // 0 = permanece hasta dar cerrar. > 0 = tiempo en ms
  @Input() autoScroll: boolean = true; // Auto scroll focus hacia la alerta

  @Output() onClose = new EventEmitter<void>();

  visible: boolean = true;
  private timeoutId: any = null;

  get alertTypeClass(): string {
    if (this.error) return 'danger';
    if (this.type === 'error' || this.type === 'danger') return 'danger';
    if (this.type === 'warning') return 'warning';
    if (this.type === 'success') return 'success';
    if (this.type === 'info') return 'info';
    return 'danger';
  }

  get displayTitle(): string {
    if (this.error) return this.error.title;
    return this.title || '';
  }

  get displayMessage(): string {
    if (this.error) return this.error.message;
    return this.message || '';
  }

  get displaySuggestion(): string | undefined {
    if (this.error) return this.error.suggestion;
    return this.suggestion;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] || changes['error']) {
      if (this.message || this.error) {
        this.visible = true;
        this.triggerFocusAndScroll();
        this.setupTimer();
      }
    }
    if (changes['duration']) {
      this.setupTimer();
    }
  }

  ngAfterViewInit(): void {
    if (this.visible && (this.error || this.message)) {
      this.triggerFocusAndScroll();
      this.setupTimer();
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private triggerFocusAndScroll(): void {
    if (!this.autoScroll) return;
    setTimeout(() => {
      try {
        const domEl = this.el.nativeElement;
        if (domEl) {
          // Desplazar al inicio tanto en window como en cualquier contenedor padre con scroll
          window.scrollTo({ top: 0, behavior: 'smooth' });

          let parent = domEl.parentElement;
          while (parent && parent !== document.body && parent !== document.documentElement) {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll' || parent.scrollTop > 0) {
              parent.scrollTo({ top: 0, behavior: 'smooth' });
            }
            parent = parent.parentElement;
          }

          // Posicionar con margen de seguridad para no quedar tapado por el header/options bar
          domEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

          const alertBox = domEl.querySelector('.alert') as HTMLElement;
          if (alertBox) {
            alertBox.focus({ preventScroll: true });
          }
        }
      } catch (e) {
        // En entornos sin DOM completo ignorar silenciosamente
      }
    }, 60);
  }

  private setupTimer(): void {
    this.clearTimer();
    const dur = Number(this.duration) || 0;
    if (dur > 0 && this.visible && (this.error || this.message)) {
      this.timeoutId = setTimeout(() => {
        this.close();
      }, dur);
    }
  }

  private clearTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  close(): void {
    this.clearTimer();
    this.visible = false;
    this.onClose.emit();
  }
}
