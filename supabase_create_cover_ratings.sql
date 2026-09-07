-- ==============================================================================
-- MUSICLUB: SISTEMA DE CALIFICACIÓN DE PORTADAS (COVER ART RATINGS)
-- ==============================================================================
-- Este script crea la infraestructura para calificar portadas de discos en Musiclub:
-- 1. Tabla public.album_covers: Contiene lo indispensable de la tabla albums para
--    apreciar y calificar portadas (album_id, album_name, artist_name, image_url, etc.)
-- 2. Población inicial automática de public.album_covers a partir de public.albums.
-- 3. Tabla public.cover_ratings: Almacena los votos individuales (1.0 a 10.0), tags estéticos y reseñas.
-- 4. Triggers para auto-sincronizar estadísticas promedio de portadas.
-- 5. Row Level Security (RLS) habilitado para lectura pública y voto comunitario.
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA: public.album_covers (Derivada de public.albums)
CREATE TABLE IF NOT EXISTS public.album_covers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL UNIQUE,
  album_name text NOT NULL,
  artist_name text NOT NULL,
  image_url text NOT NULL,
  release_type text DEFAULT 'ALBUM',
  release_year integer NULL,
  avg_cover_rating numeric(3, 1) DEFAULT 0.0,
  total_cover_votes integer DEFAULT 0,
  aesthetic_tags text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT album_covers_pkey PRIMARY KEY (id),
  CONSTRAINT album_covers_album_id_fkey FOREIGN KEY (album_id)
    REFERENCES public.albums(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_album_covers_album_id ON public.album_covers (album_id);
CREATE INDEX IF NOT EXISTS idx_album_covers_avg_rating ON public.album_covers (avg_cover_rating DESC);
CREATE INDEX IF NOT EXISTS idx_album_covers_total_votes ON public.album_covers (total_cover_votes DESC);

-- 2. POBLAR public.album_covers A PARTIR DEL CONTENIDO DE public.albums
INSERT INTO public.album_covers (
  album_id,
  album_name,
  artist_name,
  image_url,
  release_type,
  release_year
)
SELECT 
  a.id,
  COALESCE(a.album_name, 'Sin Título'),
  COALESCE(a.artist_name, 'Artista Desconocido'),
  a.image_url,
  COALESCE(a.release_type, 'ALBUM'),
  a.release_year
FROM public.albums a
WHERE a.image_url IS NOT NULL AND a.image_url <> ''
ON CONFLICT (album_id) DO UPDATE SET
  album_name = EXCLUDED.album_name,
  artist_name = EXCLUDED.artist_name,
  image_url = EXCLUDED.image_url,
  release_type = EXCLUDED.release_type,
  release_year = EXCLUDED.release_year,
  updated_at = now();

-- 3. CREACIÓN DE LA TABLA: public.cover_ratings (Calificaciones de usuarios)
CREATE TABLE IF NOT EXISTS public.cover_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL,
  album_cover_id uuid NULL,
  user_id uuid NULL,
  user_email text NULL,
  user_name text NULL,
  user_avatar text NULL,
  rating numeric(3, 1) NOT NULL,
  aesthetic_tags text[] DEFAULT '{}'::text[],
  comment text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT cover_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT cover_ratings_rating_check CHECK (rating >= 1.0 AND rating <= 10.0),
  CONSTRAINT cover_ratings_album_id_fkey FOREIGN KEY (album_id)
    REFERENCES public.albums(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT cover_ratings_album_cover_id_fkey FOREIGN KEY (album_cover_id)
    REFERENCES public.album_covers(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT cover_ratings_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT cover_ratings_album_user_unique UNIQUE (album_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_cover_ratings_album_id ON public.cover_ratings (album_id);
CREATE INDEX IF NOT EXISTS idx_cover_ratings_user_email ON public.cover_ratings (user_email);
CREATE INDEX IF NOT EXISTS idx_cover_ratings_rating ON public.cover_ratings (rating DESC);
CREATE INDEX IF NOT EXISTS idx_cover_ratings_created_at ON public.cover_ratings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cover_ratings_tags ON public.cover_ratings USING gin (aesthetic_tags);

-- 4. TRIGGER: ACTUALIZAR ESTADÍSTICAS EN album_covers AL INSERTAR / ACTUALIZAR / BORRAR
CREATE OR REPLACE FUNCTION public.fn_sync_cover_rating_stats()
RETURNS trigger AS $$
DECLARE
  v_album_id uuid;
  v_avg numeric(3, 1);
  v_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_album_id := OLD.album_id;
  ELSE
    v_album_id := NEW.album_id;
  END IF;

  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0),
    COUNT(id)
  INTO v_avg, v_count
  FROM public.cover_ratings
  WHERE album_id = v_album_id;

  UPDATE public.album_covers
  SET 
    avg_cover_rating = v_avg,
    total_cover_votes = v_count,
    updated_at = now()
  WHERE album_id = v_album_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_cover_rating_stats ON public.cover_ratings;
CREATE TRIGGER trg_sync_cover_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON public.cover_ratings
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_cover_rating_stats();

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.album_covers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_ratings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- album_covers: Lectura pública
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'album_covers' AND policyname = 'Lectura pública de album_covers') THEN
    CREATE POLICY "Lectura pública de album_covers" ON public.album_covers FOR SELECT USING (true);
  END IF;

  -- album_covers: Modificación permitida
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'album_covers' AND policyname = 'Modificación de album_covers') THEN
    CREATE POLICY "Modificación de album_covers" ON public.album_covers FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- cover_ratings: Lectura pública
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cover_ratings' AND policyname = 'Lectura pública de cover_ratings') THEN
    CREATE POLICY "Lectura pública de cover_ratings" ON public.cover_ratings FOR SELECT USING (true);
  END IF;

  -- cover_ratings: Inserción pública/autenticada
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cover_ratings' AND policyname = 'Inserción de cover_ratings') THEN
    CREATE POLICY "Inserción de cover_ratings" ON public.cover_ratings FOR INSERT WITH CHECK (true);
  END IF;

  -- cover_ratings: Actualización pública/autenticada
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cover_ratings' AND policyname = 'Actualización de cover_ratings') THEN
    CREATE POLICY "Actualización de cover_ratings" ON public.cover_ratings FOR UPDATE USING (true) WITH CHECK (true);
  END IF;

  -- cover_ratings: Eliminación pública/autenticada
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cover_ratings' AND policyname = 'Eliminación de cover_ratings') THEN
    CREATE POLICY "Eliminación de cover_ratings" ON public.cover_ratings FOR DELETE USING (true);
  END IF;
END $$;

-- 6. VISTA DE ESTADÍSTICAS AGREGADAS: public.album_cover_stats
CREATE OR REPLACE VIEW public.album_cover_stats AS
SELECT 
  a.id AS album_id,
  a.album_name,
  a.artist_name,
  a.image_url,
  COALESCE(ROUND(AVG(cr.rating)::numeric, 1), 0.0) AS avg_cover_rating,
  COUNT(cr.id) AS total_cover_votes,
  MAX(cr.created_at) AS last_rated_at
FROM public.albums a
LEFT JOIN public.cover_ratings cr ON cr.album_id = a.id
WHERE a.image_url IS NOT NULL AND a.image_url <> ''
GROUP BY a.id, a.album_name, a.artist_name, a.image_url;
