import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { PermissionsService } from '../services/permissions.service';
import { PermissionCode } from '../constants/permissions.constants';

/**
 * Guard funcional de autenticación de sesión (/apig/core/auth/session) y
 * autorización granular de rutas (/apig/core/auth/permissions).
 *
 * - Si el usuario no está autenticado: redirige a `/admin`.
 * - Si la ruta exige un permiso (`data.permission` o `data.permissions`) que el usuario no posee:
 *   redirige automáticamente a la primera ruta autorizada del módulo o a `/sin-permisos`.
 */
export const authAndPermissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  return permissionsService.ensureInitialized().pipe(
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        permissionsService.redirectToAdminLogin();
        return false;
      }

      const requiredPermission = route.data?.['permission'] as PermissionCode | undefined;
      const requiredPermissions = route.data?.['permissions'] as PermissionCode[] | undefined;
      const mode = (route.data?.['permissionMode'] as 'any' | 'all') || 'any';

      let isAllowed = true;
      if (requiredPermission) {
        isAllowed = permissionsService.hasPermission(requiredPermission);
      } else if (Array.isArray(requiredPermissions) && requiredPermissions.length > 0) {
        isAllowed =
          mode === 'all'
            ? permissionsService.hasAllPermissions(requiredPermissions)
            : permissionsService.hasAnyPermission(requiredPermissions);
      }

      if (isAllowed) {
        return true;
      }

      const fallbackRoute = permissionsService.getFirstAllowedRoute();
      if (fallbackRoute) {
        return router.createUrlTree([fallbackRoute]);
      }

      return router.createUrlTree(['/sin-permisos']);
    })
  );
};
