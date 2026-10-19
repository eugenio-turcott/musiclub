# Gráficos de géneros Musiclub

Los SVG usan el vinilo y la paleta de Musiclub General: #FFDBE6, #F57FA2, #56408E, #5A2D7C, #171433 y negro. Se crearon 81 variantes para los géneros presentes en el catálogo y 25 motivos de familias como respaldo para el registro completo. Son elementos visuales; la clasificación exacta sigue en genreCatalog y no se modifica por compartir una ilustración.

El atlas editable de 81 páginas está en Canva:
https://www.canva.com/design/DAHYd9oPiVc/-kmBHUOY3O0YeJ37HKTnHw/edit

`node scripts/generate-genre-artwork.cjs` regenera los SVG y su manifiesto. Puede recibir un archivo JSON con los lanzamientos; sin archivo usa los géneros del manifiesto existente. También escribe la lista de páginas en audit/genre-artwork-pages.json.

Para regenerar el PDF de importación a Canva, ejecutar después `python scripts/generate-genre-designs.py` con reportlab, svglib, fonttools y brotli disponibles. El resultado queda en output/pdf/musiclub-generos-canva.pdf; usa la fuente Gabarito del proyecto. El atlas de Canva se ajustó a 1000 × 1000 px por página.
