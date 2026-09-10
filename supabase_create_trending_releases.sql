-- =========================================================================
-- TABLA ROTATORIA DE TENDENCIAS Y NOVEDADES MUSICALES (MUSICLUB V.8.3)
-- =========================================================================
-- Esta tabla actúa como caché rotatorio bajo demanda (Capped Cache a ~50 filas)
-- para almacenar las tendencias globales y novedades de Spotify/ListenBrainz.
-- Evita caídas de API y permite la ingesta bajo demanda cuando un usuario
-- decide hacer clic en "Reseñar en Club".

CREATE TABLE IF NOT EXISTS public.trending_releases (
  id TEXT PRIMARY KEY,                       -- Spotify Album ID
  album_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  image_url TEXT,
  spotify_url TEXT,
  release_date TEXT,
  release_type TEXT DEFAULT 'ALBUM',         -- ALBUM, SENCILLO, EP, COMPILACION
  total_tracks INTEGER DEFAULT 1,
  genres TEXT[] DEFAULT '{}',
  popularity INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.trending_releases ENABLE ROW LEVEL SECURITY;

-- 1. Política de Lectura Pública (cualquier usuario anónimo o autenticado puede leer)
DROP POLICY IF EXISTS "Permitir lectura publica de tendencias" ON public.trending_releases;
CREATE POLICY "Permitir lectura publica de tendencias"
  ON public.trending_releases
  FOR SELECT
  USING (true);

-- 2. Política de Escritura/Actualización Pública (para sincronización de la API de Musiclub)
DROP POLICY IF EXISTS "Permitir insercion y actualizacion publica de tendencias" ON public.trending_releases;
CREATE POLICY "Permitir insercion y actualizacion publica de tendencias"
  ON public.trending_releases
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índice para ordenamiento ultra rápido por fecha
CREATE INDEX IF NOT EXISTS idx_trending_releases_release_date 
  ON public.trending_releases (release_date DESC);

-- Índice para ordenamiento por actualización
CREATE INDEX IF NOT EXISTS idx_trending_releases_updated_at 
  ON public.trending_releases (updated_at DESC);
