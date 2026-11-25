// src/app/interceptors/auth.interceptor.ts
import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OAuthStorage } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authStorage = inject(OAuthStorage, { optional: true });

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Si la petición es externa (ej: Google Accounts para discovery o login), dejar pasar limpia sin withCredentials
    if (req.url.includes('accounts.google.com') || req.url.includes('googleapis.com')) {
      return next.handle(req);
    }

    const token = this.authStorage?.getItem('id_token')
      || this.authStorage?.getItem('access_token')
      || (typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('id_token') || sessionStorage.getItem('access_token')) : null)
      || (typeof localStorage !== 'undefined' ? (localStorage.getItem('id_token') || localStorage.getItem('access_token')) : null);
    
    const isApiRequest = req.url.startsWith(environment.apiGatewayUrl) || req.url.startsWith('/apig');

    if (isApiRequest) {
      const headers: { [key: string]: string } = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const authReq = req.clone({
        setHeaders: headers,
        withCredentials: true
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}



