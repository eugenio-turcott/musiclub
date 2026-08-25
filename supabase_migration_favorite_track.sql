-- ==============================================================================
-- MUSICLUB: MIGRACIÓN SQL PARA SUPABASE (POSTGRESQL)
-- 1. Agregar columna 'favorite_track' a la tabla public.reviews
-- 2. Actualización masiva retroactiva de canciones favoritas en base a la
--    calificación más alta de cada review (con desempate aleatorio).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PASO 1: AGREGAR COLUMNA 'favorite_track' EN LA TABLA public.reviews
-- ------------------------------------------------------------------------------
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS favorite_track text NULL;

-- Índice para optimizar consultas por canción favorita
CREATE INDEX IF NOT EXISTS idx_reviews_favorite_track ON public.reviews (favorite_track);

-- ------------------------------------------------------------------------------
-- PASO 2: ACTUALIZACIÓN MASIVA RETROACTIVA DE TODAS LAS REVIEWS EXISTENTES
-- ------------------------------------------------------------------------------
-- Mapea cada review con la canción que tenga la mayor puntuación en track_ratings.
-- Si varias canciones comparten la misma puntuación más alta (por ejemplo varios 10s),
-- random() se encarga de desempatar de forma aleatoria.
UPDATE public.reviews r
SET favorite_track = sub.fav_track
FROM (
  SELECT DISTINCT ON (rev.id)
    rev.id,
    elem.key AS fav_track
  FROM public.reviews rev,
    LATERAL jsonb_each_text(rev.track_ratings) elem
  WHERE rev.track_ratings IS NOT NULL
    AND rev.track_ratings != '{}'::jsonb
    AND elem.value ~ '^[0-9]+(\.[0-9]+)?$'
  ORDER BY rev.id, (elem.value::numeric) DESC, random()
) sub
WHERE r.id = sub.id
  AND r.favorite_track IS NULL;
