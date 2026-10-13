import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, shareReplay, tap } from 'rxjs/operators';
import { TOKEN_URL } from '../config/api.config';

export interface TokenResponse {
  error: {
    code: number;
    message: string;
    detail: any[];
  };
  data?: {
    token?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  private cachedToken: string | null = null;
  private tokenExpirationTime: number | null = null;
  private tokenRequest$: Observable<string | null> | null = null;

  private readonly STORAGE_KEY = 'gcp_gateway_token';

  constructor() {
    this.restoreTokenFromStorage();
  }

  /**
   * Obtiene el token de autenticación para el Gateway.
   * Si ya existe en caché y sigue vigente, lo retorna inmediatamente.
   * Si no, solicita uno nuevo evitando múltiples llamadas simultáneas.
   */
  public getGatewayToken(): Observable<string | null> {
    if (this.isTokenValid()) {
      return of(this.cachedToken);
    }

    if (this.tokenRequest$) {
      return this.tokenRequest$;
    }

    this.tokenRequest$ = this.http.get<TokenResponse>(TOKEN_URL).pipe(
      map(response => {
        const token = response?.data?.token || null;
        if (token) {
          this.setToken(token);
          this.testRedisSession(token);
          return token;
        }
        return null;
      }),
      catchError(error => {
        console.error('[AuthService] Error al obtener token para Gateway:', error);
        this.clearToken();
        return of(null);
      }),
      tap(() => {
        this.tokenRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.tokenRequest$;
  }

  /**
   * Verifica si el token actual en memoria/almacenamiento es válido.
   */
  public isTokenValid(): boolean {
    if (!this.cachedToken || !this.tokenExpirationTime) {
      return false;
    }
    // Margen de seguridad de 60 segundos antes del vencimiento
    const now = Math.floor(Date.now() / 1000);
    return this.tokenExpirationTime - now > 60;
  }

  /**
   * Guarda el token y calcula su fecha de expiración desde el payload JWT.
   */
  private setToken(token: string): void {
    this.cachedToken = token;
    const expiration = this.extractExpirationFromJwt(token);

    // Si no se puede extraer del JWT, usar 50 minutos por defecto (~3000 segs)
    const fallbackExp = Math.floor(Date.now() / 1000) + 3000;
    this.tokenExpirationTime = expiration || fallbackExp;

    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        token: this.cachedToken,
        exp: this.tokenExpirationTime
      }));
    } catch {
      // Ignorar restricciones de sessionStorage
    }
  }

  /**
   * Limpia el token en memoria y en sessionStorage.
   */
  public clearToken(): void {
    this.cachedToken = null;
    this.tokenExpirationTime = null;
    this.tokenRequest$ = null;
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch {}
  }

  /**
   * Restaura el token guardado en sessionStorage al recargar la página.
   */
  private restoreTokenFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token && parsed?.exp) {
          const now = Math.floor(Date.now() / 1000);
          if (parsed.exp - now > 60) {
            this.cachedToken = parsed.token;
            this.tokenExpirationTime = parsed.exp;
          } else {
            sessionStorage.removeItem(this.STORAGE_KEY);
          }
        }
      }
    } catch {}
  }

  /**
   * Extrae el timestamp de expiración (exp) del JWT.
   */
  private extractExpirationFromJwt(jwt: string): number | null {
    try {
      const parts = jwt.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.exp || null;
      }
    } catch (e) {
      console.warn('[AuthService] No se pudo decodificar la expiración del JWT:', e);
    }
    return null;
  }

  /**
   * Consulta de diagnóstico para verificar el funcionamiento de la sesión en Redis.
   * Se ejecuta de forma asíncrona sin bloquear el flujo principal del MFE.
   */
  public testRedisSession(token?: string): void {
    const authToken = token || this.cachedToken;
    const testUrl = 'https://preproduccion9-jcc.nexura.com.co/apig/core/auth/redis-session-test';

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    this.http.get(testUrl, {
      headers,
      withCredentials: true
    }).subscribe({
      next: (res) => {
        console.log('[AuthService] redis-session-test respuesta exitosa:', res);
      },
      error: (err) => {
        console.warn('[AuthService] redis-session-test error:', err);
      }
    });
  }
}
