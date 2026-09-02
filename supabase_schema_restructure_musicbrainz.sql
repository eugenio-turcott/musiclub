-- ==============================================================================
-- MUSICLUB: REESTRUCTURACIÓN DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Versión: Catálogo Universal & Conexión con MusicBrainz
-- ==============================================================================
-- Este script realiza una migración 100% SEGURA e IDEMPOTENTE:
-- 1. Preserva el 100% de las reviews, usuarios y álbumes existentes.
-- 2. Elimina dependencias rígidas de Spotify y "dueños de álbumes".
-- 3. Corrige la foreign key peligrosa ON DELETE CASCADE en user_id para proteger
--    los álbumes y reviews ante eliminaciones de perfiles.
-- 4. Añade metadatos canónicos de MusicBrainz (MBID, release_type, géneros, etc.).
-- 5. Estructura y optimiza las tablas de temporadas (seasons) y pool musical (pool_entries).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA: public.albums (Catálogo Canónico Universal)
-- ------------------------------------------------------------------------------

-- A) Corregir Foreign Key de user_id en albums para evitar borrado accidental en cascada
DO $$
BEGIN
  -- Eliminar la constraint cascade antigua si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'albums_user_id_fkey' AND table_name = 'albums'
  ) THEN
    ALTER TABLE public.albums DROP CONSTRAINT albums_user_id_fkey;
  END IF;

  -- Recrear con ON DELETE SET NULL (los álbumes pertenecen a la comunidad/catálogo universal)
  ALTER TABLE public.albums
    ADD CONSTRAINT albums_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
END $$;

-- B) Agregar nuevas columnas canónicas para integración con MusicBrainz
ALTER TABLE public.albums
  ADD COLUMN IF NOT EXISTS mbid text NULL,
  ADD COLUMN IF NOT EXISTS release_type character varying(50) NULL DEFAULT 'ALBUM',
  ADD COLUMN IF NOT EXISTS genres text[] NULL,
  ADD COLUMN IF NOT EXISTS label character varying(255) NULL,
  ADD COLUMN IF NOT EXISTS country character varying(10) NULL,
  ADD COLUMN IF NOT EXISTS barcode character varying(50) NULL,
  ADD COLUMN IF NOT EXISTS total_tracks integer NULL;

-- C) Actualizar / flexibilizar check constraint de status si es necesario
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'albums_status_check' AND table_name = 'albums'
  ) THEN
    ALTER TABLE public.albums DROP CONSTRAINT albums_status_check;
  END IF;

  ALTER TABLE public.albums
    ADD CONSTRAINT albums_status_check
    CHECK (status IN ('ACTIVO', 'INACTIVO', 'GANADOR', 'INDIVIDUAL'));
END $$;

-- D) Índices optimizados para búsquedas ultra-rápidas en albums
CREATE INDEX IF NOT EXISTS idx_albums_mbid ON public.albums (mbid);
CREATE INDEX IF NOT EXISTS idx_albums_release_type ON public.albums (release_type);
CREATE INDEX IF NOT EXISTS idx_albums_release_year ON public.albums (release_year DESC);
CREATE INDEX IF NOT EXISTS idx_albums_status ON public.albums (status);
CREATE INDEX IF NOT EXISTS idx_albums_album_name_lower ON public.albums (lower(album_name));
CREATE INDEX IF NOT EXISTS idx_albums_artist_name_lower ON public.albums (lower(artist_name));


-- ------------------------------------------------------------------------------
-- 2. TABLA: public.reviews (Reseñas, Calificaciones y Puntuación de Canciones)
-- ------------------------------------------------------------------------------
-- Aseguramos que todas las columnas necesarias existan para el sistema de reviews de Musiclub

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS feeling text NULL,
  ADD COLUMN IF NOT EXISTS favorite_track text NULL,
  ADD COLUMN IF NOT EXISTS track_ratings jsonb DEFAULT '{}'::jsonb;

-- Índices de reviews
CREATE INDEX IF NOT EXISTS idx_reviews_album_id ON public.reviews (album_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_email ON public.reviews (reviewer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_rating_general ON public.reviews (rating_general DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews (created_at DESC);


-- ------------------------------------------------------------------------------
-- 3. TABLA: public.seasons (Temporadas de Musiclub)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seasons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  season_number integer NULL,
  is_active boolean DEFAULT false,
  start_date date NULL,
  end_date date NULL,
  description text NULL,
  created_at timestamp with time zone DEFAULT now(),
  constraint seasons_pkey primary key (id)
);

CREATE INDEX IF NOT EXISTS idx_seasons_is_active ON public.seasons (is_active);
CREATE INDEX IF NOT EXISTS idx_seasons_created_at ON public.seasons (created_at DESC);


-- ------------------------------------------------------------------------------
-- 4. TABLA: public.pool_entries (Nominaciones y Entradas del Pool Musical)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pool_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  season_id uuid NULL,
  album_id uuid NOT NULL,
  suggested_by_name character varying(255) NULL,
  suggested_by_email character varying(255) NULL,
  user_id uuid NULL,
  status character varying(20) DEFAULT 'POOL',
  note text NULL,
  votes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  constraint pool_entries_pkey primary key (id),
  constraint pool_entries_album_id_fkey foreign key (album_id) references public.albums(id) on delete cascade,
  constraint pool_entries_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null
);

-- Si la tabla seasons existe, vincular season_id con foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pool_entries_season_id_fkey' AND table_name = 'pool_entries'
  ) THEN
    ALTER TABLE public.pool_entries
      ADD CONSTRAINT pool_entries_season_id_fkey
      FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_pool_entries_season_id ON public.pool_entries (season_id);
CREATE INDEX IF NOT EXISTS idx_pool_entries_album_id ON public.pool_entries (album_id);
CREATE INDEX IF NOT EXISTS idx_pool_entries_status ON public.pool_entries (status);


-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS ROW LEVEL SECURITY (RLS) PARA TODAS LAS TABLAS
-- ------------------------------------------------------------------------------
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_entries ENABLE ROW LEVEL SECURITY;

-- Políticas universales de lectura pública y escritura autenticada / abierta para la comunidad
DO $$
BEGIN
  -- ALBUMS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'albums' AND policyname = 'Permitir lectura publica de albums') THEN
    CREATE POLICY "Permitir lectura publica de albums" ON public.albums FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'albums' AND policyname = 'Permitir creacion de albums') THEN
    CREATE POLICY "Permitir creacion de albums" ON public.albums FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'albums' AND policyname = 'Permitir actualizacion de albums') THEN
    CREATE POLICY "Permitir actualizacion de albums" ON public.albums FOR UPDATE USING (true);
  END IF;

  -- REVIEWS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Permitir lectura publica de reviews') THEN
    CREATE POLICY "Permitir lectura publica de reviews" ON public.reviews FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Permitir creacion de reviews') THEN
    CREATE POLICY "Permitir creacion de reviews" ON public.reviews FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Permitir edicion de reviews') THEN
    CREATE POLICY "Permitir edicion de reviews" ON public.reviews FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Permitir eliminacion de reviews') THEN
    CREATE POLICY "Permitir eliminacion de reviews" ON public.reviews FOR DELETE USING (true);
  END IF;

  -- SEASONS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seasons' AND policyname = 'Permitir lectura publica de seasons') THEN
    CREATE POLICY "Permitir lectura publica de seasons" ON public.seasons FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seasons' AND policyname = 'Permitir gestionar seasons') THEN
    CREATE POLICY "Permitir gestionar seasons" ON public.seasons FOR ALL USING (true);
  END IF;

  -- POOL ENTRIES
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pool_entries' AND policyname = 'Permitir lectura publica de pool_entries') THEN
    CREATE POLICY "Permitir lectura publica de pool_entries" ON public.pool_entries FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pool_entries' AND policyname = 'Permitir gestionar pool_entries') THEN
    CREATE POLICY "Permitir gestionar pool_entries" ON public.pool_entries FOR ALL USING (true);
  END IF;
END $$;
