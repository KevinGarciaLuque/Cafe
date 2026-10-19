# AUREO COFFEE: prompts y plan de generación (Higgsfield)

Reglas que aplican a TODO prompt: sin texto, sin logotipos, sin letras, sin marcas reales en máquinas ni tazas. 16:9. Un solo plano continuo. Mundo común: espresso profundo, luz cálida lateral, metal cepillado, porcelana blanca, profundidad de campo corta, acentos caramelo y dorado.

## Estrategia de encadenado

```
S5 taza final (imagen)  ->  S4 grupo de espresso (imagen, usa S5 como referencia de la taza)
S1 granos (imagen) -> CLIP 1 -> ultimo fotograma (PNG) -> CLIP 2 -> ultimo fotograma (PNG) -> CLIP 3
                                                         S4 -> CLIP 4
                                                         S5 -> CLIP 5
```

- Clips 1 a 3 se encadenan con el último fotograma exacto (PNG, `-q:v 1`), subido con `media_upload` y `media_confirm`.
- Clip 3 termina en una pasada de vapor tibio con desenfoque. Clip 4 arranca de una imagen nueva (S4) con vapor en los bordes. La unión cae dentro de movimiento, no entre dos reposos.
- Clip 4 arranca de S4 y usa S5 como referencia de la taza, para que la taza de la unión 4 a 5 sea la misma.
- Clip 5 arranca de S5, la taza ya terminada con latte art (el latte art no puede formarse desde un chorro de espresso en IA).
- Cada clip pasa por su propia aprobación tuya antes de seguir.
- Unión final: concat de los crudos en una sola codificación; si una unión se nota, crossfade de 0.25 s.

## Imágenes de inicio (3)

### S5, taza final (se genera primero, es el ancla de marca)

```
Premium advertising photograph of an elegant white porcelain coffee cup with a thin refined rim and a slender handle, resting on a matching white porcelain saucer, on a dark matte stone surface. The coffee shows a crisp, high-contrast three-layer tulip latte art in warm caramel and cream, with a visible golden crema edge. Five to seven roasted coffee beans are placed on the saucer in a soft arc, deliberately arranged, with one bean resting just outside the arc. A delicate wisp of steam rises and curls, backlit. Warm key light from the left, soft rim light on the cup edge, gentle glow on the crema and a subtle sheen on the porcelain. The cup sits slightly right of center, with generous breathing room above and below the whole cup and saucer. The left third of the frame continues the same warm, softly out-of-focus brown environment edge to edge. Palette: deep espresso brown, caramel, cream, soft gold. Photorealistic, 85mm lens, shallow depth of field, 16:9. No text, no logos, no lettering anywhere.
```
Referencias: `imagenes/Latte artístico entre granos de café endli.png` como guía de estilo. Se reinterpreta, no se copia: sin madera rústica, sin saco de yute, sin plantas, latte art distinto.

### S1, granos cayendo (inicio del clip 1)

```
Hyperrealistic roasted coffee beans caught mid-fall in a vertical stream, glossy dark brown with caramel highlights, tumbling slowly with fine coffee dust hanging in the air. The stream falls through the right-center lane of the frame. The rest of the frame is one continuous warm, softly out-of-focus espresso-brown environment with a gentle gold bokeh glow on the left, edge to edge. Warm side light from the left rims each bean. Shallow depth of field, the nearest beans sharp, the far ones softly blurred. Cinematic, photorealistic, 16:9. No text, no logos, no lettering anywhere.
```

### S4, grupo de espresso (inicio del clip 4)

```
A professional espresso machine group head in brushed stainless steel with a bottomless-looking double-spout portafilter correctly locked in place, black handle angled to the left of frame. Directly beneath the spouts sits an elegant white porcelain cup, the same design as the reference cup, with its rim visible. The first warm drops of espresso are just beginning to form at the spouts. A soft veil of warm steam drifts at the edges of the frame. Warm side light from the left, deep espresso background softly out of focus edge to edge, caramel and gold reflections on the metal. Realistic machine, no logos or markings on it. Photorealistic, shallow depth of field, 16:9. No text, no logos, no lettering anywhere.
```
Referencia: S5 (la taza). Guía de encuadre: `imagenes/03_extraccion_espresso.png`.

## Clips (imagen a video, 16:9, 6 s, 1080p, sin audio)

### CLIP 1, el origen (inicio: S1)

```
One continuous shot, no cuts. Roasted coffee beans fall straight down under natural gravity through the right-center lane of the frame, tumbling slowly, while the camera descends alongside them at the same speed in a smooth vertical tracking move. The beans stay alive: slow natural tumble, glints sliding across their glossy surfaces. The scene stays alive: fine coffee dust drifting, warm light shifting softly. Near the end, the rim of a clear glass grinder hopper rises into the bottom center of the frame, lit warmly. The shot ends mid-motion with beans still falling toward the hopper. No text or lettering anywhere.
```

### CLIP 2, la molienda (inicio: último fotograma del clip 1)

```
One continuous shot, no cuts. Continue exactly the same downward motion, speed and lighting. The falling beans pour into the transparent glass hopper of a professional coffee grinder made of brushed metal and dark surfaces, landing and settling into the stack of beans while the camera slowly pushes forward toward the hopper neck. A few beans slide naturally down into the grinder throat. The beans stay alive: gentle tumbling and settling. The scene stays alive: soft dust, warm reflections moving on the glass and brushed steel. The shot ends mid-motion with beans funneling into the grinder's steel collar. No logos or markings on the machine. No text or lettering anywhere.
```

### CLIP 3, molienda y transición (inicio: último fotograma del clip 2)

```
One continuous shot, no cuts. Continue the same motion. Freshly ground coffee falls in a soft continuous stream from the grinder chute into a stainless steel portafilter basket below, building a small mound, with fine aromatic particles drifting in the warm light. The camera drops closer to show the texture of the grounds. Then a sweep of warm steam crosses the lens with a beat of soft blur, filling the frame with a warm, hazy, golden-brown glow. The shot ends inside that warm steam sweep. No text or lettering anywhere.
```

### CLIP 4, extracción y taza (inicio: S4)

```
One continuous shot, no cuts. Espresso begins to flow from the two spouts of the portafilter and merges into one warm, continuous, glossy stream of brown, golden and caramel liquid that falls vertically into the center of the white porcelain cup below. The stream lands on the surface of the coffee and creates soft ripples while golden crema forms and spreads. The camera pushes in slowly toward the cup. The coffee stays alive: gentle ripples, crema swirling. The scene stays alive: delicate steam rising and drifting, warm light glints on the metal. The shot ends at rest: the stream tapers to a few last drops, the cup is filled with espresso topped with golden crema, steam crossing the frame. The liquid never passes through any solid object. No text or lettering anywhere.
```

### CLIP 5, la experiencia final (inicio: S5)

```
One continuous shot, no cuts. A slow, subtle dolly-in toward the finished cup of coffee with tulip latte art on a white porcelain saucer with a few roasted beans arranged on it. The steam stays alive: soft wisps curl and drift upward, backlit. The scene stays alive: warm light gently shimmers across the crema and the porcelain. A slight shift of focus brings the latte art to crisp sharpness. The shot ends at rest: the cup and saucer composed slightly right of center with generous space above and below, the latte art sharp, beans still in their arc, a calm premium advertising frame. No text or lettering anywhere.
```

## Presupuesto (precios reales, consultados sin generar)

Saldo: **1000 créditos** (plan Plus).

| Concepto | Precio unidad |
|---|---|
| Imagen, GPT Image 2.5, 2k, calidad alta | 2.75 |
| Imagen, Nano Banana 2.1, 2k | 2 |
| Video Kling v3.0 pro, 6 s, sin audio | **10.5** |
| Video Kling v3.0 estándar, 6 s, sin audio | 9 |
| Video Kling v3.0 4K, 6 s, sin audio | 36 |
| Video Seedance 2.5, 1080p, 6 s, sin audio | 96 |
| Video Grok Video 1.5, 1080p, 6 s | 48 |
| Video FLUX 3 Video, 1080p, 6 s, sin audio | 48 |

### Plan recomendado: Kling v3.0 pro

| Etapa | Cantidad | Costo |
|---|---|---|
| Imágenes de inicio (3) con GPT Image 2.5 alta | 3 | 8.25 |
| Colchón de reintentos de imagen | 5 | 13.75 |
| Clips 1 a 5, Kling pro | 5 | 52.5 |
| Colchón de reintentos de video (hasta 10 más) | 10 | 105 |
| Imágenes de apoyo para las secciones (6 a 8) | 8 | 22 |
| **Tope total** | | **≈ 202** |

Se esperan unos 100 créditos si todo sale bien a la primera. Queda un mínimo de ~798 créditos.

Alternativa de mayor calidad bajo demanda: Seedance 2.5 a 96 créditos por clip. Cinco clips sin reintentos son 480 créditos. Solo la recomendaría para un clip concreto que Kling no logre tras 3 intentos (por ejemplo el de la transición), no para todo el recorrido.
