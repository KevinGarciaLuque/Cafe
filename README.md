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

### Modalidad B: administración real (incluida, se activa con variables)

`/admin/` pide usuario y contraseña. **Publicar** guarda un commit en GitHub con el `siteContent.json` nuevo y Railway redespliega solo (1 a 2 minutos). Las imágenes se suben desde el panel al mismo repositorio. Detalles y seguridad en [docs/admin-real.md](docs/admin-real.md).

Se activa en Railway, *Variables* (nunca en el código ni en GitHub):

| Variable | Valor |
|---|---|
| `ADMIN_USER` | el usuario (por ejemplo un correo) |
| `ADMIN_PASSWORD` | la contraseña, de 12 caracteres o más |
| `GITHUB_TOKEN` | token fino de GitHub, solo este repositorio, permiso *Contents: Read and write* |
| `GITHUB_REPO` | `usuario/repositorio` |
| `GITHUB_BRANCH` | opcional, `main` por defecto |

Para crear el token: GitHub, *Settings*, *Developer settings*, *Personal access tokens*, *Fine-grained tokens*, *Generate new token*. En *Repository access* elige *Only select repositories* y marca este repositorio. En *Repository permissions* pon *Contents* en *Read and write*. Ponle una caducidad y anótala: al vencer hay que crear otro y actualizar la variable.

Sin `ADMIN_PASSWORD`, en producción `/admin` no existe (404). Sin `GITHUB_TOKEN`, el panel deja iniciar sesión, editar y exportar, pero no publicar.

## Formulario de contacto

`contact.formEndpoint` (servicio de formularios) tiene prioridad; si está vacío y hay `contact.email`, abre el correo del visitante; si ambos están vacíos es una demostración y el propio mensaje de éxito lo dice.

## Cambiar el video

El recorrido se construyó con 5 clips encadenados (Kling v3.0 pro, desde Higgsfield) y se unió con ffmpeg. Si reemplazas el video, mantén `-g 8`:

```
ffmpeg -i nuevo.mp4 -c:v libx264 -crf 22 -preset slow -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an site/assets/video/hero-scrub.mp4
```

Actualiza `hero.media.videoBytes` (o `videoMobileBytes`): ese número se añade a la dirección del video como `?v=`, y así los navegadores no sirven la copia vieja de su caché. Revisa también los rangos de `hero.bands` (progreso de scroll de 0 a 1). Los tiempos de cada clip dentro del video están en `STAGE_STARTS` de `src/js/hero.js`.

## Comportamiento por dispositivo

- **Escritorio y tablets horizontales:** scrub con `hero-scrub.mp4` (16:9, 16 MB).
- **Teléfonos y tablets verticales:** scrub con `hero-scrub-m.mp4` (4:5, 5.7 MB). Es el mismo recorrido recortado con una ventana que sigue al sujeto en cada escena. El video va arriba y el texto debajo.
- **Imagen estática diseñada, sin descargar video:** teléfono en horizontal, movimiento reducido, ahorro de datos del navegador, y como respaldo si el video no carga en el móvil.

Las condiciones son idénticas en `main.css` y `hero.js` (`STATIC_GATES` y `MOBILE_GATES`) y se reevalúan en vivo al girar, redimensionar o cambiar la preferencia.

Para regenerar el video móvil a partir de uno nuevo, el recorte sigue una curva de posición por tiempo; ver el comando `crop=` usado en el historial del proyecto (`source/crop-expr.txt` guarda la expresión).

## Publicar en Railway

El repositorio ya está listo: `package.json` define `npm start`, que sirve `site/` con `tools/serve.mjs`, escucha en el puerto que Railway asigna (`PORT`) y responde `/health`.

1. En Railway: *New Project*, *Deploy from GitHub repo*, elegir este repositorio, rama `main`.
2. No hace falta configurar nada más. Railway detecta Node y ejecuta `npm start`.
3. En *Settings*, *Networking*, pulsar *Generate Domain* para obtener la dirección pública.
4. Cada `git push` a `main` vuelve a desplegar.

En producción `/admin` solo existe si defines `ADMIN_PASSWORD` (ver Modalidad B). Sin esa variable responde 404.

Antes de compartir la dirección, reemplaza `og:image` y `og:url` en `site/index.html` (marcados con `DEPLOY STEP`) por la dirección pública absoluta y vuelve a subir.

## Publicar en otro hosting

Comprimir el contenido de `site/` (no la carpeta): `tools/package.ps1`. Antes de publicar, reemplaza `og:image` y `og:url` en `index.html` (marcados con `DEPLOY STEP`) por la dirección pública absoluta.
