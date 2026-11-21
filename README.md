# Judo Uruguay

App del grupo de judo: las 100 técnicas del Kodokan por cinturón, cada una con su video, progreso personal, el dojo y un vocabulario. Se usa sobre todo en el teléfono (se instala en la pantalla de inicio) y en PC tiene su propio diseño. Sin build ni dependencias: HTML + CSS + JS, lista para GitHub Pages.

## Secciones
- **Inicio**: avisos del sensei, asistencia de la semana (martes y jueves) con el botón "Estuve en clase", técnica del día con su video, tu camino por cinturón, frase del día.
- **Técnicas**: filtro por cinturón y buscador. La lista se agrupa como en ManuHQ: familia (Nage-waza / Katame-waza) y grupo (Te-waza, Koshi-waza, Ashi-waza, Ma-sutemi, Yoko-sutemi, Osaekomi, Shime, Kansetsu), con el progreso de cada grupo.
- **Detalle de técnica**: video oficial del Kodokan embebido, significado, grupo, origen, y estado (sin empezar / en práctica / dominada).
- **Progreso**: porcentaje total y por cinturón, tu ficha y respaldo.
- **Dojo**: el sensei (Martin La Cruz) y los judokas en orden alfabético, con su cinturón, su progreso y cuántas clases fueron este mes. Marca quién está en el dojo hoy. Al tocar a alguien se abre su ficha.
- **Vocabulario**: contar hasta diez en japonés, saludos y frases del dojo, el árbitro, términos de técnica, reglas, categorías de peso. Con audio.

## Diseño
Estética de producto tipo SaaS: limpia, clara y con un solo color de marca, el **azul judogi**.

- **Color**: fondo gris azulado suave (`#eef1f7`), tarjetas blancas, texto azul noche (`#0c1226`), acento azul judogi (`#1f45d1`). Verde para "dominada", ámbar para "en práctica", rojo solo para lo prohibido. Los cinturones usan su color real como único toque de color en las listas.
- **Tipografía**: Plus Jakarta Sans (400 a 800), títulos en 800 con tracking cerrado. Caracteres japoneses en serif (Noto Serif JP).
- **Formas**: esquinas muy redondeadas (18 a 28 px), sombras suaves y apiladas en vez de bordes, íconos de línea de 1.8 px.
- **Componentes**: tarjetas, chips de filtro con contador, filas con número y color de cinturón, anillo de progreso, control segmentado para el estado, reproductor con póster y botón de play.
- **Móvil primero**: barra inferior flotante con el ítem activo en azul, una columna, carrusel horizontal de cinturones, el video arriba en el detalle.
- **Tablet** (700 px): grillas de dos columnas.
- **PC** (1000 px o más): barra lateral fija con la marca y el perfil abajo, contenido de hasta 1240 px, Inicio en dos columnas, la lista de técnicas en grilla de 2 a 3 columnas con hover, y el detalle en dos columnas con el video fijo a la izquierda.
- **Movimiento**: entrada suave de cada pantalla, barras de progreso animadas; se respeta "reducir movimiento".

## Cuentas (opcional)
Sin configuración, la app funciona igual y el progreso vive en cada teléfono. Para activar el inicio de sesión y ver a los demás en el Dojo se usa [Supabase](https://supabase.com) (plan gratis):

1. Crear un proyecto en Supabase.
2. En **SQL Editor**, pegar y ejecutar `supabase/schema.sql`.
3. En **Authentication → Providers → Email**, dejar activo el email. Para que registrarse sea instantáneo, desactivar "Confirm email".
4. En **Project Settings → API**, copiar **Project URL** y **anon public key** en `js/config.js`.
5. Subir los cambios. Aparece el botón **Ingresar**.

La anon key está pensada para ir en el navegador; la seguridad la dan las políticas (RLS) del SQL: todos con sesión ven los perfiles, pero cada persona solo edita el suyo y nadie puede nombrarse sensei.

Para marcar a alguien como sensei: `update public.profiles set is_sensei = true where id = '<uuid>';` en el SQL Editor. El sensei fijo de la app está en `SENSEI` de `js/extra.js`.

## Videos
Reproductor oficial embebido de YouTube con la serie del canal **KODOKAN**. No se copia ni se descarga nada: el video carga desde YouTube al tocar play. `js/videos.js` tiene el ID de cada una de las 100. Si el grupo graba un video propio, un GIF en `media/waza/<nombre-en-minúsculas>.gif` aparece arriba del oficial.

## Archivos
- `index.html`, `css/styles.css`: estructura y diseño.
- `js/app.js`: vistas, rutas y lógica.
- `js/data.js`: las 100 técnicas, cinturones y frases (el mismo de ManuHQ).
- `js/extra.js`: significados, sensei, links, categorías de peso.
- `js/vocab.js`: números, saludos y frases.
- `js/videos.js`: IDs de video.
- `js/auth.js`, `js/config.js`, `supabase/schema.sql`: cuentas.
- `sw.js`, `manifest.webmanifest`: instalable y con soporte sin señal.

## Alumnos
No se cargan a mano: cada persona que crea su cuenta aparece sola en el Dojo (la base crea su perfil al registrarse). Todos con sesión ven el cinturón y el progreso de los demás, y al tocar a alguien se abre su ficha con lo que domina y lo que está practicando. El Dojo se actualiza cada 20 segundos.

## Publicar
Repo en GitHub, Settings → Pages → rama `main`, carpeta raíz.

## Senseis
El sensei fijo en pantalla es `SENSEI` en `js/extra.js` (Martin La Cruz). Para que pueda **entrar con su cuenta sin aparecer como alumno**, agregar su email a la tabla `sensei_emails` (en el SQL Editor de Supabase):

```sql
insert into public.sensei_emails (email) values ('email-del-sensei@ejemplo.com');
```

Si se registra con ese email, su perfil queda marcado como sensei automáticamente: no figura en la lista de judokas y no se puede ascender solo. Si ya se había registrado antes:

```sql
update public.profiles set is_sensei = true
where id = (select id from auth.users where lower(email) = lower('email-del-sensei@ejemplo.com'));
```

## Qué hace el sensei
Las funciones del sensei dependen de que su perfil esté marcado como sensei (ver "Senseis" más arriba). Con eso:
- **Avisos**: publica un aviso (hasta 400 caracteres) desde Inicio; lo ve todo el dojo y solo el sensei lo borra.
- **Cinturón oficial**: desde la ficha de cada judoka fija su cinturón. Desde ese momento la persona no lo puede cambiar sola.
- **Asistencia**: cada judoka toca "Estuve en clase" (solo el día de hoy, hora de Montevideo) y el Dojo muestra quién vino hoy y cuántas clases lleva en el mes.

## Cuentas: ajustes en Supabase
En **Authentication → URL Configuration**: Site URL `https://manu-alz.github.io/Judo-Uruguay/` y la misma dirección en Redirect URLs. Hace falta para el link de recuperación de contraseña (y para el mail de confirmación si está activo).
Quien olvida su contraseña toca **Olvidé mi contraseña** en Ingresar y recibe un link para elegir una nueva.

## Base de datos
`supabase/schema.sql` es el estado actual completo (tablas, reglas de seguridad y triggers). Las reglas viven en la base: la app solo llama a la API, así que aunque alguien modifique la página no puede saltarse los permisos. Se probaron con usuarios simulados: un alumno no puede hacerse sensei, ni tocar a otros, ni publicar avisos, ni anotar la asistencia de otro o de otro día.

## Clases y asistencia
Los días de clase se definen en **dos lugares que deben coincidir**: `CLASES` de `js/extra.js` (lo que dibuja la pantalla; `dias: [2, 4]` = martes y jueves, 0 es domingo; `hora` es texto libre) y la tabla `class_days` de Supabase (lo que la base acepta: solo deja anotar asistencia esos días). Para cambiarlos: editar `CLASES` y, en el SQL Editor, `delete from public.class_days; insert into public.class_days values (1), (3);`. Con eso, Inicio muestra:
- una **tira de la semana** con los días de clase marcados, el día de hoy resaltado y una tilde en los que fuiste;
- los días de clase, la tarjeta destacada con **"Estuve en clase"**; los demás días solo dice cuándo es la próxima clase;
- el conteo del mes como **"5 de 8 clases"** (clases dadas hasta hoy), no como un número suelto.
El Dojo muestra quién vino hoy y cuántas clases lleva cada uno.

## Prueba de cinturón
La app **no sube de cinturón sola**, porque hay que dar la prueba. Calcula quién está listo:
- Para presentarse a la prueba del **próximo cinturón** hay que tener dominadas **todas las técnicas de ese cinturón y de todos los anteriores**.
- El alumno ve en Progreso cuánto le falta (incluyendo lo que debe de cinturones anteriores) y, cuando está listo, un aviso para hablar con su sensei.
- El sensei ve en Inicio quiénes están **listos para la prueba**, y en la ficha del alumno tiene el botón **"Aprobó la prueba: pasar a …"**. Al confirmar, el cinturón queda fijado como oficial.
