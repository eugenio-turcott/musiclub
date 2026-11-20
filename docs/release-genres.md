# Géneros e importación

Un género ausente no bloquea agregar ni reseñar un lanzamiento. `albums.genres = []` significa **Género por verificar**, nunca una clasificación musical. La base sigue rechazando etiquetas desconocidas y valores nulos.

- Apple Music: 525 categorías de la taxonomía oficial en `src/data/appleMusicGenreMap.json`. Cuando un subgénero no tiene equivalente en el registro, se utiliza su categoría musical superior oficial.
- Deezer: sus 27 categorías musicales se reconocen por ID, independiente del idioma. La categoría 0 («All») no es un género.
- Sólo se toman géneros de una edición coincidente. Códigos comerciales distintos requieren comprobar créditos y canciones completas; no se reemplazan las pistas elegidas.
- Las fuentes se consultan con un plazo limitado. Una caída deja el release disponible y pendiente de completar.

## Administración y reintentos

`/admin/generos` muestra portada, artista, comprobaciones y próxima revisión. Un aviso en el panel enlaza los pendientes. Actualiza la lista cada minuto; el administrador puede reintentar o asignar géneros del registro.

El cron existente de Cloudflare llama `POST /api/genres/pending` cada 15 minutos con `CRON_SECRET`. Cada ejecución revisa como máximo tres releases. El siguiente intento se espacia entre 15 minutos y 24 horas. Las reservas impiden procesar un release dos veces y una corrección del administrador prevalece sobre una búsqueda en curso. La actualización automática modifica únicamente géneros y datos del reintento.

La API requiere administrador; el cron sólo puede ejecutar comprobaciones. No hay envíos de correo ni nuevas credenciales.

Para actualizar la taxonomía: `node scripts/update-provider-genres.mjs`, revisar cambios y ejecutar las pruebas. Al ampliar el registro, ejecutar `node scripts/build-genre-variations.cjs` para asignar gráficos únicos. Las nuevas etiquetas también deben añadirse al registro de la base mediante una migración.
