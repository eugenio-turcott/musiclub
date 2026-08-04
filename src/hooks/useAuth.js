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
              role: result.data.role || 'user',
              isRegistered: true,
            };
          } else {
            console.warn('No se pudo crear perfil, usando datos de sesión:', result.error);
            userData = {
              id: session.user.id,
              email: session.user.email,
              name: newUserData.name,
              avatar: newUserData.avatar_url,
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

  return {
    user,
    loading,
    isAdmin,
    session,
    isRedirecting,
    loginWithGoogle,
    loginWithEmail,
    logout,
    isAuthenticated: !!user,
    checkIsAdmin,
  };
}