-- ==============================================================================
-- MUSICLUB: MIGRACIÓN SQL PARA SUPABASE (POSTGRESQL)
-- 1. Sentimiento / Emoción en Reseñas de Álbumes ("¿Cómo te hizo sentir el álbum?")
-- 2. Sistema de Recomendación de Playlists (Spotify, Apple Music, YouTube Music)
--    con Votación Binaria (Sí/No) y Porcentaje de Aprobación.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PARTE 1: AGREGAR COLUMNA 'feeling' EN LA TABLA public.reviews
-- ------------------------------------------------------------------------------
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS feeling text NULL;

-- Asignación retroactiva de emociones para las reseñas existentes que no tienen valor
-- Mapeo basado en los 7 emojis oficiales de Musiclub:
-- 1. 🤩 'Eufórico / Asombrado' (≥ 9.3)
-- 2. 😊 'Inspirado / Feliz' (8.3 - 9.2)
-- 3. 😌 'Relajado / Conectado' (7.3 - 8.2)
-- 4. 🤔 'Intrigado / Reflexivo' (6.0 - 7.2)
-- 5. 😐 'Indiferente / Aburrido' (4.2 - 5.9)
-- 6. 🤢 'Desagrado / Asco' (< 4.2)
UPDATE public.reviews
SET feeling = CASE
  WHEN (COALESCE(rating_general, 5) >= 9.3) THEN 'Eufórico / Asombrado'
  WHEN (COALESCE(rating_general, 5) >= 8.3) THEN 'Inspirado / Feliz'
  WHEN (COALESCE(rating_general, 5) >= 7.3) THEN 'Relajado / Conectado'
  WHEN (COALESCE(rating_general, 5) >= 6.0) THEN 'Intrigado / Reflexivo'
  WHEN (COALESCE(rating_general, 5) >= 4.2) THEN 'Indiferente / Aburrido'
  ELSE 'Desagrado / Asco'
END
WHERE feeling IS NULL;


-- ------------------------------------------------------------------------------
-- PARTE 2: CREACIÓN DE TABLA DE PLAYLISTS RECOMENDADAS (public.playlists)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying(255) NOT NULL,
  curator_name character varying(255) NULL,
  description text NULL,
  image_url text NULL,
  spotify_link text NULL,
  apple_music_link text NULL,
  youtube_music_link text NULL,
  other_link text NULL,
  genre_or_mood character varying(100) NULL,
  added_by character varying(255) NOT NULL,
  added_by_email character varying(255) NOT NULL,
  user_id uuid NULL,
  created_at timestamp with time zone DEFAULT now(),
  constraint playlists_pkey primary key (id),
  constraint playlists_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null
);

-- Índices de búsqueda para playlists
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON public.playlists (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_genre_or_mood ON public.playlists (genre_or_mood);
CREATE INDEX IF NOT EXISTS idx_playlists_added_by_email ON public.playlists (added_by_email);


-- ------------------------------------------------------------------------------
-- PARTE 3: CREACIÓN DE TABLA DE RESEÑAS / VOTOS BINARIOS (public.playlist_reviews)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.playlist_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL,
  reviewer_name character varying(255) NOT NULL,
  reviewer_email character varying(255) NOT NULL,
  user_id uuid NULL,
  liked boolean NOT NULL,
  comment text NULL,
  created_at timestamp with time zone DEFAULT now(),
  constraint playlist_reviews_pkey primary key (id),
  constraint playlist_reviews_playlist_id_fkey foreign key (playlist_id) references public.playlists(id) on delete cascade,
  constraint playlist_reviews_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null,
  constraint unique_playlist_reviewer unique (playlist_id, reviewer_email)
);

-- Índices para optimizar el cálculo de porcentaje de aprobación
CREATE INDEX IF NOT EXISTS idx_playlist_reviews_playlist_id ON public.playlist_reviews (playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_reviews_reviewer_email ON public.playlist_reviews (reviewer_email);


-- ------------------------------------------------------------------------------
-- PARTE 4: POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para public.playlists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlists' AND policyname = 'Permitir lectura publica de playlists') THEN
    CREATE POLICY "Permitir lectura publica de playlists" ON public.playlists FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlists' AND policyname = 'Permitir insercion de playlists') THEN
    CREATE POLICY "Permitir insercion de playlists" ON public.playlists FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlists' AND policyname = 'Permitir actualizacion de playlists') THEN
    CREATE POLICY "Permitir actualizacion de playlists" ON public.playlists FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlists' AND policyname = 'Permitir eliminacion de playlists') THEN
    CREATE POLICY "Permitir eliminacion de playlists" ON public.playlists FOR DELETE USING (true);
  END IF;
END $$;

-- Políticas para public.playlist_reviews
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_reviews' AND policyname = 'Permitir lectura publica de votos de playlists') THEN
    CREATE POLICY "Permitir lectura publica de votos de playlists" ON public.playlist_reviews FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_reviews' AND policyname = 'Permitir votar playlists') THEN
    CREATE POLICY "Permitir votar playlists" ON public.playlist_reviews FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_reviews' AND policyname = 'Permitir actualizar voto de playlist') THEN
    CREATE POLICY "Permitir actualizar voto de playlist" ON public.playlist_reviews FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_reviews' AND policyname = 'Permitir eliminar voto de playlist') THEN
    CREATE POLICY "Permitir eliminar voto de playlist" ON public.playlist_reviews FOR DELETE USING (true);
  END IF;
END $$;
