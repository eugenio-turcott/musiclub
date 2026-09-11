-- =========================================================================
-- TABLAS RECORD CLUB: TENDENCIAS SEMANALES, PRÓXIMOS RELEASES Y ESTADO DIARIO
-- =========================================================================

-- 1. Tabla de Tendencias Semanales (84 lanzamientos de "Popularity this week")
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

-- 2. Tabla de Próximos Releases (Upcoming releases ordenados por popularidad)
CREATE TABLE IF NOT EXISTS public.record_club_upcoming (
  id TEXT PRIMARY KEY,                       -- ID único / hash de Record Club
  album_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  image_url TEXT,
  release_date TEXT NOT NULL,                -- Fecha futura (ej. '2026-09-18')
  release_type TEXT DEFAULT 'ALBUM',         -- ALBUM, SENCILLO, EP
  total_tracks INTEGER DEFAULT 10,
  popularity_rank INTEGER NOT NULL,          -- Posición 1..50
  popularity_raw INTEGER DEFAULT 0,          -- Puntos de expectativa/popularidad
  genre TEXT DEFAULT 'POP / ALTERNATIVE',
  description TEXT,
  record_club_url TEXT,
  slug TEXT,
  artist_slug TEXT,
  can_rate BOOLEAN DEFAULT false,            -- Bloqueado hasta su estreno
  is_anticipated BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Control de Sincronización Diaria (Garantiza UNA ÚNICA consulta diaria)
CREATE TABLE IF NOT EXISTS public.record_club_sync_state (
  sync_type TEXT PRIMARY KEY,                -- 'weekly_trending' o 'upcoming'
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_date TEXT NOT NULL,            -- 'YYYY-MM-DD'
  items_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'OK',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.record_club_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_club_upcoming ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_club_sync_state ENABLE ROW LEVEL SECURITY;

-- Políticas de Lectura Pública
DROP POLICY IF EXISTS "Permitir lectura publica de record club releases" ON public.record_club_releases;
CREATE POLICY "Permitir lectura publica de record club releases" ON public.record_club_releases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica de record club upcoming" ON public.record_club_upcoming;
CREATE POLICY "Permitir lectura publica de record club upcoming" ON public.record_club_upcoming FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica de record club sync state" ON public.record_club_sync_state;
CREATE POLICY "Permitir lectura publica de record club sync state" ON public.record_club_sync_state FOR SELECT USING (true);

-- Políticas de Escritura Pública
DROP POLICY IF EXISTS "Permitir sincronizacion de record club releases" ON public.record_club_releases;
CREATE POLICY "Permitir sincronizacion de record club releases" ON public.record_club_releases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir sincronizacion de record club upcoming" ON public.record_club_upcoming;
CREATE POLICY "Permitir sincronizacion de record club upcoming" ON public.record_club_upcoming FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir sincronizacion de record club sync state" ON public.record_club_sync_state;
CREATE POLICY "Permitir sincronizacion de record club sync state" ON public.record_club_sync_state FOR ALL USING (true) WITH CHECK (true);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_record_club_releases_rank ON public.record_club_releases (trending_rank ASC);
CREATE INDEX IF NOT EXISTS idx_record_club_releases_date ON public.record_club_releases (release_date DESC);
CREATE INDEX IF NOT EXISTS idx_record_club_upcoming_rank ON public.record_club_upcoming (popularity_rank ASC);
CREATE INDEX IF NOT EXISTS idx_record_club_upcoming_date ON public.record_club_upcoming (release_date ASC);
