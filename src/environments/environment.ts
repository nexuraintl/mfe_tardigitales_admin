// src/environments/environment.ts
export const environment = {
  production: false,
  // 1. URL base de tu API Gateway
  apiGatewayUrl: 'https://preproduccion9-jcc.nexura.com.co/apig',
  // 2. Configuración de OAuth2 / OIDC para Google
  auth: {
    issuer: 'https://accounts.google.com',
    clientId: '999421923761-91hrpmisr7qc7ot99s3disi6qnbk8fn9.apps.googleusercontent.com', // El ID Web de Google
    redirectUri: 'https://preproduccion9-jcc.nexura.com.co/admin/tardigitales',
    responseType: 'code',
    scope: 'openid',
    // Fuerza a Google a emitir el JWT con la audiencia esperada por el Gateway
    customQueryParams: { audience: '999421923761-91hrpmisr7qc7ot99s3disi6qnbk8fn9.apps.googleusercontent.com' }
  }
};

