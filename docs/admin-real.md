# Administración real (Modalidad B)

El panel `site/admin/` tiene dos modos. El servidor decide cuál usar:

- **Local (Modalidad A):** sin variables, en tu computadora. Edita el JSON en el navegador y se exporta. No publica.
- **Con contraseña (Modalidad B):** con `ADMIN_PASSWORD`. Pide inicio de sesión y **Publicar** guarda un commit en GitHub.

## Cómo funciona

```
Navegador (panel)  --usuario y contraseña-->  tools/serve.mjs (Railway)
                   <--cookie de sesion-----
Publicar  -->  PUT /api/admin/content  -->  API de GitHub (Contents)  -->  commit en main
                                                                              |
                                                          Railway detecta el push y redespliega (1 a 2 min)
```

- El contenido se lee **desde GitHub**, no del disco del servidor, para no editar una versión vieja mientras Railway aún redespliega.
- El almacenamiento persistente es el propio repositorio: historial completo y cualquier cambio se puede deshacer con `git revert`.
- Las imágenes se suben a `site/assets/img/uploads/` y en el contenido queda solo su ruta. Se ven en la vista previa de inmediato y en el sitio tras el redespliegue.

## Variables (Railway, nunca en el código)

`ADMIN_USER`, `ADMIN_PASSWORD`, `GITHUB_TOKEN`, `GITHUB_REPO`, opcional `GITHUB_BRANCH`. Los pasos para crear el token están en el README.

## Seguridad implementada

- Contraseña y usuario comparados en tiempo constante, sin revelar cuál falló.
- Máximo 5 intentos fallidos por dirección cada 15 minutos, y 30 en total. Después responde 429.
- Cookie de sesión `HttpOnly`, `SameSite=Strict` y `Secure`; dura 8 horas. Las sesiones viven en memoria: reiniciar el servidor cierra todas.
- Todo lo que cambia algo exige la cabecera `Origin` del mismo sitio y un token CSRF por sesión.
- El servidor **valida el contenido** antes de publicar: estructura, 4 textos de hero, colores hexadecimales, límites de cantidad y tamaño, y rechaza enlaces `javascript:` y `data:`.
- Imágenes: solo JPG, PNG y WebP, hasta 3.5 MB, y se comprueba que el contenido sea realmente una imagen (no basta la extensión). Se rechaza SVG.
- El token de GitHub vive solo en el servidor y nunca llega al navegador.
- Si dos personas publican a la vez, la segunda recibe un aviso de conflicto en lugar de pisar el cambio de la primera.

## Límites que conviene conocer

- Un solo administrador (un usuario y una contraseña). No hay roles ni registro de quién cambió qué, aparte del historial de commits.
- Publicar tarda 1 a 2 minutos en verse, porque Railway redespliega.
- El token de GitHub caduca. Al vencer, **Publicar** responde un error de GitHub; se crea otro y se actualiza la variable.
- Las sesiones y el contador de intentos se pierden al reiniciar el servidor.
- Los textos de los 4 momentos del recorrido, las 5 etapas, la galería de 5 imágenes y los pasos del proceso tienen cantidad fija: la fija el video y el diseño.

## Cuándo pasar a base de datos y backend propio

Solo si aparecen pedidos, usuarios, inventario o varios editores con permisos distintos. Entonces conviene Supabase (autenticación y base de datos gestionadas) con este JSON como contenido base.
