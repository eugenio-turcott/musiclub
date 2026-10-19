# Gráficos de géneros Musiclub

Los SVG usan el vinilo y la paleta de Musiclub General: #FFDBE6, #F57FA2, #56408E, #5A2D7C, #171433 y negro. Se crearon 81 variantes para los géneros presentes en el catálogo y 26 motivos de familias. Son elementos visuales; la clasificación exacta sigue en genreCatalog y no se modifica por compartir una ilustración.

El atlas editable de 81 páginas está en Canva:
https://www.canva.com/design/DAHYeJLahGM/FTdoRvFNhhPwfa60GoNIAQ/edit

`node scripts/generate-genre-artwork.cjs` regenera los SVG y su manifiesto. Puede recibir un archivo JSON con los lanzamientos; sin archivo usa los géneros del manifiesto existente. También escribe la lista de páginas en audit/genre-artwork-pages.json.

Para regenerar el PDF de importación a Canva, ejecutar después `python scripts/generate-genre-designs.py` con reportlab, svglib, fonttools y brotli disponibles. El resultado queda en output/pdf/musiclub-generos-canva.pdf; usa la fuente Gabarito del proyecto. El atlas de Canva se ajustó a 1000 × 1000 px por página.

Los símbolos solo se comparten dentro de la familia musical asignada. Metal, Punk, Blues y J-pop tienen centros claramente distintos (rayo, imperdible, armónica y flor). La música árabe usa un laúd. Los géneros que todavía no tienen familia reconocida reciben un sello geométrico propio, en lugar de reutilizar un globo genérico. El vinilo exterior es el marco común de identidad, no el símbolo del género. La asignación visual no sustituye la clasificación musical exacta.

Desde V.9.10.2, GenreLabel y GenreArtwork comparten las etiquetas e ilustraciones entre Gashapon (cúpula, premio, apertura e historial), catálogo, ficha del lanzamiento, artistas, búsquedas, tendencias, listas y perfiles. Las etiquetas de estado de ánimo que no son géneros conservan su presentación de estado de ánimo. Los selectores nativos muestran la ilustración de la selección activa. Las etiquetas de fichas y perfiles enlazan con /generos/[slug]. Estas páginas mantienen el diseño de Musiclub, muestran únicamente lanzamientos del género y permiten abrir Gashapon filtrado. Los géneros con contenido se añaden al sitemap de catálogo; los demás usan noindex y no entran en el sitemap. Los nombres con tildes conservan su identidad en las direcciones para evitar colisiones.
