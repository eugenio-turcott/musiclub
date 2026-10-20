# Discografías oficiales persistentes

Las rutas de artista leen `artist_discographies` en Supabase; no esperan a Spotify, Deezer ni Apple. Se combinan con los releases y reseñas actuales del club. Si todavía no existe una copia y hay releases locales, se muestran inmediatamente y se consulta por la actualización en segundo plano. Si el artista es completamente nuevo, la primera visita consulta las fuentes oficiales, guarda el resultado y vuelve a leerlo desde Supabase antes de presentar la discografía. Una búsqueda sin coincidencia verificada no se presenta como artista válido.

La migración `20261020_artist_discographies.sql` crea una tabla de metadatos públicos con lectura pública y escritura exclusiva de `service_role`. El servidor usa `after` para actualizar copias vencidas; una reserva atómica de dos minutos evita trabajos duplicados. Un fallo externo conserva los datos anteriores y permite otro intento después de una hora. Una actualización correcta vence después de 24 horas.

`Refresh official artist discographies` mantiene los artistas del club y puede ejecutarse manualmente para slugs concretos. Usa las credenciales de Spotify y Supabase ya configuradas; no envía correos ni modifica releases, reseñas o permisos de miembros.

## Cobertura

- Spotify: catálogo del ID oficial, con paginación y comprobación de créditos, incluyendo colaboraciones cuando el artista está acreditado.
- Deezer: álbumes del ID oficial con paginación y detalles para comparar pistas y ediciones.
- Apple: API pública de iTunes/Apple Music, región MX, hasta 200 colecciones. Si alcanza el límite, se registra cobertura parcial. No implica acceso ilimitado a MusicKit.
- Los enlaces oficiales de álbumes conocidos se verifican por título y créditos para obtener el ID correcto antes de comparar homónimos. No se descarta un artista por tener más de seis coincidencias; la comparación utiliza un máximo de tres consultas simultáneas. Los homónimos se comparan mediante releases ya atribuidos al artista en Musiclub. Solo una coincidencia inequívoca permite guardar sus IDs oficiales; si la evidencia sigue siendo ambigua, se conserva la copia anterior. Una fuente no disponible se registra como tal; no se rellena con resultados comunitarios de MusicBrainz.
- La unión conserva enlaces e IDs de origen, variantes de pistas, ediciones, versiones limpias y explícitas. Cambios posteriores de metadatos de un mismo ID actualizan el registro sin crear duplicados.
- Se conservan releases verificados anteriormente si desaparecen temporalmente de un proveedor. La copia no certifica disponibilidad actual en todos los países.

La interfaz muestra la procedencia y cobertura, conserva los tags EN MUSICLUB en la edición correspondiente y presenta 48 tarjetas por bloque, sin limitar el buscador ni eliminar releases del catálogo.
