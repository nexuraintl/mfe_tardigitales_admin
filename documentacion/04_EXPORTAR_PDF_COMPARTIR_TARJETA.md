# Endpoint 04: Exportar PDF / Compartir Tarjeta

> **Destinatario / Consumo:** Modelos de IA (Claude / LLM), Desarrolladores Frontend Angular y Desarrolladores Móviles.  
> **Propósito:** Generar, previsualizar y descargar el documento PDF/A-2b oficial de la credencial con QR dinámico y firma digital inyectada para el flujo de "Compartir Tarjeta" en web y dispositivos móviles.  
> **Servicio Frontend:** `TarjetaPdfService` ([`tarjeta-pdf.service.ts`](file:///E:/laragon/nx/angular/mfe_tardigitales_admin/src/app/core/services/tarjeta-pdf.service.ts)).

---

## 1. Especificación del Endpoint HTTP

- **Método:** `GET`
- **Ruta Oficial por Hash (Pública):**
  ```http
  GET /apig/tardigitales/admin/tarjetas/verificar/{hash}/pdf?tipo_tarjeta=contadores&client_id=20001&download=true
  ```
- **Ruta Oficial por ID Interno (Admin):**
  ```http
  GET /apig/tardigitales/admin/tarjetas/pdf/{id}?tipo_tarjeta=contadores&client_id=20001&download=true
  ```
- **Parámetros de Consulta (Query Params):**
  - `download` (`boolean`, default: `true`): Si es `true`, envía el header `Content-Disposition: attachment; filename="tarjeta_contador_XYZ.pdf"`. Si es `false`, envía `inline` para visualización directa en visor de navegador.
  - `tipo_tarjeta` (`string`, opcional): `"contadores"` o `"sociedades"`.
  - `client_id` (`int`, opcional): Default `20001`.

- **Headers de Respuesta:**
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="tarjeta_contador_320890-T.pdf"`
  - `Cache-Control: no-cache, no-store, must-revalidate`

---

## 2. Consumo desde Angular (`TarjetaPdfService`)

En el Microfrontend, el servicio `TarjetaPdfService` abstrae la descarga descargando el flujo binario como un `Blob` de JavaScript:

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TarjetaPdfService {
  private http = inject(HttpClient);

  descargarPdfPorHash(hash: string, tipoTarjeta = 'contadores', clientId = 20001): void {
    const url = `http://local-jcc.nexura.com.co/apig/tardigitales/admin/tarjetas/verificar/${encodeURIComponent(hash)}/pdf?tipo_tarjeta=${tipoTarjeta}&client_id=${clientId}&download=true`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `tarjeta_${tipoTarjeta}_${hash.substring(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      },
      error: (err) => console.error('Error descargando PDF de tarjeta:', err)
    });
  }
}
```

---

## 3. Integración en la App Móvil para la Acción "Compartir"

En la aplicación móvil (Flutter / React Native), cuando el usuario pulsa **"Compartir tarjeta"**:

1. **Verificación de Conectividad:** Se comprueba si el dispositivo cuenta con acceso a internet.
2. **Descarga del Documento:** Se invoca el endpoint `GET /verificar/{hash}/pdf?download=true`.
3. **Apertura del Dialog Nativo de Compartir:**
   - **Flutter:** Guardar temporalmente en `getTemporaryDirectory()` y ejecutar `Share.shareXFiles([XFile(path)])`.
   - **React Native:** Usar `react-native-share` con el archivo guardado en caché.
4. **Respaldo sin Conectividad (Offline):** Si no hay internet, la app comparte la información textual y el enlace público de verificación: `http://local-jcc.nexura.com.co/admin/tardigitales/verificar?token=<HASH_SHA256>`.

---

## 4. Características del Documento PDF Generado

- **Estándar:** PDF/A-2b (ISO 19005-2) de preservación documental a largo plazo.
- **Formato:** Hoja Carta Colombia (612 x 792 pt).
- **Tipografía Oficial:** Satoshi y Satoshi Variable registradas en el motor ReportLab.
- **Seguridad:** Inyección vectorial del código QR de validación con el Hash SHA-256 de la credencial y firma del Director General sobre fondo transparente.
- **Margen Seguro:** Margen perimetral superior a 13 mm para evitar recortes en cualquier bandeja de impresión.
