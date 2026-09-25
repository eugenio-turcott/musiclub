// src/data/patchNotesData.js
/**
 * Musiclub Patch Notes & Historial de Actualizaciones Oficial
 * Registro completo de novedades, mejoras y funciones amigables para todo público
 * y sincronización con el historial del club.
 */

export const GITHUB_REPO_OWNER = 'eugenio-turcott';
export const GITHUB_REPO_NAME = 'musiclub-albumes';
export const GITHUB_COMMITS_API = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commits?per_page=100`;

export const CURATED_PATCH_NOTES = [
  {
    "version": "V.9.5",
    "title": "Unificación de IDs de Canciones, Notificaciones de Lanzamientos y Blindaje de Ingesta Streaming",
    "date": "2026-09-25",
    "sha": "950f1a3",
    "associatedShas": [
      "950f1a3"
    ],
    "tag": "Estabilidad, Tracks y Notificaciones 9.5",
    "tagColor": "from-purple-500 via-indigo-600 to-cyan-600",
    "authorName": "Eugenio Turcott",
    "summary": "Una actualización crucial de estabilidad, consistencia de datos y sincronización musical. Se llevó a cabo una auditoría completa en la base de datos para unificar los IDs de canciones entre álbumes y calificaciones comunitarias (reviews), corrigiendo 12 álbumes icónicos sin perder ninguna reseña. Se activó el sistema de notificaciones automáticas (in-app y por correo) para lanzamientos anticipados. Además, se blindó la ingesta de canciones priorizando siempre las versiones oficiales de Spotify/Deezer sobre expansiones de MusicBrainz, y se crearon proxies de servidor para eliminar errores de red y advertencias en el navegador.",
    "changes": [
      {
        "type": "fix",
        "title": "Unificación Total de IDs de Canciones en la Base de Datos",
        "description": "Se detectaron y corrigieron discrepancias históricas de IDs de canciones entre la tabla de 'albums' y las calificaciones de tracks en 'reviews'. Se estandarizaron 12 álbumes con tracks desfasados (incluyendo Dawn FM, 1989, AM, Brat, SOS, Happier Than Ever, Harry's House, emails i can't send, etc.) hacia los IDs canónicos de Spotify, preservando intactas las 228 calificaciones comunitarias existentes."
      },
      {
        "type": "feature",
        "title": "Activación Integral de Notificaciones de Lanzamientos Anticipados",
        "description": "Se perfeccionó el flujo de detección de lanzamientos anticipados: el cron diario ahora identifica con precisión la fecha de estreno del día, disparando las notificaciones en la campana de la plataforma (in-app) y enviando el correo de aviso de estreno con diseño enriquecido para todos los usuarios suscritos en upcoming_notifications."
      },
      {
        "type": "improvement",
        "title": "Prioridad Estricta de Tracklist Streaming (Spotify / Deezer)",
        "description": "Al agregar nuevos lanzamientos a la plataforma, el sistema ahora otorga prioridad absoluta al listado oficial de canciones de Spotify y Deezer (evitando que ediciones extendidas o no oficiales de MusicBrainz inyecten canciones de más, como las 14 canciones oficiales de House of LION BABE en lugar de 20). MusicBrainz se utiliza exclusivamente para códigos de barras, sellos y año de lanzamiento."
      },
      {
        "type": "feature",
        "title": "Scraper de Respaldo Spotify Embed Anti-Cuota (HTTP 429)",
        "description": "Se implementó un mecanismo de respaldo que extrae directamente la información oficial y lista de canciones de Spotify Embed. Si las credenciales de desarrollador de Spotify alcanzan el límite de cuota (HTTP 429), la plataforma sigue obteniendo portadas en máxima resolución e identificadores de canciones sin interrupciones."
      },
      {
        "type": "fix",
        "title": "Rutas Proxy de Servidor para Evitar Bloqueos CORS",
        "description": "Se implementaron las rutas internas /api/spotify/embed y /api/record-club/tracks en el servidor de Next.js. Esto permite que el navegador consulte información y canciones de lanzamientos anticipados y embeds de Spotify de forma fluida, eliminando permanentemente los errores de red 'TypeError: Failed to fetch'."
      },
      {
        "type": "improvement",
        "title": "Blindaje Singleton del Cliente Supabase en Navegador",
        "description": "Se refactorizó la inicialización del cliente de Supabase para utilizar un Singleton global. Esto erradica por completo la advertencia 'Multiple GoTrueClient instances detected' durante la navegación y recarga en caliente de Next.js, garantizando la consistencia del token de sesión."
      }
    ]
  },
  {
    "version": "V.9.4",
    "title": "Sliders Continuos en el Pool y Recomendados, Enriquecimiento de Lanzamientos Anticipados y Navegación Mejorada en Catálogo",
    "date": "2026-09-23",
    "sha": "940a1b2",
    "associatedShas": [
      "940a1b2"
    ],
    "tag": "Sliders, Catálogo y Anticipados 9.4",
    "tagColor": "from-amber-500 via-orange-600 to-rose-700",
    "authorName": "Eugenio Turcott",
    "summary": "Una versión repleta de dinamismo visual y mejoras de navegación. El Historial de Ganadores del Pool y la sección de Más Recomendados por la Comunidad ahora cuentan con un slider infinito continuo cuando superan los 4 lanzamientos, ordenados rigurosamente de mayor a menor calificación. Los Lanzamientos Anticipados ahora incluyen enlace directo a Spotify y un contador inteligente de canciones que consulta Spotify, MusicBrainz y Deezer. Además, la navegación desde los detalles de un disco ahora enfoca directamente el Explorador de Catálogo con scroll suave, y se corrigió la traducción de 'Discografía'.",
    "changes": [
      {
        "type": "feature",
        "title": "Slider Continuo en el Historial de Ganadores del Pool",
        "description": "El Historial de Ganadores del Pool ahora se convierte automáticamente en un slider infinito continuo y fluido cuando hay más de 4 lanzamientos (al estilo de En Rotación & Tendencias de la Landing Page). Los álbumes ganadores están ordenados estrictamente de mayor a menor puntuación y el carrusel se pausa suavemente al pasar el cursor."
      },
      {
        "type": "feature",
        "title": "Slider Continuo y Orden Descendente en Más Recomendados por la Comunidad",
        "description": "La sección de Más Recomendados por la Comunidad en el Catálogo ahora también adopta el diseño de slider continuo al tener más de 4 álbumes recomendados, ordenados de forma descendente por calificación comunitaria verificada."
      },
      {
        "type": "feature",
        "title": "Enlace Directo a Spotify y Conteo Inteligente de Canciones en Lanzamientos Anticipados",
        "description": "Cada tarjeta de lanzamiento anticipado ahora cuenta con acceso directo a Spotify (con búsqueda automática de respaldo). El indicador de canciones muestra la cantidad confirmada de pistas y, si aún no se anuncian, muestra 'Por anunciar' en lugar de '0'. Si ya se encuentran disponibles en Spotify, MusicBrainz o Deezer, se sincronizan y descubren automáticamente."
      },
      {
        "type": "improvement",
        "title": "Navegación Fluida y Enfoque Directo al Explorador de Catálogo",
        "description": "Al hacer clic en un formato o categoría (EPs, Sencillos, Compilaciones, Álbumes, etc.) desde la vista de un release, la página viaja de forma suave directamente hasta el 'Explorador de Catálogo y Colección' con el filtro seleccionado activo."
      },
      {
        "type": "fix",
        "title": "Paginación Inteligente en el Explorador de Catálogo",
        "description": "Se corrigió el desplazamiento al cambiar de página en el catálogo: al hacer clic en otra página (ej. página 2, 3 o siguiente), la vista te sitúa suavemente al inicio del Explorador de Catálogo en lugar de enviarte al tope superior de toda la web."
      },
      {
        "type": "fix",
        "title": "Corrección de Traducción en el Botón de Discografía",
        "description": "Se solucionó el bloqueo en el motor de traducción del navegador que mantenía la palabra 'Discografía' en español al traducir la página de detalle de un release a otros idiomas."
      },
      {
        "type": "feature",
        "title": "Sincronización Diaria Inteligente y Enlace Bidireccional de Tendencias con la Base de Datos",
        "description": "Se perfeccionó el flujo de sincronización diaria entre las tablas record_club_releases, record_club_upcoming y albums. Se resolvió la discrepancia donde álbumes vigentes aparecían catalogados como sencillos de una sola pista a pesar de que el LP completo ya se encontraba disponible en el mercado (como Bass Persuades de MILEY, actualizado a Álbum de 10 canciones). Ahora el sistema re-consulta exactamente cada lanzamiento en múltiples APIs (Spotify, Record Club, MusicBrainz y Deezer), prioriza álbumes completos sobre sencillos y sincroniza de forma bidireccional los metadatos y tracks con la tabla principal de albums."
      },
      {
        "type": "feature",
        "title": "Tracklist Confirmado y Pistas Anunciadas en Releases Anticipados",
        "description": "Los lanzamientos anticipados ahora extraen y exhiben de inmediato su listado de canciones oficial anunciado (por ejemplo, Popstar de Tinashe con sus 5 canciones confirmadas: Too Easy, Melatonin, I’d Rather Be Alone, Crash Out y Pillow Fight, con un total de 14 minutos). Se reemplazó el valor genérico de 0 tracks por el conteo real y se habilitó la visualización completa de canciones y duraciones tanto en el Catálogo como en el Detalle del Álbum."
      },
      {
        "type": "improvement",
        "title": "Navegación Fluida Garantizada Post-Carga de Información",
        "description": "Se perfeccionó el scroll suave hacia el Explorador de Catálogo para que se ejecute una vez que toda la información asíncrona de álbumes, estadísticas y tendencias ha terminado de renderizarse por completo. Esto elimina cualquier salto o desajuste de scroll cuando se viaja desde un formato o link directo (como /catalogo?tipo=EP)."
      },
      {
        "type": "feature",
        "title": "Portadas Clicables en Lanzamientos Anticipados",
        "description": "Ahora hacer clic en la carátula o portada de cualquier lanzamiento anticipado te traslada de inmediato al detalle del release, brindando una experiencia más ágil e interactiva."
      },
      {
        "type": "feature",
        "title": "Diseño Móvil Ultra-Optimizado (Tendencias, Anticipados y Explorador)",
        "description": "En smartphones y pantallas reducidas: Tendencias, Anticipados y el Explorador de Catálogo ahora se despliegan de 1 en 1 hacia abajo con un límite dinámico de 10 lanzamientos por página. Los controles de paginación se reorganizaron con ancho flexible sin desbordes fuera de la pantalla. Además, se integró un botón desplegable de filtros y formato para celular y una barra táctil exclusiva e intuitiva para navegar Años y Décadas sin complicaciones."
      },
      {
        "type": "improvement",
        "title": "Calificaciones del Club y Distintivo NEW Inteligente en Tendencias",
        "description": "En la sección de Tendencias, aquellos lanzamientos que ya cuentan con reseñas comunitarias muestran su calificación dorada en la esquina superior derecha (top-2 right-2). Si el lanzamiento aún no cuenta con reseñas y es un nuevo lanzamiento, se exhibe el distintivo NEW en dicha esquina superior derecha; una vez que reciba reseñas en el club, la calificación toma su lugar de forma prioritaria."
      },
      {
        "type": "improvement",
        "title": "Normalización y Llenado Estricto del 100% de Géneros Musicales en la Base de Datos",
        "description": "Se realizó una auditoría y curación exhaustiva en la tabla de albums: el 100% de los lanzamientos (307/307) cuenta ahora con su lista de géneros musicales completa, precisa y estandarizada a un máximo de 3 géneros canónicos depurados. Se eliminaron etiquetas ruidosas o temporales y se integró un normalizador automático para garantizar la consistencia en todas las sincronizaciones futuras."
      },
      {
        "type": "fix",
        "title": "Depuración de Caché en Releases Anticipados",
        "description": "Se eliminaron definitivamente los 5 lanzamientos fantasma de prueba que persistían en caché (Blossoms, Johnny Marr, Greta Van Fleet, Cordae & Anderson .Paak, Lana Del Rey). La sección ahora se nutre única y exclusivamente de los 50 estrenos confirmados y vigentes de Supabase y Record Club."
      },
      {
        "type": "fix",
        "title": "Saneamiento de Caché en el Explorador de Catálogo y Colección",
        "description": "Se limpiaron los álbumes no indexados o inexistentes que se inyectaban en el catálogo desde feeds externos de tendencias. El Explorador ahora exhibe estrictamente los 307 lanzamientos oficiales que forman parte de la base de datos del club, con conteos exactos y navegación directa a las fichas oficiales."
      }
    ]
  },
  {
    "version": "V.9.3",
    "title": "Perfeccionamiento del Pool Musical, Calificaciones en el Historial y Tendencias Musicales al Día",
    "date": "2026-09-22",
    "sha": "9c3b81a",
    "associatedShas": [
      "9c3b81a"
    ],
    "tag": "Mejoras de Experiencia y Pool 9.3",
    "tagColor": "from-emerald-500 via-teal-600 to-cyan-700",
    "authorName": "Eugenio Turcott",
    "summary": "Una actualización pensada en hacer tu experiencia mucho más clara y placentera. Ahora el Historial de Ganadores del Pool te muestra de un vistazo la calificación final de la comunidad directamente sobre la portada. Además, el ganador de la semana cuenta con botones directos para escucharlo en Spotify, Apple Music, YouTube Music o Deezer. Las Tendencias ahora muestran exactamente la cantidad real de canciones de cada disco y responden al instante al querer reseñarlas.",
    "changes": [
      {
        "type": "feature",
        "title": "Calificación Visible en el Historial de Ganadores del Pool",
        "description": "Ahora, al explorar la lista de álbumes que han triunfado en semanas pasadas, verás una insignia con la calificación final que le otorgó la comunidad en la esquina de cada portada, facilitando descubrir los discos mejor evaluados por el club."
      },
      {
        "type": "feature",
        "title": "Escucha Directa en tu Plataforma Favorita para el Ganador del Pool",
        "description": "El álbum ganador de la semana ahora incluye accesos directos con sus logotipos oficiales a Spotify, Apple Music, YouTube Music y Deezer, para que puedas ponerlo a sonar con un solo clic en la aplicación que prefieras."
      },
      {
        "type": "improvement",
        "title": "Indicador Claro de Nominaciones Cerradas en el Pool",
        "description": "Si la ronda de propuestas de la semana ha concluido, el botón para nominar álbumes se atenúa de forma clara y elegante, evitando confusiones y mostrando con precisión cuándo se abrirá la siguiente oportunidad."
      },
      {
        "type": "fix",
        "title": "Graduación Fluida de los Discos Ganadores",
        "description": "Se resolvió el detalle que impedía cerrar y archivar con normalidad la semana de escucha del disco ganador, asegurando que sus notas y reseñas pasen al salón de la fama del club sin pausas."
      },
      {
        "type": "improvement",
        "title": "Conteo Preciso de Canciones en Lanzamientos Populares",
        "description": "Se perfeccionó la información de cada disco en la sección de Tendencias: ahora verás siempre el número exacto de pistas que contiene cada producción, distinguiendo con claridad entre canciones individuales, EPs y álbumes completos."
      },
      {
        "type": "improvement",
        "title": "Apertura Instantánea al Reseñar Lanzamientos en Tendencia",
        "description": "Se corrigió el mensaje de espera en las tarjetas de lanzamientos populares para que los botones respondan al instante y puedas pasar directamente a escuchar, calificar y escribir tu opinión sin demoras."
      },
      {
        "type": "performance",
        "title": "Textos y Tipografía Más Rápidos y Definidos",
        "description": "La letra y estilo visual distintivo de Musiclub ahora se encuentran incorporados dentro de la misma aplicación, permitiendo que todas las pantallas y portadas se vean nítidas y abran de forma ultrarrápida desde cualquier dispositivo."
      }
    ]
  },
  {
    "version": "V.9.2",
    "title": "¡Llegan los Correos Oficiales de Musiclub! Avisos de Nuevos Estrenos a Medianoche, Novedades del Pool y Buzón de Canciones",
    "date": "2026-09-22",
    "sha": "b920a1f",
    "associatedShas": [
      "b920a1f"
    ],
    "tag": "Notificaciones Oficiales por Correo 9.2",
    "tagColor": "from-pink-500 via-purple-600 to-indigo-700",
    "authorName": "Eugenio Turcott",
    "summary": "Gran actualización con el nuevo sistema de correos oficiales de Musiclub bajo nuestro dominio oficial. Ahora puedes activar recordatorios para tus álbumes más esperados y recibir un aviso especial a las 12:00 AM del día de su estreno. Además, entérate al instante de cada ganador semanal del Pool, recibe el resumen con las calificaciones de la comunidad cuando un disco se gradúa, y envía recomendaciones directas de canciones a tus amigos con un hermoso diseño de postal y enlaces directos a Spotify, Apple Music, YouTube Music y Deezer.",
    "changes": [
      {
        "type": "feature",
        "title": "Correos Oficiales desde @musiclub.org con Máxima Seguridad",
        "description": "Lanzamiento del servicio oficial de correos autenticados bajo el dominio musiclub.org. Cuenta con sellos oficiales de seguridad y verificación para garantizar que cada mensaje llegue directamente a tu bandeja principal de entrada y puedas respondernos directamente si tienes cualquier duda."
      },
      {
        "type": "design",
        "title": "Diseño Exclusivo con la Paleta Oficial y Disco de Vinilo",
        "description": "Plantillas visuales construidas con los colores oficiales de Musiclub: Rosa pastel (#FFDBE6), Rosa vibrante (#F57FA2), Lavanda (#56408B), Púrpura (#5A2D7C) y Azul noche (#171433). Cada correo incluye un hermoso disco de vinilo con reflejos de audio y portada que le da un toque retro y elegante."
      },
      {
        "type": "feature",
        "title": "Imágenes Nítidas y Portadas que Siempre Cargan al Instante",
        "description": "Tanto el logo de Musiclub como las portadas de los álbumes viajan integrados directamente dentro del mensaje. Esto asegura que Gmail, Apple Mail y cualquier aplicación de correo muestren las carátulas con la mayor nitidez sin imágenes rotas ni pantallas de carga."
      },
      {
        "type": "feature",
        "title": "Avisos de Estrenos: Confirmación Inmediata y Alerta a Medianoche (12:00 AM)",
        "description": "Activa recordatorios para los discos más esperados: recibirás una confirmación inmediata al pulsar el botón de notificación y un segundo aviso especial a las 12:00 AM exactas del día de estreno para que seas de los primeros en escucharlo."
      },
      {
        "type": "feature",
        "title": "Anuncio del Ganador Semanal del Pool para Toda la Comunidad",
        "description": "Cada vez que la ruleta o la comunidad elige un nuevo disco ganador de la semana en el Pool, todos los miembros reciben una notificación con la portada, el usuario que lo nominó y enlaces a Spotify, Apple Music, YouTube Music y Deezer para comenzar la semana oficial de escucha."
      },
      {
        "type": "feature",
        "title": "Boletín de Graduación con las Calificaciones del Álbum",
        "description": "Al terminar la semana de escucha, enviamos un boletín especial con la nota final otorgada por el club, total de reseñas recibidas, desglose de las 6 notas de producción (Producción, Composición, Letras, Originalidad, Cohesión y Replay Value) y las canciones favoritas de los miembros."
      },
      {
        "type": "feature",
        "title": "Buzón Postal de Canciones con Dedicatoria y Formato de Postal",
        "description": "Sorprende a tus amigos del club recomendándoles canciones: el mensaje llega con un hermoso formato de tarjeta postal, tu dedicatoria personalizada y accesos directos para escuchar la canción en su plataforma de música favorita."
      },
      {
        "type": "feature",
        "title": "Correos Adaptados a Tu Idioma (Español, Inglés, Portugués y Francés)",
        "description": "Todos los correos de Musiclub detectan automáticamente el idioma de cada usuario para ofrecer una experiencia cercana y personalizada a melómanos de cualquier parte del mundo."
      },
      {
        "type": "feature",
        "title": "Novedades Explicadas de Forma Clara y para Todo Público",
        "description": "A partir de ahora, cada actualización y mejora de la plataforma se redacta en un lenguaje sencillo, cálido y enfocado en la música y la experiencia de usuario, dejando atrás tecnicismos innecesarios."
      },
      {
        "type": "fix",
        "title": "Buscador de Amigos Más Cómodo en el Buzón de Recomendaciones",
        "description": "Mejoramos la selección de destinatarios para recomendar música: ahora puedes buscar a cualquier miembro por su nombre, seleccionarlo con un toque y limpiar la selección fácilmente con el nuevo botón de cierre."
      }
    ]
  },
  {
    "version": "V.9.1",
    "title": "Catálogo Musical Perfeccionado: Más Canciones Reales, Portadas en Alta Definición y Datos Exactos de Cada Disco",
    "date": "2026-09-21",
    "sha": "a910f2c",
    "associatedShas": [
      "a910f2c"
    ],
    "tag": "Catálogo y Lanzamientos 9.1",
    "tagColor": "from-emerald-400 via-cyan-500 to-blue-600",
    "authorName": "Eugenio Turcott",
    "summary": "Actualizamos nuestra gran biblioteca de música para que cada álbum, sencillo o EP tenga su lista real y completa de canciones, portadas oficiales en máxima resolución y fechas exactas. Ahora puedes consultar con total precisión las pistas de tus lanzamientos favoritos y disfrutarlos al instante en todas tus plataformas de streaming preferidas.",
    "changes": [
      {
        "type": "feature",
        "title": "Servicio Centralizado de Enriquecimiento Canónico de 21 Columnas (buscador inteligente de música)",
        "description": "Se implementó un servicio centralizado que orquesta la consulta cruzada a Spotify, la biblioteca mundial de música y Deezer para construir y persistir en la base de datos de la biblioteca musical las 21 columnas exactas de cada álbum: id, album_name, artist_name, image_url, spotify_link, youtube_link, apple_music_link, other_link, created_at, tracks, spotify_verified, reviews_enabled, release_date, release_year, código oficial de lanzamiento, release_type, genres, label, country, barcode y total_tracks."
      },
      {
        "type": "feature",
        "title": "Ingesta On-la plataformack en Ficha de Álbum y Endpoint Serverless (/api/albums/enrich)",
        "description": "Al hacer la plataformack en cualquier tarjeta de la sección \"Tendencias del mes\" en Catálogo, el sistema verifica si el álbum ya existe en la base de datos. Si está ausente, ejecuta en segundo plano el enriquecimiento automático multi-API, lo inserta en la biblioteca musical con todas sus columnas y lo enlaza directamente con su nuevo UUID oficial, habilitando de inmediato el reproductor, tracklist y sistema de reseñas."
      },
      {
        "type": "feature",
        "title": "Sincronización Bidireccional en el Pipeline Diario Global (rutina automática)",
        "description": "Nuevo paso automatizado al final del ciclo de sincronización que actualiza de vuelta la tabla record_club_releases con los conteos de canciones y tipos verificados en la tabla albums, garantizando consistencia absoluta 1:1 entre lo que ve el usuario en el feed de tendencias y la información canónica del catálogo."
      },
      {
        "type": "improvement",
        "title": "Aceleración Anti Rate-Limit de 60s a 1.2s en la Automatización Diaria",
        "description": "Se optimizó el intervalo de pausa preventiva entre adiciones de 60 segundos a 1.2 segundos (1200ms), cumpliendo con la directiva oficial de la biblioteca mundial de música de 1 req/s. Esto redujo el tiempo total de procesamiento diario de más de 90 minutos a únicamente 2 minutos para los 100 lanzamientos."
      },
      {
        "type": "fix",
        "title": "Erradicación del Fallback Artificial de 12 Tracks",
        "description": "Se eliminó el valor por defecto arbitrario de 12 canciones que se aplicaba automáticamente a los lanzamientos de Record Club cuando la API pública no entregaba el conteo de pistas, reemplazándolo por validación cruzada con tracks reales de Spotify y la biblioteca mundial de música."
      },
      {
        "type": "fix",
        "title": "Identificación clara de Sencillos, EPs y Álbumes y Fin de Etiquetas Crudas",
        "description": "Se implementó categorización dinámica: lanzamientos de 1 pista se clasifican estrictamente como SENCILLO (como \"Bass Persuades\" de MILEY o \"Ride Lonesome\" de Beck), de 2 a 6 pistas como EP y de 7 en adelante como ALBUM. Además, se refinó el componente TrendingMonthlySection para no mostrar la cadena cruda en mayúsculas \"ALBUM\" cuando un conteo esté en proceso de carga."
      },
      {
        "type": "fix",
        "title": "Desambiguación Flexible de Títulos (Soporte para Versiones Deluxe y Remasters)",
        "description": "El normalizador ahora filtra automáticamente sufijos entre paréntesis o corchetes como \"(Rare N' Deluxe)\" o \"[Remastered]\", permitiendo que álbumes con títulos expandidos (como \"Detour\" de Kim Petras) hagan match de inmediato con sus registros correspondientes y reciban sus 13 pistas reales."
      },
      {
        "type": "fix",
        "title": "Corrección de Integridad en el Método getAlbumByNameAndArtist de la biblioteca musical",
        "description": "Se añadió el alias getAlbumByNameAndArtist en el la plataformaente de la biblioteca musical apuntando a findAlbum, solucionando una excepción que interrumpía llamadas de creación directa de álbumes."
      }
    ]
  },
  {
    "version": "V.9.0",
    "title": "Radar de Tendencias Musicales Matutino: Los 100 Discos Más Populares del Mundo y Alertas de Estreno",
    "date": "2026-09-18",
    "sha": "d900a1f",
    "associatedShas": [
      "d900a1f"
    ],
    "tag": "Radar de Tendencias y Novedades 9.0",
    "tagColor": "from-amber-400 via-rose-500 to-indigo-600",
    "authorName": "Eugenio Turcott",
    "summary": "Estrenamos el nuevo Radar de Tendencias que actualiza cada mañana el Top 100 de álbumes más escuchados y los 50 próximos estrenos más esperados del planeta. Ahora puedes apartar tus álbumes favoritos para recibir alertas por correo y disfrutar de un nuevo diseño con discos de vinilo gigantes y elegantes que decoran la plataforma.",
    "changes": [
      {
        "type": "feature",
        "title": "Sistema de Notificaciones Inmediatas por Correo para Próximos Estrenos",
        "description": "Se implementó un motor completo de envío de correos electrónicos transaccionales que despacha una confirmación personalizada de inmediato al momento en que el usuario activa una alerta en un lanzamiento anticipado. El correo incluye diseño responsive oscuro con la estética cyberpunk de Musiclub, portada HD del álbum, fecha oficial de estreno, mensaje explicativo del recordatorio y acceso directo con enlace canónico al release."
      },
      {
        "type": "feature",
        "title": "Vinilos de Marca Gigantes de Fondo (Watermark al 25%) y Refuerzo Frontal",
        "description": "Despliegue de los isotipos y vinilos oficiales de Musiclub integrados como marca de agua en gran escala con rotación continua suave (animate-spin-slow) calibrados al 25% de opaimágenes integradas en alta calidadad en 13 vistas clave (Ficha de Álbum, Perfil, Catálogo, Leaderboard, Pool, Gaversiónpon, Patch Notes, FAQ, Reseñas, Configuración, Tier List, Ficha de Artista y Playlists). Se reforzó la opaimágenes integradas en alta calidadad y filtros backdrop-blur de todas las tarjetas y paneles frontales para garantizar máxima nitidez y legibilidad."
      },
      {
        "type": "feature",
        "title": "Automatización Diaria a las 08:00 AM en Segundo Plano",
        "description": "Se configuró un motor de sincronización diario desatendido que se ejecuta cada mañana a las 08:00 AM. Utiliza rutas de ejecución absolutas y sistema automático optimizado que garantiza la carga fiable del entorno y persistencia del estado en la biblioteca musical."
      },
      {
        "type": "feature",
        "title": "Expansión al Top 100 Global de Popularidad & 50 Próximos Estrenos",
        "description": "La consulta del ranking semanal amplía su cobertura a los 100 lanzamientos de mayor impacto mundial, complementada en paralelo con los 50 estrenos anticipados más prometedores con orden cronológico y medidores de anticipación."
      },
      {
        "type": "feature",
        "title": "Estadísticas Globales de Catálogo en Base de Datos",
        "description": "Ingesta y almacenamiento diario de métricas macro del ecosistema musical (+4,127,529 lanzamientos registrados y +3,340,692 artistas y discografías) para consulta instantánea desde la base de datos sin latencia de red."
      },
      {
        "type": "feature",
        "title": "Enlaces Universales Garantizados: Spotify, Apple Music, YouTube Music y Deezer",
        "description": "Se implementó un estándar estricto en la plataforma donde ningún álbum carece de acceso a las 4 grandes plataformas. Tanto la ingesta automática como el buscador manual y las fichas de álbum completan dinámicamente enlaces verificados de búsqueda directa hacia YouTube Music y Apple Music."
      },
      {
        "type": "feature",
        "title": "Ingesta Inteligente al Catálogo con Portadas Oficiales y Tracklists HD",
        "description": "Los lanzamientos en tendencia no registrados en el club son analizados con comparativa anti-duplicados y agregados al catálogo general con carátulas oficiales en alta resolución, conteo y lista completa de canciones, duraciones precisas y metadata canónica."
      },
      {
        "type": "improvement",
        "title": "Protección Preventiva de Cadencia y Control Anti-Saturación",
        "description": "El flujo de ingesta respeta una cadencia preventiva de 1 minuto por álbum agregado, salvaguardando la cuota de peticiones y evitando bloqueos o pantallas de espera y pausas de cargas en los servicios de metadata oficiales."
      },
      {
        "type": "improvement",
        "title": "Actualización Retroactiva de Enlaces en Álbumes Existentes",
        "description": "Se ejecutó una revisión y actualización a todos los álbumes históricos de la base de datos, garantizando que el 100% cuente con sus enlaces operativos a YouTube Music y Apple Music."
      },
      {
        "type": "fix",
        "title": "Ajuste de Pantalla Completa y Cobertura en Modales de Alerta",
        "description": "Se corrigió el padding y posicionamiento del modal de confirmación de estrenos anticipados, asegurando que el fondo desenfocado y oscuro cubra el 100% del viewport sin franjas visibles superiores ni desajustes responsivos."
      }
    ]
  },
  {
    "version": "V.8.12",
    "title": "Identidad Visual Renovada: Discos de Vinilo Giratorios, Carrusel Infinito de Tendencias y Nueva Navegación",
    "date": "2026-09-18",
    "sha": "c812e9b",
    "associatedShas": [
      "c812e9b"
    ],
    "tag": "Identidad y Animaciones",
    "tagColor": "from-pink-500 via-purple-500 to-cyan-500",
    "authorName": "Eugenio Turcott",
    "summary": "Una experiencia mucho más inmersiva y musical: ahora verás vinilos giratorios con movimiento suave en toda la plataforma, un carrusel dinámico e interactivo para descubrir álbumes en tendencia y una tabla de posiciones organizada cómodamente página por página.",
    "changes": [
      {
        "type": "feature",
        "title": "Slider Automático Continuo en \"En Rotación & Tendencias\"",
        "description": "En vez de apilarse hacia abajo en filas múltiples, la sección presenta un slider automático inteligente: si existen hasta 4 lanzamientos (en Pool Activo, Top Obras Maestras o Recientes) permanece en una fila estática limpia y no se mueve; si existen más de 4, se activa el desplazamiento continuo infinito a 60 FPS con halo de desvanecimiento en los bordes, pausa automática al posar el cursor (hover) y botón de control de estado en vivo."
      },
      {
        "type": "feature",
        "title": "Elementos Gráficos de Marca y Vinilos Giratorios Continuos",
        "description": "Se desplegaron los isotipos oficiales musiclub_logo, musiclub_logo_2, musiclub_logo_3, musiclub_logo_4 y musiclub_logo_corchea en AppHeader, Footer, Catálogo Musical, Leaderboard, Pool Comunitario, Patch Notes, FAQ, Playlists, Reseñas, Configuración de Perfil, Ficha de Artista, Ficha de Álbum, Ruleta Gaversiónpon y Release de la Hora. Todos los vinilos cuentan con rotación perpetua suave (animate-spin-slow), aura ambiental luminosa y escala responsiva acorde a cada vista."
      },
      {
        "type": "feature",
        "title": "Paginación de 15 Usuarios en Leaderboard de Miembros",
        "description": "El ranking de la comunidad ahora muestra hasta 15 usuarios por página con controles de paginación interactivos (anterior/siguiente y salto directo de página), indicador de rango global (ej. \"Mostrando 1 - 15 de 42 miembros\") y auto-scroll fluido a la cabecera del listado al cambiar de página."
      },
      {
        "type": "improvement",
        "title": "Acceso Directo al Gaversiónpon Arcade en Selector Rápido",
        "description": "El botón de la máquina tragamonedas en el Selector Rápido del Club fue sustituido por un acceso directo al Gaversiónpon Arcade (/gaversiónpon) con vinilo giratorio neón musiclub_logo_3 e isotipo corchea en la cabecera."
      },
      {
        "type": "improvement",
        "title": "Primera Reseña Histórica en Release Recomendado de la Hora",
        "description": "En el componente de Release Recomendado de la Hora, la Reseña Destacada de la Comunidad ahora presenta con precisión cronológica la primera reseña que se registró históricamente en la plataforma para dicho lanzamiento, incluyendo su fecha original de registro."
      },
      {
        "type": "improvement",
        "title": "Aislamiento de la plataformacs en Insignias del Leaderboard",
        "description": "Al hacer la plataformac en el botón \"+N más\" o en las insignias de un usuario en el Leaderboard, la interacción se aísla de forma precisa para abrir la guía detallada de medallas sin activar involuntariamente el modal de perfil de usuario completo."
      },
      {
        "type": "fix",
        "title": "Estabilidad de Hooks en Release Recomendado de la Hora",
        "description": "Se corrigió el orden de ejecución de hooks en HourlyRecommendedRelease, garantizando el cumplimiento riguroso de las Reglas de Hooks de React y erradicando advertencias en la consola."
      }
    ]
  },
  {
    "version": "V.8.11",
    "title": "Nombres de Canciones, Álbumes y Artistas Siempre Fieles y en su Idioma Original",
    "date": "2026-09-18",
    "sha": "a47f920",
    "associatedShas": [
      "a47f920"
    ],
    "tag": "Fidelidad Musical",
    "tagColor": "from-cyan-500 via-teal-500 to-blue-600",
    "authorName": "Eugenio Turcott",
    "summary": "Protegemos la identidad de tu música favorita: ahora los títulos de las canciones, los nombres de los discos y los artistas se mantienen intactos en su idioma original sin traducciones automáticas extrañas de los navegadores.",
    "changes": [
      {
        "type": "feature",
        "title": "Guardián Central y Observador Reactivo de Entidades Intraducibles",
        "description": "Se implementó un sistema de registro global en memoria (registerUntranslatableEntities) y un MutationObserver reactivo de micro-tareas (setupUntranslatableObserver) en translateCrashGuard.js. Cualquier nodo del pantalla generado dinámicamente que coinimágenes integradas en alta calidada con un lanzamiento, artista o usuario registrado recibe de inmediato los atributos translate=\"no\" y las clases notranslate, evitando cualquier mutación por traductores de navegador."
      },
      {
        "type": "improvement",
        "title": "Ingesta Reactiva Centralizada en Hooks useAlbums y useUserReviews",
        "description": "Los hooks globales del catálogo y de reseñas sincronizan automáticamente en tiempo real todos los títulos de lanzamientos (album_name), nombres de artistas (artist_name), nombres de críticos (reviewer_name) y creadores (added_by) en la base de datos de entidades blindadas en cuanto se cargan o actualizan desde la biblioteca musical."
      },
      {
        "type": "security",
        "title": "Blindaje en Detalle de Álbum, Tracklist y Sistema de Calificación",
        "description": "En AlbumDetail y ReviewSystem se blindaron el título principal del release, todos los nombres de pistas en la lista de reproducción, la insignia de canción favorita comunitaria y personal, y los encabezados individuales del wizard de evaluación de canciones."
      },
      {
        "type": "improvement",
        "title": "Blindaje en Tarjetas de Catálogo, Artistas y Secciones Curadas",
        "description": "Se asignaron atributos translate=\"no\" y clases semánticas notranslate, music-title y artist-name en todas las tarjetas del Catálogo (activas, individuales e inactivas en AlbumGrid), enlaces del componente ArtistLinks, directorio de artistas (CatalogArtistsView), y en los 84 lanzamientos semanales, sencillos anticipados y álbumes recomendados de TrendingMonthlySection, AnticipatedSection y RecommendedSection."
      },
      {
        "type": "improvement",
        "title": "Blindaje en Tier List, Ruleta Gaversiónpon y Buzón Musical",
        "description": "En el creador de Tier Lists se aseguraron las tarjetas de álbumes y el autor. En la ruleta Gaversiónpon se protegió la cápsula revelada, el historial y el modal cinematográfico. En SongMailbox y SendSongRecommendationModal se blindaron remitentes, destinatarios, nombres de canciones, artistas y resultados de búsqueda de Spotify."
      },
      {
        "type": "improvement",
        "title": "Blindaje en Perfiles de Usuario y Buscadores Universales",
        "description": "Se blindó el nombre de usuario en la barra de navegación superior (AppHeader), menús desplegables, ficha de Mi Perfil (UserProfile) y modal de miembro (MemberProfileModal), incluyendo artistas y álbumes favoritos. Asimismo, el buscador universal del header (HeaderAlbumSearch) y el explorador de álbumes (AlbumSearch) protegen en tiempo real todos los resultados, títulos y pistas sugeridas."
      }
    ]
  },
  {
    "version": "V.8.10",
    "title": "Creador de Listas de Álbumes (Tier List) Rediseñado para Celulares e Historias de Redes Sociales",
    "date": "2026-09-17",
    "sha": "e5c1a89",
    "associatedShas": [
      "e5c1a89"
    ],
    "tag": "Tier Lists en Celular",
    "tagColor": "from-purple-500 via-pink-500 to-rose-500",
    "authorName": "Eugenio Turcott",
    "summary": "Organiza y califica tus álbumes favoritos con el nuevo formato adaptado a la pantalla de tu celular. Perfecto para tomar captura y compartir tus mejores discos en historias de Instagram o con tus amigos del club.",
    "changes": [
      {
        "type": "feature",
        "title": "Límite de Máximo 20 (Top) Releases por Tier",
        "description": "Para erradicar la saturación visual de decenas de carátulas diminutas amontonadas, cada categoría de la Tier List muestra ahora estrictamente hasta los mejores 20 álbumes evaluados (Top 20). Si un tier contiene más de 20 discos, el indicador lateral refleja con transparencia \"Top 20 de X discos\", priorizando la crème de la crème del usuario."
      },
      {
        "type": "improvement",
        "title": "Tipografía Aumentada y de Alta Legibilidad en Pantallas Móviles",
        "description": "Se incrementó significativamente la escala tipográfica en todo el Canvas: el encabezado sube a 32px con subtítulo de 16px; las letras de tier crecen a 58px; los nombres y píldoras de puntuación aumentan a 14px y 13px respectivamente; y el distintivo de calificación en cada carátula pasa a 17px en color oro brillante con sombra de contraste, garantizando una lectura nítida e instantánea en cualquier celular."
      },
      {
        "type": "improvement",
        "title": "Retícula Móvil de 5 Columnas con Portadas de 154px",
        "description": "La bandeja de discos para celular adopta una cuadrícula optimizada de 5 carátulas por fila de 154x154 px cada una. Con el tope de 20 álbumes, cada tier forma una retícula geométrica perfecta de hasta 4 filas completas sin huecos asimétricos, llenando la proporción 19.5:9 de pantallas de teléfono sin franjas negras."
      },
      {
        "type": "fix",
        "title": "Redondeo Estricto Hacia Abajo (Math.floor) en Rangos de Tiers",
        "description": "Se corrigió el problema donde calificaciones con decimales altos (por ejemplo, 9.48 o 9.46) se redondeaban hacia arriba con toFixed(1), mostrando \"★ 9.5\" dentro del Tier MUY BUENOS cuyo rango oficial es 8.5 - 9.4. Ahora, todas las calificaciones se truncan estrictamente hacia abajo al primer decimal (roundDownScore), preservando la coherencia absoluta entre el puntaje impreso y el subtítulo del tier. Las calificaciones perfectas de 10 se formatean limpiamente como \"★ 10\"."
      },
      {
        "type": "fix",
        "title": "Centrado Vertical Matemático de Insignias Laterales en Cada Fila",
        "description": "El bloque de la insignia (letra de tier, nombre en mayúsculas, píldora de rango y contador de discos) se posiciona exactamente en el centro vertical de la fila (rowHeight / 2), eliminando el espacio vacío inferior."
      },
      {
        "type": "feature",
        "title": "Modal versiónreTierListModal Ultra-Responsivo Móvil-First (100dvh)",
        "description": "El modal de compartir Tier List adopta la experiencia móvil fija (100dvh / 430px) de versiónreReviewModal. Incluye cabecera con el Nivel de Melómano del usuario, previsualización interactiva con selector de formato (📱 Celular Story vs 🖥️ Panorámica), botón prominente de Compartir Nativo (Web versiónre API) y accesos directos a Instagram, WhatsApp, TikTok, Threads, X, Facebook y Telegram."
      }
    ]
  },
  {
    "version": "V.8.9",
    "title": "Tarjetas de Reseñas Más Bonitas para Compartir, Nivel de Melómano y Canción Favorita Destacada",
    "date": "2026-09-17",
    "sha": "d3f8a14",
    "associatedShas": [
      "d3f8a14"
    ],
    "tag": "Diseño de Reseñas",
    "tagColor": "from-fuchsia-500 via-pink-500 to-rose-500",
    "authorName": "Eugenio Turcott",
    "summary": "Mejoramos el diseño visual para compartir tus reseñas: las calificaciones ahora lucen más elegantes y centradas, se muestra tu nivel de experiencia en la comunidad y tu canción favorita tiene un lugar de honor en la tarjeta.",
    "changes": [
      {
        "type": "fix",
        "title": "Centrado Milimétrico de la Calificación dentro de su Contenedor",
        "description": "Se corrigió el desfase donde la calificación aparecía empujada hacia la parte inferior del contenedor gradiente. Al aplicar `textBaseline = \"middle\"` y calcular el anclaje exacto en `pillY + pillH / 2`, el puntaje (ej. `★ 9.6 /10` o `★ 10/10`) queda perfectamente centrado en los ejes vertical y horizontal sin sobresalir del borde."
      },
      {
        "type": "fix",
        "title": "Alineación de Fecha a la Retícula Principal e Iconografía Vectorial Limpia",
        "description": "La píldora de fecha superior derecha ahora se acopla con exactitud al límite de 1016px de la retícula general (alineada al divisor, tarjetas y pie de página). Se eliminó el emoji `🗓️` que en WebKit/iOS generaba cajas blancas no renderizadas y desplazaba la métrica de texto, sustituyéndolo por un icono vectorial nativo de calendario y tipografía centrada matemáticamente."
      },
      {
        "type": "feature",
        "title": "Nivel de Melómano y XP Real del Usuario bajo el Nombre de Perfil",
        "description": "El subtítulo del crítico ahora muestra su rango honorífico de gamificación y sus puntos de experiencia reales obtenidos en Estadísticas Detalladas (por ejemplo: \"🪐 Enciclopedia Sonora · 9,450 XP\"). La información se sincroniza en vivo con la tabla de clasificación de la comunidad, reconociendo el estatus y trayectoria del usuario en cada reseña compartida."
      },
      {
        "type": "improvement",
        "title": "Integración Armónica de Canción Favorita en la Tarjeta de Impresiones",
        "description": "Se eliminó la caja amarilla aislada de canción favorita que resultaba visualmente discordante con el estilo oscuro de la Story. El track favorito ahora se posiciona con elegancia dentro de la fila de impresiones del crítico junto a la emoción musical, optimizando el espacio vertical y permitiendo que la reseña respire con una jerarquía impecable y responsiva."
      }
    ]
  },
  {
    "version": "V.8.8",
    "title": "Perfeccionamiento Visual en las Reseñas del Club y Tarjetas de Calificación 10/10",
    "date": "2026-09-17",
    "sha": "b9d4f21",
    "associatedShas": [
      "b9d4f21"
    ],
    "tag": "Elegancia Visual",
    "tagColor": "from-rose-500 via-pink-600 to-purple-600",
    "authorName": "Eugenio Turcott",
    "summary": "Ajustes de diseño para que tus opiniones musicales luzcan impecables: tipografías más legibles, márgenes balanceados y un formato visual claro para lucir tus mejores calificaciones.",
    "changes": [
      {
        "type": "improvement",
        "title": "Encabezado Dinámico por Tipo de Lanzamiento (EP, Compilación, Single, etc.)",
        "description": "El indicador de formato en la parte superior izquierda ahora reconoce de manera automática la naturaleza del disco evaluado, mostrando con exactitud \"CRÍTICA DE ÁLBUM\", \"CRÍTICA DE EP\", \"CRÍTICA DE COMPILACIÓN\", \"CRÍTICA DE SENCILLO\", \"CRÍTICA DE EN VIVO\" o \"CRÍTICA DE SOUNDTRACK\", enriqueciendo el contexto editorial de la Story."
      },
      {
        "type": "improvement",
        "title": "Espaciado Armónico entre Portada y Título (Separación de 36px)",
        "description": "Se recalibró la distancia vertical entre la carátula centrada (415x415 px) y el título del álbum, implementando una separación libre de 36px y anclaje tipográfico superior (top baseline). Esto elimina el efecto de contacto visual donde las letras tocaban directamente la base de la imagen."
      },
      {
        "type": "fix",
        "title": "Centrado Milimétrico en Criterio \"PRODUCCIÓN\" y Normalización Emoji",
        "description": "Se resolvió el bug de renderizado en navegadores WebKit/iOS Safari donde el glifo de consola (🎛️) incluía un selector de variación Unicode (\\uFE0F) que alteraba el cálculo de ancho en el texto centrado, desplazando la etiqueta hacia la derecha. Al normalizar el emoji y establecer alineación vertical media (middle baseline), la caja de Producción queda con la misma simetría y centrado exacto que los otros cinco criterios."
      },
      {
        "type": "fix",
        "title": "Zona Segura para la Fecha Superior y Margen Balanceado en Footer",
        "description": "La píldora con la fecha de la reseña ahora respeta un margen de seguridad derecho de 115px para evitar cortes en pantallas móviles alargadas y prevenir que quede tapada por los botones nativos de Instagram Stories. En el footer, el separador vertical (|) se posiciona con un espaciado equidistante de 18px respecto a musiclub.org y la leyenda de la comunidad."
      },
      {
        "type": "improvement",
        "title": "Formateo Pulido de Calificaciones Perfectas (10/10 en vez de 10.0/10)",
        "description": "Las notas de 10 puntos se formatean de forma natural como \"10/10\" y en la cabecera como \"★ 10\", prescindiendo del decimal redundante (\".0\") en la imagen de la Story, en la vista previa del modal y en los textos predefinidos para redes sociales."
      }
    ]
  },
  {
    "version": "V.8.7",
    "title": "Nueva Experiencia Móvil para Compartir Reseñas en Historias de Redes Sociales",
    "date": "2026-09-17",
    "sha": "a7f3e12",
    "associatedShas": [
      "a7f3e12"
    ],
    "tag": "Historias para Redes",
    "tagColor": "from-pink-500 via-purple-600 to-indigo-600",
    "authorName": "Eugenio Turcott",
    "summary": "Comparte tus opiniones musicales con un solo toque: tarjetas verticales con la portada del disco en grande, resumen de tu nota y botones rápidos para guardar y compartir con tus amigos.",
    "changes": [
      {
        "type": "feature",
        "title": "Arquitectura Celular Nativa y Ultra-Responsiva (100dvh)",
        "description": "Reconstrucción integral del componente versiónreReviewModal orientada primordialmente a teléfonos celulares. El modal aprovecha el 100% de la altura dinámica de pantalla (100dvh) y sustituye los mockups rígidos con marcos gruesos y notches fijos por un contenedor fluido y flexible. La vista previa 9:16 se escala proporcionalmente en tiempo real mediante flex-1 y object-contain, garantizando que el diseño completo (cabecera, preview, selector de temas y barra de acciones) se mantenga visible y accesible en cualquier resolución y modelo de smartphone sin desbordamientos."
      },
      {
        "type": "improvement",
        "title": "Diseño Fijo y Depuración de Controles (Sin Ajustes ni Vinilo 3D)",
        "description": "Se eliminó por completo la sección de \"Ajustes de la Story\" (el checkbox de disco de vinilo 3D y los switches de visibilidad de comentario, pilares y tracks). El diseño ahora es completamente fijo, estándar y editorial, calculando automáticamente y sin fricción la inclusión armónica de los datos reales de la reseña, ofreciendo una experiencia instantánea y sin pasos intermedios."
      },
      {
        "type": "improvement",
        "title": "Canvas 2D 9:16 con Carátula Centrada y Resplandor Temático",
        "description": "El generador gráfico Canvas en 1080x1920 centra la portada del álbum en el eje horizontal (430x430 px) con esquinas redondeadas de 26px, resplandor ambiental temático y borde de acento. Se descartó el trazado de vinilos salientes para otorgar absoluto protagonismo a la carátula, logrando una estética moderna, limpia y de alto impacto para Instagram Stories, WhatsApp Status y TikTok."
      },
      {
        "type": "feature",
        "title": "Barra de Acciones Fija y Carrusel Táctil de Redes Sociales",
        "description": "Se centralizaron todas las vías de difusión en un panel inferior fijo con respeto al safe-area móvil: botón principal prominente \"Compartir Story\" con soporte Web versiónre API nativo de archivos, barra de utilidades (Descargar HD 1080x1920, Copiar Imagen al portapapeles y Copiar Enlace) y una tira horizontal táctil con botones oficiales de marca para Instagram, WhatsApp, TikTok, Threads, X, Facebook, Telegram y Snapchat."
      },
      {
        "type": "feature",
        "title": "Selector Rápido de Temas Estéticos en Píldoras Táctiles",
        "description": "Se integró un selector táctil compacto directamente bajo la vista previa con 4 temas visuales (🌌 Neon, 🖤 Onyx, 💿 Retro, 🔮 Cyber), permitiendo alternar la paleta cromática, gradientes y resplandores de la Story con un solo toque y previsualización reactiva en tiempo real."
      }
    ]
  },
  {
    "version": "V.8.6",
    "title": "Tarjetas de Reseñas para Historias de Celular con Mayor Legibilidad y Elegancia",
    "date": "2026-09-15",
    "sha": "e5c4a23",
    "associatedShas": [
      "e5c4a23"
    ],
    "tag": "Diseño para Celular",
    "tagColor": "from-pink-500 via-purple-500 to-indigo-500",
    "authorName": "Eugenio Turcott",
    "summary": "Nuevo formato vertical estilizado y letras más nítidas para que presumir tus opiniones y descubrimientos musicales en redes sociales sea más fácil y atractivo que nunca.",
    "changes": [
      {
        "type": "feature",
        "title": "Tipografía de Alta Legibilidad y Comentarios Dinámicos (29px–36px)",
        "description": "El tamaño de la tipografía del comentario de la reseña en las Stories 9:16 fue incrementado significativamente, pasando de los 22px anteriores a un rango dinámico de 29px a 36px con interlineado holgado de 41px a 50px según la longitud del texto. Se agregó una comilla estilizada de apertura (“) de 48px y texto blanco de alto contraste sobre fondos oscuros translúimágenes integradas en alta calidados, garantizando una lectura inmediata y cómoda en teléfonos celulares."
      },
      {
        "type": "feature",
        "title": "Distribución Vertical Adaptativa y Centrado Automático",
        "description": "Se eliminaron las coordenadas fijas del lienzo de historias. Un nuevo algoritmo calcula la altura acumulada de las tarjetas visibles (crítico, canción favorita, comentario, 6 pilares, tracks destacados) y aplica un espaciado proporcional (gap adaptativo de 14px a 26px) con centrado vertical en el lienzo de 1080x1920. Esto elimina por completo los huecos muertos y vacíos espaciales cuando se activan o desactivan elementos."
      },
      {
        "type": "improvement",
        "title": "Envoltura Inteligente de Títulos Multi-Línea (48px–52px)",
        "description": "El nombre del lanzamiento ahora cuenta con soporte dinámico de hasta 2 líneas a 48px–52px para títulos largos (hasta 940px de ancho). Se incrementó la tipografía del artista a 32px, la píldora de fecha a 20px, la cabecera a 38px y el dominio canónico de pie de página a 28px."
      },
      {
        "type": "fix",
        "title": "Flex-Wrap en Canciones Destacadas contra Desbordamientos",
        "description": "Se implementó un algoritmo de flujo multi-fila en la sección de canciones destacadas. El sistema mide individualmente el ancho del texto y el badge de puntuación de cada pista, distribuyendo las píldoras en filas continuas sin sobrepasar el ancho de la tarjeta y erradicando cualquier recorte visual en el margen derecho."
      },
      {
        "type": "improvement",
        "title": "Zonas Seguras Calibradas para Instagram, TikTok y WhatsApp",
        "description": "Se optimizaron las distancias de seguridad superior (220px) e inferior (120px) en el lienzo de 1080x1920. Los encabezados, carátula, datos y enlaces de Musiclub se mantienen 100% visibles y libres de solapamiento con los controles de interfaz nativos de Stories y estados móviles."
      },
      {
        "type": "feature",
        "title": "Modal de Compartir 100% Responsivo con Pestañas Móviles",
        "description": "Rediseño responsivo del componente versiónreReviewModal en dispositivos móviles. En pantallas pequeñas se incorpora un control segmentado con pestañas dedicadas: \"📱 Vista Previa Story\" (con mockup de teléfono, selector táctil de temas y acciones directas) y \"⚙️ Ajustes & Redes\" (con switches de personalización y cuadrícula de redes sociales). Mantiene además una barra inferior fija (sticky bottom bar) para compartir o descargar en un solo toque, y preserva la vista de 2 columnas en escritorio."
      }
    ]
  },
  {
    "version": "V.8.5",
    "title": "Gran Renovación del Catálogo de Música: Exploración por Géneros y Perfiles de Artistas Claros",
    "date": "2026-09-11",
    "sha": "85f09cb",
    "associatedShas": [
      "85f09cb",
      "c149eb0",
      "fa720d1",
      "4e58b12"
    ],
    "tag": "Exploración Musical",
    "tagColor": "from-cyan-500 via-pink-500 to-amber-500",
    "authorName": "Eugenio Turcott",
    "summary": "Navegar por la música que amas ahora es más sencillo: explora discos organizados por género musical con páginas fluidas y disfruta de perfiles de artistas ordenados sin confusiones de nombres.",
    "changes": [
      {
        "type": "feature",
        "title": "Navegación Integral del Catálogo (Releases, Artistas, Géneros)",
        "description": "Se implementó una barra superior persistente con pestañas dedicadas para Releases, Artistas y Géneros (omitiendo Labels). Cada pestaña cuenta con sincronización bidireccional en URL (?tab=releases, ?tab=artists, ?tab=genres) y vistas optimizadas tanto en móvil como en escritorio."
      },
      {
        "type": "feature",
        "title": "Paginación Inteligente en la Exploración por Géneros",
        "description": "Se incorporó un sistema de paginación reactivo y autónomo para cada categoría dentro del explorador de géneros. En la vista global de \"Todos los Géneros\", cada bloque limita la muestra a 10 álbumes por página (2 filas de 5), evitando la sobrecarga visual de listas infinitas. En la vista aislada por género, muestra 15 álbumes por página. Incluye controles completos de navegación (primera página, anterior, selector numérico con elipsis, siguiente, última página) y acceso directo \"Ver solo [Género]\"."
      },
      {
        "type": "database",
        "title": "Sincronización Diaria Idempotente en la biblioteca musical (Tendencias y Próximos Releases)",
        "description": "Diseño y despliegue del esquema de tablas en la biblioteca musical para almacenamiento local persistente: record_club_releases (84 lanzamientos semanales en tendencia) y record_club_upcoming (50 lanzamientos anticipados de alta expectativa). Se implementó un control de idempotencia diaria mediante la tabla record_club_sync_state, asegurando una única consulta automática al día (programada a las 04:00 AM) para consultar todo 100% desde la base de datos propia sin saturar servicios externos."
      },
      {
        "type": "feature",
        "title": "Ranking de Expectativa y Selector de Próximos Estrenos (10 vs 50 Releases)",
        "description": "La sección de lanzamientos anticipados ahora muestra badges de popularidad y expectativa (#1 Hype, #2 Hype, etc.) e integra un control interactivo para alternar con fluidez entre el top 10 inicial y la lista extendida de los 50 estrenos confirmados más esperados a nivel global."
      },
      {
        "type": "feature",
        "title": "Tendencias Semanales con Ranking Global de Popularidad (84 Lanzamientos)",
        "description": "Módulo de lanzamientos más destacados de la semana sincronizado con el ranking global oficial, con badges de desempeño (\"🔥 #1 Popularity This Week\", \"Top 3 Global\", \"Tendencia Semanal\"), corte semanal cada viernes y métricas de impacto en vivo."
      },
      {
        "type": "feature",
        "title": "Releases Anticipados con Bloqueo Preventivo de Reseñas",
        "description": "Soporte completo para álbumes y EPs anunciados oficialmente que aún no salen al mercado. Se pueden indexar y explorar en la plataforma con ficha técnica completa y slug canónico, pero sus calificaciones y sistema de reseñas se mantienen bloqueados mediante una directiva estricta hasta su fecha de estreno oficial."
      },
      {
        "type": "feature",
        "title": "Releases Más Recomendados por los Miembros del Club",
        "description": "Nueva sección que filtra y ranquea los álbumes con reseñas y opiniones verificadas en Musiclub, ordenados mediante una función de balance entre puntuación media comunitaria y volumen de críticas."
      },
      {
        "type": "feature",
        "title": "Directorio de Artistas y Desambiguación Multi-Artista en Colaboraciones",
        "description": "Nuevo directorio de artistas con buscador en vivo, filtro alfabético (A-Z, #) y tarjetas con avatares circulares y conteo de lanzamientos. Mediante el nuevo componente ArtistLinks y el algoritmo splitArtists(), colaboraciones complejas como \"piri & tommy, piri, Tommy Villiers\" ahora se descomponen en 3 enlaces individuales e independientes."
      },
      {
        "type": "database",
        "title": "Tabla Canónica de Artistas en la biblioteca musical y Registro de la plataformacs",
        "description": "Creación de la tabla canónica artists en la biblioteca musical con campos de slug, biografía, seguidores, popularidad y la plataformack_count. Cada vez que un usuario interactúa con un enlace de artista, se registra y actualiza la popularidad del perfil en la base de datos."
      },
      {
        "type": "feature",
        "title": "Exploración de Géneros Más Famosos con Recomendaciones Fallback (<5)",
        "description": "Catálogo de los 10 géneros más trascendentes de la música (Pop, Rock, Hip-Hop, Indie, Electrónica, R&B, Latino, Metal, Jazz, Folk). Cuando un género cuenta con menos de 5 lanzamientos en la base de datos, el sistema despliega automáticamente una selección de obras maestras recomendadas listas para reseñar."
      },
      {
        "type": "fix",
        "title": "Resolución Integral de Hydration Mismatch en navegación instantánea",
        "description": "Se erradicó el error de hidratación en /catalogo originado por la lectura prematura de parámetros de URL en el servidor. Se estableció una inicialización determinista de pestañas combinada con sincronización asíncrona post-hidratación en useEffect y un límite de contención con <Suspense>."
      },
      {
        "type": "fix",
        "title": "Filtro Anti-Impostores y Eliminación de Spam IA (Caso Olivia Rodrigo)",
        "description": "Se añadió una lista negra estricta de pistas falsas generadas por IA y títulos publicitarios (bloqueando \"Dunya Will Betray You\" en Olivia Rodrigo y \"Artist Spotlight\"). Se configuró una verificación de autor primario exacto que valida a.id === resolvedArtistId en la el catálogo oficial de Spotify."
      },
      {
        "type": "feature",
        "title": "Formato Canónico de Slugs [Artista]-[Release] y Soporte Deluxe (+)",
        "description": "Estandarización de URLs de álbumes al formato [artista]-[release] (ej. /albumes/rosalia-motomami). Se incorporó normalización para variantes deluxe con el símbolo \"+\" (e.g. MOTOMAMI + se convierte en rosalia-motomami-plus), resolviendo colisiones entre versiones estándar y extendidas."
      }
    ]
  },
  {
    "version": "V.8.4",
    "title": "Explorador de Tendencias del Año y Mejor Búsqueda en la Web",
    "date": "2026-09-10",
    "sha": "0ead842",
    "associatedShas": [
      "0ead842",
      "92dff34",
      "96bd466",
      "bb626a3",
      "6396867",
      "47ce38d"
    ],
    "tag": "Tendencias del Año",
    "tagColor": "from-orange-500 via-amber-500 to-cyan-500",
    "authorName": "Eugenio Turcott",
    "summary": "Descubre los mejores álbumes del año en tiempo real con una interfaz moderna y rápida, facilitando que nuevos amantes de la música encuentren el club desde cualquier buscador.",
    "changes": [
      {
        "type": "feature",
        "title": "Diseño Híbrido del Catálogo en Catálogo (/catalogo)",
        "description": "Transformación visual y funcional del catálogo: nuevo encabezado con cinta de métricas en vivo (4,113,018+ releases disponibles, 2,988,705+ artistas y discografías sincronizadas vía Spotify/la biblioteca mundial de música, conteo de reseñas y top #1 del club), píldoras de navegación segmentada (Tendencias 2026, Calificados en Club, Todo el Catálogo), buscador rápido con botón de limpieza y cuadrícula simétrica de 20 álbumes por página (4 filas × 5 columnas)."
      },
      {
        "type": "feature",
        "title": "Explorador en Vivo de Álbumes Más Famosos y Tendencia de 2026",
        "description": "Se implementó una consulta multi-mercado (Regional MX y Global) a el catálogo oficial de Spotify filtrando estrictamente por año en curso (year:2026). Para superar el límite estricto de 10 resultados de Spotify, el servicio ejecuta peticiones paralelas con offsets de 0 a 70 mediante Promise.all con caché en memoria en el servidor, entregando en menos de 90ms los álbumes más reproduimágenes integradas en alta calidados de 2026 (Karol G, Drake, Olivia Rodrigo, Bruno Mars, BTS, Ariana Grande, Feid, Quevedo, Peso Pluma, etc.)."
      },
      {
        "type": "filter",
        "title": "Filtro Estricto de Calidad (Cero Singles Sueltos)",
        "description": "El feed de tendencias descarta automáticamente singles de 1 a 3 canciones, previews instrumentales y compilaciones genéricas publicitarias (Artist Spotlight). El catálogo presenta exclusivamente LPs completos y EPs de calidad sustancial, garantizando una curaduría musical especializada de máxima calidad."
      },
      {
        "type": "feature",
        "title": "Tarjetas Interactivas y Acción de Reseña On-Demand",
        "description": "Cada tarjeta de álbum cuenta con badges flotantes en vidrio esmerilado con formato (ALBUM, EP), badge resplandeciente \"🔥 Tendencia 2026\" o score comunitario con estrellas. Para álbumes aún no calificados, el botón interactivo \"✍️ Reseñar en Club\" permite iniciar una reseña al instante incorporando el álbum bajo demanda, garantizando que la base de datos se mantenga siempre limpia de spam."
      },
      {
        "type": "optimization",
        "title": "Arquitectura Modular de guías para buscadores de internet Index (SEO Maestro)",
        "description": "Reemplazo del guías para buscadores de internet plano por un guías para buscadores de internet Index maestro (guías para buscadores de internet.xml) compuesto por 4 submódulos independientes: guías para buscadores de internet-core.xml (páginas principales), guías para buscadores de internet-reviews.xml (álbumes con reseñas), guías para buscadores de internet-catalog.xml (catálogo general) y guías para buscadores de internet-artists.xml (perfiles de artistas), indexando más de 560 URLs optimizadas para motores de búsqueda."
      },
      {
        "type": "fix",
        "title": "Blindaje de Base de Datos y Pausa de Ingesta Innecesaria",
        "description": "Se verificó y blindó la tabla de la biblioteca musical conservando intactos los 156 álbumes calificados de la comunidad y pausando rutinas de scraping o ingesta periódica no solicitada. Todo el flujo de nuevos lanzamientos funciona ahora bajo demanda pura."
      },
      {
        "type": "optimization",
        "title": "Alineación de Despliegue en Vercel y Workflow de Releases",
        "description": "Configuración explícita de framework el motor de Musiclub en vercel.json eliminando reglas SPA legadas, y creación de workflow de automatización continua en actualizaciones automáticas continuas para versionado y publicación de releases automáticos."
      }
    ]
  },
  {
    "version": "V.8.3",
    "title": "Perfiles de Artistas Impecables: Discografías Completas y Cero Confusiones de Bandas",
    "date": "2026-09-10",
    "sha": "9ab5784",
    "associatedShas": [
      "9ab5784",
      "2166fef"
    ],
    "tag": "Perfiles de Artistas",
    "tagColor": "from-pink-500 via-purple-500 to-indigo-600",
    "authorName": "Eugenio Turcott",
    "summary": "Separamos con precisión artistas que comparten nombres similares y trajimos la discografía oficial completa para que encuentres exactamente la música de tus bandas preferidas.",
    "changes": [
      {
        "type": "fix",
        "title": "Depuración y Exactitud Absoluta en Discografías de Spotify (Caso BENEE)",
        "description": "Se solucionó la aparición de lanzamientos ajenos en la discografía de artistas (como \"Beneefit\", \"Sonayah Benee\" o \"Sebita Benee\" en el perfil de BENEE). Se reestructuró getArtistDiscography() en spotifyApi.js para priorizar la consulta directa al endpoint oficial /v1/artists/{id}/albums con include_groups=album,single,compilation, eliminando coinimágenes integradas en alta calidadencias difusas por subcadenas y garantizando que cada lanzamiento pertenezca estrictamente al artista mediante comprobación exacta de ID y nombre."
      },
      {
        "type": "fix",
        "title": "Resolución Rigurosa de Artistas y Supresión de Falsos Homónimos (Caso BIBI)",
        "description": "Se erradicó el bug de coinimágenes integradas en alta calidadencia laxa en findAlbumsByArtist() que provocaba que consultas de artistas con nombres breves como \"BIBI\" asociaran lanzamientos de artistas diferentes como \"Bibie\" / \"Bibie Clarel\". Se implementó un algoritmo estricto de comparación basado en slugs normalizados y detección precisa de colaboraciones (feat., ft., &, /, x, with)."
      },
      {
        "type": "optimization",
        "title": "Resolución Inteligente de Metadatos y URLs en Rutas de Artista (/artista/[slug])",
        "description": "En ArtistDetail.jsx y en la ruta de servidor de el motor de Musiclub (/artista/[slug]), se preserva la intención original del slug decodificado para la consulta de Spotify y la generación de etiquetas SEO (OpenGraph, Twitter Cards y ficha técnica para buscadores ficha técnica para buscadores), impidiendo que mayúsculas estilizadas (ej. \"BIBI\", \"BENEE\", \"AC/DC\", \"MF DOOM\") sean alteradas por coinimágenes integradas en alta calidadencias locales parciales."
      },
      {
        "type": "feature",
        "title": "Deduplicación Avanzada con Preservación de Ediciones Deluxe",
        "description": "Al clasificar y deduplicar la discografía devuelta por Spotify, si existen versiones estándar y versiones extendidas/deluxe de un mismo título y tipo de lanzamiento, el motor conserva automáticamente la edición con mayor cantidad de canciones, garantizando la colección más completa disponible para la comunidad."
      },
      {
        "type": "feature",
        "title": "Emblema Giratorio de Musiclub en Hero Banner del Artista",
        "description": "Se integró el isotipo oficial musiclub_logo.png en el encabezado principal de cada artista con animación fluida continua (spin-slow), simulando la rotación de un vinilo y aportando identidad visual cyberpunk a la experiencia."
      },
      {
        "type": "feature",
        "title": "Tarjetas de Lanzamiento Interactivas y Acción \"Reseñar en Club\"",
        "description": "Toda la superficie de las tarjetas de discografía ahora es interactiva con cursor y feedback visual. Se actualizó la acción de \"Proponer al Club\" a \"Reseñar en Club\", permitiendo a los miembros abrir directamente el álbum si ya existe o prepararlo instantáneamente para comenzar su reseña con un solo toque."
      },
      {
        "type": "optimization",
        "title": "Purga Integral de Base de Datos y Adopción de Modelo On-Demand",
        "description": "Se depuraron 2,121 lanzamientos residuales sin reseñas en la biblioteca musical para evitar ruido y spam en el catálogo. La base de datos ahora alberga exclusivamente lanzamientos con actividad y reseñas reales de los miembros, adoptando un esquema de ingesta bajo demanda idéntico al estándar de plataformas musicales profesionales."
      },
      {
        "type": "feature",
        "title": "Catálogo Híbrido con Pestaña de \"Tendencias & Novedades\"",
        "description": "Se introdujo en el Catálogo Musical (/catalogo) un selector de vistas dual: \"En el Club\" (con las estadísticas, décadas y calificaciones comunitarias) y \"Tendencias & Novedades\" (lanzamientos frescos obtenidos en tiempo real de Spotify). Permite filtrar por álbumes, EPs y sencillos, buscar en vivo y reseñar cualquier novedad con un solo la plataformac bajo demanda."
      },
      {
        "type": "feature",
        "title": "Caché Rotatorio Resiliente en la biblioteca musical (trending_releases)",
        "description": "Para garantizar cero caídas y alta veloimágenes integradas en alta calidadad ante cortes o límites de cuotas de APIs externas, se diseñó la tabla rotatoria trending_releases en la biblioteca musical respaldada por la ruta Edge /api/trending. Si la API externa experimenta fallas o saturación, el catálogo sirve instantáneamente el último snapshot de respaldo sin interrumpir la navegación."
      }
    ]
  },
  {
    "version": "V.8.2",
    "title": "Biblioteca Expandida a Más de 2,200 Álbumes y Selección de Canciones Favoritas",
    "date": "2026-09-10",
    "sha": "d8391f5",
    "tag": "Gran Catálogo",
    "tagColor": "from-cyan-500 via-blue-500 to-indigo-600",
    "authorName": "Eugenio Turcott",
    "summary": "Una enorme expansión de música en el club: más de 2,200 álbumes disponibles para reseñar, opción de elegir tu canción favorita de cada disco y herramientas más cómodas para la comunidad.",
    "changes": [
      {
        "type": "fix",
        "title": "Carga Completa del Catálogo Universal (2,277+ Lanzamientos)",
        "description": "Se solucionó la limitación de 1,000 filas de el catálogo de canciones/la biblioteca musical mediante consultas por rangos (.range()), permitiendo que el Centro de Mando cargue y cuantifique la totalidad de los 2,277+ álbumes en el contador de métricas y en la tabla de administración."
      },
      {
        "type": "fix",
        "title": "Resolución Fidedigna de Canción Favorita en Reseñas",
        "description": "En la moderación de reseñas, las canciones favoritas que se guardaron como IDs de Spotify (como \"7oWkK4yK2saversiónqMtcPVXI\" en WILD de KATSEYE) ahora se resuelven y muestran con su nombre de pista real (\"Animal\"), integrando la lista de tracks del álbum y el diccionario de correspondencias conoimágenes integradas en alta calidado."
      },
      {
        "type": "feature",
        "title": "Paginación Completa en el Centro de Mando (AdminPanel)",
        "description": "Nuevo componente reutilizable de paginación con salto dinámico de página, botones con elipsis, selector de filas por página (\"Por pág\"), botones anterior/siguiente y contador de rango (Mostrando X - Y de Z). Se implementó en el Catálogo Universal (25/50/100 filas), en Moderación de Reseñas (10/20/50 filas), en Usuarios & Perfiles (10/20/50 filas), en el Pool Semanal y en la cuadrícula de Temporadas."
      },
      {
        "type": "fix",
        "title": "Sincronización de Conteo de Miembros de la Comunidad (21 Miembros)",
        "description": "Resolución de la disparidad entre los 21 perfiles registrados en la base de datos de la biblioteca musical y los 19 reviewers que se mostraban en la Landing Page y en la tarjeta de Reviewers Únicos. Se actualizó la función getGlobalStats() en la biblioteca musicalla plataformaent.js y las vistas de LandingPage y Reviews para priorizar el censo de perfiles registrados de la comunidad (21) bajo la denominación unificada \"Críticos & Miembros\"."
      }
    ]
  },
  {
    "version": "V.8.1",
    "title": "Nueva Tipografía Oficial Gabarito y Tarjetas de Reseña Mejoradas para Celular",
    "date": "2026-09-10",
    "sha": "HEAD",
    "tag": "Nueva Tipografía",
    "tagColor": "from-pink-500 via-rose-500 to-amber-500",
    "authorName": "Eugenio Turcott",
    "summary": "Musiclub estrena la elegante tipografía Gabarito en toda la web y actualiza sus logotipos oficiales, brindando una lectura más cómoda y una estética moderna en teléfonos móviles.",
    "changes": [
      {
        "type": "fix",
        "title": "Unificación Tipográfica Global con Gabarito",
        "description": "Corrección de clases residuales de \"Stack Sans Notch\" en el Catálogo de Álbumes, Pool Semanal, Panel de Administración y la sección de Estadísticas Detalladas de Perfil (Tier List Maker). La tipografía Gabarito ahora se aplica de forma homogénea y fidedigna en el 100% de las vistas."
      },
      {
        "type": "design",
        "title": "Nueva Plantilla de Review Story 9:16 Adaptada a Celulares",
        "description": "Rediseño completo del generador Canvas de Stories: distribución vertical con márgenes seguros adaptados para pantallas de smartphone (respetando la barra superior y el campo de comentarios inferior de Instagram/TikTok). Incluye carátula con resplandor ambiental, disco de vinilo 3D, badges glassmorphic de puntuación, canción favorita, pilares de evaluación y textos nítidos en Gabarito."
      },
      {
        "type": "feature",
        "title": "Experiencia Móvil Optimizada en Modal de Compartir",
        "description": "Chasis de vista previa responsivo con escalado automático para cualquier resolución de móvil y barra fija inferior (\"Sticky Bottom Bar\") en celular con botones directos para Compartir Nativo y Descargar Story HD en un solo toque."
      },
      {
        "type": "design",
        "title": "Actualización Universal de Logotipos Oficiales",
        "description": "Reemplazo del antiguo recurso provisional por el isotipo oficial de la corchea de Musiclub (/musiclub_logo_corchea.png) con fallback a /musiclub_logo_3.png en las imágenes generadas de Tier List, cabeceras interactivas, plantilla de Stories y metadatos SEO."
      }
    ]
  },
  {
    "version": "V.8.0",
    "title": "Gran Salto en Velocidad: Carga Instantánea de Páginas y Navegación Ultrarrápida",
    "date": "2026-09-10",
    "sha": "HEAD",
    "tag": "Velocidad Instantánea",
    "tagColor": "from-pink-500 via-purple-500 to-indigo-500",
    "authorName": "Eugenio Turcott",
    "summary": "Transformación completa en el motor de la plataforma para que Musiclub abra a la velocidad de la luz. Las páginas cargan al instante, los menús responden con total fluidez y la experiencia musical es más placentera.",
    "changes": [
      {
        "type": "feature",
        "title": "Arquitectura el motor de Musiclub 16 App Router con carga rápida e ISR",
        "description": "Transformación integral desde una SPA a una arquitectura híbrida de alto rendimiento impulsada por navegación instantánea. Cada página de álbum (/albumes/[slug]) y artista (/artista/[slug]) se genera en el servidor con ISR (revalidate de 1 hora), garantizando tiempos de respuesta ultrarrápidos y entrega de HTML pre-renderizado completo en el primer byte."
      },
      {
        "type": "feature",
        "title": "Indexación SEO Avanzada y ficha técnica para buscadores ficha técnica para buscadores Nativo",
        "description": "Generación en servidor de metadatos dinámicos (<title>, meta description, oficial URLs, tarjetas Open Graph con portadas oficiales de alta resolución) e inyección directa en el HTML inicial de scripts ficha técnica para buscadores estructurados (MusicAlbum, MusicGroup, valoraciones comunitarias y tracks con duración y numeración). Ahora validadores como validator.ficha técnica para buscadores y los rastreadores de Googlebot indexan el catálogo musical al 100% de forma inmediata."
      },
      {
        "type": "design",
        "title": "Nueva Identidad Tipográfica Universal: Gabarito",
        "description": "Adopción de la fuente Google Fonts \"Gabarito\" como la tipografía principal y universal de Musiclub. Su diseño geométrico, moderno y con gran legibilidad encaja a la perfección con la estética cyber-punk/neón de la plataforma, optimizada para carga sin parpadeo mediante next/font con display=swap."
      },
      {
        "type": "fix",
        "title": "Blindaje contra Mismatches de Hidratación en Autenticación",
        "description": "Resolución de discrepancias entre el servidor y el la plataformaente causadas por lecturas síncronas de la memoria de tu navegador en tu cuenta conectada, AppHeader y useNotifications. La sesión se hidrata de forma segura post-montaje, preservando la coherencia del pantalla y evitando caídas o advertencias en consola."
      },
      {
        "type": "performance",
        "title": "Generación Dinámica de guías para buscadores de internet con +4,300 URLs",
        "description": "Pipeline automatizado que compila e incluye más de 4,300 URLs indexables en public/guías para buscadores de internet.xml antes de cada compilación de producción, conectando todo el catálogo de lanzamientos directamente a Google Search Console."
      }
    ]
  },
  {
    "version": "V.7.9",
    "title": "Navegación Más Ágil, Fluida y Libre de Anuncios Molestos",
    "date": "2026-09-09",
    "sha": "HEAD",
    "tag": "Navegación Limpia",
    "tagColor": "from-amber-500 via-orange-500 to-red-500",
    "authorName": "Eugenio Turcott",
    "summary": "Aceleramos los tiempos de carga en toda la plataforma y limpiamos la experiencia de navegación para que disfrutes de la música sin interrupciones.",
    "changes": [
      {
        "type": "performance",
        "title": "Optimización Crítica de Veloimágenes integradas en alta calidadad de Carga y Rendimiento",
        "description": "Eliminación del cuello de botella que ralentizaba la web: supresión del bucle de microtareas del MutationObserver en el banner de anuncios, retiro del script síncrono bloqueante de Social Bar, purga de fuentes tipográficas en desuso en el head (dejando Figtree optimizado con display=swap) y migración de la regla CSS de fuentes hacia herencia limpia nativa, restaurando la veloimágenes integradas en alta calidadad de carga instantánea del sitio."
      },
      {
        "type": "fix",
        "title": "Desactivación Preventiva del Banner y Filtrado de Contenido",
        "description": "Desactivación temporal del banner publicitario en la Landing Page y Footer mientras se completan las exclusiones de categorías en la red publicitaria para erradicar anuncios para adultos (18+), citas/dating internacional, alertas engañosas de software y contenido no familiar, manteniendo un entorno 100% seguro, limpio y acorde a la comunidad de Musiclub."
      }
    ]
  },
  {
    "version": "V.7.8",
    "title": "Lectura Cómoda y Navegación 100% Limpia",
    "date": "2026-09-09",
    "sha": "HEAD",
    "tag": "Comodidad Visual",
    "tagColor": "from-emerald-500 via-teal-500 to-cyan-500",
    "authorName": "Eugenio Turcott",
    "summary": "Adoptamos una tipografía más suave y clara para la vista y eliminamos ventanas emergentes para que tu experiencia en el club sea tranquila y disfrutable.",
    "changes": [
      {
        "type": "improvement",
        "title": "Adopción Universal de Tipografía Figtree (Google Fonts)",
        "description": "Implementación de la fuente Figtree (pesos 300 a 900) como la tipografía única y universal para el 100% de la plataforma: encabezados principales, títulos h1-h6, subtítulos, texto corrido, botones, tablas, navegación y componentes interactivos, brindando una experiencia visual de máxima legibilidad, elegancia contemporánea y nitidez en cualquier resolución."
      },
      {
        "type": "fix",
        "title": "Erradicación Definitiva del Formato Popunder (Onla plataformack)",
        "description": "Retiro integral del script de anuncios Popunder para proteger la experiencia del usuario y evitar aperturas de ventanas indeseadas en el navegador. Se garantiza que todas las interacciones (búsquedas, la plataformacs en enlaces, botones o elementos de la interfaz) permanezcan exclusivamente dentro del flujo de la aplicación."
      }
    ]
  },
  {
    "version": "V.7.7",
    "title": "Máquina Gashapon Cinemática y Mejor Clasificación de Géneros Musicales",
    "date": "2026-09-09",
    "sha": "HEAD",
    "tag": "Gashapon Musical",
    "tagColor": "from-pink-500 via-purple-500 to-indigo-500",
    "authorName": "Eugenio Turcott",
    "summary": "Disfruta de una divertida máquina estilo arcade para descubrir discos al azar con efectos visuales emocionantes y un catálogo de música mejor organizado.",
    "changes": [
      {
        "type": "feature",
        "title": "Gaversiónpon Cinemático de Cápsulas a Pantalla Completa",
        "description": "Evolución visual del Gaversiónpon: apertura de cápsulas en un modal cinemático a pantalla completa con backdrop blur oscuro, modelado a gran escala, animaciones de flotación y apertura física, rayos dorados y renderizado centrado libre de recortes o desbordes superiores."
      },
      {
        "type": "improvement",
        "title": "Universalización del Gaversiónpon a Todo el Catálogo",
        "description": "Eliminación de la terminología de Ex-Pool y status individual en el Gaversiónpon: adaptación completa a la arquitectura de release_type (álbumes, singles y EPs), permitiendo que cualquier lanzamiento de la base de datos pueda ser obtenido en la ruleta."
      },
      {
        "type": "feature",
        "title": "Monetización Estratégica con anuncios de apoyo (Modo Claro/Oscuro Blindado)",
        "description": "Integración cuidada de formatos oficiales de anuncios de apoyo (Native Banner colocado estratégicamente entre el Navbar y el Hero de la Landing, Social Bar y Smartlink de apoyo en footer). Incluye blindaje de alto contraste universal que fuerza texto blanco (#f8fafc) sin importar el tema claro/oscuro del dispositivo, MutationObserver reactivo y soporte de la opción onlyImages para modo solo imágenes."
      },
      {
        "type": "improvement",
        "title": "Auto-Sanación Continua de Metadatos (código oficial de lanzamiento & Géneros)",
        "description": "Creación de populateMissingcódigo oficial de lanzamientoAndGenres.mjs e integración en el cron de actualizaciones automáticas continuas (minutos 17 y 47 para evitar cuellos de botella). Consulta rate-limited (1.25s) a la biblioteca mundial de música con backoff exponencial y fallback a Deezer para poblar automáticamente identificadores código oficial de lanzamiento y etiquetas de géneros faltantes."
      },
      {
        "type": "fix",
        "title": "Sincronización de Métricas de Comunidad (Críticos & Reviewers)",
        "description": "Alineación del cálculo de usuarios entre la Landing Page (\"Críticos & Miembros\") y la sección de Reseñas (\"Reviewers Únicos\"). Ambos módulos y el servicio global consultan ahora a los 19 críticos activos que han publicado reseñas, eliminando discrepancias contra perfiles sin actividad."
      },
      {
        "type": "fix",
        "title": "Corrección de Salto Visual en Menú Desplegable de Comunidad",
        "description": "Estabilización de posición y transiciones CSS en el menú dropdown del AppHeader, eliminando el reacomodo tardío de layout al abrirse y garantizando una apertura fluida y perfectamente centrada."
      }
    ]
  },
  {
    "version": "V.7.6",
    "title": "Exploración Continua sin Interrupciones y Música Siempre Disponible en Deezer",
    "date": "2026-09-08",
    "sha": "HEAD",
    "tag": "Música sin Pausas",
    "tagColor": "from-rose-500 via-red-500 to-amber-500",
    "authorName": "Eugenio Turcott",
    "summary": "Garantizamos que puedas navegar y escuchar música de manera continua sin pausas ni pantallas de espera, añadiendo enlaces directos a Deezer para escuchar cada canción.",
    "changes": [
      {
        "type": "security",
        "title": "Tope Estricto de Espera Anti-Freeze en Retry-After",
        "description": "Detección y limitación de tiempos de espera en respuestas HTTP pantallas de espera a un máximo de 5 segundos. Si la el catálogo oficial de Spotify solicita pausas prolongadas (como penalizaciones de miles de segundos), el proceso cancela la espera a 0s y pausa Spotify para esa tanda, previniendo congelamientos indefinidos."
      },
      {
        "type": "feature",
        "title": "Fallback Automático e Instantáneo a la integración con Deezer",
        "description": "Implementación de getDeezerAlbumDetails en rutina automática: cuando Spotify entra en pantallas de espera y pausas de carga o no responde, el sistema conmuta en tiempo real a Deezer para obtener el tracklist oficial completo, duraciones en milisegundos y portada HD sin interrumpir la ejecución."
      },
      {
        "type": "improvement",
        "title": "Pacing Preventivo de Red (250ms)",
        "description": "Ampliación del intervalo entre consultas individuales de álbumes a 250ms, reduciendo la frecuencia en más del 50% y evitando la saturación de cuotas por ventana deslizante en las APIs externas."
      },
      {
        "type": "improvement",
        "title": "Persistencia Garantizada y Blindaje de Inserción",
        "description": "Aseguramiento de que cualquier lote de lanzamientos recolectado antes de una eventualidad de red se procese e inserte directamente en la biblioteca musical, protegiendo el avance del catálogo y actualizando el guías para buscadores de internet canónico."
      }
    ]
  },
  {
    "version": "V.7.5",
    "title": "Actualización Automática y Continua de la Biblioteca Musical",
    "date": "2026-09-08",
    "sha": "HEAD",
    "tag": "Catálogo Siempre Fresco",
    "tagColor": "from-blue-500 via-indigo-500 to-violet-500",
    "authorName": "Eugenio Turcott",
    "summary": "El catálogo de música ahora se actualiza solo en segundo plano, incorporando nuevos lanzamientos y álbumes clásicos para que siempre tengas música fresca para descubrir.",
    "changes": [
      {
        "type": "feature",
        "title": "Migración de Flujo en actualizaciones automáticas continuas a Smart Catalog Seeder",
        "description": "Sustitución definitiva del crawler secuencial de la biblioteca mundial de música por el motor inteligente de siembra en .github/workflows/hourly_la biblioteca mundial de música_ingest.yml, asegurando que cada 30 minutos se ingesten únicamente álbumes populares completos con portadas HD y enlaces oficiales de streaming."
      },
      {
        "type": "improvement",
        "title": "Selector Dinámico de Cuota en Actions (workflow_dispatch)",
        "description": "Inclusión de un parámetro interactivo \"target\" en actualizaciones automáticas continuas para permitir ejecuciones manuales desde la interfaz web de GitHub eligiendo la cantidad de álbumes a sembrar (50, 100, etc.), manteniendo un valor predeterminado de 50 en la ejecución periódica automatizada."
      },
      {
        "type": "improvement",
        "title": "Persistencia de Estado del Seeder en Git",
        "description": "Actualización de la rutina de versionado automático en Actions para mejoraear rutina automática en lugar del antiguo crawler_state.json, conservando el avance continuo de offsets, artistas y décadas sin repeticiones."
      },
      {
        "type": "improvement",
        "title": "Ping Canónico de Indexación",
        "description": "Notificación directa a los motores de búsqueda utilizando la URL canónica estricta https://www.musiclub.org/guías para buscadores de internet.xml para acelerar el rastreo de nuevos lanzamientos."
      }
    ]
  },
  {
    "version": "V.7.4",
    "title": "Crecimiento Inteligente del Catálogo: Novedades del Año, Tendencias y Grandes Clásicos",
    "date": "2026-09-08",
    "sha": "HEAD",
    "tag": "Colección Musical",
    "tagColor": "from-amber-500 via-orange-500 to-rose-500",
    "authorName": "Eugenio Turcott",
    "summary": "Incorporamos una selección balanceada de la mejor música: estrenos recientes, los álbumes más populares del momento y joyas de décadas pasadas con todas sus canciones completas.",
    "changes": [
      {
        "type": "feature",
        "title": "Motor de Siembra Inteligente (Smart Catalog Seeder)",
        "description": "Implementación de rutina automática que orquesta la ingesta de lanzamientos basada en demanda real: 65% novedades y estrenos de 2026, 20% artistas y discos de máxima relevancia y tendencia mundial, y 15% clásicos consagrados por década (70s, 80s, 90s, 2000s, 2010s y 2020s)."
      },
      {
        "type": "improvement",
        "title": "Filtro Estricto de Calidad y Álbumes Completos (Tracks >= 4)",
        "description": "Filtrado obligatorio que descarta sencillos promocionales de 1 a 3 temas, bootlegs, versiones de karaoke, tributos no oficiales y pistas instrumentales caseras, asegurando que cada nuevo registro en Musiclub sea una obra completa con tracklist íntegro, duraciones oficiales y portadas HD."
      },
      {
        "type": "security",
        "title": "Blindaje de Red: Timeouts de 8s, Pacing y Control de Tasa (pantallas de espera)",
        "description": "Incorporación de AbortSignal con timeouts estrictos de 8 segundos en todas las llamadas HTTP hacia Spotify y Deezer, pausas preventivas de 120ms entre peticiones, lectura de cabeceras Retry-After y reintentos exponenciales para garantizar estabilidad continua sin saturar las APIs."
      },
      {
        "type": "feature",
        "title": "Deduplicación Instantánea en Memoria a 0ms",
        "description": "Precarga ultrarrápida del catálogo existente desde la biblioteca musical en un set hash en memoria para evitar colisiones, sobreescrituras innecesarias o desperdicio de cuota de búsqueda."
      },
      {
        "type": "improvement",
        "title": "Comando la plataforma \"npm run seed\" y Conexión al Demonio Periódico",
        "description": "Nuevo comando directo en package.json (npm run seed -- --target=100 --guías para buscadores de internet) y modernización del demonio automático (rutina automática) para mantener la base de datos viva, actualizada y sincronizada cada 30 minutos."
      },
      {
        "type": "improvement",
        "title": "Crecimiento del Catálogo y Expansión del guías para buscadores de internet a 3,660+ URLs",
        "description": "Incorporación exitosa de más de 140 álbumes populares (Kendrick Lamar, Taylor Swift, Pink Floyd, Nirvana, Radiohead, The Weeknd, Dua Lipa, Rosalía, Drake, Bruno Mars, entre otros) elevando la base a 1,815 álbumes y actualizando public/guías para buscadores de internet.xml a 3,666 URLs canónicas indexables."
      }
    ]
  },
  {
    "version": "V.7.3",
    "title": "Dominio Oficial www.musiclub.org y Acceso Más Fácil desde Buscadores",
    "date": "2026-09-08",
    "sha": "HEAD",
    "tag": "Sitio Oficial",
    "tagColor": "from-emerald-500 via-teal-500 to-cyan-500",
    "authorName": "Eugenio Turcott",
    "summary": "Musiclub consolida su presencia oficial en internet bajo su dirección www.musiclub.org, facilitando que nuevos melómanos nos encuentren rápidamente en Google.",
    "changes": [
      {
        "type": "feature",
        "title": "Blindaje Canónico Universal y Normalización de URLs",
        "description": "Eliminación de etiquetas canónicas estáticas en public/index.html y creación de normalización automática en el componente central SEO.jsx para forzar siempre URLs absolutas con www y HTTPS, resolviendo el cuello de botella de \"Página con redirección\" y \"Descubierta: actualmente sin indexar\" en Google Search Console."
      },
      {
        "type": "improvement",
        "title": "Optimización de Metadatos y Rich Snippets para Búsquedas de Reviews",
        "description": "Reestructuración de títulos en AlbumDetail posicionando el nombre del álbum al inicio para consultas como \"{Álbum} Reviews\", metadescripciones dinámicas con puntuación promedio y cantidad de reseñas, y enriquecimiento de ficha técnica para buscadores ficha técnica para buscadores (MusicAlbum, MusicGroup, AggregateRating y Reviews individuales con itemReviewed) para estrellas doradas en Google."
      },
      {
        "type": "feature",
        "title": "Redirección 308 de dominio Vercel (vercel.json) y Doble Capa Defensiva",
        "description": "Configuración de vercel.json con reglas HTTP 308 permanentes para transferir toda la autoridad y tráfico de musiclub-albums.vercel.app y musiclub.org hacia https://www.musiclub.org, preservando el enrutamiento SPA y añadiendo un script de redirección instantánea en el la plataformaente."
      },
      {
        "type": "improvement",
        "title": "Regeneración Masiva de guías para buscadores de internet con 3,370+ URLs Indexables",
        "description": "Paginación exhaustiva en rutina automáticaías para buscadores de internet.js que indexa más de 1,600 álbumes de la base de datos de la biblioteca musical, artistas y rutas estáticas prioritarias incluyendo /portadas y /playlists bajo el dominio canónico oficial."
      },
      {
        "type": "improvement",
        "title": "Metadatos SEO en Vistas Secundarias",
        "description": "Implementación de componentes SEO dedicados con títulos y metadescripciones optimizadas en las páginas de Reseñas (/reviews), Leaderboard (/leaderboard), Playlists (/playlists), Recomendaciones (/recomendaciones) y Gaversiónpon Arcade (/gaversiónpon)."
      }
    ]
  },
  {
    "version": "V.7.2",
    "title": "Tu Música en Todas Partes: Enlaces Garantizados a Spotify, Apple Music, YouTube y Deezer",
    "date": "2026-09-07",
    "sha": "HEAD",
    "tag": "Enlaces Universales",
    "tagColor": "from-purple-500 via-fuchsia-500 to-indigo-500",
    "authorName": "Eugenio Turcott",
    "summary": "Ahora cada álbum del club cuenta con enlaces directos a las 4 plataformas de audio más populares, para que escuches tus discos en tu aplicación favorita con un solo clic.",
    "changes": [
      {
        "type": "feature",
        "title": "Resolución Universal de Deezer (other_link) en la Ingesta de Álbumes",
        "description": "Al registrar o calificar cualquier nuevo álbum desde el buscador global o explorador, el sistema ahora extrae enlaces de Deezer directamente desde las relaciones de la biblioteca mundial de música o genera un enlace canónico de búsqueda inteligente (https://www.deezer.com/search/...), asegurando que other_link nunca quede nulo."
      },
      {
        "type": "improvement",
        "title": "Botón de Deezer Siempre Activo en Álbumes Históricos",
        "description": "En AlbumDetail y HourlyRecommendedRelease, si un álbum existente en la base de datos no contaba previamente con other_link, la interfaz genera automáticamente en tiempo real el enlace de búsqueda de Deezer con el nombre del artista y álbum, garantizando que los 4 reproductores de streaming (Spotify, Apple Music, YouTube y Deezer) estén siempre 100% operativos."
      },
      {
        "type": "improvement",
        "title": "Optimización de Enlaces en createAlbum y Buscadores",
        "description": "Refuerzo en el la plataformaente de la biblioteca musical (createAlbum), HeaderAlbumSearch y AlbumSearch para normalizar y blindar la persistencia de los 4 enlaces de streaming sin penalizar la veloimágenes integradas en alta calidadad de respuesta ni requerir peticiones bloqueantes adicionales."
      }
    ]
  },
  {
    "version": "V.7.1",
    "title": "¡Califica tus Portadas de Discos Favoritas y Recibe Recomendaciones cada Hora!",
    "date": "2026-09-07",
    "sha": "v7.1",
    "tag": "Arte de Portadas",
    "tagColor": "from-amber-500 via-orange-500 to-rose-500",
    "authorName": "Eugenio Turcott",
    "summary": "Llega el calificador de arte de portadas: vota por las carátulas más hermosas de la música, descubre sugerencias musicales que cambian cada hora y disfruta de un menú más ordenado.",
    "changes": [
      {
        "type": "feature",
        "title": "Calificador y Explorador de Portadas de Álbumes (Cover Art Ratings)",
        "description": "Nuevo módulo dedicado en /portadas para evaluar el arte gráfico y visual de las portadas de discos (escala del 1 al 10 con medallas honoríficas de dirección de arte). Incluye etiquetado estético (Fotografía, Ilustración, Minimalista, Psicodélico, Surrealista, Cyberpunk, etc.), podio de mejores carátulas, filtros avanzados y vista modal de detalles visuales."
      },
      {
        "type": "feature",
        "title": "Lanzamiento Recomendado Cada Hora en la Landing Page",
        "description": "Sección dinámica en la página de inicio que rota determinísticamente un álbum del catálogo cada 60 minutos: exhibe su portada en alta definición, la reseña más elocuente de la comunidad, promedio ponderado, enlaces directos a las 4 plataformas de streaming y acceso instantáneo para calificar o debatir."
      },
      {
        "type": "fix",
        "title": "Blindaje Defensivo Crítico en Búsqueda y Detalle de Álbumes (Fix toFixed Crash)",
        "description": "Corrección definitiva al error de renderizado (\"TypeError: Cannot read properties of undefined (reading toFixed)\") que bloqueaba la interfaz al buscar y abrir lanzamientos no calificados o recién indexados. Incorporación de normalizeAlbumData en AlbumDetail, sanitización de preloadedAlbum en HeaderAlbumSearch y refuerzo preventivo en AlbumsCatalog, ReviewSystem y AdminPanel."
      },
      {
        "type": "improvement",
        "title": "Reorganización de la Navegación Superior (Menús Desplegables Agrupados)",
        "description": "La cabecera de la aplicación ahora cuenta con menús desplegables agrupados para \"Descubrir\" y \"Juegos / Dinámicas\", optimizando el espacio y facilitando el acceso rápido a Portadas, Gaversiónpon Machine, Tier Lists, Leaderboard y Catálogo tanto en escritorio como en dispositivos móviles."
      },
      {
        "type": "improvement",
        "title": "guías para buscadores de internet Dinámico Actualizado y Enriquecimiento de Metadatos SEO",
        "description": "Sincronización del generador de guías para buscadores de internet con más de 2,980 rutas indexables en producción, incorporando las nuevas URL canónicas de portadas (/portadas, /calificar-portadas, /portada/:slug) y optimizando el marcado estructurado ficha técnica para buscadores y OpenGraph."
      }
    ]
  },
  {
    "version": "V.7.0",
    "title": "Comunidad Más Viva: Reacciones y Comentarios en Reseñas, y Calificación Instantánea de Discos",
    "date": "2026-09-07",
    "sha": "471330b",
    "tag": "Comunidad Musical",
    "tagColor": "from-fuchsia-600 via-pink-600 to-rose-500",
    "authorName": "Eugenio Turcott",
    "summary": "Interactúa con otros amantes de la música: reacciona a las opiniones de tus compañeros, comenta en hilos de conversación y califica álbumes al instante sin tiempos de espera.",
    "changes": [
      {
        "type": "feature",
        "title": "Interacciones Comunitarias: Reacciones estilo Facebook con Selector de Emojis",
        "description": "Los usuarios ahora pueden reaccionar a las reseñas de los álbumes mediante una barra de reacciones estilo Facebook (Me Gusta, Me Encanta, Me Divierte, Me Sorprende, Me Entristece y No Me Gusta / Dislike) o seleccionar cualquier emoji personalizado a través de un panel interactivo al estilo WhatsApp, con recuentos agrupados en tiempo real y persistencia optimizada."
      },
      {
        "type": "feature",
        "title": "Sistema de Comentarios y Discusión en Reseñas",
        "description": "Integración de hilos de comentarios para cada reseña publicada: permite iniciar debates musicales, responder directamente a otros miembros del club, visualizar avatares de perfil con enlaces interactivos y moderar comentarios propios o como administrador."
      },
      {
        "type": "feature",
        "title": "Rediseño de Perfiles en Leaderboard estilo \"Mi Perfil\"",
        "description": "Al hacer la plataformac en cualquier miembro desde el Leaderboard o listados comunitarios, se abre un perfil enriqueimágenes integradas en alta calidado idéntico a la experiencia de \"Mi Perfil\": portada, biografía, insignias de gamificación (rango, nivel, reputación), estadísticas de calificaciones y acceso a sus álbumes favoritos."
      },
      {
        "type": "improvement",
        "title": "Optimización Extrema de Latencia al Calificar Nuevos Álbumes (0 ms & <100 ms)",
        "description": "Eliminación del cuello de botella de más de 30 segundos al buscar y pulsar \"Calificar\": incorporación de Circuit Breaker y cooldown automático de 60s ante saturaciones (HTTP 503) de la biblioteca mundial de música, timeouts estrictos de 2.5s con AbortController, endpoint granular getAlbumWithFullStats(slug) que previene la descarga masiva de los 1,421 álbumes, y renderizado visual instantáneo con preloadedAlbum en React Router."
      },
      {
        "type": "improvement",
        "title": "Depuración de Pestañas en Mi Perfil",
        "description": "Se eliminó definitivamente la sección \"Por Calificar\" de la vista de perfil de usuario, manteniendo una interfaz más limpia, ágil y enfocada exclusivamente en el contenido y reseñas evaluadas."
      },
      {
        "type": "fix",
        "title": "Corrección Visual en Modales de Compartir y Story Canvas (Threads, Snapchat y Layout)",
        "description": "Actualización de los isotipos vectoriales oficiales de Threads y Snapchat en el modal de compartir review y Tier List. Corrección del margen superior del overlay para cubrir el 100% del viewport sin transparencias indeseadas, y ajuste al renderizado de canciones con títulos extensos en \"Tracks Destacados\" para evitar desbordamientos visuales."
      },
      {
        "type": "fix",
        "title": "Resiliencia CORS en Portadas Externas y Normalización de Estadísticas en Reviews",
        "description": "Soporte de proxies CORS de respaldo para evitar bloqueos al generar las imágenes descargables de reviews con imágenes alojadas en CDNs externos. Corrección y nitidez en el contador global de \"Álbumes Evaluados\" dentro de la sección de Reseñas."
      }
    ]
  },
  {
    "version": "V.6.7",
    "title": "Catálogo Musical Independiente y Mayor Claridad en el Historial de Mejoras",
    "date": "2026-09-04",
    "sha": "HEAD",
    "tag": "Biblioteca Musical",
    "tagColor": "from-emerald-500 via-teal-500 to-cyan-500",
    "authorName": "Eugenio Turcott",
    "summary": "Mejoramos la organización interna de los álbumes para que cualquier miembro pueda reseñar libremente sin dependencias, con un registro de novedades más limpio y fácil de leer.",
    "changes": [
      {
        "type": "refactor",
        "title": "Desacoplamiento Canónico de user_id en la Tabla albums",
        "description": "Se preparó y ejecutó la migración la base de datos para eliminar la columna user_id y la restricción albums_user_id_fkey en la biblioteca del club. Las nominaciones, autoría y estados activos del club quedan centralizados exclusivamente en la tabla pool_entries."
      },
      {
        "type": "fix",
        "title": "Refactorización del Sistema de Notificaciones Comunitarias",
        "description": "Ajuste en useNotifications.js para obtener las reseñas de álbumes propuestos por el usuario a través de pool_entries en lugar de albums.user_id, previniendo excepciones la base de datos de columna inexistente y reflejando con exactitud las nominaciones activas."
      },
      {
        "type": "improvement",
        "title": "Limpieza de Servicios y Mapeos de Estado (useAlbums, poolService, syncPoolGraduates)",
        "description": "Eliminación del campo obsoleto user_id en las transformaciones de useAlbums, la biblioteca musicalla plataformaent y poolService, así como en los scripts de sincronización de álbumes graduados."
      },
      {
        "type": "feature",
        "title": "Filtro Anti-Ruido en Patch Notes (Exclusión de Bots de automatización continua y mejora de Merge)",
        "description": "Integración de un filtro dual en patchNotesData.js y PatchNotes.jsx que oculta automáticamente mejora de github-actions[bot], tareas de ingesta horaria, tags [skip ci], mejora de merge (Merge branch...) y líneas generadas por conflictos de Git (# Conflicts:)."
      },
      {
        "type": "improvement",
        "title": "Motor de Ordenamiento Semántico y Cronológico de Versiones",
        "description": "Nuevo algoritmo de ordenamiento descendente por fecha y versión semántica (Major.Minor.Patch) que combina armónicamente los mejora en vivo de la API de GitHub con las notas de versión curadas de Musiclub."
      }
    ]
  },
  {
    "version": "V.6.6",
    "title": "Buscador de Álbumes Más Rápido y Enlaces a Tus 4 Plataformas Favoritas",
    "date": "2026-09-04",
    "sha": "HEAD",
    "tag": "Búsqueda Rápida",
    "tagColor": "from-violet-500 via-fuchsia-500 to-rose-500",
    "authorName": "Eugenio Turcott",
    "summary": "Busca cualquier álbum con rapidez y accede al instante en Deezer, Apple Music, YouTube Music y Spotify, con datos y portadas que se renuevan constantemente.",
    "changes": [
      {
        "type": "feature",
        "title": "Buscador Musical Híbrido, Invisible y Silencioso",
        "description": "Búsqueda en tiempo real a través de APIs de streaming que guarda directamente la ficha del álbum con metadatos canónicos de la biblioteca mundial de música (código oficial de lanzamiento, tracks, sello, año y formato) y carátulas HD, ocultando de forma transparente cualquier mención a proveedores externos en la interfaz de usuario."
      },
      {
        "type": "feature",
        "title": "Soporte de 4 Plataformas de Streaming y Logos Vectoriales Oficiales",
        "description": "Componente global de logos vectoriales (Spotify, Apple Music, YouTube y Deezer) integrado de extremo a extremo en la ficha del lanzamiento (AlbumDetail), Panel de Administración, Buzón de Canciones, Catálogo de Playlists y Recomendaciones."
      },
      {
        "type": "improvement",
        "title": "Pipeline de Ingesta Automática cada 30 Minutos con Pacing y Timeouts",
        "description": "Se actualizó la frecuencia del cron y workflow a 30 minutos, procesando lotes de 50 álbumes con portadas HD (1000x1000) y pausas de seguridad entre llamadas a APIs para evitar bloqueos por pantallas de espera y pausas de carga."
      },
      {
        "type": "fix",
        "title": "Enriquecimiento Retroactivo de los 262 Lanzamientos en Base de Datos",
        "description": "Se procesó el 100% de los álbumes en la biblioteca musical para completar enlaces a Deezer (other_link), Apple Music, YouTube, verificación Spotify en true y resolución de código oficial de lanzamientos canónicos."
      }
    ]
  },
  {
    "version": "V.6.5",
    "title": "Exploración Cómoda de Grandes Colecciones y Listas Completas de Canciones",
    "date": "2026-09-03",
    "sha": "HEAD",
    "tag": "Grandes Colecciones",
    "tagColor": "from-pink-500 via-rose-500 to-amber-500",
    "authorName": "Eugenio Turcott",
    "summary": "Navega fluidamente por catálogos con cientos de álbumes y reseñas, garantizando que cada disco muestre su lista completa de canciones sin fallas de carga.",
    "changes": [
      {
        "type": "fix",
        "title": "Depuración de Álbumes Fantasma y Restauración de Estadísticas Globales",
        "description": "Se eliminaron con éxito los 1,009 registros vacíos generados sin canciones en la biblioteca musical, reajustando la base de datos a 161 lanzamientos legítimos del club y recalculando de inmediato los contadores del Catálogo (Total Lanzamientos, Total Reseñas, Mejor Calificado y Promedio Global)."
      },
      {
        "type": "fix",
        "title": "Corrección de \"Álbum / Artista\" en Mi Perfil (Mis Reviews)",
        "description": "Ajuste en UserProfile.jsx para enriquecer las reseñas utilizando la relación directa review.albums / review.album cuando el álbum no se encuentre precargado en el mapa local. Las reviews personales ahora muestran siempre el título, artista, portada y canciones reales."
      },
      {
        "type": "fix",
        "title": "Paginación de Consultas la biblioteca musical (Superación del Límite de 1,000 Filas)",
        "description": "Se implementó paginación automática mediante bloques de 1,000 filas (.range()) en getAllAlbumsWithFullStats y en el hook useAlbums. Esto previene que catálogos extensos oculten u omitan los álbumes con reseñas y nominaciones existentes."
      },
      {
        "type": "improvement",
        "title": "Eliminación del Bucle Agresivo de Años en Catálogo (Fin de Errores pantallas de espera y 403 CORS)",
        "description": "Se reestructuró la resolución en segundo plano de años de lanzamiento en AlbumsCatalog.jsx, limitándola a un máximo de 2 elementos por sesión con retardo espaciado de 2 segundos. Se erradican por completo las alertas de cuota excedida (Spotify pantallas de espera) y los bloqueos 403 Forbidden / CORS en Apple Music."
      },
      {
        "type": "feature",
        "title": "Garantía de Canciones en Creación de Álbumes e Ingesta Controlada",
        "description": "Tanto HeaderAlbumSearch como la biblioteca musicalService.createAlbum cuentan ahora con extracción en cascada de tracklists (Spotify -> la biblioteca mundial de música -> iTunes) para asegurar que ningún álbum se cree con canciones vacías ([]). Asimismo, el script de ingesta por lotes y su workflow de actualizaciones automáticas continuas se calibraron a 25 lanzamientos verificados con tracklists completos y filtrado estricto."
      },
      {
        "type": "feature",
        "title": "Paginación Dinámica en \"Mis Reviews\" (Mi Perfil)",
        "description": "Se incorporó paginación interactiva en la pestaña de Mis Reviews de UserProfile.jsx con selector personalizable de elementos por página (10, 20 o 50 reviews), botones de avance/retroceso rápido y desplazamiento suave automático directo al inicio del listado."
      }
    ]
  },
  {
    "version": "V.6.4",
    "title": "Notificaciones del Ganador del Pool y Álbumes Graduados con Honores",
    "date": "2026-09-03",
    "sha": "HEAD",
    "tag": "Pool Semanal",
    "tagColor": "from-emerald-500 via-teal-500 to-cyan-500",
    "authorName": "Eugenio Turcott",
    "summary": "Avisos claros de cada disco elegido por la comunidad para escuchar en la semana y recopilación de los 21 álbumes que ya han culminado su semana oficial en el club.",
    "changes": [
      {
        "type": "fix",
        "title": "Corrección de Notificaciones Globales de Álbum Ganador",
        "description": "Ajuste en la biblioteca musicalService.getCurrentWinner() para consultar exclusivamente la tabla pool_entries por status = \"GANADOR\" en lugar de basarse en reviews_enabled de la tabla albums. Esto elimina las notificaciones erróneas generadas tras la ingesta masiva de álbumes externos y garantiza que solo se anuncie el disco ganador oficial de la semana del club."
      },
      {
        "type": "feature",
        "title": "Sincronización y Graduación de 21 Álbumes Históricos en pool_entries",
        "description": "Comprobación, normalización y registro completo en pool_entries de los 21 álbumes históricos del club (incluyendo Weyes Blood, Judeline, Madonna, Little Jesus, Knocked Loose, Todos mueren en abril, Ashe, Serú Girán, Sampha, DANNA, Silvana Estrada, Tango Astral, Sade y Jane Remover). Los álbumes que no figuraban en el pool fueron integrados como GRADUADOS con sus respectivos campos de autor (nominated_by, user_id, email) y temporada activa."
      },
      {
        "type": "improvement",
        "title": "Buscador y Crawler Musical Resiliente con Fallback Multi-Tier",
        "description": "Incorporación de un Circuit Breaker inteligente en spotifyApi.js que conmuta fluidamente a iTunes Search API y Deezer cuando la el catálogo oficial de Spotify devuelve pantallas de espera (pantallas de espera y pausas de carga). Resolución de portadas HD de hasta 1000x1000, soporte de tracks completo, validación de cabeceras HEAD en Cover Art Archive para evitar imágenes rotas (404) y concatenación precisa de artistas colaboradores con join phrases en la ingesta de la biblioteca mundial de música."
      },
      {
        "type": "improvement",
        "title": "Eliminación Integral de LoadingOverlay y Rediseño Hero Institucional",
        "description": "Limpieza y desacoplamiento de componentes de carga invasivos (LoadingOverlay) en todas las vistas de la aplicación, sustituyéndolos por transiciones fluidas de skeleton y adaptando las páginas de FAQ, Privaimágenes integradas en alta calidadad y Términos a la estética visual moderna y metadatos SEO implementados en Patch Notes."
      }
    ]
  },
  {
    "version": "V.6.3",
    "title": "Mejor Presencia en Google y Mayor Estabilidad en la Plataforma",
    "date": "2026-09-03",
    "sha": "HEAD",
    "tag": "Estabilidad y Presencia",
    "tagColor": "from-cyan-500 via-blue-500 to-indigo-500",
    "authorName": "Eugenio Turcott",
    "summary": "Ajustes para que la página sea más fácil de encontrar en internet y funcione con total solidez para todos los visitantes.",
    "changes": [
      {
        "type": "feature",
        "title": "Meta Description y Metadatos Globales SEO en index.html",
        "description": "Incorporación de meta description oficial, palabras clave, oficial URL y etiquetas Open Graph y Twitter Cards directamente en index.html para una indexación inmediata y previsualizaciones enriqueimágenes integradas en alta calidadas en motores de búsqueda (Google, Bing) y redes sociales."
      },
      {
        "type": "fix",
        "title": "Actualización de actualizaciones automáticas continuas a servidores de alta veloimágenes integradas en alta calidadad",
        "description": "Actualización del sistema automático en el flujo hourly_la biblioteca mundial de música_ingest.yml a servidores de alta veloimágenes integradas en alta calidadad, satisfaciendo los nuevos requerimientos nativos de @la biblioteca musical/la biblioteca musical-js."
      },
      {
        "type": "fix",
        "title": "Blindaje WebSocket y Sesión Ligera en Scripts la plataforma",
        "description": "Implementación de polyfill de WebSocket e inicialización auth.persistSession: false en hourlyla biblioteca mundial de músicaIngestion.mjs, generate-guías para buscadores de internet.js y enrichMissingla biblioteca mundial de música.mjs, garantizando ejecución sin fallos en cualquier entorno de Node."
      }
    ]
  },
  {
    "version": "V.6.2",
    "title": "Llegada Masiva de Álbumes con Portadas Oficiales en Alta Calidad",
    "date": "2026-09-03",
    "sha": "HEAD",
    "tag": "Catálogo Masivo",
    "tagColor": "from-pink-500 via-purple-500 to-cyan-400",
    "authorName": "Eugenio Turcott",
    "summary": "El club se llena de música: miles de discos añadidos automáticamente con sus portadas oficiales en máxima definición y fichas técnicas completas.",
    "changes": [
      {
        "type": "feature",
        "title": "Arquitectura Híbrida: Portadas Spotify HD + Metadatos Canónicos de la biblioteca mundial de música",
        "description": "Integración transparente e invisible en el flujo de creación de álbumes (createAlbum en la biblioteca musicalla plataformaent.js y enrichAlbumWithla biblioteca mundial de música en la biblioteca mundial de músicaService.js). Al añadir cualquier lanzamiento, la carátula oficial de alta resolución se extrae y preserva siempre desde el CDN de Spotify (i.scdn.co), mientras que el código oficial de lanzamiento canónico, formato normalizado (ALBUM, EP, SENCILLO, COMPILACION, etc.), fecha y año oficial, géneros, discográfica, país, código de barras y listado de pistas se resuelven automáticamente desde la biblioteca mundial de música."
      },
      {
        "type": "feature",
        "title": "Ingesta Horaria Automatizada de 1,000 Álbumes desde la biblioteca mundial de música",
        "description": "Motor de ingesta por lotes (rutina automática biblioteca mundial de músicaIngestion.mjs) que descarga 1,000 nuevos lanzamientos oficiales por hora en bloques de 100, consulta la el catálogo oficial de Spotify para asociar carátulas oficiales en alta calidad y realiza upsert masivo en la biblioteca musical (public.albums) con control de duplicados y cursor persistente en rutina automática"
      },
      {
        "type": "feature",
        "title": "Automatización 24/7 en la Nube con actualizaciones automáticas continuas",
        "description": "Workflow en .github/workflows/hourly_la biblioteca mundial de música_ingest.yml con disparador cron horario (0 * * * *), permisos de escritura para auto-mejora de guías para buscadores de internet y estado del crawler, y notificación instantánea (ping) a motores de búsqueda."
      },
      {
        "type": "improvement",
        "title": "guías para buscadores de internet Dinámico Paginado y Detección Automática para Google",
        "description": "Actualización de rutina automáticaías para buscadores de internet.js con paginación exhaustiva sobre la base de datos de la biblioteca musical (superando el límite de 1,000 filas de el catálogo de canciones) y arquitectura de partición para más de 45,000 URLs con guías para buscadores de internetindex. El guías para buscadores de internet se regenera automáticamente al finalizar cada lote de ingesta para indexación inmediata por Googlebot."
      },
      {
        "type": "improvement",
        "title": "Ajuste de Rastreo en guía para motores de búsqueda",
        "description": "Inclusión de reglas de rastreo explícitas en public/guía para motores de búsqueda para /eps/, /sencillos/, /compilaciones/ y /remixes/, maximizando la cobertura SEO de todos los formatos del catálogo."
      },
      {
        "type": "fix",
        "title": "Blindaje de Traducción en DNA Musical y Espera de Hidratación",
        "description": "Aislamiento estricto (translate=\"no\") en artistas y miembros del club dentro del componente de Recomendaciones, evitando que traductores automáticos alteren nombres propios, y ajuste del temporizador de traducción a 2 segundos en cambios de página y recargas."
      },
      {
        "type": "fix",
        "title": "Sincronización de Avatar de Autor en Reviews Comunitarias",
        "description": "Corrección de sincronización de reviewer_avatar en la tabla reviews, integrando trigger la base de datos de respaldo y fallback visual robusto para garantizar la visualización de avatares en todas las reseñas."
      }
    ]
  },
  {
    "version": "V.6.1",
    "title": "Sostenibilidad de la Plataforma para Seguir Creciendo Juntos",
    "date": "2026-09-03",
    "sha": "HEAD",
    "tag": "Mantenimiento del Club",
    "tagColor": "from-pink-500 via-purple-500 to-cyan-400",
    "authorName": "Eugenio Turcott",
    "summary": "Integración de espacios publicitarios respetuosos para apoyar el mantenimiento de los servidores del club sin afectar tu experiencia de navegación.",
    "changes": [
      {
        "type": "feature",
        "title": "Tag de Anuncios de anuncios de sostenimiento",
        "description": "Incorporación del tag de anuncios de anuncios de sostenimiento en el archivo index.html para permitir la monetización de la plataforma a través de publiimágenes integradas en alta calidadad."
      }
    ]
  },
  {
    "version": "V.6.0",
    "title": "Portadas en Alta Definición, Disco de Vinilo Interactivo y Nuevas Vistas Musicales",
    "date": "2026-09-01",
    "sha": "HEAD",
    "tag": "Vinilo y Portadas HD",
    "tagColor": "from-pink-500 via-purple-500 to-cyan-400",
    "authorName": "Eugenio Turcott",
    "summary": "Una experiencia visual cautivadora: disfruta de un disco de vinilo interactivo, portadas en calidad de estudio y una mejor distinción entre sencillos, EPs y álbumes de larga duración.",
    "changes": [
      {
        "type": "feature",
        "title": "Enrutamiento Semántico y Breadcrumbs por Formato de Release (/catalogo, /eps, /sencillos, /remixes, /compilaciones, /albumes)",
        "description": "Migración de la ruta general a /catalogo y diferenciación de URLs dinámicas para cada tipo de lanzamiento según su formato: /eps/:slug (e.g. /eps/FIRE-ON-MARZZ), /sencillos/:slug, /remixes/:slug, /compilaciones/:slug y /albumes/:slug. Las fichas técnicas ahora muestran breadcrumbs dinámicos contextualizados con el formato exacto del disco (ej. Inicio / EPs / FIRE ON MARZZ)."
      },
      {
        "type": "feature",
        "title": "Portadas de Alta Definición y Renderizado Ultrarrápido vía portadas en alta definición de Spotify",
        "description": "Integración directa con el CDN oficial de Spotify (i.scdn.co) para todas las portadas de la discografía, pool semanal, catálogo y perfiles, logrando tiempos de carga inmediatos y consistencia visual uniforme en todas las resoluciones."
      },
      {
        "type": "improvement",
        "title": "Vinilo Interactivo en Hero con Microinteracción Invertida",
        "description": "Alineación y centrado del disco de vinilo sobre la portada en el Hero interactivo. Se perfeccionó el comportamiento de animación para responder exclusivamente al cursor sobre el vinilo, permitiendo que el hover deslice e inserte el vinilo suavemente dentro de su funda."
      },
      {
        "type": "feature",
        "title": "Blindaje Estricto de Traducción Lingüística en Entidades Musicales y Miembros",
        "description": "Protección universal con translate=\"no\" y clases semánticas (.notranslate, .music-title, .artist-name, .username-tag, .track-name) respaldada por un MutationObserver en tiempo real. Garantiza que los nombres de lanzamientos, artistas, canciones evaluadas y miembros nunca sean alterados por Google Translate ni traductores de navegador, mientras que el resto de la interfaz y reseñas se traducen fluidamente."
      },
      {
        "type": "improvement",
        "title": "guías para buscadores de internet Dinámico con 554 URLs Canónicas y Pipeline Automatizado",
        "description": "Actualización del generador rutina automáticaías para buscadores de internet.js para clasificar automáticamente las 554 rutas de lanzamientos de la plataforma de acuerdo con su tipo de formato (/eps/..., /sencillos/..., etc.) y regeneración automática antes de cada compilación de producción."
      }
    ]
  },
  {
    "version": "V.5.9",
    "title": "Musiclub para Todo el Mundo: Soporte en 10 Idiomas con Nombres Musicales Intactos",
    "date": "2026-08-31",
    "sha": "HEAD",
    "tag": "Idiomas del Mundo",
    "tagColor": "from-purple-500 via-pink-500 to-cyan-400",
    "authorName": "Eugenio Turcott",
    "summary": "La plataforma ahora habla tu idioma: traduce la interfaz a 10 idiomas distintos manteniendo siempre los nombres de canciones y artistas en su lengua original, con una nueva pantalla de página no encontrada.",
    "changes": [
      {
        "type": "feature",
        "title": "Traductor Multi-Idioma Global en Tiempo Real",
        "description": "Integración de LanguageSelector en el Header y Footer con soporte para 10 idiomas (Español, Inglés, Portugués, Francés, Alemán, Italiano, Japonés, Coreano, Chino y Ruso). Traduce al instante la plataforma completa con diseño neón personalizado, detección de idioma y persistencia."
      },
      {
        "type": "feature",
        "title": "Aislamiento Inteligente de Metadatos Musicales y Usuarios",
        "description": "Implementación de protecciones granulares (translate=\"no\" y .notranslate) en títulos de álbumes (e.g. Marchita, Mon Laferte Vol. 1), artistas, nombres de canciones y nombres de usuarios en podios, cuadrículas, catálogo y reseñas, permitiendo traducir las etiquetas de interfaz (\"Añadido por:\", \"canciones\", \"Ganador\", \"reviews\") sin alterar los nombres propios originales."
      },
      {
        "type": "feature",
        "title": "Página 404 \"Pista Fuera de Órbita\" & Enrutamiento Universal",
        "description": "Diseño interactivo con estética visual cyberpunk/neón de Musiclub, animación de disco de vinilo en rotación holográfica, accesos rápidos (Inicio, Álbumes, Leaderboard, Gaversiónpon) y enrutamiento catch-all universal (* y /404)."
      },
      {
        "type": "improvement",
        "title": "Archivo guía para motores de búsqueda Estandarizado para musiclub.org",
        "description": "Generación del archivo guía para motores de búsqueda en public/ configurando rastreo universal para Googlebot y buscadores internacionales, protección de rutas privadas y referencia al guías para buscadores de internet.xml canónico."
      },
      {
        "type": "fix",
        "title": "Corrección de Repetición Visual del Fondo",
        "description": "Ajuste en la capa del fondo de la aplicación (fixed inset-0 con background-repeat: no-repeat y cover) eliminando el efecto de mosaico y corte en scrolls largos y pantallas de alta resolución."
      }
    ]
  },
  {
    "version": "V.5.8",
    "title": "Ajustes y Estabilidad en el Nuevo Dominio Oficial musiclub.org",
    "date": "2026-08-31",
    "sha": "HEAD",
    "tag": "Hogar Oficial",
    "tagColor": "from-purple-500 via-pink-500 to-cyan-400",
    "authorName": "Eugenio Turcott",
    "summary": "Afinación de detalles internos para asegurar que todo funcione a la perfección en nuestra nueva dirección oficial musiclub.org.",
    "changes": [
      {
        "type": "improvement",
        "title": "Ajustes de Compatibilidad con musiclub.org",
        "description": "Modificaciones en los archivos de configuración y rutas de la aplicación para asegurar la compatibilidad total con el nuevo dominio musiclub.org y la resolución correcta de URLs en entornos locales y de previsualización."
      }
    ]
  },
  {
    "version": "V.5.7",
    "title": "Catálogo en Crecimiento Continuo con Búsqueda Instantánea de Discos",
    "date": "2026-08-31",
    "sha": "5cd74c2",
    "tag": "Búsqueda Instantánea",
    "tagColor": "from-rose-500 via-pink-500 to-cyan-400",
    "authorName": "Eugenio Turcott",
    "summary": "Encuentra cualquier álbum al momento con portadas y datos oficiales, haciendo que Musiclub sea más visible y accesible para nuevos miembros en la web.",
    "changes": [
      {
        "type": "feature",
        "title": "Resolución On-Demand de Álbumes con Spotify & Programmatic SEO",
        "description": "Capaimágenes integradas en alta calidadad para navegar y consultar cualquier álbum del mundo por su URL (e.g. /albumes/sour). Si el disco no existe en la base de datos de Musiclub, el sistema lo resuelve en milisegundos desde Spotify con su portada HD, tracklist oficial y metadatos, y lo registra automáticamente en la biblioteca musical en cuanto un usuario lo califica."
      },
      {
        "type": "feature",
        "title": "Curaduría de Álbumes Populares & guías para buscadores de internet Expandido a 540+ URLs",
        "description": "Incorporación de popularMusicData.js con los discos y artistas más emblemáticos de la música global y actualización del guías para buscadores de internet.xml a más de 540 URLs canónicas para indexación masiva en Google."
      },
      {
        "type": "improvement",
        "title": "Auto-Registro en Base de Datos al Calificar",
        "description": "Optimización en ReviewSystem.jsx para registrar álbumes resueltos on-demand de forma automática e inmediata en la biblioteca musical al momento de emitir la primera calificación."
      }
    ]
  },
  {
    "version": "V.5.6",
    "title": "Estreno del Dominio Oficial musiclub.org y Pie de Página Global",
    "date": "2026-08-31",
    "sha": "69c2639",
    "tag": "Gran Estreno",
    "tagColor": "from-rose-500 via-pink-500 to-cyan-400",
    "authorName": "Eugenio Turcott",
    "summary": "Celebramos la llegada a nuestra casa definitiva musiclub.org con un pie de página renovado, inicio de sesión fluido con Google y navegación optimizada.",
    "changes": [
      {
        "type": "feature",
        "title": "Lanzamiento del dominio Oficial musiclub.org & guías para buscadores de internet",
        "description": "Migración completa de la plataforma hacia su dominio propio https://musiclub.org, incluyendo guías para buscadores de internet.xml regenerado con más de 250 rutas canónicas indexables, guía para motores de búsqueda actualizado y metaetiquetas OpenGraph/SEO oficiales."
      },
      {
        "type": "feature",
        "title": "Footer Global Universal en Todas las Páginas",
        "description": "Incorporación del componente Footer universal con enlaces rápidos, navegación por secciones, créditos, copyright y accesos legales en el 100% de las vistas (Inicio, Álbumes, Detalle de Álbum, Artistas, Leaderboard, Playlists, Reviews, Recomendaciones, Perfil, Configuración, Gaversiónpon, Patch Notes, FAQ, Privaimágenes integradas en alta calidadad, Términos y Panel Admin)."
      },
      {
        "type": "improvement",
        "title": "Redirección Dinámica de Autenticación con Google (OAuth)",
        "description": "Actualización del flujo de inicio de sesión en tu cuenta conectada.js para resolver de forma automática y transparente la URL de retorno (window.location.origin) en el nuevo dominio musiclub.org, preservando al mismo tiempo la compatibilidad en entornos locales y de previsualización."
      },
      {
        "type": "fix",
        "title": "Depuración y Optimización de el catálogo oficial de Spotify (Error 403)",
        "description": "Eliminación de llamadas directas y obsoletas a top-tracks restringidas por los nuevos tokens de la plataformaente de Spotify, optimizando la carga de discografía del artista de forma fluida y sin advertencias en consola."
      },
      {
        "type": "fix",
        "title": "Corrección de Margen Superior en Vista de Artista",
        "description": "Reestructuración del componente SEO y Header en ArtistDetail.jsx, eliminando el espaciado superior no deseado generado por las utilidades de diseño para que coinimágenes integradas en alta calidada perfectamente con el resto de la aplicación."
      }
    ]
  },
  {
    "version": "V.5.5",
    "title": "Páginas Oficiales de Artistas, Discografías Completas y Edición de Perfil",
    "date": "2026-08-28",
    "sha": "d19af4e",
    "tag": "Discografías de Artistas",
    "tagColor": "from-pink-500 via-rose-500 to-amber-500",
    "authorName": "Eugenio Turcott",
    "summary": "Explora la discografía completa de tus artistas favoritos con páginas dedicadas, personaliza los datos de tu perfil y presume cuántas reseñas has compartido en el podio del club.",
    "changes": [
      {
        "type": "feature",
        "title": "Página de Perfil de Artista y Discografía Spotify Completa",
        "description": "Nueva vista dedicada (/artista/:artistName) con navegación por pestañas (Todos, Álbumes, EPs, Sencillos y Compilaciones), contadores dinámicos, año de lanzamiento, géneros musicales oficiales y filtros rápidos de lanzamientos."
      },
      {
        "type": "feature",
        "title": "Schema SEO de Reviews e Indexación para Google (ficha técnica para buscadores)",
        "description": "Implementación de datos estructurados ficha técnica para buscadores para MusicAlbum con aggregateRating, reviewCount, ratingValue y reviews detalladas de la comunidad para resultados enriqueimágenes integradas en alta calidados (Rich Snippets) en Google Search estilo Album of the Year."
      },
      {
        "type": "feature",
        "title": "Edición de Reviews Directa desde \"Mi Perfil\"",
        "description": "Capaimágenes integradas en alta calidadad para editar calificaciones, reseñas y notas de canciones directamente desde la sección \"Mis Reviews\" en el perfil de usuario con una interfaz modal limpia y sin elementos distractores."
      },
      {
        "type": "improvement",
        "title": "Contador de Reviews en Tarjetas Traseras del Podio y Carrusel",
        "description": "En el podio de Rankings & Estadísticas de la pantalla principal, las tarjetas traseras (flip 3D) de los puestos #1, #2 y #3, así como las del carrusel (#4 al #10), ahora muestran el total de reseñas de la comunidad (🎧 X reviews)."
      },
      {
        "type": "improvement",
        "title": "Homogeneización del Ancho Global y Header",
        "description": "Estandarización del ancho de contenedor (max-w-7xl) en todas las vistas (Configuración, Catálogo, Perfiles, etc.) para mantener un espaciado idéntico y evitar menús apeñuscados en el Header."
      },
      {
        "type": "fix",
        "title": "Modales Globales con React Portals (Login y Editor de Reviews)",
        "description": "Migración de los modales de Inicio de Sesión y Editor de Reviews a React Portals montados directamente en document.body (z-[99999]), eliminando problemas de desplazamiento causados por transforms CSS del contenedor padre."
      },
      {
        "type": "fix",
        "title": "Depuración Visual en Encabezado de Artista",
        "description": "Eliminación de caracteres numéricos residuales en el nombre del artista y limpieza del banner promocional en la vista de artista."
      }
    ]
  },
  {
    "version": "V.5.4",
    "title": "Creador de Listas de Álbumes (Tier Lists) y Filtro por Años y Décadas",
    "date": "2026-08-25",
    "sha": "8f410de",
    "tag": "Tier Lists y Décadas",
    "tagColor": "from-pink-500 via-purple-500 to-indigo-500",
    "authorName": "Eugenio Turcott",
    "summary": "Arma tus listas de álbumes preferidos con nuestro nuevo creador de Tier Lists descargable en imagen y viaja en el tiempo explorando la mejor música por años y décadas.",
    "changes": [
      {
        "type": "feature",
        "title": "SF Tiers Tier List Maker Automático en Mi Perfil",
        "description": "Generador automático de Tier Lists basado en las calificaciones personales del usuario en 6 niveles: S (GOD TIER / OBRAS MAESTRAS, 9.5-10.0), A (EXCELENTES, 8.5-9.4), B (MUY BUENOS, 7.5-8.4), C (BUENOS, 6.5-7.4), D (REGULARES, 5.0-6.4) y F (DECEPCIONANTES, < 4.9 morada). Incluye modo lista vertical optimizado para móviles."
      },
      {
        "type": "feature",
        "title": "Exportación de Tier List a Imagen HD (PNG)",
        "description": "Botón para generar y descargar instantáneamente una imagen en alta resolución con tipografía Stack Sans Notch, branding oficial de Musiclub, avatar del usuario y formato listo para compartir en redes sociales."
      },
      {
        "type": "feature",
        "title": "Filtro por Años y Décadas estilo AlbumOfTheYear.org",
        "description": "Barra de navegación interactiva en la página de Álbumes con selector de décadas (2020s a 1950s), flechas de navegación ‹ y ›, carril cronológico de años (2020 a 2026), filtrado en tiempo real e insignias con conteo de álbumes por año."
      },
      {
        "type": "feature",
        "title": "Metadatos Oficiales de Lanzamiento de Spotify",
        "description": "Incorporación permanente de release_date y release_year en la base de datos de la biblioteca musical, backfill del 100% de los álbumes del catálogo y resolución automática para todos los nuevos álbumes agregados."
      },
      {
        "type": "improvement",
        "title": "Reorganización del Panel de Notificaciones",
        "description": "Rediseño del buzón en el Header con eliminación de filtros redundantes y reubicación ergonómica de los controles de marcar como leído, eliminar y cerrar justo debajo del título."
      },
      {
        "type": "improvement",
        "title": "Actualización del Nivel de Melómano",
        "description": "Ajuste y sincronización de los rangos de Melómano y estadísticas detalladas del perfil de usuario."
      },
      {
        "type": "fix",
        "title": "Portadas Robustas con Fallback SVG Nativo",
        "description": "Reemplazo de placeholders externos por un componente visual SVG nativo sin dependencias de red, garantizando carga inmediata de portadas en caso de fallos de enlace."
      }
    ]
  },
  {
    "version": "V.5.3",
    "title": "Conteo Preciso de Álbumes Postulados y Mejoras en el Historial",
    "date": "2026-08-21",
    "sha": "604ed2d",
    "tag": "Estadísticas del Club",
    "tagColor": "from-blue-500 via-indigo-500 to-purple-500",
    "authorName": "Eugenio Turcott",
    "summary": "Tu podio de reseñadores ahora refleja con exactitud cuántos álbumes has nominado a la comunidad, junto con mejoras visuales en las notas de actualización.",
    "changes": [
      {
        "type": "fix",
        "title": "Conteo Preciso de Álbumes Postulados por Miembro en Podio",
        "description": "Corrección en getTopReviewersManual y la biblioteca musicalService.getTopReviewers para contabilizar fielmente los álbumes agregados o propuestos por cada usuario (added_by y added_by_email) en lugar de contar únicamente los álbumes reseñados."
      },
      {
        "type": "improvement",
        "title": "Sincronización Optimizada de mejora de GitHub en Patch Notes",
        "description": "Actualización del endpoint de GitHub mejora API aumentando la paginación a 100 resultados por consulta, estandarización de la rama principal a master y depuración de indicadores de versión en producción."
      }
    ]
  },
  {
    "version": "V.5.2",
    "title": "Navegación Cómoda en Notas de Actualización y Nueva Identidad Musiclub",
    "date": "2026-08-21",
    "sha": "3257b00",
    "tag": "Nueva Identidad",
    "tagColor": "from-blue-500 to-indigo-500",
    "authorName": "Eugenio Turcott",
    "summary": "Explora el historial del club página por página de forma ordenada, con desplazamiento suave restaurado y la nueva imagen de marca de Musiclub.",
    "changes": [
      {
        "type": "feature",
        "title": "Paginación Interactiva en Patch Notes",
        "description": "Paginación fluida de 6 versiones por página con botones anterior/siguiente, números de página con resplandor activo y filtros rápidos por versión (V5.x a V0.x)."
      },
      {
        "type": "feature",
        "title": "Restablecimiento Global de Scroll (ScrollToTop)",
        "description": "Componente en la raíz del Router que restablece inmediatamente el scroll de la ventana al principio (top: 0, left: 0) al hacer la plataformac en enlaces del footer o navegar entre páginas."
      },
      {
        "type": "improvement",
        "title": "Actualización Integral de la Documentación (README.md)",
        "description": "Documentación renovada a la versión v5.2.0 con árbol de archivos, tabla completa de 14 rutas, fórmulas matemáticas y guía de instalación."
      },
      {
        "type": "improvement",
        "title": "Estandarización de Marca «Musiclub»",
        "description": "Ajuste de todas las referencias de marca y texto en la aplicación con la c en minúscula."
      }
    ]
  },
  {
    "version": "V.5.1",
    "title": "Máquina Gashapon de Discos, Buzón de Recomendaciones y Buscador Directo",
    "date": "2026-08-21",
    "sha": "9c8e0cf",
    "tag": "Gashapon y Recomendaciones",
    "tagColor": "from-pink-500 to-rose-500",
    "authorName": "Eugenio Turcott",
    "summary": "¡Llegan nuevas formas de disfrutar la música! Diviértete con la máquina Gashapon para desbloquear discos sorpresa y recomienda canciones directamente a tus amigos del club.",
    "changes": [
      {
        "type": "feature",
        "title": "Máquina Gaversiónpon Arcade 3D Independiente",
        "description": "Se separó el Gaversiónpon a su propia página dedicada (/gaversiónpon) con una cúpula de cristal con más de 18 cápsulas esféricas multicolor con física vibrante, manivela 3D y selección aleatoria de álbumes individuales."
      },
      {
        "type": "feature",
        "title": "Buzón Social de Recomendaciones de Canciones",
        "description": "Buzón privado en el perfil de usuario para intercambiar y recomendar exclusivamente canciones entre miembros, con dedicatorias, vista previa de Spotify y notificaciones en tiempo real respaldadas en la biblioteca musical."
      },
      {
        "type": "feature",
        "title": "Buscador Global Directo en Header",
        "description": "Campo de búsqueda directo integrado en la barra de navegación y en el menú móvil (sin necesidad de abrir popups para buscar). Muestra resultados en vivo mientras se escribe, soporte de teclado y calificación directa."
      },
      {
        "type": "feature",
        "title": "Página de Patch Notes y Sincronización con GitHub",
        "description": "Historial completo de versiones y mejora sincronizado en tiempo real con la rama principal de GitHub, con filtros de versión y buscador de novedades."
      },
      {
        "type": "improvement",
        "title": "Diseño 100% Responsivo en Header y Banner de Proponer",
        "description": "Alineación de navegación fluida evitando solapamientos y banner \"¿Tienes un álbum en mente? +50 XP\" adaptado para pantallas móviles de 320px a 480px."
      },
      {
        "type": "fix",
        "title": "Corrección de Tarjetas 3D Flip (Puestos 4 al 10 en Rankings)",
        "description": "Se corrigió la rotación inicial de la cara frontal en CSS para que las portadas, insignias y puntuaciones se muestren de inmediato sin necesidad de hacer la plataformac primero."
      }
    ]
  },
  {
    "version": "V.5.0",
    "title": "Recomendaciones Personalizadas «Para Ti» y Playlists Oficiales del Club",
    "date": "2026-08-20",
    "sha": "da68bc8",
    "tag": "Para Ti y Playlists",
    "tagColor": "from-purple-500 to-indigo-500",
    "authorName": "Eugenio Turcott",
    "summary": "Descubre álbumes recomendados a tu gusto con el nuevo motor de afinidad musical «Para Ti» y disfruta de listas de reproducción armadas con las opiniones de la comunidad.",
    "changes": [
      {
        "type": "feature",
        "title": "Sección de Recomendaciones \"Para Ti\" (RecommendationsPage)",
        "description": "Algoritmo inteligente de recomendación que analiza tus calificaciones y preferencias para sugerirte joyas del catálogo del club."
      },
      {
        "type": "feature",
        "title": "Explorador y Generador de Playlists (PlaylistsPage)",
        "description": "Creación de listas de reproducción temáticas con las mejores canciones votadas y exportación a Spotify."
      },
      {
        "type": "feature",
        "title": "Emociones y Sentimientos en Reseñas",
        "description": "Selector de sensaciones emocionales (Mindblown, Sad, Chill, Hype, etc.) respaldado en la biblioteca musical."
      },
      {
        "type": "improvement",
        "title": "Motor de Deduplicación Robusta de Álbumes",
        "description": "Algoritmo para prevenir discos duplicados validando Spotify Album IDs y similitud de títulos."
      }
    ]
  },
  {
    "version": "V.4.4",
    "title": "Medallas e Insignias para Miembros Activos y Calificaciones Ponderadas",
    "date": "2026-08-19",
    "sha": "7ea0ce4",
    "tag": "Insignias y Medallas",
    "tagColor": "from-purple-500 to-indigo-500",
    "authorName": "Eugenio Turcott",
    "summary": "Desbloquea medallas e insignias especiales por tu pasión y actividad en el club, con un cálculo más justo y representativo para los promedios de calificación.",
    "changes": [
      {
        "type": "feature",
        "title": "Sistema de Insignias y Medallas (Badge System)",
        "description": "Creación del motor de insignias por hitos: crítico prolífico, descubridor de joyas, géneros explorados y constancia semanal."
      },
      {
        "type": "improvement",
        "title": "Balanceo de Fórmulas Ponderadas",
        "description": "Ajuste en el algoritmo de cálculo general para equilibrar las notas de canciones individuales con los 6 criterios técnicos."
      },
      {
        "type": "improvement",
        "title": "Optimización de Carga en Catálogo y Perfiles",
        "description": "Mejoras en el rendimiento de consultas a la biblioteca musical y estados reactivos en UserProfile y AlbumsCatalog."
      }
    ]
  },
  {
    "version": "V.4.3",
    "title": "Centro de Ayuda Interactivo, Preguntas Frecuentes y Secciones Informativas",
    "date": "2026-08-17",
    "sha": "2a9378c",
    "tag": "Centro de Ayuda",
    "tagColor": "from-amber-500 to-orange-500",
    "authorName": "Eugenio Turcott",
    "summary": "Añadimos un centro de ayuda completo con respuestas a las dudas más comunes sobre el club, las reseñas y el funcionamiento de la plataforma.",
    "changes": [
      {
        "type": "feature",
        "title": "Página de Preguntas Frecuentes (FAQ) con Buscador",
        "description": "Guía completa con 8 categorías sobre dinámica del club, ruleta, puntuación técnica, insignias y catálogo de Spotify."
      },
      {
        "type": "feature",
        "title": "Páginas Legales y Footer Dinámico",
        "description": "Integración de páginas dedicadas de Política de Privaimágenes integradas en alta calidadad y Términos de Servicio accesibles desde el pie de página."
      },
      {
        "type": "improvement",
        "title": "Refactorización de Utilidades de Calificación (ratingUtils.js)",
        "description": "Modularización y pruebas de utilidades para formateo de promedios y cálculo de bonificaciones."
      }
    ]
  },
  {
    "version": "V.4.2",
    "title": "Animaciones Más Suaves y Efectos Especiales en la Ruleta Musical",
    "date": "2026-08-17",
    "sha": "d5f855d",
    "tag": "Animaciones Arcade",
    "tagColor": "from-cyan-500 to-blue-500",
    "authorName": "Eugenio Turcott",
    "summary": "La máquina tragamonedas de álbumes ahora gira con una desaceleración más realista y efectos visuales emocionantes al elegir tu próximo disco.",
    "changes": [
      {
        "type": "improvement",
        "title": "Física Cinemática de Desaceleración",
        "description": "Curvas de transición bezier personalizadas para detener los carretes secuencialmente con mayor realismo."
      },
      {
        "type": "improvement",
        "title": "Sincronización de Probabilidad Ponderada por Antigüedad",
        "description": "Ajuste fino del algoritmo para otorgar hasta +40% de probabilidad justa a discos antiguos en lista de espera."
      }
    ]
  },
  {
    "version": "V.4.1",
    "title": "Tabla de Posiciones y Podio Comunitario Mucho Más Rápidos",
    "date": "2026-08-17",
    "sha": "6e87f5c",
    "tag": "Podio Ultrarrápido",
    "tagColor": "from-emerald-500 to-teal-500",
    "authorName": "Eugenio Turcott",
    "summary": "El podio de reseñadores y la tabla de posiciones ahora cargan al instante para que veas en tiempo real quién lidera las opiniones del club.",
    "changes": [
      {
        "type": "improvement",
        "title": "Queries Agregadas de Alto Rendimiento",
        "description": "Optimización de búsqueda en la biblioteca en la biblioteca musical para contabilizar reviews, propuestas y XP sin cuello de botella."
      },
      {
        "type": "fix",
        "title": "Estabilidad de Carga en Leaderboard",
        "description": "Manejo de estados de carga y skeletons para evitar parpadeos visuales al ordenar miembros por XP."
      }
    ]
  },
  {
    "version": "V.4.0",
    "title": "Reseñas Detalladas en 6 Criterios Musicales y Calificación Canción por Canción",
    "date": "2026-08-17",
    "sha": "d0a8be3",
    "tag": "Reseñas en 6 Dimensiones",
    "tagColor": "from-purple-500 to-pink-500",
    "authorName": "Eugenio Turcott",
    "summary": "Un gran salto para los melómanos: evalúa cada disco según sus 6 notas clave (Producción, Composición, Letras, Originalidad, Cohesión y Replay Value) y califica cada canción individualmente.",
    "changes": [
      {
        "type": "feature",
        "title": "Evaluación Técnica en 6 Dimensiones",
        "description": "Sliders reactivos para Producción, Composición, Letras, Originalidad, Cohesión y Replay Value con escala visual."
      },
      {
        "type": "feature",
        "title": "Calificación Pista por Pista (Track Ratings)",
        "description": "Puntuación individual para cada canción del álbum sincronizada con el tracklist oficial de Spotify."
      },
      {
        "type": "feature",
        "title": "Nuevas Páginas de Navegación",
        "description": "Creación de rutas y componentes dedicados: LeaderboardPage, ProfilePage, SettingsPage y AlbumsPage."
      },
      {
        "type": "database",
        "title": "Migración la base de datos de Calificaciones por Pista",
        "description": "Ejecución del script update_track_ratings.la base de datos para almacenar ratings en formato JSONB estructurado."
      }
    ]
  },
  {
    "version": "V.3.5",
    "title": "Galería de Álbumes Más Clara y Visualmente Atractiva",
    "date": "2026-08-14",
    "sha": "a05507a",
    "tag": "Galería de Música",
    "tagColor": "from-pink-500 to-rose-500",
    "authorName": "Eugenio Turcott",
    "summary": "Mejoras en la cuadrícula de álbumes: carátulas más definidas, etiquetas de estado llamativas y una visualización más cómoda de tu colección.",
    "changes": [
      {
        "type": "improvement",
        "title": "Renderizado de Portadas en AlbumGrid",
        "description": "Optimización de carga diferida (lazy loading) y placeholders elegantes para portadas de Spotify."
      },
      {
        "type": "improvement",
        "title": "Filtros Rápidos en Cuadrícula",
        "description": "Selector visual entre álbumes del Pool activo, Álbumes Individuales y Ganadores anteriores."
      }
    ]
  },
  {
    "version": "V.3.4",
    "title": "Buscador de Álbumes con Spotify y Podio Dorado de Ganadores",
    "date": "2026-08-14",
    "sha": "b102c56",
    "tag": "Podio Dorado",
    "tagColor": "from-amber-500 to-yellow-500",
    "authorName": "Eugenio Turcott",
    "summary": "Encuentra cualquier álbum de Spotify para agregarlo al club con un buscador rápido y celebra a los miembros destacados con un podio dorado en los rankings.",
    "changes": [
      {
        "type": "feature",
        "title": "Buscador de Álbumes con el catálogo oficial de Spotify (AlbumSearch)",
        "description": "Búsqueda en tiempo real de álbumes, artistas y años de lanzamiento con autocompletado y carátulas HD."
      },
      {
        "type": "feature",
        "title": "Podio Visual de Campeones (#1, #2 y #3)",
        "description": "Efectos dorados, plateados y de bronce con animaciones de resplandor para los discos mejor evaluados."
      }
    ]
  },
  {
    "version": "V.3.3",
    "title": "Herramientas de Organización y Destacado del Álbum Semanal",
    "date": "2026-08-12",
    "sha": "e0e2512",
    "tag": "Álbum de la Semana",
    "tagColor": "from-blue-500 to-indigo-500",
    "authorName": "Eugenio Turcott",
    "summary": "Mejoras para coordinar las actividades del club y una tarjeta especial para lucir con orgullo el álbum ganador de cada semana.",
    "changes": [
      {
        "type": "feature",
        "title": "Panel de Administración (AdminPanel)",
        "description": "Herramientas de moderador para activar, desactivar o remover álbumes del catálogo."
      },
      {
        "type": "feature",
        "title": "Modal de Ganador Integrado (WinnerDisplay)",
        "description": "Presentación destacada con botón de reproducción en Spotify y acceso rápido a reseñas."
      }
    ]
  },
  {
    "version": "V.3.2",
    "title": "Muro Comunitario de Reseñas: Descubre lo que Opina el Club",
    "date": "2026-08-05",
    "sha": "40add2f",
    "tag": "Muro de Opiniones",
    "tagColor": "from-purple-500 to-violet-500",
    "authorName": "Eugenio Turcott",
    "summary": "Estrenamos una página dedicada para explorar todas las opiniones, notas y comentarios compartidos por los miembros sobre sus discos favoritos.",
    "changes": [
      {
        "type": "feature",
        "title": "Feed de Reseñas en Vivo (ReviewsPage)",
        "description": "Muro interactivo con las últimas reseñas enviadas por los miembros, comentarios y puntuaciones."
      },
      {
        "type": "improvement",
        "title": "Navegación en AppHeader",
        "description": "Acceso directo a la sección de Reviews desde la barra superior."
      }
    ]
  },
  {
    "version": "V.3.1",
    "title": "Navegación Fluida y Carga Inmediata de Álbumes",
    "date": "2026-08-05",
    "sha": "0932f91",
    "tag": "Fluidez Total",
    "tagColor": "from-teal-500 to-emerald-500",
    "authorName": "Eugenio Turcott",
    "summary": "La plataforma ahora guarda y actualiza tus álbumes al instante en pantalla sin parpadeos ni recargas molestas.",
    "changes": [
      {
        "type": "improvement",
        "title": "Custom Hook useAlbums",
        "description": "Centralización de queries de la biblioteca musical, filtrado de estados y refresco automático tras calificar."
      },
      {
        "type": "feature",
        "title": "Marcado de Álbumes Inactivos",
        "description": "Función para archivar álbumes que ya concluyeron su ciclo de votación."
      }
    ]
  },
  {
    "version": "V.3.0",
    "title": "La Gran Ruleta Tragamonedas Musical con 3 Carretes Estilo Arcade",
    "date": "2026-08-04",
    "sha": "bce12f5",
    "tag": "Ruleta Arcade 3D",
    "tagColor": "from-yellow-500 to-amber-600",
    "authorName": "Eugenio Turcott",
    "summary": "¡Una forma divertida de elegir qué escuchar! Estrenamos la icónica máquina tragamonedas de 3 carretes con animaciones mecánicas y sonido para descubrir discos al azar.",
    "changes": [
      {
        "type": "feature",
        "title": "Slot Machine Cyberpunk con 3 Carretes",
        "description": "Animación de giro secuencial de 3 carretes con blur de movimiento y efectos sonoros de neón."
      },
      {
        "type": "feature",
        "title": "Modal de Victoria con Lluvia de Confetti",
        "description": "Celebración inmersiva en pantalla completa al revelarse el álbum ganador."
      },
      {
        "type": "improvement",
        "title": "Integración Directa con el catálogo oficial de Spotify",
        "description": "Recuperación de enlaces oficiales de reproducción y arte de portada en alta definición."
      }
    ]
  },
  {
    "version": "V.2.4",
    "title": "Diseño Adaptable a Todo Tipo de Pantallas y Celulares",
    "date": "2026-08-03",
    "sha": "bd1baca",
    "tag": "Diseño Responsivo",
    "tagColor": "from-blue-500 to-cyan-500",
    "authorName": "eugenio-turcott",
    "summary": "Ajustamos los tamaños y espacios de la plataforma para que Musiclub se vea impecable tanto en computadoras de escritorio como en tablets y celulares.",
    "changes": [
      {
        "type": "fix",
        "title": "Alineación de Contenedores en App.js",
        "description": "Corrección de márgenes y paddings en la vista general de la aplicación."
      }
    ]
  },
  {
    "version": "V.2.3",
    "title": "Tu Sesión Siempre Activa sin Cierres Inesperados",
    "date": "2026-08-03",
    "sha": "59c9c6e",
    "tag": "Cuentas Seguras",
    "tagColor": "from-indigo-500 to-purple-500",
    "authorName": "eugenio-turcott",
    "summary": "Mejoramos el sistema de conexión para que tu cuenta permanezca iniciada de forma segura y no tengas que escribir tu contraseña constantemente.",
    "changes": [
      {
        "type": "improvement",
        "title": "Gestión de Sesión en tu cuenta conectada.js",
        "description": "Sincronización del estado de autenticación con onAuthStateChange de la biblioteca musical."
      }
    ]
  },
  {
    "version": "V.2.2",
    "title": "Tu Foto de Perfil y Menú de Usuario en la Barra Superior",
    "date": "2026-08-03",
    "sha": "f22a415",
    "tag": "Perfil de Usuario",
    "tagColor": "from-pink-500 to-rose-500",
    "authorName": "eugenio-turcott",
    "summary": "Ahora puedes ver tu avatar de Google, tu nombre de melómano y un menú rápido para acceder a tu perfil o cerrar sesión con comodidad.",
    "changes": [
      {
        "type": "feature",
        "title": "Perfil en AppHeader",
        "description": "Visualización de la foto de perfil del usuario autenticidado y menú desplegable de acciones."
      }
    ]
  },
  {
    "version": "V.2.1",
    "title": "Estética Neón Cyberpunk y Herramientas del Club",
    "date": "2026-08-03",
    "sha": "471a6d9",
    "tag": "Estilo Cyberpunk",
    "tagColor": "from-purple-500 to-indigo-500",
    "authorName": "Eugenio Turcott",
    "summary": "Musiclub estrena su atmósfera visual distintiva con tonos oscuros, detalles neón y paneles especiales para coordinar la música del club.",
    "changes": [
      {
        "type": "feature",
        "title": "Tema Visual Cyberpunk en global.css",
        "description": "Fondo de cuadrícula cibernética, efectos de neón rosa/violeta y scrollbars personalizados."
      },
      {
        "type": "feature",
        "title": "Ruta de Administración (/admin)",
        "description": "Acceso protegido para moderación de álbumes y usuarios administradores."
      }
    ]
  },
  {
    "version": "V.2.0",
    "title": "Inicio de Sesión Fácil y Seguro con tu Cuenta de Google",
    "date": "2026-08-03",
    "sha": "01696b0",
    "tag": "Cuentas con Google",
    "tagColor": "from-blue-600 to-indigo-600",
    "authorName": "Eugenio Turcott",
    "summary": "Damos la bienvenida a las cuentas oficiales: ahora puedes registrarte e iniciar sesión con un solo clic usando tu cuenta de Google para guardar tus reseñas para siempre.",
    "changes": [
      {
        "type": "feature",
        "title": "inicio de sesión seguro con Google 2.0 con la biblioteca musical",
        "description": "Inicio de sesión con un solo la plataformac, almacenamiento de perfiles de usuario y roles de permisos."
      },
      {
        "type": "feature",
        "title": "Protección de Reseñas y Propuestas",
        "description": "Vinculación de cada reseña y propuesta musical a la cuenta autenticidada del usuario."
      }
    ]
  },
  {
    "version": "V.1.9",
    "title": "Verificación Oficial de la Web en Google",
    "date": "2026-08-03",
    "sha": "c44f13f",
    "tag": "Presencia en Google",
    "tagColor": "from-emerald-500 to-teal-500",
    "authorName": "Eugenio Turcott",
    "summary": "Pasos oficiales para que Musiclub comience a aparecer en los resultados de búsqueda de Google y sea fácil de encontrar para nuevos miembros.",
    "changes": [
      {
        "type": "improvement",
        "title": "Google Search Console Verification",
        "description": "Inclusión del archivo de validación pública para monitoreo de indexación web."
      }
    ]
  },
  {
    "version": "V.1.8",
    "title": "Acceso Seguro Garantizado al Iniciar Sesión con Google",
    "date": "2026-08-03",
    "sha": "b20bf03",
    "tag": "Seguridad en Acceso",
    "tagColor": "from-blue-500 to-cyan-500",
    "authorName": "Eugenio Turcott",
    "summary": "Configuración de seguridad para que el acceso con tu cuenta de Google sea confiable, rápido y seguro en todo momento.",
    "changes": [
      {
        "type": "improvement",
        "title": "Consentimiento OAuth en Producción",
        "description": "Configuración de credenciales seguras para el flujo de autorización OAuth."
      }
    ]
  },
  {
    "version": "V.1.7",
    "title": "Previsualizaciones Hermosas al Compartir Enlaces en Redes Sociales",
    "date": "2026-08-03",
    "sha": "f330e01",
    "tag": "Enlaces en Redes",
    "tagColor": "from-pink-500 to-purple-500",
    "authorName": "Eugenio Turcott",
    "summary": "Al compartir enlaces de Musiclub en WhatsApp, Discord o Twitter, ahora aparecerán con títulos, descripción y la portada del álbum en grande.",
    "changes": [
      {
        "type": "feature",
        "title": "Componente SEO (SEO.jsx)",
        "description": "Generación dinámica de Open Graph meta tags, títulos y descripción del club musical."
      }
    ]
  },
  {
    "version": "V.1.6",
    "title": "Mensajes de Ayuda Claros al Iniciar Sesión",
    "date": "2026-08-03",
    "sha": "e4dafb5",
    "tag": "Ayuda al Usuario",
    "tagColor": "from-amber-500 to-red-500",
    "authorName": "Eugenio Turcott",
    "summary": "Mejoramos la atención a los usuarios con avisos amigables en caso de escribir mal una contraseña o requerir ayuda para entrar.",
    "changes": [
      {
        "type": "fix",
        "title": "Control de Errores de Inicio de Sesión",
        "description": "Notificaciones amigables cuando se cancela el flujo de inicio de sesión seguro con Google."
      }
    ]
  },
  {
    "version": "V.1.5",
    "title": "Ventana de Entrada al Club y Primeras Guías de Convivencia",
    "date": "2026-08-03",
    "sha": "69e7e8c",
    "tag": "Bienvenida al Club",
    "tagColor": "from-purple-500 to-pink-500",
    "authorName": "Eugenio Turcott",
    "summary": "Diseñamos una ventana cómoda para iniciar sesión con Google o correo y publicamos los términos y políticas para cuidar a nuestra comunidad.",
    "changes": [
      {
        "type": "feature",
        "title": "LoginModal con Diseño Cyberpunk",
        "description": "Ventana emergente estilizada con botón directo de Google Login y soporte de email."
      },
      {
        "type": "feature",
        "title": "Estructura Legal Inicial",
        "description": "Primer borrador de PrivacyPolicy y TermsOfService en el pie de página."
      }
    ]
  },
  {
    "version": "V.1.4",
    "title": "Mayor Rapidez al Mostrar el Catálogo de Álbumes",
    "date": "2026-08-02",
    "sha": "c93a8f7",
    "tag": "Carga de Álbumes",
    "tagColor": "from-emerald-500 to-teal-500",
    "authorName": "eugenio-turcott",
    "summary": "Mejoramos la velocidad con la que se muestran todos los discos del club para que puedas explorar la colección en menos de un segundo.",
    "changes": [
      {
        "type": "improvement",
        "title": "Optimización de la plataformaente la biblioteca musical",
        "description": "Uso de transacciones limpias y control de reconexiones en la biblioteca musicalla plataformaent.js."
      }
    ]
  },
  {
    "version": "V.1.3",
    "title": "Tabla de Posiciones de los Álbumes Mejor Calificados",
    "date": "2026-08-02",
    "sha": "686bdef",
    "tag": "Top de Álbumes",
    "tagColor": "from-amber-500 to-yellow-500",
    "authorName": "eugenio-turcott",
    "summary": "Calculamos en tiempo real el promedio histórico de cada disco para coronar a las mejores obras musicales según los votos del club.",
    "changes": [
      {
        "type": "feature",
        "title": "Tabla de Rankings en Tiempo Real",
        "description": "Ordenamiento reactivo por puntuación general y distinción entre pool e individuales."
      }
    ]
  },
  {
    "version": "V.1.2",
    "title": "Mudanza de los Registros Históricos a la Nueva Biblioteca del Club",
    "date": "2026-08-02",
    "sha": "72e56a8",
    "tag": "Biblioteca Permanente",
    "tagColor": "from-teal-500 to-cyan-500",
    "authorName": "eugenio-turcott",
    "summary": "Traspasamos todas las reseñas, álbumes y notas de las antiguas hojas de cálculo a la nueva base de datos permanente de Musiclub.",
    "changes": [
      {
        "type": "database",
        "title": "Scripts de Migración (migrateAlbums / migrateReviews)",
        "description": "Migración automatizada de registros históricos manteniendo la integridad de fechas y puntuaciones."
      },
      {
        "type": "database",
        "title": "Esquema Relacional Inicial en la biblioteca musical",
        "description": "Tablas relacionales albums y reviews con llaves foráneas y restricciones."
      }
    ]
  },
  {
    "version": "V.1.1",
    "title": "Mejoras de Estabilidad y Puesta a Punto de la Plataforma",
    "date": "2026-07-26",
    "sha": "8dc035f",
    "tag": "Estabilidad y Ajustes",
    "tagColor": "from-gray-500 to-slate-600",
    "authorName": "Eugenio Turcott",
    "summary": "Actualización de las herramientas internas para garantizar un funcionamiento fluido, moderno y sin fallos.",
    "changes": [
      {
        "type": "improvement",
        "title": "Optimización de Dependencias",
        "description": "Limpieza de paquetes innecesarios en package.json."
      }
    ]
  },
  {
    "version": "V.1.0",
    "title": "¡El Nacimiento Oficial de Musiclub! Nuestra Gran Comunidad Musical en la Web",
    "date": "2026-07-26",
    "sha": "427ba9b",
    "tag": "Lanzamiento Oficial",
    "tagColor": "from-emerald-500 to-green-600",
    "authorName": "eugenio-turcott",
    "summary": "El comienzo de una gran aventura: Musiclub da el salto de una hoja de cálculo a una plataforma web completa con catálogo de Spotify, reseñas de la comunidad y ruleta musical.",
    "changes": [
      {
        "type": "feature",
        "title": "Conexión con la biblioteca musical y el catálogo oficial de Spotify",
        "description": "Búsqueda en catálogo oficial de Spotify y persistencia de propuestas y votos en la biblioteca musical."
      },
      {
        "type": "feature",
        "title": "Primer Sistema de Reseñas y Puntuación",
        "description": "Formulario para calificar discos y almacenar comentarios de los miembros."
      },
      {
        "type": "feature",
        "title": "Slot Machine y Cuadrícula de Discos",
        "description": "Interfaz gráfica inicial para sorteo de discos y visualización en tarjetas."
      }
    ]
  },
  {
    "version": "V.0.2",
    "title": "La Primera Ruleta Musical y Galería Experimental de Álbumes",
    "date": "2026-07-15",
    "sha": "197bd9d",
    "tag": "Primeros Pasos",
    "tagColor": "from-amber-600 to-orange-600",
    "authorName": "Eugenio Turcott",
    "summary": "Los primeros experimentos del club: una ruleta circular giratoria para sortear discos y una galería sencilla para ver las carátulas de la música.",
    "changes": [
      {
        "type": "feature",
        "title": "Prototipo de Ruleta Circular SVG (Wheel.jsx)",
        "description": "Rueda gráfica con segmentos divididos por álbum y animación de rotación."
      },
      {
        "type": "feature",
        "title": "Modal Emergente de Ganador (WinnerPopup.jsx)",
        "description": "Ventana básica para mostrar el disco resultante del giro."
      }
    ]
  },
  {
    "version": "V.0.1",
    "title": "Primer Bosquejo Visual de lo que Sería Musiclub",
    "date": "2026-07-14",
    "sha": "c882be0",
    "tag": "Primer Bosquejo",
    "tagColor": "from-blue-600 to-indigo-600",
    "authorName": "Eugenio Turcott",
    "summary": "El primer diseño visual del club en pantalla conectando las opiniones de los primeros miembros fundadores.",
    "changes": [
      {
        "type": "feature",
        "title": "Configuración de diseño visual estilizado y Estilos Base",
        "description": "Estructura de fuentes, colores oscuros y componentes iniciales de UI."
      },
      {
        "type": "feature",
        "title": "Primer Boceto de la Ruleta Musical",
        "description": "Maquetación de la ruleta de discos para las reuniones del club."
      }
    ]
  },
  {
    "version": "V.0.0",
    "title": "La Primera Semilla de Musiclub: El Comienzo del Sueño Melómano",
    "date": "2026-07-14",
    "sha": "7de6dba",
    "tag": "El Origen",
    "tagColor": "from-gray-600 to-slate-700",
    "authorName": "Eugenio Turcott",
    "summary": "Creación del proyecto original y primeros pasos de código para construir la casa digital de los amantes de la música.",
    "changes": [
      {
        "type": "feature",
        "title": "Setup Inicial con los cimientos de la plataforma",
        "description": "Configuración del entorno de desarrollo, gitignore, package.json y estructura base."
      }
    ]
  }
];

export function mergeGithubCommitsWithCuratedNotes(githubCommits = []) {
  if (!githubCommits || githubCommits.length === 0) {
    return CURATED_PATCH_NOTES;
  }

  const enrichedList = [];
  const processedKeys = new Set();

  githubCommits.forEach((ghCommit) => {
    const authorLogin = (ghCommit.author?.login || '').toLowerCase();
    const commitAuthorName = (ghCommit.commit?.author?.name || '').toLowerCase();
    const committerName = (ghCommit.commit?.committer?.name || '').toLowerCase();
    const committerLogin = (ghCommit.committer?.login || '').toLowerCase();
    const message = ghCommit.commit?.message || '';

    // 1. Ignorar commits automáticos de bots (GitHub Actions bot, Dependabot, workflows, etc.)
    const isBot =
      authorLogin.includes('bot') ||
      authorLogin.includes('github-actions') ||
      commitAuthorName.includes('bot') ||
      commitAuthorName.includes('github-actions') ||
      committerLogin.includes('bot') ||
      committerName.includes('github-actions');

    // 2. Ignorar commits de mantenimiento recurrente o sincronización CI/CD
    const isAutomatedRoutine =
      /automated hourly|hourly catalog ingestion|sitemap update|\[skip ci\]|chore\(deps\)|dependabot/i.test(message) ||
      message.toLowerCase().startsWith('chore: automated');

    // 3. Ignorar commits de Merge y resolución de conflictos de ramas de Git
    const isMergeOrConflict =
      /^merge\s/i.test(message.trim()) ||
      message.toLowerCase().includes('merge branch') ||
      message.toLowerCase().includes('merge pull request') ||
      message.toLowerCase().includes('merge remote-tracking') ||
      /#\s*conflicts:/i.test(message) ||
      /conflicts:\s*#/i.test(message);

    if (isBot || isAutomatedRoutine || isMergeOrConflict) {
      return; // No mostrar tareas automáticas, bots ni merges en las Patch Notes
    }

    const sha = ghCommit.sha?.substring(0, 7) || '';
    const fullSha = ghCommit.sha || '';
    const date = ghCommit.commit?.author?.date
      ? ghCommit.commit.author.date.substring(0, 10)
      : new Date().toISOString().substring(0, 10);
    const authorName =
      ghCommit.commit?.author?.name ||
      ghCommit.author?.login ||
      'Eugenio Turcott';
    const authorAvatar = ghCommit.author?.avatar_url || null;
    const commitUrl =
      ghCommit.html_url ||
      `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commit/${fullSha}`;

    // Buscar coincidencia de versión en mensaje ej "Slot Machine Álbumes - V.5.2" o "Slot Machine Álbumes - V.5.1"
    const versionMatch = message.match(/V\.?\s?(\d+\.\d+(\.\d+)?)/i);
    const versionKey = versionMatch ? `V.${versionMatch[1]}` : null;

    // Buscar en notas curadas por SHA corto, por associatedShas o por versión semántica
    const curated = CURATED_PATCH_NOTES.find(
      (n) =>
        (n.sha && (sha.startsWith(n.sha) || n.sha.startsWith(sha))) ||
        (n.associatedShas &&
          n.associatedShas.some((s) => sha.startsWith(s) || s.startsWith(sha))) ||
        (versionKey && n.version.toLowerCase() === versionKey.toLowerCase())
    );

    if (curated) {
      const matchKey = curated.version;
      if (!processedKeys.has(matchKey)) {
        processedKeys.add(matchKey);
        enrichedList.push({
          ...curated,
          sha: curated.sha || sha,
          fullSha: fullSha || curated.fullSha,
          authorName: curated.authorName || authorName,
          authorAvatar: authorAvatar || curated.authorAvatar,
          commitUrl:
            curated.commitUrl ||
            `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commit/${curated.sha || sha}`,
          rawMessage: message,
          isFromGithub: true,
        });
      }
    }
    // IMPORTANTE: Los commits individuales intermedios que no son una versión oficial
    // NO se muestran como pseudo-versiones ('v47ce38d'). Se consolidan en su versión oficial.
  });

  // Agregar cualquier nota curada que aún no haya sido devuelta por la API
  const pendingCurated = [];
  CURATED_PATCH_NOTES.forEach((curated) => {
    if (!processedKeys.has(curated.version)) {
      pendingCurated.push({
        ...curated,
        commitUrl:
          curated.commitUrl ||
          `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commit/${curated.sha || 'HEAD'}`,
        isFromGithub: false,
      });
    }
  });

  const combined = [...pendingCurated, ...enrichedList];

  // Ordenar de forma descendente por fecha y por versión semántica
  combined.sort((a, b) => {
    const dateComp = (b.date || '').localeCompare(a.date || '');
    if (dateComp !== 0) return dateComp;

    const vMatchA = (a.version || '').match(/V\.?(\d+)\.(\d+)(?:\.(\d+))?/i);
    const vMatchB = (b.version || '').match(/V\.?(\d+)\.(\d+)(?:\.(\d+))?/i);
    if (vMatchA && vMatchB) {
      const major = parseInt(vMatchB[1], 10) - parseInt(vMatchA[1], 10);
      if (major !== 0) return major;
      const minor = parseInt(vMatchB[2], 10) - parseInt(vMatchA[2], 10);
      if (minor !== 0) return minor;
      return parseInt(vMatchB[3] || '0', 10) - parseInt(vMatchA[3] || '0', 10);
    }
    return 0;
  });

  return combined;
}
