# Musiclub

<p align="center"><a href="https://www.musiclub.org"><img src="public/musiclub-overview.svg" alt="Musiclub · Tu música. Tu criterio. Catálogo, reseñas, Pools, Gashapon, perfiles y comunidad." width="100%" /></a></p>

<p align="center"><a href="https://www.musiclub.org/catalogo">Explorar música</a> · <a href="https://www.musiclub.org/guias">Guía interactiva</a> · <a href="https://www.musiclub.org/pool">Encontrar una sala</a> · <a href="https://www.musiclub.org/patch-notes">Novedades</a></p>

[Musiclub](https://www.musiclub.org) es un club musical en español para descubrir lanzamientos, publicar reseñas, calificar portadas y escuchar en comunidad.

**Versión:** 12.0.3 · **Última actualización:** 12 de noviembre de 2026.

### Grammy 2027 en Musiclub

La edición dorada integra todos los símbolos de categoría en vinilos. Los aciertos oficiales suman **100 XP** en categorías normales, **200 XP** en las cinco nuevas y **500 XP** en las seis de Campo General. Cuatro insignias exclusivas usan variaciones del gramófono dorado, sin bonificaciones adicionales. La XP y los logros se comparten entre Leaderboard, perfiles y tarjetas.

La migración `20261111_v1201_grammy_rewards.sql` registra ganadores verificados y acredita cada acierto una sola vez después de la ceremonia y el cierre. El proceso es exclusivo de administración, exige una fuente de Grammy.com y no permite sustituir ganadores ya verificados. El agregado público muestra sólo logros y XP; las predicciones y el detalle individual conservan sus permisos privados.

La [actividad Grammy](https://www.musiclub.org/grammys) prepara las 100 categorías y los 12 campos de la 69.ª edición. Campo General y las cinco categorías nuevas aparecen primero; las restantes se abren por campo y se pueden buscar. Incluye vinilos nativos, seis emblemas propios, animaciones con pausa y movimiento reducido. El anuncio aparece sobre la navbar, conservando su ancho y su comportamiento al desplazarse.

«Notificarme» es voluntario y guarda sólo la suscripción del usuario autenticado. Cloudflare ejecuta un lote cada quince minutos: el recordatorio se prepara desde el 15 de noviembre a las 12:00 CDMX; el segundo aviso sólo procede cuando los nominados estén publicados. Las reservas durables evitan reenvíos concurrentes y no reintentan automáticamente entregas inciertas. El proceso usa `CRON_SECRET` y el SMTP existente. No realiza consultas a la base de datos antes de la ventana del evento.

La migración `20261111_v120_grammys.sql` crea las categorías, el evento, nominados, suscripciones y predicciones con permisos separados. Cada persona puede consultar únicamente sus propios datos. La administración de `/grammys` acepta nominados verificados usando el formato descargable; publicar exige esperar al anuncio y tener al menos dos nominados en cada una de las 100 categorías. La fecha sola no abre predicciones. Los votos son editables hasta el 7 de febrero de 2027 a las 14:00 CDMX. Musiclub no interviene en la votación oficial y no incorpora apuestas ni pagos.

La portada presenta Musiclub con una tornamesa horizontal sin inclinación con la tipografía oficial. La calificación y el ánimo comparten la consola, con una barra animada más larga debajo; la indicación de estéreo ocupa la esquina superior derecha. La portada ocupa todo el recuadro, muestra el género principal por debajo y revela título y artista al pasar el cursor o enfocar el enlace; en pantallas táctiles la información permanece visible. En la tornamesa, diez releases con reseñas se eligen al azar por visita y se suceden con un fundido cada 6,5 segundos, sin contador, flechas ni consultas adicionales. La selección se pausa para leer la portada, usar el teclado, levantar la aguja, salir de pantalla o detener las animaciones. El vinilo completo gira desde el inicio y la aguja controla el giro; al interactuar se escuchan efectos locales breves, sin canciones ni consultas a proveedores musicales. Los accesos a Pools, Gashapon y las demostraciones aparecen bajo el equipo. Las demostraciones de reseñas y tarjetas utilizan diez ejemplos aleatorios del club: Gashapon selecciona de todo el catálogo, con o sin reseñas, y abre tres releases distintos con tres diseños de vinilo únicos; prioriza géneros diferentes y las tarjetas alternan Story y Horizontal con un fundido y ajuste gradual de altura, conservando cada composición sin estirar su texto. Los géneros abren sus propios exploradores animados y las insignias recorren tres carruseles continuos. Usa información real del club y recursos gráficos propios. Las demostraciones no publican cambios; el movimiento admite pausa manual y respeta la preferencia de reducir animaciones.

## La experiencia

| Descubre | Participa | Hazlo tuyo |
| --- | --- | --- |
| Releases, artistas y vinilos por género | Reseñas con siete criterios y notas por pista | Perfil musical y estadísticas compartidas |
| Gashapon y una cola para volver después | Salas públicas y privadas con Máquina Musical | Insignias evolutivas y 16 niveles de actividad |
| Portadas y tendencias del club | Reacciones y recomendaciones entre miembros | Tarjetas para historias, publicaciones y formatos horizontales |

Las tier lists permiten seleccionar hasta diez releases por rango y compartir los seis tiers juntos en una sola imagen, usando sólo las portadas. Cada uno de los cinco formatos organiza la lámina según su proporción. Las tarjetas de perfil separan identidad, favoritos, XP, insignias y vinilos de géneros para evitar superposiciones; la XP es amarilla en los temas oscuros y rosa oscuro en Edición en papel. Compartir reseñas, perfiles y tier lists se limita al contenido de la cuenta propia.

La [guía interactiva](https://www.musiclub.org/guias) permite probar cada área con demostraciones locales: no publica reseñas, no crea salas y no envía mensajes. El FAQ enlaza a sus capítulos. Las tarjetas para compartir conservan la proporción en cualquier pantalla y excluyen correo, buzón e información privada.

## Qué incluye

- Catálogo de álbumes, EPs, sencillos y otros lanzamientos, con búsqueda interna y resultados de Spotify cuando no hay coincidencias en Musiclub.
- Discografías persistidas en Supabase y contrastadas con Spotify, Deezer y Apple Music según disponibilidad. Se leen desde la BD y se actualizan en segundo plano. Una fuente incompleta o temporalmente caída no equivale a una discografía completa.
- Agrupación de variantes de una misma obra sin perder sus reseñas. Las ediciones plus, deluxe, remasterizadas, de aniversario y ampliadas mantienen identidad propia y sus reseñas utilizan su tracklist correspondiente.
- Insignias compartidas entre la guía, el Leaderboard y los perfiles, con emblemas y tiers visibles. Los géneros favoritos históricos se muestran por separado también en el Perfil.
- Reseñas con canciones, seis criterios, nota general, comentario opcional, canción favorita y emociones. Las fichas distinguen una valoración sin comentario escrito de una reseña con texto. El inicio muestra las reseñas más recientes de hasta tres personas distintas.
- Pool por salas públicas y privadas, con temporadas independientes: una cápsula por persona, cupo opcional, edición propia mientras esté en espera y las propuestas estén abiertas, ganador e historial. La edición conserva su lugar; los estados del Pool pertenecen a `pool_entries`, no a `albums`.
- Gashapon para descubrir releases del catálogo o únicamente los activos y del historial de una temporada: `/gashapon?pool=<id>`.
- Lista privada «Escuchar más tarde» y descartes persistentes del Gashapon. Las preferencias pertenecen a la cuenta autenticada; variantes de una misma obra comparten estado y deluxe permanece separado. El historial permite reactivar descartes; guardar para después no modifica los sorteos.
- Calificación de portadas, perfiles, recomendaciones, playlists e insignias.
- Mi Perfil reúne identidad musical, nivel, reseñas y listas privadas, con navegación lateral en escritorio y desplazamiento horizontal en móvil. Los paneles laterales respetan la altura del encabezado y el espacio disponible. Configuración separa identidad, favoritos y enlaces, muestra una vista previa y conserva el borrador en el navegador hasta guardar o revertir los cambios. Sus géneros se eligen individualmente y el buscador consulta el registro compartido de Musiclub.
- Leaderboard de todos los perfiles registrados, incluidos quienes todavía no tienen reseñas, con guía de insignias vectoriales y XP en amarillo. El destacado «Más severo» requiere al menos dos reseñas calificadas del miembro.
- Géneros con identidad visual y visor interactivo de vinilos.
- Carrusel editorial «En el radar». Los cobros por promociones están desactivados.
- Toda la publicidad está temporalmente desactivada. Se conserva su configuración para una futura reactivación solicitada por el propietario; no se cargan bibliotecas, banners ni espacios publicitarios.

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
| Alojamiento | Cloudflare Workers mediante OpenNext, caché R2 y Durable Objects; dominio canónico `https://www.musiclub.org` |
| Verificación | Node Test Runner, PostgreSQL de prueba con PGlite y Playwright en CI |

Las páginas públicas principales generan contenido en el servidor. El catálogo usa una instantánea compartida de servidor de hasta cinco minutos y una copia breve en el cliente. Las fichas resuelven un índice ligero y consultan únicamente los releases y reseñas relacionados, con caché de un minuto e invalidación tras guardar reseñas. La sesión se comparte entre los componentes; las interacciones de reseñas se agrupan y las lecturas recientes del Pool se reutilizan por cuenta, sala y temporada. No hay sondeo periódico del Pool ni de las notificaciones; se actualizan al guardar, al volver a la ventana cuando caduca su copia o mediante el botón de actualizar. Las fichas y el Pool consultan los datos recién guardados cuando todavía no aparecen en la copia del catálogo. Las transiciones conservan la página actual hasta que el destino está listo y muestran una línea superior discreta. La precarga completa se activa al pasar el cursor, enfocar o tocar un enlace, respetando el ahorro de datos; no se precargan todas las tarjetas al mostrarlas. Las lecturas iniciales propias de una sección usan una fila compacta con un vinilo pequeño y su texto. Las portadas de Spotify usan sus variantes de 64, 300 y 640 píxeles según el tamaño mostrado, con recuperación de la URL original si falla la variante; las de Record Club conservan su redimensionado por CDN. El transporte compacto del catálogo envía cada tracklist una sola vez y reconstruye las relaciones de reseñas en el cliente, manteniendo las ediciones, notas y favoritas. La landing entrega puntuaciones y favoritas ya calculadas para sus demostraciones y completa los carruseles decorativos de insignias al acercarse a su sección. Cada Pool puede generar desde su configuración un código estable de doce letras mayúsculas y números para `/pool/CODIGO`; los enlaces anteriores siguen funcionando y los códigos no sustituyen los permisos de las salas privadas. La navegación reúne todos los Pools públicos activos y cerrados. Las cápsulas tienen una inspección animada sin lecturas adicionales, con tres segundos abiertas y dos cerradas. La Máquina Musical anima tres carretes y una palanca sin consultas durante el giro, aplica hasta un 5 % de peso adicional por antigüedad y guarda una sola selección. El correo del Pool se espera y se comprueba por separado: un fallo no repite el sorteo. Los avisos fallidos se pueden reenviar explícitamente desde la administración del Pool original, con una nueva reserva atómica y registro del intento anterior; los avisos enviados o en proceso no se repiten, y los administradores pueden comprobar la conexión SMTP sin enviar mensajes. Las imágenes opcionales no bloquean el correo. En Cloudflare el SMTP de Brevo utiliza TLS directo por el nombre del servidor en el puerto 465, con el certificado verificado. La disponibilidad de las integraciones depende de las credenciales y de sus proveedores.

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

En GitHub Actions se usa el Chrome ya instalado en la imagen Ubuntu 24.04, mediante `PLAYWRIGHT_CHANNEL=chrome`, para evitar reinstalar paquetes del sistema en cada ejecución. Los recorridos de escritorio y móvil usan el entorno local de Workers con `PLAYWRIGHT_CLOUDFLARE=1`. Referencias: [canales de Playwright](https://playwright.dev/docs/browsers) e [imagen de GitHub](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md).

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
| `/admin/vinilos` | Galería de los 2.224 vinilos de géneros, con buscador, ampliación y descarga PNG/SVG; requiere administración |
| `/sobre-musiclub` | Identidad, origen, fuentes y criterio editorial del proyecto |
| `/contacto` | Soporte, correcciones y canal de solicitudes |
| `/guias` | Artículos sobre escucha, escritura y metodología de puntuación |
| `/faq` | Dudas prácticas sobre cuenta, reseñas y Pool; enlaza a las guías cuando corresponde |
| `/privacy`, `/terms` | Uso de datos y condiciones de participación |
| `/patch-notes` | Historial de cambios |

La navegación se monta una sola vez en el diseño global, con un marco máximo de 1.280 px y ajustes para celular. Las tarjetas de perfil compartidas distribuyen identidad, XP real, nivel, insignias y vinilos de géneros de forma específica para Historia, Publicación, Cuadrada, Horizontal y Compacta. La vista previa consulta el progreso al abrirse y reutiliza esa lectura al cambiar de tamaño o tema.

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

Los workflows comprueban las pruebas críticas y la navegación en cambios de `master`. La publicación de versiones usa las notas curadas y las etiquetas del repositorio. Cloudflare compila y publica `master` usando `open-next.config.ts` y `wrangler.jsonc`. El 30 de octubre, GoDaddy confirmó los servidores `darwin.ns.cloudflare.com` y `zoe.ns.cloudflare.com`, y Cloudflare confirmó la zona activa. Los dominios raíz y `www` están vinculados al Worker `musiclub`. Los despliegues automáticos de Vercel están desactivados en `vercel.json`; el proyecto anterior se conserva para recuperación manual.

### Cloudflare Workers

```bash
npm run cloudflare:build
npm run cloudflare:preview
# Con la cuenta y los secretos de Musiclub configurados:
npm run cloudflare:deploy
```

- La compilación genera `.open-next/`. La vista previa utiliza Workers local en el puerto 3103, con caché local separada de R2 de producción.
- `NEXT_INC_CACHE_R2_BUCKET` apunta al contenedor privado `musiclub-next-cache`. Los Durable Objects gestionan revalidación y etiquetas; no contienen las cuentas ni sustituyen Supabase.
- Configura las variables del servidor como secretos del Worker. El script elimina la copia automática de archivos `.env` que genera OpenNext para que las credenciales no queden incorporadas al paquete.
- La integración de GitHub publica únicamente `master` en el Worker `musiclub`. Usa `npm run cloudflare:build` y `npm run cloudflare:deploy`, con Node.js 22. Las variables públicas `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` deben estar también en el entorno de compilación; las claves privadas permanecen exclusivamente en el Worker. Las compilaciones de otras ramas deben seguir desactivadas y el script rechaza la publicación de una rama de vista previa desde Workers Builds.
- La vista previa local de Workers necesita su configuración de servidor en `.dev.vars` (ignorado por Git). Los secretos remotos no se descargan automáticamente al ejecutar la vista previa.
- La publicación utiliza Wrangler y comprueba las páginas públicas del despliegue provisional para calentar la caché R2 bajo demanda. No depende del túnel de carga inicial de caché de OpenNext, que puede fallar en Windows.
- Los 2.224 vinilos PNG y SVG editables se generan durante la compilación y se sirven como archivos estáticos. Los enlaces antiguos de vinilos redirigen al archivo correspondiente. Los correos leen los adjuntos con la vinculación `ASSETS`; Sharp sólo se utiliza al construir. La administración puede consultar, ampliar y descargar cada diseño desde `/admin/vinilos`, con búsqueda local y páginas de 48 imágenes.
- Las carátulas continúan usando sus proveedores de imágenes. No se utiliza la optimización dinámica de imágenes de Next.js.
- Las métricas operativas se consultan en Cloudflare Workers. No se cargan los scripts de analítica de Vercel ni un nuevo rastreador de navegador.
- La configuración usa Workers Paid y R2: tienen cuotas y cargos por excedentes. El límite de CPU por solicitud reduce el riesgo de consumo descontrolado, pero no constituye un límite de gasto mensual.
- Conserva los registros de correo y verificación al trasladar DNS. Mantén `www.musiclub.org` en Supabase Auth, enlaces canónicos, mapas del sitio y plataformas externas. No borres el proyecto anterior antes de validar inicio de sesión, búsquedas, administración y correo en el nuevo despliegue.

Para ejecutar los recorridos de escritorio y móvil en Workers con datos ficticios:

```bash
# En PowerShell: $env:PLAYWRIGHT_CLOUDFLARE='1'
PLAYWRIGHT_CLOUDFLARE=1 npm run test:browser
```

La revisión local de migración del 29 de octubre aprobó 136 pruebas críticas y 115 recorridos de navegador (3 omitidos por condiciones de pantalla). El 30 de octubre se repitieron las 25 comprobaciones públicas en el dominio provisional de Workers y se verificó una publicación automática desde GitHub. Las credenciales de Spotify y Supabase y la negociación SMTP se comprobaron por separado; no se enviaron correos de prueba. El acceso nuevo con Google y la entrega final de correo requieren una comprobación con una cuenta y un destinatario autorizados. El estado de la zona y un despliegue correcto no sustituyen la comprobación HTTPS y de navegación del dominio canónico después de propagarse.

- La actualización de discografías y la sincronización de Record Club tienen workflows diarios. Su ejecución necesita los secretos correspondientes en GitHub.
- La ingesta masiva de catálogo está disponible de forma manual. Su programación cada 30 minutos está comentada; no está activada por el README.
- Los respaldos privados y la recuperación tienen herramientas y pruebas propias. Un respaldo de datos no incluye automáticamente archivos binarios de Storage ni toda la configuración del proveedor.
- La verificación de AdSense incluye metadatos y `ads.txt`; no acredita una aprobación ni activa anuncios o cobros por sí sola.

## Publicidad · 10.5.1

**Toda la publicidad está pausada por petición del propietario.** `ADVERTISING_ENABLED = false` en `src/utils/advertisingPolicy.cjs` impide cargar anuncios aun con permisos anteriores. Se ocultan los avisos, las preferencias de publicidad y todas las posiciones, sin espacios vacíos. Los endpoints de banners responden 404, incluido el host aislado `ads.musiclub.org`, y la política responde `disabled`. No hay reactivación automática por tráfico.

Los siguientes detalles documentan la integración conservada para una reactivación futura. Cambiar el interruptor requiere una nueva autorización del propietario y un despliegue; Adcash necesita además aprobación del proveedor.

Adcash está desactivado: el 2 de noviembre su panel indicó que Musiclub fue rechazado por tráfico insuficiente. Se retiraron su biblioteca, contenedor y espacios vacíos de Inicio y del footer. La zona manual anterior era `12384990` (300 × 250), sitio `1666362`. Su reactivación requiere primero una nueva aprobación del proveedor; no se programa una solicitud automática ni se crea otra cuenta. La integración anterior queda en el historial de Git.

La configuración conservada de Adsterra incluye banners de 300 × 250, 468 × 60, 160 × 300, 160 × 600, 320 × 50 y 728 × 90, y Native Banner. Los identificadores públicos y códigos están en `src/utils/adsterraPlacements.cjs`. Social Bar se retiró porque se superponía a la navegación. No se instalan Popunder/Onclick, Smartlink ni Autotag. AdSense sigue sin servir anuncios. `AdvertisingConsentNotice` conserva el aviso y la elección de privacidad de forma independiente de los proveedores; cuando no hace falta pedir permiso, no renderiza espacio alguno. No se crean posiciones en cuenta, administración, Pool/salas privadas, contacto, políticas ni páginas de error o fichas aún cargando. Al navegar desde una página con publicidad a una ruta excluida se recarga el documento para detener la biblioteca de terceros.

`AppHeader` coloca un banner horizontal centrado debajo de la navegación, fuera del encabezado sticky, para que se vea en la primera pantalla. Las páginas privadas, errores, fichas cargando y géneros vacíos no lo incluyen. `AdsterraAdvertising` distribuye banners compactos, rectangulares y nativos entre secciones de Inicio, Catálogo y releases. Artistas, géneros, reseñas, ranking, portadas y artículos también incorporan posiciones dentro del contenido. El footer sólo conserva el nativo como alternativa cuando no se ha reservado antes. Selecciona el tamaño una sola vez por visita; los seis tamaños son alternativas según pantalla, no seis banners amontonados. AdvertisingPlacementProvider reserva cada unidad una sola vez por ruta, sin duplicar sus códigos entre ubicaciones. AdvertisingRails coloca los formatos de 160 × 600 y 160 × 300 en los márgenes desde 1720 px, únicamente si también caben en altura; al estrechar la ventana se ocultan sin recargarse. Los banners se ejecutan en `ads.musiclub.org/api/advertising/banner/[placement]`, un origen separado que sólo sirve códigos públicos fijos. `src/cloudflare/worker.js` devuelve 404 para cualquier otra ruta de ese host, antes de entrar en Next.js; no ofrece páginas de cuenta ni API de datos. Conservamos el sandbox sin navegación superior; `allow-same-origin` permite al proveedor escribir en sus propios marcos, mientras la separación de origen impide que acceda al documento o al almacenamiento de Musiclub. Native Banner carga al acercarse a su posición. La configuración usa `window.atOptions` para que el proveedor pueda consumirla y borrarla en modo estricto; declararla con `var` detenía los banners reales. Las pruebas reproducen ese borrado y la escritura en un marco hijo, y verifican que el anuncio no pueda acceder a la página principal.

El host `ads.musiclub.org` debe estar asociado al mismo Worker Musiclub como dominio personalizado de Cloudflare. No necesita otra base de datos ni credenciales. En las pruebas se usa `ads.localhost:3101`, separado del origen de la aplicación `127.0.0.1:3101`; los códigos publicitarios están interceptados y no se muestran campañas reales. La entrada de Wrangler debe conservarse en `src/cloudflare/worker.js` para mantener la restricción del host publicitario.

`/api/advertising/policy` usa exclusivamente `getCloudflareContext().cf.country`: México habilita carga automática con aviso y rechazo disponible; otras ubicaciones o una ubicación desconocida mantienen permiso previo. Esta configuración inicial revisada no pretende afirmar que todos los demás países requieran consentimiento expreso. No se infiere el país del idioma ni se aceptan encabezados o parámetros enviados por el visitante. La respuesta sólo contiene el modo de carga y usa `private, no-store`; no se incorpora al caché compartido del catálogo ni se guarda el país. Véase [contexto de Cloudflare](https://developers.cloudflare.com/workers/runtime-apis/request/).

Aceptar o rechazar se guarda hasta 180 días en ese navegador; no se registra una aceptación ficticia para la carga automática. Un rechazo anterior y `navigator.globalPrivacyControl` prevalecen sobre el modo regional. El botón «Preferencias de publicidad» del footer permite cambiar la elección. Retirarla recarga la página para detener código de terceros ya cargado. Las cookies que el proveedor haya creado se eliminan desde el navegador. La política de privacidad describe este uso; este selector no se presenta como una CMP certificada.

El tamaño del anuncio se conserva: si no caben 300 px, no se solicita un banner; al estrechar una ventana que ya lo mostró, se oculta sin volver a solicitarlo. No hay refrescos automáticos. Las pruebas interceptan los códigos de Adsterra y usan anuncios ficticios, sin hacer clic en publicidad. También verifican que no se solicite la biblioteca de Adcash y que no queden contenedores vacíos.

Para retirar los anuncios activos, elimina las instancias de `AdsterraAdvertising` y `AdvertisingRails` y vuelve a desplegar. Conserva el control del footer para retirar elecciones anteriores. Categorías, disponibilidad y pagos se administran en cada proveedor. Adsterra confirmó exclusiones de contenido adulto/sexual, citas, apuestas/casino, falsos avisos y descargas engañosas; el ticket `152036565` pide conservarlas para todas las unidades. Esta configuración no garantiza ingresos ni sustituye la vigilancia de las campañas que sirva el proveedor.

## Contacto

Soporte público: [musiclub.org@gmail.com](mailto:musiclub.org@gmail.com). Para reportar un error, incluye la ruta, lo ocurrido y lo esperado, sin contraseñas, códigos de acceso ni credenciales.

### Salas de escucha · 9.35

Aplica `supabase/migrations/20261026_v935_pool_rooms.sql` después de las migraciones existentes y antes de desplegar esta versión. La migración conserva los IDs y el historial del Pool anterior en la sala pública original. Cada sala dispone de un Pool activo independiente; su propietario controla propuestas, selección y temporadas.

Las invitaciones privadas duran siete días; crear otra revoca las anteriores, sin expulsar a integrantes existentes. La salida de una sala privada revoca la lectura de sus propuestas. Las reseñas del catálogo siguen siendo públicas y se explica en la interfaz. Los avisos generales por correo se limitan a la sala original; las otras salas no disparan esos envíos. El acceso está protegido tanto en tablas como en la vista `public_pool_entries`, y el Gashapon vuelve a validar el acceso cuando cambia la sesión.

Las pruebas de `tests/pool-rooms.test.mjs` ejecutan las políticas y funciones sobre PostgreSQL de prueba, incluyendo lecturas ajenas, invitaciones revocadas, edición propia y dos ganadores simultáneos en salas distintas.

### Pools anteriores y carga por sala

El directorio y cada sala enlazan los pools anteriores con estado **Cerrado**. La vista histórica conserva propuestas y ganadores; no ofrece acciones de depósito, edición o sorteo. Los pools futuros todavía sin activar no se presentan como historial.

La carga de una sala consulta únicamente sus propuestas, releases y reseñas, sin descargar el catálogo completo ni repetir la consulta inicial de temporadas. El buscador carga el catálogo al usarlo; el formulario de reseña y la Máquina Musical se descargan al abrirlos. Las etiquetas compartidas alinean íconos y texto por el centro.

### Navegación y lectura visual

Los pools anteriores tienen tarjetas propias en el directorio. El radar avanza automáticamente cada siete segundos mientras está visible, con barras de progreso y sin controles de pausa o flechas. El Top Score Comunitario incluye únicamente álbumes con al menos dos reseñas.

La ficha presenta el ánimo más compartido junto a la calificación; los empates aparecen como ánimo mixto. Las reseñas antiguas sin emoción explícita pueden aportar una estimación por nota, identificada en la interfaz. Géneros, información, contacto y guías comparten el encabezado general; Redes conserva su portada independiente con GitHub y enlaces legales.

### Reseñas y tracklists · 10.0.0

Las reseñas del feed y de cada release muestran los seis criterios y General con íconos y nombres accesibles. Las canciones evaluadas se despliegan bajo demanda, ordenadas por nota descendente y, en empates, por su posición en el tracklist. Los estados de ánimo usan caras vectoriales propias; la ausencia de reseñas se indica con una interrogación.

`npm run tracks:audit` revisa los releases publicados del catálogo y los próximos estrenos que ya alcanzaron su fecha: detecta listas vacías, nombres provisionales y conteos incompletos. Es de sólo lectura y guarda el informe en `outputs/v10-track-audit/`. Los estrenos futuros conservan sus pistas anunciadas. La sincronización compara la calidad de los títulos, conserva los identificadores usados por las reseñas y evita que una respuesta parcial borre canciones conocidas. Las búsquedas de enriquecimiento contrastan el título y la edición solicitada, manteniendo Deluxe separado.

`npm run reviews:audit-tracks` comprueba que cada canción evaluada y favorita pueda resolverse contra la edición que muestra la interfaz. Lee únicamente los metadatos necesarios de `albums` y `public_reviews`, sin modificar datos. Guarda un informe y una instantánea mínima en `outputs/review-track-audit-AAAA-MM-DD/`; `TRACK_AUDIT_DIR` permite cambiar el destino y `TRACK_AUDIT_INPUT` permite repetir la comprobación sobre una instantánea sin consultar la base.

El repositorio oficial es [eugenio-turcott/musiclub](https://github.com/eugenio-turcott/musiclub). El nombre anterior redirige al actual.
