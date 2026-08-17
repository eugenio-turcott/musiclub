// src/hooks/useAuth.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 👈 REF para evitar dependencia en useEffect
  const handleUserSessionRef = useRef(null);

  // ADMIN_EMAILS - usa useMemo para estabilidad
  const ADMIN_EMAILS = useMemo(
    () => ['tadeoemiliano@hotmail.com', 'eugenioturcott@gmail.com'],
    []
  );

  // checkIsAdmin
  const checkIsAdmin = useCallback(
    (email) => {
      return ADMIN_EMAILS.includes(email?.toLowerCase());
    },
    [ADMIN_EMAILS]
  );

  // Crear o actualizar perfil con upsert
  const upsertProfile = useCallback(async (userData) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          [{
            id: userData.id,
            email: userData.email,
            name: userData.name,
            avatar_url: userData.avatar_url,
            role: userData.role || 'user',
            bio: userData.bio || null,
            favorite_artist: userData.favorite_artist || null,
            favorite_album: userData.favorite_album || null,
            favorite_genres: userData.favorite_genres || [],
            spotify_url: userData.spotify_url || null,
            instagram_url: userData.instagram_url || null,
            updated_at: new Date().toISOString(),
          }],
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        console.error('Error en upsertProfile:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Excepción en upsertProfile:', error);
      return { success: false, error };
    }
  }, []);

  // Función para manejar la sesión del usuario
  const handleUserSession = useCallback(
    async (session) => {
      try {
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        let userData;

        if (profileError || !profile) {
          const newUserData = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'Usuario',
            avatar_url: session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              null,
            role: 'user',
          };

          const result = await upsertProfile(newUserData);

          if (result.success && result.data) {
            userData = {
              id: result.data.id,
              email: result.data.email,
              name: result.data.name,
              avatar: result.data.avatar_url,
              avatar_url: result.data.avatar_url,
              role: result.data.role || 'user',
              bio: result.data.bio || session.user.user_metadata?.bio || '',
              favorite_artist: result.data.favorite_artist || session.user.user_metadata?.favorite_artist || '',
              favorite_album: result.data.favorite_album || session.user.user_metadata?.favorite_album || '',
              favorite_genres: result.data.favorite_genres || session.user.user_metadata?.favorite_genres || [],
              spotify_url: result.data.spotify_url || session.user.user_metadata?.spotify_url || '',
              instagram_url: result.data.instagram_url || session.user.user_metadata?.instagram_url || '',
              created_at: session.user.created_at || result.data.created_at,
              isRegistered: true,
            };
          } else {
            console.warn('No se pudo crear perfil, usando datos de sesión:', result.error);
            userData = {
              id: session.user.id,
              email: session.user.email,
              name: newUserData.name,
              avatar: newUserData.avatar_url,
              avatar_url: newUserData.avatar_url,
              role: 'user',
              bio: session.user.user_metadata?.bio || '',
              favorite_artist: session.user.user_metadata?.favorite_artist || '',
              favorite_album: session.user.user_metadata?.favorite_album || '',
              favorite_genres: session.user.user_metadata?.favorite_genres || [],
              spotify_url: session.user.user_metadata?.spotify_url || '',
              instagram_url: session.user.user_metadata?.instagram_url || '',
              created_at: session.user.created_at,
              isRegistered: false,
            };
          }
        } else {
          userData = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar_url,
            avatar_url: profile.avatar_url,
            role: profile.role || 'user',
            bio: profile.bio || session.user.user_metadata?.bio || '',
            favorite_artist: profile.favorite_artist || session.user.user_metadata?.favorite_artist || '',
            favorite_album: profile.favorite_album || session.user.user_metadata?.favorite_album || '',
            favorite_genres: profile.favorite_genres || session.user.user_metadata?.favorite_genres || [],
            spotify_url: profile.spotify_url || session.user.user_metadata?.spotify_url || '',
            instagram_url: profile.instagram_url || session.user.user_metadata?.instagram_url || '',
            created_at: profile.created_at || session.user.created_at,
            isRegistered: true,
          };
        }

        const isAdminUser = userData.role === 'admin' || checkIsAdmin(userData.email);
        userData.role = isAdminUser ? 'admin' : userData.role;

        setUser(userData);
        setIsAdmin(isAdminUser);
        localStorage.setItem('maquina_musical_user', JSON.stringify(userData));

        return { success: true, user: userData };
      } catch (error) {
        console.error('Error en handleUserSession:', error);
        return { success: false, error };
      }
    },
    [upsertProfile, checkIsAdmin]
  );

  // 👈 GUARDAR handleUserSession en el ref
  handleUserSessionRef.current = handleUserSession;

  // Cargar sesión al iniciar - SIN dependencias problemáticas
  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          setSession(session);
          // 👈 Usar el ref en lugar de la función directa
          await handleUserSessionRef.current(session);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      }
      setLoading(false);
    };

    loadSession();

    // Escuchar cambios en autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsRedirecting(false);
        setSession(session);
        // 👈 Usar el ref en lugar de la función directa
        await handleUserSessionRef.current(session);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        localStorage.removeItem('maquina_musical_user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // 👈 Array vacío - sin dependencias

  // Login con Google
  const loginWithGoogle = useCallback(async () => {
    try {
      setIsRedirecting(true);
      setLoading(true);

      const isProduction = window.location.hostname !== 'localhost';
      const redirectTo = isProduction
        ? 'https://musiclub-albums.vercel.app'
        : window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setIsRedirecting(false);
        setLoading(false);
        throw error;
      }

      return { success: true, redirecting: true };
    } catch (error) {
      setLoading(false);
      setIsRedirecting(false);
      return { success: false, error: error.message };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setIsAdmin(false);
      setSession(null);
      localStorage.removeItem('maquina_musical_user');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login con email (legacy)
  const loginWithEmail = useCallback(async (email, name) => {
    try {
      setLoading(true);

      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      let userData;

      if (profileError || !profile) {
        const newUserData = {
          id: crypto.randomUUID(),
          email: email,
          name: name || email.split('@')[0],
          avatar_url: null,
          role: 'user',
        };

        const result = await upsertProfile(newUserData);

        if (result.success && result.data) {
          userData = {
            id: result.data.id,
            email: result.data.email,
            name: result.data.name,
            avatar: result.data.avatar_url,
            role: result.data.role || 'user',
            isRegistered: true,
          };
        } else {
          userData = {
            id: crypto.randomUUID(),
            email: email,
            name: name || email.split('@')[0],
            avatar: null,
            role: 'user',
            isRegistered: false,
          };
        }
      } else {
        userData = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar_url,
          role: profile.role || 'user',
          isRegistered: true,
        };
      }

      const isAdminUser = userData.role === 'admin' || checkIsAdmin(userData.email);
      userData.role = isAdminUser ? 'admin' : userData.role;

      setUser(userData);
      setIsAdmin(isAdminUser);
      localStorage.setItem('maquina_musical_user', JSON.stringify(userData));
      setLoading(false);

      return { success: true, user: userData };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  }, [upsertProfile, checkIsAdmin]);

  // Actualizar perfil del usuario
  const updateProfile = useCallback(
    async (profileData) => {
      if (!user) return { success: false, error: 'No hay usuario autenticado' };
      try {
        setLoading(true);

        const avatarVal =
          profileData.avatar_url !== undefined
            ? profileData.avatar_url
            : profileData.avatar !== undefined
            ? profileData.avatar
            : user.avatar || user.avatar_url;

        const updatedFields = {
          name: profileData.name !== undefined ? profileData.name : user.name,
          avatar_url: avatarVal || null,
          bio: profileData.bio !== undefined ? profileData.bio : user.bio || null,
          favorite_artist:
            profileData.favorite_artist !== undefined
              ? profileData.favorite_artist
              : user.favorite_artist || null,
          favorite_album:
            profileData.favorite_album !== undefined
              ? profileData.favorite_album
              : user.favorite_album || null,
          favorite_genres:
            profileData.favorite_genres !== undefined
              ? profileData.favorite_genres
              : user.favorite_genres || [],
          spotify_url:
            profileData.spotify_url !== undefined
              ? profileData.spotify_url
              : user.spotify_url || null,
          instagram_url:
            profileData.instagram_url !== undefined
              ? profileData.instagram_url
              : user.instagram_url || null,
          updated_at: new Date().toISOString(),
        };

        // 1. Actualizar metadata en auth de Supabase (opcional para mantener sincronía)
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: updatedFields.name,
              name: updatedFields.name,
              avatar_url: updatedFields.avatar_url,
              bio: updatedFields.bio,
              favorite_artist: updatedFields.favorite_artist,
              favorite_album: updatedFields.favorite_album,
              favorite_genres: updatedFields.favorite_genres,
              spotify_url: updatedFields.spotify_url,
              instagram_url: updatedFields.instagram_url,
            },
          });
        } catch (authErr) {
          console.warn('Advertencia en supabase.auth.updateUser:', authErr);
        }

        // 2. Actualizar en tabla profiles de Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .update(updatedFields)
          .eq('id', user.id);

        if (profileError) {
          console.error('Error al actualizar en profiles:', profileError);
          // Si falló por falta de columnas en la BD, intentamos un fallback básico
          const { error: basicError } = await supabase
            .from('profiles')
            .update({
              name: updatedFields.name,
              avatar_url: updatedFields.avatar_url,
              updated_at: updatedFields.updated_at,
            })
            .eq('id', user.id);
          if (basicError) throw profileError;
        }

        // 3. Si cambió el nombre, sincronizar en la tabla reviews
        if (profileData.name && profileData.name !== user.name && user.email) {
          try {
            await supabase
              .from('reviews')
              .update({ reviewer_name: profileData.name })
              .eq('reviewer_email', user.email);
          } catch (rErr) {
            console.warn('No se pudo sincronizar reviewer_name en reviews:', rErr);
          }
        }

        const updatedUser = {
          ...user,
          ...updatedFields,
          avatar: updatedFields.avatar_url,
        };

        setUser(updatedUser);
        localStorage.setItem('maquina_musical_user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } catch (error) {
        console.error('Error en updateProfile:', error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    user,
    loading,
    isAdmin,
    session,
    isRedirecting,
    loginWithGoogle,
    loginWithEmail,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    checkIsAdmin,
  };
}