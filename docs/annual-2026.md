# Musiclub 2026

Ruta pública: `/2026`. Estado inicial: **Próximamente** para visitantes y miembros. Los administradores autenticados ven una vista previa, con un control para comprobar la presentación pública. No hay fecha de estreno ni publicación automática.

## Recorrido visual

La primera escena presenta veinte collages cubistas de releases incluidos en la selección. No tiene título, descripción, cifras ni franjas sobre las piezas; el título semántico sigue disponible para lectores de pantalla. Las tres bandas horizontales se mueven en sentidos alternados. Se detienen al pausar, enfocar con teclado o abrir la galería, y no se animan con movimiento reducido. La navegación sólo muestra el símbolo y controles de iconos al abrir; los capítulos y controles administrativos aparecen después de bajar.

`scripts/build-annual-art.mjs` ejecuta `build-annual-release-art.mjs`: prepara veinte composiciones vectoriales de **1200 × 1200** vinculadas por ID, título y artista a la selección. `annual-cubist-art.mjs` usa 1600 regiones de color por composición y una paleta de 128 tonos, con gradaciones de iluminación dentro de los planos. Parte de las portadas verificadas, conserva rasgos y objetos, simplifica los contornos y elimina sólo las motas aisladas. Los planos se adaptan a las siluetas; no forman una malla triangular. Los masters anteriores se conservan para comparar, pero no se cargan en la página. La referencia visual solicitada es https://www.instagram.com/p/DbGTKhPgYiK/; no se incorporan sus imágenes ni se presenta como una colaboración con su artista. Las piezas son composiciones digitales del proyecto, no dibujos manuales hechos en Canva. Los SVG, PNG y WebP están en `public/annual/2026/cubist-collage/`; el manifiesto público está en `src/data/annual2026Art.mjs`. La galería identifica el release y permite descargar el PNG cuadrado.

La edición usa una navegación propia, independiente de la barra habitual y del anuncio Grammy. El área de lectura ocupa el espacio disponible y encaja las escenas mediante desplazamiento nativo (`scroll-snap`), sin capturar eventos de rueda ni gestos. Las escenas crecen cuando el contenido o el tamaño del texto lo requieren; las secciones largas siguen siendo desplazables. Hay enlaces directos a capítulos, indicador de avance, menú móvil y pausa de movimiento. Se respeta la preferencia de movimiento reducido.

Sobre las veinte ilustraciones de la apertura aparecen dos composiciones: el año del club y un adelanto del resumen personal. Ambas usan gráficos de Musiclub, sin portadas ni releases en primer plano. Se pueden probar seis vinilos de género sin consultar datos ni modificar información. En la vista administrativa, los releases se agrupan por género normalizado y se ordenan por fecha ascendente dentro de cada grupo; las fechas incompletas conservan su precisión real. No hay pantalla introductoria de filtros.

## Contenido y procedencia

La selección inicial incluye 20 releases de 2026 y no depende de su presencia en el catálogo. Es una selección editorial en preparación, no un ranking calculado ni un premio de Musiclub. Corte de investigación: **18 de noviembre de 2026**.

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

`scripts/prepare-annual-covers.mjs` consulta la fuente pública y guarda coincidencias exactas. `scripts/cache-annual-covers.mjs` conserva la URL de origen y crea las 20 copias WebP de 640 px. El runtime no consulta Spotify, AOTY o Reddit al desplazarse, filtrar o cambiar de capítulo. Los índices externos no importan ni crean registros del catálogo.

## Acceso y privacidad

`GET /api/annual/2026` llama a `authorize(request, {admin:true})` antes de consultar los datos. La autorización usa la sesión validada y la lista de administradores del servidor. La vista pública no importa ni serializa las referencias, criterios o estadísticas de la edición privada; muestra únicamente las veinte ilustraciones y los gráficos públicos de Musiclub descritos arriba. Los parámetros de URL no otorgan acceso. La respuesta es `private, no-store` y varía por autorización.

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


### Producción y rendimiento del arte

Los archivos se preparan en el proyecto con `scripts/annual-cubist-art.mjs` y Sharp. Hay veinte piezas distintas distribuidas en tres bandas, sin duplicar un mismo release entre filas. Las vistas WebP de 640 × 640 cargan en el mural; el detalle WebP y el PNG de 1200 × 1200 se solicitan al ampliar o descargar. Canva recibe una copia de las imágenes terminadas.


### Próximamente dentro del mural

La apertura pública ocupa 330svh con un escenario sticky de 100svh. El avance del scroll actualiza una variable CSS con un listener pasivo y requestAnimationFrame, sin renders de React por fotograma ni consultas. Las dos composiciones aparecen sobre las mismas bandas animadas. Los enlaces de adelanto e inicio siguen funcionando; al salir de la apertura vuelve el ajuste por escenas. Durante el inicio, el contenido del adelanto es inerte para teclado y lectores de pantalla; al aparecer, el fondo deja de recibir foco. La pausa, la pestaña oculta y el movimiento reducido siguen deteniendo las animaciones. Los veinte títulos y artistas de las piezas son públicos; las fuentes editoriales, orden de la colección y estadísticas personales siguen protegidos por el servidor.


Los destacados del club admiten desde una reseña y priorizan hasta dieciséis álbumes de 2026. Cada nota incluye su cantidad de opiniones; una sola reseña no se presenta como consenso. Las tarjetas personales y los cinco formatos de exportación usan el logo completo, vinilos de géneros, surcos y emblemas nativos.


### Planos cuadrados y contraste

La edición V12.1.8 conserva la base de 1600 regiones y añade 576 planos de cuatro lados con intensidad adaptada al detalle local: ojos, manos y contornos retienen más de la imagen base. `annual-cubist-planes.mjs` define esta geometría. Las tres resoluciones de cada pieza comparten la composición.

Los contenedores de la edición anual declaran `data-annual-icons` según su fondo. `scripts/build-annual-icon-styles.mjs` conserva los tonos nativos y genera tintas con un mínimo de 3.5:1 sobre los fondos pastel, oscuros y degradados contemplados en `annualIconContrast.mjs`. Se regenera al cambiar la paleta nativa. Las tarjetas personales cambian de paleta al elegir tema; los controles sobre el mural tienen una base oscura estable. Los logos y vinilos de género conservan sus archivos nativos.


### Recortes irregulares

La V12.1.9 reemplaza la cuadrícula por una partición adaptada al detalle de cada portada. `annual-cubist-planes.mjs` divide cuadriláteros en direcciones y proporciones distintas, pondera su tamaño según el contraste local y añade recortes que se superponen a sus vecinos. La semilla por release mantiene el resultado reproducible sin repetir la misma geometría entre portadas. Se conservan 1600 regiones de detalle y se añaden 512 planos principales de cuatro lados.

Referencia visual revisada: https://www.instagram.com/p/DemNPZDAQ4J/?img_index=1. Se toma la idea general de planos desiguales, inclinación y superposición; no se incorporan imágenes ni recortes del post. Los colores, sujetos y objetos proceden de las portadas verificadas de cada release.


### Contornos que identifican la portada

En V12.1.10, la U del cartel de underscores se conserva con un contorno vectorial basado en la portada local. El suavizado y la agrupación por color borraban esa línea fina sobre blanco. `annual-cover-details.mjs` coloca el contorno por encima de los recortes, manteniendo visibles los planos del cartel. Los nuevos archivos `underscores-u` evitan reutilizar la edición anterior de la caché en mural, detalle y descarga. Una comprobación de contraste del contorno en los tres archivos y la navegación de la galería en celular y escritorio cubren esta regresión.
