// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState(null);

  // Lista de emails de administradores (puedes mover esto a la BD)
  const ADMIN_EMAILS = [
    'tadeoemiliano@hotmail.com',
    // Agrega más admins aquí
  ];

  const checkIsAdmin = (email) => {
    return ADMIN_EMAILS.includes(email?.toLowerCase());
  };

  // Cargar sesión al iniciar
  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          setSession(session);
          const userData = {
            id: session.user.id,
            email: session.user.email,
            name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url,
            isRegistered: true,
            role: checkIsAdmin(session.user.email) ? 'admin' : 'user',
          };
          setUser(userData);
          setIsAdmin(userData.role === 'admin');
          localStorage.setItem(
            'maquina_musical_user',
            JSON.stringify(userData)
          );
        }
      } catch (error) {
        console.error('Error loading session:', error);
      }
      setLoading(false);
    };

    loadSession();

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
          isRegistered: true,
          role: checkIsAdmin(session.user.email) ? 'admin' : 'user',
        };
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
        localStorage.setItem('maquina_musical_user', JSON.stringify(userData));
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
  }, []);

  // Login con Google
  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      // La redirección ocurre automáticamente
      return { success: true };
    } catch (error) {
      setLoading(false);
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

  return {
    user,
    loading,
    isAdmin,
    session,
    loginWithGoogle,
    logout,
    checkIsAdmin,
    isAuthenticated: !!user,
  };
}
