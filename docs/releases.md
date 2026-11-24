# Versiones y publicaciones

## Cada cambio

1. El título del commit es exactamente `Musiclub Updates - V.X.X.X`, con la versión de `package.json`. El cuerpo explica el cambio y su validación.
2. Registra los cambios del producto en `CURATED_PATCH_NOTES`, dentro de `src/data/patchNotesData.js`. El historial detallado queda interno; el navegador no convierte commits en publicaciones.
3. Prepara en el índice sólo los archivos del cambio. Ejecuta `npm run docs:update` y añade `README.md` y `src/data/publicReleases.json`. La revisión generada usa el índice de Git para excluir trabajo ajeno sin preparar.
4. Ejecuta `npm run docs:check`, las pruebas correspondientes y publica el commit. La integración continua rechaza documentación desactualizada.

Los mantenimientos automáticos también regeneran el README. No crean un Release por cada actualización.

## Una versión mayor

La página pública contiene una entrada por `V.X`, con un resumen editorial de la etapa. `src/data/majorReleaseSummaries.json` reúne lo principal; no es una lista de cada arreglo menor. Los filtros se generan a partir de las versiones existentes.

Sólo un tag `vX.0.0` puede generar un GitHub Release oficial:

```sh
node scripts/generate-release-body.mjs v13.0.0
```

El generador rechaza versiones menores, inexistentes y sin resumen preparado. Nunca utiliza otra versión como alternativa. El tag señala el commit que inició la versión mayor; no se mueven tags publicados para actualizar su resumen. Las mejoras posteriores se consolidan en la misma entrada.

## Historial e identidad

Los commits y tags anteriores se conservan. Reescribir títulos o autores publicados cambia sus identificadores y necesita una decisión explícita. El correo de los nuevos commits debe pertenecer a `eugenio-turcott`; puede usarse su dirección `noreply` verificada.

GitHub agrupa contribuidores por los correos asociados a cada cuenta. Para reunir una segunda cuenta personal sin reescribir Git, el propietario debe trasladar sus correos históricos a la cuenta principal desde la configuración de GitHub. `.mailmap` por sí solo no garantiza que desaparezca una cuenta del recuadro de contribuidores.
