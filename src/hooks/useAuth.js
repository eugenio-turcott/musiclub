// src/hooks/useAuth.js
import { useState, useEffect, useCallback, useMemo } from 'react'; // 👈 Agregar useMemo
import { supabase } from '../services/supabaseClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 👈 Usar useMemo para que no se recree en cada render
  const ADMIN_EMAILS = useMemo(
    () => ['tadeoemiliano@hotmail.com', 'eugenioturcott@gmail.com'],
    []
  );

  // 👈 checkIsAdmin ahora depende de ADMIN_EMAILS (que es estable)
  const checkIsAdmin = useCallback(
    (email) => {
      return ADMIN_EMAILS.includes(email?.toLowerCase());
    },
    [ADMIN_EMAILS]
  );

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

        if (session?.user) {
          setSession(session);

          // Buscar el perfil del usuario en la tabla profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();

          // Si no existe perfil, crear uno
          let userData;
          if (!profile) {
            // Crear perfil automáticamente
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  name:
                    session.user.user_metadata?.full_name ||
                    session.user.user_metadata?.name ||
                    session.user.email?.split('@')[0],
                  avatar_url:
                    session.user.user_metadata?.avatar_url ||
                    session.user.user_metadata?.picture,
                  role: 'user',
                },
              ])
              .select()
              .single();

            if (createError) {
              console.error('Error creating profile:', createError);
              // Fallback: usar datos del usuario sin perfil
              userData = {
                id: session.user.id,
                email: session.user.email,
                name:
                  session.user.user_metadata?.full_name ||
                  session.user.email?.split('@')[0],
                avatar: session.user.user_metadata?.avatar_url,
                role: 'user',
                isRegistered: true,
              };
            } else {
              userData = {
                id: newProfile.id,
                email: newProfile.email,
                name: newProfile.name,
                avatar: newProfile.avatar_url,
                role: newProfile.role || 'user',
                isRegistered: true,
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

          // Verificar si es admin (por email o por rol en BD)
          const isAdminUser =
            userData.role === 'admin' || checkIsAdmin(userData.email);

          userData.role = isAdminUser ? 'admin' : userData.role;

          setUser(userData);
          setIsAdmin(isAdminUser);
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

    // Escuchar cambios en autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsRedirecting(false);
        setSession(session);

        // Recargar perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        let userData;
        if (profile) {
          userData = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar_url,
            role: profile.role || 'user',
            isRegistered: true,
          };
        } else {
          userData = {
            id: session.user.id,
            email: session.user.email,
            name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url,
            role: 'user',
            isRegistered: true,
          };
        }

        const isAdminUser =
          userData.role === 'admin' || checkIsAdmin(userData.email);

        userData.role = isAdminUser ? 'admin' : userData.role;

        setUser(userData);
        setIsAdmin(isAdminUser);
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
  }, [checkIsAdmin]);

  const loginWithGoogle = useCallback(async () => {
    try {
      setIsRedirecting(true);
      setLoading(true);

      // 👇 DETECTAR SI ESTÁS EN PRODUCCIÓN O DESARROLLO
      const redirectTo = window.location.origin; // Esto automáticamente usa localhost o vercel.app

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo, // 👈 USA window.location.origin
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
    isRedirecting,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
    checkIsAdmin,
  };
}
