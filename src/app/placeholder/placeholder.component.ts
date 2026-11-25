import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-center py-5">
      <div class="card shadow-sm border-0 text-center p-5" style="max-width: 480px; width: 100%;">
        <ng-container *ngIf="isNoPermissions; else constructionTpl">
          <div class="display-4 text-secondary mb-3">
            <span class="fa fa-lock"></span>
          </div>
          <h4 class="fw-bold text-dark mb-2">Acceso restringido</h4>
          <p class="text-muted small mb-0">
            Su cuenta no dispone de permisos habilitados para consultar esta sección.
          </p>
        </ng-container>
        <ng-template #constructionTpl>
          <div class="display-4 text-warning mb-3">
            <span class="fa fa-wrench"></span>
          </div>
          <h4 class="fw-bold text-dark mb-2">Próximamente</h4>
          <p class="text-muted small mb-0">
            Estamos trabajando activamente en el desarrollo de esta sección para el portal de la Junta Central de Contadores.
          </p>
        </ng-template>
      </div>
    </div>
  `,
  styles: []
})
export class PlaceholderComponent {
  private route = inject(ActivatedRoute);
  isNoPermissions = this.route.snapshot.data?.['mode'] === 'sin-permisos';
}
