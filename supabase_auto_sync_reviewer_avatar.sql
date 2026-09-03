-- =====================================================================================
-- MUSICLUB: SINCRONIZACIÓN AUTOMÁTICA DE AVATARES DE REVIEWERS (PUBLIC.REVIEWS)
-- =====================================================================================
-- Este script soluciona de forma definitiva el problema de 'reviewer_avatar: null':
-- 1. Actualiza de inmediato todas las reviews históricas existentes en la base de datos
--    cruzando por email (o por nombre) con la tabla 'public.profiles'.
-- 2. Crea un TRIGGER automático (BEFORE INSERT OR UPDATE) en 'public.reviews' para que
--    CUALQUIER nueva reseña obtenga en automático el avatar del usuario desde 'public.profiles'.
-- 3. Crea un TRIGGER automático (AFTER UPDATE) en 'public.profiles' para que si un usuario
--    cambia su foto de perfil, todas sus reseñas pasadas se actualicen automáticamente.
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- PASO 1: BACKFILL HISTÓRICO (Actualizar todas las reseñas pasadas con avatar null)
-- -------------------------------------------------------------------------------------

-- A) Actualizar por coincidencia de email (insensible a mayúsculas y espacios)
UPDATE public.reviews r
SET reviewer_avatar = p.avatar_url
FROM public.profiles p
WHERE LOWER(TRIM(r.reviewer_email)) = LOWER(TRIM(p.email))
  AND p.avatar_url IS NOT NULL
  AND (r.reviewer_avatar IS NULL OR TRIM(r.reviewer_avatar) = '');

-- B) Actualizar por coincidencia de nombre (fallback si el email no coincidió)
UPDATE public.reviews r
SET reviewer_avatar = p.avatar_url
FROM public.profiles p
WHERE LOWER(TRIM(r.reviewer_name)) = LOWER(TRIM(p.name))
  AND p.avatar_url IS NOT NULL
  AND (r.reviewer_avatar IS NULL OR TRIM(r.reviewer_avatar) = '');


-- -------------------------------------------------------------------------------------
-- PASO 2: FUNCIÓN Y TRIGGER PARA AUTOLLENAR 'reviewer_avatar' EN NUEVAS RESEÑAS
-- -------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auto_fill_reviewer_avatar()
RETURNS TRIGGER AS $$
DECLARE
  matched_avatar text;
BEGIN
  -- Si no se proporcionó reviewer_avatar o viene vacío, lo buscamos en profiles
  IF NEW.reviewer_avatar IS NULL OR TRIM(NEW.reviewer_avatar) = '' THEN
    
    -- 1. Intentar buscar por reviewer_email
    IF NEW.reviewer_email IS NOT NULL AND TRIM(NEW.reviewer_email) <> '' THEN
      SELECT avatar_url INTO matched_avatar
      FROM public.profiles
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.reviewer_email))
        AND avatar_url IS NOT NULL
      LIMIT 1;
    END IF;

    -- 2. Si no se encontró por email, intentar buscar por reviewer_name
    IF matched_avatar IS NULL AND NEW.reviewer_name IS NOT NULL AND TRIM(NEW.reviewer_name) <> '' THEN
      SELECT avatar_url INTO matched_avatar
      FROM public.profiles
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.reviewer_name))
        AND avatar_url IS NOT NULL
      LIMIT 1;
    END IF;

    -- Asignar el avatar si fue encontrado
    IF matched_avatar IS NOT NULL THEN
      NEW.reviewer_avatar := matched_avatar;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger previo si existía para evitar duplicados
DROP TRIGGER IF EXISTS trg_auto_fill_reviewer_avatar ON public.reviews;

-- Crear el Trigger antes de insertar o actualizar en public.reviews
CREATE TRIGGER trg_auto_fill_reviewer_avatar
BEFORE INSERT OR UPDATE OF reviewer_email, reviewer_name, reviewer_avatar
ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.auto_fill_reviewer_avatar();


-- -------------------------------------------------------------------------------------
-- PASO 3: TRIGGER EN PROFILES PARA SINCRONIZAR CUANDO UN USUARIO ACTUALIZA SU AVATAR
-- -------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_reviewer_avatar_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando el avatar del perfil cambia y no es nulo, actualizar todas las reseñas de ese usuario
  IF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url AND NEW.avatar_url IS NOT NULL THEN
    UPDATE public.reviews
    SET reviewer_avatar = NEW.avatar_url
    WHERE LOWER(TRIM(reviewer_email)) = LOWER(TRIM(NEW.email));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger previo si existía
DROP TRIGGER IF EXISTS trg_sync_reviewer_avatar_on_profile_update ON public.profiles;

-- Crear el Trigger después de actualizar el avatar en public.profiles
CREATE TRIGGER trg_sync_reviewer_avatar_on_profile_update
AFTER UPDATE OF avatar_url
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_reviewer_avatar_on_profile_update();


-- -------------------------------------------------------------------------------------
-- PASO 4: VERIFICACIÓN
-- -------------------------------------------------------------------------------------
-- Consulta para comprobar el resultado:
SELECT 
  COUNT(*) FILTER (WHERE reviewer_avatar IS NOT NULL AND TRIM(reviewer_avatar) <> '') AS resenas_con_avatar,
  COUNT(*) FILTER (WHERE reviewer_avatar IS NULL OR TRIM(reviewer_avatar) = '') AS resenas_sin_avatar,
  COUNT(*) AS total_resenas
FROM public.reviews;
