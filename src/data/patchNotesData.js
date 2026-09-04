// src/data/patchNotesData.js
/**
 * Musiclub Patch Notes & GitHub Changelog Registry
 * Contiene el registro detallado de novedades de TODOS los commits y versiones históricas
 * y el motor de sincronización con los commits en tiempo real del repositorio GitHub.
 */

export const GITHUB_REPO_OWNER = 'eugenio-turcott';
export const GITHUB_REPO_NAME = 'musiclub-albumes';
export const GITHUB_COMMITS_API = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commits?per_page=100`;

export const CURATED_PATCH_NOTES = [
  // ----------------------------------------------------
  // V6.x (Septiembre 2026)
  // ----------------------------------------------------
  {
    version: 'V.6.7',
    title:
      'Desacoplamiento Estructural de user_id en Álbumes, Migración Supabase y Filtro Inteligente Anti-Ruido en Changelog',
    date: '2026-09-04',
    sha: 'HEAD',
    tag: 'Mayor',
    tagColor: 'from-emerald-500 via-teal-500 to-cyan-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Actualización V.6.7 de Musiclub enfocada en la limpieza estructural de la base de datos y la optimización del historial de versiones: eliminación de la columna user_id y su clave foránea en la tabla albums normalizando la autoría hacia pool_entries, actualización completa de los servicios y hooks del cliente (useNotifications, useAlbums, poolService, syncPoolGraduates), y un motor inteligente de filtrado en Patch Notes que erradica el ruido de bots automáticos de CI/CD (github-actions[bot], [skip ci]) y commits de merge o conflictos de Git.',
    changes: [
      {
        type: 'refactor',
        title: 'Desacoplamiento Canónico de user_id en la Tabla albums',
        description:
          'Se preparó y ejecutó la migración SQL para eliminar la columna user_id y la restricción albums_user_id_fkey en Supabase PostgreSQL. Las nominaciones, autoría y estados activos del club quedan centralizados exclusivamente en la tabla pool_entries.',
      },
      {
        type: 'fix',
        title: 'Refactorización del Sistema de Notificaciones Comunitarias',
        description:
          'Ajuste en useNotifications.js para obtener las reseñas de álbumes propuestos por el usuario a través de pool_entries en lugar de albums.user_id, previniendo excepciones SQL de columna inexistente y reflejando con exactitud las nominaciones activas.',
      },
      {
        type: 'improvement',
        title: 'Limpieza de Servicios y Mapeos de Estado (useAlbums, poolService, syncPoolGraduates)',
        description:
          'Eliminación del campo obsoleto user_id en las transformaciones de useAlbums, supabaseClient y poolService, así como en los scripts de sincronización de álbumes graduados.',
      },
      {
        type: 'feature',
        title: 'Filtro Anti-Ruido en Patch Notes (Exclusión de Bots de CI/CD y Commits de Merge)',
        description:
          'Integración de un filtro dual en patchNotesData.js y PatchNotes.jsx que oculta automáticamente commits de github-actions[bot], tareas de ingesta horaria, tags [skip ci], commits de merge (Merge branch...) y líneas generadas por conflictos de Git (# Conflicts:).',
      },
      {
        type: 'improvement',
        title: 'Motor de Ordenamiento Semántico y Cronológico de Versiones',
        description:
          'Nuevo algoritmo de ordenamiento descendente por fecha y versión semántica (Major.Minor.Patch) que combina armónicamente los commits en vivo de la API de GitHub con las notas de versión curadas de Musiclub.',
      },
    ],
  },
  {
    version: 'V.6.6',
    title:
      'Buscador Híbrido Silencioso, Enriquecimiento Multi-Plataforma (Deezer, Apple Music, YouTube y Spotify), Logos Oficiales e Ingesta cada 30 Minutos',
    date: '2026-09-04',
    sha: 'HEAD',
    tag: 'Mayor',
    tagColor: 'from-violet-500 via-fuchsia-500 to-rose-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Actualización mayor V.6.6 de Musiclub enfocada en la experiencia de búsqueda y streaming multi-plataforma: integración de un motor de búsqueda híbrido transparente sin marcas de terceros, soporte y logos vectoriales oficiales para Spotify, Apple Music, YouTube y Deezer en toda la aplicación, pipeline de ingesta automatizada cada 30 minutos con control de cuotas y timeouts, y normalización completa de los 262 lanzamientos de la base de datos.',
    changes: [
      {
        type: 'feature',
        title: 'Buscador Musical Híbrido, Invisible y Silencioso',
        description:
          'Búsqueda en tiempo real a través de APIs de streaming que guarda directamente la ficha del álbum con metadatos canónicos de MusicBrainz (MBID, tracks, sello, año y formato) y carátulas HD, ocultando de forma transparente cualquier mención a proveedores externos en la interfaz de usuario.',
      },
      {
        type: 'feature',
        title: 'Soporte de 4 Plataformas de Streaming y Logos Vectoriales Oficiales',
        description:
          'Componente global de logos vectoriales (Spotify, Apple Music, YouTube y Deezer) integrado de extremo a extremo en la ficha del lanzamiento (AlbumDetail), Panel de Administración, Buzón de Canciones, Catálogo de Playlists y Recomendaciones.',
      },
      {
        type: 'improvement',
        title: 'Pipeline de Ingesta Automática cada 30 Minutos con Pacing y Timeouts',
        description:
          'Se actualizó la frecuencia del cron y workflow a 30 minutos, procesando lotes de 50 álbumes con portadas HD (1000x1000) y pausas de seguridad entre llamadas a APIs para evitar bloqueos por rate limiting.',
      },
      {
        type: 'fix',
        title: 'Enriquecimiento Retroactivo de los 262 Lanzamientos en Base de Datos',
        description:
          'Se procesó el 100% de los álbumes en Supabase para completar enlaces a Deezer (other_link), Apple Music, YouTube, verificación Spotify en true y resolución de MBIDs canónicos.',
      },
    ],
  },
  {
    version: 'V.6.5',
    title:
      'Restauración de Catálogo y Reviews, Paginación PostgREST >1000 Filas, Extracción Garantizada de Canciones y Supresión de Rate Limits (429/403/CORS)',
    date: '2026-09-03',
    sha: 'HEAD',
    tag: 'Mayor',
    tagColor: 'from-pink-500 via-rose-500 to-amber-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Solución integral a la desincronización del catálogo y reviews provocada por la ingesta masiva: eliminación de 1,009 álbumes fantasma sin canciones, restauración de tracklists completos para Tango Astral y Jane Remover, paginación en consultas de Supabase para superar el límite por defecto de 1,000 filas de PostgREST, mitigación de bucles agresivos en AlbumsCatalog que ocasionaban 429 de Spotify y 403/CORS de Apple iTunes, y blindaje de la creación de álbumes con fallback inmediato de canciones (Spotify -> MusicBrainz -> iTunes).',
    changes: [
      {
        type: 'fix',
        title: 'Depuración de Álbumes Fantasma y Restauración de Estadísticas Globales',
        description:
          'Se eliminaron con éxito los 1,009 registros vacíos generados sin canciones en Supabase, reajustando la base de datos a 161 lanzamientos legítimos del club y recalculando de inmediato los contadores del Catálogo (Total Lanzamientos, Total Reseñas, Mejor Calificado y Promedio Global).',
      },
      {
        type: 'fix',
        title: 'Corrección de "Álbum / Artista" en Mi Perfil (Mis Reviews)',
        description:
          'Ajuste en UserProfile.jsx para enriquecer las reseñas utilizando la relación directa review.albums / review.album cuando el álbum no se encuentre precargado en el mapa local. Las reviews personales ahora muestran siempre el título, artista, portada y canciones reales.',
      },
      {
        type: 'fix',
        title: 'Paginación de Consultas Supabase (Superación del Límite de 1,000 Filas)',
        description:
          'Se implementó paginación automática mediante bloques de 1,000 filas (.range()) en getAllAlbumsWithFullStats y en el hook useAlbums. Esto previene que catálogos extensos oculten u omitan los álbumes con reseñas y nominaciones existentes.',
      },
      {
        type: 'improvement',
        title: 'Eliminación del Bucle Agresivo de Años en Catálogo (Fin de Errores 429 y 403 CORS)',
        description:
          'Se reestructuró la resolución en segundo plano de años de lanzamiento en AlbumsCatalog.jsx, limitándola a un máximo de 2 elementos por sesión con retardo espaciado de 2 segundos. Se erradican por completo las alertas de cuota excedida (Spotify 429) y los bloqueos 403 Forbidden / CORS en Apple Music.',
      },
      {
        type: 'feature',
        title: 'Garantía de Canciones en Creación de Álbumes e Ingesta Controlada',
        description:
          'Tanto HeaderAlbumSearch como supabaseService.createAlbum cuentan ahora con extracción en cascada de tracklists (Spotify -> MusicBrainz -> iTunes) para asegurar que ningún álbum se cree con canciones vacías ([]). Asimismo, el script de ingesta por lotes y su workflow de GitHub Actions se calibraron a 25 lanzamientos verificados con tracklists completos y filtrado estricto.',
      },
      {
        type: 'feature',
        title: 'Paginación Dinámica en "Mis Reviews" (Mi Perfil)',
        description:
          'Se incorporó paginación interactiva en la pestaña de Mis Reviews de UserProfile.jsx con selector personalizable de elementos por página (10, 20 o 50 reviews), botones de avance/retroceso rápido y desplazamiento suave automático directo al inicio del listado.',
      },
    ],
  },
  {
    version: 'V.6.4',
    title:
      'Corrección de Notificaciones de Ganador en Pool, Sincronización de 21 Álbumes Graduados y Buscador Resiliente Multi-Tier',
    date: '2026-09-03',
    sha: 'HEAD',
    tag: 'Menor',
    tagColor: 'from-emerald-500 via-teal-500 to-cyan-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Actualización V.6.4 enfocada en la precisión del sistema de notificaciones del club, sincronización integral de los 21 lanzamientos históricos del Pool con asignación de perfiles y estados de graduación, y optimización de resiliencia del buscador musical con arquitectura multi-tier (Spotify, Apple Music / iTunes y Deezer) ante límites de tasa (429).',
    changes: [
      {
        type: 'fix',
        title: 'Corrección de Notificaciones Globales de Álbum Ganador',
        description:
          'Ajuste en supabaseService.getCurrentWinner() para consultar exclusivamente la tabla pool_entries por status = "GANADOR" en lugar de basarse en reviews_enabled de la tabla albums. Esto elimina las notificaciones erróneas generadas tras la ingesta masiva de álbumes externos y garantiza que solo se anuncie el disco ganador oficial de la semana del club.',
      },
      {
        type: 'feature',
        title: 'Sincronización y Graduación de 21 Álbumes Históricos en pool_entries',
        description:
          'Comprobación, normalización y registro completo en pool_entries de los 21 álbumes históricos del club (incluyendo Weyes Blood, Judeline, Madonna, Little Jesus, Knocked Loose, Todos mueren en abril, Ashe, Serú Girán, Sampha, DANNA, Silvana Estrada, Tango Astral, Sade y Jane Remover). Los álbumes que no figuraban en el pool fueron integrados como GRADUADOS con sus respectivos campos de autor (nominated_by, user_id, email) y temporada activa.',
      },
      {
        type: 'improvement',
        title: 'Buscador y Crawler Musical Resiliente con Fallback Multi-Tier',
        description:
          'Incorporación de un Circuit Breaker inteligente en spotifyApi.js que conmuta fluidamente a iTunes Search API y Deezer cuando la API de Spotify devuelve 429 (Rate Limit). Resolución de portadas HD de hasta 1000x1000, soporte de tracks completo, validación de cabeceras HEAD en Cover Art Archive para evitar imágenes rotas (404) y concatenación precisa de artistas colaboradores con join phrases en la ingesta de MusicBrainz.',
      },
      {
        type: 'improvement',
        title: 'Eliminación Integral de LoadingOverlay y Rediseño Hero Institucional',
        description:
          'Limpieza y desacoplamiento de componentes de carga invasivos (LoadingOverlay) en todas las vistas de la aplicación, sustituyéndolos por transiciones fluidas de skeleton y adaptando las páginas de FAQ, Privacidad y Términos a la estética visual moderna y metadatos SEO implementados en Patch Notes.',
      },
    ],
  },
  {
    version: 'V.6.3',
    title:
      'Meta Description Global SEO en index.html, Blindaje WebSocket en CLI y Actualización de Runner a Node.js 22',
    date: '2026-09-03',
    sha: 'HEAD',
    tag: 'Menor',
    tagColor: 'from-cyan-500 via-blue-500 to-indigo-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Mejora de SEO global en index.html con meta description, keywords y Open Graph para previsualización e indexación en motores de búsqueda, blindaje con polyfill de WebSocket en los scripts de backend para compatibilidad universal con Supabase JS y actualización del entorno de GitHub Actions a Node.js 22.',
    changes: [
      {
        type: 'feature',
        title: 'Meta Description y Metadatos Globales SEO en index.html',
        description:
          'Incorporación de meta description oficial, palabras clave, canonical URL y etiquetas Open Graph y Twitter Cards directamente en index.html para una indexación inmediata y previsualizaciones enriquecidas en motores de búsqueda (Google, Bing) y redes sociales.',
      },
      {
        type: 'fix',
        title: 'Actualización de GitHub Actions a Node.js 22',
        description:
          'Actualización del runner en el flujo hourly_musicbrainz_ingest.yml a Node.js 22, satisfaciendo los nuevos requerimientos nativos de @supabase/supabase-js.',
      },
      {
        type: 'fix',
        title: 'Blindaje WebSocket y Sesión Ligera en Scripts CLI',
        description:
          'Implementación de polyfill de WebSocket e inicialización auth.persistSession: false en hourlyMusicBrainzIngestion.mjs, generate-sitemap.js y enrichMissingMusicBrainz.mjs, garantizando ejecución sin fallos en cualquier entorno de Node.',
      },
    ],
  },
  {
    version: 'V.6.2',
    title:
      'Metadatos Oficiales de MusicBrainz + Portadas Spotify CDN, Ingesta Horaria Automatizada (1,000 Álbumes/Hora), GitHub Actions 24/7 y Sitemap XML Paginado',
    date: '2026-09-03',
    sha: 'HEAD',
    tag: 'Mayor',
    tagColor: 'from-pink-500 via-purple-500 to-cyan-400',
    authorName: 'Eugenio Turcott',
    summary:
      'Actualización mayor V.6.2 de Musiclub con arquitectura híbrida transparente de enriquecimiento musical: portadas oficiales en alta definición extraídas directamente del CDN de Spotify y metadatos canónicos completos provistos por MusicBrainz (MBID, formato, año, géneros, discográfica, país, barcode y tracks). Incluye ingesta horaria automatizada de 1,000 lanzamientos vía GitHub Actions con persistencia de estado, regeneración continua de sitemap.xml paginado para indexación masiva en Google, blindaje de traducción en DNA Musical y robustez en reviews comunitarias.',
    changes: [
      {
        type: 'feature',
        title: 'Arquitectura Híbrida: Portadas Spotify HD + Metadatos Canónicos de MusicBrainz',
        description:
          'Integración transparente e invisible en el flujo de creación de álbumes (createAlbum en supabaseClient.js y enrichAlbumWithMusicBrainz en musicBrainzService.js). Al añadir cualquier lanzamiento, la carátula oficial de alta resolución se extrae y preserva siempre desde el CDN de Spotify (i.scdn.co), mientras que el MBID canónico, formato normalizado (ALBUM, EP, SENCILLO, COMPILACION, etc.), fecha y año oficial, géneros, discográfica, país, código de barras y listado de pistas se resuelven automáticamente desde MusicBrainz.',
      },
      {
        type: 'feature',
        title: 'Ingesta Horaria Automatizada de 1,000 Álbumes desde MusicBrainz',
        description:
          'Motor de ingesta por lotes (scripts/hourlyMusicBrainzIngestion.mjs) que descarga 1,000 nuevos lanzamientos oficiales por hora en bloques de 100, consulta la API de Spotify para asociar carátulas oficiales en alta calidad y realiza upsert masivo en Supabase (public.albums) con control de duplicados y cursor persistente en scripts/crawler_state.json.',
      },
      {
        type: 'feature',
        title: 'Automatización 24/7 en la Nube con GitHub Actions',
        description:
          'Workflow en .github/workflows/hourly_musicbrainz_ingest.yml con disparador cron horario (0 * * * *), permisos de escritura para auto-commit de sitemap y estado del crawler, y notificación instantánea (ping) a motores de búsqueda.',
      },
      {
        type: 'improvement',
        title: 'Sitemap Dinámico Paginado y Detección Automática para Google',
        description:
          'Actualización de scripts/generate-sitemap.js con paginación exhaustiva sobre la base de datos de Supabase (superando el límite de 1,000 filas de PostgREST) y arquitectura de partición para más de 45,000 URLs con sitemapindex. El sitemap se regenera automáticamente al finalizar cada lote de ingesta para indexación inmediata por Googlebot.',
      },
      {
        type: 'improvement',
        title: 'Ajuste de Rastreo en robots.txt',
        description:
          'Inclusión de reglas de rastreo explícitas en public/robots.txt para /eps/, /sencillos/, /compilaciones/ y /remixes/, maximizando la cobertura SEO de todos los formatos del catálogo.',
      },
      {
        type: 'fix',
        title: 'Blindaje de Traducción en DNA Musical y Espera de Hidratación',
        description:
          'Aislamiento estricto (translate="no") en artistas y miembros del club dentro del componente de Recomendaciones, evitando que traductores automáticos alteren nombres propios, y ajuste del temporizador de traducción a 2 segundos en cambios de página y recargas.',
      },
      {
        type: 'fix',
        title: 'Sincronización de Avatar de Autor en Reviews Comunitarias',
        description:
          'Corrección de sincronización de reviewer_avatar en la tabla reviews, integrando trigger SQL de respaldo y fallback visual robusto para garantizar la visualización de avatares en todas las reseñas.',
      },
    ],
  },
  {
    version: 'V.6.1',
    title: 'Tag de Anuncios de Google AdSense',
    date: '2026-09-03',
    sha: 'HEAD',
    tag: 'Menor',
    tagColor: 'from-pink-500 via-purple-500 to-cyan-400',
    authorName: 'Eugenio Turcott',
    summary:
      'Integración del tag de anuncios de Google AdSense en el index.html para monetización de la plataforma.',
    changes: [
      {
        type: 'feature',
        title: 'Tag de Anuncios de Google AdSense',
        description:
          'Incorporación del tag de anuncios de Google AdSense en el archivo index.html para permitir la monetización de la plataforma a través de publicidad.',
      },
    ],
  },
  {
    version: 'V.6.0',
    title:
      'Enrutamiento Semántico por Tipo de Release, Portadas HD vía Spotify CDN, Vinilo Interactivo Invertido, Blindaje Lingüístico Universal y Sitemap 554+',
    date: '2026-09-01',
    sha: 'HEAD',
    tag: 'Mayor',
    tagColor: 'from-pink-500 via-purple-500 to-cyan-400',
    authorName: 'Eugenio Turcott',
    summary:
      'Lanzamiento mayor V.6.0 de Musiclub con arquitectura de URLs semánticas categorizadas por formato de lanzamiento (/catalogo, /eps/:slug, /sencillos/:slug, /remixes/:slug, /compilaciones/:slug, /albumes/:slug), migración y optimización de portadas en alta velocidad vía CDN oficial de Spotify, microinteracción de vinilo con hover invertido, blindaje estricto contra traducción automática en nombres propios de música y miembros, y regeneración del sitemap canónico.',
    changes: [
      {
        type: 'feature',
        title:
          'Enrutamiento Semántico y Breadcrumbs por Formato de Release (/catalogo, /eps, /sencillos, /remixes, /compilaciones, /albumes)',
        description:
          'Migración de la ruta general a /catalogo y diferenciación de URLs dinámicas para cada tipo de lanzamiento según su formato: /eps/:slug (e.g. /eps/FIRE-ON-MARZZ), /sencillos/:slug, /remixes/:slug, /compilaciones/:slug y /albumes/:slug. Las fichas técnicas ahora muestran breadcrumbs dinámicos contextualizados con el formato exacto del disco (ej. Inicio / EPs / FIRE ON MARZZ).',
      },
      {
        type: 'feature',
        title:
          'Portadas de Alta Definición y Renderizado Ultrarrápido vía Spotify CDN',
        description:
          'Integración directa con el CDN oficial de Spotify (i.scdn.co) para todas las portadas de la discografía, pool semanal, catálogo y perfiles, logrando tiempos de carga inmediatos y consistencia visual uniforme en todas las resoluciones.',
      },
      {
        type: 'improvement',
        title: 'Vinilo Interactivo en Hero con Microinteracción Invertida',
        description:
          'Alineación y centrado del disco de vinilo sobre la portada en el Hero interactivo. Se perfeccionó el comportamiento de animación para responder exclusivamente al cursor sobre el vinilo, permitiendo que el hover deslice e inserte el vinilo suavemente dentro de su funda.',
      },
      {
        type: 'feature',
        title:
          'Blindaje Estricto de Traducción Lingüística en Entidades Musicales y Miembros',
        description:
          'Protección universal con translate="no" y clases semánticas (.notranslate, .music-title, .artist-name, .username-tag, .track-name) respaldada por un MutationObserver en tiempo real. Garantiza que los nombres de lanzamientos, artistas, canciones evaluadas y miembros nunca sean alterados por Google Translate ni traductores de navegador, mientras que el resto de la interfaz y reseñas se traducen fluidamente.',
      },
      {
        type: 'improvement',
        title:
          'Sitemap Dinámico con 554 URLs Canónicas y Pipeline Automatizado',
        description:
          'Actualización del generador scripts/generate-sitemap.js para clasificar automáticamente las 554 rutas de lanzamientos de la plataforma de acuerdo con su tipo de formato (/eps/..., /sencillos/..., etc.) y regeneración automática antes de cada compilación de producción.',
      },
    ],
  },
  // ----------------------------------------------------
  // V5.x (Agosto 2026)
  // ----------------------------------------------------
  {
    version: 'V.5.9',
    title:
      'Traductor Multi-Idioma Global (10 Idiomas), Aislamiento de Metadatos Musicales, Página 404 Inmersiva y SEO robots.txt',
    date: '2026-08-31',
    sha: 'HEAD',
    tag: 'Mayor',
    tagColor: 'from-purple-500 via-pink-500 to-cyan-400',
    authorName: 'Eugenio Turcott',
    summary:
      'Internacionalización completa de Musiclub para audiencia mundial con selector de 10 idiomas en tiempo real (Español, English, Português, Français, Deutsch, Italiano, 日本語, 한국어, 中文, Русский) con aislamiento inteligente que preserva nombres de discos, canciones, artistas y usuarios intactos mientras traduce el 100% de la interfaz y reseñas. Incluye además la nueva página 404 "Pista Fuera de Órbita", robots.txt canónico y corrección de fondo.',
    changes: [
      {
        type: 'feature',
        title: 'Traductor Multi-Idioma Global en Tiempo Real',
        description:
          'Integración de LanguageSelector en el Header y Footer con soporte para 10 idiomas (Español, Inglés, Portugués, Francés, Alemán, Italiano, Japonés, Coreano, Chino y Ruso). Traduce al instante la plataforma completa con diseño neón personalizado, detección de idioma y persistencia.',
      },
      {
        type: 'feature',
        title: 'Aislamiento Inteligente de Metadatos Musicales y Usuarios',
        description:
          'Implementación de protecciones granulares (translate="no" y .notranslate) en títulos de álbumes (e.g. Marchita, Mon Laferte Vol. 1), artistas, nombres de canciones y nombres de usuarios en podios, cuadrículas, catálogo y reseñas, permitiendo traducir las etiquetas de interfaz ("Añadido por:", "canciones", "Ganador", "reviews") sin alterar los nombres propios originales.',
      },
      {
        type: 'feature',
        title: 'Página 404 "Pista Fuera de Órbita" & Enrutamiento Universal',
        description:
          'Diseño interactivo con estética visual cyberpunk/neón de Musiclub, animación de disco de vinilo en rotación holográfica, accesos rápidos (Inicio, Álbumes, Leaderboard, Gashapon) y enrutamiento catch-all universal (* y /404).',
      },
      {
        type: 'improvement',
        title: 'Archivo robots.txt Estandarizado para musiclub.org',
        description:
          'Generación del archivo robots.txt en public/ configurando rastreo universal para Googlebot y buscadores internacionales, protección de rutas privadas y referencia al sitemap.xml canónico.',
      },
      {
        type: 'fix',
        title: 'Corrección de Repetición Visual del Fondo',
        description:
          'Ajuste en la capa del fondo de la aplicación (fixed inset-0 con background-repeat: no-repeat y cover) eliminando el efecto de mosaico y corte en scrolls largos y pantallas de alta resolución.',
      },
    ],
  },
  {
    version: 'V.5.8',
    title:
      'Modificaciones mínimas en archivos de control de la aplicación para compatibilidad con el nuevo dominio musiclub.org',
    date: '2026-08-31',
    sha: 'HEAD',
    tag: 'Menor',
    tagColor: 'from-purple-500 via-pink-500 to-cyan-400',
    authorName: 'Eugenio Turcott',
    summary:
      'Ajustes menores en archivos de control de la aplicación para garantizar compatibilidad con el nuevo dominio musiclub.org y la resolución de rutas dinámicas en entornos locales y de previsualización.',
    changes: [
      {
        type: 'improvement',
        title: 'Ajustes de Compatibilidad con musiclub.org',
        description:
          'Modificaciones en los archivos de configuración y rutas de la aplicación para asegurar la compatibilidad total con el nuevo dominio musiclub.org y la resolución correcta de URLs en entornos locales y de previsualización.',
      },
    ],
  },
  {
    version: 'V.5.7',
    title:
      'Programmatic SEO, Resolución On-Demand con Spotify API y Sitemap XML de 540+ URLs',
    date: '2026-08-31',
    sha: '5cd74c2',
    tag: 'Mayor',
    tagColor: 'from-rose-500 via-pink-500 to-cyan-400',
    authorName: 'Eugenio Turcott',
    summary:
      'Implementación de Programmatic SEO con resolución on-demand de álbumes desde Spotify API y auto-creación en base de datos al calificar, expansión del Sitemap XML a +540 URLs canónicas y curaduría histórica de álbumes populares.',
    changes: [
      {
        type: 'feature',
        title: 'Resolución On-Demand de Álbumes con Spotify & Programmatic SEO',
        description:
          'Capacidad para navegar y consultar cualquier álbum del mundo por su URL (e.g. /albumes/sour). Si el disco no existe en la base de datos de Musiclub, el sistema lo resuelve en milisegundos desde Spotify con su portada HD, tracklist oficial y metadatos, y lo registra automáticamente en Supabase en cuanto un usuario lo califica.',
      },
      {
        type: 'feature',
        title:
          'Curaduría de Álbumes Populares & Sitemap XML Expandido a 540+ URLs',
        description:
          'Incorporación de popularMusicData.js con los discos y artistas más emblemáticos de la música global y actualización del sitemap.xml a más de 540 URLs canónicas para indexación masiva en Google.',
      },
      {
        type: 'improvement',
        title: 'Auto-Registro en Base de Datos al Calificar',
        description:
          'Optimización en ReviewSystem.jsx para registrar álbumes resueltos on-demand de forma automática e inmediata en Supabase al momento de emitir la primera calificación.',
      },
    ],
  },
  {
    version: 'V.5.6',
    title:
      'Dominio Oficial musiclub.org, Footer Global Universal, Soporte Dinámico de Google OAuth y Optimización Spotify API',
    date: '2026-08-31',
    sha: '69c2639',
    tag: 'Mayor',
    tagColor: 'from-rose-500 via-pink-500 to-cyan-400',
    authorName: 'Eugenio Turcott',
    summary:
      'Lanzamiento oficial del nuevo dominio propio musiclub.org, integración del Footer global universal en el 100% de las páginas del sistema, redirección dinámica de Google OAuth, optimización de endpoints de Spotify API eliminando errores 403 y actualización integral de sitemap y metadatos SEO.',
    changes: [
      {
        type: 'feature',
        title: 'Lanzamiento del Dominio Oficial musiclub.org & Sitemap XML',
        description:
          'Migración completa de la plataforma hacia su dominio propio https://musiclub.org, incluyendo sitemap.xml regenerado con más de 250 rutas canónicas indexables, robots.txt actualizado y metaetiquetas OpenGraph/SEO oficiales.',
      },
      {
        type: 'feature',
        title: 'Footer Global Universal en Todas las Páginas',
        description:
          'Incorporación del componente Footer universal con enlaces rápidos, navegación por secciones, créditos, copyright y accesos legales en el 100% de las vistas (Inicio, Álbumes, Detalle de Álbum, Artistas, Leaderboard, Playlists, Reviews, Recomendaciones, Perfil, Configuración, Gashapon, Patch Notes, FAQ, Privacidad, Términos y Panel Admin).',
      },
      {
        type: 'improvement',
        title: 'Redirección Dinámica de Autenticación con Google (OAuth)',
        description:
          'Actualización del flujo de inicio de sesión en useAuth.js para resolver de forma automática y transparente la URL de retorno (window.location.origin) en el nuevo dominio musiclub.org, preservando al mismo tiempo la compatibilidad en entornos locales y de previsualización.',
      },
      {
        type: 'fix',
        title: 'Depuración y Optimización de Spotify API (Error 403)',
        description:
          'Eliminación de llamadas directas y obsoletas a top-tracks restringidas por los nuevos tokens de cliente de Spotify, optimizando la carga de discografía del artista de forma fluida y sin advertencias en consola.',
      },
      {
        type: 'fix',
        title: 'Corrección de Margen Superior en Vista de Artista',
        description:
          'Reestructuración del componente SEO y Header en ArtistDetail.jsx, eliminando el espaciado superior no deseado generado por las utilidades de diseño para que coincida perfectamente con el resto de la aplicación.',
      },
    ],
  },
  {
    version: 'V.5.5',
    title:
      'Página de Artista & Discografía Spotify, Schema SEO de Reviews, Edición en Perfil, Ancho Global Unificado y Conteo de Reviews en Podio',
    date: '2026-08-28',
    sha: 'd19af4e',
    tag: 'Mayor',
    tagColor: 'from-pink-500 via-rose-500 to-amber-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Gran actualización con página de artista estilo Spotify y clasificación de discografía completa, Schema.org (JSON-LD) para indexación de reviews en Google Search, edición directa de reviews desde Mi Perfil, modales renderizados con React Portals, homogenización de ancho global y conteo de reviews en la cara trasera del podio.',
    changes: [
      {
        type: 'feature',
        title: 'Página de Perfil de Artista y Discografía Spotify Completa',
        description:
          'Nueva vista dedicada (/artista/:artistName) con navegación por pestañas (Todos, Álbumes, EPs, Sencillos y Compilaciones), contadores dinámicos, año de lanzamiento, géneros musicales oficiales y filtros rápidos de lanzamientos.',
      },
      {
        type: 'feature',
        title: 'Schema SEO de Reviews e Indexación para Google (JSON-LD)',
        description:
          'Implementación de datos estructurados Schema.org para MusicAlbum con aggregateRating, reviewCount, ratingValue y reviews detalladas de la comunidad para resultados enriquecidos (Rich Snippets) en Google Search estilo Album of the Year.',
      },
      {
        type: 'feature',
        title: 'Edición de Reviews Directa desde "Mi Perfil"',
        description:
          'Capacidad para editar calificaciones, reseñas y notas de canciones directamente desde la sección "Mis Reviews" en el perfil de usuario con una interfaz modal limpia y sin elementos distractores.',
      },
      {
        type: 'improvement',
        title: 'Contador de Reviews en Tarjetas Traseras del Podio y Carrusel',
        description:
          'En el podio de Rankings & Estadísticas de la pantalla principal, las tarjetas traseras (flip 3D) de los puestos #1, #2 y #3, así como las del carrusel (#4 al #10), ahora muestran el total de reseñas de la comunidad (🎧 X reviews).',
      },
      {
        type: 'improvement',
        title: 'Homogeneización del Ancho Global y Header',
        description:
          'Estandarización del ancho de contenedor (max-w-7xl) en todas las vistas (Configuración, Catálogo, Perfiles, etc.) para mantener un espaciado idéntico y evitar menús apeñuscados en el Header.',
      },
      {
        type: 'fix',
        title: 'Modales Globales con React Portals (Login y Editor de Reviews)',
        description:
          'Migración de los modales de Inicio de Sesión y Editor de Reviews a React Portals montados directamente en document.body (z-[99999]), eliminando problemas de desplazamiento causados por transforms CSS del contenedor padre.',
      },
      {
        type: 'fix',
        title: 'Depuración Visual en Encabezado de Artista',
        description:
          'Eliminación de caracteres numéricos residuales en el nombre del artista y limpieza del banner promocional en la vista de artista.',
      },
    ],
  },
  {
    version: 'V.5.4',
    title:
      'SF Tiers Tier List Maker, Filtro por Años/Décadas estilo AlbumOfTheYear, Reorganización de Notificaciones y Fechas Oficiales',
    date: '2026-08-25',
    sha: '8f410de',
    tag: 'Mayor',
    tagColor: 'from-pink-500 via-purple-500 to-indigo-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Gran actualización con generador visual de Tier Lists automático (SF Tiers) con exportación a imagen PNG, barra de filtrado por años y décadas estilo AlbumOfTheYear en el catálogo, rediseño del panel de notificaciones, sincronización de fechas de lanzamiento de Spotify y optimización de portadas.',
    changes: [
      {
        type: 'feature',
        title: 'SF Tiers Tier List Maker Automático en Mi Perfil',
        description:
          'Generador automático de Tier Lists basado en las calificaciones personales del usuario en 6 niveles: S (GOD TIER / OBRAS MAESTRAS, 9.5-10.0), A (EXCELENTES, 8.5-9.4), B (MUY BUENOS, 7.5-8.4), C (BUENOS, 6.5-7.4), D (REGULARES, 5.0-6.4) y F (DECEPCIONANTES, < 4.9 morada). Incluye modo lista vertical optimizado para móviles.',
      },
      {
        type: 'feature',
        title: 'Exportación de Tier List a Imagen HD (PNG)',
        description:
          'Botón para generar y descargar instantáneamente una imagen en alta resolución con tipografía Stack Sans Notch, branding oficial de Musiclub, avatar del usuario y formato listo para compartir en redes sociales.',
      },
      {
        type: 'feature',
        title: 'Filtro por Años y Décadas estilo AlbumOfTheYear.org',
        description:
          'Barra de navegación interactiva en la página de Álbumes con selector de décadas (2020s a 1950s), flechas de navegación ‹ y ›, carril cronológico de años (2020 a 2026), filtrado en tiempo real e insignias con conteo de álbumes por año.',
      },
      {
        type: 'feature',
        title: 'Metadatos Oficiales de Lanzamiento de Spotify',
        description:
          'Incorporación permanente de release_date y release_year en la base de datos de Supabase, backfill del 100% de los álbumes del catálogo y resolución automática para todos los nuevos álbumes agregados.',
      },
      {
        type: 'improvement',
        title: 'Reorganización del Panel de Notificaciones',
        description:
          'Rediseño del buzón en el Header con eliminación de filtros redundantes y reubicación ergonómica de los controles de marcar como leído, eliminar y cerrar justo debajo del título.',
      },
      {
        type: 'improvement',
        title: 'Actualización del Nivel de Melómano',
        description:
          'Ajuste y sincronización de los rangos de Melómano y estadísticas detalladas del perfil de usuario.',
      },
      {
        type: 'fix',
        title: 'Portadas Robustas con Fallback SVG Nativo',
        description:
          'Reemplazo de placeholders externos por un componente visual SVG nativo sin dependencias de red, garantizando carga inmediata de portadas en caso de fallos de enlace.',
      },
    ],
  },
  {
    version: 'V.5.3',
    title:
      'Cálculo Preciso de Álbumes Postulados en Podio de Reseñadores y Ajustes en Patch Notes',
    date: '2026-08-21',
    sha: '604ed2d',
    tag: 'Mejora',
    tagColor: 'from-blue-500 via-indigo-500 to-purple-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Corrección en el cálculo de estadísticas de miembros en Supabase para reflejar con precisión el número de álbumes agregados y postulados al club, y optimización en la sincronización de commits de GitHub en la página de Patch Notes.',
    changes: [
      {
        type: 'fix',
        title: 'Conteo Preciso de Álbumes Postulados por Miembro en Podio',
        description:
          'Corrección en getTopReviewersManual y supabaseService.getTopReviewers para contabilizar fielmente los álbumes agregados o propuestos por cada usuario (added_by y added_by_email) en lugar de contar únicamente los álbumes reseñados.',
      },
      {
        type: 'improvement',
        title: 'Sincronización Optimizada de Commits de GitHub en Patch Notes',
        description:
          'Actualización del endpoint de GitHub Commits API aumentando la paginación a 100 resultados por consulta, estandarización de la rama principal a master y depuración de indicadores de versión en producción.',
      },
    ],
  },
  {
    version: 'V.5.2',
    title:
      'Paginación en Patch Notes, Scroll Global Restaurado, Rebranding Musiclub y README Actualizado',
    date: '2026-08-21',
    sha: '3257b00',
    tag: 'Mejora',
    tagColor: 'from-blue-500 to-indigo-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Actualización con sistema de paginación de 6 versiones por página en notas de parche, restablecimiento global de scroll al inicio al navegar, estandarización de marca Musiclub y documentación técnica completa en README.md.',
    changes: [
      {
        type: 'feature',
        title: 'Paginación Interactiva en Patch Notes',
        description:
          'Paginación fluida de 6 versiones por página con botones anterior/siguiente, números de página con resplandor activo y filtros rápidos por versión (V5.x a V0.x).',
      },
      {
        type: 'feature',
        title: 'Restablecimiento Global de Scroll (ScrollToTop)',
        description:
          'Componente en la raíz del Router que restablece inmediatamente el scroll de la ventana al principio (top: 0, left: 0) al hacer clic en enlaces del footer o navegar entre páginas.',
      },
      {
        type: 'improvement',
        title: 'Actualización Integral de la Documentación (README.md)',
        description:
          'Documentación renovada a la versión v5.2.0 con árbol de archivos, tabla completa de 14 rutas, fórmulas matemáticas y guía de instalación.',
      },
      {
        type: 'improvement',
        title: 'Estandarización de Marca «Musiclub»',
        description:
          'Ajuste de todas las referencias de marca y texto en la aplicación con la c en minúscula.',
      },
    ],
  },
  {
    version: 'V.5.1',
    title:
      'Gashapon Arcade 3D, Buzón Social de Canciones, Buscador Directo y Patch Notes',
    date: '2026-08-21',
    sha: '9c8e0cf',
    tag: 'Mayor',
    tagColor: 'from-pink-500 to-rose-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Gran actualización con máquina Gashapon interactiva independiente, buzón social de recomendaciones de canciones entre usuarios, buscador instantáneo en el header, corrección 3D en rankings y módulo de Patch Notes.',
    changes: [
      {
        type: 'feature',
        title: 'Máquina Gashapon Arcade 3D Independiente',
        description:
          'Se separó el Gashapon a su propia página dedicada (/gashapon) con una cúpula de cristal con más de 18 cápsulas esféricas multicolor con física vibrante, manivela 3D y selección aleatoria de álbumes individuales.',
      },
      {
        type: 'feature',
        title: 'Buzón Social de Recomendaciones de Canciones',
        description:
          'Buzón privado en el perfil de usuario para intercambiar y recomendar exclusivamente canciones entre miembros, con dedicatorias, vista previa de Spotify y notificaciones en tiempo real respaldadas en Supabase.',
      },
      {
        type: 'feature',
        title: 'Buscador Global Directo en Header',
        description:
          'Campo de búsqueda directo integrado en la barra de navegación y en el menú móvil (sin necesidad de abrir popups para buscar). Muestra resultados en vivo mientras se escribe, soporte de teclado y calificación directa.',
      },
      {
        type: 'feature',
        title: 'Página de Patch Notes y Sincronización con GitHub',
        description:
          'Historial completo de versiones y commits sincronizado en tiempo real con la rama principal de GitHub, con filtros de versión y buscador de novedades.',
      },
      {
        type: 'improvement',
        title: 'Diseño 100% Responsivo en Header y Banner de Proponer',
        description:
          'Alineación de navegación fluida evitando solapamientos y banner "¿Tienes un álbum en mente? +50 XP" adaptado para pantallas móviles de 320px a 480px.',
      },
      {
        type: 'fix',
        title: 'Corrección de Tarjetas 3D Flip (Puestos 4 al 10 en Rankings)',
        description:
          'Se corrigió la rotación inicial de la cara frontal en CSS para que las portadas, insignias y puntuaciones se muestren de inmediato sin necesidad de hacer clic primero.',
      },
    ],
  },
  {
    version: 'V.5.0',
    title:
      'Motor de Recomendaciones "Para Ti", Playlists del Club y Deduplicación',
    date: '2026-08-20',
    sha: 'da68bc8',
    tag: 'Mayor',
    tagColor: 'from-purple-500 to-indigo-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Lanzamiento del algoritmo de afinidad musical "Para Ti", playlists dinámicas generadas con votos de la comunidad, deduplicación de catálogo y emociones en reseñas.',
    changes: [
      {
        type: 'feature',
        title: 'Sección de Recomendaciones "Para Ti" (RecommendationsPage)',
        description:
          'Algoritmo inteligente de recomendación que analiza tus calificaciones y preferencias para sugerirte joyas del catálogo del club.',
      },
      {
        type: 'feature',
        title: 'Explorador y Generador de Playlists (PlaylistsPage)',
        description:
          'Creación de listas de reproducción temáticas con las mejores canciones votadas y exportación a Spotify.',
      },
      {
        type: 'feature',
        title: 'Emociones y Sentimientos en Reseñas',
        description:
          'Selector de sensaciones emocionales (Mindblown, Sad, Chill, Hype, etc.) respaldado en Supabase.',
      },
      {
        type: 'improvement',
        title: 'Motor de Deduplicación Robusta de Álbumes',
        description:
          'Algoritmo para prevenir discos duplicados validando Spotify Album IDs y similitud de títulos.',
      },
    ],
  },

  // ----------------------------------------------------
  // V4.x (Agosto 2026)
  // ----------------------------------------------------
  {
    version: 'V.4.4',
    title: 'Sistema de Insignias Dinámicas y Optimización de Reviews',
    date: '2026-08-19',
    sha: '7ea0ce4',
    tag: 'Mejora',
    tagColor: 'from-purple-500 to-indigo-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Motor de medallas e insignias desbloqueables por actividad musical y balanceo en fórmulas de promedios ponderados.',
    changes: [
      {
        type: 'feature',
        title: 'Sistema de Insignias y Medallas (Badge System)',
        description:
          'Creación del motor de insignias por hitos: crítico prolífico, descubridor de joyas, géneros explorados y constancia semanal.',
      },
      {
        type: 'improvement',
        title: 'Balanceo de Fórmulas Ponderadas',
        description:
          'Ajuste en el algoritmo de cálculo general para equilibrar las notas de canciones individuales con los 6 criterios técnicos.',
      },
      {
        type: 'improvement',
        title: 'Optimización de Carga en Catálogo y Perfiles',
        description:
          'Mejoras en el rendimiento de consultas a Supabase y estados reactivos en UserProfile y AlbumsCatalog.',
      },
    ],
  },
  {
    version: 'V.4.3',
    title: 'Centro de Ayuda, FAQ Interactiva y Secciones Legales',
    date: '2026-08-17',
    sha: '2a9378c',
    tag: 'Feature',
    tagColor: 'from-amber-500 to-orange-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Lanzamiento del centro interactivo de Preguntas Frecuentes (/faq), políticas de privacidad y términos de servicio.',
    changes: [
      {
        type: 'feature',
        title: 'Página de Preguntas Frecuentes (FAQ) con Buscador',
        description:
          'Guía completa con 8 categorías sobre dinámica del club, ruleta, puntuación técnica, insignias y catálogo de Spotify.',
      },
      {
        type: 'feature',
        title: 'Páginas Legales y Footer Dinámico',
        description:
          'Integración de páginas dedicadas de Política de Privacidad y Términos de Servicio accesibles desde el pie de página.',
      },
      {
        type: 'improvement',
        title: 'Refactorización de Utilidades de Calificación (ratingUtils.js)',
        description:
          'Modularización y pruebas de utilidades para formateo de promedios y cálculo de bonificaciones.',
      },
    ],
  },
  {
    version: 'V.4.2',
    title: 'Optimización de Animaciones y Física de la Slot Machine',
    date: '2026-08-17',
    sha: 'd5f855d',
    tag: 'Mejora',
    tagColor: 'from-cyan-500 to-blue-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Perfeccionamiento de la desaceleración de los carretes y efectos visuales cinemáticos en la máquina musical.',
    changes: [
      {
        type: 'improvement',
        title: 'Física Cinemática de Desaceleración',
        description:
          'Curvas de transición bezier personalizadas para detener los carretes secuencialmente con mayor realismo.',
      },
      {
        type: 'improvement',
        title: 'Sincronización de Probabilidad Ponderada por Antigüedad',
        description:
          'Ajuste fino del algoritmo para otorgar hasta +40% de probabilidad justa a discos antiguos en lista de espera.',
      },
    ],
  },
  {
    version: 'V.4.1',
    title: 'Optimización de Consultas SQL y Rendimiento en Leaderboard',
    date: '2026-08-17',
    sha: '6e87f5c',
    tag: 'Optimización',
    tagColor: 'from-emerald-500 to-teal-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Mejoras de rendimiento en consultas agregadas de Supabase para calcular el ranking de usuarios en tiempo real.',
    changes: [
      {
        type: 'improvement',
        title: 'Queries Agregadas de Alto Rendimiento',
        description:
          'Optimización de consultas SQL en Supabase para contabilizar reviews, propuestas y XP sin cuello de botella.',
      },
      {
        type: 'fix',
        title: 'Estabilidad de Carga en Leaderboard',
        description:
          'Manejo de estados de carga y skeletons para evitar parpadeos visuales al ordenar miembros por XP.',
      },
    ],
  },
  {
    version: 'V.4.0',
    title:
      'Reviews Multidimensionales en 6 Criterios y Calificación Track por Track',
    date: '2026-08-17',
    sha: 'd0a8be3',
    tag: 'Mayor',
    tagColor: 'from-purple-500 to-pink-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Gran salto evolutivo con el sistema de reseñas técnicas en 6 dimensiones, puntuación individual pista por pista y nuevas páginas de navegación.',
    changes: [
      {
        type: 'feature',
        title: 'Evaluación Técnica en 6 Dimensiones',
        description:
          'Sliders reactivos para Producción, Composición, Letras, Originalidad, Cohesión y Replay Value con escala visual.',
      },
      {
        type: 'feature',
        title: 'Calificación Pista por Pista (Track Ratings)',
        description:
          'Puntuación individual para cada canción del álbum sincronizada con el tracklist oficial de Spotify.',
      },
      {
        type: 'feature',
        title: 'Nuevas Páginas de Navegación',
        description:
          'Creación de rutas y componentes dedicados: LeaderboardPage, ProfilePage, SettingsPage y AlbumsPage.',
      },
      {
        type: 'database',
        title: 'Migración SQL de Calificaciones por Pista',
        description:
          'Ejecución del script update_track_ratings.sql para almacenar ratings en formato JSONB estructurado.',
      },
    ],
  },

  // ----------------------------------------------------
  // V3.x (Agosto 2026)
  // ----------------------------------------------------
  {
    version: 'V.3.5',
    title: 'Optimización de Visualización en Cuadrícula de Álbumes (AlbumGrid)',
    date: '2026-08-14',
    sha: 'a05507a',
    tag: 'Mejora',
    tagColor: 'from-pink-500 to-rose-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Mejoras visuales y de rendimiento en la galería principal de álbumes y badges de estado.',
    changes: [
      {
        type: 'improvement',
        title: 'Renderizado de Portadas en AlbumGrid',
        description:
          'Optimización de carga diferida (lazy loading) y placeholders elegantes para portadas de Spotify.',
      },
      {
        type: 'improvement',
        title: 'Filtros Rápidos en Cuadrícula',
        description:
          'Selector visual entre álbumes del Pool activo, Álbumes Individuales y Ganadores anteriores.',
      },
    ],
  },
  {
    version: 'V.3.4',
    title: 'Búsqueda Avanzada de Spotify y Podio de Rankings',
    date: '2026-08-14',
    sha: 'b102c56',
    tag: 'Feature',
    tagColor: 'from-amber-500 to-yellow-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Buscador integrado con la API de Spotify para añadir álbumes y efectos de podio dorado en Rankings.',
    changes: [
      {
        type: 'feature',
        title: 'Buscador de Álbumes con Spotify API (AlbumSearch)',
        description:
          'Búsqueda en tiempo real de álbumes, artistas y años de lanzamiento con autocompletado y carátulas HD.',
      },
      {
        type: 'feature',
        title: 'Podio Visual de Campeones (#1, #2 y #3)',
        description:
          'Efectos dorados, plateados y de bronce con animaciones de resplandor para los discos mejor evaluados.',
      },
    ],
  },
  {
    version: 'V.3.3',
    title: 'Panel de Administración y Moderación de Ganadores',
    date: '2026-08-12',
    sha: 'e0e2512',
    tag: 'Feature',
    tagColor: 'from-blue-500 to-indigo-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Módulo de administración para control de estados de álbumes y visualización destacada del ganador semanal.',
    changes: [
      {
        type: 'feature',
        title: 'Panel de Administración (AdminPanel)',
        description:
          'Herramientas de moderador para activar, desactivar o remover álbumes del catálogo.',
      },
      {
        type: 'feature',
        title: 'Modal de Ganador Integrado (WinnerDisplay)',
        description:
          'Presentación destacada con botón de reproducción en Spotify y acceso rápido a reseñas.',
      },
    ],
  },
  {
    version: 'V.3.2',
    title: 'Explorador Global de Reseñas Comunitarias',
    date: '2026-08-05',
    sha: '40add2f',
    tag: 'Feature',
    tagColor: 'from-purple-500 to-violet-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Página dedicada (/reviews) para consultar el feed completo de opiniones y calificaciones del club.',
    changes: [
      {
        type: 'feature',
        title: 'Feed de Reseñas en Vivo (ReviewsPage)',
        description:
          'Muro interactivo con las últimas reseñas enviadas por los miembros, comentarios y puntuaciones.',
      },
      {
        type: 'improvement',
        title: 'Navegación en AppHeader',
        description:
          'Acceso directo a la sección de Reviews desde la barra superior.',
      },
    ],
  },
  {
    version: 'V.3.1',
    title: 'Hook Reactivo useAlbums y Manejo de Estados de Inactividad',
    date: '2026-08-05',
    sha: '0932f91',
    tag: 'Mejora',
    tagColor: 'from-teal-500 to-emerald-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Centralización de la lógica de datos en el custom hook useAlbums con soporte de mutaciones optimistas.',
    changes: [
      {
        type: 'improvement',
        title: 'Custom Hook useAlbums',
        description:
          'Centralización de queries de Supabase, filtrado de estados y refresco automático tras calificar.',
      },
      {
        type: 'feature',
        title: 'Marcado de Álbumes Inactivos',
        description:
          'Función para archivar álbumes que ya concluyeron su ciclo de votación.',
      },
    ],
  },
  {
    version: 'V.3.0',
    title: 'Evolución a Slot Machine Arcade con 3 Carretes Mecánicos',
    date: '2026-08-04',
    sha: 'bce12f5',
    tag: 'Mayor',
    tagColor: 'from-yellow-500 to-amber-600',
    authorName: 'Eugenio Turcott',
    summary:
      'Reemplazo total del prototipo de ruleta plana por una Máquina Tragamonedas (Slot Machine) estilo arcade con animaciones de carretes independientes.',
    changes: [
      {
        type: 'feature',
        title: 'Slot Machine Cyberpunk con 3 Carretes',
        description:
          'Animación de giro secuencial de 3 carretes con blur de movimiento y efectos sonoros de neón.',
      },
      {
        type: 'feature',
        title: 'Modal de Victoria con Lluvia de Confetti',
        description:
          'Celebración inmersiva en pantalla completa al revelarse el álbum ganador.',
      },
      {
        type: 'improvement',
        title: 'Integración Directa con Spotify API',
        description:
          'Recuperación de enlaces oficiales de reproducción y arte de portada en alta definición.',
      },
    ],
  },

  // ----------------------------------------------------
  // V2.x (Agosto 2026)
  // ----------------------------------------------------
  {
    version: 'V.2.4',
    title: 'Ajustes en el Layout Principal y Manejo de Rutas',
    date: '2026-08-03',
    sha: 'bd1baca',
    tag: 'Fix',
    tagColor: 'from-blue-500 to-cyan-500',
    authorName: 'eugenio-turcott',
    summary:
      'Ajustes de espaciado y estructura de contenedores en App.js para soporte de múltiples resoluciones.',
    changes: [
      {
        type: 'fix',
        title: 'Alineación de Contenedores en App.js',
        description:
          'Corrección de márgenes y paddings en la vista general de la aplicación.',
      },
    ],
  },
  {
    version: 'V.2.3',
    title: 'Persistencia de Sesión y Manejo de Tokens en useAuth',
    date: '2026-08-03',
    sha: '59c9c6e',
    tag: 'Mejora',
    tagColor: 'from-indigo-500 to-purple-500',
    authorName: 'eugenio-turcott',
    summary:
      'Mejoras en el ciclo de vida de la sesión de Supabase Auth y recuperación de usuario.',
    changes: [
      {
        type: 'improvement',
        title: 'Gestión de Sesión en useAuth.js',
        description:
          'Sincronización del estado de autenticación con onAuthStateChange de Supabase.',
      },
    ],
  },
  {
    version: 'V.2.2',
    title: 'Avatar de Usuario y Acciones de Perfil en Encabezado',
    date: '2026-08-03',
    sha: 'f22a415',
    tag: 'Feature',
    tagColor: 'from-pink-500 to-rose-500',
    authorName: 'eugenio-turcott',
    summary:
      'Visualización del avatar de Google, nombre de usuario y botón de cerrar sesión en AppHeader.',
    changes: [
      {
        type: 'feature',
        title: 'Perfil en AppHeader',
        description:
          'Visualización de la foto de perfil del usuario autenticado y menú desplegable de acciones.',
      },
    ],
  },
  {
    version: 'V.2.1',
    title: 'Estilos Cyberpunk Neón y Rutas de Administración',
    date: '2026-08-03',
    sha: '471a6d9',
    tag: 'Feature',
    tagColor: 'from-purple-500 to-indigo-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Implementación del tema visual oscuro cyber-grid, gradientes neón y creación de AdminPage.',
    changes: [
      {
        type: 'feature',
        title: 'Tema Visual Cyberpunk en global.css',
        description:
          'Fondo de cuadrícula cibernética, efectos de neón rosa/violeta y scrollbars personalizados.',
      },
      {
        type: 'feature',
        title: 'Ruta de Administración (/admin)',
        description:
          'Acceso protegido para moderación de álbumes y usuarios administradores.',
      },
    ],
  },
  {
    version: 'V.2.0',
    title: 'Autenticación con Google OAuth y Supabase Auth',
    date: '2026-08-03',
    sha: '01696b0',
    tag: 'Mayor',
    tagColor: 'from-blue-600 to-indigo-600',
    authorName: 'Eugenio Turcott',
    summary:
      'Reemplazo del sistema anónimo por autenticación real con cuentas de Google y base de datos Supabase.',
    changes: [
      {
        type: 'feature',
        title: 'Google OAuth 2.0 con Supabase',
        description:
          'Inicio de sesión con un solo clic, almacenamiento de perfiles de usuario y roles de permisos.',
      },
      {
        type: 'feature',
        title: 'Protección de Reseñas y Propuestas',
        description:
          'Vinculación de cada reseña y propuesta musical a la cuenta autenticada del usuario.',
      },
    ],
  },

  // ----------------------------------------------------
  // V1.x (Julio - Agosto 2026)
  // ----------------------------------------------------
  {
    version: 'V.1.9',
    title: 'Verificación de Dominio en Google Search Console',
    date: '2026-08-03',
    sha: 'c44f13f',
    tag: 'SEO',
    tagColor: 'from-emerald-500 to-teal-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Integración del archivo de verificación HTML para indexación oficial en los servicios de Google.',
    changes: [
      {
        type: 'improvement',
        title: 'Google Search Console Verification',
        description:
          'Inclusión del archivo de validación pública para monitoreo de indexación web.',
      },
    ],
  },
  {
    version: 'V.1.8',
    title: 'Configuración de Verificación de Identidad Google OAuth',
    date: '2026-08-03',
    sha: 'b20bf03',
    tag: 'Config',
    tagColor: 'from-blue-500 to-cyan-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Ajustes en la verificación de la pantalla de consentimiento de Google Cloud Console.',
    changes: [
      {
        type: 'improvement',
        title: 'Consentimiento OAuth en Producción',
        description:
          'Configuración de credenciales seguras para el flujo de autorización OAuth.',
      },
    ],
  },
  {
    version: 'V.1.7',
    title: 'Módulo SEO y Meta Tags para Redes Sociales',
    date: '2026-08-03',
    sha: 'f330e01',
    tag: 'SEO',
    tagColor: 'from-pink-500 to-purple-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Componente SEO para tarjetas de previsualización en WhatsApp, Discord y Twitter.',
    changes: [
      {
        type: 'feature',
        title: 'Componente SEO (SEO.jsx)',
        description:
          'Generación dinámica de Open Graph meta tags, títulos y descripción del club musical.',
      },
    ],
  },
  {
    version: 'V.1.6',
    title: 'Depuración y Manejo de Errores en useAuth',
    date: '2026-08-03',
    sha: 'e4dafb5',
    tag: 'Fix',
    tagColor: 'from-amber-500 to-red-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Manejo de estados de error en intentos fallidos de autenticación y redirecciones.',
    changes: [
      {
        type: 'fix',
        title: 'Control de Errores de Inicio de Sesión',
        description:
          'Notificaciones amigables cuando se cancela el flujo de Google OAuth.',
      },
    ],
  },
  {
    version: 'V.1.5',
    title: 'Modal de Inicio de Sesión y Documentos Legales Iniciales',
    date: '2026-08-03',
    sha: '69e7e8c',
    tag: 'Feature',
    tagColor: 'from-purple-500 to-pink-500',
    authorName: 'Eugenio Turcott',
    summary:
      'Creación de LoginModal con opción de Google y correo, y primeras páginas de términos y privacidad.',
    changes: [
      {
        type: 'feature',
        title: 'LoginModal con Diseño Cyberpunk',
        description:
          'Ventana emergente estilizada con botón directo de Google Login y soporte de email.',
      },
      {
        type: 'feature',
        title: 'Estructura Legal Inicial',
        description:
          'Primer borrador de PrivacyPolicy y TermsOfService en el pie de página.',
      },
    ],
  },
  {
    version: 'V.1.4',
    title: 'Optimización de Consultas SQL en supabaseClient',
    date: '2026-08-02',
    sha: 'c93a8f7',
    tag: 'Optimización',
    tagColor: 'from-emerald-500 to-teal-500',
    authorName: 'eugenio-turcott',
    summary:
      'Mejora en la estructura de consultas para la obtención del catálogo completo de álbumes.',
    changes: [
      {
        type: 'improvement',
        title: 'Optimización de Cliente Supabase',
        description:
          'Uso de transacciones limpias y control de reconexiones en supabaseClient.js.',
      },
    ],
  },
  {
    version: 'V.1.3',
    title: 'Cálculo Dinámico de Rankings en Rankings.jsx',
    date: '2026-08-02',
    sha: '686bdef',
    tag: 'Feature',
    tagColor: 'from-amber-500 to-yellow-500',
    authorName: 'eugenio-turcott',
    summary:
      'Integración del motor de ordenamiento por calificación promedio histórica de álbumes.',
    changes: [
      {
        type: 'feature',
        title: 'Tabla de Rankings en Tiempo Real',
        description:
          'Ordenamiento reactivo por puntuación general y distinción entre pool e individuales.',
      },
    ],
  },
  {
    version: 'V.1.2',
    title: 'Scripts de Migración de Datos a Supabase PostgreSQL',
    date: '2026-08-02',
    sha: '72e56a8',
    tag: 'Database',
    tagColor: 'from-teal-500 to-cyan-500',
    authorName: 'eugenio-turcott',
    summary:
      'Scripts Node.js para migrar álbumes y reseñas históricas desde Google Sheets hacia PostgreSQL en Supabase.',
    changes: [
      {
        type: 'database',
        title: 'Scripts de Migración (migrateAlbums / migrateReviews)',
        description:
          'Migración automatizada de registros históricos manteniendo la integridad de fechas y puntuaciones.',
      },
      {
        type: 'database',
        title: 'Esquema Relacional Inicial en Supabase',
        description:
          'Tablas relacionales albums y reviews con llaves foráneas y restricciones.',
      },
    ],
  },
  {
    version: 'V.1.1',
    title: 'Actualización de Dependencias y Scripts de Build',
    date: '2026-07-26',
    sha: '8dc035f',
    tag: 'Config',
    tagColor: 'from-gray-500 to-slate-600',
    authorName: 'Eugenio Turcott',
    summary:
      'Ajuste de paquetes de Node y optimización de configuraciones de React Scripts.',
    changes: [
      {
        type: 'improvement',
        title: 'Optimización de Dependencias',
        description: 'Limpieza de paquetes innecesarios en package.json.',
      },
    ],
  },
  {
    version: 'V.1.0',
    title: 'Lanzamiento Inicial de Musiclub con Supabase y Spotify API',
    date: '2026-07-26',
    sha: '427ba9b',
    tag: 'Lanzamiento',
    tagColor: 'from-emerald-500 to-green-600',
    authorName: 'eugenio-turcott',
    summary:
      'Nacimiento oficial de la plataforma Musiclub, migrando de Google Sheets a una arquitectura web moderna con base de datos en Supabase y metadatos de Spotify.',
    changes: [
      {
        type: 'feature',
        title: 'Conexión con Supabase y Spotify API',
        description:
          'Búsqueda en catálogo oficial de Spotify y persistencia de propuestas y votos en Supabase.',
      },
      {
        type: 'feature',
        title: 'Primer Sistema de Reseñas y Puntuación',
        description:
          'Formulario para calificar discos y almacenar comentarios de los miembros.',
      },
      {
        type: 'feature',
        title: 'Slot Machine y Cuadrícula de Discos',
        description:
          'Interfaz gráfica inicial para sorteo de discos y visualización en tarjetas.',
      },
    ],
  },

  // ----------------------------------------------------
  // V0.x (Prototipos Iniciales - Julio 2026)
  // ----------------------------------------------------
  {
    version: 'V.0.2',
    title: 'Prototipo de Rueda Giratoria (Wheel) y Galería de Álbumes',
    date: '2026-07-15',
    sha: '197bd9d',
    tag: 'Prototipo',
    tagColor: 'from-amber-600 to-orange-600',
    authorName: 'Eugenio Turcott',
    summary:
      'Segundo prototipo experimental con ruleta circular SVG de segmentos y ventana emergente de ganador.',
    changes: [
      {
        type: 'feature',
        title: 'Prototipo de Ruleta Circular SVG (Wheel.jsx)',
        description:
          'Rueda gráfica con segmentos divididos por álbum y animación de rotación.',
      },
      {
        type: 'feature',
        title: 'Modal Emergente de Ganador (WinnerPopup.jsx)',
        description:
          'Ventana básica para mostrar el disco resultante del giro.',
      },
    ],
  },
  {
    version: 'V.0.1',
    title: 'Primer Prototipo Visual con Tailwind CSS y Conexión Sheets',
    date: '2026-07-14',
    sha: 'c882be0',
    tag: 'Prototipo',
    tagColor: 'from-blue-600 to-indigo-600',
    authorName: 'Eugenio Turcott',
    summary:
      'Configuración inicial del entorno de diseño con Tailwind CSS y lectura de datos desde API externa.',
    changes: [
      {
        type: 'feature',
        title: 'Configuración de Tailwind CSS y Estilos Base',
        description:
          'Estructura de fuentes, colores oscuros y componentes iniciales de UI.',
      },
      {
        type: 'feature',
        title: 'Primer Boceto de la Ruleta Musical',
        description:
          'Maquetación de la ruleta de discos para las reuniones del club.',
      },
    ],
  },
  {
    version: 'V.0.0',
    title: 'Inicialización del Proyecto (Create React App)',
    date: '2026-07-14',
    sha: '7de6dba',
    tag: 'Inicial',
    tagColor: 'from-gray-600 to-slate-700',
    authorName: 'Eugenio Turcott',
    summary:
      'Creación del repositorio y estructura de directorios inicial del proyecto con React 18.',
    changes: [
      {
        type: 'feature',
        title: 'Setup Inicial con React 18',
        description:
          'Configuración del entorno de desarrollo, gitignore, package.json y estructura base.',
      },
    ],
  },
];

/**
 * Función para enriquecer commits recibidos directamente desde GitHub con notas detalladas
 * Mapea todos los commits históricos y procesa automáticamente cualquier commit nuevo que se agregue en el futuro.
 */
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

    // Buscar en notas curadas por SHA corto o por versión
    const curated = CURATED_PATCH_NOTES.find(
      (n) =>
        (n.sha && (sha.startsWith(n.sha) || n.sha.startsWith(sha))) ||
        (versionKey && n.version.toLowerCase() === versionKey.toLowerCase())
    );

    const matchKey = curated ? curated.version : sha;

    if (curated && !processedKeys.has(matchKey)) {
      processedKeys.add(matchKey);
      enrichedList.push({
        ...curated,
        sha,
        fullSha,
        authorName: curated.authorName || authorName,
        authorAvatar: authorAvatar || curated.authorAvatar,
        commitUrl,
        rawMessage: message,
        isFromGithub: true,
      });
    } else if (!curated && !processedKeys.has(sha)) {
      processedKeys.add(sha);
      // Commit nuevo sin entrada curada previa: parsear automáticamente
      const lines = message
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#')); // Omitir comentarios de git o de conflictos
      const title = lines[0] || `Commit ${sha}`;
      const bodyLines = lines.slice(1);

      let tag = 'Update';
      let tagColor = 'from-blue-500 to-cyan-500';
      if (/feat|nuevo|feature/i.test(title)) {
        tag = 'Feature';
        tagColor = 'from-pink-500 to-rose-500';
      } else if (/fix|correg|bug/i.test(title)) {
        tag = 'Fix';
        tagColor = 'from-amber-500 to-red-500';
      } else if (/refactor|mejora|perf|optim/i.test(title)) {
        tag = 'Mejora';
        tagColor = 'from-purple-500 to-indigo-500';
      }

      const changes =
        bodyLines.length > 0
          ? bodyLines.map((line) => ({
              type: /fix|bug/i.test(line)
                ? 'fix'
                : /mejora|optim/i.test(line)
                  ? 'improvement'
                  : 'feature',
              title: line.replace(/^[-*•]\s*/, ''),
              description: 'Actualización registrada en el repositorio GitHub.',
            }))
          : [
              {
                type: 'feature',
                title: title,
                description:
                  'Cambios sincronizados directamente desde el commit de GitHub.',
              },
            ];

      enrichedList.push({
        version: versionKey || `v${sha}`,
        title: title,
        date,
        sha,
        fullSha,
        tag,
        tagColor,
        summary: bodyLines.join(' ') || title,
        changes,
        authorName,
        authorAvatar,
        commitUrl,
        rawMessage: message,
        isFromGithub: true,
      });
    }
  });

  // Agregar cualquier nota curada que aún no haya sido devuelta por la API
  const pendingCurated = [];
  CURATED_PATCH_NOTES.forEach((curated) => {
    if (!processedKeys.has(curated.version)) {
      pendingCurated.push({
        ...curated,
        commitUrl: `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commit/${curated.sha}`,
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
