import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { PermissionsService } from '../../core/services/permissions.service';
import { PermissionCode } from '../../core/constants/permissions.constants';

/**
 * Directiva estructural declarativa `*nxHasPermission` que oculta completamente del DOM
 * cualquier elemento cuyo permiso no esté concedido al usuario actual.
 *
 * Ejemplos de uso:
 * - Permiso único: `<button *nxHasPermission="'certDescargar'">Descargar</button>`
 * - Múltiples permisos (OR por defecto): `<div *nxHasPermission="['brandContGuardar', 'brandContPublicar']">...</div>`
 * - Múltiples permisos (AND): `<div *nxHasPermission="['perm1', 'perm2']; mode: 'all'">...</div>`
 */
@Directive({
  selector: '[nxHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private permissionsService = inject(PermissionsService);

  private requiredPermissions: PermissionCode | PermissionCode[] | null = null;
  private checkMode: 'any' | 'all' = 'any';
  private hasView = false;

  constructor() {
    effect(() => {
      // Suscripción reactiva al conjunto de permisos efectivos
      this.permissionsService.effectivePermissions();
      this.updateView();
    });
  }

  @Input()
  set nxHasPermission(value: PermissionCode | PermissionCode[] | null | undefined) {
    this.requiredPermissions = value ?? null;
    this.updateView();
  }

  @Input()
  set nxHasPermissionMode(mode: 'any' | 'all') {
    this.checkMode = mode || 'any';
    this.updateView();
  }

  private updateView(): void {
    const allowed = this.evaluatePermission();

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private evaluatePermission(): boolean {
    if (!this.requiredPermissions) {
      return true;
    }

    if (Array.isArray(this.requiredPermissions)) {
      if (this.requiredPermissions.length === 0) return true;
      return this.checkMode === 'all'
        ? this.permissionsService.hasAllPermissions(this.requiredPermissions)
        : this.permissionsService.hasAnyPermission(this.requiredPermissions);
    }

    return this.permissionsService.hasPermission(this.requiredPermissions);
  }
}
