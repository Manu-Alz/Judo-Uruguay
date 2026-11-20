# Judo Uruguay

App del grupo de judo: las 100 técnicas del Kodokan por cinturón, progreso personal y el dojo. Pensada primero para el teléfono (se puede instalar en la pantalla de inicio) y también funciona en PC. Sin build ni dependencias: HTML + CSS + JS, lista para GitHub Pages.

## Secciones
- **Inicio**: avance general, frase del día, las próximas técnicas para tu cinturón.
- **Técnicas**: las 100, filtros por cinturón / proyección o suelo / estado, buscador. Tocás una para ver el detalle (GIF o video, significado, grupo, origen) y marcarla: sin empezar, aprendiendo o dominada.
- **Progreso**: porcentaje por cinturón, tu ficha, respaldo.
- **Dojo**: el grupo por cinturón, sin ranking.
- **Más**: glosario, reglas, categorías de peso, links.

## Archivos
- `js/data.js`: técnicas, cinturones y frases (el mismo de Manu-HQ).
- `js/extra.js`: **lo que se edita**: significados, videos, alumnos, links.
- `js/app.js`, `css/styles.css`, `index.html`: la app.
- `media/waza/`: los GIFs.
- `sw.js`: lo hace funcionar sin señal. Subí `VERSION` al publicar cambios grandes.

## Cómo agregar GIFs / videos
1. **GIF**: guardalo como `media/waza/<nombre-en-minúsculas>.gif` (ej. `media/waza/o-goshi.gif`). Aparece solo.
2. **Video de YouTube**: en `js/extra.js`, `VIDEOS = { "o-goshi": "ID_DEL_VIDEO" }`.
3. Sin ninguno de los dos, la técnica ofrece un botón que busca en YouTube.

Usá material propio del grupo o con permiso; no copies GIFs de terceros.

## Cómo cargar alumnos
Cada alumno toca **Progreso → Copiar mi ficha** y te manda el texto. Lo pegás en `ALUMNOS` de `js/extra.js` y publicás. Hoy el progreso de cada uno vive en su teléfono (localStorage); el Dojo muestra lo que cargues vos.

## Publicar
Subir la carpeta a un repo de GitHub y activar Pages (rama `main`, carpeta raíz).
