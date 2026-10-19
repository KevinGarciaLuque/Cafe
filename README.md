# AUREO COFFEE: web cinematográfica de café

Del origen a tu taza. Un hero en el que el scroll controla un video (grano, molienda, extracción, taza) y, debajo, una web completa. HTML, CSS y JavaScript sin frameworks ni build.

## Estructura

```
site/                 lo único que se publica
  index.html
  admin/              panel de contenido (Modalidad A, no se publica por defecto)
  assets/video/       hero-scrub.mp4 (29 s, 16 MB, un fotograma clave cada 8)
  assets/img/         imágenes optimizadas
  src/css/main.css
  src/js/             content.js (pinta el JSON), hero.js (scrub), main.js
  src/content/siteContent.json    TODOS los textos, enlaces, productos, precios, colores
source/               clips originales de Higgsfield y fotogramas de encadenado (nunca se publica)
review/               versiones de revisión, hojas de fotogramas (nunca se publica)
docs/                 design-package.md, higgsfield-prompts.md, admin-real.md
tools/                serve.mjs (servidor local), package.ps1 (empaquetado)
10k-websites/         skill de referencia usado en el proceso
```

## Ver la web

```
node tools/serve.mjs site 8080
```

Abre http://localhost:8080 (la web) y http://localhost:8080/admin/ (el panel). Si abres `index.html` con doble clic el navegador bloquea la carga del JSON y del video; la web debe abrirse desde un servidor o desde un hosting.

## Cambiar contenido

Todo texto vive en `site/src/content/siteContent.json`: marca, hero, productos, precios, menú, contacto, redes, FAQ, pie y colores (`theme.colors`). No hay texto fijo en el HTML ni en el CSS.

- Lo que queda vacío no se muestra: WhatsApp, dirección, horario, correo y redes están vacíos hasta que los configures.
- Los productos, precios y el menú actuales son **de ejemplo**.
- El pie declara que la marca es ficticia y que las imágenes son generadas con IA. Cámbialo cuando pongas datos y fotos reales.

### Modalidad A: panel local (incluida)

`/admin/` edita el JSON con vista previa en vivo. Permite cambiar textos, botones y enlaces, productos y precios, imágenes, colores, redes y WhatsApp, y exportar e importar el JSON.

**No publica nada.** Los cambios viven en el navegador hasta que pulses *Exportar* y reemplaces `site/src/content/siteContent.json`. No tiene inicio de sesión, por eso `tools/package.ps1` no incluye `admin/` salvo que lo pidas.

### Modalidad B: administración real (recomendada para producción)

Ver [docs/admin-real.md](docs/admin-real.md). Resumen: un CMS basado en Git sobre el mismo JSON, con inicio de sesión de GitHub y publicación por commit. Persistente y seguro, sin servidor propio.

## Formulario de contacto

`contact.formEndpoint` (servicio de formularios) tiene prioridad; si está vacío y hay `contact.email`, abre el correo del visitante; si ambos están vacíos es una demostración y el propio mensaje de éxito lo dice.

## Cambiar el video

El recorrido se construyó con 5 clips encadenados (Kling v3.0 pro, desde Higgsfield) y se unió con ffmpeg. Si reemplazas el video, mantén `-g 8`:

```
ffmpeg -i nuevo.mp4 -c:v libx264 -crf 22 -preset slow -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an site/assets/video/hero-scrub.mp4
```

Actualiza `hero.media.videoBytes` y revisa los rangos de `hero.bands` (progreso de scroll de 0 a 1). Los tiempos de cada clip dentro del video están en `STAGE_STARTS` de `src/js/hero.js`.

## Comportamiento por dispositivo

Escritorio: scrub completo. Teléfonos, tablets verticales, teléfonos en horizontal y usuarios con movimiento reducido: imagen estática diseñada, sin descargar video ni póster. Las 5 condiciones son idénticas en `main.css` y `hero.js` y se reevalúan en vivo al girar, redimensionar o cambiar la preferencia.

## Publicar en Railway

El repositorio ya está listo: `package.json` define `npm start`, que sirve `site/` con `tools/serve.mjs`, escucha en el puerto que Railway asigna (`PORT`) y responde `/health`.

1. En Railway: *New Project*, *Deploy from GitHub repo*, elegir este repositorio, rama `main`.
2. No hace falta configurar nada más. Railway detecta Node y ejecuta `npm start`.
3. En *Settings*, *Networking*, pulsar *Generate Domain* para obtener la dirección pública.
4. Cada `git push` a `main` vuelve a desplegar.

En producción el servidor **no sirve `/admin`** (no tiene inicio de sesión). Solo se habilita con la variable `ADMIN_ENABLED=1`, y no es recomendable sin proteger.

Antes de compartir la dirección, reemplaza `og:image` y `og:url` en `site/index.html` (marcados con `DEPLOY STEP`) por la dirección pública absoluta y vuelve a subir.

## Publicar en otro hosting

Comprimir el contenido de `site/` (no la carpeta): `tools/package.ps1`. Antes de publicar, reemplaza `og:image` y `og:url` en `index.html` (marcados con `DEPLOY STEP`) por la dirección pública absoluta.
