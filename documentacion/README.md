# Documentación Técnica Frontend / MFE (Endpoints 01 a 04) - Tarjetas Digitales Admin

> **Destinatario / Consumo:** Modelos de IA (Claude / LLM), Ingenieros Frontend Angular y Desarrolladores de Aplicaciones Móviles (Flutter / React Native).  
> **Proyecto:** `mfe_tardigitales_admin` (Angular 17+ Standalone Components, Reactive Forms, Bootstrap 5).  
> **Entorno Local / Preproducción Oficial:** `http://local-jcc.nexura.com.co` (Gateway Docker).  
> **Tenant / Cliente Predeterminado:** `20001` (UAE Junta Central de Contadores - JCC).  
> **Rutas del Gateway API:** `/apig/tardigitales/admin/...`

---

## 1. Directrices de Contexto para la IA (Claude Prompting Context)

Cuando Claude u otros modelos de IA generen, refactoricen o extiendan componentes, servicios o vistas que consuman estos cuatro endpoints, deben cumplir de manera estricta las siguientes directrices:

1. **Arquitectura Angular Moderna:**
   - Usar componentes independientes (`standalone: true`).
   - Inyección de dependencias moderna mediante la función `inject(...)`.
   - Gestión de suscripciones con ciclo de vida seguro (`takeUntilDestroyed()`).
   - Tipado estricto con interfaces TypeScript sin el uso de tipos `any` injustificados.

2. **Convención Canónica de Nombres y Siglas:**
   - Prohibido reintroducir alias legacy (`solicitante`, `expediente`, `matricula`). Usar siempre los nombres del modelo canónico (`nombre_completo`, `razon_social`, `no_expd`, `no_tarjeta`, `nit`, `estado_tarjeta`).
   - Siglas y acrónimos siempre en mayúscula sostenida: `NIT`, `JCC`, `QR`, `PDF`, `CC`, `CE`, `TI`, `ID`, `SHA256`.
   - Textos de interfaz en formato tipo oración (`Sentence case`).

3. **Jerarquía de Feedback en Interfaz (UX):**
   - Errores de formulario individuales: Mostrar de forma contextual e inline bajo el control con `<nx-field-error>`.
   - Alertas de sistema / servidor: Usar `<nx-alert>` superior con compensación de scroll (`scroll-margin-top`).

4. **Consumo de Endpoints a través del Gateway:**
   - Todas las llamadas HTTP en desarrollo local se enrutan mediante `/apig/tardigitales/admin/...` usando `environment.apiGatewayUrl`.

---

## 2. Mapa de Integración de los Primeros Cuatro Endpoints

| # | Endpoint / Funcionalidad | Método HTTP | Servicio / Componente Frontend | Documentación Detallada |
|---|---|:---:|---|---|
| **01** | `/apig/tardigitales/admin/tarjetas/verificar` <br> `/apig/tardigitales/admin/tarjetas/verificar/{hash}` | `GET` | `VerificarPublicaComponent` <br> Ruta: `/admin/tardigitales/verificar` | [`01_INFORMACION_CONTADOR_SOCIEDAD.md`](./01_INFORMACION_CONTADOR_SOCIEDAD.md) |
| **02** | `/apig/tardigitales/admin/tarjetas/activar-movil` | `POST` | `TarjetasMobileService` (o Cliente Móvil) | [`02_ACTIVACION_TARJETA_MOVIL.md`](./02_ACTIVACION_TARJETA_MOVIL.md) |
| **03** | `/apig/tardigitales/admin/tarjetas/branding-credentials/info-published/{id}` <br> `/apig/tardigitales/admin/tarjetas/branding-institucional/info-published` | `GET` | `BrandingContadoresComponent`, `BrandingSociedadesComponent`, `TarjetaCredencialComponent` | [`03_BRANDING_CREDENCIALES_E_INSTITUCIONAL.md`](./03_BRANDING_CREDENCIALES_E_INSTITUCIONAL.md) |
| **04** | `/apig/tardigitales/admin/tarjetas/verificar/{hash}/pdf` <br> `/apig/tardigitales/admin/tarjetas/pdf/{id}` | `GET` | `TarjetaPdfService` (Descarga directa / Compartir nativo) | [`04_EXPORTAR_PDF_COMPARTIR_TARJETA.md`](./04_EXPORTAR_PDF_COMPARTIR_TARJETA.md) |

---

## 3. Estructura de Directorios de Documentación

```text
documentacion/
├── README.md                                  <- Índice general y directivas para IA Claude
├── 01_INFORMACION_CONTADOR_SOCIEDAD.md        <- Validación pública de credenciales y estados
├── 02_ACTIVACION_TARJETA_MOVIL.md             <- Integración App Móvil / Wallet y push tokens
├── 03_BRANDING_CREDENCIALES_E_INSTITUCIONAL.md <- Renderizado de tarjeta, estilos y firma director
└── 04_EXPORTAR_PDF_COMPARTIR_TARJETA.md       <- Descarga y visualización de credenciales PDF/A-2b
```
