import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TOKEN_URL, API_BASE } from '../config/api.config';

/**
 * Interceptor HTTP funcional que inyecta el token Bearer en peticiones al API Gateway / Microservicio.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Evitar interceptar la petición que obtiene el propio token o la prueba de sesión Redis
  if (req.url.includes(TOKEN_URL) || req.url.includes('redis-session-test')) {
    return next(req);
  }

  // Verificar si la petición va dirigida al Gateway o Microservicio
  const isGatewayRequest = req.url.includes(API_BASE) || req.url.includes('/apig/');

  if (!isGatewayRequest) {
    return next(req);
  }

  return authService.getGatewayToken().pipe(
    switchMap(token => {
      let authReq = req;

      if (token) {
        authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        });
      }

      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // Si el Gateway retorna 401 por token expirado, invalidamos la caché local
          if (error.status === 401) {
            authService.clearToken();
          }
          return throwError(() => error);
        })
      );
    })
  );
};
