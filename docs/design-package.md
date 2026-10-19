# Design Package: AUREO COFFEE

Marca inventada. El footer dice que la marca es ficticia y que las imágenes están generadas con IA.
Toda frase de este documento entra verbatim a `src/content/siteContent.json`.

## 1. Premisa de marca

**"Del origen a tu taza."** El sitio enseña un solo recorrido: grano, molienda, extracción, taza. Cada sección sirve a ese recorrido o no entra.

Investigación (resumen honesto, fuentes mixtas, varias son blogs o reseñas):
- Lo que más aleja a la gente de un café es el grano viejo, sin aroma y sin crema, y el amargor o la acidez.
- Lo que más pesa al elegir dónde tomar café es el sabor, por encima del precio.
- Las cadenas ganan en constancia; las cafeterías de especialidad ganan en origen, frescura y oficio.
- Por eso la web promete tres cosas concretas: origen elegido, molienda al momento, extracción cuidada. No promete nada que el negocio no pueda cumplir.
- Latte art y ambiente: no hallé evidencia sólida, se usan como seducción visual, no como argumento.

La llamada a la acción única es **"Descubre nuestro café"**, que lleva a la sección Nuestros cafés. El botón secundario es "Explorar el menú".

## 2. Paleta (tokens)

Tomada del propio mundo del video: tolva, metal cepillado, espresso, crema, porcelana.
Se afina con muestras reales después de aprobar el video.

```css
:root{
  --canvas:#17110E;         /* espresso oscuro, fondo de página */
  --panel:#221812;          /* tarjetas y superficies elevadas */
  --panel-2:#39251C;        /* marrón café, bordes suaves y bloques */
  --accent:#C28A55;         /* caramelo: CTA, foco, énfasis raro */
  --accent-hover:#D7AE72;   /* dorado discreto */
  --accent-muted:rgba(215,174,114,.28); /* líneas, brillos, partículas */
  --text-primary:#F5EBDD;   /* crema */
  --text-secondary:#BFAE9A; /* crema apagada, contraste > 7:1 sobre canvas */
}
```

Reglas: el caramelo es acento, no relleno. Nada de negro ni blanco puro. Un solo fondo fijo con grano sutil y un resplandor cálido que deriva en ciclos de 60 s o más.

Desviación dicha en voz alta: el skill desaconseja por defecto "casi negro con ámbar y serif de alto contraste". Aquí se mantiene porque ese es el material real del café y viene del video. Se compensa con una composición propia (ver elemento firma) y sin plantilla de cafetería.

## 3. Tipografía

- Titulares: **Cormorant Garamond** 300 y 500 (también cursiva 400 para una palabra por titular). Editorial, delgada, de lujo.
- Cuerpo: **Manrope** 400 y 500. Muy legible.
- Etiquetas pequeñas y números de escena: **DM Mono** 400.
- Solo estos pesos, con `preconnect` y `font-display: swap`.

## 4. Elemento firma

**La hebra dorada.** Una línea SVG fina que desciende por el borde de la página y se dibuja con el scroll, como el hilo de café que cae de la tolva a la taza. Junto a ella, un indicador de etapa en mono: 01 ORIGEN, 02 MOLIENDA, 03 EXTRACCIÓN, 04 TAZA, 05 EXPERIENCIA. Si se quitara, la página perdería su columna narrativa.

## 5. Storyboard (5 clips, 6 s cada uno, 16:9, sin texto en el video)

Mundo común: fondo espresso profundo, luz cálida lateral, metal cepillado, porcelana blanca, profundidad de campo corta. Cada escena nace de un fotograma de inicio propio, con el mismo grading.

| # | Escena | Movimiento de cámara y acción | Último fotograma (inicio del siguiente) | Zona de texto |
|---|---|---|---|---|
| 1 | El origen | Granos tostados caen en vertical con polvo fino y reflejos; la cámara desciende con ellos, lento | Granos en caída hacia el centro-inferior, tolva apenas visible abajo, en movimiento | Izquierda, espacio blando |
| 2 | La molienda | Los granos entran a una tolva transparente de molino profesional; cámara en leve empuje hacia adelante | Granos hundiéndose en el mecanismo, cuchillas fuera de plano, en movimiento | Derecha |
| 3 | Molienda y transición | Café molido cae del molino al portafiltro; una pasada de vapor y desenfoque cubre el cambio de plano hacia el grupo del espresso | Portafiltro ya instalado en la máquina, a punto de extraer | Izquierda |
| 4 | La extracción y la taza | Chorro continuo caramelo cae en el centro de una taza blanca; la cámara se acerca; sube vapor | Taza servida, crema visible, vapor cruzando el encuadre | Derecha |
| 5 | La experiencia final | Empuje suave sobre taza blanca, latte art, plato blanco y granos acomodados; la luz cálida resalta crema y porcelana | Reposo compuesto, margen amplio arriba y abajo, espacio libre a la izquierda para el título | Capa HTML, no en el video |

Decisiones de realismo y continuidad:
- El café solo cae al centro de la taza, nunca atraviesa objetos. El molino y la máquina son equipos distintos y se conectan con un cambio de plano motivado (vapor y desenfoque), no con una transformación.
- Las uniones caen dentro de movimiento, por la regla de continuidad de texturas: cada generación reinventa la textura fina, solo la posición se conserva.
- Riesgo conocido: el latte art no se forma por sí solo desde un chorro de espresso. Por eso el clip 5 parte de un fotograma aprobado de la taza terminada, y la unión 4 a 5 se cubre con vapor y un fundido corto de un cuarto de segundo (receta de crossfade del skill).
- Si un clip falla 3 veces, se cambia el concepto de esa escena, no el prompt.

### Escena final: propuesta visual

Taza de porcelana blanca, borde fino, asa elegante. Latte art de hojas tipo tulipán con tres capas (no el corazón de la referencia). Plato blanco con borde sutil. Entre 5 y 7 granos tostados acomodados en un arco suave sobre el plato, con alguno apoyado fuera del arco. Superficie oscura mate de piedra o madera quemada, sin saco de yute ni plantas. Luz principal cálida desde la izquierda, contraluz tenue que dibuja el vapor, reflejo suave en el borde de la taza. Taza algo a la derecha del centro, con margen amplio arriba y abajo para que el header no la corte. Foto publicitaria premium.

## 6. Mapa de bandas del hero (scroll de ~1100vh)

Rangos en progreso de scroll 0 a 1. Son puntos de partida que valida la prueba de flicks.

| Banda | Rango | Qué hace el video | Texto (verbatim) | Entrada |
|---|---|---|---|---|
| 1 | 0.00 a 0.17 | Granos caen | Título: "Todo comienza con un grano." Sub: "Seleccionamos cada origen para crear una experiencia extraordinaria." | Caída: palabras bajan desde arriba (drift-down) |
| 2 | 0.21 a 0.37 | Granos entran al molino | Título: "La precisión transforma el sabor." Sub: "Cada molienda libera una historia de aromas." | Acercamiento desde la profundidad |
| 3 | 0.41 a 0.57 | Molienda y paso al espresso | Título: "El arte está en cada gota." | Blur a nitidez, como el vapor al despejar |
| 4 | 0.61 a 0.77 | Chorro y taza | Título: "Un momento que merece disfrutarse." | Palabras suben una a una |
| 5 | 0.82 a 1.00 | Taza final en reposo | Título: "AUREO COFFEE". Sub: "El origen de tus mejores momentos." Botones: "Descubre nuestro café" y "Explorar el menú" | Ascenso por palabras, luego sub, luego botones (tres llegadas) |

Legibilidad: velo local por banda, sombra de texto de tres capas, auditoría del peor fotograma con contraste mínimo 3.5 a 1. Cada banda tiene meseta visible de 80 a 130vh.

## 7. Hero estático (móvil, tablets verticales, movimiento reducido)

Imagen final de la taza con: "AUREO COFFEE" / "El origen de tus mejores momentos." / botón "Descubre nuestro café". Cumple las 5 condiciones del skill, idénticas en CSS y JS, y se evalúan en vivo.

## 8. Esquema debajo del hero

Cada sección usa un esqueleto distinto. Todas empujan hacia "Descubre nuestro café".

1. **Nuestra historia**: filosofía de marca, tres líneas, la hebra dorada baja junto al texto.
2. **Nuestros cafés**: tarjetas con imagen, nombre, notas, precio. Los datos son de ejemplo y están marcados como editables.
3. **Nuestro proceso**: los 4 pasos con un fotograma extraído del video para cada uno.
4. **Experiencia**: galería de imágenes cinematográficas (máquinas, granos, taza).
5. **Menú**: bebidas por categoría con precios editables.
6. **Contacto**: formulario, WhatsApp, dirección, horario y redes, solo si están configurados.
7. **Preguntas frecuentes**: respondidas a partir de lo que investigamos (frescura, amargor, origen). Sin cifras ni afirmaciones que el negocio no pueda sostener.
8. **Footer**: marca, enlaces, nota "AUREO COFFEE es una marca ficticia. Las imágenes fueron generadas con IA."

Momento interactivo único, en la sección Proceso: **mantén pulsado para moler**. El progreso sube mientras se mantiene, baja suave si se suelta antes y, al completarse, se encienden en secuencia las notas del café. Con movimiento reducido aparece completo, sin necesidad de mantener.

No habrá testimonios, valoraciones ni datos comerciales inventados.

## 9. Capa vectorial

- Hebra dorada que se dibuja con el scroll.
- Divisores finos entre secciones, que se dibujan al entrar.
- Vapor SVG muy discreto junto a la taza en las secciones Historia y Menú.
- Partículas de polvo de café a nivel susurro.
- Todo respeta movimiento reducido: estados finales a la vista, sin loops.

## 10. Arquitectura y edición de contenido

```
cafe-cinematografico/
  site/                      # lo único que se publica
    index.html
    admin/index.html         # editor (modalidad A)
    assets/{video,img,fonts}
    src/{css,js}/
    src/content/siteContent.json
  source/                    # material original pesado, nunca se publica
  review/                    # clips y fotogramas para revisión, nunca se publica
  docs/                      # este paquete, storyboard, prompts
```

- **Todos los textos**, enlaces, productos, precios, redes y FAQ viven en `siteContent.json`. `index.html` los pinta desde ese archivo y los componentes no llevan texto fijo.
- **Modalidad A (demostración estática)**: `/admin` edita el JSON con vista previa en vivo y permite exportar e importar el archivo. Cambia textos, productos, precios, colores, enlaces, redes, WhatsApp y sustituye imágenes. Aviso visible: los cambios viven solo en el navegador hasta exportar el JSON; no se publican solos. No se simula una base de datos.
- **Modalidad B (administración real), recomendación**: un CMS basado en Git (Decap o Sveltia) sobre el mismo JSON, con inicio de sesión de GitHub y publicación por commit en Netlify o Cloudflare Pages. Persistente, seguro y sin servidor propio. Si más adelante hay pedidos o usuarios, se pasa a Supabase con autenticación. Esto se aparta de dos reglas del skill: el despliegue en Hostinger y "un solo `index.html` sin build". Se decide cuando el sitio esté aprobado.
- **Formulario de contacto**: sin backend, la opción segura es un servicio gratuito de formularios (Formspree o similar) o `mailto:`; se decide al llegar a esa fase y se dice con claridad a dónde llegan los mensajes.

## 11. Lista de ingeniería (de `scrub-pipeline.md`)

Video por Blob en streaming con anillo de carga, interpolación con rAF que descansa, seeks controlados, escrituras al DOM solo con cambio, bandas con velo y sombra, auditoría del peor fotograma, prueba de flicks de 120, 240 y 360 px, hero estático con 5 condiciones vivas, página completa sin video, `overflow-x: clip`, movimiento reducido en ambos sentidos, navegación por teclado, `aria-hidden` en el video, objetivos táctiles de 44 px y landmarks semánticos.

## 12. Puerta de copia

Todo texto de este documento se publica tal cual. Antes de enseñar la web: cero rayas largas, cero palabras comodín (leverage, seamless, empower, unlock, robust, actionable, data-driven, solutions) y repaso de frases de relleno de IA.
