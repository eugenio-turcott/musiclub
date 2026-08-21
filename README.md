# 🎰 Musiclub - Slot Machine, Gashapon Arcade & Comunidad de Álbumes Musicales

[![Version](https://img.shields.io/badge/version-5.1.0-f5576c.svg)](https://github.com/eugenio-turcott/musiclub-albumes)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e.svg?logo=supabase)](https://supabase.com/)
[![Spotify API](https://img.shields.io/badge/Spotify-Web%20API-1db954.svg?logo=spotify)](https://developer.spotify.com/)

**Musiclub** es una plataforma web interactiva diseñada para clubes y comunidades de escucha musical. Combina una **Slot Machine estilo Cyberpunk** para la selección ponderada de álbumes semanales, una **Máquina Gashapon Arcade 3D** para álbumes individuales, un **Buzón Social de Recomendaciones de Canciones** entre miembros, un completo **sistema de reseñas técnicas multidimensionales**, un **motor de recomendaciones "Para Ti"**, **playlists dinámicas**, **catálogo en vivo integrado con Spotify**, **Leaderboard con insignias automáticas**, y una **página de Patch Notes sincronizada con GitHub**.

---

## 📸 Vista General y Ecosistema de Navegación

```
 ____________________________________________________________________________________
|                                                                                    |
|  🔍 Buscar Álbum  ·  🏆 Leaderboard  ·  💿 Álbumes  ·  📝 Reviews  ·  👤 Perfil   |
|                                                                                    |
|                  🎰 M Á Q U I N A   M U S I C A L (POOL) 🎰                       |
|                       [ CARRETE 1 | CARRETE 2 | CARRETE 3 ]                        |
|                               [ ¡GIRAR! ]                                          |
|                                                                                    |
|                  🔮 G A S H A P O N   A R C A D E  3 D 🔮                         |
|                       [ CÚPULA CON CÁPSULAS MULTICOLOR ]                           |
|                                                                                    |
|  ✨ Para Ti  |  🎵 Playlists  |  ⭐ Top Rankings 3D  |  📬 Buzón de Canciones      |
|____________________________________________________________________________________|
```

---

## 🎯 Características Principales

### 1. 🎰 Slot Machine Cyberpunk (Ruleta del Pool Comunitario)
- **3 Carretes independientes** con animación fluida, desaceleración cinética y carrusel continuo.
- **Algoritmo de Probabilidad Ponderada por Antigüedad**: Los álbumes que llevan más tiempo esperando en la lista tienen una probabilidad incrementada (~40% más de peso) de ser seleccionados, asegurando rotación justa de recomendaciones.
- **Efectos Neón y Celebración**: Animaciones con luces cyberpunk y lluvia de confetti dinámico al coronar un álbum ganador.
- **Persistencia en Tiempo Real**: El estado del ganador actual se almacena y sincroniza mediante Supabase.

### 2. 🔮 Máquina Gashapon Arcade 3D (`/gashapon`)
- **Página y dinámica independiente** diseñada para la selección aleatoria de **Álbumes Individuales**.
- **Cúpula de cristal 3D** con más de 18 cápsulas esféricas multicolor y física interactiva.
- **Manivela interactiva y dispensador**: Al girar la manivela, se expulsa una cápsula con el color exacto seleccionado al azar, revelando el álbum premiado con animación de apertura.

### 3. 📬 Buzón Social de Recomendaciones de Canciones
- **Intercambio privado de canciones** entre perfiles de usuario en tiempo real.
- **Buscador de pistas de Spotify** con reproductor de audio de 30s de vista previa.
- **Dedicatorias personalizadas**: Envío de mensajes y motivos de recomendación.
- **Contadores y notificaciones en vivo**: Badge con insignias no leídas y gestión de estado (escuchada / pendiente).

### 4. 🔍 Buscador Global en Header con Calificación Directa
- **Barra de búsqueda en vivo** en la navegación de escritorio y menú móvil.
- **Búsqueda instantánea en el catálogo del club**: Muestra resultados en tiempo real sin abrir modales previos.
- **Calificación Directa**: Permite calificar de inmediato álbumes individuales e inactivos mediante un modal a pantalla completa renderizado vía React Portal.

### 5. 📝 Sistema Avanzado de Reseñas Multidimensionales
- **Evaluación Canción por Canción (Track-by-Track)**: Calificación individual de cada pista (escala del 1 al 10) obtenida directamente desde Spotify.
- **6 Criterios Técnicos de Evaluación** (escala del 1 al 5 ⭐):
  - 🎛️ **Producción**: Calidad de mezcla, masterización y diseño sonoro.
  - 🎵 **Composición**: Melodías, armonías, arreglos y estructura musical.
  - 📝 **Letras**: Contenido lírico, narrativa, poesía y mensaje.
  - 💡 **Originalidad**: Innovación, frescura y propuesta artística.
  - 🔗 **Cohesión**: Fluidez y unidad conceptual del álbum.
  - 🔄 **Replay Value**: Deseo de volver a escuchar el disco completo.
- **Calificación General Independiente** (escala del 1 al 10 ⭐).
- **Selector de Emociones**: Reacciones de sentimiento (*Mindblown*, *Sad*, *Chill*, *Hype*, etc.).

### 6. 🤖 Recomendaciones Inteligentes "Para Ti" (`/recomendaciones`)
- Algoritmo que analiza los patrones de puntuación y afinidades del usuario para sugerir álbumes del catálogo que coincidan con sus gustos.

### 7. 🎵 Playlists Comunitarias Dinámicas (`/playlists`)
- Generación automática de listas de reproducción temáticas con las mejores canciones votadas por la comunidad y exportación a Spotify.

### 8. 📜 Patch Notes y Sincronización en Vivo con GitHub (`/patch-notes`)
- Historial completo y detallado de **todas las versiones y commits** del proyecto.
- **Sincronización en vivo** con la API de GitHub (`eugenio-turcott/musiclub-albumes`).
- **Paginación inteligente** (6 versiones por página), buscador de cambios por palabra clave y filtros por versión (`V5.x`, `V4.x`, `V3.x`, `V2.x`, `V1.x`, `V0.x`).

### 9. 🏆 Leaderboard Comunitario y Sistema de Insignias (Badges)
- **Podio Olímpico**: Reconocimiento a los 3 mejores miembros del club (Oro 🥇, Plata 🥈, Bronce 🥉).
- **Insignias y Logros Automáticos**: *Máster Reviewer*, *Gran Curador*, *Pistas al Detalle*, *Crítico Exigente*, *Crítico Generoso*, *Pluma Crítica* y *Cazador del 10*.

### 10. ⭐ Rankings con Tarjetas 3D Flip
- Podio dorado, plateado y de bronce para el Top 3.
- Carrusel de tarjetas 3D interactivas para los puestos 4 al 10 que muestran la carátula de inmediato y voltean para revelar la ficha técnica al hacer clic.

### 11. ⬆️ Restablecimiento Global de Scroll (`ScrollToTop`)
- Navegación optimizada que regresa instantáneamente al inicio de la página al cambiar de ruta.

---

## 📐 Fórmulas Matemáticas y Algoritmos

### 1. Cálculo de Calificación de una Reseña
Cada reseña individual combina las evaluaciones en una escala sobre **10.0**:

$$\text{Puntuación} = (\overline{\text{Canciones}} \times 0.50) + \left(\frac{\sum \text{Criterios}_{1..6}}{6} \times 2 \times 0.30\right) + (\text{Nota General} \times 0.20)$$

- **50% Pistas**: Promedio de las canciones calificadas (1 a 10).
- **30% Criterios Técnicos**: Promedio de los 6 criterios (1 a 5) convertido a escala de 10.
- **20% Calificación General**: Valoración global del crítico (1 a 10).

*(En caso de no calificar pistas individuales, los criterios representan el 60% y la nota general el 40%).*

### 2. Bonificación por Participación en Rankings
- **1 a 5 reseñas**: Sin bonus extra.
- **6 a 10 reseñas**: `+0.25` por cada reseña adicional después de la 5ª.
- **Más de 10 reseñas**: `+1.25` base + `+0.10` por cada reseña adicional.

### 3. Probabilidad Ponderada de la Slot Machine
Para un conjunto de álbumes activos con fecha de creación $t_i$:

$$\text{Factor Antigüedad} = \frac{t_{\max} - t_i}{t_{\max} - t_{\min}}$$

$$\text{Peso}_i = 1.0 + (\text{Factor Antigüedad} \times 0.40)$$

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 19, React Router 7, Tailwind CSS, Lucide Icons |
| **SEO & Metadatos** | React Helmet Async, OpenGraph |
| **Backend & Base de Datos** | Supabase (PostgreSQL, Row Level Security, Auth OAuth Google / Email) |
| **APIs Externas** | Spotify Web API, GitHub REST API v3 |
| **Fuentes & Estilos** | Google Fonts (*Bowlby One SC*, *Honk*, *Stack Sans Notch*), Glassmorphism, Cyber-grid |

---

## 📁 Estructura del Proyecto

```
musiclub-albumes/
├── public/
│   ├── 5662059.png                     # Logotipo de la aplicación
│   ├── index.html                      # HTML principal y fuentes
│   ├── manifest.json                   # Manifiesto PWA
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── AdminPanel.jsx              # Panel de administración de álbumes y reseñas
│   │   ├── AlbumGrid.jsx               # Grilla principal de álbumes en la home
│   │   ├── AlbumSearch.jsx             # Buscador de álbumes vía Spotify API
│   │   ├── AlbumsCatalog.jsx           # Catálogo completo con filtros, métricas y modal
│   │   ├── AppHeader.jsx               # Barra de navegación principal y responsive
│   │   ├── FAQ.jsx                     # Componente interactivo de preguntas frecuentes
│   │   ├── Footer.jsx                  # Pie de página y enlaces legales / patch notes
│   │   ├── GashaponMachine.jsx         # Máquina Gashapon Arcade 3D interactiva
│   │   ├── HeaderAlbumSearch.jsx       # Buscador global en vivo del Header con React Portal
│   │   ├── Leaderboard.jsx             # Tabla clasificatoria, podio e insignias
│   │   ├── LoadingOverlay.jsx          # Pantalla de carga con efectos neón
│   │   ├── LoginModal.jsx              # Modal de autenticación (Google / Magic Link)
│   │   ├── PatchNotes.jsx              # Timeline paginado de versiones y GitHub sync
│   │   ├── PrivacyPolicy.jsx           # Contenido de Política de Privacidad
│   │   ├── Rankings.jsx                # Top álbumes y tarjetas 3D Flip (4-10)
│   │   ├── ReviewSystem.jsx            # Asistente de reseñas, criterios y tracks
│   │   ├── Reviews.jsx                 # Vista de feed de todas las reseñas
│   │   ├── ScrollToTop.jsx             # Restablecimiento global de scroll al cambiar de ruta
│   │   ├── SendSongRecommendationModal.jsx # Modal para enviar recomendaciones de canciones
│   │   ├── SEO.jsx                     # Gestión de etiquetas meta y OpenGraph
│   │   ├── SlotMachine.jsx             # Ruleta de 3 carretes de álbumes del pool
│   │   ├── SongInbox.jsx               # Buzón de canciones recibidas en el perfil
│   │   ├── TermsOfService.jsx          # Contenido de Términos de Servicio
│   │   ├── UserProfile.jsx             # Perfil público/privado con métricas y buzón
│   │   ├── UserSettings.jsx            # Formulario de configuración de perfil
│   │   ├── WinnerDisplay.jsx           # Tarjeta del álbum ganador actual
│   │   └── WinnerFullscreen.jsx        # Modal fullscreen al ganar
│   ├── data/
│   │   └── patchNotesData.js           # Registro de 31 versiones y parser de GitHub
│   ├── hooks/
│   │   ├── useAlbums.js                # Hook de consulta y mutaciones de álbumes
│   │   ├── useAuth.js                  # Hook de estado de autenticación y roles
│   │   └── useUserReviews.js           # Hook de reseñas del usuario activo
│   ├── pages/
│   │   ├── AdminPage.jsx               # Ruta /admin
│   │   ├── AlbumsPage.jsx              # Ruta /albumes
│   │   ├── FAQPage.jsx                 # Ruta /faq
│   │   ├── GashaponPage.jsx            # Ruta /gashapon
│   │   ├── LeaderboardPage.jsx         # Ruta /leaderboard
│   │   ├── PatchNotesPage.jsx          # Ruta /patch-notes
│   │   ├── PlaylistsPage.jsx           # Ruta /playlists
│   │   ├── PrivacyPolicy.jsx           # Ruta /privacy
│   │   ├── ProfilePage.jsx             # Ruta /profile
│   │   ├── RecommendationsPage.jsx     # Ruta /recomendaciones ("Para Ti")
│   │   ├── ReviewsPage.jsx             # Ruta /reviews
│   │   ├── SettingsPage.jsx            # Ruta /settings
│   │   └── TermsOfService.jsx          # Ruta /terms
│   ├── services/
│   │   ├── api.js                      # Cliente base API
│   │   ├── spotifyApi.js               # Integración con Spotify Web API
│   │   └── supabaseClient.js           # Consultas CRUD y Auth de Supabase
│   ├── styles/
│   │   └── global.css                  # Estilos cyberpunk, animaciones y flip cards 3D
│   ├── utils/
│   │   ├── albumDeduplication.js       # Prevención de duplicados de catálogo
│   │   ├── badgeSystem.js              # Lógica y asignación de insignias
│   │   ├── playlistUtils.js            # Utilidades de listas de reproducción
│   │   ├── ratingUtils.js              # Fórmulas de cálculo ponderado y bonus
│   │   └── recommendationEngine.js     # Motor de afinidad y recomendaciones
│   ├── App.js                          # Router, ScrollToTop y estructura general
│   ├── index.css                       # Configuración Tailwind y directivas base
│   └── index.js                        # Punto de entrada de React
├── tailwind.config.js                  # Configuración de temas y colores Tailwind
├── package.json
└── README.md
```

---

## 🧭 Rutas y Navegación

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `AppContent` | Inicio: Slot Machine, Ganador Actual, Top Rankings 3D y Grilla |
| `/gashapon` (o `/gacha`) | `GashaponPage` | Máquina Gashapon Arcade 3D para álbumes individuales |
| `/recomendaciones` (o `/para-ti`) | `RecommendationsPage` | Recomendaciones inteligentes personalizadas |
| `/playlists` (o `/listas`) | `PlaylistsPage` | Explorador y generador de playlists del club |
| `/leaderboard` (o `/ranking`) | `LeaderboardPage` | Podio comunitario, tabla clasificatoria e insignias |
| `/albumes` (o `/albums`) | `AlbumsPage` | Catálogo completo con filtros avanzados y métricas |
| `/reviews` | `ReviewsPage` | Muro y feed en vivo de todas las reseñas |
| `/profile` (o `/perfil`) | `ProfilePage` | Perfil del usuario, estadísticas, buzón de canciones y reviews |
| `/settings` (o `/configuracion`) | `SettingsPage` | Ajustes de perfil, biografía y preferencias musicales |
| `/patch-notes` (o `/changelog`) | `PatchNotesPage` | Historial de versiones y sincronización con GitHub |
| `/faq` (o `/ayuda`) | `FAQPage` | Preguntas frecuentes y guía del club |
| `/admin` | `AdminPage` | Panel de moderación y administración |
| `/privacy` | `PrivacyPolicy` | Política de privacidad |
| `/terms` | `TermsOfService` | Términos de servicio |

---

## 🚀 Instalación y Configuración Local

### Prerrequisitos
- **Node.js** (v18 o superior)
- **npm** o **yarn**
- Una cuenta y proyecto en [Supabase](https://supabase.com/)
- Una aplicación registrada en [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

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
Crea un archivo `.env` en la raíz del proyecto con las siguientes claves:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-anon-key-de-supabase

# Spotify Web API Configuration
REACT_APP_SPOTIFY_CLIENT_ID=tu-spotify-client-id
REACT_APP_SPOTIFY_CLIENT_SECRET=tu-spotify-client-secret
```

### 4. Ejecutar en Desarrollo
```bash
npm start
```
La aplicación se abrirá en `http://localhost:3000`.

### 5. Compilar para Producción
```bash
npm run build
```
Genera la carpeta optimizada `build/` lista para desplegar en plataformas como Vercel, Netlify o GitHub Pages.

---

## 📄 Licencia

Este proyecto es privado y de uso comunitario para el club de música **Musiclub**.

Desarrollado con ❤️ y pasión por la música. 🎧✨
