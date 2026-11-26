# Releases y artistas · V.12.3.2

Las invitaciones a completar reseñas comparan grabaciones del catálogo con las canciones de las reseñas publicadas de la persona autenticada. Requieren cinco coincidencias, excepto cuando la reseña de origen es de un sencillo. Cada aparición cuenta una vez. Se contrastan ISRC, identificadores compartidos o título y duración; un remix no equivale a la grabación original.

Primero se propone el álbum normal y, una vez reseñado, su Deluxe. La invitación desaparece cuando el destino ya tiene reseña. «Usar mis calificaciones» copia sólo canciones coincidentes y conserva las notas que ya se cambiaron en el formulario. Criterios, ánimo y comentario se responden por separado. La consulta es privada y utiliza la identidad validada de la sesión, nunca un correo proporcionado por la URL.

Los tracklists conservan `disc_number` y `track_number`. Cuando una fuente antigua reinicia su numeración, se infiere la separación. La ficha y el formulario comparten esa división sin modificar las claves de las calificaciones existentes.

## Colores de las imágenes

La migración `20261125212702_release_artwork_palettes.sql` añade `dominant_colors` y `palette_image_url` a `albums` y `artist_discographies`. Cada paleta contiene hasta cinco colores hexadecimales medidos en la imagen. La interfaz utiliza la paleta sólo cuando corresponde a la imagen actual y respeta la preferencia de reducir movimiento.

```sh
npm run artwork:palettes
npm run artwork:palettes -- --apply
```

La primera orden sólo analiza; la segunda guarda usando la conexión administrativa del entorno. No colocar la clave de servicio en el navegador. El script valida las direcciones y redirecciones de las imágenes y guarda un informe en `outputs/v1230/palette-report.json`.

La primera visita sin paleta consulta `/api/artwork-palette` con el identificador de la ficha. El servidor recupera la URL guardada, valida el proveedor y cada redirección, analiza una miniatura JPEG o PNG con decodificadores compatibles con Cloudflare y guarda únicamente los colores. Limita bytes, resolución y solicitudes por IP; agrupa análisis simultáneos. La escritura exige que la imagen siga siendo la misma. La clave administrativa permanece en el servidor. Las paletas existentes se reutilizan y la lectura no invalida el catálogo salvo que se guarde una paleta nueva.

Si el servicio no responde o la portada usa otro formato nativo del navegador, el cliente genera una paleta local para mantener el fondo visible. Esta alternativa no permite escribir colores arbitrarios en la base de datos: el proceso del servidor los persiste después.

Como respaldo, GitHub Actions ejecuta **Musiclub artwork colors** cada seis horas, al minuto 23, y permite ejecución manual. Reutiliza los secretos existentes de Supabase y no genera commits. Sólo procesa imágenes nuevas o cambiadas; la condición sobre la URL evita guardar colores de una portada sustituida durante el análisis. Las consultas de artistas proyectan únicamente la URL de la foto, en lotes de 50, y guardan un informe después de cada lote. No descargan las discografías completas.

## Discografías verificadas

La discografía se ordena de fecha más reciente a más antigua. A igual fecha, suma evidencias una vez por proveedor: Spotify 70 puntos y Apple Music, Deezer, MusicBrainz, YouTube Music y Tidal 6 puntos cada uno. No representa un número de escuchas ni una popularidad inventada. Los releases con una fuente y los que ya tienen ficha en Musiclub permanecen visibles.

La recolección consulta los catálogos disponibles de Spotify, Apple Music y Deezer y contrasta las relaciones de releases de MusicBrainz, que también pueden aportar enlaces directos a YouTube Music y Tidal. Se exige concordancia con títulos conocidos para desambiguar artistas homónimos y se respeta el límite de una consulta por segundo de MusicBrainz. Se conservan las evidencias previas si falla un proveedor. No se cuentan búsquedas, páginas de artista ni enlaces inventados; `linked` distingue enlaces confirmados de un catálogo consultado directamente.

El fondo de color se recorta desde el inicio del banner de la ficha. La barra de navegación tiene una base opaca y las migas de navegación conservan el fondo normal. El límite sigue la geometría del banner y la barra durante scroll y redimensionado, sin recalcular colores.
