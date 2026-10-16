# Musiclub Updates - V.9.6

## Cambios indispensables

- Contenido inicial de inicio, catálogo, reseñas, álbumes y artistas disponible en HTML; enlaces del catálogo paginados y rastreables.
- Direcciones canónicas compartidas entre enlaces y sitemaps, redirecciones permanentes de variantes y respuesta 404 para álbumes inexistentes.
- Sitemaps calculados desde los registros reales, sin fechas inventadas ni páginas personales.
- Spotify pasa por un servicio del servidor: el navegador no recibe su secreto ni el token de la aplicación.
- Endpoints de escritura y avisos protegidos por sesiones verificadas; acciones administrativas y tareas programadas requieren autorización específica.
- Vistas públicas sin correos ni credenciales y políticas de Supabase que limitan escritura y lectura privada al propietario o administrador.
- Recomendaciones guardadas mediante una función que resuelve el destinatario dentro de la base, sin publicar su correo en el navegador.
- `.env` deja de formar parte del repositorio. Los secretos anteriores deben revocarse: esta actualización no elimina el historial de Git.

## Configuración y orden del despliegue

1. Aplicar `supabase/migrations/20261016_v96_access_guards.sql` y `20261016_v96_private_recommendations.sql` en el proyecto Supabase existente.
2. Configurar Vercel Production con las variables de `.env.example`. Se conservan como compatibilidad los nombres `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, `REACT_APP_SPOTIFY_CLIENT_ID`, `REACT_APP_SPOTIFY_CLIENT_SECRET` y, solo en procesos del servidor, `REACT_APP_SUPABASE_SERVICE_KEY`.
3. Desplegar V.9.6 y comprobar que usa las vistas `public_*`.
4. Aplicar `supabase/migrations/20261016_v96_private_reads.sql`. Aplicarla antes del código compatible dejaría vacías algunas lecturas de la versión anterior.
5. Revocar y sustituir las credenciales expuestas de Spotify, Supabase con privilegios y correo en sus proveedores, Vercel y las tareas que las utilicen. Nunca usar un nombre `NEXT_PUBLIC_*` para claves privadas. GitHub Actions necesita `SUPABASE_SERVICE_ROLE_KEY` para tareas de mantenimiento; la clave pública ya no permite escribir el catálogo.

`ADMIN_EMAILS` controla los administradores de los endpoints; la función SQL `musiclub_is_admin` debe mantenerse alineada con esa lista. `CRON_SECRET` es obligatorio para llamar a los endpoints de tareas con una credencial de tarea, y debe viajar como `Authorization: Bearer ...`. Las tareas requieren además la clave privada de Supabase.

Los límites de peticiones del servidor viven por instancia. La función de recomendaciones añade un límite persistente de cinco altas por minuto y remitente. No se han enviado correos de prueba ni modificado reseñas para verificar este despliegue.

## Verificación

Ejecutar `npm run test:critical`, `npm run build` y, con el servidor levantado, `node tests/smoke-production.mjs`. Para comprobar producción: `TEST_BASE_URL=https://www.musiclub.org` antes del último comando. Este último comprueba rutas públicas, HTML inicial, redirecciones, páginas inexistentes, sitemaps y rechazo de solicitudes sin sesión; no escribe registros ni envía avisos.

## Alcance del SEO

Estas correcciones facilitan que Google rastree y evalúe las páginas. La indexación y el tráfico no están garantizados por un despliegue: requieren nuevos rastreos, contenido editorial útil y referencias externas. Revisar las tendencias de impresiones y páginas indexadas en Search Console después de que Google procese los cambios. No es necesario solicitar indexación manual de cientos de URLs.
