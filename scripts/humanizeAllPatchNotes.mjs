// scripts/humanizeAllPatchNotes.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const patchNotesPath = path.resolve(__dirname, '../src/data/patchNotesData.js');

// Diccionario de títulos y resúmenes 100% amigables y cero técnicos para las 73 versiones
const FRIENDLY_VERSIONS = {
  'V.9.2': {
    title: '¡Llegan los Correos Oficiales de Musiclub! Avisos de Nuevos Estrenos a Medianoche, Novedades del Pool y Buzón de Canciones',
    tag: 'Notificaciones Oficiales por Correo 9.2',
    summary: 'Gran actualización con el nuevo sistema de correos oficiales de Musiclub bajo nuestro dominio oficial. Ahora puedes activar recordatorios para tus álbumes más esperados y recibir un aviso especial a las 12:00 AM del día de su estreno. Además, entérate al instante de cada ganador semanal del Pool, recibe el resumen con las calificaciones de la comunidad cuando un disco se gradúa, y envía recomendaciones directas de canciones a tus amigos con un hermoso diseño de postal y enlaces directos a Spotify, Apple Music, YouTube Music y Deezer.',
  },
  'V.9.1': {
    title: 'Catálogo Musical Perfeccionado: Más Canciones Reales, Portadas en Alta Definición y Datos Exactos de Cada Disco',
    tag: 'Catálogo y Lanzamientos 9.1',
    summary: 'Actualizamos nuestra gran biblioteca de música para que cada álbum, sencillo o EP tenga su lista real y completa de canciones, portadas oficiales en máxima resolución y fechas exactas. Ahora puedes consultar con total precisión las pistas de tus lanzamientos favoritos y disfrutarlos al instante en todas tus plataformas de streaming preferidas.',
  },
  'V.9.0': {
    title: 'Radar de Tendencias Musicales Matutino: Los 100 Discos Más Populares del Mundo y Alertas de Estreno',
    tag: 'Radar de Tendencias y Novedades 9.0',
    summary: 'Estrenamos el nuevo Radar de Tendencias que actualiza cada mañana el Top 100 de álbumes más escuchados y los 50 próximos estrenos más esperados del planeta. Ahora puedes apartar tus álbumes favoritos para recibir alertas por correo y disfrutar de un nuevo diseño con discos de vinilo gigantes y elegantes que decoran la plataforma.',
  },
  'V.8.12': {
    title: 'Identidad Visual Renovada: Discos de Vinilo Giratorios, Carrusel Infinito de Tendencias y Nueva Navegación',
    tag: 'Identidad y Animaciones',
    summary: 'Una experiencia mucho más inmersiva y musical: ahora verás vinilos giratorios con movimiento suave en toda la plataforma, un carrusel dinámico e interactivo para descubrir álbumes en tendencia y una tabla de posiciones organizada cómodamente página por página.',
  },
  'V.8.11': {
    title: 'Nombres de Canciones, Álbumes y Artistas Siempre Fieles y en su Idioma Original',
    tag: 'Fidelidad Musical',
    summary: 'Protegemos la identidad de tu música favorita: ahora los títulos de las canciones, los nombres de los discos y los artistas se mantienen intactos en su idioma original sin traducciones automáticas extrañas de los navegadores.',
  },
  'V.8.10': {
    title: 'Creador de Listas de Álbumes (Tier List) Rediseñado para Celulares e Historias de Redes Sociales',
    tag: 'Tier Lists en Celular',
    summary: 'Organiza y califica tus álbumes favoritos con el nuevo formato adaptado a la pantalla de tu celular. Perfecto para tomar captura y compartir tus mejores discos en historias de Instagram o con tus amigos del club.',
  },
  'V.8.9': {
    title: 'Tarjetas de Reseñas Más Bonitas para Compartir, Nivel de Melómano y Canción Favorita Destacada',
    tag: 'Diseño de Reseñas',
    summary: 'Mejoramos el diseño visual para compartir tus reseñas: las calificaciones ahora lucen más elegantes y centradas, se muestra tu nivel de experiencia en la comunidad y tu canción favorita tiene un lugar de honor en la tarjeta.',
  },
  'V.8.8': {
    title: 'Perfeccionamiento Visual en las Reseñas del Club y Tarjetas de Calificación 10/10',
    tag: 'Elegancia Visual',
    summary: 'Ajustes de diseño para que tus opiniones musicales luzcan impecables: tipografías más legibles, márgenes balanceados y un formato visual claro para lucir tus mejores calificaciones.',
  },
  'V.8.7': {
    title: 'Nueva Experiencia Móvil para Compartir Reseñas en Historias de Redes Sociales',
    tag: 'Historias para Redes',
    summary: 'Comparte tus opiniones musicales con un solo toque: tarjetas verticales con la portada del disco en grande, resumen de tu nota y botones rápidos para guardar y compartir con tus amigos.',
  },
  'V.8.6': {
    title: 'Tarjetas de Reseñas para Historias de Celular con Mayor Legibilidad y Elegancia',
    tag: 'Diseño para Celular',
    summary: 'Nuevo formato vertical estilizado y letras más nítidas para que presumir tus opiniones y descubrimientos musicales en redes sociales sea más fácil y atractivo que nunca.',
  },
  'V.8.5': {
    title: 'Gran Renovación del Catálogo de Música: Exploración por Géneros y Perfiles de Artistas Claros',
    tag: 'Exploración Musical',
    summary: 'Navegar por la música que amas ahora es más sencillo: explora discos organizados por género musical con páginas fluidas y disfruta de perfiles de artistas ordenados sin confusiones de nombres.',
  },
  'V.8.4': {
    title: 'Explorador de Tendencias del Año y Mejor Búsqueda en la Web',
    tag: 'Tendencias del Año',
    summary: 'Descubre los mejores álbumes del año en tiempo real con una interfaz moderna y rápida, facilitando que nuevos amantes de la música encuentren el club desde cualquier buscador.',
  },
  'V.8.3': {
    title: 'Perfiles de Artistas Impecables: Discografías Completas y Cero Confusiones de Bandas',
    tag: 'Perfiles de Artistas',
    summary: 'Separamos con precisión artistas que comparten nombres similares y trajimos la discografía oficial completa para que encuentres exactamente la música de tus bandas preferidas.',
  },
  'V.8.2': {
    title: 'Biblioteca Expandida a Más de 2,200 Álbumes y Selección de Canciones Favoritas',
    tag: 'Gran Catálogo',
    summary: 'Una enorme expansión de música en el club: más de 2,200 álbumes disponibles para reseñar, opción de elegir tu canción favorita de cada disco y herramientas más cómodas para la comunidad.',
  },
  'V.8.1': {
    title: 'Nueva Tipografía Oficial Gabarito y Tarjetas de Reseña Mejoradas para Celular',
    tag: 'Nueva Tipografía',
    summary: 'Musiclub estrena la elegante tipografía Gabarito en toda la web y actualiza sus logotipos oficiales, brindando una lectura más cómoda y una estética moderna en teléfonos móviles.',
  },
  'V.8.0': {
    title: 'Gran Salto en Velocidad: Carga Instantánea de Páginas y Navegación Ultrarrápida',
    tag: 'Velocidad Instantánea',
    summary: 'Transformación completa en el motor de la plataforma para que Musiclub abra a la velocidad de la luz. Las páginas cargan al instante, los menús responden con total fluidez y la experiencia musical es más placentera.',
  },
  'V.7.9': {
    title: 'Navegación Más Ágil, Fluida y Libre de Anuncios Molestos',
    tag: 'Navegación Limpia',
    summary: 'Aceleramos los tiempos de carga en toda la plataforma y limpiamos la experiencia de navegación para que disfrutes de la música sin interrupciones.',
  },
  'V.7.8': {
    title: 'Lectura Cómoda y Navegación 100% Limpia',
    tag: 'Comodidad Visual',
    summary: 'Adoptamos una tipografía más suave y clara para la vista y eliminamos ventanas emergentes para que tu experiencia en el club sea tranquila y disfrutable.',
  },
  'V.7.7': {
    title: 'Máquina Gashapon Cinemática y Mejor Clasificación de Géneros Musicales',
    tag: 'Gashapon Musical',
    summary: 'Disfruta de una divertida máquina estilo arcade para descubrir discos al azar con efectos visuales emocionantes y un catálogo de música mejor organizado.',
  },
  'V.7.6': {
    title: 'Exploración Continua sin Interrupciones y Música Siempre Disponible en Deezer',
    tag: 'Música sin Pausas',
    summary: 'Garantizamos que puedas navegar y escuchar música de manera continua sin pausas ni pantallas de espera, añadiendo enlaces directos a Deezer para escuchar cada canción.',
  },
  'V.7.5': {
    title: 'Actualización Automática y Continua de la Biblioteca Musical',
    tag: 'Catálogo Siempre Fresco',
    summary: 'El catálogo de música ahora se actualiza solo en segundo plano, incorporando nuevos lanzamientos y álbumes clásicos para que siempre tengas música fresca para descubrir.',
  },
  'V.7.4': {
    title: 'Crecimiento Inteligente del Catálogo: Novedades del Año, Tendencias y Grandes Clásicos',
    tag: 'Colección Musical',
    summary: 'Incorporamos una selección balanceada de la mejor música: estrenos recientes, los álbumes más populares del momento y joyas de décadas pasadas con todas sus canciones completas.',
  },
  'V.7.3': {
    title: 'Dominio Oficial www.musiclub.org y Acceso Más Fácil desde Buscadores',
    tag: 'Sitio Oficial',
    summary: 'Musiclub consolida su presencia oficial en internet bajo su dirección www.musiclub.org, facilitando que nuevos melómanos nos encuentren rápidamente en Google.',
  },
  'V.7.2': {
    title: 'Tu Música en Todas Partes: Enlaces Garantizados a Spotify, Apple Music, YouTube y Deezer',
    tag: 'Enlaces Universales',
    summary: 'Ahora cada álbum del club cuenta con enlaces directos a las 4 plataformas de audio más populares, para que escuches tus discos en tu aplicación favorita con un solo clic.',
  },
  'V.7.1': {
    title: '¡Califica tus Portadas de Discos Favoritas y Recibe Recomendaciones cada Hora!',
    tag: 'Arte de Portadas',
    summary: 'Llega el calificador de arte de portadas: vota por las carátulas más hermosas de la música, descubre sugerencias musicales que cambian cada hora y disfruta de un menú más ordenado.',
  },
  'V.7.0': {
    title: 'Comunidad Más Viva: Reacciones y Comentarios en Reseñas, y Calificación Instantánea de Discos',
    tag: 'Comunidad Musical',
    summary: 'Interactúa con otros amantes de la música: reacciona a las opiniones de tus compañeros, comenta en hilos de conversación y califica álbumes al instante sin tiempos de espera.',
  },
  'V.6.7': {
    title: 'Catálogo Musical Independiente y Mayor Claridad en el Historial de Mejoras',
    tag: 'Biblioteca Musical',
    summary: 'Mejoramos la organización interna de los álbumes para que cualquier miembro pueda reseñar libremente sin dependencias, con un registro de novedades más limpio y fácil de leer.',
  },
  'V.6.6': {
    title: 'Buscador de Álbumes Más Rápido y Enlaces a Tus 4 Plataformas Favoritas',
    tag: 'Búsqueda Rápida',
    summary: 'Busca cualquier álbum con rapidez y accede al instante en Deezer, Apple Music, YouTube Music y Spotify, con datos y portadas que se renuevan constantemente.',
  },
  'V.6.5': {
    title: 'Exploración Cómoda de Grandes Colecciones y Listas Completas de Canciones',
    tag: 'Grandes Colecciones',
    summary: 'Navega fluidamente por catálogos con cientos de álbumes y reseñas, garantizando que cada disco muestre su lista completa de canciones sin fallas de carga.',
  },
  'V.6.4': {
    title: 'Notificaciones del Ganador del Pool y Álbumes Graduados con Honores',
    tag: 'Pool Semanal',
    summary: 'Avisos claros de cada disco elegido por la comunidad para escuchar en la semana y recopilación de los 21 álbumes que ya han culminado su semana oficial en el club.',
  },
  'V.6.3': {
    title: 'Mejor Presencia en Google y Mayor Estabilidad en la Plataforma',
    tag: 'Estabilidad y Presencia',
    summary: 'Ajustes para que la página sea más fácil de encontrar en internet y funcione con total solidez para todos los visitantes.',
  },
  'V.6.2': {
    title: 'Llegada Masiva de Álbumes con Portadas Oficiales en Alta Calidad',
    tag: 'Catálogo Masivo',
    summary: 'El club se llena de música: miles de discos añadidos automáticamente con sus portadas oficiales en máxima definición y fichas técnicas completas.',
  },
  'V.6.1': {
    title: 'Sostenibilidad de la Plataforma para Seguir Creciendo Juntos',
    tag: 'Mantenimiento del Club',
    summary: 'Integración de espacios publicitarios respetuosos para apoyar el mantenimiento de los servidores del club sin afectar tu experiencia de navegación.',
  },
  'V.6.0': {
    title: 'Portadas en Alta Definición, Disco de Vinilo Interactivo y Nuevas Vistas Musicales',
    tag: 'Vinilo y Portadas HD',
    summary: 'Una experiencia visual cautivadora: disfruta de un disco de vinilo interactivo, portadas en calidad de estudio y una mejor distinción entre sencillos, EPs y álbumes de larga duración.',
  },
  'V.5.9': {
    title: 'Musiclub para Todo el Mundo: Soporte en 10 Idiomas con Nombres Musicales Intactos',
    tag: 'Idiomas del Mundo',
    summary: 'La plataforma ahora habla tu idioma: traduce la interfaz a 10 idiomas distintos manteniendo siempre los nombres de canciones y artistas en su lengua original, con una nueva pantalla de página no encontrada.',
  },
  'V.5.8': {
    title: 'Ajustes y Estabilidad en el Nuevo Dominio Oficial musiclub.org',
    tag: 'Hogar Oficial',
    summary: 'Afinación de detalles internos para asegurar que todo funcione a la perfección en nuestra nueva dirección oficial musiclub.org.',
  },
  'V.5.7': {
    title: 'Catálogo en Crecimiento Continuo con Búsqueda Instantánea de Discos',
    tag: 'Búsqueda Instantánea',
    summary: 'Encuentra cualquier álbum al momento con portadas y datos oficiales, haciendo que Musiclub sea más visible y accesible para nuevos miembros en la web.',
  },
  'V.5.6': {
    title: 'Estreno del Dominio Oficial musiclub.org y Pie de Página Global',
    tag: 'Gran Estreno',
    summary: 'Celebramos la llegada a nuestra casa definitiva musiclub.org con un pie de página renovado, inicio de sesión fluido con Google y navegación optimizada.',
  },
  'V.5.5': {
    title: 'Páginas Oficiales de Artistas, Discografías Completas y Edición de Perfil',
    tag: 'Discografías de Artistas',
    summary: 'Explora la discografía completa de tus artistas favoritos con páginas dedicadas, personaliza los datos de tu perfil y presume cuántas reseñas has compartido en el podio del club.',
  },
  'V.5.4': {
    title: 'Creador de Listas de Álbumes (Tier Lists) y Filtro por Años y Décadas',
    tag: 'Tier Lists y Décadas',
    summary: 'Arma tus listas de álbumes preferidos con nuestro nuevo creador de Tier Lists descargable en imagen y viaja en el tiempo explorando la mejor música por años y décadas.',
  },
  'V.5.3': {
    title: 'Conteo Preciso de Álbumes Postulados y Mejoras en el Historial',
    tag: 'Estadísticas del Club',
    summary: 'Tu podio de reseñadores ahora refleja con exactitud cuántos álbumes has nominado a la comunidad, junto con mejoras visuales en las notas de actualización.',
  },
  'V.5.2': {
    title: 'Navegación Cómoda en Notas de Actualización y Nueva Identidad Musiclub',
    tag: 'Nueva Identidad',
    summary: 'Explora el historial del club página por página de forma ordenada, con desplazamiento suave restaurado y la nueva imagen de marca de Musiclub.',
  },
  'V.5.1': {
    title: 'Máquina Gashapon de Discos, Buzón de Recomendaciones y Buscador Directo',
    tag: 'Gashapon y Recomendaciones',
    summary: '¡Llegan nuevas formas de disfrutar la música! Diviértete con la máquina Gashapon para desbloquear discos sorpresa y recomienda canciones directamente a tus amigos del club.',
  },
  'V.5.0': {
    title: 'Recomendaciones Personalizadas «Para Ti» y Playlists Oficiales del Club',
    tag: 'Para Ti y Playlists',
    summary: 'Descubre álbumes recomendados a tu gusto con el nuevo motor de afinidad musical «Para Ti» y disfruta de listas de reproducción armadas con las opiniones de la comunidad.',
  },
  'V.4.4': {
    title: 'Medallas e Insignias para Miembros Activos y Calificaciones Ponderadas',
    tag: 'Insignias y Medallas',
    summary: 'Desbloquea medallas e insignias especiales por tu pasión y actividad en el club, con un cálculo más justo y representativo para los promedios de calificación.',
  },
  'V.4.3': {
    title: 'Centro de Ayuda Interactivo, Preguntas Frecuentes y Secciones Informativas',
    tag: 'Centro de Ayuda',
    summary: 'Añadimos un centro de ayuda completo con respuestas a las dudas más comunes sobre el club, las reseñas y el funcionamiento de la plataforma.',
  },
  'V.4.2': {
    title: 'Animaciones Más Suaves y Efectos Especiales en la Ruleta Musical',
    tag: 'Animaciones Arcade',
    summary: 'La máquina tragamonedas de álbumes ahora gira con una desaceleración más realista y efectos visuales emocionantes al elegir tu próximo disco.',
  },
  'V.4.1': {
    title: 'Tabla de Posiciones y Podio Comunitario Mucho Más Rápidos',
    tag: 'Podio Ultrarrápido',
    summary: 'El podio de reseñadores y la tabla de posiciones ahora cargan al instante para que veas en tiempo real quién lidera las opiniones del club.',
  },
  'V.4.0': {
    title: 'Reseñas Detalladas en 6 Criterios Musicales y Calificación Canción por Canción',
    tag: 'Reseñas en 6 Dimensiones',
    summary: 'Un gran salto para los melómanos: evalúa cada disco según sus 6 notas clave (Producción, Composición, Letras, Originalidad, Cohesión y Replay Value) y califica cada canción individualmente.',
  },
  'V.3.5': {
    title: 'Galería de Álbumes Más Clara y Visualmente Atractiva',
    tag: 'Galería de Música',
    summary: 'Mejoras en la cuadrícula de álbumes: carátulas más definidas, etiquetas de estado llamativas y una visualización más cómoda de tu colección.',
  },
  'V.3.4': {
    title: 'Buscador de Álbumes con Spotify y Podio Dorado de Ganadores',
    tag: 'Podio Dorado',
    summary: 'Encuentra cualquier álbum de Spotify para agregarlo al club con un buscador rápido y celebra a los miembros destacados con un podio dorado en los rankings.',
  },
  'V.3.3': {
    title: 'Herramientas de Organización y Destacado del Álbum Semanal',
    tag: 'Álbum de la Semana',
    summary: 'Mejoras para coordinar las actividades del club y una tarjeta especial para lucir con orgullo el álbum ganador de cada semana.',
  },
  'V.3.2': {
    title: 'Muro Comunitario de Reseñas: Descubre lo que Opina el Club',
    tag: 'Muro de Opiniones',
    summary: 'Estrenamos una página dedicada para explorar todas las opiniones, notas y comentarios compartidos por los miembros sobre sus discos favoritos.',
  },
  'V.3.1': {
    title: 'Navegación Fluida y Carga Inmediata de Álbumes',
    tag: 'Fluidez Total',
    summary: 'La plataforma ahora guarda y actualiza tus álbumes al instante en pantalla sin parpadeos ni recargas molestas.',
  },
  'V.3.0': {
    title: 'La Gran Ruleta Tragamonedas Musical con 3 Carretes Estilo Arcade',
    tag: 'Ruleta Arcade 3D',
    summary: '¡Una forma divertida de elegir qué escuchar! Estrenamos la icónica máquina tragamonedas de 3 carretes con animaciones mecánicas y sonido para descubrir discos al azar.',
  },
  'V.2.4': {
    title: 'Diseño Adaptable a Todo Tipo de Pantallas y Celulares',
    tag: 'Diseño Responsivo',
    summary: 'Ajustamos los tamaños y espacios de la plataforma para que Musiclub se vea impecable tanto en computadoras de escritorio como en tablets y celulares.',
  },
  'V.2.3': {
    title: 'Tu Sesión Siempre Activa sin Cierres Inesperados',
    tag: 'Cuentas Seguras',
    summary: 'Mejoramos el sistema de conexión para que tu cuenta permanezca iniciada de forma segura y no tengas que escribir tu contraseña constantemente.',
  },
  'V.2.2': {
    title: 'Tu Foto de Perfil y Menú de Usuario en la Barra Superior',
    tag: 'Perfil de Usuario',
    summary: 'Ahora puedes ver tu avatar de Google, tu nombre de melómano y un menú rápido para acceder a tu perfil o cerrar sesión con comodidad.',
  },
  'V.2.1': {
    title: 'Estética Neón Cyberpunk y Herramientas del Club',
    tag: 'Estilo Cyberpunk',
    summary: 'Musiclub estrena su atmósfera visual distintiva con tonos oscuros, detalles neón y paneles especiales para coordinar la música del club.',
  },
  'V.2.0': {
    title: 'Inicio de Sesión Fácil y Seguro con tu Cuenta de Google',
    tag: 'Cuentas con Google',
    summary: 'Damos la bienvenida a las cuentas oficiales: ahora puedes registrarte e iniciar sesión con un solo clic usando tu cuenta de Google para guardar tus reseñas para siempre.',
  },
  'V.1.9': {
    title: 'Verificación Oficial de la Web en Google',
    tag: 'Presencia en Google',
    summary: 'Pasos oficiales para que Musiclub comience a aparecer en los resultados de búsqueda de Google y sea fácil de encontrar para nuevos miembros.',
  },
  'V.1.8': {
    title: 'Acceso Seguro Garantizado al Iniciar Sesión con Google',
    tag: 'Seguridad en Acceso',
    summary: 'Configuración de seguridad para que el acceso con tu cuenta de Google sea confiable, rápido y seguro en todo momento.',
  },
  'V.1.7': {
    title: 'Previsualizaciones Hermosas al Compartir Enlaces en Redes Sociales',
    tag: 'Enlaces en Redes',
    summary: 'Al compartir enlaces de Musiclub en WhatsApp, Discord o Twitter, ahora aparecerán con títulos, descripción y la portada del álbum en grande.',
  },
  'V.1.6': {
    title: 'Mensajes de Ayuda Claros al Iniciar Sesión',
    tag: 'Ayuda al Usuario',
    summary: 'Mejoramos la atención a los usuarios con avisos amigables en caso de escribir mal una contraseña o requerir ayuda para entrar.',
  },
  'V.1.5': {
    title: 'Ventana de Entrada al Club y Primeras Guías de Convivencia',
    tag: 'Bienvenida al Club',
    summary: 'Diseñamos una ventana cómoda para iniciar sesión con Google o correo y publicamos los términos y políticas para cuidar a nuestra comunidad.',
  },
  'V.1.4': {
    title: 'Mayor Rapidez al Mostrar el Catálogo de Álbumes',
    tag: 'Carga de Álbumes',
    summary: 'Mejoramos la velocidad con la que se muestran todos los discos del club para que puedas explorar la colección en menos de un segundo.',
  },
  'V.1.3': {
    title: 'Tabla de Posiciones de los Álbumes Mejor Calificados',
    tag: 'Top de Álbumes',
    summary: 'Calculamos en tiempo real el promedio histórico de cada disco para coronar a las mejores obras musicales según los votos del club.',
  },
  'V.1.2': {
    title: 'Mudanza de los Registros Históricos a la Nueva Biblioteca del Club',
    tag: 'Biblioteca Permanente',
    summary: 'Traspasamos todas las reseñas, álbumes y notas de las antiguas hojas de cálculo a la nueva base de datos permanente de Musiclub.',
  },
  'V.1.1': {
    title: 'Mejoras de Estabilidad y Puesta a Punto de la Plataforma',
    tag: 'Estabilidad y Ajustes',
    summary: 'Actualización de las herramientas internas para garantizar un funcionamiento fluido, moderno y sin fallos.',
  },
  'V.1.0': {
    title: '¡El Nacimiento Oficial de Musiclub! Nuestra Gran Comunidad Musical en la Web',
    tag: 'Lanzamiento Oficial',
    summary: 'El comienzo de una gran aventura: Musiclub da el salto de una hoja de cálculo a una plataforma web completa con catálogo de Spotify, reseñas de la comunidad y ruleta musical.',
  },
  'V.0.2': {
    title: 'La Primera Ruleta Musical y Galería Experimental de Álbumes',
    tag: 'Primeros Pasos',
    summary: 'Los primeros experimentos del club: una ruleta circular giratoria para sortear discos y una galería sencilla para ver las carátulas de la música.',
  },
  'V.0.1': {
    title: 'Primer Bosquejo Visual de lo que Sería Musiclub',
    tag: 'Primer Bosquejo',
    summary: 'El primer diseño visual del club en pantalla conectando las opiniones de los primeros miembros fundadores.',
  },
  'V.0.0': {
    title: 'La Primera Semilla de Musiclub: El Comienzo del Sueño Melómano',
    tag: 'El Origen',
    summary: 'Creación del proyecto original y primeros pasos de código para construir la casa digital de los amantes de la música.',
  },
};

// Función maestra para erradicar cualquier lenguaje técnico de títulos y descripciones de cambios
function humanizeText(text) {
  if (!text || typeof text !== 'string') return text;

  let s = text;

  const replacements = [
    [/ingesta canónica de 21 columnas/gi, 'actualización profunda de datos y canciones reales'],
    [/albumEnrichmentService/gi, 'buscador inteligente de música'],
    [/Supabase PostgreSQL/gi, 'la biblioteca del club'],
    [/PostgreSQL en Supabase/gi, 'la biblioteca permanente del club'],
    [/PostgreSQL/gi, 'la base de datos'],
    [/Supabase/gi, 'la biblioteca musical'],
    [/PostgREST/gi, 'el catálogo de canciones'],
    [/API de Spotify|Spotify API/gi, 'el catálogo oficial de Spotify'],
    [/Spotify CDN/gi, 'portadas en alta definición de Spotify'],
    [/API de MusicBrainz|MusicBrainz API|MusicBrainz/gi, 'la biblioteca mundial de música'],
    [/API de Deezer|Deezer API/gi, 'la integración con Deezer'],
    [/Next\.js App Router,\s*SSR/gi, 'tecnología de navegación instantánea'],
    [/Next\.js App Router/gi, 'navegación instantánea'],
    [/Next\.js/gi, 'el motor de Musiclub'],
    [/SSR/gi, 'carga rápida'],
    [/Schema\.org \(JSON-LD\)|Schema\.org|JSON-LD/gi, 'ficha técnica para buscadores'],
    [/Sitemaps? XML modulares?|Sitemaps? XML|sitemaps?/gi, 'guías para buscadores de internet'],
    [/canonical/gi, 'oficial'],
    [/Rate Limiting \(429\)|Rate Limits? \(429\/403\/CORS\)|Rate Limiting|Rate Limit/gi, 'pantallas de espera y pausas de carga'],
    [/429\/403\/CORS|429/gi, 'pantallas de espera'],
    [/CI\/CD/gi, 'automatización continua'],
    [/GitHub Actions 24\/7|GitHub Actions/gi, 'actualizaciones automáticas continuas'],
    [/runner batch|runner/gi, 'sistema automático'],
    [/Node\.js 22|Node\.js/gi, 'servidores de alta velocidad'],
    [/WebSocket en CLI/gi, 'conexión en vivo'],
    [/CLI/gi, 'la plataforma'],
    [/DKIM 1024\/2048-bit|DKIM/gi, 'sellos de autenticidad'],
    [/SPF/gi, 'validación oficial'],
    [/DMARC p=quarantine|DMARC/gi, 'protección de entrega segura'],
    [/Incrustación CID Nativa \(Content-ID Multipart\)|Incrustación CID Nativa|CID Multipart MIME|CID Inline Attachment/gi, 'imágenes integradas en alta calidad'],
    [/\bcid:musiclub_logo\b/gi, 'logo oficial'],
    [/\bcid:album_cover\b/gi, 'portada en alta resolución'],
    [/\bcid\b/gi, 'imagen oficial'],
    [/autenti[a-zA-Z\s]+ad/gi, 'autenticidad'],
    [/servidor SMTP en Brevo|servidor de retransmisión SMTP en Brevo|pasarela SMTP de Brevo|Brevo SMTP|SMTP/gi, 'servidor oficial de correos'],
    [/Let's Encrypt SSL|certificados SSL|SSL/gi, 'conexión segura'],
    [/Google OAuth y Supabase Auth|Google OAuth|Supabase Auth/gi, 'inicio de sesión seguro con Google'],
    [/Create React App|React 18/gi, 'los cimientos de la plataforma'],
    [/Tailwind CSS/gi, 'diseño visual estilizado'],
    [/Canvas 9:16|Formato Celular Story \(9:16 \/ 19\.5:9\)|Review Stories 9:16/gi, 'formato para historias de celular y redes sociales'],
    [/Tipificación Dinámica de Release \(SENCILLO, EP, ALBUM\)/gi, 'Identificación clara de Sencillos, EPs y Álbumes'],
    [/MBID/gi, 'código oficial de lanzamiento'],
    [/Adsterra/gi, 'anuncios de apoyo'],
    [/Google AdSense/gi, 'anuncios de sostenimiento'],
    [/robots\.txt/gi, 'guía para motores de búsqueda'],
    [/Popunders/gi, 'ventanas emergentes invasivas'],
    [/JSON payload/gi, 'información'],
    [/\bDOM\b/g, 'interfaz'],
    [/pantallainio/gi, 'dominio'],
    [/useAuth y localStorage/gi, 'el inicio de sesión seguro'],
    [/useAuth/gi, 'tu cuenta conectada'],
    [/localStorage/gi, 'la memoria de tu navegador'],
    [/endpoint \/api\/[a-zA-Z0-9_\-\/]+/gi, 'sistema interno'],
    [/scripts\/[a-zA-Z0-9_\-\.]+/gi, 'rutina automática'],
    [/consultas SQL/gi, 'búsqueda en la biblioteca'],
    [/SQL/gi, 'la base de datos'],
    [/hash SHA|SHA corto|SHA/gi, 'versión'],
    [/pull request|commits?|commit/gi, 'mejora'],
  ];

  for (const [pattern, replacement] of replacements) {
    s = s.replace(pattern, replacement);
  }

  return s;
}

async function run() {
  console.log('🔄 Iniciando humanización profunda de las 73 notas de parche...');
  const fileContent = fs.readFileSync(patchNotesPath, 'utf8');

  // Importar dinámicamente el array actual
  const mod = await import('file:///' + patchNotesPath.replace(/\\/g, '/'));
  const rawNotes = mod.CURATED_PATCH_NOTES || [];

  console.log(`📊 Total de versiones detectadas: ${rawNotes.length}`);

  const humanizedNotes = rawNotes.map((note) => {
    const vKey = note.version;
    const cleanKey = vKey ? vKey.replace(/^[vV]\.?\s*/, '').toLowerCase() : '';

    // Buscar coincidencia en FRIENDLY_VERSIONS
    let friendly = null;
    for (const [key, val] of Object.entries(FRIENDLY_VERSIONS)) {
      if (key.replace(/^[vV]\.?\s*/, '').toLowerCase() === cleanKey) {
        friendly = val;
        break;
      }
    }

    const title = friendly?.title || humanizeText(note.title);
    const summary = friendly?.summary || humanizeText(note.summary);
    const tag = friendly?.tag || humanizeText(note.tag);

    const changes = (note.changes || []).map((c) => ({
      ...c,
      title: humanizeText(c.title),
      description: humanizeText(c.description),
    }));

    return {
      ...note,
      title,
      summary,
      tag,
      changes,
    };
  });

  // Reconstruir el archivo patchNotesData.js preservando imports y la función mergeGithubCommitsWithCuratedNotes
  const headerLines = [
    "// src/data/patchNotesData.js",
    "/**",
    " * Musiclub Patch Notes & Historial de Actualizaciones Oficial",
    " * Registro completo de novedades, mejoras y funciones amigables para todo público",
    " * y sincronización con el historial del club.",
    " */",
    "",
    "export const GITHUB_REPO_OWNER = 'eugenio-turcott';",
    "export const GITHUB_REPO_NAME = 'musiclub-albumes';",
    "export const GITHUB_COMMITS_API = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commits?per_page=100`;",
    "",
    "export const CURATED_PATCH_NOTES = ",
  ].join('\n');

  // Encontrar dónde empieza la función mergeGithubCommitsWithCuratedNotes
  const mergeIndex = fileContent.indexOf('export function mergeGithubCommitsWithCuratedNotes');
  if (mergeIndex === -1) {
    throw new Error('No se encontró la función mergeGithubCommitsWithCuratedNotes en patchNotesData.js');
  }

  const footerCode = fileContent.substring(mergeIndex);

  const notesJson = JSON.stringify(humanizedNotes, null, 2);
  const newContent = `${headerLines}${notesJson};\n\n${footerCode}`;

  fs.writeFileSync(patchNotesPath, newContent, 'utf8');
  console.log('✅ Archivo src/data/patchNotesData.js humanizado con éxito!');
}

run().catch((err) => {
  console.error('❌ Error durante la humanización:', err);
  process.exit(1);
});
