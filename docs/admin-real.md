# Administración real (Modalidad B): arquitectura recomendada

El panel de `site/admin/` (Modalidad A) edita el JSON en el navegador y no publica nada. Para que los cambios se publiquen de verdad hace falta autenticación y almacenamiento persistente.

## Recomendación: CMS basado en Git sobre el mismo JSON

- **Qué es:** Decap CMS (o Sveltia CMS) se sirve como una página más en `/admin` y edita `src/content/siteContent.json` directamente en el repositorio de GitHub. Cada "Guardar y publicar" es un commit; el hosting reconstruye y publica.
- **Autenticación:** inicio de sesión con GitHub (OAuth). Solo entran las personas con acceso de escritura al repositorio.
- **Persistencia:** el propio repositorio. Historial completo, se puede deshacer cualquier cambio.
- **Imágenes:** se suben al repositorio (`site/assets/img`) desde el panel.
- **Costo:** cero en el plan gratuito de Netlify o Cloudflare Pages más una cuenta de GitHub.
- **Por qué encaja:** el sitio ya es estático y todo el contenido ya está en un JSON. No hay base de datos que mantener ni servidor que proteger.

## Qué se aparta del stack del skill

1. **Despliegue:** el skill despliega a Hostinger con un zip. Esta arquitectura necesita un hosting con pipeline desde Git (Netlify, Cloudflare Pages o GitHub Pages con OAuth propio).
2. **Un solo `index.html` sin build:** el sitio sigue sin build. Solo se añade la carpeta `admin/` con el CMS y un `config.yml` que describe los campos del JSON.
3. **El panel actual** (`site/admin/`) se reemplazaría por el CMS, o se conservaría como editor local.

## Pasos de implantación (cuando se apruebe)

1. Crear el repositorio y subir el contenido de `site/`.
2. Conectar el repositorio a Netlify o Cloudflare Pages.
3. Añadir `admin/config.yml` con los campos de `siteContent.json` y activar el backend de GitHub.
4. Registrar la aplicación OAuth de GitHub y probar el inicio de sesión.
5. Probar un cambio de punta a punta: editar un precio, guardar, ver el commit y verificar el sitio publicado.

## Cuándo pasar a base de datos y backend propio

Solo si aparecen pedidos, usuarios, inventario o varios editores con permisos distintos. Entonces conviene Supabase (autenticación y base de datos gestionadas) con el JSON como contenido base. Hasta entonces sería complejidad sin beneficio.

## Seguridad mínima, en cualquier modalidad

- No publicar `site/admin/` sin autenticación.
- El contenido se pinta con `textContent` y los enlaces `javascript:` y `data:` se neutralizan (ya implementado en `content.js`).
- Los mensajes del formulario deben ir a un servicio con protección contra spam; el formulario ya incluye un campo trampa para bots.
