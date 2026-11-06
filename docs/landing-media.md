# Recursos de la landing

La tornamesa, las cápsulas y las demostraciones usan los vinilos, motivos, estados de ánimo, insignias y logos propios de Musiclub. Las portadas y reseñas proceden de la instantánea pública del catálogo. Se seleccionan hasta diez releases distintos con reseñas, una vez por visita, sin escribir datos ni consultar de nuevo al cambiar de ejemplo.

## En el radar

Los tres recursos `public/editorial/*-canva-v3.webp` corresponden, en orden, a las páginas 1–3 del diseño [RECURSO · Musiclub · En el radar · Diseños originales](https://www.canva.com/design/DAHYrY9oQc4/JFQClAXxl4xd8Uqa5xJzeA/edit), versión 114, exportado el 6 de noviembre de 2026. Las exportaciones originales de 1600 × 640 se convierten a WebP sin alterar su composición. Las rutas versionadas evitan mostrar la exportación anterior desde la caché del navegador.

## Muestras musicales

`/api/listening-preview` acepta sólo el identificador de un release reseñado del catálogo. La canción se obtiene del cálculo de top track del club y se contrasta por título, artista y release con los resultados de iTunes. Si no hay coincidencia exacta o muestra disponible, la interfaz lo indica y permite abrir la plataforma del release; nunca sustituye la canción por una coincidencia aproximada.

La petición empieza al bajar la aguja o pulsar reproducir. Se reutilizan los metadatos durante la visita y en la caché del servidor. El audio se transmite directamente desde Apple: Musiclub no lo descarga, guarda, transforma ni almacena en caché. No hay reproducción automática ni encadenada. Levantar la aguja, cambiar de release, salir de pantalla, ocultar la pestaña o abandonar la página detiene la reproducción. El movimiento reducido y la pausa visual siguen disponibles independientemente del sonido.

Si la conexión compartida de Cloudflare recibe un límite de Apple, la búsqueda puede realizarse directamente desde el navegador mediante la API pública con CORS. Se envían únicamente artista, canción y release, sin credenciales ni referente de Musiclub. La selección y validación son idénticas; los metadatos se reutilizan durante la visita. Un límite en la conexión del visitante se respeta sin reintentos ni sondeos automáticos.

La atribución «provided courtesy of iTunes» y el distintivo oficial, enlazado a la canción exacta, acompañan cada muestra. `public/itunes-store-badge-es.svg` es el recurso español «Get it on» sin modificaciones de las [guías de identidad de iTunes Store](https://marketing.services.apple/itunes-identity-guidelines). Las condiciones de las muestras se documentan en la [API oficial](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/).
