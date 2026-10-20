# Copias privadas sin otro plan

Este procedimiento usa el acceso existente al SQL Editor y herramientas locales. No guarda claves de Supabase ni publica datos en GitHub. El respaldo se crea manualmente; no se ha programado ninguna tarea futura.

## Crear y comprobar una copia

1. Abrir el SQL Editor de Supabase con la cuenta propietaria. Ejecutar `scripts/export-private-snapshot.sql`. Es una consulta de lectura: no cambia tablas, filas ni permisos.
2. Descargar el resultado mediante **Export → Download CSV**. El contenido está codificado en base64 para transportarlo sin problemas de comillas; todavía **no está cifrado**. No compartirlo ni pegarlo en chats.
3. Ejecutar `node scripts/seal-private-backup.mjs RUTA_DEL_CSV`. Guarda un archivo AES-256-GCM en `audit/private-backups/`, una clave aleatoria de 256 bits en `audit/private-backup-keys/` y un manifiesto de conteos. En Windows limita ambas carpetas a la cuenta actual. Vuelve a leer, descifrar y validar los archivos antes de comunicar éxito.
4. Retirar únicamente las copias temporales del CSV después de comprobar el resultado. Conservar una copia cifrada en almacenamiento privado fuera del equipo y guardar la clave de recuperación por separado. Sin esa clave no se puede descifrar el respaldo.
5. Ejecutar `node scripts/verify-private-recovery.mjs RUTA_CIFRADO RUTA_CLAVE`. El ensayo crea un PostgreSQL temporal en memoria, carga todas las filas y exige igualdad JSONB exacta, reconstruye funciones, restricciones, vistas, índices, triggers y políticas públicas. No se conecta a producción ni proporciona una opción para sobrescribirla.

## Alcance y límites

Incluye las tablas públicas, `auth.users`, `auth.identities`, metadatos de Storage, columnas, restricciones, índices, funciones públicas, vistas, políticas, grants, tipos enum, secuencias y estado de RLS. Contiene información privada y registros de autenticación; el archivo cifrado y la clave deben tratarse como sensibles.

No sustituye una copia nativa completa del proyecto: excluye sesiones, MFA, configuración de proveedores, secretos y archivos binarios de Storage. Para reconstruir un proyecto administrado se necesita revisar su configuración, funciones y esquema nativos de Auth/Storage, grants y valores predeterminados de columnas. El ensayo local usa adaptadores de Auth sin sesiones reales y no acredita la entrega de correos ni el inicio de sesión en otro proyecto.

El ensayo del 20 de octubre de 2026 restauró 23 tablas y 3,514 registros con igualdad de contenido, además de 19 funciones, 102 políticas y 9 vistas. No se alteró la base de producción. Los resultados detallados se conservan únicamente junto a la copia privada. En esa extracción Storage tenía cero objetos binarios registrados.

La copia actual reside en este equipo. La protección frente a pérdida del equipo requiere una segunda copia fuera de él y la clave en un lugar separado; no se enviaron datos a otro proveedor.
