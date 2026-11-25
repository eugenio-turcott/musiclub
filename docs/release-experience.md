# Releases y artistas · V.12.3.0

Las invitaciones a completar reseñas comparan grabaciones del catálogo con las canciones de las reseñas publicadas de la persona autenticada. Requieren cinco coincidencias, excepto cuando la reseña de origen es de un sencillo. Cada aparición cuenta una vez. Se contrastan ISRC, identificadores compartidos o título y duración; un remix no equivale a la grabación original.

Primero se propone el álbum normal y, una vez reseñado, su Deluxe. La invitación desaparece cuando el destino ya tiene reseña. «Usar mis calificaciones» copia sólo canciones coincidentes y conserva las notas que ya se cambiaron en el formulario. Criterios, ánimo y comentario se responden por separado. La consulta es privada y utiliza la identidad validada de la sesión, nunca un correo proporcionado por la URL.

Los tracklists conservan `disc_number` y `track_number`. Cuando una fuente antigua reinicia su numeración, se infiere la separación. La ficha y el formulario comparten esa división sin modificar las claves de las calificaciones existentes.

## Colores de las imágenes

La migración `20261125212609_release_artwork_palettes.sql` añade `dominant_colors` y `palette_image_url` a `albums` y `artist_discographies`. Cada paleta contiene hasta cinco colores hexadecimales medidos en la imagen. La interfaz utiliza la paleta sólo cuando corresponde a la imagen actual y respeta la preferencia de reducir movimiento.

```sh
npm run artwork:palettes
npm run artwork:palettes -- --apply
```

La primera orden sólo analiza; la segunda guarda usando la conexión administrativa del entorno. No colocar la clave de servicio en el navegador. El script valida las direcciones y redirecciones de las imágenes y guarda un informe en `outputs/v1230/palette-report.json`.

GitHub Actions ejecuta **Musiclub artwork colors** cada seis horas, al minuto 23, y permite ejecución manual. Reutiliza los secretos existentes de Supabase y no genera commits. Sólo procesa imágenes nuevas o cambiadas; la condición sobre la URL evita guardar colores de una portada sustituida durante el análisis. Las consultas de artistas proyectan únicamente la URL de la foto, en lotes de 50, y guardan un informe después de cada lote. No descargan las discografías completas.

## Discografías verificadas

La página del artista exige dos plataformas distintas. Se reconocen evidencias de Spotify, Apple Music, Deezer, MusicBrainz, YouTube Music y Tidal. Un enlace de búsqueda no constituye verificación. La recolección automática existente consulta Spotify, Apple Music y Deezer; las demás cuentan cuando existe un identificador verificado en los metadatos. No se inventa cobertura de plataformas no consultadas.

Las entradas de una sola fuente permanecen guardadas para poder contrastarlas después. La regla cambia su visibilidad en la discografía, conserva las fichas y reseñas existentes y no elimina registros.
