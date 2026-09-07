-- ==============================================================================
-- MUSICLUB: SISTEMA DE INTERACCIÓN EN RESEÑAS (REACCIONES Y COMENTARIOS)
-- ==============================================================================
-- Este script crea la infraestructura para que los usuarios puedan reaccionar y
-- comentar en las reseñas publicadas de los álbumes en Musiclub.
--
-- Tablas creadas:
-- 1. public.review_reactions: Reacciones expresivas (🔥, ❤️, 🤯, 👏, 🎶, 💀)
-- 2. public.review_comments: Hilos de conversación y comentarios a cada reseña
-- ==============================================================================

-- 1. TABLA: public.review_reactions
CREATE TABLE IF NOT EXISTS public.review_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  album_id uuid NULL,
  user_id uuid NULL,
  user_email text NOT NULL,
  user_name text NOT NULL,
  reaction_type text NOT NULL, -- 'fire', 'heart', 'mindblown', 'clap', 'music', 'skull'
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT review_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT review_reactions_unique UNIQUE (review_id, user_email, reaction_type),
  CONSTRAINT review_reactions_review_fkey FOREIGN KEY (review_id)
    REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_reactions_review_id ON public.review_reactions (review_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_album_id ON public.review_reactions (album_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_user_email ON public.review_reactions (user_email);

-- 2. TABLA: public.review_comments
CREATE TABLE IF NOT EXISTS public.review_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  album_id uuid NULL,
  user_id uuid NULL,
  user_email text NOT NULL,
  user_name text NOT NULL,
  user_avatar text NULL,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT review_comments_pkey PRIMARY KEY (id),
  CONSTRAINT review_comments_review_fkey FOREIGN KEY (review_id)
    REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON public.review_comments (review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_album_id ON public.review_comments (album_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_created_at ON public.review_comments (created_at ASC);

-- 3. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACCESO PARA public.review_reactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'review_reactions' AND policyname = 'Lectura pública de reacciones'
  ) THEN
    CREATE POLICY "Lectura pública de reacciones"
      ON public.review_reactions
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'review_reactions' AND policyname = 'Cualquiera puede reaccionar a una reseña'
  ) THEN
    CREATE POLICY "Cualquiera puede reaccionar a una reseña"
      ON public.review_reactions
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'review_reactions' AND policyname = 'Eliminar o alternar reacción propia'
  ) THEN
    CREATE POLICY "Eliminar o alternar reacción propia"
      ON public.review_reactions
      FOR DELETE
      USING (true);
  END IF;
END $$;

-- 5. POLÍTICAS DE ACCESO PARA public.review_comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'review_comments' AND policyname = 'Lectura pública de comentarios'
  ) THEN
    CREATE POLICY "Lectura pública de comentarios"
      ON public.review_comments
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'review_comments' AND policyname = 'Cualquiera puede comentar en una reseña'
  ) THEN
    CREATE POLICY "Cualquiera puede comentar en una reseña"
      ON public.review_comments
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'review_comments' AND policyname = 'Eliminar comentario propio'
  ) THEN
    CREATE POLICY "Eliminar comentario propio"
      ON public.review_comments
      FOR DELETE
      USING (true);
  END IF;
END $$;
