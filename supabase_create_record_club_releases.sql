-- =========================================================================
-- TABLA DE LANZAMIENTOS DE RECORD CLUB (POPULARITY THIS WEEK)
-- =========================================================================
-- Almacena el snapshot de los 84 lanzamientos semanales sincronizados con
-- Record Club para que Musiclub consulte directamente desde Supabase sin
-- saturar la API externa de Record Club ni depender de peticiones repetitivas.

CREATE TABLE IF NOT EXISTS public.record_club_releases (
  id TEXT PRIMARY KEY,                       -- ID único / hash de Record Club
  album_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  image_url TEXT,
  release_date TEXT,
  release_type TEXT DEFAULT 'ALBUM',         -- ALBUM, SENCILLO, EP, COMPILACION
  total_tracks INTEGER DEFAULT 12,
  trending_rank INTEGER NOT NULL,            -- Posición 1..84
  popularity_raw INTEGER DEFAULT 0,          -- Puntos de la semana (ej. 442)
  popularity_this_week TEXT,                 -- Etiqueta de popularidad (ej. '442 pts')
  genre_category TEXT DEFAULT 'POP / ALTERNATIVE',
  badge TEXT,
  hit_track TEXT,
  is_new BOOLEAN DEFAULT false,
  record_club_url TEXT,
  slug TEXT,
  artist_slug TEXT,
  spotify_id TEXT,
  spotify_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.record_club_releases ENABLE ROW LEVEL SECURITY;

-- 1. Política de Lectura Pública (cualquier usuario anónimo o autenticado puede consultar)
DROP POLICY IF EXISTS "Permitir lectura publica de record club releases" ON public.record_club_releases;
CREATE POLICY "Permitir lectura publica de record club releases"
  ON public.record_club_releases
  FOR SELECT
  USING (true);

-- 2. Política de Escritura Pública (para sincronización periódica desde Musiclub)
DROP POLICY IF EXISTS "Permitir insercion y actualizacion de record club releases" ON public.record_club_releases;
CREATE POLICY "Permitir insercion y actualizacion de record club releases"
  ON public.record_club_releases
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices para consultas ultra rápidas
CREATE INDEX IF NOT EXISTS idx_record_club_releases_rank 
  ON public.record_club_releases (trending_rank ASC);

CREATE INDEX IF NOT EXISTS idx_record_club_releases_date 
  ON public.record_club_releases (release_date DESC);

CREATE INDEX IF NOT EXISTS idx_record_club_releases_genre 
  ON public.record_club_releases (genre_category);

CREATE INDEX IF NOT EXISTS idx_record_club_releases_updated 
  ON public.record_club_releases (updated_at DESC);
