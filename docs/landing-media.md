# Recursos de la landing

La tornamesa, las cápsulas y las demostraciones usan los vinilos, motivos, estados de ánimo, insignias y logos propios de Musiclub. Las portadas y reseñas proceden de la instantánea pública del catálogo. Se seleccionan hasta diez releases distintos con reseñas, una vez por visita, sin escribir datos ni consultar de nuevo al cambiar de ejemplo.

## En el radar

Los tres recursos `public/editorial/*-canva-v3.webp` corresponden, en orden, a las páginas 1–3 del diseño [RECURSO · Musiclub · En el radar · Diseños originales](https://www.canva.com/design/DAHYrY9oQc4/JFQClAXxl4xd8Uqa5xJzeA/edit), versión 114, exportado el 6 de noviembre de 2026. Las exportaciones originales de 1600 × 640 se convierten a WebP sin alterar su composición. Las rutas versionadas evitan mostrar la exportación anterior desde la caché del navegador.

## Tornamesa integrada

El nombre, artista y portada del release aparecen en la pantalla digital del equipo. La calificación y el estado de ánimo ocupan el panel inferior; las miniaturas y los controles para cambiar de disco forman parte del mismo chasis. La aguja funciona con clic, teclado y arrastre direccional. El motor y el visualizador son una simulación visual local, sin reproducción de canciones ni consultas a proveedores musicales.

La versión 11.1.1 retira el servicio de fragmentos, sus clientes, sus validadores y el distintivo de iTunes. La selección de diez discos con reseñas sigue utilizando los registros públicos ya cargados. Cambiar de disco o mover la aguja no hace nuevas lecturas de datos.

El botón FX permite activar pequeños destellos sonoros sintetizados mediante Web Audio. Está apagado por defecto; no se crea ningún contexto de audio antes de que la persona lo active. Cada efecto termina en menos de medio segundo y sus nodos se desconectan al acabar. Silenciar FX, ocultar la pestaña o desmontar la tornamesa cierra el contexto. No se descargan archivos de sonido ni se reproducen bucles. Las animaciones respetan la pausa de la landing, la salida de pantalla y la preferencia de movimiento reducido.
