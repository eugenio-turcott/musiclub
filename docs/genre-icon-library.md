# Biblioteca visual de géneros · V2

El registro completo vigente contiene 2.220 entradas. Cada una tiene una figura principal con nombre y hasta tres detalles de variante. Todas las combinaciones son exclusivas, incluso ignorando el orden de los detalles. Son asociaciones editoriales para Musiclub, no símbolos oficiales ni afirmaciones de que todos los releases de un género utilicen ese instrumento.

La biblioteca contiene 169 figuras: 55 instrumentos y objetos dibujados para Musiclub y 114 elementos de Tabler Icons 3.49.0 (MIT). Todos usan una retícula de 24 × 24, trazo de 2 unidades, extremos redondeados y uniones redondeadas. No se mezclan iconos rellenos con contornos ni se sustituyen géneros por polígonos aleatorios.

## Control de los dibujos y las asignaciones

- `src/utils/genreInstrumentIcons.cjs`: dibujos propios. Cambiar el instrumento aquí actualiza todas sus apariciones.
- `src/data/musicIconLibrary.json`: biblioteca compilada y procedencia de cada figura.
- `src/utils/genreIdentityPlan.cjs`: asociaciones editoriales por estilo y reglas para las variantes. La familia visual antigua se conserva por compatibilidad; no es una taxonomía musical nueva.
- `src/data/genreVisualOverrides.json`: correcciones explícitas por ID canónico. `figure` elige el dibujo; `details: []` elimina los detalles automáticos. Usar los IDs de la biblioteca, nunca una ruta arbitraria.
- `src/utils/genreSymbols.cjs`: composición del centro, sin modificar los colores del vinilo exterior ni su animación.
- `src/data/genreVariationAssignments.json`: asignaciones estables y exclusivas de los 2.220 géneros.
- `src/utils/genreVariationRules.cjs`: paletas de objetos relacionados para completar cada firma visual.
- `scripts/build-genre-variations.cjs`: reserva las combinaciones y conserva las asignaciones anteriores. `--check` exige cobertura y exclusividad.

Ejemplo de control: `"k-pop": {"figure":"lightstick","details":[]}`. Black Metal usa el rayo y una luna; Doom Metal añade un reloj de arena; Metal Sinfónico añade una partitura. El borde decorativo es idéntico para todos: no distingue identidades. Las figuras principales pueden compartirse entre familias; la combinación de figura y detalles nunca se repite. Al cambiar asociaciones o dibujos, regenerar el registro y revisar la auditoría antes de publicar.

## Exportación y revisión

1. Para reconstruir la biblioteca, descargar el paquete oficial fijado: `npm pack @tabler/icons@3.49.0 --pack-destination audit --silent`, extraerlo en `audit/tabler-3.49.0` y ejecutar `node scripts/build-music-icon-library.cjs`.
2. Ejecutar `node scripts/export-genre-library.cjs`. Crea `outputs/musiclub-genre-library-v2/` con una lista completa en texto, el registro JSON, 169 SVG individuales, 2.220 centros SVG y `catalogo.html` con buscador y paginación. No necesita una cuenta de Canva; los SVG son editables en herramientas vectoriales.
3. `node scripts/preview-music-icons.cjs` crea la lámina de instrumentos propios. `comparativa.png` compara familias y variantes a 120 y 30 píxeles.
4. Ejecutar `node scripts/lib/audit-genre-variations.cjs`. Genera `auditoria-variaciones.json`: compara las 2.220 composiciones sin considerar el orden de sus detalles y sus imágenes reales en blanco y negro a 32 y 64 píxeles, sin colores, nombres, metadatos ni borde decorativo. Exige cero repeticiones. Esto comprueba exclusividad gráfica, no que cada persona pueda reconocer todos los géneros a tamaños pequeños.
5. Ejecutar `npm run test:critical` y comprobar los géneros en el catálogo y Gashapon. Las pruebas incluyen esa auditoría, cobertura del registro entero, figuras existentes, geometría válida, coherencia entre alias y colores únicos. Los alias de un mismo género canónico conservan la misma identidad.

Los recursos web y de correo usan `/genres/symbols/v4/` y `/genres/vinyl/v4/`. Al cambiar una figura publicada se debe incrementar la versión de ambas rutas para evitar iconos antiguos en la caché. Los archivos heredados se actualizan con `node scripts/refresh-legacy-genre-icons.cjs`, que conserva los discos y sus paletas.

## Géneros nuevos

El mantenimiento semanal ejecuta el asignador después de actualizar los géneros y antes de las pruebas. Conserva las firmas anteriores y añade detalles de una paleta relacionada cuando una combinación ya está ocupada. Si no queda una combinación exclusiva o las pruebas detectan repetición, falla antes de publicar el registro. Una entrada aún sin firma aparece como `variationStatus: pending`; no se declara exclusiva hasta asignarla y auditarla. Si no tiene asociación musical, se utiliza una lira con brújula como metáfora general y `quality: general` para su revisión. En la instantánea actual las 2.220 entradas tienen firma asignada y asociación específica o de familia.

La licencia de Tabler se conserva en `public/genres/licenses/tabler-icons.txt`. Los borradores de selección de Canva no son la fuente de esta versión final.
