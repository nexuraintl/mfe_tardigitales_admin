import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CertificadoItem, FiltroCertificados } from '../models/certificados.models';
import { API_BASE, CLIENT_ID } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class CertificadosService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE}/certificados`;

  /**
   * Obtiene la lista real de certificados expedidos desde el Microservicio (BD).
   */
  getCertificados(filtros?: FiltroCertificados): Observable<CertificadoItem[]> {
    let params = new HttpParams()
      .set('client_id', (CLIENT_ID || 20001).toString())
      .set('_t', Date.now().toString());

    if (filtros?.search && filtros.search.trim()) {
      params = params.set('search', filtros.search.trim());
    }
    if (filtros?.holderType && filtros.holderType !== 'todos') {
      params = params.set('tipo', filtros.holderType);
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map((res: any) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.items)) return res.items;
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.items)) return res.data.items;
        return [];
      }),
      catchError(err => {
        console.error('[CertificadosService] Error al consultar certificados desde el servidor:', err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene el detalle real de un certificado por número de certificado desde el Microservicio.
   */
  getCertificadoPorId(nCertificado: string): Observable<CertificadoItem | undefined> {
    const params = new HttpParams().set('client_id', (CLIENT_ID || 20001).toString());
    return this.http.get<any>(`${this.baseUrl}/${nCertificado}`, { params }).pipe(
      map((res: any) => {
        if (res && res.certificateNumber) return res;
        if (res && res.data && res.data.certificateNumber) return res.data;
        return undefined;
      }),
      catchError(err => {
        console.error('[CertificadosService] Error al obtener detalle desde el servidor:', err);
        return of(undefined);
      })
    );
  }

  /**
   * Descarga el flujo binario del PDF oficial del certificado generado por el backend.
   */
  descargarCertificadoPdf(nCertificado: string): Observable<Blob> {
    const params = new HttpParams().set('client_id', (CLIENT_ID || 20001).toString());
    return this.http.get(`${this.baseUrl}/${nCertificado}/pdf`, {
      params,
      responseType: 'blob'
    });
  }
}
