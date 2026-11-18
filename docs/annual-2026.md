# Musiclub 2026

Ruta pública: `/2026`. Estado inicial: **Próximamente** para visitantes y miembros. Los administradores autenticados ven una vista previa, con un control para comprobar la presentación pública. No hay fecha de estreno ni publicación automática.

## Recorrido visual

La edición usa una navegación propia, independiente de la barra habitual y del anuncio Grammy. El área de lectura ocupa el espacio disponible y encaja las escenas mediante desplazamiento nativo (`scroll-snap`), sin capturar eventos de rueda ni gestos. Las escenas crecen cuando el contenido o el tamaño del texto lo requieren; las secciones largas siguen siendo desplazables. Hay enlaces directos a capítulos, indicador de avance, menú móvil y pausa de movimiento. Se respeta la preferencia de movimiento reducido.

El adelanto público muestra expresamente tres portadas reales: Charli xcx, Mitski y Gorillaz. El archivo `src/data/annual2026Teaser.mjs` contiene sólo estos tres ejemplos autorizados para el adelanto; no importa el conjunto editorial protegido. Se puede cambiar de disco, sacar o guardar su vinilo y explorar los diseños de géneros. No aparecen estadísticas personales ni el resto de la selección. Cada release de la vista administrativa tiene una escena grande con su portada, vinilo, referencias y acceso a la ficha.

## Contenido y procedencia

La selección inicial incluye 16 releases de 2026 y no depende de su presencia en el catálogo. Es una selección editorial en preparación, no un ranking calculado ni un premio de Musiclub. Corte de investigación: **18 de noviembre de 2026**.

Se contrastaron el agregado anual y las valoraciones de AOTY, las selecciones de mitad de año de Rolling Stone y Billboard, conversaciones de r/indieheads de marzo, junio y noviembre, y el anuncio oficial de nominaciones de la Recording Academy del 16 de noviembre.

Referencias:

- [AOTY: crítica de 2026](https://www.albumoftheyear.org/ratings/6-highest-rated/2026/1).
- [AOTY: agregado anual provisional](https://www.albumoftheyear.org/list/summary/2026/). En la fecha de corte reunía cuatro listas. No se suma como un voto independiente junto a las listas que lo componen.
- [Rolling Stone: selección de mitad de año](https://www.rollingstone.com/music/music-lists/best-albums-of-2026-so-far-1235569912/), contrastada mediante [su índice en AOTY](https://www.albumoftheyear.org/list/2650-rolling-stones-best-albums-of-2026-so-far/) y la segunda página. El original exige acceso.
- [Billboard: selección de mitad de año](https://www.billboard.com/lists/best-albums-2026-so-far/), contrastada mediante [su índice en AOTY](https://www.albumoftheyear.org/list/2656-billboards-50-best-albums-of-2026-so-far/). No es el Billboard 200.
- [Reddit: primer trimestre](https://www.reddit.com/r/indieheads/comments/1s6gg7k/first_quarter_of_2026_your_top_5_albums_of_the/), [junio](https://www.reddit.com/r/indieheads/comments/1u7ki9q/the_best_albums_of_2026_so_far/) y [noviembre](https://www.reddit.com/r/indieheads/comments/1xtqqyl/uncut_80_best_albums_of_2026/). Las conversaciones son muestras de opinión, no votaciones representativas ni premios.
- [Nominaciones oficiales Grammy 2027](https://media.grammy.net/uploads/2026/11/2027_grammys_nominations_final.pdf). Las nominaciones no se presentan como victorias. Los releases de otros años no se añaden automáticamente a la selección de 2026 por estar nominados.

Los enlaces y el contexto de cada referencia están en `src/server/annual2026Selection.mjs`. Las tarjetas permiten consultar las referencias asociadas a cada release. Antes del estreno hay que revisar las listas anuales completas y actualizar el corte.

## Arte y portadas

La versión publicada usa las portadas oficiales verificadas por título, artista y año en Spotify, además de los vinilos, logo y tipografía Gabarito existentes en Musiclub. La composición de las fundas y los carteles se construye en el sitio. **Las pruebas de ilustración generada no forman parte del proyecto ni de la página.**

`scripts/prepare-annual-covers.mjs` consulta la fuente pública y guarda coincidencias exactas. `scripts/cache-annual-covers.mjs` conserva la URL de origen y crea las 16 copias WebP de 640 px. El runtime no consulta Spotify, AOTY o Reddit al desplazarse, filtrar o cambiar de capítulo. Los índices externos no importan ni crean registros del catálogo.

## Acceso y privacidad

`GET /api/annual/2026` llama a `authorize(request, {admin:true})` antes de consultar los datos. La autorización usa la sesión validada y la lista de administradores del servidor. La vista pública no importa ni serializa el conjunto editorial privado; sólo muestra los tres ejemplos públicos descritos arriba. Los parámetros de URL no otorgan acceso. La respuesta es `private, no-store` y varía por autorización.

El resumen personal se consulta exclusivamente para el correo y el ID verificados de la sesión, bajo las reglas RLS existentes. No acepta identificadores de otras personas. La interfaz comprueba también el ID de la respuesta para evitar mostrar datos de otra sesión. No se modificaron permisos, tablas o políticas.

## Qué cuenta Mi 2026

- Reseñas creadas durante 2026 según la hora de Ciudad de México, hasta el momento actual. Se incluyen releases de cualquier año.
- Un release por edición equivalente: se conserva la reseña más reciente para no duplicar su actividad.
- Tracks válidamente calificados, artistas de los créditos separados, géneros normalizados, promedio ponderado, favoritos resolubles, actividad por mes, días activos y mejor racha.
- XP de actividad: 50 por release, 25 por comentario de reseña y 5 por track calificado. Se etiqueta como XP de reseñas; no pretende reconstruir insignias o coronas históricas sin un registro de eventos.
- No hay minutos reproducidos, reproducciones ni comparaciones percentiles inventadas.

Las imágenes de compartir sólo se crean para el resumen propio autorizado. Hay cinco formatos y tres temas; las acciones descargan o abren el menú del dispositivo, sin publicación automática. No incluyen correos, IDs, buzón ni datos de otros miembros.

## Validación

Pruebas de límites temporales, cálculo, deduplicación, paginación y privacidad: `tests/annual-recap.test.mjs`. Navegación, respuesta real del servidor ante visitantes y miembros, vista de administrador y exportación: `tests/browser/annual.spec.mjs`.
