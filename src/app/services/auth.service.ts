// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private oauthService: OAuthService) {
    if (typeof window !== 'undefined') {
      (window as any).authService = this;
    }
    this.initOAuth();
  }

  private initOAuth(): void {
    const authConfig: AuthConfig = {
      issuer: environment.auth.issuer,
      clientId: environment.auth.clientId,
      redirectUri: environment.auth.redirectUri,
      responseType: environment.auth.responseType,
      scope: environment.auth.scope,
      strictDiscoveryDocumentValidation: false, // Requerido para Google OAuth2
      customQueryParams: environment.auth.customQueryParams
    };

    this.oauthService.configure(authConfig);

    // Carga la configuración de Google e intenta procesar el código de respuesta si viene del redirect
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      console.log('Sesión cargada correctamente');
    }).catch(err => {
      console.error('Error procesando login:', err);
    });

    // Mantiene la sesión viva
    this.oauthService.setupAutomaticSilentRefresh();
  }

  // Redirige al usuario a la pantalla de login de Google con PKCE oficial
  public login(): void {
    this.oauthService.initCodeFlow();
  }

  // Cierra sesión
  public logout(): void {
    this.oauthService.logOut();
  }

  // Obtiene el Access Token o ID Token actual en texto plano
  public get token(): string {
    return this.oauthService.getIdToken() || this.oauthService.getAccessToken();
  }

  // Verifica si hay una sesión válida activa
  public get isAuthenticated(): boolean {
    return this.oauthService.hasValidIdToken() || this.oauthService.hasValidAccessToken();
  }
}
