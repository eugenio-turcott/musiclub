# Calidad y operación — V.9.20.0

## Identidad y persistencia de Portadas

Las calificaciones propias se reconocen por `user_id`. Solo los registros históricos sin ese identificador admiten coincidencia por correo normalizado, obtenida desde la tabla privada bajo las políticas existentes. El nombre visible nunca concede pertenencia. Un identificador distinto no se reemplaza por una coincidencia de correo.

La lectura pública utiliza la proyección `public_cover_ratings`. Las lecturas privadas se filtran por cuenta; las respuestas de una sesión anterior se descartan al cambiar de cuenta. No se modifica el esquema ni las políticas de Supabase.

El servidor de Supabase debe confirmar tanto el guardado como la eliminación de la fila. Un fallo muestra un mensaje y conserva la nota para volver a intentarlo; no se anuncia un guardado local como publicación. Las copias históricas de localStorage no se eliminan ni se publican automáticamente y no se cuentan como votos comunitarios.

## Comprobaciones

`npm run test:critical` incluye las pruebas de identidad, cuentas homónimas, registros antiguos, precedencia del identificador, sesión cambiada, valores inválidos y rechazos de persistencia. Los casos de borrado verifican que el filtro se aplique a una fila propia y que se confirme una fila eliminada. También comprueba que los enriquecedores de MusicBrainz no confundan títulos parciales, artistas ni ediciones.

`npm run test:browser` usa Playwright con Chromium de escritorio y móvil. El trabajo `Musiclub browser navigation checks` construye la aplicación contra un servidor de datos ficticios sin credenciales ni usuarios reales. Comprueba la estabilidad de Portadas, notas y estilos visuales, modo museo, anterior/siguiente, selección por enlace directo, búsqueda del catálogo, géneros y solicitud de sesión al publicar anónimamente. También cubre el filtro de Gashapon y sus cápsulas, la discografía local, el bloqueo de propuestas en un Pool cerrado y errores de carga de votos. Los navegadores de prueba bloquean destinos externos; el servidor de datos rechaza escrituras.

`npm run genres:audit` revisa las referencias existentes de MusicBrainz sin credenciales ni escrituras y produce un informe local en `audit/`. Separa títulos/artistas que requieren revisión, diferencias de géneros, ausencia de géneros en la fuente y fuentes no disponibles. Una diferencia no se considera automáticamente un error musical. Los enriquecedores exigen coincidencia del título y el crédito del artista antes de incorporar otro identificador; remasterizaciones explícitas son toleradas, pero no se fusionan ediciones deluxe, plus ni en vivo.

El informe de fallos de GitHub se conserva siete días y contiene exclusivamente datos ficticios. Para ejecutar estas pruebas en otra máquina, instalar primero Chromium mediante `npx playwright install chromium`. El arnés construye `.next`; reconstruir con la configuración real antes de iniciar una instancia local habitual.

## Revisión de solo lectura del 20 de octubre de 2026

- Catálogo: 426 releases, ninguno sin género y ninguno con nombres ajenos al registro; 81 géneros tienen releases. Esto no acredita la exactitud editorial de cada clasificación.
- Mantenimiento diario: ejecución 39397723398 completada correctamente.
- Actualización del registro de géneros: ejecución 39317946375 completada correctamente.
- Search Console sigue mostrando actualización del 11 de octubre: 4 páginas indexadas y 769 descubiertas sin indexar. No existe en ese informe evidencia posterior a las correcciones; no se repiten solicitudes de indexación ya aceptadas.
- Supabase muestra `Free Plan does not include project backups`. Se preparó y comprobó una copia privada manual cifrada, sin cambiar de plan. El ensayo local restauró 23 tablas y 3,514 registros con igualdad de contenido. Véase `docs/private-backups.md` para sus límites; no se restauró producción.

## Pendientes que requieren seguimiento

1. Conservar una segunda copia cifrada fuera de este equipo y guardar la clave por separado. La copia manual y el ensayo local ya están comprobados; no equivalen a una recuperación completa de todos los servicios administrados de Supabase.
2. Revisión editorial de clasificaciones específicas contra fuentes del release; no reemplazar estilos por inferencias basadas solo en el artista.
3. Comparación de Search Console cuando su informe tenga fecha posterior al despliegue y de métricas reales de carga móvil. PageSpeed devolvió HTTP 429 el 20 de octubre; no se presenta una puntuación nueva ni una mejora de tráfico o velocidad sin datos nuevos.
4. Prueba completa de cierre manual, cupos y sorteo con cuentas y Pool de prueba. Las pruebas automáticas de reglas no sustituyen esa prueba y no se utiliza el Pool activo para simular participación.
