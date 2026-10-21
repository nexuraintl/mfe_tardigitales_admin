# Endpoint 03: Branding de Credenciales e Institucional

> **Destinatario / Consumo:** Modelos de IA (Claude / LLM), Diseñadores UI y Desarrolladores Frontend/Móvil.  
> **Propósito:** Proveer la configuración gráfica oficial de la tarjeta (colores, fondos, logos, marcas de agua) y la identidad institucional unificada (nombre y firma transparente del Director General).  
> **Componentes Frontend:** `BrandingContadoresComponent`, `BrandingSociedadesComponent`, `BrandingInstitucionalComponent`, `TarjetaCredencialComponent`.

---

## 1. Endpoints de Consulta Pública

### A. Branding de Credenciales Publicado (Por Tipo de Tarjeta)
- **Método:** `GET`
- **Ruta Oficial:** `/apig/tardigitales/admin/tarjetas/branding-credentials/info-published/{id}`
  - `id = 1`: Tarjeta Profesional de Contadores.
  - `id = 2`: Tarjeta Profesional de Sociedades de Contadores.
- **Ruta Alternativa por Query:** `/apig/tardigitales/admin/tarjetas/branding/public?tipo=contadores`

### B. Branding Institucional (Director General y Firma)
- **Método:** `GET`
- **Ruta Oficial:** `/apig/tardigitales/admin/tarjetas/branding-institucional/info-published`

---

## 2. Contrato TypeScript de Branding

```typescript
export interface BrandingConfigPublic {
  id: number;
  tipo_tarjeta: 'contadores' | 'sociedades';
  color_fondo: string;              // Color hexadecimal principal (ej: #0284c7)
  color_letra: string;              // Color hexadecimal de textos en pantalla (ej: #ffffff)
  color_letra_impresion?: string;    // Color de textos para PDF / impresión (ej: #0f172a)
  logo?: string;                    // Base64 (SVG o PNG) del logo oficial
  logo_impresion?: string;          // Base64 del logo con contraste para fondo claro
  patron?: string;                  // Base64 del patrón geométrico o textura de seguridad
  patron_impresion?: string;        // Base64 del patrón atenuado para PDF
  nombre_director?: string;         // Nombre completo del Director General
  cargo_director?: string;          // Cargo oficial (ej: 'Director General')
  firma_director?: string;          // Base64 con canal alfa transparente de la firma
}
```

---

## 3. Renderizado Visual en el Web Component / Tarjeta Virtual

El componente reutilizable `TarjetaCredencialComponent` (`tarjeta-credencial.component.ts`) utiliza estas propiedades de la siguiente manera:

1. **Fondo de la Tarjeta (`.tarjeta-canvas`):**
   - Aplica `color_fondo` como fondo base con gradiente lineal o radial.
   - Aplica el `patron` como imagen de fondo superpuesta en CSS (`background-image: url(...)`, `background-repeat: repeat`, `opacity: 0.15`).
2. **Textos y Jerarquía:**
   - Color principal configurado mediante `color_letra`.
   - Etiquetas de datos con opacidad al 75%.
3. **Firma Oficial:**
   - La `firma_director` se renderiza sobre la línea del Director General garantizando transparencia PNG sobre el fondo.

---

## 4. Directrices para Claude en Gestión de Branding

- **Separación de Responsabilidades:** No mezclar la firma del Director General con los logos propios de la entidad. La firma institucional es transversal a contadores y sociedades y se gobierna desde `BrandingInstitucionalComponent`.
- **Integridad de Cadenas Base64:** Los logos y patrones son cadenas extensas codificadas en Data URI (`data:image/svg+xml;base64,...` o `data:image/png;base64,...`). Nunca truncar ni modificar estas cadenas al persistir versiones.
- **Flujo de Versionamiento:** Todo cambio en branding crea una nueva versión en borrador (`version_actual`). Solo cuando el administrador activa "Publicar versión", esta pasa a ser `version_publicada` y se refleja en los endpoints públicos de la app.
