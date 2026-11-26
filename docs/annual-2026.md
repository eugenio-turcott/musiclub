# Musiclub 2026

Ruta pública: `/2026`. Estado inicial: **Próximamente** para visitantes y miembros. Los administradores autenticados ven una vista previa, con un control para comprobar la presentación pública. La apertura automática está fijada para el **28 de diciembre de 2026, 12:00 p. m. de Ciudad de México** (`2026-12-28T18:00:00Z`). Hasta ese instante, los datos completos exigen autorización administrativa.

## Recorrido visual

La primera escena presenta veinte collages cubistas de releases incluidos en la selección. No tiene título, descripción, cifras ni franjas sobre las piezas; el título semántico sigue disponible para lectores de pantalla. Las tres bandas horizontales se mueven en sentidos alternados. Se detienen al pausar, enfocar con teclado o abrir la galería, y no se animan con movimiento reducido. La navegación sólo muestra el símbolo y controles de iconos al abrir; los capítulos y controles administrativos aparecen después de bajar.

`scripts/build-annual-art.mjs` ejecuta `build-annual-academy-art.mjs`: prepara veinte composiciones vectoriales de **1200 × 1200** vinculadas por ID, título y artista a la selección. `annual-cubist-art.mjs` usa 1600 regiones de color por composición y una paleta de 128 tonos, con gradaciones de iluminación dentro de los planos. Parte de las portadas verificadas, conserva rasgos y objetos, simplifica los contornos y elimina sólo las motas aisladas. Los planos se adaptan a las siluetas; no forman una malla triangular. Los masters anteriores se conservan para comparar, pero no se cargan en la página. La referencia visual solicitada es https://www.instagram.com/p/DbGTKhPgYiK/; no se incorporan sus imágenes ni se presenta como una colaboración con su artista. Las piezas son composiciones digitales del proyecto, no dibujos manuales hechos en Canva. Los SVG, PNG y WebP actuales están en `public/annual/2026/cubist-grammys/`; el manifiesto público está en `src/data/annual2026Art.mjs`. La galería identifica el release y permite descargar el PNG cuadrado.

La edición usa una navegación propia, independiente de la barra habitual y del anuncio Grammy. El área de lectura ocupa el espacio disponible y encaja las escenas mediante desplazamiento nativo (`scroll-snap`), sin capturar eventos de rueda ni gestos. Las escenas crecen cuando el contenido o el tamaño del texto lo requieren; las secciones largas siguen siendo desplazables. Hay enlaces directos a capítulos, indicador de avance, menú móvil y pausa de movimiento. Se respeta la preferencia de movimiento reducido.

Sobre las veinte ilustraciones de la apertura aparecen dos composiciones: el año del club y un adelanto del resumen personal. Ambas usan gráficos de Musiclub, sin portadas ni releases en primer plano. Se pueden probar seis vinilos de género sin consultar datos ni modificar información. En la vista administrativa, el ranking del club abre la edición y avanza horizontalmente del puesto 20 al 1 al bajar. Conserva el género y la fecha de cada release, con la precisión real de los datos. No hay pantalla introductoria de filtros.

## Contenido y procedencia

El mural actual reúne los ocho proyectos nominados a Álbum del Año de Grammy 2027 y doce proyectos de otras categorías relevantes, usando el álbum completo como referencia. El manifiesto y procedencia están en `src/server/annual2026Academy.json`. La selección artística no es un ranking ni representa premios ganados. Desde V12.2.0, no representa el ranking principal: éste se calcula con las reseñas de Musiclub. El panorama global usa un corte separado de AOTY del **19 de noviembre de 2026**. La investigación editorial inicial tuvo corte el 18 de noviembre.

Se contrastaron el agregado anual y las valoraciones de AOTY, las selecciones de mitad de año de Rolling Stone y Billboard, conversaciones de r/indieheads de marzo, junio y noviembre, y el anuncio oficial de nominaciones de la Recording Academy del 16 de noviembre.

Referencias:

- [AOTY: crítica de 2026](https://www.albumoftheyear.org/ratings/6-highest-rated/2026/1).
- [AOTY: agregado anual provisional](https://www.albumoftheyear.org/list/summary/2026/). En la fecha de corte reunía cuatro listas. No se suma como un voto independiente junto a las listas que lo componen.
- [Rolling Stone: selección de mitad de año](https://www.rollingstone.com/music/music-lists/best-albums-of-2026-so-far-1235569912/), contrastada mediante [su índice en AOTY](https://www.albumoftheyear.org/list/2650-rolling-stones-best-albums-of-2026-so-far/) y la segunda página. El original exige acceso.
- [Billboard: selección de mitad de año](https://www.billboard.com/lists/best-albums-2026-so-far/), contrastada mediante [su índice en AOTY](https://www.albumoftheyear.org/list/2656-billboards-50-best-albums-of-2026-so-far/). No es el Billboard 200.
- [Reddit: primer trimestre](https://www.reddit.com/r/indieheads/comments/1s6gg7k/first_quarter_of_2026_your_top_5_albums_of_the/), [junio](https://www.reddit.com/r/indieheads/comments/1u7ki9q/the_best_albums_of_2026_so_far/) y [noviembre](https://www.reddit.com/r/indieheads/comments/1xtqqyl/uncut_80_best_albums_of_2026/). Las conversaciones son muestras de opinión, no votaciones representativas ni premios.
- [Nominaciones oficiales Grammy 2027](https://media.grammy.net/uploads/2026/11/2027_grammys_nominations_final.pdf). Las nominaciones no se presentan como victorias. La colección artística puede incluir proyectos de 2025 elegibles para Grammy 2027. El ranking del club conserva exclusivamente álbumes publicados en 2026.

Los enlaces y el contexto de cada referencia están en `src/server/annual2026Selection.mjs`. Las referencias se conservan sólo para revisión interna; no se muestran en la interfaz ni se envían como parte de la selección. Antes del estreno hay que revisar las listas anuales completas y actualizar el corte.

## Arte y portadas

La versión publicada usa las portadas oficiales verificadas por título, artista y año en Spotify, además de los vinilos, logo y tipografía Gabarito existentes en Musiclub. La composición de las fundas y los carteles se construye en el sitio. **Las pruebas de ilustración generada no forman parte del proyecto ni de la página.**

`scripts/prepare-annual-covers.mjs` consulta la fuente pública y guarda coincidencias exactas. `scripts/cache-annual-covers.mjs` conserva la URL de origen y crea las 20 copias WebP de 640 px. El runtime no consulta Spotify, AOTY o Reddit al desplazarse, filtrar o cambiar de capítulo. Los índices externos no importan ni crean registros del catálogo.

## Acceso y privacidad

`GET /api/annual/2026` usa `annualAccess`: antes del estreno llama a `authorize` con `admin:true`. Después del estreno los visitantes reciben sólo el resumen público, mientras que cada sesión autenticada obtiene exclusivamente su resumen personal. La autorización usa la sesión validada y la lista de administradores del servidor. La vista pública no importa ni serializa las referencias, criterios o estadísticas de la edición privada; muestra únicamente las veinte ilustraciones y los gráficos públicos de Musiclub descritos arriba. Los parámetros de URL no otorgan acceso. La respuesta es `private, no-store` y varía por autorización.

El resumen personal se consulta exclusivamente para el correo y el ID verificados de la sesión, bajo las reglas RLS existentes. No acepta identificadores de otras personas. La interfaz comprueba también el ID de la respuesta para evitar mostrar datos de otra sesión. Los avisos usan las políticas privadas descritas abajo.

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


El ranking del club admite desde una reseña y muestra hasta veinte releases de 2026. Cada nota incluye su cantidad de opiniones; una sola reseña no se presenta como consenso. Las tarjetas personales y los cinco formatos de exportación usan el logo completo, vinilos de géneros, surcos y emblemas nativos.


### Planos cuadrados y contraste

La edición V12.1.8 conserva la base de 1600 regiones y añade 576 planos de cuatro lados con intensidad adaptada al detalle local: ojos, manos y contornos retienen más de la imagen base. `annual-cubist-planes.mjs` define esta geometría. Las tres resoluciones de cada pieza comparten la composición.

Los contenedores de la edición anual declaran `data-annual-icons` según su fondo. `scripts/build-annual-icon-styles.mjs` conserva los tonos nativos y genera tintas con un mínimo de 3.5:1 sobre los fondos pastel, oscuros y degradados contemplados en `annualIconContrast.mjs`. Se regenera al cambiar la paleta nativa. Las tarjetas personales cambian de paleta al elegir tema; los controles sobre el mural tienen una base oscura estable. Los logos y vinilos de género conservan sus archivos nativos.


### Recortes irregulares

La V12.1.9 reemplaza la cuadrícula por una partición adaptada al detalle de cada portada. `annual-cubist-planes.mjs` divide cuadriláteros en direcciones y proporciones distintas, pondera su tamaño según el contraste local y añade recortes que se superponen a sus vecinos. La semilla por release mantiene el resultado reproducible sin repetir la misma geometría entre portadas. Se conservan 1600 regiones de detalle y se añaden 512 planos principales de cuatro lados.

Referencia visual revisada: https://www.instagram.com/p/DemNPZDAQ4J/?img_index=1. Se toma la idea general de planos desiguales, inclinación y superposición; no se incorporan imágenes ni recortes del post. Los colores, sujetos y objetos proceden de las portadas verificadas de cada release.


### Contornos que identifican la portada

En V12.1.10, la U del cartel de underscores se conserva con un contorno vectorial basado en la portada local. El suavizado y la agrupación por color borraban esa línea fina sobre blanco. `annual-cover-details.mjs` coloca el contorno por encima de los recortes, manteniendo visibles los planos del cartel. Los nuevos archivos `underscores-u` evitan reutilizar la edición anterior de la caché en mural, detalle y descarga. Una comprobación de contraste del contorno en los tres archivos y la navegación de la galería en celular y escritorio cubren esta regresión.


### Ranking horizontal y estadísticas (introducido en V12.1.11)

El recorrido se introdujo con el orden editorial; V12.2.0 lo sustituye por un ranking calculado con las notas del club, descrito abajo. Se recorre del puesto 20 al 1. `AnnualCollection` usa un escenario sticky y un desplazamiento horizontal derivado del scroll vertical nativo; no intercepta la rueda ni los gestos. Incluye botones, foco limitado al panel activo, redimensionamiento y controles sin desplazamiento suave si se prefiere movimiento reducido.

Las notas, reseñas y votos de tracks de cada release se calculan con las reseñas de 2026 hasta la fecha actual, incluyendo sus ediciones agrupadas. Una favorita requiere una elección explícita; los releases sin reseñas no reciben una nota inventada. El resumen del club añade meses, distribución, mediana, notas perfectas, géneros por release distinto y actividad. El personal añade palabras y XP desglosada, usando las mismas reseñas deduplicadas de su resumen. No hay consultas adicionales por tarjeta.

Las referencias no se renderizan en la navegación ni las tarjetas, y los campos de fuentes y nominaciones se excluyen de la respuesta de la colección. Se conservan en el servidor y esta documentación para revisión editorial interna. El acceso de administrador y el Próximamente público no cambian.


### El club primero y el panorama global (V12.2.0)

El primer ranking incluye hasta veinte releases publicados en 2026 y reseñados durante el año en Musiclub. Ordena por promedio de notas ponderadas de las reseñas; desempata por cantidad de reseñas y título. El puesto 1 es la nota más alta. Admite una sola reseña, cuya cantidad se muestra para no sugerir un consenso. La apertura artística conserva sus veinte piezas independientes del ranking.

Después del resumen del club, el recorrido sigue álbumes, EPs, sencillos, meses, reseñas de la comunidad, listas, géneros, categorías y próximos lanzamientos, adaptando el orden de Record Club 2024. La fuente global es AOTY: sus notas de usuarios y crítica se mantienen en escala /100, junto a las notas /10 y cantidad de reseñas de Musiclub. No se mezclan en un promedio, no representan reproducciones ni una encuesta mundial. La correspondencia usa título y créditos normalizados.

`docs/data/annual-2026-global-observed.json` conserva los hechos observados en las páginas fuente. `scripts/prepare-annual-global-snapshot.mjs` prepara `src/server/annual2026Global.json` y las portadas locales disponibles. El corte es del 19 de noviembre de 2026 y comprende 122 releases distintos. Las cifras con K conservan su carácter aproximado. Los meses eligen el LP con más valoraciones dentro de la muestra de popularidad consultada; los géneros agrupan los álbumes verificados de los rankings consultados. No son rankings exhaustivos de toda la música. Un mes sin datos queda vacío. Las fechas de 2027 están sujetas a cambios.

Las portadas visibles del panorama global se sirven como WebP locales preparados desde fuentes verificadas; los vinilos acompañan la imagen y no sustituyen las portadas. Las referencias se mantienen internas; sólo se muestran la identificación AOTY, escalas y fecha de corte. El runtime no consulta páginas externas al navegar ni crea releases automáticamente. Una misma lectura del catálogo alimenta ranking, comparaciones y reseñas. Las playlists consultan únicamente campos de presentación bajo las reglas existentes.

`buildAnnualVoices` contempla todas las personas con reseñas públicas durante 2026, aunque el release sea de otro año. Busca una asignación de releases distintos mediante emparejamiento máximo, conservando el comentario original y la nota ponderada. Si no hay suficientes releases distintos para todos, reúne las opiniones en la misma tarjeta del release, sin excluir personas ni duplicar tarjetas. No inventa un comentario cuando sólo se calificó. Los comentarios largos se pueden expandir. No se envían correos ni identificadores privados.

El acceso administrativo y el Próximamente público siguen separados por autorización del servidor. Las pruebas `tests/annual-yearbook.test.mjs` cubren orden, escalas, metadatos, archivos de portadas y cobertura de autores; las pruebas de navegador comprueban el recorrido, estados vacíos, contraste y tarjetas sin duplicados en celular y escritorio.


### Bienvenida, portadas y catálogo (V12.2.1)

Una bienvenida después del mural agradece la participación y explica el orden de la edición. El género de fondo usa el ancho de su propia tarjeta, ajusta la tipografía a la longitud del nombre y conserva un espaciado positivo. El formato R&B se normaliza también dentro de nombres compuestos. Las tarjetas muestran un género principal; la ficha conserva todos los géneros reconocidos.

La preparación de catálogo añadió 450 releases, actualizó portadas y géneros de 56 fichas existentes y enlazó 423 nominaciones. La verificación posterior confirmó las 498 nominaciones musicales con album_id; las 23 nominaciones a personas y cinco películas conservan sus tipos propios. No se modificaron reseñas, calificaciones, cuentas, votos ni políticas. A Cappella se añadió al registro de géneros con una composición nativa exclusiva, conservando todas las asignaciones anteriores.

El manifiesto `docs/data/yearbook-catalog-import-2026-11-19.json` registra IDs y correspondencias públicas. Las correcciones de intérpretes en categorías técnicas se contrastaron con los artistas entre paréntesis de la lista oficial Grammy; los créditos técnicos de la nominación se conservan. Los buscadores de streaming se usan como fuentes de metadatos, no como prueba de una coincidencia cuando sólo comparten título. Las búsquedas fallidas no crean datos inventados. Los IDs existentes se conservan y los comentarios/tracks evaluados no se sustituyen.

121 releases del corte global tienen ficha, al menos un género reconocido y portada verificada. Sus archivos locales conservan 500–1200 píxeles de fuente, sin ampliar miniaturas; los rankings a pantalla completa exigen fuentes de al menos 600 px. Las portadas provienen de Deezer, Spotify público, Apple Music, Bandcamp, archivos de portadas y tiendas oficiales. Life is Beautiful se añadió en V12.2.2 con el original publicado de 1000 × 1000 px y clasificación editorial general Hip-Hop, basada en el género del artista en Apple Music. Su fecha procede del calendario provisional de AOTY, no de una confirmación oficial. No tiene tracks publicados y las reseñas permanecen deshabilitadas. PSYOPERA sigue reservado: su ficha de AOTY aún muestra «Add Cover» al 19 de noviembre; no se sustituye su portada por una foto promocional o por el arte de un sencillo. El registro complementario `docs/data/yearbook-upcoming-covers-2026-11-19.json` conserva las fuentes y esta distinción.

La API reúne los IDs con el catálogo, incluidas sus ediciones agrupadas, y genera destinos con los nombres reales de la ficha. El manifiesto conserva también su ruta directa para evitar regresiones si una lectura está temporalmente incompleta. Una actualización de cifras preserva estos IDs, las portadas y la reserva de adelantos sin confirmar. No se consulta ningún proveedor externo al recorrer las tarjetas.

`annualClubGenres` usa releases reseñados durante 2026 en Musiclub, aunque sean de otro año. Agrupa por la familia de su género principal, prioriza cantidad de reseñas y nota, muestra hasta ocho releases por grupo y las diez familias con mayor actividad. Cada edición equivalente sólo entra una vez y cada release pertenece a un único grupo. Se omiten grupos de un solo release. No se convierten reseñas en reproducciones.

Los discos y sus etiquetas giran con movimiento suave, pausado fuera de pantalla, al ocultar la pestaña, con la pausa global o por preferencia de movimiento reducido. La bienvenida, nombres largos, calidad de assets y destinos directos se comprueban en las pruebas de unidad y de navegador de la edición anual.

### Fluidez del recorrido

La barra superior actualiza únicamente su propio transform, sin propagar una variable de estilo por todo el árbol de la página. El ranking conserva sus tarjetas entre cambios de puesto, mide su geometría al cambiar el tamaño o entrar en pantalla y mueve el carril por fotogramas con una transición breve ajustada al tiempo transcurrido. El gesto táctil conserva su respuesta directa; las anclas lejanas y la preferencia de movimiento reducido se resuelven sin interpolación. Sólo se dibujan la tarjeta actual y sus vecinas, conservando el resto de posiciones y el orden del ranking. La barra inferior sigue la posición continua del carril.

Las pruebas en escritorio y celular comprueban posiciones intermedias, llegada al destino, desplazamiento nativo con rueda, movimiento reducido, tarjetas lejanas omitidas del dibujo y ausencia de escrituras de estilos en la raíz durante el scroll. Las estadísticas, las portadas y los enlaces del ranking se verifican en el mismo recorrido.

### Presentación de cifras externas y primer año del club

La interfaz identifica las notas ajenas al club como «Valoración externa», con su escala de 100, y las distingue de Musiclub sobre 10. El nombre de la fuente permanece en los manifiestos internos y no en el texto de la página. El ranking del club y las tarjetas por género muestran únicamente estadísticas de Musiclub. Las gráficas de actividad del club y de Mi 2026 presentan julio–diciembre, a partir de la creación del club el 7 de julio; el calendario de lanzamientos externos conserva sus doce meses. Este recorte visual no modifica las reseñas, las cifras de actividad ni la XP. La tarjeta pública del adelanto incorpora dos vinilos nativos, adaptados a su tamaño y a las preferencias de movimiento.

## Avisos y estreno · V.12.3.2

`annual_subscriptions` conserva un aviso por persona y año, con correo tomado de la sesión validada. RLS impide leer o modificar avisos ajenos, suplantar el correo o escribir marcas de envío. `annual_mail_campaigns` sólo es accesible al servicio; su ausencia deliberada de políticas públicas mantiene cerrada la aprobación de campañas. Las tres fases nacen pausadas y sin `approved_at`: preparar el diseño o pulsar Notificarme nunca aprueba un envío.

Tres diseños de 640 px: anuncio general en papel, confirmación en menta y estreno en noche del club. `scripts/build-annual-mail-art.mjs` produce gráficos nativos y vistas de celular/escritorio sin leer destinatarios ni enviar. `scripts/annual-mail.mjs --phase=announcement` genera una vista previa; `--send` sólo puede enviar si esa fase está aprobada y despausada en la base de datos. El anuncio general no forma parte de tareas automáticas.

El cron existente de Cloudflare consulta `/api/annual/2026/mail` cada cinco minutos hasta el cierre de 2026. Revisa confirmaciones pendientes antes del estreno y avisos de lanzamiento desde las 18:00 UTC del 28 de diciembre. Cada destinatario se vuelve a comprobar y cada fase tiene una clave única en el registro de entregas. Un error incierto no se reintenta automáticamente. La fecha abre la página aunque los correos sigan pendientes de aprobación. La hora programada inicia el procesamiento; la llegada a cada buzón depende del proveedor.

La página conserva el aviso sin afirmar que se haya enviado un correo. Al cerrar sesión borra el estado anterior; la respuesta anual sólo se acepta si coincide con la cuenta actual. Los correos se adjuntan como PNG mediante CID, con texto alternativo y versión de texto plano.

El calendario anual muestra doce meses en una cuadrícula adaptable; los EPs y sencillos usan calificación externa descendente. Las tarjetas de opiniones requieren comentario escrito, mientras la cantidad de autores y las estadísticas generales cuentan también reseñas sin comentario. Las explicaciones personales derivan de datos reales y no acreditan XP o insignias nuevas.

Canva: archivo `DAHbTQNNVCg`, veinte páginas cuadradas guardadas con aprobación del propietario. Los PNG originales son de 1200 px; Canva conserva páginas cuadradas de 1600 px al importar el PDF. Las imágenes siguen siendo ilustraciones terminadas, no capas vectoriales editables.
