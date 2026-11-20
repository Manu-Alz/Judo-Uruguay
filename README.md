# Judo Uruguay

App del grupo de judo: las 100 técnicas del Kodokan por cinturón, cada una con su video, progreso personal y el dojo. Pensada primero para el teléfono (se instala en la pantalla de inicio) y también funciona en PC. Sin build ni dependencias: HTML + CSS + JS, lista para GitHub Pages.

## Secciones
- **Inicio**: técnica del día con su video, tu camino por cinturón, frase del día.
- **Técnicas**: las 100, con filtros por cinturón / proyección o suelo / estado y buscador. Las que tienen video llevan un ícono de play.
- **Detalle**: el video se reproduce dentro de la página, con significado, grupo, origen y botones para marcar la técnica como sin empezar, en práctica o dominada.
- **Progreso**: porcentaje por cinturón, tu ficha, respaldo.
- **Dojo**: el grupo en orden alfabético, sin ranking.
- **Más**: glosario, reglas, categorías de peso, links.

## Videos
Se usa el **reproductor oficial embebido de YouTube** con los videos del canal **KODOKAN** (la serie de las 100 técnicas). No se copia ni se descarga nada: el video se carga desde YouTube al tocar play.

`js/videos.js` guarda el ID de cada video (`"o-goshi": "yhu1mfy2vJ4"`). Hay los 100.

### Video o GIF propio del dojo
Si existe `media/waza/<nombre-en-minúsculas>.gif` (ej. `media/waza/o-goshi.gif`), se muestra arriba del video oficial.

## Alumnos
Cada uno toca **Progreso → Copiar mi ficha** y te manda el texto. Se pega en `ALUMNOS` de `js/extra.js`. El progreso personal vive en el teléfono de cada uno (localStorage).

## Publicar
Repo en GitHub, Settings → Pages → rama `main`, carpeta raíz.
