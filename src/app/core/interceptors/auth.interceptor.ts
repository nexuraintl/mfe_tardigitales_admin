import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, EMPTY, switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TOKEN_URL, API_BASE, AUTH_LOGIN_REDIRECT_URL, AUTH_SESSION_URL } from '../config/api.config';

let isRedirectingOn401 = false;

/**
 * Interceptor HTTP funcional que inyecta el token Bearer y habilita el envío de cookies
 * (`nexuraSID` mediante `withCredentials: true`) en peticiones al API Gateway / Microservicio.
 * Si cualquier petición recibe HTTP 401 (sesión expirada o cerrada en otra pestaña),
 * redirige inmediatamente al login de `/admin` sin mostrar banners de error ni spinners colgados.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Evitar interceptar la petición que obtiene el propio token
  if (req.url.includes(TOKEN_URL)) {
    return next(req);
  }

  // Verificar si la petición va dirigida al Gateway o Microservicio
  const isGatewayRequest = req.url.includes(API_BASE) || req.url.includes('/apig/');

  if (!isGatewayRequest) {
    return next(req);
  }

  return authService.getGatewayToken().pipe(
    switchMap(token => {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const authReq = req.clone({
        setHeaders: headers,
        withCredentials: true
      });

      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            authService.clearToken();
            // Las consultas directas a /session las gestiona PermissionsService;
            // cualquier otro 401 en el MFE implica sesión cerrada/expirada -> redirigir ya.
            if (!req.url.includes(AUTH_SESSION_URL) && typeof window !== 'undefined') {
              if (!isRedirectingOn401) {
                isRedirectingOn401 = true;
                window.location.replace(AUTH_LOGIN_REDIRECT_URL);
              }
              return EMPTY;
            }
          }
          return throwError(() => error);
        })
      );
    })
  );
};
