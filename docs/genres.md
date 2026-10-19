# Clasificación musical de Musiclub (V.9.8.0)

El registro parte de los 2.215 nombres de la lista oficial de MusicBrainz consultada el 19 de octubre de 2026: https://musicbrainz.org/genres.
Se añaden cinco categorías utilizadas por los proveedores: alternative, indie, arabic music, latin urban y soundtrack. No existe una lista universal cerrada de todos los géneros; el registro es ampliable.

`src/utils/genreCatalog.cjs` conserva los subgéneros específicos, normaliza equivalencias de idioma y escritura y rechaza nombres desconocidos. Los UUID de MusicBrainz se resuelven a nombres mediante un diccionario exclusivo del servidor. No se presenta un código como género ni se usa «Alternativo» como relleno.

El filtro es de pertenencia exacta: Rock y Rock Alternativo son estilos diferentes. Un lanzamiento puede tener ambos. Los contadores corresponden a lanzamientos reales. El registro completo, incluidos géneros sin lanzamientos, se puede consultar desde el selector. Un género vacío no sortea un lanzamiento ajeno. Las cápsulas tienen una identidad y paleta estable por género; los resultados conservan el género sorteado.

## Corrección de los datos existentes

`data/genre-assignments-v9.8.json` documenta 43 asignaciones complementarias para registros vacíos o vagos. Cada asignación contiene la identidad exacta del lanzamiento y referencias de MusicBrainz, Deezer, editoriales de Apple Music, discográficas o el artista. Una fuente de artista se distingue de una fuente del lanzamiento. Son clasificaciones documentadas, sujetas a revisión editorial, no una certeza sobre cada posible influencia musical.

La acción manual **Consolidate release genres** primero se ejecuta con `apply=false`. Genera un plan y una copia de los géneros originales. Con `apply=true` actualiza únicamente `albums.genres`, comprueba la identidad, evita sobrescribir una edición concurrente y verifica todos los registros al terminar. La copia queda en el artefacto de la ejecución durante 30 días. No envía correos. Si hay un lanzamiento nuevo sin clasificación comprobable, falla antes de escribir para que se agregue su fuente al manifiesto.

Después de completar la corrección, ejecutar `supabase/migrations/20261019_v98_release_genres.sql` en la base de datos. Valida que cada lanzamiento tenga un arreglo no vacío y solo nombres reconocidos. No modifica permisos ni otras columnas. Los importadores omiten los lanzamientos sin género reconocido; los formularios indican que requieren clasificación antes de guardarse.

Para actualizar el registro, ejecutar `npm run genres:update`, revisar el cambio de nombres/alias, ejecutar las pruebas y regenerar la restricción con `node scripts/generate-genre-constraint.mjs`. Actualizar la fecha de procedencia en `genreCatalog.cjs` y volver a aplicar la restricción. Los géneros que ya están en uso no deben eliminarse sin una migración previa de sus lanzamientos.
