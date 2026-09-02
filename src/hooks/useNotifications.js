// src/hooks/useNotifications.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, supabaseService } from '../services/supabaseClient';

export function useNotifications(user) {
  const [rawNotifications, setRawNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Clave única en localStorage por usuario para persistir leídos y eliminados
  const userKey = useMemo(() => {
    if (!user) return 'guest';
    return (user.email || user.id || user.name || 'guest').toLowerCase().trim();
  }, [user]);

  const readStorageKey = `musiclub_notifs_read_${userKey}`;
  const deletedStorageKey = `musiclub_notifs_deleted_${userKey}`;

  // IDs de notificaciones leídas
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`musiclub_notifs_read_${userKey}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // IDs de notificaciones eliminadas
  const [deletedIds, setDeletedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`musiclub_notifs_deleted_${userKey}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Actualizar listas de localStorage cuando cambia el usuario
  useEffect(() => {
    try {
      const savedRead = localStorage.getItem(readStorageKey);
      setReadIds(savedRead ? JSON.parse(savedRead) : []);
    } catch {
      setReadIds([]);
    }

    try {
      const savedDeleted = localStorage.getItem(deletedStorageKey);
      setDeletedIds(savedDeleted ? JSON.parse(savedDeleted) : []);
    } catch {
      setDeletedIds([]);
    }
  }, [userKey, readStorageKey, deletedStorageKey]);

  // Guardar en localStorage
  const saveReadIds = useCallback(
    (newReadIds) => {
      setReadIds(newReadIds);
      try {
        localStorage.setItem(readStorageKey, JSON.stringify(newReadIds));
      } catch (err) {
        console.warn('Error saving read notifications:', err);
      }
    },
    [readStorageKey]
  );

  const saveDeletedIds = useCallback(
    (newDeletedIds) => {
      setDeletedIds(newDeletedIds);
      try {
        localStorage.setItem(deletedStorageKey, JSON.stringify(newDeletedIds));
      } catch (err) {
        console.warn('Error saving deleted notifications:', err);
      }
    },
    [deletedStorageKey]
  );

  // Función principal para cargar y unificar todas las notificaciones
  const fetchNotifications = useCallback(async () => {
    let notifs = [];

    try {
      // 1. ÁLBUM GANADOR DEL CLUB (Notificación Global / para todos)
      try {
        const winner = await supabaseService.getCurrentWinner();
        if (winner && winner.id) {
          notifs.push({
            id: `winner_${winner.id}_${winner.updated_at || winner.created_at || 'act'}`,
            type: 'winner',
            category: 'Álbum Ganador',
            title: `🏆 ¡Nuevo Ganador de la Semana!`,
            description: `"${winner.album_name}" de ${winner.artist_name} ha sido elegido como el álbum ganador activo en el club.`,
            timestamp: new Date(winner.updated_at || winner.created_at || Date.now()).getTime(),
            dateFormatted: winner.updated_at || winner.created_at || new Date().toISOString(),
            icon: '🏆',
            image: winner.image_url || null,
            badgeColor: 'from-amber-400 to-yellow-600',
            link: '/',
            itemData: winner,
          });
        }
      } catch (wErr) {
        console.warn('Error fetching winner notification:', wErr);
      }

      // 2. Si el usuario está autenticado, cargar Buzón de Canciones y Reseñas a sus Álbumes
      if (user && (user.email || user.id || user.name)) {
        const uEmail = (user.email || '').toLowerCase().trim();
        const uName = (user.name || '').toLowerCase().trim();

        // A. BUZÓN DE CANCIONES (Recomendaciones recibidas)
        try {
          const mailboxItems = await supabaseService.getReceivedSongRecommendations(
            user.email,
            user.id
          );
          if (Array.isArray(mailboxItems)) {
            mailboxItems.forEach((item) => {
              notifs.push({
                id: `mailbox_${item.id}`,
                type: 'mailbox',
                category: 'Buzón Musical',
                title: `💌 ¡Canción recibida en tu Buzón!`,
                description: `${item.sender_name || item.sender_email || 'Un miembro'} te dedicó "${item.song_title}" de ${item.artist_name}${
                  item.message ? ` — "${item.message}"` : ''
                }`,
                timestamp: new Date(item.created_at || Date.now()).getTime(),
                dateFormatted: item.created_at || new Date().toISOString(),
                icon: '💌',
                image: item.album_cover_url || item.sender_avatar || null,
                avatar: item.sender_avatar || null,
                badgeColor: 'from-pink-500 to-rose-500',
                link: '/profile?tab=mailbox',
                itemData: item,
              });
            });
          }
        } catch (mbErr) {
          console.warn('Error fetching mailbox notifications:', mbErr);
        }

        // B. RESEÑAS A TUS ÁLBUMES PROPUESTOS
        try {
          if (user.id) {
            const { data: userAlbums, error: albErr } = await supabase
              .from('albums')
              .select('id, album_name, artist_name, image_url, user_id')
              .eq('user_id', user.id);

          if (!albErr && Array.isArray(userAlbums) && userAlbums.length > 0) {
            const userAlbumIds = userAlbums.map((a) => a.id).filter(Boolean);
            const albumsMap = new Map(userAlbums.map((a) => [a.id, a]));

            if (userAlbumIds.length > 0) {
              const { data: reviews, error: revErr } = await supabase
                .from('reviews')
                .select('*')
                .in('album_id', userAlbumIds)
                .order('created_at', { ascending: false })
                .limit(40);

              if (!revErr && Array.isArray(reviews)) {
                reviews.forEach((rev) => {
                  const revEmail = (rev.reviewer_email || '').toLowerCase().trim();
                  const revName = (rev.reviewer_name || '').toLowerCase().trim();

                  // Filtrar reseñas hechas por el mismo usuario
                  if (
                    (uEmail && revEmail === uEmail) ||
                    (uName && revName === uName)
                  ) {
                    return;
                  }

                  const targetAlbum = albumsMap.get(rev.album_id);
                  const albTitle = targetAlbum ? targetAlbum.album_name : 'tu álbum';
                  const artistTitle = targetAlbum ? ` (${targetAlbum.artist_name})` : '';
                  const scoreVal = rev.rating_general ? `★ ${rev.rating_general}/10` : '★ Evaluado';

                  notifs.push({
                    id: `review_${rev.id}`,
                    type: 'review',
                    category: 'Reseñas a tu Álbum',
                    title: `⭐ ¡Nueva reseña en "${albTitle}"!`,
                    description: `${rev.reviewer_name || 'Un miembro'} calificó ${albTitle}${artistTitle} con ${scoreVal}${
                      rev.comment ? `: "${rev.comment}"` : ''
                    }`,
                    timestamp: new Date(rev.created_at || Date.now()).getTime(),
                    dateFormatted: rev.created_at || new Date().toISOString(),
                    icon: '⭐',
                    image: targetAlbum?.image_url || null,
                    avatar: rev.reviewer_avatar || null,
                    badgeColor: 'from-amber-500 to-yellow-500',
                    link: '/reviews',
                    itemData: { review: rev, album: targetAlbum },
                  });
                });
              }
            }
          }
        }
      } catch (revQueryErr) {
        console.warn('Error fetching review notifications:', revQueryErr);
      }
    }

      // Ordenar cronológicamente descendente (más recientes primero)
      notifs.sort((a, b) => b.timestamp - a.timestamp);
      setRawNotifications(notifs);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carga inicial y recarga al cambiar usuario
  useEffect(() => {
    fetchNotifications();

    // Actualización periódica discreta (cada 45 segundos)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 45000);

    // Actualizar cuando la ventana vuelve a primer plano
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchNotifications]);

  // Filtrar notificaciones eliminadas
  const notifications = useMemo(() => {
    const deletedSet = new Set(deletedIds);
    return rawNotifications.filter((n) => !deletedSet.has(n.id));
  }, [rawNotifications, deletedIds]);

  // Notificaciones no leídas
  const unreadCount = useMemo(() => {
    const readSet = new Set(readIds);
    return notifications.filter((n) => !readSet.has(n.id)).length;
  }, [notifications, readIds]);

  // Marcar una como leída
  const markAsRead = useCallback(
    (id) => {
      if (!id) return;
      if (!readIds.includes(id)) {
        const next = [...readIds, id];
        saveReadIds(next);
      }
    },
    [readIds, saveReadIds]
  );

  // Marcar todas las activas como leídas
  const markAllAsRead = useCallback(() => {
    const allActiveIds = notifications.map((n) => n.id);
    const combined = Array.from(new Set([...readIds, ...allActiveIds]));
    saveReadIds(combined);
  }, [notifications, readIds, saveReadIds]);

  // Eliminar una notificación individual
  const deleteNotification = useCallback(
    (id) => {
      if (!id) return;
      if (!deletedIds.includes(id)) {
        const next = [...deletedIds, id];
        saveDeletedIds(next);
      }
    },
    [deletedIds, saveDeletedIds]
  );

  // Limpiar / eliminar todas las notificaciones
  const clearAllNotifications = useCallback(() => {
    const allActiveIds = notifications.map((n) => n.id);
    const combined = Array.from(new Set([...deletedIds, ...allActiveIds]));
    saveDeletedIds(combined);
  }, [notifications, deletedIds, saveDeletedIds]);

  return {
    notifications,
    unreadCount,
    loading,
    readIds,
    isRead: (id) => readIds.includes(id),
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications: fetchNotifications,
  };
}
