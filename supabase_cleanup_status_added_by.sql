-- =====================================================================================
-- MUSICLUB: LIMPIEZA TOTAL CON CASCADE Y RECONSTRUCCIÓN DE VISTAS
-- =====================================================================================
-- Este script elimina de forma segura las vistas dependientes como 'album_stats',
-- remueve las columnas 'status', 'added_by' y 'added_by_email' con CASCADE,
-- y reconstruye la vista 'album_stats' adaptada al nuevo catálogo canónico.
-- =====================================================================================

-- 1. Eliminar vistas y dependencias que usaban 'status'
DROP VIEW IF EXISTS public.album_stats CASCADE;
ALTER TABLE IF EXISTS public.albums DROP CONSTRAINT IF EXISTS albums_status_check;
DROP INDEX IF EXISTS public.idx_albums_status;

-- 2. Eliminar las columnas obsoletas usando CASCADE
ALTER TABLE public.albums
  DROP COLUMN IF EXISTS added_by CASCADE,
  DROP COLUMN IF EXISTS added_by_email CASCADE,
  DROP COLUMN IF EXISTS status CASCADE;

-- 3. Asegurar que las columnas canónicas de MusicBrainz y Streaming existan
ALTER TABLE public.albums
  ADD COLUMN IF NOT EXISTS mbid character varying(64) NULL,
  ADD COLUMN IF NOT EXISTS release_type character varying(50) NULL DEFAULT 'ALBUM',
  ADD COLUMN IF NOT EXISTS genres text[] NULL,
  ADD COLUMN IF NOT EXISTS label character varying(255) NULL,
  ADD COLUMN IF NOT EXISTS country character varying(10) NULL,
  ADD COLUMN IF NOT EXISTS barcode character varying(50) NULL,
  ADD COLUMN IF NOT EXISTS total_tracks integer NULL,
  ADD COLUMN IF NOT EXISTS spotify_link text NULL,
  ADD COLUMN IF NOT EXISTS youtube_link text NULL,
  ADD COLUMN IF NOT EXISTS apple_music_link text NULL,
  ADD COLUMN IF NOT EXISTS other_link text NULL,
  ADD COLUMN IF NOT EXISTS tracks jsonb NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS spotify_verified boolean NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reviews_enabled boolean NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS release_date character varying(50) NULL,
  ADD COLUMN IF NOT EXISTS release_year integer NULL;

-- 4. Reconstruir la vista 'album_stats' con el nuevo modelo universal
CREATE OR REPLACE VIEW public.album_stats AS
SELECT 
  a.id,
  a.album_name,
  a.artist_name,
  a.image_url,
  a.mbid,
  a.release_date,
  a.release_year,
  a.release_type,
  a.genres,
  a.label,
  a.country,
  a.barcode,
  a.total_tracks,
  a.spotify_link,
  a.youtube_link,
  a.apple_music_link,
  a.other_link,
  a.created_at,
  COUNT(r.id)::integer AS review_count,
  ROUND(COALESCE(AVG(r.rating_general), 0)::numeric, 2) AS avg_rating,
  ROUND(COALESCE(AVG(r.rating_general), 0)::numeric, 1) AS final_rating
FROM public.albums a
LEFT JOIN public.reviews r ON a.id = r.album_id
GROUP BY a.id;

-- 5. Crear índices para búsquedas ultra rápidas
CREATE INDEX IF NOT EXISTS idx_albums_mbid ON public.albums(mbid);
CREATE INDEX IF NOT EXISTS idx_albums_release_type ON public.albums(release_type);
CREATE INDEX IF NOT EXISTS idx_albums_release_year ON public.albums(release_year);
CREATE INDEX IF NOT EXISTS idx_albums_label ON public.albums(label);
CREATE INDEX IF NOT EXISTS idx_albums_album_name_lower ON public.albums(lower(album_name));
CREATE INDEX IF NOT EXISTS idx_albums_artist_name_lower ON public.albums(lower(artist_name));

-- 6. Blindar la integridad de reseñas (SET NULL en cascada de eliminación)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'albums_user_id_fkey' AND table_name = 'albums'
  ) THEN
    ALTER TABLE public.albums DROP CONSTRAINT albums_user_id_fkey;
  END IF;
  
  ALTER TABLE public.albums
    ADD CONSTRAINT albums_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
END $$;
