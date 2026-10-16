# Musiclub Updates - V.9.7

## Cambios

- Valoración rápida sobre 10 con comentario opcional; las seis dimensiones y canciones conservan valores ausentes. El formulario detallado continúa disponible. Los borradores se conservan al iniciar sesión.
- Búsqueda desde la portada y tres guías editoriales propias en `/guias`, incluidas en el sitemap. Las búsquedas con parámetros no se indexan.
- Selección inicial de portada más pequeña, sin volver a descargar el catálogo al montar. Imágenes adaptadas y enlaces sin precargas automáticas de fichas.
- Web Analytics y Speed Insights autorizados por el propietario, dentro del plan gratuito: sin eventos personalizados ni ampliaciones de pago. Se excluyen rutas privadas y parámetros, se respeta Do Not Track y existe exclusión por navegador en Privacidad.
- Participación de los últimos 30 días en administración, calculada con reseñas existentes: primeras reseñas, personas activas y personas que regresan. No se identifica a los lectores anónimos ni se presenta una conversión entre dos sistemas incompatibles.
- JSON-LD incluye las reseñas reales con texto, autor y puntuación ponderada. Esto facilita su lectura automática; no garantiza resultados enriquecidos o indexación.
- Actualización de Next y Tailwind, eliminación del compilador antiguo de Create React App y revisión de dependencias.
- Avisos con reserva persistente y control de ejecuciones simultáneas. Comprobaciones automáticas de regresiones y dependencias en GitHub Actions.

## Base de datos y avisos

Se aplicó `supabase/migrations/20261016_v97_notification_delivery.sql`. La tabla de entregas permanece privada. Cada aviso reserva una clave antes de contactar al proveedor; una repetición no vuelve a enviarlo. Las suscripciones, recomendaciones y avisos de administración verifican identidad y permisos.

Un estado `processing` o `failed` puede representar una entrega incierta. Antes de reintentar, el administrador debe consultar los registros del proveedor de correo y comprobar si aceptó el mensaje. No borrar reservas ni lanzar envíos masivos como forma de prueba. Resolver manualmente el caso y, solo si se confirma que no se envió, preparar un reenvío controlado. SMTP no confirma que el destinatario haya leído ni recibido en su bandeja principal.

La prueba real de permisos se ejecutó dentro de una transacción revertida: creación, edición y borrado de una reseña propia, rechazo de una identidad ajena, lectura privada y exclusión de una segunda reserva. No se enviaron correos ni quedaron datos de prueba.

## Credenciales pendientes

Quitar `.env` del repositorio y mover Spotify al servidor no revoca las credenciales que estuvieron expuestas. La rotación sigue pendiente hasta que el propietario complete el cambio y guardado en los paneles. El navegador requiere intervención del usuario para cambiar credenciales.

1. Spotify for Developers → Musiclub → Basic Information → View client secret → Rotate client secret. Actualizar el valor de servidor en Vercel y, si existe, en GitHub Actions. No copiar claves a chats ni archivos del repositorio.
2. Supabase → configuración de claves: revisar las claves comprometidas y renovar/revocar las privilegiadas. Coordinar con Vercel y las tareas diarias antes de invalidar claves en uso. No cambiar el secreto JWT sin planificar el efecto sobre sesiones y claves antiguas.
3. Proveedor de correo → revocar y reemplazar la contraseña o clave SMTP expuesta. Guardarla en Vercel y GitHub Actions donde corresponda.
4. Hacer un nuevo despliegue, comprobar búsqueda y acceso a datos y probar un correo solo con destinatario autorizado. Comprobar que las claves antiguas fueron revocadas. No se declara este punto resuelto solo porque existan variables configuradas.

El mantenimiento diario comprueba la presencia de configuración; esto no demuestra que las claves estén vigentes ni que una ejecución futura vaya a terminar. No se ejecutó una sincronización de producción ni se mandaron correos de prueba durante esta actualización.

La revisión de GitHub Actions del 16 de octubre encontró solamente las cuatro variables antiguas de Spotify y Supabase público. Faltan `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_HOST`, `SMTP_USER` y `SMTP_PASS` para completar el mantenimiento y sus avisos. Preparar estas variables con las credenciales renovadas; no reutilizar las expuestas. Hasta entonces, la comprobación previa detendrá la tarea e indicará los nombres que faltan sin mostrar sus valores.

## Medición y límites

La medición empieza con esta instalación: no recupera visitas históricas. Revisar en Search Console las impresiones, clics y motivos de exclusión; en Vercel, origen de visitas y métricas de carga; en administración, primeras reseñas y retorno. Google decide cuándo rastrear e indexar. Las mejoras técnicas y las guías no sustituyen una distribución constante ni crean enlaces externos por sí mismas.

La auditoría y las capturas privadas se conservan localmente en `audit/`, fuera de Git.
