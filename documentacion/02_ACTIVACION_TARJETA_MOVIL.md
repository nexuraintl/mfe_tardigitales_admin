# Endpoint 02: Activación de Tarjeta Móvil (HU-JCC-014)

> **Destinatario / Consumo:** Modelos de IA (Claude / LLM), Desarrolladores Móviles (Flutter / React Native) y Frontend.  
> **Propósito:** Registrar y activar la credencial digital en el Wallet de la App Móvil del titular mediante escaneo de QR, enrolando el dispositivo y su token de notificaciones push (FCM).  
> **Servicio Backend:** `POST /apig/tardigitales/admin/tarjetas/activar-movil`

---

## 1. Especificación del Endpoint HTTP

- **Método:** `POST`
- **Ruta Oficial:** `/apig/tardigitales/admin/tarjetas/activar-movil`
- **Content-Type:** `application/json`
- **Autenticación:** Pública / Token QR del titular.

---

## 2. Contrato de Entrada (Request DTO)

```typescript
export interface ActivacionMovilRequest {
  /** Hash SHA-256 de 64 caracteres hex escaneado del QR */
  token: string;

  /** Token de registro push emitido por Firebase Cloud Messaging */
  fcm_token?: string;

  /** UUID único del hardware o instalación de la aplicación */
  device_id?: string;

  /** Sistema operativo del dispositivo: 'android' | 'ios' */
  device_os?: 'android' | 'ios';

  /** Modelo comercial del fabricante (ej: 'Xiaomi 13 Pro', 'iPhone 15') */
  device_modelo?: string;

  /** Versión semántica instalada de la App Móvil (ej: '1.0.2') */
  app_version?: string;

  /** ID del Tenant/Cliente (por defecto 20001 - JCC) */
  client_id?: number;
}
```

### Ejemplo JSON de Petición:
```json
{
  "token": "a5339002552bc8b6411b21e6383ad1dc1ec8789e9d6fc8ccd0251bbbc17074cf",
  "fcm_token": "fH9_K8s9Q4A:APA91bF8d...ejemplo_token_firebase",
  "device_id": "4b63897d-6dc8-4179-8438-fb1c86940a02",
  "device_os": "android",
  "device_modelo": "Xiaomi 13 Pro",
  "app_version": "1.0.2",
  "client_id": 20001
}
```

---

## 3. Contrato de Salida (Response DTO)

```typescript
export interface ActivacionMovilResponse {
  success: boolean;
  mensaje: string;
  data: {
    tarjeta: {
      id: number;
      tipo_tarjeta: 'contadores' | 'sociedades';
      no_tarjeta?: string;
      nit?: string;
      nombre_completo?: string;
      razon_social?: string;
      tipo_documento?: string;
      no_documento?: string;
      no_expd: string;
      universidad?: string;
      resolucion?: string;
      fecha_resolucion?: string;
      seccional?: string;
      fecha_emision: string;
      correo: string;
      estado_tarjeta: 'Activa';
      foto: string; // Base64 de la fotografía oficial
      hash_sha256: string;
    };
    branding: {
      id: number;
      tipo_tarjeta: 'contadores' | 'sociedades';
      color_fondo: string;
      color_letra: string;
      color_letra_impresion?: string;
      logo: string; // Base64 SVG o PNG
      patron: string; // Base64 de la marca de agua
      nombre_director?: string;
      firma_director?: string; // Base64 con transparencia de la firma
    };
  };
}
```

---

## 4. Efectos Secundarios en Base de Datos

Cuando la activación es procesada satisfactoriamente por el microservicio:
1. **Transición de Estado:** La credencial pasa de `'Emitida'` a `'Activa'` en `tn_tarjetavirtual_contadores` o `tn_tarjetavirtual_sociedades`.
2. **Vinculación de Dispositivo:** Se almacena el registro en `tn_tarjetavirtual_dispositivos` con el `fcm_token` y `device_id`.
3. **Auditoría e Historial:** Se inserta el evento de activación en `tn_tarjetavirtual_estados_historial`.

---

## 5. Directrices para Claude en Implementaciones Móviles

- Al procesar el escaneo en la App Móvil, extraer el valor del token sin importar si el QR entrega la URL completa (`http://.../verificar?token=XYZ`) o solo el Hash de 64 caracteres.
- Almacenar el objeto `tarjeta` y `branding` en el almacenamiento local seguro de la app (Keychain en iOS / EncryptedSharedPreferences en Android / SecureStorage en Flutter) para permitir la renderización offline de la credencial en la billetera.
