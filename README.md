# Judo Uruguay

App del grupo de judo: las 100 técnicas del Kodokan por cinturón, **cada una animada**, progreso personal y el dojo. Pensada primero para el teléfono (se instala en la pantalla de inicio) y también funciona en PC. Sin build ni dependencias: HTML + CSS + JS, lista para GitHub Pages.

## Secciones
- **Inicio**: técnica del día en movimiento, tu camino por cinturón, frase del día.
- **Técnicas**: las 100 con miniatura del momento clave, filtros por cinturón / proyección o suelo / estado, y buscador.
- **Detalle**: animación en loop con play/pausa, cámara lenta (1×, 0.5×, 0.25×), línea de tiempo y botones por fase (Agarre, Kuzushi, Tsukuri, Kake, Ippon). Se marca como sin empezar, en práctica o dominada.
- **Progreso**: porcentaje por cinturón, tu ficha, respaldo.
- **Dojo**: el grupo en orden alfabético, sin ranking.
- **Más**: glosario, reglas, categorías de peso, links.

## Las secuencias (storyboard)
Cada técnica se muestra como una secuencia de cuadros que se desliza con el dedo: Agarre, Kuzushi, Tsukuri, Kake, Ippon. Cada cuadro muestra la posición anterior en fantasma y flechas de movimiento (azul tori, naranja uke), como en un libro de judo.

Se dibujan por código (`js/engine.js`): dos muñecos, tori (azul) y uke (blanco). Las 68 proyecciones se ven de costado y las 32 técnicas de suelo desde arriba.

- `js/nage.js`: plantillas de proyección (con giro, siega, barrido, sacrificio, tackle, contraataque) y la tabla que asigna cada técnica a su plantilla.
- `js/katame.js`: poses finales de inmovilizaciones, estrangulaciones y luxaciones.

Son **esquemáticas**: muestran la secuencia general, no el detalle fino de cada agarre. Varias técnicas parecidas comparten plantilla. Para afinar una, se edita su entrada en `nage.js` / `katame.js`.

### Reemplazar por un GIF real
Si un GIF propio existe en `media/waza/<nombre-en-minúsculas>.gif` (ej. `media/waza/o-goshi.gif`), la app lo muestra en lugar de la animación. Usá material del grupo o con permiso.

## Alumnos
Cada uno toca **Progreso → Copiar mi ficha** y te manda el texto. Se pega en `ALUMNOS` de `js/extra.js`. El progreso personal vive en el teléfono de cada uno (localStorage).

## Publicar
Repo en GitHub, Settings → Pages → rama `main`, carpeta raíz.
