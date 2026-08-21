// src/data/patchNotesData.js
/**
 * Musiclub Patch Notes & GitHub Changelog Registry
 * Contiene el registro detallado de novedades de TODOS los commits y versiones históricas
 * y el motor de sincronización con los commits en tiempo real del repositorio GitHub.
 */

export const GITHUB_REPO_OWNER = 'eugenio-turcott';
export const GITHUB_REPO_NAME = 'musiclub-albumes';
export const GITHUB_COMMITS_API = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commits?sha=main&per_page=100`;

export const CURATED_PATCH_NOTES = [
  // ----------------------------------------------------
  // V5.x (Agosto 2026)
  // ----------------------------------------------------
  {
    version: 'V.5.1',
    title: 'Gashapon Arcade 3D, Buzón Social de Canciones, Buscador Directo y Patch Notes',
    date: '2026-08-21',
    sha: 'pending',
    tag: 'Mayor',
    tagColor: 'from-pink-500 to-rose-500',
    authorName: 'Eugenio Turcott',
    summary: 'Gran actualización con máquina Gashapon interactiva independiente, buzón social de recomendaciones de canciones entre usuarios, buscador instantáneo en el header, corrección 3D en rankings y página de Patch Notes.',
    changes: [
      {
        type: 'feature',
        title: 'Máquina Gashapon Arcade 3D Independiente',
        description: 'Se separó el Gashapon a su propia página dedicada (/gashapon) con una cúpula de cristal con más de 18 cápsulas esféricas multicolor con física vibrante, manivela 3D y selección aleatoria de álbumes individuales.'
      },
      {
        type: 'feature',
        title: 'Buzón Social de Recomendaciones de Canciones',
        description: 'Buzón privado en el perfil de usuario para intercambiar y recomendar exclusivamente canciones entre miembros, con dedicatorias, vista previa de Spotify y notificaciones en tiempo real respaldadas en Supabase.'
      },
      {
        type: 'feature',
        title: 'Buscador Global Directo en Header',
        description: 'Campo de búsqueda directo integrado en la barra de navegación y en el menú móvil (sin necesidad de abrir popups para buscar). Muestra resultados en vivo mientras se escribe, soporte de teclado y calificación directa.'
      },
      {
        type: 'feature',
        title: 'Página de Patch Notes y Sincronización con GitHub',
        description: 'Historial completo de versiones y commits sincronizado en tiempo real con la rama principal de GitHub, con paginación, filtros de versión y buscador de novedades.'
      },
      {
        type: 'improvement',
        title: 'Diseño 100% Responsivo en Header y Banner de Proponer',
        description: 'Alineación de navegación fluida evitando solapamientos y banner "¿Tienes un álbum en mente? +50 XP" adaptado para pantallas móviles de 320px a 480px.'
      },
      {
        type: 'fix',
        title: 'Corrección de Tarjetas 3D Flip (Puestos 4 al 10 en Rankings)',
        description: 'Se corrigió la rotación inicial de la cara frontal en CSS para que las portadas, insignias y puntuaciones se muestren de inmediato sin necesidad de hacer clic primero.'
      }
    ]
  },
  {
    version: 'V.5.0',
    title: 'Motor de Recomendaciones "Para Ti", Playlists del Club y Deduplicación',
    date: '2026-08-20',
    sha: 'da68bc8',
    tag: 'Mayor',
    tagColor: 'from-purple-500 to-indigo-500',
    authorName: 'Eugenio Turcott',
    summary: 'Lanzamiento del algoritmo de afinidad musical "Para Ti", playlists dinámicas generadas con votos de la comunidad, deduplicación de catálogo y emociones en reseñas.',
    changes: [
      {
        type: 'feature',
        title: 'Sección de Recomendaciones "Para Ti" (RecommendationsPage)',
        description: 'Algoritmo inteligente de recomendación que analiza tus calificaciones y preferencias para sugerirte joyas del catálogo del club.'
      },
      {
        type: 'feature',
        title: 'Explorador y Generador de Playlists (PlaylistsPage)',
        description: 'Creación de listas de reproducción temáticas con las mejores canciones votadas y exportación a Spotify.'
      },
      {
        type: 'feature',
        title: 'Emociones y Sentimientos en Reseñas',
        description: 'Selector de sensaciones emocionales (Mindblown, Sad, Chill, Hype, etc.) respaldado en Supabase.'
      },
      {
        type: 'improvement',
        title: 'Motor de Deduplicación Robusta de Álbumes',
        description: 'Algoritmo para prevenir discos duplicados validando Spotify Album IDs y similitud de títulos.'
      }
    ]
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
    summary: 'Motor de medallas e insignias desbloqueables por actividad musical y balanceo en fórmulas de promedios ponderados.',
    changes: [
      {
        type: 'feature',
        title: 'Sistema de Insignias y Medallas (Badge System)',
        description: 'Creación del motor de insignias por hitos: crítico prolífico, descubridor de joyas, géneros explorados y constancia semanal.'
      },
      {
        type: 'improvement',
        title: 'Balanceo de Fórmulas Ponderadas',
        description: 'Ajuste en el algoritmo de cálculo general para equilibrar las notas de canciones individuales con los 6 criterios técnicos.'
      },
      {
        type: 'improvement',
        title: 'Optimización de Carga en Catálogo y Perfiles',
        description: 'Mejoras en el rendimiento de consultas a Supabase y estados reactivos en UserProfile y AlbumsCatalog.'
      }
    ]
  },
  {
    version: 'V.4.3',
    title: 'Centro de Ayuda, FAQ Interactiva y Secciones Legales',
    date: '2026-08-17',
    sha: '2a9378c',
    tag: 'Feature',
    tagColor: 'from-amber-500 to-orange-500',
    authorName: 'Eugenio Turcott',
    summary: 'Lanzamiento del centro interactivo de Preguntas Frecuentes (/faq), políticas de privacidad y términos de servicio.',
    changes: [
      {
        type: 'feature',
        title: 'Página de Preguntas Frecuentes (FAQ) con Buscador',
        description: 'Guía completa con 8 categorías sobre dinámica del club, ruleta, puntuación técnica, insignias y catálogo de Spotify.'
      },
      {
        type: 'feature',
        title: 'Páginas Legales y Footer Dinámico',
        description: 'Integración de páginas dedicadas de Política de Privacidad y Términos de Servicio accesibles desde el pie de página.'
      },
      {
        type: 'improvement',
        title: 'Refactorización de Utilidades de Calificación (ratingUtils.js)',
        description: 'Modularización y pruebas de utilidades para formateo de promedios y cálculo de bonificaciones.'
      }
    ]
  },
  {
    version: 'V.4.2',
    title: 'Optimización de Animaciones y Física de la Slot Machine',
    date: '2026-08-17',
    sha: 'd5f855d',
    tag: 'Mejora',
    tagColor: 'from-cyan-500 to-blue-500',
    authorName: 'Eugenio Turcott',
    summary: 'Perfeccionamiento de la desaceleración de los carretes y efectos visuales cinemáticos en la máquina musical.',
    changes: [
      {
        type: 'improvement',
        title: 'Física Cinemática de Desaceleración',
        description: 'Curvas de transición bezier personalizadas para detener los carretes secuencialmente con mayor realismo.'
      },
      {
        type: 'improvement',
        title: 'Sincronización de Probabilidad Ponderada por Antigüedad',
        description: 'Ajuste fino del algoritmo para otorgar hasta +40% de probabilidad justa a discos antiguos en lista de espera.'
      }
    ]
  },
  {
    version: 'V.4.1',
    title: 'Optimización de Consultas SQL y Rendimiento en Leaderboard',
    date: '2026-08-17',
    sha: '6e87f5c',
    tag: 'Optimización',
    tagColor: 'from-emerald-500 to-teal-500',
    authorName: 'Eugenio Turcott',
    summary: 'Mejoras de rendimiento en consultas agregadas de Supabase para calcular el ranking de usuarios en tiempo real.',
    changes: [
      {
        type: 'improvement',
        title: 'Queries Agregadas de Alto Rendimiento',
        description: 'Optimización de consultas SQL en Supabase para contabilizar reviews, propuestas y XP sin cuello de botella.'
      },
      {
        type: 'fix',
        title: 'Estabilidad de Carga en Leaderboard',
        description: 'Manejo de estados de carga y skeletons para evitar parpadeos visuales al ordenar miembros por XP.'
      }
    ]
  },
  {
    version: 'V.4.0',
    title: 'Reviews Multidimensionales en 6 Criterios y Calificación Track por Track',
    date: '2026-08-17',
    sha: 'd0a8be3',
    tag: 'Mayor',
    tagColor: 'from-purple-500 to-pink-500',
    authorName: 'Eugenio Turcott',
    summary: 'Gran salto evolutivo con el sistema de reseñas técnicas en 6 dimensiones, puntuación individual pista por pista y nuevas páginas de navegación.',
    changes: [
      {
        type: 'feature',
        title: 'Evaluación Técnica en 6 Dimensiones',
        description: 'Sliders reactivos para Producción, Composición, Letras, Originalidad, Cohesión y Replay Value con escala visual.'
      },
      {
        type: 'feature',
        title: 'Calificación Pista por Pista (Track Ratings)',
        description: 'Puntuación individual para cada canción del álbum sincronizada con el tracklist oficial de Spotify.'
      },
      {
        type: 'feature',
        title: 'Nuevas Páginas de Navegación',
        description: 'Creación de rutas y componentes dedicados: LeaderboardPage, ProfilePage, SettingsPage y AlbumsPage.'
      },
      {
        type: 'database',
        title: 'Migración SQL de Calificaciones por Pista',
        description: 'Ejecución del script update_track_ratings.sql para almacenar ratings en formato JSONB estructurado.'
      }
    ]
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
    summary: 'Mejoras visuales y de rendimiento en la galería principal de álbumes y badges de estado.',
    changes: [
      {
        type: 'improvement',
        title: 'Renderizado de Portadas en AlbumGrid',
        description: 'Optimización de carga diferida (lazy loading) y placeholders elegantes para portadas de Spotify.'
      },
      {
        type: 'improvement',
        title: 'Filtros Rápidos en Cuadrícula',
        description: 'Selector visual entre álbumes del Pool activo, Álbumes Individuales y Ganadores anteriores.'
      }
    ]
  },
  {
    version: 'V.3.4',
    title: 'Búsqueda Avanzada de Spotify y Podio de Rankings',
    date: '2026-08-14',
    sha: 'b102c56',
    tag: 'Feature',
    tagColor: 'from-amber-500 to-yellow-500',
    authorName: 'Eugenio Turcott',
    summary: 'Buscador integrado con la API de Spotify para añadir álbumes y efectos de podio dorado en Rankings.',
    changes: [
      {
        type: 'feature',
        title: 'Buscador de Álbumes con Spotify API (AlbumSearch)',
        description: 'Búsqueda en tiempo real de álbumes, artistas y años de lanzamiento con autocompletado y carátulas HD.'
      },
      {
        type: 'feature',
        title: 'Podio Visual de Campeones (#1, #2 y #3)',
        description: 'Efectos dorados, plateados y de bronce con animaciones de resplandor para los discos mejor evaluados.'
      }
    ]
  },
  {
    version: 'V.3.3',
    title: 'Panel de Administración y Moderación de Ganadores',
    date: '2026-08-12',
    sha: 'e0e2512',
    tag: 'Feature',
    tagColor: 'from-blue-500 to-indigo-500',
    authorName: 'Eugenio Turcott',
    summary: 'Módulo de administración para control de estados de álbumes y visualización destacada del ganador semanal.',
    changes: [
      {
        type: 'feature',
        title: 'Panel de Administración (AdminPanel)',
        description: 'Herramientas de moderador para activar, desactivar o remover álbumes del catálogo.'
      },
      {
        type: 'feature',
        title: 'Modal de Ganador Integrado (WinnerDisplay)',
        description: 'Presentación destacada con botón de reproducción en Spotify y acceso rápido a reseñas.'
      }
    ]
  },
  {
    version: 'V.3.2',
    title: 'Explorador Global de Reseñas Comunitarias',
    date: '2026-08-05',
    sha: '40add2f',
    tag: 'Feature',
    tagColor: 'from-purple-500 to-violet-500',
    authorName: 'Eugenio Turcott',
    summary: 'Página dedicada (/reviews) para consultar el feed completo de opiniones y calificaciones del club.',
    changes: [
      {
        type: 'feature',
        title: 'Feed de Reseñas en Vivo (ReviewsPage)',
        description: 'Muro interactivo con las últimas reseñas enviadas por los miembros, comentarios y puntuaciones.'
      },
      {
        type: 'improvement',
        title: 'Navegación en AppHeader',
        description: 'Acceso directo a la sección de Reviews desde la barra superior.'
      }
    ]
  },
  {
    version: 'V.3.1',
    title: 'Hook Reactivo useAlbums y Manejo de Estados de Inactividad',
    date: '2026-08-05',
    sha: '0932f91',
    tag: 'Mejora',
    tagColor: 'from-teal-500 to-emerald-500',
    authorName: 'Eugenio Turcott',
    summary: 'Centralización de la lógica de datos en el custom hook useAlbums con soporte de mutaciones optimistas.',
    changes: [
      {
        type: 'improvement',
        title: 'Custom Hook useAlbums',
        description: 'Centralización de queries de Supabase, filtrado de estados y refresco automático tras calificar.'
      },
      {
        type: 'feature',
        title: 'Marcado de Álbumes Inactivos',
        description: 'Función para archivar álbumes que ya concluyeron su ciclo de votación.'
      }
    ]
  },
  {
    version: 'V.3.0',
    title: 'Evolución a Slot Machine Arcade con 3 Carretes Mecánicos',
    date: '2026-08-04',
    sha: 'bce12f5',
    tag: 'Mayor',
    tagColor: 'from-yellow-500 to-amber-600',
    authorName: 'Eugenio Turcott',
    summary: 'Reemplazo total del prototipo de ruleta plana por una Máquina Tragamonedas (Slot Machine) estilo arcade con animaciones de carretes independientes.',
    changes: [
      {
        type: 'feature',
        title: 'Slot Machine Cyberpunk con 3 Carretes',
        description: 'Animación de giro secuencial de 3 carretes con blur de movimiento y efectos sonoros de neón.'
      },
      {
        type: 'feature',
        title: 'Modal de Victoria con Lluvia de Confetti',
        description: 'Celebración inmersiva en pantalla completa al revelarse el álbum ganador.'
      },
      {
        type: 'improvement',
        title: 'Integración Directa con Spotify API',
        description: 'Recuperación de enlaces oficiales de reproducción y arte de portada en alta definición.'
      }
    ]
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
    summary: 'Ajustes de espaciado y estructura de contenedores en App.js para soporte de múltiples resoluciones.',
    changes: [
      {
        type: 'fix',
        title: 'Alineación de Contenedores en App.js',
        description: 'Corrección de márgenes y paddings en la vista general de la aplicación.'
      }
    ]
  },
  {
    version: 'V.2.3',
    title: 'Persistencia de Sesión y Manejo de Tokens en useAuth',
    date: '2026-08-03',
    sha: '59c9c6e',
    tag: 'Mejora',
    tagColor: 'from-indigo-500 to-purple-500',
    authorName: 'eugenio-turcott',
    summary: 'Mejoras en el ciclo de vida de la sesión de Supabase Auth y recuperación de usuario.',
    changes: [
      {
        type: 'improvement',
        title: 'Gestión de Sesión en useAuth.js',
        description: 'Sincronización del estado de autenticación con onAuthStateChange de Supabase.'
      }
    ]
  },
  {
    version: 'V.2.2',
    title: 'Avatar de Usuario y Acciones de Perfil en Encabezado',
    date: '2026-08-03',
    sha: 'f22a415',
    tag: 'Feature',
    tagColor: 'from-pink-500 to-rose-500',
    authorName: 'eugenio-turcott',
    summary: 'Visualización del avatar de Google, nombre de usuario y botón de cerrar sesión en AppHeader.',
    changes: [
      {
        type: 'feature',
        title: 'Perfil en AppHeader',
        description: 'Visualización de la foto de perfil del usuario autenticado y menú desplegable de acciones.'
      }
    ]
  },
  {
    version: 'V.2.1',
    title: 'Estilos Cyberpunk Neón y Rutas de Administración',
    date: '2026-08-03',
    sha: '471a6d9',
    tag: 'Feature',
    tagColor: 'from-purple-500 to-indigo-500',
    authorName: 'Eugenio Turcott',
    summary: 'Implementación del tema visual oscuro cyber-grid, gradientes neón y creación de AdminPage.',
    changes: [
      {
        type: 'feature',
        title: 'Tema Visual Cyberpunk en global.css',
        description: 'Fondo de cuadrícula cibernética, efectos de neón rosa/violeta y scrollbars personalizados.'
      },
      {
        type: 'feature',
        title: 'Ruta de Administración (/admin)',
        description: 'Acceso protegido para moderación de álbumes y usuarios administradores.'
      }
    ]
  },
  {
    version: 'V.2.0',
    title: 'Autenticación con Google OAuth y Supabase Auth',
    date: '2026-08-03',
    sha: '01696b0',
    tag: 'Mayor',
    tagColor: 'from-blue-600 to-indigo-600',
    authorName: 'Eugenio Turcott',
    summary: 'Reemplazo del sistema anónimo por autenticación real con cuentas de Google y base de datos Supabase.',
    changes: [
      {
        type: 'feature',
        title: 'Google OAuth 2.0 con Supabase',
        description: 'Inicio de sesión con un solo clic, almacenamiento de perfiles de usuario y roles de permisos.'
      },
      {
        type: 'feature',
        title: 'Protección de Reseñas y Propuestas',
        description: 'Vinculación de cada reseña y propuesta musical a la cuenta autenticada del usuario.'
      }
    ]
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
    summary: 'Integración del archivo de verificación HTML para indexación oficial en los servicios de Google.',
    changes: [
      {
        type: 'improvement',
        title: 'Google Search Console Verification',
        description: 'Inclusión del archivo de validación pública para monitoreo de indexación web.'
      }
    ]
  },
  {
    version: 'V.1.8',
    title: 'Configuración de Verificación de Identidad Google OAuth',
    date: '2026-08-03',
    sha: 'b20bf03',
    tag: 'Config',
    tagColor: 'from-blue-500 to-cyan-500',
    authorName: 'Eugenio Turcott',
    summary: 'Ajustes en la verificación de la pantalla de consentimiento de Google Cloud Console.',
    changes: [
      {
        type: 'improvement',
        title: 'Consentimiento OAuth en Producción',
        description: 'Configuración de credenciales seguras para el flujo de autorización OAuth.'
      }
    ]
  },
  {
    version: 'V.1.7',
    title: 'Módulo SEO y Meta Tags para Redes Sociales',
    date: '2026-08-03',
    sha: 'f330e01',
    tag: 'SEO',
    tagColor: 'from-pink-500 to-purple-500',
    authorName: 'Eugenio Turcott',
    summary: 'Componente SEO para tarjetas de previsualización en WhatsApp, Discord y Twitter.',
    changes: [
      {
        type: 'feature',
        title: 'Componente SEO (SEO.jsx)',
        description: 'Generación dinámica de Open Graph meta tags, títulos y descripción del club musical.'
      }
    ]
  },
  {
    version: 'V.1.6',
    title: 'Depuración y Manejo de Errores en useAuth',
    date: '2026-08-03',
    sha: 'e4dafb5',
    tag: 'Fix',
    tagColor: 'from-amber-500 to-red-500',
    authorName: 'Eugenio Turcott',
    summary: 'Manejo de estados de error en intentos fallidos de autenticación y redirecciones.',
    changes: [
      {
        type: 'fix',
        title: 'Control de Errores de Inicio de Sesión',
        description: 'Notificaciones amigables cuando se cancela el flujo de Google OAuth.'
      }
    ]
  },
  {
    version: 'V.1.5',
    title: 'Modal de Inicio de Sesión y Documentos Legales Iniciales',
    date: '2026-08-03',
    sha: '69e7e8c',
    tag: 'Feature',
    tagColor: 'from-purple-500 to-pink-500',
    authorName: 'Eugenio Turcott',
    summary: 'Creación de LoginModal con opción de Google y correo, y primeras páginas de términos y privacidad.',
    changes: [
      {
        type: 'feature',
        title: 'LoginModal con Diseño Cyberpunk',
        description: 'Ventana emergente estilizada con botón directo de Google Login y soporte de email.'
      },
      {
        type: 'feature',
        title: 'Estructura Legal Inicial',
        description: 'Primer borrador de PrivacyPolicy y TermsOfService en el pie de página.'
      }
    ]
  },
  {
    version: 'V.1.4',
    title: 'Optimización de Consultas SQL en supabaseClient',
    date: '2026-08-02',
    sha: 'c93a8f7',
    tag: 'Optimización',
    tagColor: 'from-emerald-500 to-teal-500',
    authorName: 'eugenio-turcott',
    summary: 'Mejora en la estructura de consultas para la obtención del catálogo completo de álbumes.',
    changes: [
      {
        type: 'improvement',
        title: 'Optimización de Cliente Supabase',
        description: 'Uso de transacciones limpias y control de reconexiones en supabaseClient.js.'
      }
    ]
  },
  {
    version: 'V.1.3',
    title: 'Cálculo Dinámico de Rankings en Rankings.jsx',
    date: '2026-08-02',
    sha: '686bdef',
    tag: 'Feature',
    tagColor: 'from-amber-500 to-yellow-500',
    authorName: 'eugenio-turcott',
    summary: 'Integración del motor de ordenamiento por calificación promedio histórica de álbumes.',
    changes: [
      {
        type: 'feature',
        title: 'Tabla de Rankings en Tiempo Real',
        description: 'Ordenamiento reactivo por puntuación general y distinción entre pool e individuales.'
      }
    ]
  },
  {
    version: 'V.1.2',
    title: 'Scripts de Migración de Datos a Supabase PostgreSQL',
    date: '2026-08-02',
    sha: '72e56a8',
    tag: 'Database',
    tagColor: 'from-teal-500 to-cyan-500',
    authorName: 'eugenio-turcott',
    summary: 'Scripts Node.js para migrar álbumes y reseñas históricas desde Google Sheets hacia PostgreSQL en Supabase.',
    changes: [
      {
        type: 'database',
        title: 'Scripts de Migración (migrateAlbums / migrateReviews)',
        description: 'Migración automatizada de registros históricos manteniendo la integridad de fechas y puntuaciones.'
      },
      {
        type: 'database',
        title: 'Esquema Relacional Inicial en Supabase',
        description: 'Tablas relacionales albums y reviews con llaves foráneas y restricciones.'
      }
    ]
  },
  {
    version: 'V.1.1',
    title: 'Actualización de Dependencias y Scripts de Build',
    date: '2026-07-26',
    sha: '8dc035f',
    tag: 'Config',
    tagColor: 'from-gray-500 to-slate-600',
    authorName: 'Eugenio Turcott',
    summary: 'Ajuste de paquetes de Node y optimización de configuraciones de React Scripts.',
    changes: [
      {
        type: 'improvement',
        title: 'Optimización de Dependencias',
        description: 'Limpieza de paquetes innecesarios en package.json.'
      }
    ]
  },
  {
    version: 'V.1.0',
    title: 'Lanzamiento Inicial de Musiclub con Supabase y Spotify API',
    date: '2026-07-26',
    sha: '427ba9b',
    tag: 'Lanzamiento',
    tagColor: 'from-emerald-500 to-green-600',
    authorName: 'eugenio-turcott',
    summary: 'Nacimiento oficial de la plataforma Musiclub, migrando de Google Sheets a una arquitectura web moderna con base de datos en Supabase y metadatos de Spotify.',
    changes: [
      {
        type: 'feature',
        title: 'Conexión con Supabase y Spotify API',
        description: 'Búsqueda en catálogo oficial de Spotify y persistencia de propuestas y votos en Supabase.'
      },
      {
        type: 'feature',
        title: 'Primer Sistema de Reseñas y Puntuación',
        description: 'Formulario para calificar discos y almacenar comentarios de los miembros.'
      },
      {
        type: 'feature',
        title: 'Slot Machine y Cuadrícula de Discos',
        description: 'Interfaz gráfica inicial para sorteo de discos y visualización en tarjetas.'
      }
    ]
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
    summary: 'Segundo prototipo experimental con ruleta circular SVG de segmentos y ventana emergente de ganador.',
    changes: [
      {
        type: 'feature',
        title: 'Prototipo de Ruleta Circular SVG (Wheel.jsx)',
        description: 'Rueda gráfica con segmentos divididos por álbum y animación de rotación.'
      },
      {
        type: 'feature',
        title: 'Modal Emergente de Ganador (WinnerPopup.jsx)',
        description: 'Ventana básica para mostrar el disco resultante del giro.'
      }
    ]
  },
  {
    version: 'V.0.1',
    title: 'Primer Prototipo Visual con Tailwind CSS y Conexión Sheets',
    date: '2026-07-14',
    sha: 'c882be0',
    tag: 'Prototipo',
    tagColor: 'from-blue-600 to-indigo-600',
    authorName: 'Eugenio Turcott',
    summary: 'Configuración inicial del entorno de diseño con Tailwind CSS y lectura de datos desde API externa.',
    changes: [
      {
        type: 'feature',
        title: 'Configuración de Tailwind CSS y Estilos Base',
        description: 'Estructura de fuentes, colores oscuros y componentes iniciales de UI.'
      },
      {
        type: 'feature',
        title: 'Primer Boceto de la Ruleta Musical',
        description: 'Maquetación de la ruleta de discos para las reuniones del club.'
      }
    ]
  },
  {
    version: 'V.0.0',
    title: 'Inicialización del Proyecto (Create React App)',
    date: '2026-07-14',
    sha: '7de6dba',
    tag: 'Inicial',
    tagColor: 'from-gray-600 to-slate-700',
    authorName: 'Eugenio Turcott',
    summary: 'Creación del repositorio y estructura de directorios inicial del proyecto con React 18.',
    changes: [
      {
        type: 'feature',
        title: 'Setup Inicial con React 18',
        description: 'Configuración del entorno de desarrollo, gitignore, package.json y estructura base.'
      }
    ]
  }
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
    const message = ghCommit.commit?.message || '';
    const sha = ghCommit.sha?.substring(0, 7) || '';
    const fullSha = ghCommit.sha || '';
    const date = ghCommit.commit?.author?.date
      ? ghCommit.commit.author.date.substring(0, 10)
      : new Date().toISOString().substring(0, 10);
    const authorName = ghCommit.commit?.author?.name || ghCommit.author?.login || 'Eugenio Turcott';
    const authorAvatar = ghCommit.author?.avatar_url || null;
    const commitUrl = ghCommit.html_url || `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commit/${fullSha}`;

    // Buscar coincidencia de versión en mensaje ej "Slot Machine Álbumes - V.5.1" o "Slot Machine Álbumes - V.5.0"
    const versionMatch = message.match(/V\.?\s?(\d+\.\d+(\.\d+)?)/i);
    const versionKey = versionMatch ? `V.${versionMatch[1]}` : null;

    // Buscar en notas curadas por SHA corto o por versión
    const curated = CURATED_PATCH_NOTES.find(
      (n) => (n.sha && n.sha !== 'pending' && (sha.startsWith(n.sha) || n.sha.startsWith(sha))) || 
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
        isFromGithub: true
      });
    } else if (!curated && !processedKeys.has(sha)) {
      processedKeys.add(sha);
      // Commit nuevo sin entrada curada previa: parsear automáticamente
      const lines = message.split('\n').map((l) => l.trim()).filter(Boolean);
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

      const changes = bodyLines.length > 0
        ? bodyLines.map((line) => ({
            type: /fix|bug/i.test(line) ? 'fix' : /mejora|optim/i.test(line) ? 'improvement' : 'feature',
            title: line.replace(/^[-*•]\s*/, ''),
            description: 'Actualización registrada en el repositorio GitHub.'
          }))
        : [
            {
              type: 'feature',
              title: title,
              description: 'Cambios sincronizados directamente desde el commit de GitHub main.'
            }
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
        isFromGithub: true
      });
    }
  });

  // Agregar cualquier nota curada que aún no haya sido vinculada a un commit
  CURATED_PATCH_NOTES.forEach((curated) => {
    if (!processedKeys.has(curated.version)) {
      enrichedList.push({
        ...curated,
        commitUrl: curated.sha !== 'pending' 
          ? `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commit/${curated.sha}`
          : `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`,
        isFromGithub: false
      });
    }
  });

  return enrichedList;
}
