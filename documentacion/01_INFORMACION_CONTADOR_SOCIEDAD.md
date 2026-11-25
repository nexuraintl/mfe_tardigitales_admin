# Endpoint 01: Información Contador / Sociedad (Verificación Pública)

> **Destinatario / Consumo:** Modelos de IA (Claude / LLM) y Desarrolladores Frontend / Móvil.  
> **Propósito:** Consulta pública y validación ciudadana de la credencial profesional mediante código QR o Hash SHA-256.  
> **Componente Frontend:** `VerificarPublicaComponent` ([`verificar-publica.component.ts`](file:///E:/laragon/nx/angular/mfe_tardigitales_admin/src/app/verificar-publica/verificar-publica.component.ts)).  
> **Rutas en Angular:** `/verificar`, `/verificar/:token`, `/admin/tardigitales/verificar`, `/admin/tardigitales/verificar/:token`.

---

## 1. Especificación del Endpoint HTTP

- **Método:** `GET`
- **Ruta Oficial:** `/apig/tardigitales/admin/tarjetas/verificar` (o `/apig/tardigitales/admin/tarjetas/verificar/{hash}`)
- **Autenticación:** Pública (No requiere token JWT de sesión administrativa).
- **Parámetros de Consulta (Query Params):**
  - `token` o `hash` (obligatorio si se usa la ruta base): Hash SHA-256 de 64 caracteres de la credencial.
  - `tipo_tarjeta` (opcional): `"contadores"` o `"sociedades"`.
  - `client_id` (opcional, default: `20001`): Identificador del Tenant/Entidad (JCC).

---

## 2. Modelos TypeScript Canónicos

```typescript
export type TipoTarjeta = 'contadores' | 'sociedades';

export type EstadoTarjeta = 'Activa' | 'Emitida' | 'Cancelada' | 'Suspendida' | 'Vencida';

export interface TarjetaVerificacionPublica {
  id: number;
  tipo_tarjeta: TipoTarjeta;
  hash_sha256: string;
  estado_tarjeta: EstadoTarjeta;
  foto?: string | null; // data:image/jpeg;base64,... o Base64 limpio
  correo?: string | null;
  no_expd: string;
  resolucion?: string | null;
  fecha_resolucion?: string | null;
  acta_jcc?: string | null;
  fecha_emision?: string | null;

  // Campos específicos de Contadores
  no_tarjeta?: string | null;
  nombres?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
  nombre_completo?: string | null;
  tipo_documento?: string | null;
  no_documento?: string | null;
  universidad?: string | null;
  seccional?: string | null;
  fecha_grado?: string | null;
  estado_contador?: string | null;

  // Campos específicos de Sociedades
  nit?: string | null;
  razon_social?: string | null;
  tipo_sociedad?: string | null;
  inscripcion?: string | null;
  representante_legal?: string | null;
  estado_sociedad?: string | null;
}
```

---

## 3. Lógica de Negocio y Estados de la Credencial

| Estado (`estado_tarjeta`) | Comportamiento en UI / App Móvil | Badge y Estilo |
|---|---|---|
| **`Activa`** | Tarjeta plenamente válida. Se visualiza la credencial completa, sello de verificación verde y botón de descarga PDF. | `.badge.bg-success-subtle.text-success` |
| **`Emitida`** | Tarjeta generada pero aún no activada por el titular en la App Móvil. Válida institucionalmente. | `.badge.bg-info-subtle.text-info` |
| **`Cancelada`** | **Atención (Fallecimiento / Cancelación definitiva):** La tarjeta carece de validez legal. La UI debe mostrar alerta roja de credencial no válida e inhabilitar acciones de descarga o compartir. | `.badge.bg-danger-subtle.text-danger` |
| **`Suspendida`** | Sanción disciplinaria vigente. La UI muestra alerta de suspensión temporal. | `.badge.bg-warning-subtle.text-warning` |

---

## 4. Consumo en Servicio Angular (`tarjetas.service.ts`)

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TarjetasVerificacionService {
  private http = inject(HttpClient);
  private apiGatewayUrl = environment.apiGatewayUrl || 'http://local-jcc.nexura.com.co/apig';

  verificarTarjetaPorHash(hash: string, clientId = 20001): Observable<TarjetaVerificacionPublica> {
    const url = `${this.apiGatewayUrl}/tardigitales/admin/tarjetas/verificar?token=${encodeURIComponent(hash)}&client_id=${clientId}`;
    return this.http.get<TarjetaVerificacionPublica>(url);
  }
}
```

---

## 5. Directrices para Claude en Tareas Relacionadas

- Si el usuario solicita modificar la vista pública (`VerificarPublicaComponent`), conservar siempre los selectores semánticos y no envolver el layout en etiquetas `<main>` duplicadas.
- Asegurar que la imagen de la foto maneje un fallback elegante en caso de valor `null` (`foto-placeholder`).
- Tratar los nombres como `nombre_completo` para contadores y `razon_social` para sociedades.
