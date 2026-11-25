# MFE Tarjetas Digitales Admin (`mfe_tardigitales_admin`)

Microfrontend Angular para el portal de administración del sistema de Tarjetas Digitales de la Junta Central de Contadores (JCC).

## Tecnologías y Herramientas

- **Framework:** Angular 22 (Standalone Components)
- **Componentes:** Angular Material, Web Components (`wc_admin_layout` / Lit)
- **Autenticación:** OAuth2 / OIDC (`angular-oauth2-oidc`)
- **Empaquetado MFE:** Custom Single-Bundle script (`build-mfe.js`)

## Comandos Principales

- `npm start`: Inicia el servidor de desarrollo local en el puerto `4300`.
- `npm run build:mfe`: Compila la aplicación y genera los bundles unificados para distribución en `dist/jcc-portal-mfe/`.
- `npm run docker:compose`: Despliega el contenedor Docker local.