# Recursos de la landing

La tornamesa, las cápsulas y las demostraciones usan los vinilos, motivos, estados de ánimo, insignias y logos propios de Musiclub. Las portadas y reseñas proceden de la instantánea pública del catálogo. Se seleccionan hasta diez releases distintos con reseñas, una vez por visita, sin escribir datos ni consultar de nuevo al cambiar de ejemplo.

## En el radar

Los tres recursos `public/editorial/*-canva-v3.webp` corresponden, en orden, a las páginas 1–3 del diseño [RECURSO · Musiclub · En el radar · Diseños originales](https://www.canva.com/design/DAHYrY9oQc4/JFQClAXxl4xd8Uqa5xJzeA/edit), versión 114, exportado el 6 de noviembre de 2026. Las exportaciones originales de 1600 × 640 se convierten a WebP sin alterar su composición. Las rutas versionadas evitan mostrar la exportación anterior desde la caché del navegador.

## Tornamesa integrada

El nombre, artista y portada del release aparecen en el panel del equipo, usando Gabarito, la tipografía oficial. La tornamesa tiene un chasis horizontal, sin inclinación, plato metálico, contrapeso, aguja y patas. La calificación y el estado de ánimo ocupan el panel inferior; las miniaturas y los controles para cambiar de disco aparecen debajo del tocadiscos. La aguja funciona con clic, teclado y arrastre direccional. El disco y su centro forman una única pieza que gira desde el inicio. Levantar la aguja detiene el giro; las pausas por visibilidad conservan la posición elegida. El motor y el visualizador son una simulación visual local, sin reproducción de canciones ni consultas a proveedores musicales.

La versión 11.1.1 retira el servicio de fragmentos, sus clientes, sus validadores y el distintivo de iTunes. La selección de diez discos con reseñas sigue utilizando los registros públicos ya cargados. Cambiar de disco o mover la aguja no hace nuevas lecturas de datos.

El botón FX permite activar pequeños destellos sonoros sintetizados mediante Web Audio. Está apagado por defecto; no se crea ningún contexto de audio antes de que la persona lo active. Cada efecto termina en menos de medio segundo y sus nodos se desconectan al acabar. Silenciar FX, ocultar la pestaña o desmontar la tornamesa cierra el contexto. No se descargan archivos de sonido ni se reproducen bucles. Las animaciones respetan la pausa de la landing, la salida de pantalla y la preferencia de movimiento reducido.

## Descubrimiento y XP

Descubrir muestra únicamente una animación compacta del vinilo con `GashaponReveal`, el mismo recurso visual del Gashapon real. Recorre diez releases reseñados elegidos por visita. Espera dos segundos, abre la cápsula y muestra el release durante tres segundos antes de pasar al siguiente. Los temporizadores se detienen al salir de pantalla, pausar o desmontar. El movimiento reducido muestra un release estático. No usa las consultas, el sorteo ni el guardado del Gashapon real.

La explicación de XP toma los valores de `XP_CONFIG` y el número de niveles de `MELOMANO_LEVELS`. Distingue actividad, recompensas acumuladas por tiers y bonos de coronas mientras se conserva el récord.
