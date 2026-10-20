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

## Reparación y auditoría

El mantenimiento repara primero las copias guardadas con conteos o portadas faltantes, consultando únicamente los IDs de Deezer ya verificados (hasta cuatro solicitudes simultáneas, ocho segundos por solicitud). La escritura comprueba `updated_at` para conservar una actualización concurrente. El informe público del trabajo enumera recuperaciones, fuentes no disponibles y conflictos. La opción manual `repair_only` permite ejecutar esta fase sin iniciar descubrimientos nuevos.

Los géneros se conservan cuando el proveedor los entrega para el release (Deezer o Apple); no se extrapolan los géneros del artista a toda su discografía. Los releases que ya pertenecen al club usan sus géneros guardados. Los metadatos desconocidos no se inventan. Un proveedor con portadas o conteos incompletos se presenta como parcial.

Un ID oficial guardado evita repetir la búsqueda por nombre. Los datos vacíos de un proveedor no borran conteos, fechas o portadas anteriores. La unión tolera metadatos faltantes solo ante una edición compatible inequívoca; no fusiona variantes explícitas y limpias ni barcodes diferentes. La reparación conserva todos los enlaces originales, aunque agrupe sus tarjetas duplicadas.

La reparación espacia sus solicitudes al menos 150 ms y reintenta hasta tres veces ante HTTP 429 o el error de cuota 4 de Deezer, con una pausa de cinco segundos.

## Política de presentación desde V9.23.0

La presentación agrupa variantes limpias, explícitas, regionales y de remasterización del mismo lanzamiento en una tarjeta; las ediciones deluxe permanecen aparte. Los conciertos y remixes que constituyen obras distintas mantienen su identidad. La regla no usa diferencias de barcode, número de pistas o año para multiplicar una obra. Se conserva una referencia estándar preferente con sus datos coherentes y se archivan los metadatos originales en `editionVariants`, incluidos todos los enlaces oficiales, para poder actualizar sin perder procedencia.

El catálogo del club agrupa las fichas al leer y reúne sus reseñas. Los registros y votos originales no se eliminan ni se trasladan. Los enlaces de variantes anteriores resuelven a la ficha unificada. Al editar una reseña, se conserva su registro y la comprobación de permisos del álbum original. Los géneros, portadas y recomendaciones reciben la misma colección agrupada.
