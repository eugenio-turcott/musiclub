# Desarrollo de Musiclub

Usa Node.js 22 y `npm ci`. Copia `.env.example` a `.env.local` y configura un proyecto de Supabase de desarrollo; las migraciones de `supabase/migrations/` requieren revisar sus dependencias sobre el esquema existente.

| Configuración | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Conexión pública y políticas de acceso |
| `SUPABASE_SERVICE_ROLE_KEY` | Tareas privadas del servidor |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | Consultas musicales del servidor |
| `ADMIN_EMAILS`, `CRON_SECRET` | Administración y trabajos programados |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Correos autorizados |

Conserva los secretos fuera de Git y de las variables `NEXT_PUBLIC_*`. Las variables `REACT_APP_*` aún presentes son compatibilidad heredada.

```sh
npm run dev
npm run test:critical
npm run test:browser
npm run build
```

Las pruebas de navegador usan datos ficticios en los puertos 3101 y 54329. `PLAYWRIGHT_CHANNEL=chrome` permite usar Chrome instalado; `PLAYWRIGHT_CLOUDFLARE=1` comprueba el entorno local de Workers. La integración continua separa escritorio y móvil y conserva ambos informes.

La publicación real usa Cloudflare Workers con OpenNext, caché R2 y Durable Objects. GitHub Deployments registra esa publicación; no representa otro servidor. Sólo se registra éxito después de comprobar Cloudflare y la versión pública.

El mantenimiento de discografías trabaja en lotes de hasta 120 artistas, cuatro veces al día, con un presupuesto de veinte minutos para el refresco. Prioriza los pendientes más antiguos y respeta las reservas y las fechas vigentes; así el siguiente lote continúa donde corresponde sin depender del orden alfabético.

Las fichas públicas se calculan en el servidor. Las preferencias, predicciones y datos propios conservan sus permisos privados. Los cambios de esquema se revisan por separado de la presentación de la web.

Consulta [versiones](releases.md), [géneros](release-genres.md) y [la edición anual](annual-2026.md) para el mantenimiento específico.
