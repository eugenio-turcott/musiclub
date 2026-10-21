# Biblioteca visual de géneros · V2

El registro completo vigente contiene 2.220 entradas. Cada una tiene una figura principal con nombre y, cuando corresponde, hasta dos detalles de variante. Son asociaciones editoriales para Musiclub, no símbolos oficiales ni afirmaciones de que todos los releases de un género utilicen ese instrumento.

La biblioteca contiene 169 figuras: 54 instrumentos y objetos dibujados para Musiclub y 115 elementos de Tabler Icons 3.49.0 (MIT). Todos usan una retícula de 24 × 24, trazo de 2 unidades, extremos redondeados y uniones redondeadas. No se mezclan iconos rellenos con contornos ni se sustituyen géneros por polígonos aleatorios.

## Control de los dibujos y las asignaciones

- `src/utils/genreInstrumentIcons.cjs`: dibujos propios. Cambiar el instrumento aquí actualiza todas sus apariciones.
- `src/data/musicIconLibrary.json`: biblioteca compilada y procedencia de cada figura.
- `src/utils/genreIdentityPlan.cjs`: asociaciones editoriales por estilo y reglas para las variantes. La familia visual antigua se conserva por compatibilidad; no es una taxonomía musical nueva.
- `src/data/genreVisualOverrides.json`: correcciones explícitas por ID canónico. `figure` elige el dibujo; `details: []` elimina los detalles automáticos. Usar los IDs de la biblioteca, nunca una ruta arbitraria.
- `src/utils/genreSymbols.cjs`: composición del centro, sin modificar los colores del vinilo exterior ni su animación.

Ejemplo de control: `"k-pop": {"figure":"lightstick","details":[]}`. Black Metal usa el rayo y una luna; Doom Metal añade un reloj de arena; Metal Sinfónico añade una partitura. Las marcas discretas del borde distinguen identidades que comparten figura y detalles. Todos los puntos tienen el mismo tamaño.

## Exportación y revisión

1. Para reconstruir la biblioteca, descargar el paquete oficial fijado: `npm pack @tabler/icons@3.49.0 --pack-destination audit --silent`, extraerlo en `audit/tabler-3.49.0` y ejecutar `node scripts/build-music-icon-library.cjs`.
2. Ejecutar `node scripts/export-genre-library.cjs`. Crea `outputs/musiclub-genre-library-v2/` con una lista completa en texto, el registro JSON, 169 SVG individuales, 2.220 centros SVG y `catalogo.html` con buscador y paginación. No necesita una cuenta de Canva; los SVG son editables en herramientas vectoriales.
3. `node scripts/preview-music-icons.cjs` crea la lámina de instrumentos propios. `comparativa.png` compara familias y variantes a 120 y 30 píxeles.
4. Ejecutar `npm run test:critical` y comprobar los géneros en el catálogo y Gashapon. Las pruebas exigen cobertura del registro entero, figuras existentes, geometría válida, coherencia entre alias, colores únicos y familias de Metal diferenciadas.

Los recursos web y de correo usan `/genres/symbols/v2/` y `/genres/vinyl/v2/`. Al cambiar una figura publicada se debe incrementar la versión de ambas rutas para evitar iconos antiguos en la caché. Los archivos heredados se actualizan con `node scripts/refresh-legacy-genre-icons.cjs`, que conserva los discos y sus paletas.

## Géneros nuevos

El mantenimiento del registro musical continúa funcionando. Una entrada nueva que coincide con una familia o asociación recibe la figura y los detalles correspondientes sin bloquear la página. Si todavía no tiene asociación, se utiliza una lira con brújula como metáfora musical general y el exportador indica `quality: general`; debe revisarse y añadirse a las asociaciones o al archivo de correcciones. No se atribuye automáticamente un instrumento cultural específico a un género desconocido. En la instantánea actual las 2.220 entradas tienen una asignación específica o de familia, sin entradas pendientes generales.

La licencia de Tabler se conserva en `public/genres/licenses/tabler-icons.txt`. Los borradores de selección de Canva no son la fuente de esta versión final.
