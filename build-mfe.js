const fs = require('fs');
const path = require('path');

// Directorios origen y destino
const srcDir = path.join(__dirname, 'dist', 'jcc-portal', 'browser');
const destDir = path.join(__dirname, 'dist', 'jcc-portal-mfe');

async function buildMfe() {
  try {
    console.log('Iniciando empaquetado del Microfrontend...');

    // Verificar si el directorio origen existe
    if (!fs.existsSync(srcDir)) {
      throw new Error(`El directorio de origen no existe: ${srcDir}. ¿Ejecutaste 'ng build' antes?`);
    }

    // Crear directorio de destino si no existe
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Leer archivos del directorio de origen
    const files = fs.readdirSync(srcDir);

    // Filtrar archivos JS propios de Angular (excluyendo layout bundles, sourcemaps y licencias)
    const jsFiles = files.filter(f => 
      f.endsWith('.js') && 
      !f.endsWith('.map') && 
      !f.includes('txt') && 
      !f.startsWith('layout') && 
      !f.startsWith('nx-admin-layout')
    );
    
    // Ordenar para asegurar que polyfills vaya primero
    jsFiles.sort((a, b) => {
      if (a.includes('polyfills')) return -1;
      if (b.includes('polyfills')) return 1;
      return 0;
    });

    console.log('Archivos JS detectados para concatenar:', jsFiles);

    // Concatenar todos los archivos JS en un único archivo
    let concatenatedJs = '';
    for (const file of jsFiles) {
      const filePath = path.join(srcDir, file);
      concatenatedJs += `\n/* --- Component Bundle: ${file} --- */\n`;
      concatenatedJs += fs.readFileSync(filePath, 'utf8');
    }

    const outputJsPath = path.join(destDir, 'jcc-portal-mfe.js');
    fs.writeFileSync(outputJsPath, concatenatedJs, 'utf8');
    console.log(`¡JS unificado creado con éxito en: ${outputJsPath}!`);

    // Concatenar estilos CSS de Angular (excluyendo estilos independientes de layout)
    const cssFiles = files.filter(f => 
      f.endsWith('.css') && 
      !f.endsWith('.map') && 
      !f.startsWith('layout') && 
      !f.startsWith('nexura-theme')
    );
    console.log('Archivos CSS detectados:', cssFiles);

    let concatenatedCss = '';
    for (const file of cssFiles) {
      const filePath = path.join(srcDir, file);
      concatenatedCss += `\n/* --- Estilos: ${file} --- */\n`;
      concatenatedCss += fs.readFileSync(filePath, 'utf8');
    }

    const outputCssPath = path.join(destDir, 'jcc-portal-mfe.css');
    fs.writeFileSync(outputCssPath, concatenatedCss, 'utf8');
    console.log(`¡CSS unificado creado con éxito en: ${outputCssPath}!`);

    // Copiar favicon.ico si existe
    ['favicon.ico'].forEach(fav => {
      const favSrc = fs.existsSync(path.join(srcDir, fav)) 
        ? path.join(srcDir, fav) 
        : path.join(__dirname, 'public', fav);
      if (fs.existsSync(favSrc)) {
        fs.copyFileSync(favSrc, path.join(destDir, fav));
        console.log(`¡${fav} copiado a: ${destDir}!`);
      }
    });

    // Copiar carpeta assets si existe
    const assetsSrc = path.join(srcDir, 'assets');
    const assetsDest = path.join(destDir, 'assets');
    if (fs.existsSync(assetsSrc)) {
      fs.cpSync(assetsSrc, assetsDest, { recursive: true });
      console.log(`¡Carpeta assets copiada a: ${assetsDest}!`);
    }

    // Generar index.html para uso independiente
    const indexHtmlContent = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <title>JCC Portal</title>
    <base href="/">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <link rel="stylesheet" href="jcc-portal-mfe.css">
    <!-- Carga dinámica del Web Component Layout por CDN -->
    <script>
      (() => {
        const isPreprod = location.href.includes('https://preproduccion9-jcc.nexura.com.co');
        const cdnUrl = isPreprod
          ? 'https://preproduccion9-jcc.nexura.com.co/mod/Galeria/js/web-components/admin/v1/layout.esm.js'
          : 'http://local-cdn.nexura.com.co/web-components/admin/v1/layout.esm.js';

        const script = document.createElement('script');
        script.type = 'module';
        script.src = cdnUrl;
        document.head.appendChild(script);
      })();
    </script>
  </head>
  <body>
    <app-root></app-root>
    <script src="jcc-portal-mfe.js" type="module"></script>
  </body>
</html>`;

    const outputHtmlPath = path.join(destDir, 'index.html');
    fs.writeFileSync(outputHtmlPath, indexHtmlContent, 'utf8');
    console.log(`¡index.html creado con éxito en: ${outputHtmlPath}!`);

    console.log('Proceso de empaquetado del Microfrontend finalizado exitosamente.');
  } catch (error) {
    console.error('Error durante el build del MFE:', error);
    process.exit(1);
  }
}

buildMfe();
