import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { PermissionsService } from './core/services/permissions.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      const permissionsService = inject(PermissionsService);
      return firstValueFrom(permissionsService.ensureInitialized()).then((isAuthenticated) => {
        if (!isAuthenticated) {
          permissionsService.redirectToAdminLogin();
          // Mantener bloqueado el arranque mientras el navegador redirige a /admin
          // para que no se pinte ningún fragmento de la interfaz.
          return new Promise<void>(() => {});
        }
        return;
      });
    }),
  ],
};
