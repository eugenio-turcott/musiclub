-- Migración para añadir soporte completo de Deezer en el Buzón Musical
-- Ejecutar en Supabase SQL Editor si aún no existen las columnas:

ALTER TABLE song_recommendations 
ADD COLUMN IF NOT EXISTS deezer_link text;

ALTER TABLE song_recommendations 
ADD COLUMN IF NOT EXISTS other_link text;

-- Comentario informativo
COMMENT ON COLUMN song_recommendations.deezer_link IS 'Enlace directo o de búsqueda a la pista en Deezer';
COMMENT ON COLUMN song_recommendations.other_link IS 'Enlace alternativo o a Deezer para compatibilidad';
