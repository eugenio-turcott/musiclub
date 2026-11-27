# Fechas de notificaciones

Desde V.12.3.6, la fecha visible representa la primera entrega del aviso al buzón de Musiclub. No se deriva del lanzamiento, la incorporación al catálogo, la suscripción o la reseña que originó una invitación.

`musiclub_inbox_receipts` conserva por cuenta e identidad del aviso una fecha asignada por Postgres. La inserción ignora duplicados: recargar, abrir otro dispositivo o actualizar metadatos del release no renueva esa fecha. Sólo se guardan el ID del aviso, el usuario y su fecha, sin comentarios ni notas. Las políticas permiten leer e insertar únicamente registros propios; el cliente no puede enviar ni modificar la fecha.

Los avisos existentes sin historial de entrega reciben su primera fecha registrada al entregarse con esta versión. No se reconstruyen fechas históricas a partir del release. Si no hay conexión, se conserva la fecha confirmada en el navegador y los avisos nuevos quedan sin fecha hasta recuperarla. Para visitantes sin cuenta, la primera recepción se conserva sólo en ese navegador. Los correos conservan su registro de envío independiente.

Aplicar la migración de recibos antes de publicar el código. La clave de ganador usa la entrada ganadora del Pool: editar la ficha de un álbum no vuelve a enviar ese mismo aviso.
