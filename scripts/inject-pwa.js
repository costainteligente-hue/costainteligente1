/**
 * inject-pwa.js
 * Inyecta los meta tags PWA (manifest, apple-touch-icon, theme-color)
 * en todos los archivos HTML generados por `expo export --platform web`
 * Se ejecuta como post-build antes de que Vercel sirva los archivos.
 */
const fs   = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

const PWA_TAGS = `
  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json" />

  <!-- iOS / Safari — icono al agregar a inicio -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Costa" />
  <link rel="apple-touch-icon" href="/assets/images/Logoapp.jpg" />
  <link rel="apple-touch-icon" sizes="120x120" href="/assets/images/Logoapp.jpg" />
  <link rel="apple-touch-icon" sizes="152x152" href="/assets/images/Logoapp.jpg" />
  <link rel="apple-touch-icon" sizes="167x167" href="/assets/images/Logoapp.jpg" />
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/Logoapp.jpg" />

  <!-- Android / Chrome -->
  <meta name="theme-color" content="#0F766E" />
  <meta name="mobile-web-app-capable" content="yes" />
  <link rel="icon" type="image/jpeg" sizes="192x192" href="/assets/images/Logoapp.jpg" />
  <link rel="icon" type="image/jpeg" sizes="512x512" href="/assets/images/Logoapp.jpg" />

  <!-- Titulo y descripcion -->
  <meta name="application-name" content="Costa Inteligente" />
  <meta name="description" content="Zonas de pesca, servicios y guias turisticas de Zihuatanejo-Ixtapa." />

  <!-- Open Graph -->
  <meta property="og:title" content="Costa Inteligente" />
  <meta property="og:description" content="Zonas de pesca, servicios y guias turisticas de Zihuatanejo-Ixtapa." />
  <meta property="og:image" content="/assets/images/Logoapp.jpg" />
  <meta property="og:type" content="website" />
`;

function injectIntoHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Ya tiene los tags? saltar
  if (html.includes('apple-mobile-web-app-capable')) return;

  // Insertar justo antes de </head>
  if (html.includes('</head>')) {
    html = html.replace('</head>', PWA_TAGS + '</head>');
  } else if (html.includes('<head>')) {
    // head vacío
    html = html.replace('<head>', '<head>' + PWA_TAGS);
  }

  // Reemplazar title vacío por título correcto
  html = html.replace(
    '<title data-rh="true"></title>',
    '<title data-rh="true">Costa Inteligente</title>',
  );

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✅ PWA tags injected:', path.relative(DIST_DIR, filePath));
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.html')) {
      injectIntoHtml(fullPath);
    }
  }
}

if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ dist/ no encontrado. Ejecuta expo export primero.');
  process.exit(1);
}

// Copiar manifest.json y Logoapp.jpg al dist si no existen
const manifestSrc = path.join(__dirname, '..', 'public', 'manifest.json');
const manifestDst = path.join(DIST_DIR, 'manifest.json');
if (fs.existsSync(manifestSrc) && !fs.existsSync(manifestDst)) {
  fs.copyFileSync(manifestSrc, manifestDst);
  console.log('✅ manifest.json copiado a dist/');
}

const logoSrc = path.join(__dirname, '..', 'assets', 'images', 'Logoapp.jpg');
const logoDstDir = path.join(DIST_DIR, 'assets', 'images');
const logoDst = path.join(logoDstDir, 'Logoapp.jpg');
if (fs.existsSync(logoSrc) && !fs.existsSync(logoDst)) {
  if (!fs.existsSync(logoDstDir)) fs.mkdirSync(logoDstDir, { recursive: true });
  fs.copyFileSync(logoSrc, logoDst);
  console.log('✅ Logoapp.jpg copiado a dist/assets/images/');
}

walkDir(DIST_DIR);
console.log('🎉 Inyección PWA completada.');
