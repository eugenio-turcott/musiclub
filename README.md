# Musiclub

[Musiclub](https://www.musiclub.org) es un club musical en español para descubrir lanzamientos, publicar reseñas, calificar portadas y escuchar en comunidad.

**Versión:** 10.1.1 · **Última actualización:** 28 de octubre de 2026.

## Qué incluye

- Catálogo de álbumes, EPs, sencillos y otros lanzamientos, con búsqueda interna y resultados de Spotify cuando no hay coincidencias en Musiclub.
- Discografías persistidas en Supabase y contrastadas con Spotify, Deezer y Apple Music según disponibilidad. Se leen desde la BD y se actualizan en segundo plano. Una fuente incompleta o temporalmente caída no equivale a una discografía completa.
- Agrupación de variantes de una misma obra sin perder sus reseñas. Las ediciones deluxe mantienen identidad propia.
- Reseñas con canciones, seis criterios, nota general, comentario opcional, canción favorita y emociones. El inicio muestra las reseñas más recientes de hasta tres personas distintas.
- Pool por salas públicas y privadas, con temporadas independientes: una cápsula por persona, cupo opcional, edición propia mientras esté en espera y las propuestas estén abiertas, ganador e historial. La edición conserva su lugar; los estados del Pool pertenecen a `pool_entries`, no a `albums`.
- Gashapon para descubrir releases del catálogo o únicamente los activos y del historial de una temporada: `/gashapon?pool=<id>`.
- Lista privada «Escuchar más tarde» y descartes persistentes del Gashapon. Las preferencias pertenecen a la cuenta autenticada; variantes de una misma obra comparten estado y deluxe permanece separado. El historial permite reactivar descartes; guardar para después no modifica los sorteos.
- Calificación de portadas, perfiles, recomendaciones, playlists e insignias.
- Mi Perfil reúne identidad musical, nivel, reseñas y listas privadas, con navegación lateral en escritorio y desplazamiento horizontal en móvil. Los paneles laterales respetan la altura del encabezado y el espacio disponible. Configuración separa identidad, favoritos y enlaces, muestra una vista previa y conserva el borrador en el navegador hasta guardar o revertir los cambios. Sus géneros se eligen individualmente y el buscador consulta el registro compartido de Musiclub.
- Leaderboard de personas con al menos una reseña, con guía de insignias vectoriales y XP en amarillo. El destacado «Más severo» requiere al menos dos reseñas calificadas del miembro.
- Géneros con identidad visual y visor interactivo de vinilos.
- Carrusel editorial «En el radar». Los cobros por promociones están desactivados.

Musiclub enlaza a plataformas de escucha; no aloja álbumes completos para su descarga. Los metadatos importados no son reseñas de la comunidad.

La ficha de cada release incluye un medidor de puntuación de rojo a verde, seis criterios junto a General y una columna de vinilos para explorar sus géneros. Las tarjetas reparten sus acciones entre Ver release y A la cola. Las listas personales se encuentran junto a Para Ti en el perfil. La interfaz utiliza íconos vectoriales con tamaños uniformes por contexto: texto, controles y bloques de funciones. En botones y superficies de color adoptan el tono legible del contexto, con estados de hover y foco; los emojis se reservan para las reacciones a reseñas.

## Arquitectura actual

| Capa | Implementación |
| --- | --- |
| Aplicación | Next.js 16, App Router, React 19 |
| Interfaz | Tailwind CSS 4, tipografía Gabarito alojada localmente |
| Navegación heredada | Adaptador local de React Router sobre Next.js (`src/utils/nextRouterAdapter.jsx`) |
| Datos y sesión | Supabase PostgreSQL, Auth con Google, RLS y funciones SQL |
| Integraciones | Spotify, Deezer, Apple Music y MusicBrainz, con funciones distintas según el flujo |
| Alojamiento | Vercel; dominio canónico `https://www.musiclub.org` |
| Verificación | Node Test Runner, PostgreSQL de prueba con PGlite y Playwright en CI |

Las páginas públicas principales generan contenido en el servidor. El catálogo usa caché de servidor de hasta cinco minutos y una copia breve en el cliente. Las fichas y el Pool consultan los datos recién guardados cuando todavía no aparecen en la copia del catálogo. La disponibilidad de las integraciones depende de las credenciales y de sus proveedores.

## Desarrollo local

Requisito operativo: **Node.js 22** y npm, como en los workflows del repositorio.

```bash
npm ci
```

Copia `.env.example` a `.env.local` y configura un proyecto de Supabase de desarrollo con su esquema y autenticación. Después:

```bash
npm run dev
```

La aplicación abre normalmente en `http://localhost:3000`. Para producción local:

```bash
npm run build
npm start
```

Next.js compila en `.next/`. `npm start` ejecuta el servidor de producción, no el de desarrollo. Usa `npm run dev -- --port 3100` si necesitas otro puerto.

### Configuración

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública; su acceso depende de RLS |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | Sólo servidor; búsqueda e integraciones Spotify |
| `SUPABASE_SERVICE_ROLE_KEY` | Sólo servidor y tareas de mantenimiento que la necesiten |
| `ADMIN_EMAILS` | Identidades de administración autorizadas en las API del servidor |
| `CRON_SECRET` | Autorización de tareas programadas |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Notificaciones por correo |

No publiques secretos en variables `NEXT_PUBLIC_*`, archivos versionados ni capturas. Las variables `REACT_APP_*` que aún aparecen en código y workflows son compatibilidad heredada; no uses ese prefijo para nuevas credenciales privadas. No copies credenciales de producción a las pruebas.

Configura las direcciones de redirección de Google/Supabase para el entorno correspondiente. Las API administrativas, las políticas de la BD y la identidad mostrada en la interfaz son capas diferentes: un perfil local guardado no acredita una sesión ni permisos.

### Base de datos

El esquema desplegado no se crea únicamente con `npm ci`. Las migraciones están en `supabase/migrations/` y algunas dependen del esquema anterior: revísalas en orden sobre un entorno de desarrollo antes de aplicarlas. No ejecutes todos los scripts de mantenimiento contra producción de forma indiscriminada.

Las listas privadas requieren `supabase/migrations/20261027_v938_release_library.sql`. La tabla `user_release_preferences` usa RLS por `auth.uid()` y una función que cambia cada preferencia de forma independiente. No se guardan preferencias personales en el catálogo público. El Gashapon espera la lectura de descartes y la verifica antes de cada giro; si falla la lectura, bloquea el sorteo y ofrece reintentar.

- `albums`: datos de los releases.
- `reviews`, `cover_ratings`, `profiles`: aportaciones y perfiles con políticas de acceso.
- `pool_rooms`, `pool_room_members`, `pool_room_invites`: salas, pertenencia e invitaciones. Las privadas no aparecen en lecturas de personas ajenas.
- `seasons`, `pool_entries`: temporadas, propuestas y controles del Pool, aislados por sala.
- `artist_discographies`: perfiles y discografías persistidas.
- Vistas `public_*`: proyecciones públicas que omiten datos privados de contacto.

Las escrituras del Pool usan funciones SQL que validan sesión, propietario, temporada y estado. Las nuevas propuestas de una misma persona se bloquean en la BD; los registros históricos anteriores no se borran para imponer la regla.

## Verificación

```bash
npm run test:critical
npm run test:browser
npm audit --omit=dev
npm run build
```

`test:critical` incluye identidad y ediciones, puntuaciones, privacidad de datos públicos, géneros, discografías, Pool y pruebas SQL de propiedad, cupo y edición. `test:browser` inicia su propio servidor con datos locales de prueba y ejecuta recorridos en escritorio y móvil. Requiere Chromium de Playwright:

```bash
npx playwright install --with-deps chromium
```

En GitHub Actions se usa el Chrome ya instalado en la imagen Ubuntu 24.04, mediante `PLAYWRIGHT_CHANNEL=chrome`, para evitar reinstalar paquetes del sistema en cada ejecución. Se conservan los recorridos de escritorio y móvil. Referencias: [canales de Playwright](https://playwright.dev/docs/browsers) e [imagen de GitHub](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md).

El servidor de pruebas usa los puertos 3101 y 54329. Sus datos y credenciales ficticias no corresponden a producción. Los antiguos archivos de pruebas con sintaxis Jest en `src/utils/` no forman parte de la suite actual; los comandos vigentes están en `package.json`.

`tests/smoke-production.mjs` comprueba rutas, redirecciones, 404, mapas del sitio y rechazo de operaciones sin sesión. Por defecto consulta el servidor local en el puerto 3100; `TEST_BASE_URL` permite indicar el despliegue que se quiere verificar. No publica reseñas ni envía correos.

### Revisión del 23 de octubre de 2026

| Área revisada | Comprobación |
| --- | --- |
| Navegación pública | 25 rutas principales respondieron correctamente; contenido público, catálogo, artistas y páginas informativas |
| Servidor y SEO | 25 verificaciones de rutas, 404, redirecciones, cinco mapas del sitio y protección de API |
| Acceso | Sesiones, límites de propiedad del Pool y rechazo de operaciones sin autenticación; se corrigió la identidad local que podía quedar visible sin sesión |
| Contenido | FAQ actualizada; metodología centralizada en las guías; presentación del proyecto separada de ayuda, contacto y políticas |
| Dependencias | `npm audit --omit=dev`: sin vulnerabilidades reportadas en el momento de la revisión |
| Interfaz | Recorridos de escritorio y móvil en CI y comprobación visual de páginas modificadas |

Esta revisión verifica los recorridos y controles indicados; no equivale a una prueba de carga, auditoría externa de seguridad o aprobación de AdSense. No se crean usuarios reales ni se envían reseñas o notificaciones de prueba a la comunidad. El acceso nuevo de Google y la entrega final de correo dependen de la configuración del proveedor y deben comprobarse con cuentas y destinatarios de prueba autorizados.

## Páginas y contenido

| Ruta | Función |
| --- | --- |
| `/` | Inicio, radar editorial, voces recientes y descubrimientos |
| `/catalogo` | Búsqueda y filtros del catálogo |
| `/albumes/<slug>` | Ficha canónica de un release; existen alias por formato |
| `/artista/<slug>` | Artista, discografía oficial disponible y releases del club |
| `/generos/<slug>` | Releases e identidad visual del género |
| `/reviews` | Feed cronológico de reseñas |
| `/pool` | Temporada activa, cápsulas, ganador e historial |
| `/gashapon` | Descubrimientos y filtros, incluida temporada de Pool |
| `/portadas` | Valoración y galería de portadas |
| `/recomendaciones`, `/leaderboard`, `/playlists` | Afinidades y actividad comunitaria |
| `/profile`, `/settings` | Perfil y ajustes de la cuenta |
| `/admin` | Administración; requiere permisos reales |
| `/sobre-musiclub` | Identidad, origen, fuentes y criterio editorial del proyecto |
| `/contacto` | Soporte, correcciones y canal de solicitudes |
| `/guias` | Artículos sobre escucha, escritura y metodología de puntuación |
| `/faq` | Dudas prácticas sobre cuenta, reseñas y Pool; enlaza a las guías cuando corresponde |
| `/privacy`, `/terms` | Uso de datos y condiciones de participación |
| `/patch-notes` | Historial de cambios |

La FAQ no sustituye la política de privacidad ni los términos. Contacto indica cómo presentar una solicitud, sin duplicar esas políticas. Las guías desarrollan los temas de escucha y reseña; «Sobre Musiclub» explica el proyecto sin repetir la fórmula completa de puntuación.

## Estructura del repositorio

```text
src/app/             Rutas Next.js, metadatos, API y mapas del sitio
src/server/          Catálogo público, autorización, límites y artistas
src/views/           Vistas de la aplicación
src/components/      Interfaz, formularios, footer y visores
src/hooks/           Sesión y carga de datos
src/services/        Supabase, proveedores musicales y notificaciones
src/data/            Guías, géneros y notas de versión
src/utils/           Identidad, ediciones, calificaciones y utilidades
supabase/migrations/ Cambios de esquema y funciones SQL
tests/               Pruebas críticas, SQL y navegación
scripts/             Mantenimiento e integraciones
.github/workflows/   Verificación, publicación y tareas programadas
public/              Recursos estáticos y ads.txt
```

## Operación y publicación

Los workflows comprueban las pruebas críticas y la navegación en cambios de `master`. La publicación de versiones usa las notas curadas y las etiquetas del repositorio. Vercel utiliza `next.config.mjs` y `vercel.json`; tras desplegar, confirma que el despliegue esté listo y que los dominios de producción apunten a él.

- La actualización de discografías y la sincronización de Record Club tienen workflows diarios. Su ejecución necesita los secretos correspondientes en GitHub.
- La ingesta masiva de catálogo está disponible de forma manual. Su programación cada 30 minutos está comentada; no está activada por el README.
- Los respaldos privados y la recuperación tienen herramientas y pruebas propias. Un respaldo de datos no incluye automáticamente archivos binarios de Storage ni toda la configuración del proveedor.
- La verificación de AdSense incluye metadatos y `ads.txt`; no acredita una aprobación ni activa anuncios o cobros por sí sola.

## Contacto

Soporte público: [musiclub.org@gmail.com](mailto:musiclub.org@gmail.com). Para reportar un error, incluye la ruta, lo ocurrido y lo esperado, sin contraseñas, códigos de acceso ni credenciales.

### Salas de escucha · 9.35

Aplica `supabase/migrations/20261026_v935_pool_rooms.sql` después de las migraciones existentes y antes de desplegar esta versión. La migración conserva los IDs y el historial del Pool anterior en la sala pública original. Cada sala dispone de un Pool activo independiente; su propietario controla propuestas, selección y temporadas.

Las invitaciones privadas duran siete días; crear otra revoca las anteriores, sin expulsar a integrantes existentes. La salida de una sala privada revoca la lectura de sus propuestas. Las reseñas del catálogo siguen siendo públicas y se explica en la interfaz. Los avisos generales por correo se limitan a la sala original; las otras salas no disparan esos envíos. El acceso está protegido tanto en tablas como en la vista `public_pool_entries`, y el Gashapon vuelve a validar el acceso cuando cambia la sesión.

Las pruebas de `tests/pool-rooms.test.mjs` ejecutan las políticas y funciones sobre PostgreSQL de prueba, incluyendo lecturas ajenas, invitaciones revocadas, edición propia y dos ganadores simultáneos en salas distintas.

### Pools anteriores y carga por sala

El directorio y cada sala enlazan los pools anteriores con estado **Cerrado**. La vista histórica conserva propuestas y ganadores; no ofrece acciones de depósito, edición o sorteo. Los pools futuros todavía sin activar no se presentan como historial.

La carga de una sala consulta únicamente sus propuestas, releases y reseñas, sin descargar el catálogo completo ni repetir la consulta inicial de temporadas. El buscador carga el catálogo al usarlo; el formulario de reseña y la ruleta se descargan al abrirlos. Las etiquetas compartidas alinean íconos y texto por el centro.

### Navegación y lectura visual

Los pools anteriores tienen tarjetas propias en el directorio. El radar avanza automáticamente cada siete segundos mientras está visible, con barras de progreso y sin controles de pausa o flechas. El Top Score Comunitario incluye únicamente álbumes con al menos dos reseñas.

La ficha presenta el ánimo más compartido junto a la calificación; los empates aparecen como ánimo mixto. Las reseñas antiguas sin emoción explícita pueden aportar una estimación por nota, identificada en la interfaz. Géneros, información, contacto y guías comparten el encabezado general; Redes conserva su portada independiente con GitHub y enlaces legales.

### Reseñas y tracklists · 10.0.0

Las reseñas del feed y de cada release muestran los seis criterios y General con íconos y nombres accesibles. Las canciones evaluadas se despliegan bajo demanda, ordenadas por nota descendente y, en empates, por su posición en el tracklist. Los estados de ánimo usan caras vectoriales propias; la ausencia de reseñas se indica con una interrogación.

`npm run tracks:audit` revisa los releases publicados del catálogo y los próximos estrenos que ya alcanzaron su fecha: detecta listas vacías, nombres provisionales y conteos incompletos. Es de sólo lectura y guarda el informe en `outputs/v10-track-audit/`. Los estrenos futuros conservan sus pistas anunciadas. La sincronización compara la calidad de los títulos, conserva los identificadores usados por las reseñas y evita que una respuesta parcial borre canciones conocidas. Las búsquedas de enriquecimiento contrastan el título y la edición solicitada, manteniendo Deluxe separado.

El repositorio oficial es [eugenio-turcott/musiclub](https://github.com/eugenio-turcott/musiclub). El nombre anterior redirige al actual.
