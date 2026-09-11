-- =========================================================================
-- TABLA CANÓNICA DE ARTISTAS Y DESAMBIGUACIÓN (MUSICLUB V.8.5)
-- =========================================================================
-- Esta tabla permite registrar, indexar y desambiguar de forma persistente a
-- cada artista cuando un usuario interactúa con ellos o visita su página.
-- Almacena IDs únicos oficiales (Spotify ID, MusicBrainz MBID) para prevenir
-- contaminaciones de homónimos, colaboradores concatenados o lanzamientos apócrifos/IA.

CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  spotify_id TEXT,
  mbid TEXT,
  image_url TEXT,
  genres TEXT[] DEFAULT '{}',
  followers INTEGER DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  bio TEXT,
  verified BOOLEAN DEFAULT false,
  click_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- 1. Política de Lectura Pública (cualquier usuario puede consultar artistas)
DROP POLICY IF EXISTS "Lectura publica de artistas" ON public.artists;
CREATE POLICY "Lectura publica de artistas"
  ON public.artists
  FOR SELECT
  USING (true);

-- 2. Política de Escritura Pública (para sincronización on-demand al hacer click)
DROP POLICY IF EXISTS "Escritura publica de artistas" ON public.artists;
CREATE POLICY "Escritura publica de artistas"
  ON public.artists
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices optimizados para búsquedas instantáneas
CREATE INDEX IF NOT EXISTS idx_artists_slug ON public.artists (slug);
CREATE INDEX IF NOT EXISTS idx_artists_name_lower ON public.artists (lower(name));
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON public.artists (spotify_id);
CREATE INDEX IF NOT EXISTS idx_artists_mbid ON public.artists (mbid);
CREATE INDEX IF NOT EXISTS idx_artists_click_count ON public.artists (click_count DESC);
CREATE INDEX IF NOT EXISTS idx_artists_updated_at ON public.artists (updated_at DESC);
