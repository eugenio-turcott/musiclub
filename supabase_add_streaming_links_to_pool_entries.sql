-- =====================================================================================
-- MUSICLUB: AGREGAR ENLACES DE STREAMING A POOL_ENTRIES Y SINCRONIZAR DESDE ALBUMS
-- =====================================================================================
-- Ejecuta este script en Supabase Dashboard -> SQL Editor:
-- https://supabase.com/dashboard/project/nzsuxrycbywbdyidvsfl/sql

-- 1. Agregar las 4 columnas de streaming a la tabla pool_entries
ALTER TABLE public.pool_entries 
  ADD COLUMN IF NOT EXISTS spotify_link text NULL,
  ADD COLUMN IF NOT EXISTS youtube_link text NULL,
  ADD COLUMN IF NOT EXISTS apple_music_link text NULL,
  ADD COLUMN IF NOT EXISTS other_link text NULL;

-- 2. Copiar todos los links existentes desde la tabla albums hacia pool_entries
UPDATE public.pool_entries pe
SET 
  spotify_link = a.spotify_link,
  youtube_link = a.youtube_link,
  apple_music_link = a.apple_music_link,
  other_link = a.other_link
FROM public.albums a
WHERE pe.album_id = a.id;

-- 3. Comentarios descriptivos para documentación del esquema
COMMENT ON COLUMN public.pool_entries.spotify_link IS 'Enlace oficial al álbum en Spotify';
COMMENT ON COLUMN public.pool_entries.youtube_link IS 'Enlace al álbum en YouTube Music o YouTube';
COMMENT ON COLUMN public.pool_entries.apple_music_link IS 'Enlace oficial al álbum en Apple Music';
COMMENT ON COLUMN public.pool_entries.other_link IS 'Enlace al álbum en Deezer u otra plataforma';
