# Para Ti (V.9.10.0)

La clasificación activa está en `src/utils/genreRecommendations.mjs`. El perfil personal se construye con el catálogo público y el historial de la cuenta autenticada. La sección secundaria de melómanos afines utiliza únicamente las vistas públicas de reseñas y perfiles; esa información no modifica el ranking principal por géneros.

- Sin sesión o con 0–9 lanzamientos distintos calificados: recomendaciones de la comunidad. Se requiere al menos una reseña y una valoración comunitaria disponible.
- Desde 10 lanzamientos distintos con calificación válida: análisis de los géneros vinculados a esos lanzamientos. Las ediciones o filas duplicadas de un mismo lanzamiento cuentan una vez; se toma la valoración válida más reciente.
- La afinidad combina frecuencia y disfrute. Las notas altas repetidas pesan más que una única valoración. Un lanzamiento con muchos géneros reparte su evidencia entre ellos.
- Se muestra la cantidad de lanzamientos y el promedio personal de cada género. Se utiliza la normalización del registro musical compartido con el catálogo y Gashapon.
- Se excluyen los lanzamientos ya calificados, los estrenos futuros y aquellos con las valoraciones deshabilitadas. Si falta la información de géneros del historial, se utiliza la comunidad sin inventar gustos.

La selección comunitaria combina un promedio ajustado por la cantidad de reseñas (cinco opiniones de referencia con el promedio del club) y el volumen de reseñas. Utiliza la nota base sin el bono por cantidad de opiniones para evitar contar dos veces esa señal. La afinidad de género aporta el 80% del orden personalizado y la comunidad el 20%. Estos son índices de ordenación, no probabilidades de que un disco guste, y no se muestran porcentajes de compatibilidad.

Las vistas «Más reseñados» y «Buena crítica» permiten explorar otras señales. La primera ordena por reseñas dentro de Musiclub: no representa reproducciones de Spotify ni popularidad mundial. La segunda exige promedio de al menos 8/10 y pondera la evidencia de las opiniones para ordenar.

El historial personal se lee desde `reviews` mediante la sesión del usuario y la protección por fila existente, con filtro por correo. Un nombre público no identifica el historial personal. Si hay un error, se informa y se conserva una selección comunitaria; no se interpreta el error como ausencia de actividad. Los cambios de cuenta descartan la respuesta anterior.

El formulario de valoración se carga al abrirlo. Abrirlo o comprobarlo no publica una reseña; se mantiene el acceso habitual al publicar. Las pruebas cubren los límites 0/9/10, el anonimato, duplicados, ediciones, notas inválidas, afinidad por género, ausencia de metadatos y la exclusión de lanzamientos ya calificados o futuros.

Se conserva la presentación original: encabezado con resumen, pestañas Para Ti / Tu ADN Musical / Nuevos Descubrimientos, tarjetas compactas con portada lateral y ventanas de detalle y calificación. Los géneros sustituyen el resumen y el desglose técnicos. Sus gráficos siguen la identidad de Musiclub y se muestran a tamaño pequeño dentro de los paneles existentes. Se muestran seis géneros inicialmente, con opción de ver el resto. Los descubrimientos personalizados requieren diez lanzamientos calificados.
