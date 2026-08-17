# 🎰 Musiclub - Slot Machine & Comunidad de Álbumes Musicales

[![Version](https://img.shields.io/badge/version-4.2.0-f5576c.svg)](https://github.com/eugenio-turcott/musiclub-albumes)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e.svg?logo=supabase)](https://supabase.com/)
[![Spotify API](https://img.shields.io/badge/Spotify-Web%20API-1db954.svg?logo=spotify)](https://developer.spotify.com/)

**Musiclub** es una plataforma web interactiva diseñada para clubes y comunidades de escucha musical. Combina una **Slot Machine (Ruleta) estilo Cyberpunk** para la selección aleatoria ponderada de álbumes semanales, con un completo **sistema de reseñas técnicas y canción por canción**, **catálogo interactivo integrado con Spotify**, **Leaderboard con insignias automáticas**, **perfiles de usuario personalizables** y **panel de administración**.

---

## 📸 Vista General y Funcionalidades

```
 ____________________________________________________________________
|                                                                    |
|   🏆 Leaderboard  ·  💿 Álbumes  ·  📝 Reviews  ·  👤 Perfil  · ⚙️  |
|                                                                    |
|               🎰 M Á Q U I N A   M U S I C A L 🎰                 |
|                   [ CARRETE 1 | CARRETE 2 | CARRETE 3 ]           |
|                           [ ¡GIRAR! ]                              |
|                                                                    |
|  🌟 Ganador Actual   |  🏆 Top Rankings   |  💿 Catálogo Completo  |
|____________________________________________________________________|
```

---

## 🎯 Características Principales

### 1. 🎰 Slot Machine Cyberpunk (Ruleta de Selección)
- **3 Carretes independientes** con animación fluida, giro secuencial y carrusel continuo.
- **Algoritmo de Probabilidad Ponderada por Antigüedad**: Los álbumes que llevan más tiempo esperando en la lista tienen una probabilidad incrementada (~40% más de peso) de ser seleccionados, asegurando rotación justa de recomendaciones.
- **Efectos Neón y Celebración**: Animaciones con luces cyberpunk y lluvia de confetti dinámico al coronar un álbum ganador.
- **Persistencia en Tiempo Real**: El estado del ganador actual se almacena y sincroniza mediante Supabase.
- **Marcado automático o manual**: Capacidad de cambiar el estado a inactivo o mantener en rotación.

### 2. 📝 Sistema Avanzado de Reseñas y Calificación Ponderada
- **Evaluación Canción por Canción (Track-by-Track)**: Calificación individual de cada pista (escala del 1 al 10) obtenida directamente desde Spotify.
- **6 Criterios Técnicos de Evaluación** (escala del 1 al 5 ⭐):
  - 🎛️ **Producción**: Calidad de mezcla, masterización y diseño sonoro.
  - 🎵 **Composición**: Melodías, armonías, arreglos y estructura musical.
  - 📝 **Letras**: Contenido lírico, narrativa, poesía y mensaje.
  - 💡 **Originalidad**: Innovación, frescura y propuesta artística.
  - 🔗 **Cohesión**: Fluidez y unidad conceptual del álbum.
  - 🔄 **Replay Value**: Deseo de volver a escuchar el disco completo.
- **Calificación General Independiente** (escala del 1 al 10 ⭐).
- **Asistente Interactivo (Wizard)**: Flujo guiado paso a paso para calificar canciones, criterios y redactar comentarios.
- **Comentarios y Debate**: Espacio para escribir reseñas en texto y compartir análisis críticos.

### 3. 🏆 Leaderboard Comunitario y Sistema de Insignias (Badges)
- **Podio Olímpico**: Reconocimiento a los 3 mejores miembros del club (Oro 🥇, Plata 🥈, Bronce 🥉).
- **Tabla Clasificatoria Detallada**: Estadísticas por usuario (total de reseñas, canciones calificadas, promedio general otorgado y álbumes propuestos).
- **Modal de Perfil de Miembro**: Inspección rápida de las estadísticas y reseñas de cualquier usuario del leaderboard.
- **Insignias y Logros Automáticos**:
  - 👑 **Máster Reviewer**: Líder con el mayor número de reseñas publicadas.
  - 🌟 **Gran Curador**: Miembro que más álbumes ha aportado al club.
  - ⚡ **Pistas al Detalle**: Ha calificado minuciosamente 25 o más canciones.
  - 🎯 **Crítico Exigente**: Rigor analítico con promedio global ≤ 7.2 ⭐.
  - 💖 **Crítico Generoso**: Gran aprecio musical con promedio global ≥ 8.6 ⭐.
  - ✍️ **Pluma Crítica**: Ha escrito reseñas con comentarios y debate.
  - 💯 **Cazador del 10**: Ha otorgado al menos una calificación perfecta (10 ⭐).
- **Guía de Insignias Integrada**: Modal con la explicación de cada reconocimiento y sus requisitos.

### 4. 💿 Catálogo y Explorador de Álbumes (`/albumes`)
- **Búsqueda en Tiempo Real**: Filtrado instantáneo por título del álbum, artista o miembro que lo recomendó.
- **Filtros por Estado**:
  - `Todos` · `Activos` (en la ruleta) · `Individuales` (escuchas libres) · `Ganadores` · `Inactivos`.
- **Ordenamiento Inteligente**: Por mayor/menor calificación, cantidad de reviews, fecha de adición o alfabético.
- **Ficha Técnica y Desglose**: Carátula en alta resolución, tracklist completo con promedios por canción, desglose de los 6 criterios y lista de reseñas individuales.
- **Métricas Globales del Club**: Total de discos, reseñas acumuladas, álbum mejor puntuado y promedio histórico de la comunidad.

### 5. 🔍 Búsqueda e Integración con Spotify API
- **Buscador en Vivo**: Autocompletado directo con el catálogo oficial de Spotify.
- **Importación Instantánea**: Carga automática de metadatos (portada HD, artista, fecha de lanzamiento, enlace oficial y tracklist completo).
- **Modos de Adición**: Permite proponer álbumes para la ruleta comunitaria o para escucha individual.

### 6. 👤 Perfiles de Usuario y Personalización (`/profile` y `/settings`)
- **Perfil Personalizable**: Avatar, biografía, artista favorito, álbum favorito, etiquetas de géneros preferidos y enlaces a Spotify e Instagram.
- **Panel de Estadísticas del Crítico**:
  - Promedio de calificación histórico otorgado.
  - Total de pistas evaluadas y reseñas realizadas.
  - Promedios desglosados en los 6 criterios.
  - Álbum mejor y peor valorado por el usuario.
  - Porcentaje de completitud del catálogo del club.
- **Gestión de Reseñas Propias**: Historial interactivo con búsqueda y filtros para revisar o editar calificaciones previas.

### 7. 🔧 Panel de Administración (`/admin`)
- Control y moderación de álbumes (cambio de estado, edición, eliminación).
- Gestión y moderación de reseñas.
- Ajustes y sincronización de estado de la máquina.

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
Para premiar a los álbumes con mayor cantidad de críticas comunitarias:
- **1 a 5 reseñas**: Sin bonus extra.
- **6 a 10 reseñas**: `+0.25` por cada reseña adicional después de la 5ª.
- **Más de 10 reseñas**: `+1.25` base + `+0.10` por cada reseña adicional.

### 3. Probabilidad Ponderada de la Slot Machine
Para un conjunto de álbumes activos con fecha de creación $t_i$:

$$\text{Factor Antigüedad} = \frac{t_{\max} - t_i}{t_{\max} - t_{\min}}$$

$$\text{Peso}_i = 1.0 + (\text{Factor Antigüedad} \times 0.40)$$

El álbum más antiguo en el catálogo recibe un multiplicador de peso de **1.4**, aumentando su probabilidad de selección sin anular el azar del resto.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 19, React Router 7, Tailwind CSS |
| **SEO & Metadatos** | React Helmet Async, OpenGraph |
| **Backend & Base de Datos** | Supabase (PostgreSQL, Row Level Security, Auth OAuth Google / Email) |
| **APIs Externas** | Spotify Web API (Client Credentials Flow) |
| **Fuentes & Estilos** | Google Fonts (*Bowlby One SC*, *Honk*, *Stack Sans Notch*), Glassmorphism, Cyber-grid |

---

## 📁 Estructura del Proyecto

```
musiclub-albumes/
├── public/
│   ├── 5662059.png               # Logotipo de la aplicación
│   ├── index.html                # HTML principal y fuentes
│   ├── manifest.json             # Manifiesto PWA
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── AdminPanel.jsx        # Panel de administración de álbumes y reseñas
│   │   ├── AlbumGrid.jsx         # Grilla principal de álbumes en la home
│   │   ├── AlbumSearch.jsx       # Buscador de álbumes vía Spotify API
│   │   ├── AlbumsCatalog.jsx     # Catálogo completo con filtros, métricas y modal
│   │   ├── AppHeader.jsx         # Barra de navegación principal y responsive
│   │   ├── Footer.jsx            # Pie de página y enlaces legales
│   │   ├── Leaderboard.jsx       # Tabla clasificatoria, podio e insignias
│   │   ├── LoadingOverlay.jsx    # Pantalla de carga con efectos neón
│   │   ├── LoginModal.jsx        # Modal de autenticación (Google / Magic Link)
│   │   ├── PrivacyPolicy.jsx     # Contenido de Política de Privacidad
│   │   ├── Rankings.jsx          # Sección de mejores álbumes puntuados
│   │   ├── ReviewSystem.jsx      # Asistente de reseñas, criterios y tracks
│   │   ├── Reviews.jsx           # Vista de lista de todas las reseñas
│   │   ├── SEO.jsx               # Gestión de etiquetas meta y OpenGraph
│   │   ├── SlotMachine.jsx       # Componente de la ruleta de 3 carretes
│   │   ├── TermsOfService.jsx    # Contenido de Términos de Servicio
│   │   ├── UserProfile.jsx       # Perfil público/privado con métricas y tabs
│   │   ├── UserSettings.jsx      # Formulario de configuración de perfil
│   │   ├── WinnerDisplay.jsx     # Tarjeta del álbum ganador actual
│   │   └── WinnerFullscreen.jsx  # Modal fullscreen al ganar
│   ├── config/
│   │   └── reviewsConfig.js      # Configuración auxiliar y compatibilidad
│   ├── hooks/
│   │   ├── useAlbums.js          # Hook de consulta y gestión de álbumes
│   │   ├── useAuth.js            # Hook de estado de autenticación y roles
│   │   └── useUserReviews.js     # Hook de reseñas del usuario activo
│   ├── pages/
│   │   ├── AdminPage.jsx         # Ruta /admin
│   │   ├── AlbumsPage.jsx        # Ruta /albumes
│   │   ├── LeaderboardPage.jsx   # Ruta /leaderboard
│   │   ├── PrivacyPolicy.jsx     # Ruta /privacy
│   │   ├── ProfilePage.jsx       # Ruta /profile
│   │   ├── ReviewsPage.jsx       # Ruta /reviews
│   │   ├── SettingsPage.jsx      # Ruta /settings
│   │   └── TermsOfService.jsx    # Ruta /terms
│   ├── scripts/
│   │   ├── migrateAlbums.js      # Script de migración de álbumes a Supabase
│   │   ├── migrateAll.js         # Script de migración global
│   │   └── migrateReviews.js     # Script de migración de reseñas a Supabase
│   ├── services/
│   │   ├── api.js                # Cliente base API
│   │   ├── googleSheetsApi.js    # Servicio legacy Google Sheets
│   │   ├── spotifyApi.js         # Integración y autenticación con Spotify API
│   │   └── supabaseClient.js     # Cliente y métodos CRUD de Supabase
│   ├── utils/
│   │   └── ratingUtils.js        # Utilidades de cálculo ponderado y bonus
│   ├── App.css                   # Estilos y animaciones personalizadas
│   ├── App.js                    # Router y layout principal
│   ├── index.css                 # Configuración Tailwind y directivas base
│   └── index.js                  # Punto de entrada de React
├── update_track_ratings.sql      # Scripts SQL de actualización de tracks
├── tailwind.config.js            # Configuración de temas y colores Tailwind
├── package.json
└── README.md
```

---

## 🧭 Rutas y Navegación

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `AppContent` | Página principal: Ruleta, Ganador, Rankings y Grilla de Álbumes |
| `/leaderboard` (o `/ranking`) | `LeaderboardPage` | Podio comunitario, ranking de miembros, insignias y perfiles |
| `/albumes` (o `/albums`) | `AlbumsPage` | Catálogo completo de álbumes con filtros avanzados y métricas |
| `/reviews` | `ReviewsPage` | Vista global de reseñas y opiniones publicadas |
| `/profile` (o `/perfil`) | `ProfilePage` | Perfil del usuario, estadísticas personales e historial de reseñas |
| `/settings` (o `/configuracion`) | `SettingsPage` | Ajustes de perfil, biografía, redes y preferencias musicales |
| `/admin` | `AdminPage` | Panel de control para administradores |
| `/privacy` | `PrivacyPolicy` | Política de privacidad |
| `/terms` | `TermsOfService` | Términos de servicio |

---

## 🚀 Instalación y Configuración Local

### Prerrequisitos
- **Node.js** (v18 o superior)
- **npm** o **yarn**
- Una cuenta y proyecto en [Supabase](https://supabase.com/)
- Una aplicación registrada en el [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

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

# Google Sheets API (Opcional / Legacy)
REACT_APP_GS_API_URL=https://script.google.com/macros/s/...
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

## 👥 Roles y Permisos

- **Visitante / No autenticado**: Puede explorar la máquina musical, ver el ganador, consultar el catálogo de álbumes, ver rankings, leer reseñas y consultar el leaderboard.
- **Usuario Registrado**: Puede proponer álbumes desde Spotify, calificar canciones y álbumes con el sistema de reseñas, personalizar su perfil de usuario, ganar insignias y competir en el leaderboard.
- **Administrador**: Acceso exclusivo a `/admin` para gestionar el estado de los álbumes (Activar, Desactivar, Individual), editar/eliminar entradas y moderar reseñas.

---

## 📄 Licencia

Este proyecto es privado y de uso comunitario para el club de música **Musiclub**.

Desarrollado con ❤️ y pasión por la música. 🎧✨
