-- ==============================================================================
-- MIGRACIÓN SUPABASE: ELIMINAR COLUMNA user_id DE LA TABLA albums
-- ==============================================================================
-- Ejecuta este script en el SQL Editor del panel de Supabase:
-- https://supabase.com/dashboard/project/nzsuxrycbywbdyidvsfl/sql

DO $$
BEGIN
    -- 1. Eliminar la Foreign Key constraint si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'albums_user_id_fkey' AND table_name = 'albums'
    ) THEN
        ALTER TABLE public.albums DROP CONSTRAINT albums_user_id_fkey;
        RAISE NOTICE 'Constraint albums_user_id_fkey eliminada.';
    END IF;

    -- 2. Eliminar índice si existe
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'albums' AND indexname = 'idx_albums_user_id'
    ) THEN
        DROP INDEX idx_albums_user_id;
        RAISE NOTICE 'Índice idx_albums_user_id eliminado.';
    END IF;

    -- 3. Eliminar la columna user_id de la tabla albums
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'albums' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.albums DROP COLUMN user_id;
        RAISE NOTICE 'Columna user_id eliminada con éxito de la tabla albums.';
    ELSE
        RAISE NOTICE 'La columna user_id no existe en la tabla albums.';
    END IF;
END $$;
