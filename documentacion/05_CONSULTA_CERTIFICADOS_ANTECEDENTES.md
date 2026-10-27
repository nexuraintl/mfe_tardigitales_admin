# Documentación Técnica: Consulta Unificada de Certificados de Vigencia y Antecedentes

## 1. Contexto y Objetivos del Módulo
Este módulo permite la visualización, auditoría y consulta unificada de los certificados oficiales expedidos tanto para **Contadores Públicos** como para **Sociedades de Contadores**.
Implementa la Historia de Usuario de consulta administrativa y se articula con el servicio REST propuesto para la integración entre **MyJCC** y la **Plataforma Nexura**.

---

## 2. Flujo de Arquitectura e Integración

```
[ MyJCC ] ── (POST /api/v1/certificados/procesar) ──► [ ms_tardigitales_admin (Backend Python) ]
                                                                   │
                                                ┌──────────────────┴──────────────────┐
                                                ▼                                     ▼
                                      Genera PDF + Firma ONAC                Persiste en MySQL
                                      (captura fecha de firma)             (tn_certificados_expedidos)
                                                                                      ▲
                                                                                      │
                                      [ mfe_tardigitales_admin (Angular) ] ───────────┘
                                      (GET /api/v1/admin/certificados)
```

---

## 3. Modelo de Base de Datos (`tn_certificados_expedidos`)

```sql
CREATE TABLE IF NOT EXISTS `tn_certificados_expedidos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT NOT NULL DEFAULT 20001,
  `n_certificado` VARCHAR(100) NOT NULL,
  `tipo` ENUM('contador', 'sociedad') NOT NULL,
  `documento` VARCHAR(50) NOT NULL,
  `nombre_titular` VARCHAR(255) NOT NULL,
  `fecha_generacion` DATE NOT NULL,
  `fecha_firma_onac` DATETIME NULL,
  `estado` VARCHAR(50) NOT NULL DEFAULT 'ACTIVO',
  `payload_detalles` JSON NULL COMMENT 'Metadata de MyJCC y arreglo de ANTECEDENTES',
  `ruta_pdf` VARCHAR(500) NULL,
  `hash_sha256` VARCHAR(64) NULL,
  `origen` VARCHAR(50) NOT NULL DEFAULT 'GENERADO',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_n_certificado` (`n_certificado`),
  INDEX `idx_cert_client_tipo` (`client_id`, `tipo`),
  INDEX `idx_cert_doc` (`documento`),
  INDEX `idx_cert_fecha` (`fecha_generacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Datos Semilla Iniciales
```sql
INSERT INTO `tn_certificados_expedidos` 
  (`client_id`, `n_certificado`, `tipo`, `documento`, `nombre_titular`, `fecha_generacion`, `fecha_firma_onac`, `estado`, `payload_detalles`, `origen`)
VALUES
(
  20001,
  '0221114451sa',
  'contador',
  '1000000000',
  'NOMBRE EJEMPLO APELLIDO UNO APELLIDO DOS',
  '2026-10-12',
  NULL,
  'ACTIVO',
  '{
    "CON_CODIGO": 100001,
    "CON_NOMBRES": "NOMBRE EJEMPLO",
    "CON_APELLIDO1": "APELLIDO UNO",
    "CON_APELLIDO2": "APELLIDO DOS",
    "TDOC_CODIGO": "CC",
    "CON_NRO_DOCUMENTO": "1000000000",
    "MUNICIPIO_DOCUMENTO": "Bogotá, D.C.",
    "DEPARTAMENTO_DOCUMENTO": "Bogotá, D.C.",
    "CON_NRO_TARJETA": "TP 441227-T",
    "CON_TIPO_TARJETA": "Primera vez",
    "ESTADO": "ACTIVO",
    "CON_FECHA_ACTUALIZACION": "2026-10-13",
    "ANTECEDENTES": [
      {
        "SAN_TIPO": "Amonestación",
        "SAN_MESES": 3,
        "SAN_RESOLUCION": "RES-0187-2024",
        "SAN_FECHA_RESOLUCION": "2024-02-15",
        "SAN_FECHA_EJECUTORIA": "2024-03-01",
        "SAN_FECHA_FIN": "2024-06-01"
      },
      {
        "SAN_TIPO": "Suspensión",
        "SAN_MESES": 6,
        "SAN_RESOLUCION": "RES-0042-2022",
        "SAN_FECHA_RESOLUCION": "2022-01-20",
        "SAN_FECHA_EJECUTORIA": "2022-02-05",
        "SAN_FECHA_FIN": "2022-08-05"
      }
    ]
  }',
  'GENERADO'
),
(
  20001,
  'CERT-EJEMPLO-0002',
  'sociedad',
  '900000000',
  'SOCIEDAD EJEMPLO S.A.S.',
  '2026-10-15',
  NULL,
  'ACTIVO',
  '{
    "SOC_RAZON_SOCIAL": "SOCIEDAD EJEMPLO S.A.S.",
    "SOC_NIT": "900000000",
    "SOC_CODIGO": 20001,
    "SOC_REPRESENTANTE_LEGAL": "MARÍA EJEMPLO REPRESENTANTE",
    "ESTADO": "ACTIVO",
    "MUNICIPIO": "Bogotá, D.C.",
    "DEPARTAMENTO": "Cundinamarca",
    "SOC_FECHA_ACTUALIZACION": "2026-10-16",
    "ANTECEDENTES": []
  }',
  'GENERADO'
)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();
```

---

## 4. Endpoints del Backend (`ms_tardigitales_admin`)

### A. Para la Interfaz Administrativa (MFE)
1. **`GET /tardigitales/admin/certificados`**
   * Parámetros: `search` (str, opcional), `tipo` (`todos` | `contador` | `sociedad`), `page` (int), `page_size` (int).
   * Respuesta: Array de certificados homologados con `tipo`, `n_certificado`, `documento`, `nombre_titular`, `fecha_generacion`, `fecha_firma`, `estado`.
2. **`GET /tardigitales/admin/certificados/{n_certificado}`**
   * Parámetros: `n_certificado` (path).
   * Respuesta: Objeto detallado incluyendo `payload_detalles` y la lista de `ANTECEDENTES`.
3. **`GET /tardigitales/admin/certificados/{n_certificado}/pdf`**
   * Respuesta: Flujo binario `application/pdf` con encabezados de descarga.

### B. Para MyJCC (Generación y Redescarga)
1. **`POST /api/v1/certificados/procesar`**
   * Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`, `Accept: application/pdf`, `X-Id-Correlacion`, `Idempotency-Key`.
   * Body:
     ```json
     {
       "Nuevo": true,
       "fechaGeneracion": "2026-10-12",
       "tipo": "contador",
       "documento": "1000000000",
       "N_CERTIFICADO": "0221114451sa",
       "historia": "5",
       "dirigido": "QUIEN INTERESE",
       "Detalles": { ... }
     }
     ```
   * Respuesta Exitosa: `200 OK` con `application/pdf`.

---

## 5. Componentes Frontend (`mfe_tardigitales_admin`)

* **Ruta Activa:** `/admin/tardigitales/certificados`
* **Vistas y Componentes:**
  * `CertificadosComponent` (`src/app/certificados/certificados.component.ts`): Búsqueda reactiva, selector de tipo, tabla con badges (`bg-primary-subtle`, `bg-info-subtle`), contador dinámico y estado vacío.
  * `ModalDetalleCertificadoComponent` (`src/app/certificados/components/modal-detalle-certificado/`): Vista de perfil, campos específicos de Contador o Sociedad, y tabla de sanciones o mensaje *«Sin antecedentes registrados»*.
  * `CertificadosService` (`src/app/core/services/certificados.service.ts`): Orquestación de peticiones frontend.
