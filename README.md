# 🎰 Musiclub - Ecosistema Musical Social, Arcade & Reseñas Multidimensionales

[![Version](https://img.shields.io/badge/version-7.6.0-f5576c.svg)](https://github.com/eugenio-turcott/musiclub-albumes)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg?logo=react)](https://reactjs.org/)
[![React Router](https://img.shields.io/badge/React_Router-7.18-ca4245.svg?logo=reactrouter)](https://reactrouter.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e.svg?logo=supabase)](https://supabase.com/)
[![Spotify API](https://img.shields.io/badge/Spotify-Web%20API-1db954.svg?logo=spotify)](https://developer.spotify.com/)
[![Deezer API](https://img.shields.io/badge/Deezer-REST%20API-ff0092.svg?logo=deezer)](https://developers.deezer.com/)
[![MusicBrainz](https://img.shields.io/badge/MusicBrainz-Open%20Data-ba478f.svg?logo=musicbrainz)](https://musicbrainz.org/)

**Musiclub** ([musiclub.org](https://www.musiclub.org)) es una plataforma web interactiva de apreciación, curaduría y crítica musical. Diseñada como un club social vivo y gamificado, combina una **Slot Machine Cyberpunk** para sorteos semanales del pool comunitario, una **Máquina Gashapon Arcade 3D** para descubrimientos individuales, un sistema pionero de **Calificación y Museo de Portadas de Álbumes**, **reseñas multidimensionales pista por pista**, **generador de Tier Lists automáticas (SF Tiers)** con exportación en alta resolución, perfiles profundos de **artistas y lanzamientos**, **buzón de recomendaciones entre miembros**, y un **motor de siembra e ingesta continua (Smart Catalog Seeder)** respaldado por Spotify, Deezer y MusicBrainz.

---

## 📸 Vista General y Mapa de Navegación

```
 _________________________________________________________________________________________________________
|                                                                                                         |
|  💿 Explorar Catálogo  ·  🗳️ Pool & Temporadas  ·  🎰 Gashapon Arcade  ·  🖼️ Calificar Portadas       |
|  📝 Reseñas Comunitarias  ·  ✨ Para Ti  ·  🏆 Leaderboard  ·  📬 Buzón & Playlists  ·  👤 Perfil       |
|                                                                                                         |
|  [ LANDING PAGE & HERO 3D ]          [ SMART SEEDER CI/CD ]           [ SALÓN DE ARTE & MUSEO ]         |
|  · Carrusel Vinilo Showcase 3D       · GitHub Actions cada 30 min     · Curator Mode (1-10 + Tags)     |
|  · Lanzamiento Recomendado por Hora  · Distribución 65/20/15          · Hall of Fame de Portadas        |
|  · Métricas Globales en Vivo         · Deezer Fallback (Anti-429)     · Modo Pantalla Completa          |
|                                                                                                         |
|  [ SLOT MACHINE CYBERPUNK ]          [ RESEÑAS PISTA POR PISTA ]      [ DETALLE & DISCOGRAFÍA ]         |
|  · 3 Carretes Cinéticos              · 6 Criterios Técnicos           · Enlaces Spotify, Deezer, etc.   |
|  · Ponderación por Antigüedad        · Canción Favorita & Emociones   · Tracklists y Previews de Audio  |
|  · Temporadas y Archivo Histórico    · Likes, Comentarios & Emojis    · Cruce de Catálogo con Artistas  |
|_________________________________________________________________________________________________________|
```

---

## 🎯 Características Principales

### 1. 🏠 Landing Page Interactiva & Showcase 3D
- **Hero Showcase de Vinilo Giratorio**: Carrusel 3D con animación cinética que muestra de forma aleatoria álbumes ya reseñados por la comunidad, revelando sus notas promedio y metadatos.
- **Lanzamiento Recomendado por Hora (`HourlyRecommendedRelease`)**: Algoritmo en tiempo real que selecciona y promueve cada 60 minutos un lanzamiento del catálogo que necesite nuevas opiniones (1 a 3 reseñas).
- **Selector Rápido & Tragamonedas Plegable**: Generador de sugerencias instantáneas para sesiones rápidas o despliegue en un clic de la máquina arcade oficial.
- **Métricas Globales en Tiempo Real**: Contadores de reseñas totales, lanzamientos calificados, usuarios activos y nota máxima histórica.

### 2. 🗳️ Pool Musical Comunitario & Temporadas (`/pool`)
- **Propuesta Abierta de Álbumes**: Cada usuario puede buscar y proponer lanzamientos oficiales directamente mediante la API de Spotify.
- **Slot Machine Cyberpunk de 3 Carretes**: Animación física de desaceleración y efectos de neón para seleccionar el próximo disco de escucha colectiva.
- **Algoritmo de Probabilidad Ponderada por Antigüedad**: Los álbumes con más tiempo de espera en la lista reciben un multiplicador dinámico (+40% de peso) para garantizar justicia y rotación continua.
- **Gestión de Temporadas & Ganadores**: Historial de ganadores anteriores, fechas de coronación y activación/cierre de reseñas para el álbum vigente.

### 3. 🖼️ Calificación y Museo de Portadas de Álbumes (`/portadas`)
- **Curator Mode**: Calificador interactivo con slider continuo (1.0 a 10.0) y categorización con etiquetas estéticas (*📷 Fotografía, 🎨 Ilustración, ◽ Minimalista, 🌀 Psicodélico, 👁️ Surrealista, 🔤 Tipográfico, 📼 Retro, ⚡ Cyberpunk, 🌑 Gótico, ✂️ Collage, 🔶 Abstracto, 🖌️ Pintura*).
- **Insignias Visuales Automáticas**: Desde *"Obra Maestra Suprema"* (10.0) e *"Icónica & Legendaria"* (9.0+) hasta *"Desastre Visual"* (< 3.0).
- **Hall of Fame de Portadas**: Tablero clasificatorio con filtros por etiquetas estéticas y ordenación por puntuación media, volumen de votos o lanzamientos recientes.
- **Modo Museo en Pantalla Completa**: Interfaz de visualización artística inmersiva de alta definición sin distracciones.

### 4. 📝 Sistema Avanzado de Reseñas Multidimensionales
- **Evaluación Canción por Canción (Track-by-Track)**: Calificación individual de cada pista (escala 1 a 10) con nombres y duraciones oficiales.
- **6 Criterios Técnicos de Evaluación** (escala 1 a 5 ⭐):
  - 🎛️ **Producción**: Calidad de mezcla, masterización y diseño sonoro.
  - 🎵 **Composición**: Melodías, armonías, arreglos y estructura musical.
  - 📝 **Letras**: Contenido lírico, narrativa, poesía y mensaje.
  - 💡 **Originalidad**: Innovación, frescura y propuesta artística.
  - 🔗 **Cohesión**: Fluidez y unidad conceptual del álbum.
  - 🔄 **Replay Value**: Deseo de volver a escuchar la obra completa.
- **Selector de Canción Favorita (👑 Top Track)** y **Emociones de Escucha** (*Mindblown*, *Sad*, *Chill*, *Hype*, etc.).
- **Interacciones Sociales en Reseñas (`ReviewInteractions`)**: Sistema de "Me gusta", comentarios/réplicas y selector de reacciones emoji estilo WhatsApp.
- **Exportación en Alta Definición (PNG)**: Renderizado automático vía `html2canvas` para compartir tarjetas de reseña oficiales en Instagram Stories, Twitter o WhatsApp.

### 5. 💿 Fichas Detalladas de Lanzamientos (`/albumes/:slug`, `/eps/:slug`, etc.)
- **Rutas Canónicas por Formato**: Soporte específico para `/albumes/`, `/eps/`, `/sencillos/`, `/compilaciones/` y `/remixes/`.
- **Reproductor & Enlaces Multiplataforma**: Conexión directa a **Spotify**, **Apple Music**, **YouTube** y **Deezer**, con vistas previas de audio de 30 segundos integradas.
- **Desglose Gráfico de Criterios**: Gráficos radiales y de barras con el rendimiento técnico comunitario del lanzamiento.
- **Cálculo Automático de la Canción Más Destacada**: Algoritmo ponderado que identifica la pista insignia según las votaciones de todos los críticos.

### 6. 👤 Discografía y Perfil de Artistas (`/artista/:slug`)
- **Ficha Integral de Artista**: Biografía, géneros, métricas de popularidad y número de seguidores oficiales vía Spotify API.
- **Cruce Dinámico de Catálogo**: Identifica cuáles discos del artista ya forman parte del club y cuáles están pendientes de reseña.
- **Acceso Directo al Pool**: Los miembros pueden postular cualquier álbum o EP de la discografía del artista con un solo clic.

### 7. 🔮 Máquina Gashapon Arcade 3D (`/gashapon`)
- **Dinámica Lúdica para Todos los Releases**: Cúpula tridimensional interactiva con más de 20 cápsulas esféricas de colores físicos, dispensador arcade y modal cinemático de revelación.
- **Mecánica de Dispensador & Efectos de Audio Web**: Giro de manivela, expulsión de cápsula y apertura animada con bandas sonoras sintetizadas en tiempo real vía Web Audio API para cualquier release del catálogo (álbumes, EPs y sencillos).

### 8. 📊 SF Tiers: Creador Automático de Tier Lists (`/perfil`)
- **Categorización Inmediata por Notas**: Agrupa la discografía personal del usuario según su promedio ponderado:
  - 🟥 **S Tier**: *GOD TIER / OBRAS MAESTRAS* (9.5 - 10.0)
  - 🟧 **A Tier**: *EXCELENTES* (8.5 - 9.4)
  - 🟨 **B Tier**: *MUY BUENOS* (7.5 - 8.4)
  - 🟩 **C Tier**: *BUENOS* (6.5 - 7.4)
  - 🟦 **D Tier**: *REGULARES* (5.0 - 6.4)
  - 🟪 **F Tier**: *DECEPCIONANTES* (< 4.9)
- **Descarga PNG con Branding Oficial**: Exportación gráfica de la Tier List con tipografía de diseño, avatar y nombre de usuario.

### 9. 🤖 Recomendaciones Inteligentes "Para Ti" (`/recomendaciones`)
- Algoritmo matemático de afinidad sónica y filtrado colaborativo que analiza las calificaciones del usuario y cruza correlaciones de gusto con otros miembros del club.

### 10. 📬 Buzón Social de Canciones & Playlists Comunitarias
- **Buzón Privado de Temas**: Intercambio directo de canciones con dedicatoria, mensajes personalizados y preview de 30s.
- **Playlists Dinámicas (`/playlists`)**: Generación automática de listas de reproducción con los temas coronados como canciones favoritas y exportación directa a Spotify.

### 11. 🏆 Leaderboard Comunitario e Insignias Automáticas
- **Podio Olímpico**: Reconocimiento a los 3 mejores miembros del club (Oro 🥇, Plata 🥈, Bronce 🥉).
- **Sistema de Logros**: Insignias como *Máster Reviewer*, *Gran Curador*, *Pistas al Detalle*, *Crítico Exigente*, *Crítico Generoso*, *Pluma Crítica* y *Cazador del 10*.

### 12. 🌐 Blindaje Multilingüe & Guardián Antichoque (`translateCrashGuard`)
- Selector de idiomas nativo (`LanguageSelector`) con sincronización en `localStorage`.
- **Protección contra Google Translate**: Sistema de retardo y blindaje con atributos `notranslate` y contenedores seguros para evitar que las extensiones de traducción manipulen o destruyan el árbol DOM de React 19 durante el renderizado.

### 13. 🤖 Ingesta Inteligente & Automatización CI/CD (`SmartCatalogSeeder`)
- **Flujo Automático en GitHub Actions**: Ejecución periódica cada 30 minutos (o manual con selector dinámico de cuota).
- **Distribución de Catálogo Equilibrada**: 65% lanzamientos del año en curso (2026), 20% tendencias populares y 15% joyas de décadas pasadas.
- **Blindaje Anti-Freeze en Rate Limiting (HTTP 429)**: Tope estricto de espera de 5 segundos con **fallback instantáneo a la API de Deezer** para tracklists, duraciones y carátulas HD.
- **Sincronización Canónica de Sitemap XML**: Generación automática de `sitemap.xml` y ping directo a motores de búsqueda (Bing, etc.) bajo el dominio `www.musiclub.org`.

---

## 📐 Fórmulas Matemáticas y Algoritmos

### 1. Cálculo de Calificación Ponderada de una Reseña
Cada reseña individual se calcula sobre una escala de **10.0 puntos**:

$$\text{Puntuación} = (\overline{\text{Canciones}} \times 0.50) + \left(\frac{\sum \text{Criterios}_{1..6}}{6} \times 2 \times 0.30\right) + (\text{Nota General} \times 0.20)$$

- **50% Pistas**: Promedio aritmético de las canciones evaluadas individualmente (1 a 10).
- **30% Criterios Técnicos**: Promedio de los 6 criterios (1 a 5 ⭐) escalado a base 10.
- **20% Calificación General**: Valoración global directa del crítico (1 a 10).

*(En reseñas sin desglose de canciones individuales, los criterios técnicos ponderan el 60% y la nota general el 40%).*

### 2. Bonificación por Participación en Rankings Comunitarios
- **1 a 5 reseñas**: Sin bonificación extra.
- **6 a 10 reseñas**: `+0.25` por cada reseña adicional a partir de la 6ª.
- **Más de 10 reseñas**: `+1.25` base + `+0.10` por cada reseña adicional acumulada.

### 3. Ponderación por Antigüedad en la Slot Machine
Para un conjunto de álbumes del pool con fecha de ingreso $t_i$:

$$\text{Factor Antigüedad} = \frac{t_{\max} - t_i}{t_{\max} - t_{\min} + 1}$$

$$\text{Multiplicador de Probabilidad} = 1.0 + (\text{Factor Antigüedad} \times 0.40)$$

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend Framework** | React 19.2, React Router 7.18 |
| **Estilos & UI** | Tailwind CSS 3.4, Glassmorphism, Cyberpunk Grid, Lucide Icons |
| **Base de Datos & Backend** | Supabase (PostgreSQL 15, Row Level Security, Triggers SQL en tiempo real) |
| **Autenticación** | Supabase Auth (Google OAuth 2.0 y Magic Link seguro) |
| **APIs Musicales** | Spotify Web API, Deezer REST API, MusicBrainz Open Data API |
| **Exportación Gráfica** | `html2canvas` (Generación de tarjetas sociales y Tier Lists en PNG HD) |
| **Audio & Efectos** | Web Audio API nativo (sintetizador de sonido para Gashapon y ruleta) |
| **SEO & Metadatos** | React Helmet Async, Sitemap XML dinámico, OpenGraph, Twitter Cards |
| **CI / CD & Tareas** | GitHub Actions (Ingesta cada 30 min, seeder automatizado y pings SEO) |

---

## 📁 Estructura del Proyecto

```
musiclub-albumes/
├── .github/
│   └── workflows/
│       └── hourly_musicbrainz_ingest.yml # Pipeline de ingesta automática y sitemap
├── public/
│   ├── 5662059.png                       # Logotipo oficial
│   ├── index.html                        # HTML base, fuentes de Google y viewport
│   ├── manifest.json                     # Configuración PWA
│   ├── robots.txt                        # Directivas para rastreadores web
│   └── sitemap.xml                       # Mapa de sitio canónico actualizado
├── scripts/
│   ├── enrichMissingMusicBrainz.mjs      # Enriquecimiento de metadatos faltantes
│   ├── generate-sitemap.js               # Generador de sitemap XML con URLs canónicas
│   ├── hourlyMusicBrainzIngestion.mjs    # Módulo de ingesta por lotes
│   ├── popularMusicData.js               # Colección curada de clásicos y tendencias
│   ├── runHourlyDaemon.mjs               # Demonio local de ingesta periódica
│   ├── seeder_state.json                 # Estado y cursores persistentes de siembra
│   └── smartCatalogSeeder.mjs            # Motor principal de siembra y resiliencia
├── src/
│   ├── components/
│   │   ├── common/                       # Logotipos de plataformas y componentes base
│   │   ├── AdminPanel.jsx                # Panel de administración, moderación y catálogo
│   │   ├── AlbumDetail.jsx               # Ficha profunda de lanzamiento (tracks, streaming, reviews)
│   │   ├── AlbumGrid.jsx                 # Cuadrícula visual de álbumes
│   │   ├── AlbumsCatalog.jsx             # Catálogo de lanzamientos con filtros por décadas/años
│   │   ├── AppHeader.jsx                 # Barra de navegación principal y responsive
│   │   ├── ArtistDetail.jsx              # Ficha de artista, discografía y cruce con el club
│   │   ├── ErrorBoundary.jsx             # Capturador global de errores en React
│   │   ├── FAQ.jsx                       # Acordeón de preguntas frecuentes
│   │   ├── Footer.jsx                    # Pie de página y enlaces institucionales
│   │   ├── GashaponMachine.jsx           # Máquina arcade 3D interactiva
│   │   ├── HeaderAlbumSearch.jsx         # Buscador global con portal React a pantalla completa
│   │   ├── HourlyRecommendedRelease.jsx  # Banner dinámico de recomendación horaria
│   │   ├── LanguageSelector.jsx          # Selector de idioma multilingüe
│   │   ├── Leaderboard.jsx               # Podio olímpico, clasificación comunitaria e insignias
│   │   ├── LoginModal.jsx                # Modal de inicio de sesión con Google
│   │   ├── MemberProfileModal.jsx        # Modal de perfil público de miembros
│   │   ├── NotificationsDropdown.jsx     # Campana de notificaciones de actividad
│   │   ├── PatchNotes.jsx                # Registro de versiones y commits sincronizados
│   │   ├── PlaylistsCatalog.jsx          # Explorador de playlists y exportador
│   │   ├── Rankings.jsx                  # Top álbumes y tarjetas 3D Flip interactivas
│   │   ├── Recommendations.jsx           # Vista del motor "Para Ti"
│   │   ├── ReviewInteractions.jsx        # Likes, comentarios y selector emoji de reseñas
│   │   ├── ReviewSystem.jsx              # Modal completo de redacción y calificación
│   │   ├── Reviews.jsx                   # Feed comunitario de reseñas
│   │   ├── ScrollToTop.jsx               # Restablecimiento de scroll en navegación
│   │   ├── SEO.jsx                       # Inyector de etiquetas meta dinámicas
│   │   ├── ShareReviewModal.jsx          # Exportador de reseñas a tarjeta PNG
│   │   ├── ShareTierListModal.jsx        # Exportador de Tier Lists a PNG
│   │   ├── SlotMachine.jsx               # Ruleta cyberpunk de 3 carretes del pool
│   │   ├── SongMailbox.jsx               # Bandeja social de canciones recibidas
│   │   ├── TierListMaker.jsx             # Sistema SF Tiers de clasificación
│   │   ├── UserProfile.jsx               # Perfil de usuario con historial, notas y buzón
│   │   ├── UserSettings.jsx              # Ajustes de cuenta y preferencias
│   │   ├── WhatsAppEmojiPicker.jsx       # Selector de reacciones emoji
│   │   ├── WinnerDisplay.jsx             # Tarjeta del disco ganador en rotación
│   │   └── WinnerFullscreen.jsx          # Modal de celebración al coronar ganador
│   ├── config/
│   │   └── reviewsConfig.js              # Criterios, pesos y constantes de puntuación
│   ├── data/
│   │   └── patchNotesData.js             # Historial completo de versiones (V1 a V7)
│   ├── hooks/
│   │   ├── useAlbums.js                  # Suscripción y mutación de lanzamientos
│   │   ├── useAuth.js                    # Estado de sesión y roles de usuario
│   │   ├── useCoverRatings.js            # Consulta y emisión de votos de portadas
│   │   ├── useNotifications.js           # Notificaciones en tiempo real
│   │   ├── usePool.js                    # Estado del pool musical y temporadas
│   │   └── useUserReviews.js             # Reseñas del usuario autenticado
│   ├── pages/
│   │   ├── AdminPage.jsx                 # Panel de moderación (/admin)
│   │   ├── AlbumDetailPage.jsx           # Detalle de lanzamiento (/albumes/:slug)
│   │   ├── AlbumsPage.jsx                # Catálogo general (/catalogo, /albumes)
│   │   ├── ArtistDetailPage.jsx          # Perfil de artista (/artista/:slug)
│   │   ├── CoverRatingsPage.jsx          # Calificador y museo de portadas (/portadas)
│   │   ├── FAQPage.jsx                   # Preguntas frecuentes (/faq)
│   │   ├── GashaponPage.jsx              # Máquina Gashapon arcade (/gashapon)
│   │   ├── LandingPage.jsx               # Portada principal (/), Hero 3D y resumen
│   │   ├── LeaderboardPage.jsx           # Salón de la fama (/leaderboard)
│   │   ├── NotFoundPage.jsx              # Página 404 interactiva
│   │   ├── PatchNotesPage.jsx            # Registro de versiones (/patch-notes)
│   │   ├── PlaylistsPage.jsx             # Playlists comunitarias (/playlists)
│   │   ├── PoolPage.jsx                  # Pool musical y temporadas (/pool)
│   │   ├── PrivacyPolicy.jsx             # Política de privacidad (/privacy)
│   │   ├── ProfilePage.jsx               # Perfil de crítico y SF Tiers (/perfil)
│   │   ├── RecommendationsPage.jsx       # Motor "Para Ti" (/recomendaciones)
│   │   ├── ReviewsPage.jsx               # Feed de reseñas (/reviews)
│   │   ├── SettingsPage.jsx              # Ajustes de cuenta (/settings)
│   │   └── TermsOfService.jsx            # Términos de uso (/terms)
│   ├── services/
│   │   ├── api.js                        # Cliente HTTP y utilidades base
│   │   ├── deezerApi.js                  # Integración con la API de Deezer
│   │   ├── musicBrainzService.js         # Integración y normalización MusicBrainz
│   │   ├── poolService.js                # Lógica del pool y rotaciones
│   │   ├── spotifyApi.js                 # Integración oficial con Spotify Web API
│   │   └── supabaseClient.js             # Cliente Supabase, consultas y realtime
│   ├── utils/
│   │   ├── albumDeduplication.js         # Detección y prevención de duplicados
│   │   ├── badgeSystem.js                # Motor de insignias y cálculo de logros
│   │   ├── emojiData.js                  # Diccionario de emojis y categorías
│   │   ├── gashaponAudio.js              # Efectos de audio con Web Audio API
│   │   ├── playlistUtils.js              # Utilidades de generación de listas
│   │   ├── ratingUtils.js                # Fórmulas de cálculo de notas y URLs
│   │   ├── recommendationEngine.js       # Algoritmo de afinidad musical
│   │   └── translateCrashGuard.js        # Blindaje contra caídas por Google Translate
│   ├── App.js                            # Enrutador principal y configuración de idiomas
│   └── index.js                          # Punto de entrada de la aplicación React
├── package.json
└── README.md
```

---

## 🧭 Rutas y Navegación

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `LandingPage` | Portada principal: Hero Vinilo 3D, recomendación horaria, dinámica y showcase |
| `/pool` (o `/pool-musical`, `/temporadas`) | `PoolPage` | Pool Comunitario, Slot Machine Cyberpunk, archivo de temporadas y ganadores |
| `/catalogo` (o `/albumes`, `/albums`) | `AlbumsPage` | Catálogo completo con buscador, filtros por décadas (50s a 2020s) y años |
| `/albumes/:slug` (y `/eps/:slug`, `/sencillos/:slug`) | `AlbumDetailPage` | Ficha técnica de lanzamiento, tracklist, reproductor, criterios y reseñas |
| `/artista/:slug` (o `/artistas/:slug`) | `ArtistDetailPage` | Ficha oficial de artista, géneros, discografía y cruce con el catálogo del club |
| `/portadas` (o `/calificar-portadas`, `/cover-ratings`) | `CoverRatingsPage` | Curator Mode de portadas, Hall of Fame visual y Museo en Pantalla Completa |
| `/gashapon` (o `/gacha`) | `GashaponPage` | Máquina Gashapon Arcade 3D con audio sintetizado para todos los releases del catálogo |
| `/reviews` | `ReviewsPage` | Muro comunitario con feed cronológico de reseñas e interacciones |
| `/recomendaciones` (o `/para-ti`) | `RecommendationsPage` | Motor de recomendaciones personalizadas según afinidad crítica |
| `/leaderboard` (o `/ranking`) | `LeaderboardPage` | Podio olímpico, Salón de la Fama y sistema de insignias de usuarios |
| `/playlists` (o `/listas`) | `PlaylistsPage` | Explorador y generador de playlists colaborativas del club |
| `/perfil` (o `/profile`) | `ProfilePage` | Perfil del crítico, generador de Tier Lists SF con exportación PNG y buzón |
| `/settings` (o `/configuracion`) | `SettingsPage` | Ajustes de cuenta, foto de avatar y biografía |
| `/patch-notes` (o `/changelog`) | `PatchNotesPage` | Registro histórico de versiones y sincronización en vivo con GitHub |
| `/faq` (o `/ayuda`) | `FAQPage` | Preguntas frecuentes, guía del club y manual de criterios |
| `/admin` | `AdminPage` | Panel de moderación y administración de catálogo y usuarios |
| `/privacy` | `PrivacyPolicy` | Política de privacidad oficial |
| `/terms` | `TermsOfService` | Términos y condiciones del servicio |
| `*` | `NotFoundPage` | Pantalla de error 404 interactiva con buscador rápido |

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js** (versión 18 o superior, recomendado v20/v22)
- **npm** o **yarn**
- Proyecto en [Supabase](https://supabase.com/) con esquema PostgreSQL y Auth configurado
- Credenciales en [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/eugenio-turcott/musiclub-albumes.git
cd musiclub-albumes
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración de Supabase
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-anon-key-de-supabase

# Configuración de Spotify Web API
REACT_APP_SPOTIFY_CLIENT_ID=tu-spotify-client-id
REACT_APP_SPOTIFY_CLIENT_SECRET=tu-spotify-client-secret
```

### 4. Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo local en `http://localhost:3000` |
| `npm run build` | Ejecuta la generación del sitemap canónico y compila para producción en `/build` |
| `npm run sitemap` | Regenera manualmente `public/sitemap.xml` a partir de todos los lanzamientos |
| `npm run seed` | Ejecuta el Smart Catalog Seeder para enriquecer el catálogo con lanzamientos populares |
| `npm run ingest:mb` | Ingesta por lotes desde MusicBrainz con fallback a Deezer y Spotify |
| `npm test` | Ejecuta la suite de pruebas unitarias con Jest |

---

## 🔒 Seguridad y Privacidad

- **Row Level Security (RLS)** activado en todas las tablas de Supabase (álbumes, reseñas, votos de portadas, perfiles e interacciones).
- Políticas de lectura pública para exploración y restricciones de escritura/edición exclusivas para usuarios autenticados sobre sus propios registros.
- Sanitización de entradas y blindaje en tiempo real contra extensiones automáticas del navegador.

---

## 📄 Licencia

Este proyecto es de uso comunitario y privado para el club musical **Musiclub** ([musiclub.org](https://www.musiclub.org)).

Desarrollado con ❤️ y pasión por la música. 🎧✨
